import {HttpException} from '../utils/exceptions/httpException';
import pool from "../config/db";
import { Twilio } from 'twilio';
import nodemailer from 'nodemailer';
export class VerificationService
{
  async sendCode(identifier:string,type:string)
  {
    console.log("Request to send code to ",identifier," of type ",type," to send otp is recieved");
    if(!identifier)
    {
      throw new HttpException(400,"Identifier is required");
    }
    const otp=Math.floor(100000+Math.random()*900000).toString();
    const expiry=new Date(Date.now()+5*60*1000);
    console.log("Generated OTP is ",otp," Expiry is ",expiry);
    console.log("Storing OTP in database");
    await pool.query(`INSERT INTO verifications (identifier,type,code,expires_at) VALUES ($1,$2,$3,$4)`,[identifier,type,otp,expiry]);
    console.log("OTP stored in database");
    if (type === "mobile_number") {
      const twilioClient = new Twilio(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_AUTH_TOKEN!
      );

      await twilioClient.messages.create({
        body: `Your OTP code is ${otp}. It will expire in 5 minutes. Do not share it with anyone.`,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: `+91${identifier}` // assuming Indian numbers
      });

      console.log("OTP sent via Twilio SMS to", identifier);
    }

    if(type==="email")
    {
      const transporter=nodemailer.createTransport
      ({
        service:'gmail',
        auth:
        {
          user:process.env.USER_EMAIL,
          pass:process.env.USER_PASS
        }
      });
      await transporter.sendMail
      ({
        from:process.env.EMAIL_USER,
        to:identifier,
        subject:"Your OTP Code to verify your account for signup",
        text:`Your OTP code is ${otp}. It will expire in 5 minutes. Do not share it with anyone.`
      });
      console.log("OTP sent via Email to ",identifier);
    }

  }
  async verifyCode(identifier:string,type:string,code:string)
  {
    console.log("Request to verify code for ",identifier," of type ",type," to verify otp is recieved",code);
    await pool.query(`DELETE FROM verifications WHERE expires_at < NOW()`);
    await pool.query(`DELETE FROM verifications WHERE identifier=$1 AND expires_at < NOW()`,[identifier]);
    console.log("Deleted expired codes and previous codes for ",identifier);
    const result=await pool.query(`SELECT id FROM verifications WHERE identifier=$1 AND code=$2 AND expires_at > NOW()`,[identifier,code]);
    if(result.rows.length===0)
    {
      throw new HttpException(400,"Invalid or expired code");
    }
    console.log("Code is valid, inserting identifier into users table")
    await pool.query(`INSERT INTO users (${type}) VALUES ($1)`,[identifier])
    const user=await pool.query(`SELECT id FROM users WHERE ${type}=$1`,[identifier]);
    const user_id=user.rows[0]?.id;
    const otp_id=result.rows[0].id;
    
    console.log("Verification record found with id ",user_id);
    console.log("Code verified for ",identifier);
    const vcolumn=type==="mobile_number"?"is_mobile_verified":"is_email_verified";
    await pool.query(`UPDATE users SET ${vcolumn}=TRUE WHERE id=$1`,[user_id]);
    console.log("User's ",vcolumn," set to TRUE for user id ",user_id);
    await pool.query(`DELETE FROM verifications WHERE id=$1`,[otp_id])
    await pool.query(`DELETE FROM verifications WHERE identifier=$1`,[identifier]);
    console.log("Deleted verification record with id ",otp_id);
    return {message:"Code verified successfully"};
  }

}

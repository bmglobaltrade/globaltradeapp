import { HttpException } from "../utils/exceptions/httpException";
import pool from "../config/db";
import jwt from "jsonwebtoken";
import { VerificationService } from "./otpService";
import bcrypt from 'bcrypt';

const vService=new VerificationService();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsupersecret";
export class authService
{
    async initiateSignup(identifier:string)
    {
        console.log("Initiating signup for ",identifier)
        const isMobile=/^[0-9]{10}$/.test(identifier);     // Assuming a 10-digit mobile number
        const isEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier); //
        const type=isMobile?"mobile_number":"email";
        console.log("Identifier is ",identifier," Type is ",type);
        if(!isMobile && !isEmail)
        {  throw new HttpException(400,"Invalid Email or Password") }
        console.log("Checking existing user")
        const existing=await pool.query(`SELECT id FROM users WHERE ${type}=$1`,[identifier]);
        if(existing.rows.length>0)
        {
            throw new HttpException(409,"User already exists");
        }
        console.log("No existing user found, sending OTP");
        return await vService.sendCode(identifier,type);
    }
    async verifySignup(identifier:string,code:string)
    {
        console.log("Verifying The code for ",identifier)
        const isMobile=/^[0-9]{10}$/.test(identifier);
        const isEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        const type=isMobile?"mobile_number":"email";
        console.log("Identifier is ",identifier," Type is ",type);
        if(!isMobile && !isEmail)
        {  throw new HttpException(400,"Invalid Email or Password") }
        return await vService.verifyCode(identifier,type,code);
    }
    async completeSignup(identifier:string,password:string)
    {
        console.log("Completing signup for ",identifier)
        const isMobile=/^[0-9]{10}$/.test(identifier);
        const isEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        const type=isMobile?"mobile_number":"email";
        const vcolumn=isMobile?"is_mobile_verified":"is_email_verified";
        console.log("Identifier is ",identifier," Type is ",type);
        if(!isMobile && !isEmail)
        {  throw new HttpException(400,"Invalid Email or Password") }
        const user=await pool.query(`SELECT id FROM users WHERE ${type}=$1 AND ${vcolumn}=TRUE`,[identifier]);
        const user_id=user.rows[0]?.id;
        if(user.rows.length===0)
        {
            throw new HttpException(404,"Verification pending or user not found");
        }
        const hashedPassword=await bcrypt.hash(password,10);
        await pool.query(`INSERT INTO auth_credentials (password_hash, user_id) VALUES ($1, $2)`,[hashedPassword,user_id]);
        console.log("Signup completed for ",identifier)
        return {message:"Signup completed successfully"};
    }
    async login(identifier: string, password: string) {
        const isMobile = /^[0-9]{10}$/.test(identifier);
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        const type = isMobile ? "mobile_number" : "email";

        if (!isMobile && !isEmail) {  
            throw new HttpException(400, "Invalid type of credentials");
        }

        const user = await pool.query(
            `SELECT u.id, ac.password_hash 
             FROM users u 
             JOIN auth_credentials ac ON ac.user_id = u.id 
             WHERE u.${type}=$1`,
            [identifier]
        );

        if (user.rows.length === 0) {
            throw new HttpException(404, "User not found");
        }

        const { id, password_hash } = user.rows[0];

        const validPassword = await bcrypt.compare(password, password_hash);
        if (!validPassword) {
            throw new HttpException(401, "Invalid credentials");
        }

        const accessToken = jwt.sign(
            { id, identifier },
            JWT_SECRET,
            { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
            { id, identifier },
            REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        await pool.query(
            `INSERT INTO auth_sessions (user_id, refresh_token, created_at, expires_at) 
             VALUES ($1, $2, NOW(), NOW() + interval '7 days')`,
            [id, refreshToken]
        );

        return {
            message: "Login successful",
            accessToken,
            refreshToken
        };
    }
    async refreshToken(refreshToken: string) {
    try {
        console.log("Refreshing token")
        const decoded: any = jwt.verify(refreshToken, REFRESH_SECRET);
        console.log("Decoded the refresh token",decoded)
        const session = await pool.query(
            `SELECT * FROM auth_sessions 
             WHERE refresh_token = $1 AND expires_at > NOW()`,
            [refreshToken]
        );
       console.log("checked for stored token")
        if (session.rows.length === 0) {
            throw new HttpException(401, "Invalid or expired refresh token");
        }

        const userId = decoded.id;
        console.log("User_id",userId)
        console.log("Creating New access Token")
        const newAccessToken = jwt.sign(
            { id: userId, identifier: decoded.identifier },
            JWT_SECRET,
            { expiresIn: "15m" }
        );
        console.log("Created new access token")

        return { accessToken: newAccessToken };
    } catch (err) {
        throw new HttpException(401, "Invalid refresh token");
    }
}

   
}

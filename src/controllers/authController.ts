import { HttpException } from "../utils/exceptions/httpException";
import {Request,Response,NextFunction} from 'express';
import { authService } from "../services/authService";
import { successResponse } from "../utils/apiResponse";
import { VerificationService } from "../services/otpService";
import pool from '../config/db';
export class AuthController
{
    private authService:authService;
    private verService:VerificationService;
    constructor()
    {
        this.authService=new authService();
        this.verService=new VerificationService();
    }
    async signup(req:Request,res:Response,next:NextFunction)
    {
        try
        {
        console.log("Entered signup controller");
        const {identifier}=req.body;
        console.log("Signup request received for identifier: ",identifier)
        const result=await this.authService.initiateSignup(identifier);
        res.status(200).json(successResponse({result,message:"OTP sent successfully"}))
        }
        catch(err)
        {
            next(err)
        }


    }
    async verify(req:Request,res:Response,next:NextFunction)
    { 
        try
        {
         const {identifier,code}=req.body;
         const result=await this.authService.verifySignup(identifier,code);
         res.status(200).json(successResponse({result,message:"OTP verified successfully"}))
        }
        catch(err)
        {
            next(err)
        }

    }
    async confirm(req:Request,res:Response,next:NextFunction)
    {
        try
        {
           const{identifier,password}=req.body;
           const result=await this.authService.completeSignup(identifier,password);
           res.status(200).json(successResponse({result,message:"Signup completed successfully"}))
        }
        catch(err)
        {
            next(err)
        }
    }

    async resend(req:Request,res:Response,next:NextFunction)
    {
        const{identifier}=req.body; 
        const isMobile=/^[0-9]{10}$/.test(identifier);
        const isEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        const type=isMobile?"mobile_number":"email";
        console.log("Identifier is ",identifier," Type is ",type);
        await pool.query(`DELETE FROM verifications WHERE expires_at < NOW()`);
        await pool.query(`DELETE FROM verifications WHERE identifier=$1`,[identifier]);
        await this.verService.sendCode(identifier,type);
        return res.status(200).json(successResponse(200,"Otp Resent Successfully"))
    }
    async Login(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier, password } = req.body;
            const user = await this.authService.login(identifier, password);
            res.status(200).json(successResponse(user,"Login SuccessFull"));
        } catch (err: any) {
            next(err instanceof HttpException ? err : new HttpException(500, err.message));
        }
    }
    async RefreshToken(req: Request, res: Response, next: NextFunction)
    {
        try {
            const { refreshToken } = req.body;
            const tokenData = await this.authService.refreshToken(refreshToken);
            res.json(successResponse(tokenData));
        } catch (err) {
            next(err);
        }

    }
}
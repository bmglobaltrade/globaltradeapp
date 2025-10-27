import Router from 'express';
import { AuthController } from '../controllers/authController';

const router=Router();
const auth=new AuthController()
router.post('/signup',(req,res,next)=>auth.signup(req,res,next))
router.post('/refresh-token',(req,res,next)=>auth.RefreshToken(req,res,next))
router.post("/login", (req, res, next) => auth.Login(req, res, next))
router.post('/verify',(req,res,next)=>auth.verify(req,res,next))
router.post('/confirm',(req,res,next)=>auth.confirm(req,res,next))
router.post('/resend-otp',(req,res,next)=>auth.resend(req,res,next))
export default router;

// authRouter.ts
import express from 'express';
import * as authController from '../../controllers/auth.controller' 
import  verifyToken  from '../../middleware/verifyToken';
import multer from 'multer';

// Set up storage
const storage = multer.memoryStorage();

// Initialize multer with options
const upload = multer({ storage: storage });

const authRouter = express.Router();

//GET
authRouter.get('/userExists', authController.userExists);
authRouter.get('/test', verifyToken, authController.testingService);

//POST
authRouter.post('/signup', authController.signup);
authRouter.post('/signin', authController.signin);
authRouter.post('/signout', authController.signout);
authRouter.post('/callback/github', authController.signupWithGithub);
authRouter.post('/google', authController.signupWithGoogle);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/verify-otp', authController.verifyOtp);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.post('/account', authController.profileAccount);
authRouter.post('/change-password', authController.isAllowedChangePassword);
authRouter.post('/new-password', authController.newPassword);
authRouter.post('/upload-profile', upload.single('file'), authController.profileUpload);

export default authRouter;

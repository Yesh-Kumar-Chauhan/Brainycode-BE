// authController.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import CustomError from '../errors/customError';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import { UserService } from '../services/users.service';

const authService = new AuthService();
const userService = new UserService();

export const signup = async (req: Request, res: Response): Promise<void> => {
    const { encryptedData } = req.body;
    const secretKey = process.env.SECRET_KEY || ''; // Ensure you have SECRET_KEY set in your env

    try {
        if (!secretKey) {
            res.status(500).send('Server misconfiguration');
        }

        const body = AES.decrypt(encryptedData, secretKey).toString(Utf8);
        const decryptedData = JSON.parse(body);

        // Call the signup function from AuthService
        const user = await authService.signup(decryptedData);
        res.status(200).json({ message: 'Signup successful', user });
    } catch (error) {
        console.error('Error during signup:', error);
        if (error instanceof CustomError) {
            // Handle specific custom error
            res.status(error.statusCode).json({ message: error.message });
        } else {
            // Handle generic error
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};


export const signupWithGithub = async (req: Request, res: Response): Promise<void> => {
    try {
        // Call the signup function from AuthService
        const { code } = req.body;
        const user = await authService.signupWithGitHub(code);
        res.status(200).json({ message: 'Signin successful', user });
    } catch (error) {
        console.error('Error during signup:', error);
        if (error instanceof CustomError) {
            // Handle specific custom error
            res.status(error.statusCode).json({ message: error.message });
        } else {
            // Handle generic error
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const signupWithGoogle = async (req: Request, res: Response): Promise<void> => {
    try {
        // Call the signup function from AuthService
        const user = await authService.signupWithGoogle(req.body);
        res.status(200).json({ message: 'Signin successful', user });
    } catch (error) {
        console.error('Error during signup:', error);
        if (error instanceof CustomError) {
            // Handle specific custom error
            res.status(error.statusCode).json({ message: error.message });
        } else {
            // Handle generic error
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const signin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        // Call the signin function from AuthService
        const data = await authService.signin(email, password);

        if (data) {
            res.status(200).json({ message: 'Signin successful', ...data });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error during signin:', error);
        if (error instanceof CustomError) {
            // Handle specific custom error
            res.status(error.statusCode).json({ message: error.message });
        } else {
            // Handle generic error
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const signout = async (req: Request, res: Response): Promise<void> => {
    try {
        // Assuming you have user information in req.user after authentication
        const userId = req.body.id;
        // Call the signout function from AuthService
        await authService.signout(userId);
        res.status(200).json({ message: 'Signout successful' });
    } catch (error) {
        console.error('Error during signout:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


export const userExists = async (req: Request, res: Response): Promise<void> => {
    try {
        const email = req.query.email;

        // Check if email is a string
        if (typeof email !== 'string' || !email) {
            res.status(400).json({ message: 'Invalid or missing email' });
            return;
        }
        // Call the signin function from AuthService
        const data = await authService.isUserExists(email);

        res.status(200).json({ message: 'User check', data });

    } catch (error) {
        console.error('Error during user checking:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {

        // Call the signin function from AuthService
        const data = await authService.forgotPassword(req.body);

        res.status(200).json({ message: 'Success', data });

    } catch (error) {
        console.error('Error during user checking:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;

        // Call the signin function from AuthService
        const verified = await authService.verifyOtp(req.body, userId);

        res.status(200).json({ message: 'Success', verified });

    } catch (error) {
        console.error('Error during user checking:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;

        // Call the signin function from AuthService
        const success = await authService.resetPassword(req.body, userId);

        res.status(200).json({ message: 'Success', success });

    } catch (error) {
        console.error('Error during user checking:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const testingService = async (req: Request, res: Response): Promise<void> => {
    try {
        res.status(201).json({ message: 'test successful' });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const profileAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;
        const updatedData = req.body;

        // Call the profileAccount function from AuthService
        const user = await authService.profileAccount(userId, updatedData);
        res.status(200).json({ message: 'Save changes successful', user });
    } catch (error) {
        console.error('Error during changes:', error);
        if (error instanceof CustomError) {
            // Handle specific custom error
            res.status(error.statusCode).json({ message: error.message });
        } else {
            // Handle generic error
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};



export const isAllowedChangePassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;

        const success = await authService.isAllowedChangePassword(req.body, userId);

        res.status(200).json({ message: 'Success', success });

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error during user checking:', error);
            res.status(500).json({ statusCode: 500, message: error.message });
        }
        else {
            console.error('Error during user checking:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};


export const newPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;

        const success = await authService.newPassword(req.body, userId);

        res.status(200).json({ message: 'Success', success });

    } catch (error) {
        if (error instanceof Error) {
        console.error('Failed to set new Password:', error);
        res.status(500).json({ statusCode: 500, message: error.message });
    }else {
        console.error('Failed to set new Password:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
}


export const profileUpload = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;

        let file: Express.Multer.File | undefined = undefined;
        // Check if there is a file and set it
        if (req.file) {
            file = req.file;
        }
        const profile = await userService.profileUpload(userId, req.body);

        res.status(200).json({ message: 'Success', profile });

    } catch (error) {
        console.error('Failed to set new Password:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};




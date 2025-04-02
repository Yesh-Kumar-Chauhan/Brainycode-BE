
import { Request, Response } from 'express';
import CustomError from '../errors/customError';
import { UserService } from '../services/users.service';
import { SubscriptionService } from '../services/stripe/subscription.service';

const userService = new UserService();
const subscriptionService = new SubscriptionService();

export const userCredits = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;
        const userCredit = await userService.userCredit(userId);
        res.status(200).json({ message: 'Success', userCredit });
    }
    catch (error) {
        console.error('[userCredits] Error during getting user credit:', error);
        // Handle specific custom error
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const creditPlans = async (req: Request, res: Response): Promise<void> => {
    try {
        const plans = await subscriptionService.creditPlans();
        res.status(200).json({ message: 'Success', plans });
    }
    catch (error) {
        console.error('[userCredits] Error during getting user credit:', error);
        // Handle specific custom error
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
    
};

export const getSubscriptions = async (req: Request, res: Response): Promise<void> => {
    try {
        const subscriptions = await subscriptionService.getSubscriptions();
        res.status(200).json({ message: 'Success', subscriptions });
    }
    catch (error) {
        console.error('[getSubscriptions] Error during getting subscriptions:', error);
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const getCustomSubscriptions = async (req: Request, res: Response): Promise<void> => {
    try {
        const subscriptions = await subscriptionService.getCustomSubscriptions();
        res.status(200).json({ message: 'Success', subscriptions });
    }
    catch (error) {
        console.error('[getCustomSubscriptions] Error during getting subscriptions:', error);
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const checkoutSession  = async (req: Request, res: Response): Promise<void> => {
    try {
        // const userId = req.query.userId as string;
        const session = await subscriptionService.checkoutSession(req.body);
        res.status(200).json({ message: 'Success', session });
    }
    catch (error) {
        console.error('[userCredits] Error during getting user credit:', error);
        // Handle specific custom error
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

export const createOrderAndCheckout  = async (req: Request, res: Response): Promise<void> => {
    try {
        // const userId = req.query.userId as string;
        const session = await subscriptionService.createOrderAndCheckout(req.body);
        res.status(200).json({ message: 'Success', session });
    }
    catch (error) {
        console.error('[userCredits] Error during getting user credit:', error);
        // Handle specific custom error
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

export const reviewPrompt = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;
        let file: Express.Multer.File | undefined = undefined;
        // Check if there is a file and set it
        if (req.file) {
            file = req.file;
        }
        // req.body contains other form fields, make sure to parse JSON stringified fields if any
        let body ;
        if (req.body.reviewPlan) {
            body = JSON.parse(req.body.reviewPlan);
        }
        const reviewPrompt = await subscriptionService.reviewPrompt(body, userId, file);
        res.status(200).json({ message: 'Success', reviewPrompt });
    }
    catch (error) {
        console.error('[reviewPrompt] Error during getting user credit:', error);
        // Handle specific custom error
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

export const boardSpecification = async (req: Request, res: Response): Promise<void> => {
    try {
        const boardSpecification = await subscriptionService.boardSpecification();
        res.status(200).json({ message: 'Success', boardSpecification });
    }
    catch (error) {
        console.error('[boardSpecification] Error during getting board specification :', error);
        // Handle specific custom error
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

export const billingAddress = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;
        const billingAddress = await subscriptionService.billingAddress(req.body, userId);
        res.status(200).json({ message: 'Success', billingAddress });
    }
    catch (error) {
        console.error('[billingAddress] Error during saving billing Address :', error);
        // Handle specific custom error
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

export const userBillingAddress = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;
        const userBillingAddress = await subscriptionService.getbillingAddress(userId);
        res.status(200).json({ message: 'Success', userBillingAddress });
    }
    catch (error) {
        console.error('[userBillingAddress] Error while fetching user billing Address :', error);
        // Handle specific custom error
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

export const getLastOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;
        const lastOrder = await subscriptionService.getLastOrder(userId);
        res.status(200).json({ message: 'Success', lastOrder });
    }
    catch (error) {
        console.error('[getLastOrder] Error while fetching user billing Address :', error);
        // Handle specific custom error
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}


export const orders = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;
        const orders = await subscriptionService.getOrders(userId);
        res.status(200).json({ message: 'Success', orders });
    } catch (error) {
        console.error('[getOrders] Error during fetching Orders:', error);
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};



    
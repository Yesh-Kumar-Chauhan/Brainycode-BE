//codeRouter.ts
import express from 'express';
import * as subscriptionController from '../../controllers/subscription.controller'
import { validate } from '../../middleware/validateRequest'
import { handleStripeWebhook } from '../../services/stripe/stripe-webhooks'
import { querySchema } from '../../utils/schemas/auth-schema';
import { billingAdressSchema } from '../../utils/schemas/subscription-schema';
import multer from 'multer';

// Set up storage
const storage = multer.memoryStorage();

// Initialize multer with options
const upload = multer({ storage: storage });
const subscriptionRouter = express.Router();

//GET
subscriptionRouter.get('/', subscriptionController.getSubscriptions);
subscriptionRouter.get('/custom-board-subscription', subscriptionController.getCustomSubscriptions);
subscriptionRouter.get('/credit', validate({ query: querySchema }), subscriptionController.userCredits);
subscriptionRouter.get('/credit-plans', subscriptionController.creditPlans);
subscriptionRouter.get('/orders', subscriptionController.orders);
subscriptionRouter.get('/board-specifications',  subscriptionController.boardSpecification);
subscriptionRouter.get('/user-billing-address',validate({query: querySchema }), subscriptionController.userBillingAddress);
subscriptionRouter.get('/last-order',validate({query: querySchema }), subscriptionController.getLastOrder);


//POST
//stripe
subscriptionRouter.post('/webhook', handleStripeWebhook);
subscriptionRouter.post('/create-checkout-session', subscriptionController.checkoutSession);
subscriptionRouter.post('/create-order-and-checkout', subscriptionController.createOrderAndCheckout);
subscriptionRouter.post('/review', upload.single('file'), subscriptionController.reviewPrompt);
//
subscriptionRouter.post('/billing-address', validate({body: billingAdressSchema, query: querySchema }), subscriptionController.billingAddress);

export default subscriptionRouter;
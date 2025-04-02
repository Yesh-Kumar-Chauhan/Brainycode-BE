import Stripe from 'stripe';
import CustomError from "../../errors/customError";
import Subscriptions from '../../models/subscriptions.model';
import { EnumCheckoutType, EnumSubscriptionCreditType, EnumSubscriptionType, IBillingAddress, IOrders, IReviewsPrompt, ISubscription } from '../../interfaces/subscriptions.interface';
import UsersCredits from '../../models/usersCredit.model';
import dotenv from 'dotenv';
import Orders from '../../models/orders.model';
import EmailHelper from '../../helpers/email-helper';
import Users from '../../models/users.model';
import BoardSpecifications from '../../models/board-specification.model';
import { EnumReviewStatus, IBoardSpecifications, ICredits } from '../../interfaces/codeInterface.interface';
import BillingAddress from '../../models/billing-address.model';
import { Model, Transaction, where } from 'sequelize';
import JSZip from 'jszip';
import { AwsService } from '../aws.service';
import Credits from '../../models/credits.model';
import PromptReviews from '../../models/promptsReviews.model';
import { sequelize } from '../../config/database';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});

export class SubscriptionService {

    private awsService: AwsService;
    constructor() {
        this.awsService = new AwsService();
    }

    public async creditPlans(): Promise<ICredits[]> {
        try {
            const credits = await Credits.findAll();
            if (!credits) {
                throw new CustomError(500, 'User not found');
            }
            return credits;
        } catch (error) {
            console.error('[userCredit] Failed to generate code', error);
            throw new CustomError(500, 'Failed to generate code');
        }
    }

    public async getSubscriptions(): Promise<ISubscription[]> {
        try {
            const subscriptions = await Subscriptions.findAll({ where: { subscriptionType: EnumSubscriptionType.Review } });

            if (!subscriptions || subscriptions.length === 0) {
                throw new CustomError(404, 'Subscriptions not found');
            }

            return subscriptions;
        } catch (error) {
            console.error('[getSubscriptions] Failed to get subscriptions', error);
            throw new CustomError(500, 'Failed to get subscriptions');
        }
    }

    public async getCustomSubscriptions(): Promise<ISubscription[]> {
        try {
            const subscriptions = await Subscriptions.findAll({ where: { subscriptionType: EnumSubscriptionType.Custom } });

            if (!subscriptions) {
                throw new CustomError(404, 'Subscriptions not found');
            }

            return subscriptions;
        } catch (error) {
            console.error('[getSubscriptions] Failed to get subscriptions', error);
            throw new CustomError(500, 'Failed to get subscriptions');
        }
    }

    public async checkoutSession(body: any) {
        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'USD',
                        product_data: {
                            name: 'User Credits',
                            description: 'Purchase user credits',
                        },
                        unit_amount: parseFloat(body.price) * 100,
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: body.callbackUrl,
                cancel_url: body.callbackUrl,
                // success_url: 'http://brainycode-client.s3-website-us-east-1.amazonaws.com/thread',
                // cancel_url: 'http://brainycode-client.s3-website-us-east-1.amazonaws.com/code',
                payment_intent_data: {
                    metadata: { ...body, checoutType: EnumCheckoutType.Buycredits }
                }
            });
            return session;

        } catch (error) {
            console.log("[checkoutSession] Session creation failed", error);
            throw new CustomError(500, 'Session creation failed');
        }
    }

    public async createOrderAndCheckout(body: any) {
            try {
                const { id, userId, credit, price } = body;
                const user = await Users.findOne({ where: { id: userId } })
                if (!user) {
                    console.log("[handlePaymentIntentSucceededForCustomOrder] User not found");
                    throw new Error('User not found');
                }
                // Implement the logic for handling payment_intent.succeeded
                const userCredit = await UsersCredits.findOne({ where: { userId } });
                if (!userCredit) {
                    console.log("[handlePaymentIntentSucceededForCustomOrder] User not found in user credit table");
                    throw new Error('User not found');
                }
                const currentCredit = parseFloat(userCredit?.credits as unknown as string);
                const newCredit = currentCredit - parseInt(credit, 10);
                await UsersCredits.update({ credits: newCredit }, { where: { userId } });
                const updatedUserCredits = await UsersCredits.findOne({ where: { userId } });
                const order = await Orders.create({
                    subscriptionId: id,
                    amount: parseInt(price),
                    status: 'succeeded',
                    userId
                });
    
                if (!order) {
                    console.log("[handlePaymentIntentSucceededForCustomOrder] Payment failed");
                    return;
                }
    
                try {
                    const emailHelper = new EmailHelper();
                    const details: Record<string, string> = {
                        'CustomerName': user.firstName + ' ' + user.lastName,
                        'OrderId': order.id,
                        'CreditUsed':credit,
                        'Amount': order.amount.toString(),
                        'Date': order.createdAt.toDateString(),
                        'Year': new Date().getFullYear().toString(),
                    }
                    const { pdfBuffer } = await emailHelper.sendEmail(
                        user.email, //recipient emails
                        'Order Confirmation', //template name 
                        'order-invoice', // Assuming you have order-confirmation.html in your templates folder
                        details,
                        true
                    );
    
                    if (pdfBuffer) {
                        // Load the zip file into jszip
                        const zip = new JSZip();
                        zip.file(`invoice.pdf`, pdfBuffer);
                        // Generate a new zip file as a buffer
                        const newZipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    
                        // Define the fileName and user-specific S3 key
                        const fileName = `invoice-${Date.now()}.zip`;
                        const userBucketName = process.env.AWS_BUCKET_NAME || '';
                        const userS3key = `user-codes/${userId}/order-invoice/${fileName}`;
    
                        // Upload the new zip buffer to S3
                        await this.awsService.uploadFile(userBucketName, userS3key, newZipBuffer, 'application/zip');
                    }
                    console.log('[handlePaymentIntentSucceededForCustomOrder] Email sent successfully for success order');
                } catch (error) {
                    console.error('[handlePaymentIntentSucceededForCustomOrder] Failed to send email:', error);
                }
               return updatedUserCredits;
    
            } catch (error) {
                console.log("[handlePaymentIntentSucceeded] Payment failed", error);
            }
    }

    public async reviewPrompt(subs: IReviewsPrompt, userId: string, file?: Express.Multer.File): Promise<PromptReviews> {
        const transaction = await sequelize.transaction();
        try {
            let userCredits = await UsersCredits.findOne({ where: { userId } });

            if (!userCredits) {
                throw new CustomError(404, 'User credits not found');
            }

            const subscription = await Subscriptions.findOne({ where: { id: subs.id } });
            if (!subscription) {
                throw new CustomError(404, 'Subscription not found');
            }

            await this.deductCredits(userId, subscription.credit, transaction);

            const reviewPrompt = await PromptReviews.create({
                userId,
                promptId: subs.promptId,
                subscriptionId: subscription.id,
                status: EnumReviewStatus.Pending,
            }, { transaction });

            try {
                if (file) {
                    // const zip = new JSZip();
                    // const fileStream = file.stream;
                    // zip.file(file.originalname, fileStream);
                    // // Generate a new zip file as a buffer
                    // const newZipBuffer = await zip.generateAsync({ type: "nodebuffer" });

                    // Define the fileName and user-specific S3 key
                    const fileName = `${subs.promptId}-${Date.now()}.zip`;
                    const userBucketName = process.env.AWS_BUCKET_NAME || '';
                    const userS3key = `user-codes/${userId}/review-prompt/${fileName}`;
                    await this.awsService.uploadFile(userBucketName, userS3key, file.buffer, file.mimetype);
                }
            } catch (error) {
                throw new CustomError(500, 'Failed to upload file on s3 for review prompt')
            }
            await transaction.commit();
            // return new PromptReviews;
            return reviewPrompt;
        } catch (error) {
            await transaction.rollback();
            if (error instanceof Error) {
                console.error('[reviewPrompt] Failed to process review prompt', error.message);
                throw new CustomError(500, error.message);
            } else {
                // Handle the case where the error is not an Error object
                console.error('[reviewPrompt] Failed to process review prompt', error);
                throw new CustomError(500, 'Failed to process review prompt');
            }
        }
    }

    private async deductCredits(userId: string, creditType: EnumSubscriptionCreditType, transaction: Transaction) {
        const creditDeductionMap = {
            [EnumSubscriptionCreditType.Free]: 0,
            [EnumSubscriptionCreditType.One]: 1,
            [EnumSubscriptionCreditType.Five]: 5,
            [EnumSubscriptionCreditType.Ten]: 10,
        };

        const deductionAmount = creditDeductionMap[creditType] || 0;
        try {
            // Start by finding the user credits within the transaction
            const userCredits = await UsersCredits.findOne({
                where: { userId },
                transaction, // Pass transaction through options
            });

            if (!userCredits) throw new CustomError(404, 'User credits not found');
            if (userCredits.credits - deductionAmount < 0) throw new CustomError(400, 'User has low credit to perform this task');

            userCredits.credits -= deductionAmount;
            await userCredits.save({ transaction });
        } catch (error) {
            if (error instanceof Error) {
                throw new CustomError(500, error.message);
            } else {
                // Handle the case where the error is not an Error object
                console.error('[deductCredits] Failed to deduct credits:', error);
                throw new CustomError(500, 'Failed to deduct credits');
            }
        }
    }

    public async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
        try {
            const { id, userId, credit, price } = paymentIntent.metadata;
            const user = await Users.findOne({ where: { id: userId } })
            if (!user) {
                console.log("[handlePaymentIntentSucceeded] User not found in user table");
                throw new Error('User not found');
            }
            // Implement the logic for handling payment_intent.succeeded
            const userCredit = await UsersCredits.findOne({ where: { userId } });
            if (!userCredit) {
                console.log("[handlePaymentIntentSucceeded] User not found in user credit table");
                throw new Error('User not found');
            }
            const currentCredit = parseFloat(userCredit?.credits as unknown as string);
            const newCredit = currentCredit + parseInt(credit, 10);
            await UsersCredits.update({ credits: newCredit }, { where: { userId } });

            const order = await Orders.create({
                creditId: id,
                stripeId: paymentIntent.id,
                amount: parseInt(price),
                status: paymentIntent.status,
                userId,
            });

            if (!order) {
                console.log("[handlePaymentIntentSucceeded] Payment failed");
                return;
            }

            try {
                const emailHelper = new EmailHelper();
                const details: Record<string, string> = {
                    'CustomerName': user.firstName + ' ' + user.lastName,
                    'OrderID': order.id,
                    'Amount': order.amount.toString(),
                    'Date': new Date().getUTCDate().toString(),
                    'Year': new Date().getFullYear().toString(),
                }
                const { pdfBuffer } = await emailHelper.sendEmail(
                    user.email, //recipient emails
                    'Order Confirmation', //template name 
                    'order-invoice', // Assuming you have order-confirmation.html in your templates folder
                    details,
                    true
                );

                if (pdfBuffer) {
                    // Load the zip file into jszip
                    const zip = await JSZip.loadAsync(pdfBuffer);

                    // Generate a new zip file as a buffer
                    const newZipBuffer = await zip.generateAsync({ type: "nodebuffer" });

                    // Define the fileName and user-specific S3 key
                    const fileName = `invoice-${Date.now}.zip`;
                    const userBucketName = process.env.AWS_BUCKET_NAME || '';
                    const userS3key = `user-codes/${userId}/order-invoice/${fileName}`;

                    // Upload the new zip buffer to S3
                    await this.awsService.uploadFile(userBucketName, userS3key, newZipBuffer, 'application/zip');
                }
                console.log('[handlePaymentIntentSucceeded] Email sent successfully for success order');
            } catch (error) {
                console.error('[handlePaymentIntentSucceeded] Failed to send email:', error);
            }

            // Implement notification logic, e.g., using websockets

        } catch (error) {
            console.log("[handlePaymentIntentSucceeded] Payment failed", error);
        }
    }

    public async handlePaymentIntentSucceededForCustomOrder(paymentIntent: Stripe.PaymentIntent) {
        try {
            const { id, userId, credit, price, orderId } = paymentIntent.metadata;
            const user = await Users.findOne({ where: { id: userId } })
            if (!user) {
                console.log("[handlePaymentIntentSucceededForCustomOrder] User not found");
                throw new Error('User not found');
            }
            // Implement the logic for handling payment_intent.succeeded
            const userCredit = await UsersCredits.findOne({ where: { userId } });
            if (!userCredit) {
                console.log("[handlePaymentIntentSucceededForCustomOrder] User not found in user credit table");
                throw new Error('User not found');
            }
            const currentCredit = parseFloat(userCredit?.credits as unknown as string);
            const newCredit = currentCredit - parseInt(credit, 10);
            await UsersCredits.update({ credits: newCredit }, { where: { userId } });

            const order = await Orders.create({
                subscriptionId: id,
                stripeId: paymentIntent.id,
                amount: parseInt(price),
                status: paymentIntent.status,
                userId
            });

            if (!order) {
                console.log("[handlePaymentIntentSucceededForCustomOrder] Payment failed");
                return;
            }

            try {
                const emailHelper = new EmailHelper();
                const details: Record<string, string> = {
                    'CustomerName': user.firstName + ' ' + user.lastName,
                    'OrderId': order.id,
                    'Amount': order.amount.toString(),
                    'Date': order.createdAt.toDateString(),
                    'Year': new Date().getFullYear().toString(),
                }
                const { pdfBuffer } = await emailHelper.sendEmail(
                    user.email, //recipient emails
                    'Order Confirmation', //template name 
                    'order-invoice', // Assuming you have order-confirmation.html in your templates folder
                    details,
                    true
                );

                if (pdfBuffer) {
                    // Load the zip file into jszip
                    const zip = new JSZip();
                    zip.file(`invoice.pdf`, pdfBuffer);
                    // Generate a new zip file as a buffer
                    const newZipBuffer = await zip.generateAsync({ type: "nodebuffer" });

                    // Define the fileName and user-specific S3 key
                    const fileName = `invoice-${Date.now()}.zip`;
                    const userBucketName = process.env.AWS_BUCKET_NAME || '';
                    const userS3key = `user-codes/${userId}/order-invoice/${fileName}`;

                    // Upload the new zip buffer to S3
                    await this.awsService.uploadFile(userBucketName, userS3key, newZipBuffer, 'application/zip');
                }
                console.log('[handlePaymentIntentSucceededForCustomOrder] Email sent successfully for success order');
            } catch (error) {
                console.error('[handlePaymentIntentSucceededForCustomOrder] Failed to send email:', error);
            }

        } catch (error) {
            console.log("[handlePaymentIntentSucceeded] Payment failed", error);
        }
    }

    public async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
        try {
            const { id, userId, credit, price } = paymentIntent.metadata;
            await Orders.create({
                creditId: id,
                stripeId: paymentIntent.id,
                amount: parseInt(price),
                status: paymentIntent.status,
                userId,
            });
        } catch (error) {
            console.log("[handlePaymentIntentFailed] Payment failed", error);
        }
    }

    public async boardSpecification(): Promise<IBoardSpecifications[]> {
        try {
            return await BoardSpecifications.findAll();
        } catch (error) {
            console.log("[boardSpecification] Board Specification get api failed.", error);
            throw new CustomError(500, 'Failed to fetch board specification');
        }
    }

    public async billingAddress(billingAddressDetails: IBillingAddress, userId: string): Promise<IBillingAddress> {
        try {
            const isUserExists = await BillingAddress.findOne({ where: { userId } })
            if (!isUserExists) {
                const billingAddress = await BillingAddress.create({ ...billingAddressDetails, userId });
                return billingAddress;
            }
            else {
                await BillingAddress.update(
                    { ...billingAddressDetails },
                    {
                        where: { userId },
                        returning: true
                    });
                const updatedBillingAddress = await BillingAddress.findOne({ where: { userId } });
                if (!updatedBillingAddress) throw new CustomError(500, 'Failed to update billing address');
                return updatedBillingAddress;
            }

        } catch (error) {
            console.log("[billingAddress] Board Specification get api failed.", error);
            throw new CustomError(500, 'Failed to save billing address');
        }
    }

    public async getbillingAddress(userId: string): Promise<{ isAddressExists: boolean, billingAddress?: IBillingAddress }> {
        try {
            const billingAddress = await BillingAddress.findOne({ where: { userId, saveInfo: true } })
            if (!billingAddress) {
                return { isAddressExists: false };
            }
            return { isAddressExists: true, billingAddress: billingAddress };
        } catch (error) {
            console.log("[billingAddress] Board Specification get api failed.", error);
            throw new CustomError(500, 'Failed to save billing address');
        }
    }

    public async getLastOrder(userId: string): Promise<{ isOrderExists: boolean, order?: IOrders }> {
        try {
            // Assuming 'createdAt' is the field to sort by. Adjust if your model uses a different field.
            const order = await Orders.findOne({
                where: { userId },
                order: [['createdAt', 'DESC']], // or [['orderDate', 'DESC']] if using an order date field
                include: [
                    {
                        model: Credits, // Include the associated Prompts data
                    },
                    {
                        model: Subscriptions, // Include the associated Prompts data
                    }
                ]
            });

            if (!order) {
                return { isOrderExists: false };
            }

            return { isOrderExists: true, order: order }; // Note the change to 'order' to reflect it's a single order, not multiple
        } catch (error) {
            console.error("[getLastOrder] Failed to fetch the last order:", error);
            throw new CustomError(500, 'Failed to fetch the last order');
        }
    }


    public async getOrders(userId: string): Promise<IOrders[]> {
        try {
            const orders = await Orders.findAll({
                where: { userId: userId },
                order: [['createdAt', 'DESC']]
            });
            if (!orders) {
                throw new CustomError(500, 'Orders not found');
            }
            return orders;
        } catch (error) {
            console.error('[Orders] Failed to get Orders', error);
            throw new CustomError(500, 'Failed to get Orders');
        }
    }

}


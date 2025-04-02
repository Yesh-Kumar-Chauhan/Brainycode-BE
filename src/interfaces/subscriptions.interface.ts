export enum EnumSubscriptionType {
    Review = 'review',
    Custom = 'custom',
}

export enum EnumSubscriptionCreditType {
    Free = 'Free',
    One = '1 Credit',
    Five = '5 Credits',
    Ten = '10 Credits'
}

export enum EnumCheckoutType {
    Buycredits = 'buycredits',
    Buycustomboard = 'buycustomboard',
}

export interface ISubscription {
    id: string;
    credit: string;
    title: string;
    description: string;
    subscriptionType: EnumSubscriptionType;
    price: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IReviewsPrompt extends ISubscription {
    promptId: string;
    fileDescription: string;
}

export interface IOrders {
    id?: string;
    creditId?: string;
    subscriptionId?: string;
    stripeId?: string;
    amount: number;
    status: string;
    userId: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IBillingAddress {
    id: string;
    userId: string;
    zipcode: string;
    state: string;
    address1: string;
    address2: string;
    city: string;
    shipTo: string;
    email: string;
    organisation: string;
    saveInfo: boolean;
    mobileNo: string;
    createdAt: Date;
    updatedAt: Date;
}
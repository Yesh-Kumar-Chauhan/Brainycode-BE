interface IUserAttributes {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    username?: string;
    organisation?: string;
    password?: string;
    role: string;
    age?: number;
    gender?: string;
    technologies?: string;
    otp?: number;
    profileUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export {
    IUserAttributes
}
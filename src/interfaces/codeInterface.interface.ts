export enum EnumReviewStatus {
    UnderReview = 'UnderReview',
    Pending = 'Pending',
    Reviewed = 'Reviewed'
}

export enum EnumGenerateType {
    Generate = 'generate',
    Boilerplate = 'boilerplate',
    Custom = 'custom'
}

export interface IGenerateCodeResponse {
    fileUrl: string;
    file?: Buffer;
    promptId : string; 
}

export interface IGenerateCodeRequest {
    type : string;
    generatedPromptCode: string;
    prompt : string;
    languageId : string;
    language : string;
    framework : string;
    finalPrompt : string
}

export interface IGenerateCode {
    type: EnumGenerateType;
    inputType?: string;
    outputType?: string;
    inputVariable?: string;
    outputVariable?: string;
    language: string;
    framework: string;
    prompt: string;
    columns? : Array<string>
}

export interface IPrompt {
    id?: string;
    userId: string;
    prompt: string;
    finalPrompt: string;
    type: string;
    languageId: string;
    code?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ILanguages {
    id?: string;
    language: string;
    framework: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICredits {
    id?: string;
    credit: number;
    price: number;
    title: string;
    description: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUsersCredit {
    id?: string;
    userId: string;
    credits: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IPromptReviews {
    id?: string;
    userId: string;
    promptId: string;
    subscriptionId: string;
    status: EnumReviewStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IBoardSpecifications {
    id: string;
    model: string;
    processor: string;
    memory: string;
    storage: string;
    connectivity: string;
    ioports: string;
    dimensions: string;
    language: string;
    architecture: string;
    createdAt: Date;
    updatedAt: Date;
}
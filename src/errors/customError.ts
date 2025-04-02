// errors/CustomError.ts
class CustomError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = 'CustomError';
    }
}

export default CustomError;

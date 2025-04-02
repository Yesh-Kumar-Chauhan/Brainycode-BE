import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, z } from 'zod';

export const validate = (schemas: { body?: AnyZodObject; query?: AnyZodObject }) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.query) {
                req.query = schemas.query.parse(req.query);
            }
            next();
        } catch (error) {
            // Handle Zod's parsing errors
            console.log("[Validate] Validation error occured.")
            if (error instanceof z.ZodError) {
                res.status(400).json({ message: error.errors[0].message });
            }
            next(error);
        }
    };
};

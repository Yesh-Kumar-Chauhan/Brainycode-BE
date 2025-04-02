import { z } from 'zod';

export const querySchema = z.object({
    userId: z.string({ required_error: "User Id is required for generating code." }),
});

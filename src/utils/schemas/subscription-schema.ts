import { z } from 'zod';

export const billingAdressSchema = z.object({
    zipcode: z.string({ required_error: "zipcode is required." }),
    state: z.string({ required_error: "Framework is required." }),
    address1: z.string({ required_error: "Address1 is required." }),
    address2: z.string().optional(),
    city: z.string({ required_error: "city is required." }),
    shipTo: z.string({ required_error: "shipTo is required." }),
    email: z.string({ required_error: "email is required." }),
    organisation : z.string({ required_error: "organisation is required." }),
    mobileNo : z.string({ required_error: "mobile number is required." }),
    saveInfo : z.boolean({ required_error: "SaveInfo is required." })
});

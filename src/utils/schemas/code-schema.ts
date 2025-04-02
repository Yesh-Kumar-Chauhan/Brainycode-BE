import { z } from 'zod';
import { EnumGenerateType } from '../../interfaces/codeInterface.interface';

export const codeSchema = z.object({
    language: z.string({ required_error: "Language is required for generating code." }),
    framework: z.string().optional(),
    prompt: z.string({ required_error: "Prompt is required for generating code." }),
    outputType: z.string().optional(),
    inputType: z.string().optional(),
    outputVariable: z.string().optional(),
    inputVariable: z.string().optional(),
    type: z.nativeEnum(EnumGenerateType, { required_error: "Generate Type is required for generating code." }),
    //type : z.string({ required_error: "Generate Type is required for generating code." })
    columns: z.array(z.string()).optional(),
});

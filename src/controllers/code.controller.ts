// codeController.ts
import { Request, Response } from 'express';
import { CodeService } from '../services/code.service';
import CustomError from '../errors/customError';


const codeService = new CodeService();

export const generateCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;
        const code = await codeService.generateCode(req.body, userId);
        res.status(200).json({ message: 'Code generated successfully', code });
    }
    catch (error) {
        console.error('[generateCode] Error during generating code:', error);
        // Handle specific custom error
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

export const uploadGeneratedCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;
        const code = await codeService.uploadGeneratedCode(req.body, userId);
        res.status(200).json({ message: 'Code uploading on s3 successfully', code });
    }
    catch (error) {
        console.error('[uploadGeneratedCode] Error during uploading code:', error);
        // Handle specific custom error
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

// export const generateBoilerplateCode = async (req: Request, res: Response): Promise<void> => {
//     try {
//         const userId = req.query.userId as string;
//         const code = await codeService.generateBoilerplateCode(req.body, userId);
//         res.status(200).json({ message: 'Code generated successfully', code });
//     }
//     catch (error) {
//         console.error('[generateBoilerplateCode] Error during generating code:', error);
//         // Handle specific custom error
//         if (error instanceof CustomError) {
//             res.status(error.statusCode).json({ message: error.message });
//         } else {
//             res.status(500).json({ message: 'Internal Server Error' });
//         }
//     }
// }

export const prompts = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;
        const prompts = await codeService.getAllPrompt(userId);
        res.status(200).json({ message: 'Code generated successfully', prompts });
    }
    catch (error) {
        console.error('[codes] Error during getting code:', error);
        // Handle specific custom error
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}
export const getPromptById = async (req: Request, res: Response): Promise<void> => {
    try {
        const promptId = req.query.promptId as string; 
        const prompt = await codeService.getPromptById(promptId);

        if (prompt) {
            res.status(200).json({ message: 'Prompt fetched successfully', prompt });
        } else {
            res.status(404).json({ message: 'Prompt not found' });
        }
    } catch (error) {
        console.error('[getPromptById] Error during getting prompt by ID:', error);
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

export const deletePromptById = async (req: Request, res: Response): Promise<void> => {
    try {
        
        const prompt = await codeService.deletePromptById(req.body.promptId);

        if (prompt) {
            res.status(200).json({ message: 'Prompt deleted successfully', prompt });
        } else {
            res.status(404).json({ message: 'Prompt not found' });
        }
    } catch (error) {
        console.error('[deletePromptById] Error during deleteing prompt by ID:', error);
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

export const promptCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;
        const promptId = req.query.promptId as string;
        const code = await codeService.getPromptCode(userId, promptId);
        res.status(200).json({ message: 'Code generated successfully', code });
    }
    catch (error) {
        console.error('[codes] Error during getting code:', error);
        // Handle specific custom error
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

export const languages = async (req: Request, res: Response): Promise<void> => {
    try {
        const languages = await codeService.getLanguages();
        res.status(200).json({ message: 'Success', languages });
    }
    catch (error) {
        console.error('[languages] Error during getting languages:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }

}

export const regeneratePrompt = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;
        const { prompt } = req.body;
        const regeneratePrompt = await codeService.regeneratePrompt(prompt, userId);
        console.log("req.body", req.body);
        res.status(200).json({ message: 'Success', regeneratePrompt });
    }
    catch (error) {
        console.error('[regeneratePrompt] Error during getting user credit:', error);
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

export const promptReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;
        const promptReviews = await codeService.promptReviews(userId);
        res.status(200).json({ message: 'Success', promptReviews });
    }
    catch (error) {
        console.error('[promptReviews] Error during getting prompt reviews', error);
        if (error instanceof CustomError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

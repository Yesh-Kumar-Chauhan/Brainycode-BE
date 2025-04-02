import { promises as fs } from 'fs';
import * as path from 'path';
import JSZip from 'jszip';
import CustomError from "../errors/customError";
import { ChatGptService } from "./chatGpt.service";
import { AwsService } from './aws.service';
import {
    EnumGenerateType,
    IGenerateCode,
    IGenerateCodeRequest,
    IGenerateCodeResponse,
    ILanguages,
    IPrompt,
    IPromptReviews
} from '../interfaces/codeInterface.interface';

import Prompts from '../models/prompts.model';
import Languages from '../models/languages.model';
import os from 'os';
import PromptReviews from '../models/promptsReviews.model';
import Subscriptions from '../models/subscriptions.model';

export class CodeService {

    private chatGptService: ChatGptService;
    private awsService: AwsService;

    constructor() {
        this.chatGptService = new ChatGptService();
        this.awsService = new AwsService();
    }

    public async generateCode(generate: IGenerateCode, userId: string): Promise<{}> {
        try {
            return await this.generateCodeHelper(generate, userId);
            // switch (generate.type) {
            //     case EnumGenerateType.Generate:
            //     case EnumGenerateType.Custom:
            //         return await this.generateSignlePieceCode(generate, userId);

            //     case EnumGenerateType.Boilerplate:
            //         return await this.generateBoilerplateCode(generate, userId);

            //     default:
            //         throw new CustomError(500, 'Invalid generate type');
            // }
        } catch (error) {
            if (error instanceof Error) {
                console.error('[generateCode] Failed to generate code:', error);
                throw new CustomError(500, error.message);
            }
            else {
                console.error('[generateCode] Failed to generate code:', error);
                throw new CustomError(500, 'Failed to generate code:');
            }
        }
    }

    public async uploadGeneratedCode(generate: IGenerateCodeRequest, userId: string): Promise<IGenerateCodeResponse> {
        try {
            switch (generate.type) {
                case EnumGenerateType.Generate:
                case EnumGenerateType.Custom:
                    return await this.generateSignlePieceCode(generate, userId);

                case EnumGenerateType.Boilerplate:
                    return await this.generateBoilerplateCode(generate, userId);

                default:
                    throw new CustomError(500, 'Invalid generate type');
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error('[generateCode] Failed to generate code:', error);
                throw new CustomError(500, error.message);
            }
            else {
                console.error('[generateCode] Failed to generate code:', error);
                throw new CustomError(500, 'Failed to generate code:');
            }
        }
    }

    /**
    * Generates a single piece of code based on the provided form fields and uploads it to an S3 bucket.
    * @param generate The form fields used to create a prompt to send to the ChatGPT API.
    * @param userId The ID of the logged-in user, used for identifying the user's stored prompts.
    * @returns An object containing the URL of the uploaded code in the S3 bucket.
    */
    private async generateSignlePieceCode(generate: IGenerateCodeRequest, userId: string): Promise<IGenerateCodeResponse> {
        try {
            const { type, prompt, generatedPromptCode, languageId, finalPrompt } = generate;

            const promptObj = {
                type: type,
                userId,
                prompt: prompt,
                languageId: languageId,
                finalPrompt: finalPrompt
            }
            const createdPrompt = await Prompts.create(promptObj);
            if (!createdPrompt || !createdPrompt.dataValues.id) {
                throw new CustomError(500, 'Error generating prompt');
            }
            const promptId = createdPrompt.dataValues.id;
            // const { generatedPromptCode, promptId } = await this.generateCodeHelper(generate, userId);
            const fileUrl = await this.uploadPromptOnS3(generatedPromptCode, promptId, userId);
            return { fileUrl, promptId };

        } catch (error) {
            if (error instanceof Error) {
                console.error('[generateCode] Failed to generate code:', error);
                throw new CustomError(500, error.message);
            }
            else {
                console.error('[generateCode] Failed to generate code:', error);
                throw new CustomError(500, 'Failed to generate code:');
            }
        }
    }

    /**
    * Uploads the generated code to an AWS S3 bucket.
    * This method writes the generated code to a temporary file, uploads this file to the specified S3 bucket,
    * and then cleans up by deleting the temporary file. It constructs the S3 key based on the user ID and prompt ID
    * to organize the code files in a user-specific and prompt-specific manner.
    *
    * @param generatedPromptCode The code generated from the prompt that needs to be uploaded.
    * @param promptId The unique identifier for the prompt, used in naming the file and constructing the S3 key.
    * @param userId The unique identifier for the user, used to create a user-specific directory in the S3 bucket.
    * @returns A promise that resolves to the URL of the uploaded file in the S3 bucket.
    * @throws {CustomError} Throws a custom error if the file cannot be uploaded to S3.
    */
    private async uploadPromptOnS3(
        generatedPromptCode: string,
        promptId: string,
        userId: string): Promise<string> {
        try {
            // Define the file path and name
            const fileName = `code-${promptId}.txt`;
            const tempDir = path.join(os.tmpdir(), `${promptId}`);// Adjust based on your project structure
            const filePath = path.join(tempDir, fileName);

            // Ensure the directory exists
            console.log(`Creating directory at: ${tempDir}`);
            await fs.mkdir(tempDir, { recursive: true });

            console.log(`Writing file at: ${filePath}`);
            await fs.writeFile(filePath, generatedPromptCode);
            // Use the awsService to upload the file
            const bucketName = process.env.AWS_BUCKET_NAME || '';
            const key = `user-codes/${userId}/prompts/${fileName}`;

            console.log(`Reading file from: ${filePath}`);
            const fileContent = await fs.readFile(filePath);

            console.log(`Uploading file to S3: ${key}`);
            const fileUrl: string = await this.awsService.uploadFile(bucketName, key, fileContent, 'text/plain');

            console.log(`Deleting local file: ${filePath}`);
            await fs.unlink(filePath);

            return fileUrl;
        } catch (error) {
            console.error('[uploadPromptOnS3] Failed to generate code:', error);
            throw new CustomError(500, 'Failed to upload code:');
        }
    }

    /**
    * Downloads a zip file from an AWS S3 bucket, adds a new text file with generated code to the zip, 
    * and then uploads the modified zip back to S3. This method is useful for cases where the generated code 
    * needs to be bundled with existing files in a zip format before being stored. The process involves 
    * downloading the original zip, modifying it by adding the new code as a text file, and re-uploading 
    * the updated zip to a user-specific location within the S3 bucket.
    *
    * @param generatedPromptCode The code generated from the prompt that needs to be added to the zip file.
    * @param promptId The unique identifier for the prompt, used in naming the updated zip file and constructing the S3 key.
    * @param userId The unique identifier for the user, used to create a user-specific directory in the S3 bucket.
    * @param key The S3 key of the original zip file to be downloaded and updated.
    * @returns A promise that resolves to an object containing the URL of the uploaded zip file in the S3 bucket 
    *          and the buffer of the new zip file.
    * @throws {CustomError} Throws a custom error if there's an issue in any step of the process, including downloading 
    *         the original zip, modifying it, or uploading the updated version.
    */
    private async downloadAndUploadPromptOnS3(
        generatedPromptCode: string,
        promptId: string,
        userId: string,
        key: string
    ): Promise<IGenerateCodeResponse> {
        try {
            const bucketName = process.env.AWS_BUCKET_NAME || '';

            const bufferFile = await this.awsService.downloadFile(bucketName, key);

            // Load the zip file into jszip
            const zip = await JSZip.loadAsync(bufferFile);

            // Add a new text file to the zip
            zip.file("prompt.txt", generatedPromptCode);

            // Generate a new zip file as a buffer
            const newZipBuffer = await zip.generateAsync({ type: "nodebuffer" });

            // Define the fileName and user-specific S3 key
            const fileName = `code-${promptId}.zip`;
            const userBucketName = process.env.AWS_BUCKET_NAME || '';
            const userS3key = `user-codes/${userId}/prompts/${fileName}`;

            // Upload the new zip buffer to S3
            const fileUrl = await this.awsService.uploadFile(userBucketName, userS3key, newZipBuffer, 'application/zip');

            // Return both the S3 URL and the buffer, if needed
            return { fileUrl, file: newZipBuffer, promptId };
        } catch (error) {
            console.error('[uploadPromptOnS3] Failed to generate code:', error);
            throw new CustomError(500, 'Failed to upload code:');
        }
    }

    /**
    * Generates boilerplate code based on specified language and framework, then incorporates this generated code 
    * into a pre-existing boilerplate zip file stored in an AWS S3 bucket. The method first generates the code 
    * based on the provided form fields, identifies the appropriate boilerplate zip file based on the language 
    * and framework, adds the generated code to this zip, and finally uploads the updated zip file back to S3.
    *
    * @param generate An object containing details about the code to generate, including the language, 
    *                 framework, and any additional parameters required for code generation.
    * @param userId The unique identifier for the user, which is used to create a user-specific directory 
    *               in the S3 bucket for storing the updated boilerplate zip file.
    * @returns A promise that resolves to an object containing the URL of the uploaded zip file in the S3 bucket. 
    *          This object may also include a Buffer of the zip file's content if needed elsewhere in the application.
    * @throws {CustomError} Throws a custom error if the process fails at any stage, including code generation, 
    *         downloading the original boilerplate, updating the zip, or uploading the modified version.
    */
    private async generateBoilerplateCode(generate: IGenerateCodeRequest, userId: string): Promise<IGenerateCodeResponse> {
        try {
            // const { generatedPromptCode, promptId } = await this.generateCodeHelper(generate, userId);
            const { type, prompt, generatedPromptCode, languageId, finalPrompt } = generate;

            const promptObj = {
                type: type,
                userId,
                prompt: prompt,
                languageId: languageId,
                finalPrompt: finalPrompt
            }
            const createdPrompt = await Prompts.create(promptObj);
            if (!createdPrompt || !createdPrompt.dataValues.id) {
                throw new CustomError(500, 'Error generating prompt');
            }
            const promptId = createdPrompt.dataValues.id;
            // Assume the boilerplate code's zip file is identified by some unique key
            const key = `boilerplates/${generate.language}-${generate.framework}.zip`; // Adjust as necessary
            return await this.downloadAndUploadPromptOnS3(generatedPromptCode, promptId, userId, key);
        } catch (error) {
            console.error('[generateBoilerplateCode] Failed to download boilerplate code:', error);
            throw new CustomError(500, 'Failed to download boilerplate code');
        }
    }

    /**
    * Assists in generating code based on user input and language/framework specifications. This method 
    * constructs a prompt for the ChatGPT API, sends the prompt, and saves the prompt details along with 
    * the generated code to the database. It ensures that the specified language and framework exist 
    * before proceeding with code generation.
    *
    * @param generate An object containing the specifications for the code generation, including language, 
    *                 framework, input/output types and variables, and any additional columns for CSV or similar formats.
    * @param userId The unique identifier of the user requesting code generation, used for associating the 
    *               generated prompt and code with a specific user in the database.
    * @returns An object containing the generated code and the database ID of the newly created prompt, 
    *          which can be used for further reference or processing.
    * @throws {CustomError} Throws a custom error if the specified language/framework is not found, if there's 
    *         an issue with generating the code through ChatGPT, or if saving the prompt to the database fails.
    */
    private async generateCodeHelper(
        generate: IGenerateCode, 
        userId: string): Promise<{ generatedPromptCode: string, languageId: string, finalPrompt: string }> {
        try {
            const whereClause = {
                language: generate.language,
            };

            if (generate.framework) {
                whereClause['framework'] = generate.framework;
            }

            const language = await Languages.findOne({
                where: whereClause,
            });

            if (!language || !language.dataValues.id) {
                throw new CustomError(500, 'Selected language not found:');
            }

            // Generate code from prompt using ChatGPT
            let promptParts = [
                `Language: ${generate.language}`,
                `Task: ${generate.prompt}`,
            ];

            if (generate.framework) {
                promptParts.push(`Framework: ${generate.framework}`)
            }

            if (generate.inputType && generate.inputVariable) {
                promptParts.push(`Input: Variable named ${generate.inputVariable} of type ${generate.inputType}`);
            }

            if (generate.outputType && generate.outputVariable) {
                promptParts.push(`Output: Variable named ${generate.outputVariable} of type ${generate.outputType}`);
            }

            if (generate.columns && generate.columns.length > 0) {
                promptParts.push(`Columns: ${generate.columns.join(', ')}`);
            }

            const prompt = promptParts.join(".\n");
            promptParts.push(`Please provide just the code snippet based on the above requirements.`);

            const generatedPromptCode: string | null = await this.chatGptService.sendPrompt(prompt);

            if (!generatedPromptCode) {
                throw new CustomError(500, 'Failed to generate prompt code');
            }
            // const promptObj = {
            //     type: generate.type,
            //     userId,
            //     prompt: generate.prompt,
            //     languageId: language.dataValues.id,
            //     finalPrompt: prompt
            // }
            // const createdPrompt = await Prompts.create(promptObj);
            // if (!createdPrompt || !createdPrompt.dataValues.id) {
            //     throw new CustomError(500, 'Error generating prompt');
            // }
            // const promptId = createdPrompt.dataValues.id;

            return { generatedPromptCode, languageId: language.id, finalPrompt : prompt }
        } catch (error) {
            console.error('[generateCodeHelper] Failed to generate code', error);
            throw new CustomError(500, 'Failed to generate code');
        }
    }

    public async getAllPrompt(userId: string): Promise<IPrompt[]> {
        try {
            const promptInstances = await Prompts.findAll({
                where: { userId: userId },
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: PromptReviews,
                    }
                ]
            });

            // Map over the instances to extract just the dataValues
            const prompts = promptInstances.map(instance => instance.dataValues);

            return prompts;
        } catch (error) {
            console.error('[getAllCodes] Failed to fetch prompts', error);
            throw new CustomError(500, 'Failed to fetch prompts');
        }
    }

    public async getPromptById(promptId: string): Promise<IPrompt> {
        try {
            const prompt = await Prompts.findOne({ where: { id: promptId } });
            if (!prompt) {
                throw new CustomError(500, 'prompt not found');
            }
            return prompt;
        } catch (error) {
            console.error('[getAllCodes] Failed to fetch prompts', error);
            throw new CustomError(500, 'Failed to fetch prompts');
        }
    }

    public async deletePromptById(promptId: string): Promise<boolean> {
        try {
            const prompt = await Prompts.findOne({ where: { id: promptId } });
            if (!prompt) {
                throw new CustomError(404, 'Prompt not found');
            }

            await prompt.destroy(); // This line actually deletes the prompt.

            return true; // Successfully deleted the prompt.
        } catch (error) {
            console.error('[deletePromptById] Failed to delete prompt', error);
            throw new CustomError(500, 'Failed to delete prompt');
        }
    }

    public async getPromptCode(userId: string, promptId: string): Promise<IPrompt> {
        try {
            const prompt = await Prompts.findOne({
                where: { id: promptId },
            });

            if (!prompt) {
                throw new CustomError(404, 'Prompt not found');
            }

            const bucketName = process.env.AWS_BUCKET_NAME || '';

            const key = `user-codes/${userId}/prompts/code-${prompt.id}${prompt.type === EnumGenerateType.Boilerplate ? ".zip" : ".txt"}`;

            try {
                const bufferFile = await this.awsService.downloadFile(bucketName, key);
                let fileContent = "Failed to download or process file";
                if (prompt.type === EnumGenerateType.Generate || prompt.type === EnumGenerateType.Custom) {
                    fileContent = bufferFile.toString('utf-8');
                } else if (prompt.type === EnumGenerateType.Boilerplate) {
                    const zip = await JSZip.loadAsync(bufferFile);
                    const txtFile = zip.file("prompt.txt");
                    if (txtFile) {
                        fileContent = await txtFile.async("string");
                    } else {
                        console.error(`prompt.txt not found in zip for prompt ${prompt.id}`);
                    }
                }
                // Ensure a valid IPrompt object is always returned
                return { ...prompt.dataValues, code: fileContent };
            } catch (error) {
                console.error(`Failed to download or process file for prompt ${prompt.id}:`, error);
                // In case of an error, return prompt with an error-specific code message
                return { ...prompt.dataValues, code: "Failed to download or process file due to an error" };
            }
        } catch (error) {
            console.error('[getPromptCode] Failed to generate code', error);
            throw new CustomError(500, 'Failed to generate code');
        }
    }

    public async getLanguages(): Promise<ILanguages[]> {
        try {
            return await Languages.findAll();
        } catch (error) {
            console.error('[getLanguages] Failed to fetch languages', error);
            throw new CustomError(500, 'Failed to fetch languages');
        }
    }

    public async regeneratePrompt(prompt: IPrompt, userId: string): Promise<IPrompt> {
        try {
            const existingPrompt = await Prompts.findOne({
                where: { id: prompt.id, userId: userId },
            });

            if (!existingPrompt) {
                console.log("existingPrompt", existingPrompt);
                throw new CustomError(404, 'Prompt not found');
            }

            const promptContent = existingPrompt.finalPrompt;
            const generatedPromptCode: string | null = await this.chatGptService.sendPrompt(promptContent);

            if (!generatedPromptCode) {
                throw new CustomError(500, 'Failed to regenerate prompt');
            }

            if (existingPrompt.type == EnumGenerateType.Generate || existingPrompt.type == EnumGenerateType.Custom) {
                await this.uploadPromptOnS3(generatedPromptCode, existingPrompt.id, userId)
            }
            else {
                const key = `user-codes/${userId}/prompts/code-${existingPrompt.id}.zip`;
                await this.downloadAndUploadPromptOnS3(generatedPromptCode, existingPrompt.id, userId, key);
            }

            prompt.code = generatedPromptCode;
            return prompt;
        } catch (error) {
            if (error instanceof Error) {
                console.error(`Failed to regenerate prompt ${prompt.id}:`, error);
                throw new CustomError(500, error.message);
            }
            else {
                console.error(`Failed to regenerate prompt ${prompt.id}:`, error);
                throw new CustomError(500, 'Failed to regenerate prompt');
            }
        }
    }

    public async promptReviews(userId: string): Promise<IPromptReviews[]> {
        try {
            const existingPromptReviews = await PromptReviews.findAll({
                where: { userId: userId },
                include: [
                    {
                        model: Prompts, // Include the associated Prompts data
                        required: true // Only include PromptReviews where the associated Prompts exists
                    },
                    {
                        model: Subscriptions, // Include the associated Prompts data
                        required: true // Only include PromptReviews where the associated Prompts exists
                    }
                ]
            });

            if (!existingPromptReviews) {
                throw new CustomError(404, 'Prompt review not found');
            }

            return existingPromptReviews;
        } catch (error) {
            console.error(`Failed to fetch prompt reviews`, error);
            throw new CustomError(500, 'Failed to fetch prompt reviews');
        }
    }
}




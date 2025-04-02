import OpenAI from 'openai';
import { ChatCompletionCreateParamsNonStreaming, ChatCompletionMessage, CompletionCreateParamsStreaming } from 'openai/resources';
import { CompletionCreateParamsBase, CompletionCreateParamsNonStreaming } from 'openai/resources/completions';
import CustomError from '../errors/customError';

export class ChatGptService {
    private openaiApi: OpenAI;

    constructor() {
        this.openaiApi = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    /**
     * Sends a prompt to the ChatGPT API and returns the response.
     * @param prompt The prompt to send to the ChatGPT API.
     * @param options Additional options for the API request.
     * @returns The text response from ChatGPT.
     */
    async sendPrompt(prompt: string, options?: any): Promise<string | null> {
        try {
            // Merge the default options with any user-provided options
            const requestOptions: ChatCompletionCreateParamsNonStreaming = {
                model: "gpt-4-0125-preview",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                ...options
            };

            const response = await this.openaiApi.chat.completions.create(requestOptions);
            return response.choices[0].message.content;
        } catch (error) {
            if (error instanceof OpenAI.APIError) {
                console.error(error.status);
                console.error(error.message);
                console.error(error.code);
                console.error(error.type);
            }
            console.error('[sendPrompt] Error sending prompt to ChatGPT:', error);
            throw new CustomError(500, 'Failed to send prompt to ChatGPT');
        }
    }
}

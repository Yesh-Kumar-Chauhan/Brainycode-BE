//codeRouter.ts
import express from 'express';
import * as codeController from '../../controllers/code.controller'
import { validate } from '../../middleware/validateRequest'
import { codeSchema } from '../../utils/schemas/code-schema';
import { querySchema } from '../../utils/schemas/auth-schema';


const codeRouter = express.Router();

//GET
codeRouter.get('/', codeController.prompts);
codeRouter.get('/prompt-code', codeController.promptCode);
codeRouter.get('/data', codeController.languages);
codeRouter.get('/prompt-reviews', codeController.promptReviews);
codeRouter.get('/getPromptsById', codeController.getPromptById);
//POST
codeRouter.post('/regenerate', codeController.regeneratePrompt);
codeRouter.post('/generate', validate({ body: codeSchema, query: querySchema }), codeController.generateCode);
codeRouter.post('/upload-code', codeController.uploadGeneratedCode);
// codeRouter.post('/boilerplate', validate({ body: codeSchema, query: querySchema }), codeController.generateBoilerplateCode);

//DELETE
codeRouter.delete('/delete-prompt', codeController.deletePromptById);

export default codeRouter;
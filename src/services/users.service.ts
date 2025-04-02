import CustomError from "../errors/customError";
import { IUsersCredit } from "../interfaces/codeInterface.interface";
import Users from "../models/users.model";
import UsersCredits from "../models/usersCredit.model";
import { AwsService } from "./aws.service";

import crypto from 'crypto'
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import os from 'os';
import { promisify } from 'util';

// Promisify fs functions to use async/await
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

export class UserService {

    private awsService: AwsService;
    constructor() {
        this.awsService = new AwsService();
    }

    public async userCredit(userId: string): Promise<IUsersCredit> {
        try {
            const userCreditInstance = await UsersCredits.findOne({ where: { userId }, logging: console.log });
            if (!userCreditInstance) {
                throw new CustomError(500, 'User not found');
            }
            return userCreditInstance.dataValues;
        } catch (error) {
            console.error('[userCredit] Failed to get user credit', error);
            throw new CustomError(500, 'Failed to get user credit');
        }
    }

    public async profileUpload(userId: string, file: { image: string, name: string, mimetype: string }): Promise<string> {
        try {

            let { image, name, mimetype } = file;
            let decodedImage = Buffer.from(image, 'base64');
            if (!file) {
                throw new CustomError(400, 'File not found');
            }
            const extension = mime.extension(mimetype) || 'bin';
            const fileName = `profile.${extension}`;
            const userBucketName = process.env.AWS_BUCKET_NAME || '';
            const userS3key = `users/${userId}/${fileName}`;

            const fileUrl = await this.awsService.uploadFile(userBucketName, userS3key, decodedImage, mimetype);

            await Users.update({ profileUrl: fileUrl }, { where: { id: userId } })
            const signedUrl = await this.awsService.provideAccessToPrivateObject(fileUrl);
            return signedUrl;
        } catch (error) {
            console.error('[profileUpload] Failed to upload user profile', error);
            throw new CustomError(500, 'Failed to upload user profile');
        }
    }
    
    // public async profileUpload(userId: string, file?: Express.Multer.File): Promise<string> {
    //     try {
    //         if (!file) {
    //             throw new CustomError(400, 'File not found');
    //         }
    //         const extension = mime.extension(file.mimetype) || 'bin';
    //         // const fileName = file.originalname;
    //         const fileName = `profile.${extension}`;
    //         const userBucketName = process.env.AWS_BUCKET_NAME || '';
    //         const userS3key = `users/${userId}/${fileName}`;

    //         const fileUrl = await this.awsService.uploadFile(userBucketName, userS3key, file.buffer, file.mimetype);

    //         await Users.update({ profileUrl: fileUrl }, { where: { id: userId } })
    //         const signedUrl = await this.awsService.provideAccessToPrivateObject(fileUrl);
    //         return signedUrl;
    //     } catch (error) {
    //         console.error('[profileUpload] Failed to upload user profile', error);
    //         throw new CustomError(500, 'Failed to upload user profile');
    //     }
    // }

    // public async profileUpload(userId: string, file?: Express.Multer.File): Promise<string> {
    //     // Use os.tmpdir() to get the system's temporary directory
    //     if (!file) {
    //         throw new CustomError(400, 'File not found');
    //     }
    //     const tempDir = os.tmpdir();
    //     // const tempDir = path.join(__dirname, '..', 'temp');

    //     // Ensure the temp directory exists
    //     if (!fs.existsSync(tempDir)) {
    //         fs.mkdirSync(tempDir, { recursive: true });
    //     }
    //     const extension = mime.extension(file.mimetype) || 'bin'; // Fallback to .bin if unknown
    //     const tempFilePath = path.join(tempDir, `${userId}-profile-${Date.now()}.${extension}`);


    //     try {

    //         // Save the file buffer to a temporary file
    //         await writeFileAsync(tempFilePath, file.buffer);

    //         const fileName = `profile.${extension}`;
    //         // const fileName = `profile.${extension}`;
    //         const userBucketName = process.env.AWS_BUCKET_NAME || '';
    //         const userS3key = `users/${userId}/${fileName}`;

    //         // const fileBuffer = fs.readFileSync(tempFilePath);
    //         const fileBuffer = await fs.promises.readFile(tempFilePath);
    //         //const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    //         const fileUrl = await this.awsService.uploadFile(userBucketName, userS3key, fileBuffer, file.mimetype);

    //         // Delete the temporary file
    //         await unlinkAsync(tempFilePath);
    //         await Users.update({ profileUrl: fileUrl }, { where: { id: userId } })
    //         // const signedUrl = await this.awsService.provideAccessToPrivateObject(fileUrl);
    //         return fileUrl;
    //     } catch (error) {
    //         // Delete the temporary file in case of failure
    //         if (fs.existsSync(tempFilePath)) {
    //             await unlinkAsync(tempFilePath);
    //         }
    //         console.error('[profileUpload] Failed to upload user profile', error);
    //         throw new CustomError(500, 'Failed to upload user profile');
    //     }
    // }
}
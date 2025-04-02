// S3UploadService.ts
import * as AWS from 'aws-sdk';
import { Readable } from 'stream';
import CustomError from '../errors/customError';

export class AwsService {
    private s3: AWS.S3;

    constructor() {
        this.s3 = new AWS.S3({
            region: process.env.S3_AWS_DEFAULT_REGION, // Replace with your S3 bucket region
            accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID, // Replace with your access key ID
            secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY, // Replace with your secret access key
        });
    }

    hexToBase64(hexString) {
        return Buffer.from(hexString, 'hex').toString('base64');
    }

    /**
     * Uploads a file to AWS S3.
     * @param bucketName The name of the bucket where the file will be uploaded.
     * @param key The key for the uploaded file in S3 (including any desired path).
     * @param body The content of the file to upload. Can be a Buffer, a String, or a Readable stream.
     * @param contentType The MIME type of the file being uploaded.
     * @returns The URL of the uploaded file.
     */
    async uploadFile(
        bucketName: string,
        key: string,
        body: Buffer | Readable | string,
        contentType: string
    ): Promise<string> {
        try {
            const uploadParams: AWS.S3.PutObjectRequest = {
                Bucket: bucketName,
                Key: key,
                Body: body,
                ContentType: contentType,
                ACL: 'public-read',
            };

            await this.s3.upload(uploadParams).promise();

            return `https://${bucketName}.s3.${this.s3.config.region}.amazonaws.com/${key}`;
        } catch (error) {
            console.log("[AWS uploadFile] Failed to uplaod file on aws");
            throw new CustomError(500, `Failed to upload file on aws ${error}`)
        }
    }

    /**
    * Downloads a file from AWS S3.
    * @param bucketName The name of the bucket from which the file will be downloaded.
    * @param key The key of the file in S3 to download.
    * @returns A promise that resolves with the file content as a Buffer.
    */
    async downloadFile(bucketName: string, key: string): Promise<Buffer> {
        const downloadParams: AWS.S3.GetObjectRequest = {
            Bucket: bucketName,
            Key: key,
        };

        try {
            const data = await this.s3.getObject(downloadParams).promise();
            if (data.Body) {
                return data.Body as Buffer; // Ensure Body is treated as a Buffer
            } else {
                throw new CustomError(500, 'File download failed: No data received');
            }
        } catch (error) {
            console.log(`[downloadFile] Failed to download file from S3: ${error}`);
            throw new CustomError(500, `File download failed: No data received ${error}`);
        }
    }

    // Example function to generate a signed URL
    async generateSignedUrl(bucketName: string, objectKey: string) {
        const params = {
            Bucket: bucketName,
            Key: objectKey,
            Expires: 60 * 60 * 24 * 7, // 7 days in seconds
        };

        try {
            const signedUrl = await this.s3.getSignedUrlPromise('getObject', params);
            return signedUrl;
        } catch (error) {
            console.error('Error generating signed URL:', error);
            throw error;
        }
    }

    // Example usage
    async provideAccessToPrivateObject(url?: string) {
        // Example standard URL from the database
        const standardUrl = url || '';
        // Extract bucket name and object key from the standard URL
        const urlParts = new URL(standardUrl);
        const bucketName = urlParts.hostname.split('.')[0];
        const objectKey = urlParts.pathname.substring(1); // Remove leading slash

        // Generate a signed URL
        const signedUrl = await this.generateSignedUrl(bucketName, objectKey);

        return signedUrl;
    }
}

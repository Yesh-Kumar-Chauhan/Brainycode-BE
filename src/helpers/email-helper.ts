import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { SentMessageInfo } from 'nodemailer/lib/smtp-transport';

class EmailHelper {
    private transporter: nodemailer.Transporter<SentMessageInfo>;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com', // Your SMTP server host
            port: 587, // SMTP port
            secure: false,
            auth: {
                user: process.env.SMTP_GMAIL, 
                pass: process.env.SMTP_PASSWORD, 
            },
        });
    }

    public async sendEmail(recipient: string,
        subject: string,
        templateName: string,
        replacements?: Record<string, string>,
        attachPDF: boolean = false
    ): Promise<{ pdfBuffer?: Buffer }> {

        const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');

        // Replace placeholders in the template
        if (replacements) {
            for (const key of Object.keys(replacements)) {
                const regex = new RegExp(`\\[${key}\\]`, 'g');
                htmlContent = htmlContent.replace(regex, replacements[key]);
            }
        }

        let attachments: Array<{ filename: string; content: Buffer; }> = [];
        let pdfBuffer: Buffer | undefined;
        // If attachPDF is true, convert HTML content to PDF and prepare attachment
        if (attachPDF) {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(htmlContent);
            pdfBuffer = await page.pdf({ 
                format: 'A4',
                printBackground: true
            });
            await browser.close();

            attachments.push({
                filename: `${templateName}.pdf`,
                content: pdfBuffer,
            });
        }
        // Define the email with the PDF attachment
        const mailOptions = {
            from: process.env.SMTP_GMAIL, // Sender address
            to: recipient, // List of recipients
            subject: subject,
            html: attachPDF ? 'Please find attached your document.' : htmlContent, // Use the HTML content directly if not attaching a PDF
            attachments: attachments,
        };

        // Send the email
        try {
            await this.transporter.sendMail(mailOptions);

            if (attachPDF && pdfBuffer) {
                // Return the PDF buffer if a PDF was attached
                return { pdfBuffer };
            } else {
                // Return empty if no PDF was attached
                return {};
            }
        } catch (error) {
            console.error('Failed to send email with PDF attachment:', error);
            throw error; // Or handle it as needed
        }
    }
}

export default EmailHelper;

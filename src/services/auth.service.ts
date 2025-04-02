// authService.ts
import { Op, WhereOptions } from "sequelize";
import CustomError from "../errors/customError";
import { IUserAttributes } from "../interfaces/userInterface.interface";
import User from "../models/users.model";
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import qs from 'qs';
import UsersCredits from "../models/usersCredit.model";
import EmailHelper from "../helpers/email-helper";
import { AwsService } from "./aws.service";
// import { cognitoHelper } from "../helpers/congnitoHelper";

export class AuthService {
    private awsService: AwsService;

    constructor() {
        this.awsService = new AwsService();
    }

    public async signup(user: IUserAttributes): Promise<User> {
        try {
            const { firstName, lastName, email, password, username, organisation, age, gender, technologies } = user;
            // Example of throwing a custom error
            if (!email) {
                throw new CustomError(400, 'Email and password are required.');
            }

            let condition: WhereOptions<IUserAttributes>[] = [{ email }]
            if (username && username.trim() != '') {
                condition.push({ username })
                // condition = [{ email }, { username }]
            }
            // Check if the email already exists
            const existingUser = await User.findOne({
                where: {
                    [Op.or]: condition,
                },
            });

            if (existingUser) {
                throw new CustomError(400, existingUser.email === email ? 'Email is already exists.' : 'Username is already exists.');
            }

            // Hash the password before storing it
            const hashedPassword = password ? await bcrypt.hash(password, 10) : "";
            // Create a new user with the hashed password
            const newTechnologies = JSON.stringify(technologies)
            let userObj = {
                firstName,
                lastName,
                email,
                organisation,
                password: hashedPassword,
                role: 'user',
                age,
                gender,
                technologies: newTechnologies
            }

            if (username) {
                userObj['username'] = username;
            }

            const newUser = await User.create(userObj)

            await UsersCredits.create({
                userId: newUser.id,
                credits: 5,
            });

            try {
                const emailHelper = new EmailHelper();
                await emailHelper.sendEmail(
                    user.email, //recipient emails
                    'Welcome to brainycode', //template name 
                    'welcome', // Assuming you have welcome.html in your templates folder
                );
            }
            catch (error) {
                console.error('[signup] Failed to send email while signup', error);
                throw new CustomError(500, 'User created but failed to send email while signup');
            }

            return newUser;
        } catch (error) {
            if (error instanceof Error) {
                console.error('[signup] Failed to send email while signup', error);
                throw new CustomError(500, error.message);
            }
            else {
                console.error('[signup] Failed to create user:', error);
                throw new CustomError(500, 'Signup failed');
            }
        }

    }
    
    // public async signup(user: IUserAttributes): Promise<{ newUser: User, isUserCreated: boolean }> {
    //     try {
    //         const { firstName, lastName, email, password, username, organisation, age, gender, technologies } = user;
    //         if (!email) {
    //             throw new CustomError(400, 'Email and password are required.');
    //         }
    //         let condition: WhereOptions<IUserAttributes>[] = [{ email }]
    //         if (username && username.trim() != '') {
    //             condition.push({ username })
    //         }
    //         // Check if the email already exists
    //         const existingUser = await User.findOne({
    //             where: {
    //                 [Op.or]: condition,
    //             },
    //         });

    //         if (existingUser) {
    //             throw new CustomError(400, existingUser.email === email ? 'Email is already exists.' : 'Username is already exists.');
    //         }

    //         // Hash the password before storing it
    //         const hashedPassword = password ? await bcrypt.hash(password, 10) : "";
    //         let isUserCreated: boolean = false;
    //         // Create a new user with the hashed password
    //         const newTechnologies = JSON.stringify(technologies)
    //         let userObj = {
    //             firstName, lastName, email, organisation, password: hashedPassword, role: 'user', age,
    //             gender, technologies: newTechnologies
    //         }

    //         if (username) {
    //             userObj['username'] = username;
    //         }
    //         if (email && password) {
    //             isUserCreated = await cognitoHelper.signUp(email, password);

    //             if (!isUserCreated) {
    //                 throw new CustomError(500, 'Failed to create user in Cognito.');
    //             }
    //         }

    //         const newUser = await User.create(userObj)
    //         await UsersCredits.create({
    //             userId: newUser.id,
    //             credits: 5,
    //         });

    //         try {
    //             const emailHelper = new EmailHelper();
    //             await emailHelper.sendEmail(
    //                 user.email, //recipient emails
    //                 'Welcome to brainycode', //template name 
    //                 'welcome', // Assuming you have welcome.html in your templates folder
    //             );
    //         }
    //         catch (error) {
    //             console.error('[signup] Failed to send email while signup', error);
    //             throw new CustomError(500, 'User created but failed to send email while signup');
    //         }
    //         return { newUser, isUserCreated };
    //     } catch (error) {
    //         if (error instanceof Error) {
    //             console.error('[signup] Failed to send email while signup', error);
    //             throw new CustomError(500, error.message);
    //         }
    //         else {
    //             console.error('[signup] Failed to create user:', error);
    //             throw new CustomError(500, 'Signup failed');
    //         }
    //     }

    // }

    public async signupWithGitHub(code: string): Promise<User> {
        try {
            if (!code) {
                throw new CustomError(400, 'Github code is not found.');
            }
            const tokenResponse = await axios.post<{ access_token: string, token_type: string, scope: string }>(
                'https://github.com/login/oauth/access_token',
                qs.stringify({
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code: code,
                }),
                {
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            const accessToken = tokenResponse.data.access_token;

            // Use the access token to fetch user details from GitHub
            const userResponse = await axios.get('https://api.github.com/user', {
                headers: {
                    Authorization: `token ${accessToken}`,
                },
            });

            const user = userResponse.data;

            const emailResponse = await axios.get('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `token ${accessToken}`,
                },
            });

            const emails = emailResponse.data; // This is an array of email objects
            const primaryEmailObject = emails.find((email: { primary: any; }) => email.primary);
            const primaryEmail = primaryEmailObject ? primaryEmailObject.email : null;

            if (!primaryEmail) {
                throw new CustomError(400, 'Primary email is not found in GitHub account.');
            }

            // Check if the user already exists in the database
            const existingUser = await User.findOne({ where: { email: primaryEmail } });
            if (existingUser) {
                // Return the existing user's details if they already exist
                return existingUser;
            } else {
                // Create a new user if they don't exist
                const userDetails = {
                    firstName: user.login,
                    lastName: '',
                    email: primaryEmail,
                    username: user.login,
                    organisation: '',
                    password: '', // Consider how you handle passwords for OAuth users
                    role: 'user',
                }

                const newUser = await User.create(userDetails);
                await UsersCredits.create({
                    userId: newUser.id,
                    credits: 5,
                });
                return newUser;
            }

        } catch (error) {
            console.error('[signupWithGitHub] Failed to create user:', error);
            throw new CustomError(500, 'Signup with github failed');
        }

    }

    public async signupWithGoogle(userRequest: any): Promise<User> {
        try {
            // Check if the user already exists in the database
            const existingUser = await User.findOne({ where: { email: userRequest.email } });
            if (existingUser) {
                // Return the existing user's details if they already exist
                return existingUser;
            } else {
                // Create a new user if they don't exist
                const userDetails = {
                    firstName: userRequest.given_name,
                    lastName: userRequest.family_name,
                    email: userRequest.email,
                    username: userRequest.name,
                    organisation: '',
                    password: '', // Consider how you handle passwords for OAuth users
                    role: 'user',
                }
                const newUser = await User.create(userDetails);
                await UsersCredits.create({
                    userId: newUser.id,
                    credits: 5,
                });
                return newUser;
            }

        } catch (error) {
            console.error('[signupWithGoogle] Failed to create user:', error);
            throw new CustomError(500, 'Signup with google failed');
        }
    }

    public async signin(email: string, password: string): Promise<{ token: string, user: IUserAttributes } | null> {
        try {
            // Find the user by email
            const user: IUserAttributes | null = await User.findOne({ where: { email } });

            //need to use jwt here and session mangement
            if (!user) {
                throw new CustomError(400, 'User is not registered');
            }

            if (!user?.password) {
                throw new CustomError(400, 'Password is invalid');
            }

            const valid = await bcrypt.compare(password, user?.password);
            if (!valid) {
                throw new CustomError(400, 'Invalid Password');
            }
            const jwtSecretKey = process.env.JWT_SECRET_KEY || 'your_secret_key'
            // Generate JWT token
            const token = jwt.sign({ userId: user.id }, jwtSecretKey, { expiresIn: '1h' });

            // Omit the password from the user object before sending it in the response
            if(user.profileUrl){
                const signedUrl = await this.awsService.provideAccessToPrivateObject(user.profileUrl)
                user.profileUrl = signedUrl;
            }
            const { password: userPassword, ...userWithoutPassword } = user;
            return { token, user: userWithoutPassword };
        } catch (error) {
            console.error('[signin] Failed to signin', error);
            throw new CustomError(500, 'Failed to signin');
        }

    }

    // public async signin(email: string, password: string): Promise<{ authTokens: {}, user: IUserAttributes } | null> {

    //     // Find the user by email
    //     const user: IUserAttributes | null = await User.findOne({ where: { email } });

    //     //need to use jwt here and session mangement
    //     if (!user) {
    //         throw new CustomError(400, 'User is not registered');
    //     }

    //     if (!user?.password) {
    //         throw new CustomError(400, 'Password is invalid');
    //     }

    //     const valid = await bcrypt.compare(password, user?.password);
    //     if (!valid) {
    //         throw new CustomError(400, 'Invalid Password');
    //     }
    //     const authTokens = await cognitoHelper.login(email, password);
    //     if (!authTokens) {
    //         throw new CustomError(400, 'Authentication failed. Error from Cognito.');
    //     }
    //     // const jwtSecretKey = process.env.JWT_SECRET_KEY || 'your_secret_key'
    //      // Generate JWT token
    //      //const token = jwt.sign({ userId: user.id }, jwtSecretKey, { expiresIn: '1h' });

    //      // Omit the password from the user object before sending it in the response
    //      const { password: userPassword, ...userWithoutPassword } = user;

    //      return { authTokens, user: userWithoutPassword };
    // }

    public async isUserExists(email: string): Promise<boolean> {
        // Find the user by email
        const user: IUserAttributes | null = await User.findOne({ where: { email } });

        //need to use jwt here and session mangement
        if (!user) {
            return false;
        }
        return true;
    }

    public async forgotPassword(body: { email: string }): Promise<{ success: boolean, userId?: string }> {
        try {
            const { email } = body;
            const user: IUserAttributes | null = await User.findOne({ where: { email } });

            //need to use jwt here and session mangement
            if (!user) {
                throw new CustomError(500, 'User Id not found');
            }

            const otp = Math.floor(1000 + Math.random() * 9000);
            await User.update({ otp }, { where: { id: user.id } });

            try {
                const emailHelper = new EmailHelper();
                // Convert the number to a string
                const otpString = otp.toString();

                // Access each digit individually and convert back to a number if necessary
                const digit1 = otpString.charAt(0);
                const digit2 = otpString.charAt(1);
                const digit3 = otpString.charAt(2);
                const digit4 = otpString.charAt(3);

                // Now you have each digit in a separate variable
                console.log(digit1, digit2, digit3, digit4);
                const details: Record<string, string> = {
                    'digit1': digit1,
                    'digit2': digit2,
                    'digit3': digit3,
                    'digit4': digit4,
                    'username': user.firstName
                }
                await emailHelper.sendEmail(
                    body.email, //recipient emails
                    'Forgot password otp', //template name 
                    'otp', // Assuming you have order-confirmation.html in your templates folder
                    details,
                );
            } catch (error) {
                console.error('[forgotPassword] Failed to send email:', error);
                throw new CustomError(500, 'Failed to send otp on mail email');
            }
            return { success: true, userId: user.id };
        } catch (error) {
            console.error('[forgotPassword] Failed to send otp:', error);
            throw new CustomError(500, ' Failed to send otp');
        }
    }

    public async verifyOtp(body: { otp: number }, userId: string): Promise<boolean> {
        try {
            const user: IUserAttributes | null = await User.findOne({ where: { id: userId } });

            //need to use jwt here and session mangement
            if (!user) {
                throw new CustomError(500, 'User Id not found');
            }

            if (body.otp == user.otp) {
                // await User.update({ otp: user.otp }, { where: { id: userId } });
                return true
            }
            return false;
        } catch (error) {
            console.error('[forgotPassword] Failed to send otp:', error);
            throw new CustomError(500, ' Failed to send otp');
        }
    }

    public async resetPassword(body: { password: string }, userId: string): Promise<boolean> {
        try {
            const { password } = body;
            const user: IUserAttributes | null = await User.findOne({ where: { id: userId } });
            //need to use jwt here and session mangement
            if (!user) {
                throw new CustomError(500, 'User Id not found');
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            // try {
            //    await cognitoHelper.resetPassword(user.email, password);
            // } catch (cognitoError) {
            //     console.error('[resetPassword] Failed to reset password in Cognito', cognitoError);
            //     throw new CustomError(500, ' Failed to reset password in Cognito');

            // }
            await User.update({ password: hashedPassword }, { where: { id: userId } })
            return true;
        } catch (error) {
            console.error('[resetPassword] Failed to reset password', error);
            throw new CustomError(500, 'Failed to reset password');
        }
    }

    public async signout(userId: string): Promise<void> {

    }

    public async profileAccount(userId: string, updatedData: IUserAttributes): Promise<User> {
        try {
            // Retrieve the user based on the provided userId
            const existingUser = await User.findOne({
                where: {
                    id: userId,
                },
            });

            // Check if the user exists
            if (!existingUser) {
                throw new CustomError(404, 'User not found.');
            }
            // Update the user profile with the provided data
            await existingUser.update(updatedData);

            // Return the updated user
            return existingUser;
        } catch (error) {
            console.error('Error editing user profile:', error);
            throw new CustomError(500, 'Failed to edit user profile.');
        }
    }




    public async isAllowedChangePassword(body: { currentPassword: string }, userId: string): Promise<boolean> {
        try {
            const { currentPassword } = body;

            const user: IUserAttributes | null = await User.findOne({ where: { id: userId } });

            // Check if the user exists
            if (user && user.password) {
                // Compare the plain text password with the hashed password in the database
                const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
                // If the passwords match, return true; otherwise, throw an error
                if (isPasswordValid) {
                    console.log("isPasswordValid", isPasswordValid);
                    return true;
                } else {
                    throw new CustomError(401, 'Password does not match with your current password');
                }
            } else {
                throw new CustomError(404, 'User not found');
            }
        } catch (error) {
            if(error instanceof Error){
                console.error('[changePassword] Failed to change password', error);
                throw new CustomError(500, error.message);
            }
            else{
                console.error('[changePassword] Failed to change password', error);
                throw new CustomError(500, 'Failed to change password');
            }
        }
    }


    public async newPassword(body: { newPassword: string }, userId: string): Promise<boolean> {
        try {
            const { newPassword } = body;
            const user: IUserAttributes | null = await User.findOne({ where: { id: userId } });

            //need to use jwt here and session mangement
            if (user && user.password) {
            const isMatch = await bcrypt.compare(newPassword, user.password);

            if (isMatch) {
                throw new CustomError(400, 'New password must be different from the old password');
            }else{

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await User.update({ password: hashedPassword }, { where: { id: userId } })

            return true;
            }
        }else {
            throw new CustomError(404, 'User not found');
        }
        } catch (error) {       
        if(error instanceof Error){
            console.error('[newPassword] Failed to generate password', error);
            throw new CustomError(500, error.message);
        }
        else{
            console.error('[newPassword] Failed to to generate password', error);
            throw new CustomError(500, 'Failed to to generate password');
        }
    }
    }


}


import * as AWS from "aws-sdk";
import dotenv from 'dotenv';
import { cognitoConfig } from "../config/cognito.config";
import {COGNITO_CONSTANTS} from "../constants/cognito.constant";
import { utils } from "../utils/common";
AWS.config.region = "us-east-1";


const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || '';
const USER_POOL_CLIENT_SECRET = process.env.USER_POOL_CLIENT_SECRET || '';

dotenv.config();
class CognitoHelper {
  cognito: AWS.CognitoIdentityServiceProvider;

  constructor() {
    this.cognito = new AWS.CognitoIdentityServiceProvider();
  }

  async login(emailId: string, password: string): Promise<any> {
    try {
      const loginParams = this._getLoginParams(emailId, password);
      const response = await this.cognito.adminInitiateAuth(loginParams).promise();
      const userParams = this._getUserParams(emailId);
      const userDetails = await this.cognito.adminGetUser(userParams).promise();

      const userEmailVerified = userDetails.UserAttributes?.find(
        (userAttr: any) =>
          userAttr.Name === COGNITO_CONSTANTS.USER_ATTRIBUTES.EMAIL_VERIFIED
      );

      (response.AuthenticationResult as { [key: string]: any })["emailVerified"] = userEmailVerified?.Value;
      return response.AuthenticationResult;
    } catch (error) {
      console.log("ERROR: ", error);
      return undefined;
    }
  }

  async signUp(emailId: string, password: string): Promise<boolean> {
    try {
      const createUserParams = this._getCreateUserParams(emailId);
      console.log("createUserParams", createUserParams);
      const response = await this.cognito
        .adminCreateUser(createUserParams)
        .promise();

      if (response.User) {
        const paramsForSetPass = this._getSetUserPasswordParams(
          emailId,
          password
        );
        paramsForSetPass.Permanent = true;
        paramsForSetPass.Password = password;
        await this.cognito.adminSetUserPassword(paramsForSetPass).promise();
      } else {
        console.log("ERROR: Failed to create user. ", response);
        throw new Error("Failed to create user");
      }
      return true;
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
            throw new Error(error.message);
          } else {
            // Handle the case where error is not an Error object
            console.log(error);
            throw new Error('An unknown error occurred');
          }
    }
  }

  // async resetPassword(emailId: string, newPassword: string): Promise<void> {
  //   try {
  //     const resetPasswordParams = this._getResetPasswordParams(emailId, newPassword);
  //     await this.cognito.adminSetUserPassword(resetPasswordParams).promise();
  //   } catch (error) {
  //     console.error('[CognitoHelper] Failed to reset password in Cognito', error);
  //     throw new Error('Failed to reset password in Cognito');
  //   }
  // }
  // private _getResetPasswordParams(emailId: string, newPassword: string): any {
  //   return {
   //   // UserPoolId: cognitoConfig.USER_POOL_ID,
   // UserPoolId: process.env.USER_POOL_ID,
  //     Username: emailId,
  //     Password: newPassword,
  //   };
  // }

  private _getLoginParams(emailId: string, password: string): any {
    return {
      AuthFlow: COGNITO_CONSTANTS.AUTH_TYPES.ADMIN_USER_PASSWORD_AUTH,
      // UserPoolId: cognitoConfig.USER_POOL_ID,
      UserPoolId:  process.env.USER_POOL_ID,
      // ClientId: cognitoConfig.USER_POOL_CLIENT_ID,
      ClientId:  USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: emailId,
        PASSWORD: password,
        SECRET_HASH: utils.getCognitoSecretHash(
          emailId,
          // cognitoConfig.USER_POOL_CLIENT_ID,
          USER_POOL_CLIENT_ID,
          // cognitoConfig.USER_POOL_CLIENT_SECRET
          USER_POOL_CLIENT_SECRET
        ),
      },
    };
  }

  private _getCreateUserParams(emailId: string): any {
    const verificationCode =
      utils.generateVerificationCode().toString();
    const createUserParams = {
      // UserPoolId: cognitoConfig.USER_POOL_ID,
      UserPoolId:  process.env.USER_POOL_ID,
      Username: emailId,
      MessageAction: COGNITO_CONSTANTS.MESSAGE_ACTIONS.SUPPRESS,
      DesiredDeliveryMediums: [COGNITO_CONSTANTS.DELIVERY_MEDIUM.EMAIL],
      UserAttributes: [
        {
          Name: "email",
          Value: emailId,
        },
        {
          Name: COGNITO_CONSTANTS.USER_ATTRIBUTES.EMAIL_VERIFIED,
          Value: "true",
        },
        {
          Name: COGNITO_CONSTANTS.USER_ATTRIBUTES.CUSTOM_VERIFICATION_CODE,
          Value: verificationCode,
        },
      ],
      TemporaryPassword: verificationCode,
    };
    return createUserParams;
  }

  private _getUserParams(emailId: string): any {
    return {
      // UserPoolId: cognitoConfig.USER_POOL_ID,
      UserPoolId:  process.env.USER_POOL_ID,
      Username: emailId,
    };
  }

  private _getSetUserPasswordParams(emailId: string, password: string): any {
    return {
      Password: password,
      // UserPoolId: cognitoConfig.USER_POOL_ID,
      UserPoolId:  process.env.USER_POOL_ID,
      Username: emailId,
      Permanent: true,
    };
  }
}
const cognitoHelper = new CognitoHelper();
export { cognitoHelper };

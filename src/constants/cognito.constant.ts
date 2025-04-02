export const COGNITO_CONSTANTS = {
    AUTH_TYPES: {
      ADMIN_USER_PASSWORD_AUTH: "ADMIN_USER_PASSWORD_AUTH",
      REFRESH_TOKEN_AUTH: "REFRESH_TOKEN_AUTH",
      ADMIN_NO_SRP_AUTH: 'ADMIN_NO_SRP_AUTH', 
    },
    DELIVERY_MEDIUM: {
      EMAIL: "EMAIL",
    },
    MESSAGE_ACTIONS: {
      SUPPRESS: "SUPPRESS",
      RESEND: "RESEND",
    },
    USER_ATTRIBUTES: {
      EMAIL_VERIFIED: "email_verified",
      CUSTOM_VERIFICATION_CODE: "custom:verification_code",
      CUSTOM_TEMP_PASSWORD: "custom:temp_password",
    },
    VERIFY_TOKEN_STATUS: {
      SUCCESS: "SUCCESS",
      ERROR: "ERROR",
    },
    CHALLENGE_NAMES: {
      NEW_PASSWORD_REQUIRED: 'NEW_PASSWORD_REQUIRED',  // Add this line
    },
  };
  
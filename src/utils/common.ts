import { HmacSHA256 ,enc} from "crypto-js";

export const utils = {
  checkPathParams: (event: any, path: string, params: string[], context: any): boolean => {
    if (event.path === path) {
      if (params) {
        for (const item of params) {
          if (event.pathParameters && event.pathParameters[item]) {
            return true;
          } else {
            context.fail("missing param : " + item);
            return false;
          }
        }
      }
      return true; 
    }
    return false;
  },

  // validate that a string is a positive integer
  isNormalInteger: (str: string): boolean => {
    return /^\+?(0|[1-9]\d*)$/.test(str);
  },

  buildLimitOffsetFromQueryParams: (queryParams: any, noDefaultLimit?: boolean): string => {
    let limitSql = "";
    let offsetSql = "";
    if (queryParams) {
      if (utils.isNormalInteger(queryParams.limit)) {
        limitSql = " LIMIT " + queryParams.limit;
      }
      if (utils.isNormalInteger(queryParams.offset)) {
        offsetSql = " OFFSET " + queryParams.offset;
      }
    }
    // apply default limit
    if (!limitSql && !noDefaultLimit) {
      limitSql = " LIMIT 50";
    }
    return limitSql + offsetSql;
  },

  getCognitoSecretHash: (username: string, clientId: string, clientSecret: string): string => {
    return enc.Base64.stringify(HmacSHA256(username + clientId, clientSecret));
  },

  generateVerificationCode: (): number => {
    return Math.floor(100000 + Math.random() * 900000);
  },

  validateDate: (dateStr: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateStr.match(regex) === null) {
      return false;
    }
    const date = new Date(dateStr);
    const timestamp = date.getTime();
    if (typeof timestamp !== "number" || Number.isNaN(timestamp)) {
      return false;
    }
    return date.toISOString().startsWith(dateStr);
  },

 
};

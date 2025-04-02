// import { NextFunction, Request, Response } from 'express';
// import * as jwt from 'jsonwebtoken';
// import { JwtPayload } from 'jsonwebtoken';

// export interface CustomRequest extends Request {
//     token: string | JwtPayload;
// }


// const verifyToken = (req: Request, res: Response, next: NextFunction) => {
//     const token = req.headers['authorization'];

//     if (!token) {
//         return res.status(403).json({ message: 'A token is required for authentication' });
//     }

//     try {
//         const jwtSecretKey = process.env.JWT_SECRET_KEY || 'your_secret_key'
//         // Assuming your token is in the format "Bearer <token>"
//         const decodedToken = jwt.verify(token.split(" ")[1], jwtSecretKey);
//         (req as CustomRequest).token = decodedToken;
//         next();
//     } catch (error) {
//         return res.status(401).json({ message: 'Invalid Token' });
//     }
// };

// export { verifyToken };



import { Request, Response, NextFunction } from 'express';
 import CognitoExpress from 'cognito-express';

export default async function (req: Request, res: Response, next: NextFunction) {
  try {
    if (req.headers['authorization'] == undefined) {
      if (req.headers.authorization == undefined)
        return res.status(401).json({ msg: 'unauthorized' });
    }

    const bearerHeader = req.headers['authorization'];
    const bearer = bearerHeader.split(' ');
    const token = bearer[1];

    if (!token) return res.status(401).json({ msg: 'authorization denied' });

    const cognitoExpress = new CognitoExpress({
      region: process.env.AWS_DEFAULT_REGION || '',
      cognitoUserPoolId: process.env.USER_POOL_ID || '',
      tokenUse: 'access',
      tokenExpiration: 3600000,
    });

    cognitoExpress.validate(token, function (err: any, response: { username: any; }) {
      if (err) {
        console.log(err);
        res.status(401).json({ msg: 'Token is not valid' });
      } else {
        req = response.username;
        next();
      }
    });
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}


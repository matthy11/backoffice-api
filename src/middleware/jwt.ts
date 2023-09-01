import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.get('authorization');

  if (
    /v1\/push-notifications/.test(req.path) &&
    authorization === process.env.PUBSUB_TOKEN
  ) {
    next();
    return null;
  } else {
    // bearer = Bearer token, get only token
    if (!authorization) {
      return res.status(401).json({ message: 'Missing Authorization header' });
    }

    if (!authorization.startsWith('Bearer')) {
      return res.status(401).json({ message: 'Malformed header' });
    }

    try {
      const token = authorization.split(' ')[1];
      const publicKeyRaw = process.env.PUBLIC_KEY
        ? process.env.PUBLIC_KEY.split('\\n')
        : [];
      const publicKey = Buffer.from(publicKeyRaw.join('\n'));

      const decoded = jwt.verify(token, publicKey);

      (req as any).decoded = decoded;
      next();
      return null;
    } catch (e) {
      // Send unauthorized
      return res.status(401).json({ message: 'Malformed or Invalid token' });
    }
  }
};

export default verifyToken;

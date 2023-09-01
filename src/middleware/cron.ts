import { Request, Response, NextFunction } from 'express';

export default (req: Request, res: Response, next: NextFunction) => {
  // Check if request comes from Google Cloud Cron
  const appengine = req.get('X-Appengine-Cron');

  // If header is present, and is "true", we allow it
  if (appengine === 'true') {
    (req as any).fromCron = true;
    next();
    return null;
  }

  // If not, we return a forbidden error
  return res.sendStatus(403);
};

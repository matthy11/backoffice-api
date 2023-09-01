import { NextFunction, Request, Response, Router } from 'express';
import PushNotificationsController from '../controllers/pushNotifications.controller';

const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const router = Router();
const prefix = '/api/v1/push-notifications';

const topicValidator = async (req: Request, res: Response, next: NextFunction) => {
  const { body: { topic } } = req;

  if (topic && /^[a-zA-Z0-9-_.%]+$/.test(topic)) {
    return next();
  } else {
    return res.sendStatus(400)
  }
}

router.route(prefix + '/multiple')
  .post(multipartMiddleware, PushNotificationsController.sendMultiple);
router.route(prefix + '/subscribe-to-topics')
  .post([multipartMiddleware, topicValidator], PushNotificationsController.subscribeToTopics);
router.route(prefix + '/disable-general-promotions-by-ruts')
  .post(multipartMiddleware, PushNotificationsController.disableGeneralPromotionsByRuts);
router.route(prefix + '/:id')
  .get(PushNotificationsController.getPushNotificationDetail);
router.route("/api/v1/push-notifications/send-massive")
  .post(PushNotificationsController.sendMassive);
router.route("/api/v1/push-notifications/send-topic")
  .post(PushNotificationsController.processSendToTopic);

export default router;

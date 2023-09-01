import * as fs from 'fs';
import { clearRut, readLocalCSV } from '../services/utils';
import logger from '../logger';
import { Request, Response } from 'express';
import rp from 'request-promise';
import { Op } from 'sequelize';
import admin from '../utils/firebase-admin';
import {
  ChekUserTopic,
  FcmToken,
  IChekUserTopic,
  IFcmToken,
  INotificationTopic,
  IPushNotification,
  IPushNotificationMessageError,
  NotificationTopic,
  PushNotification,
  PushNotificationMessage,
  PushNotificationMessageError,
  PushNotificationStatus
} from '../interfaces';

const emoji = require("node-emoji-new");

interface MultipartRequest extends Request {
  files: any;
}

interface PushNotificationMessageError {
  code: string;
  message: string;
}

interface PushNotificationMessage {
  status: string;
  deviceId: string;
  userId: string;
  pushNotificationsMessageError: PushNotificationMessageError;
}

export default class PushNotificationsController {
  static async sendMultiple(req: Request, res: Response) {
    const _req = req as MultipartRequest;
    const { body: { title, body, startAt } } = _req;
    const { files: { file } } = _req;
    const userIds = await readLocalCSV(file.path).then((fileContent) => {
      return fileContent.map(({ ownerid }) => ownerid);
    }).catch(() => {
      return new Error(`CSV reading ${file.path} error`);
    });

    try {
      const requestResponse = await rp.post(
        `${process.env.DATA_URI}/trans-api/api/v1/push-notifications/multiple`,
        {
          json: true,
          headers: { Authorization: req.get('authorization') },
          body: {
            userIds,
            title,
            body,
            startAt,
          }
        }
      );

      fs.unlinkSync(file.path);
      return res.json(requestResponse);
    } catch (e) {
      logger.error('[PushNotificationsController:sendMultiple] error', e);
      return res.sendStatus(500);
    }
  }

  static async subscribeToTopics(req: Request, res: Response) {
    const _req = req as MultipartRequest;
    const { body: { topic } } = _req;
    const { files: { file } } = _req;
    const ruts = await readLocalCSV(file.path).then((fileContent) => {
      return fileContent.map(({ nationalid }) => clearRut(nationalid));
    }).catch(() => {
      return new Error(`CSV reading ${file.path} error`);
    });

    try {
      const requestResponse = await rp.post(
        `${process.env.DATA_URI}/trans-api/api/v1/push-notifications/subscribe-to-topics`,
        {
          json: true,
          headers: { Authorization: req.get('authorization') },
          body: {
            ruts,
            topic,
          }
        }
      );

      fs.unlinkSync(file.path);
      return res.json(requestResponse);
    } catch (e) {
      logger.error('[PushNotificationsController:sendMultiple] error', e);
      return res.sendStatus(500);
    }
  }

  static async disableGeneralPromotionsByRuts(req: Request, res: Response) {
    const _req = req as MultipartRequest;
    const { files: { file } } = _req;
    const ruts = await readLocalCSV(file.path).then((fileContent) => {
      return fileContent.map(({ nationalid }) => clearRut(nationalid));
    }).catch(() => {
      return new Error(`CSV reading ${file.path} error`);
    });

    try {
      const requestResponse = await rp.post(
        `${process.env.DATA_URI}/trans-api/api/v1/push-notifications/disable-general-promotions-by-ruts`,
        {
          json: true,
          headers: { Authorization: req.get('authorization') },
          body: {
            ruts,
          }
        }
      );

      fs.unlinkSync(file.path);
      return res.json(requestResponse);
    } catch (e) {
      logger.error('[PushNotificationsController:disableGeneralPromotionsByRuts] error', e);
      return res.sendStatus(500);
    }
  }

  static async getPushNotificationDetail(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const requestResponse: PushNotificationMessage[] = await rp.get(
        `${process.env.DATA_URI}/trans-api/api/v1/push-notifications/${id}`,
        {
          json: true,
          headers: { Authorization: req.get('authorization') },
        }
      );

      res.setHeader('Content-type', 'application/octet-stream');
      res.setHeader('Content-disposition', 'attachment; filename=file.txt');

      const fileContentResult = [
        `Estado;Token;"ID usuario";"Codigo de error";"Error detallado"`,
        ...requestResponse.map(({ status, deviceId, userId , pushNotificationsMessageError}) => {
          let errorData = ';';
          if (pushNotificationsMessageError) {
            errorData = `"${pushNotificationsMessageError.code}";"${pushNotificationsMessageError.message}"`;
          }
          return `${status};${deviceId};${userId};${errorData}`;
        })
      ].join('\n');

      return res.send(fileContentResult);
    } catch (e) {
      logger.error('[PushNotificationsController:getPushNotificationDetail] error', e);
      return res.sendStatus(500);
    }
  }

  static async sendMassive(req: Request, res: Response) {
    const body: { pushNotificationId: number, userIds: string[], groupId: number } = req.body;
    const pushNotification = await PushNotification.findOne({
      where: {
        id: body.pushNotificationId,
      }
    });
    let successTotalCount = 0;
    let failureTotalCount = 0;

    res.sendStatus(200);

    if (pushNotification) {
      try {
        logger.info('pushNotification ' + pushNotification.id + ' found');
        // Find fcmToken of userIds
        const titleEmojify = emoji.emojify(pushNotification.title);
        const bodyEmojify = emoji.emojify(pushNotification.body);
        const createdPushNotificationDic: { [key: string]: boolean } = {};
        const tokens: IFcmToken[] = await FcmToken.findAll({
          attributes: ['id', 'userId'],
          where: {
            userId: {
              [Op.in]: body.userIds
            },
            active: true,
          },
        });
        logger.info(`push notification ${pushNotification.id}, ${tokens.length} tokens found`);

        if (tokens.length) {
          const tokensArr: IFcmToken[][] = [];

          // Separate all tokens in groups off 500 elements
          for (let i = 0; i < tokens.length; i++) {
            if (i % 499 === 0) {
              tokensArr.push([]);
            }
            tokensArr[tokensArr.length - 1].push(tokens[i]);
          }

          // Create pushNotificationMessage of fcmToken founded
          await PushNotificationMessage.bulkCreate(
            tokens.map((fcmToken) => {
              createdPushNotificationDic[fcmToken.userId] = true;
              return {
                deviceId: fcmToken.id,
                userId: fcmToken.userId,
                pushNotificationId: pushNotification.id,
                status: PushNotificationStatus.PENDING,
              };
            })
          );
          logger.info('pushNotificationMessages created!.');

          for (let i = 0; i < tokensArr.length; i++) {
            // Send donePushNotificationMessages
            logger.info('Sending ' + tokensArr[i].length + ' push notifications!');
            const { responses } = await admin.messaging()
              .sendAll(
                tokensArr[i].map((token) => {
                  return {
                    notification: {
                      title: titleEmojify,
                      body: bodyEmojify,
                    },
                    token: token.id,
                  };
                })
              );

            logger.info(`push notification ${pushNotification.id}, ${responses.length} fcm responses`);

            // Map responses and set FAILURE OR SUCCESS STATUS
            const responsesQuantity = responses.length;
            for (let j = 0; j < responsesQuantity; j++) {
              const response = responses[j];
              let pushNotificationMessageError: IPushNotificationMessageError;

              if (!response.success && response.error) {
                const pushNotificationMessageErrorEntity = await PushNotificationMessageError.findOrCreate({
                  where: {
                    code: response.error.code,
                    message: response.error.message,
                  }
                });
                pushNotificationMessageError = pushNotificationMessageErrorEntity[0];
                if (tokensArr[i] && tokensArr[i][j]) {
                  await PushNotificationMessage.update({
                    status: PushNotificationStatus.FAILURE,
                    pushNotificationErrorId: pushNotificationMessageError.id,
                  }, {
                    where: {
                      pushNotificationId: body.pushNotificationId,
                      deviceId: tokensArr[i][j].id,
                    }
                  });
                }
              } else if(tokensArr[i] && tokensArr[i][j]) {
                await PushNotificationMessage.update({
                  status: PushNotificationStatus.SUCCESS,
                }, {
                  where: {
                    pushNotificationId: body.pushNotificationId,
                    deviceId: tokensArr[i][j].id,
                  }
                });
              }
            }
          }

          logger.info('All pushNotificationMessages status updated!');
        }

        const failureUserIds = body.userIds.filter((userId: string) => !createdPushNotificationDic[userId]);
        logger.info(failureUserIds.length + ' pushNotifications failures');
        if (failureUserIds.length) {
          // Create PushNotificationMessage of userId not founded
          failureTotalCount += failureUserIds.length;
          successTotalCount += body.userIds.length - failureUserIds.length;
          const pushNotificationMessageErrorEntity = await PushNotificationMessageError.findOrCreate({
            where: {
              code: 'user-not-found',
              message: 'User ID not found',
            }
          });

          await PushNotificationMessage.bulkCreate(
            failureUserIds.map((userId) => {
              return {
                status: PushNotificationStatus.FAILURE,
                deviceId: '',
                userId: userId,
                pushNotificationId: pushNotification.id,
                pushNotificationErrorId: pushNotificationMessageErrorEntity[0].id,
              };
            })
          );
          logger.info(`push notification ${pushNotification.id}, not found error logged`);

          await pushNotification.update({
            status: PushNotificationStatus.FAILURE,
          });
        } else {
          await pushNotification.update({
            status: failureTotalCount ? PushNotificationStatus.FAILURE : PushNotificationStatus.SUCCESS,
          });
        }
        await pushNotification.increment({
          'failureCount': failureTotalCount,
          'successCount': successTotalCount,
        });
      } catch (e) {
        logger.error(`pushNotification error, ${e.message}`);
      }
    } else {
      logger.error(`pushNotification ${body.pushNotificationId} not found.`);
    }

    logger.info('pushNotification process completed, group ID ' + body.groupId);
  }

  static async sendToTopic(processedNotification: IPushNotification) {
    const { id, title, body, topic } = processedNotification;
    const titleEmojify = emoji.emojify(title);
    const bodyEmojify = emoji.emojify(body);

    // Send notification to users subscribed to topic
    const sendToTopicResponse = await admin.messaging().sendToTopic(topic, {
      notification: {
        title: titleEmojify,
        body: bodyEmojify,
      }
    });

    await PushNotification.update({
      status: PushNotificationStatus.SUCCESS,
    }, {
      where: {
        id: processedNotification.id,
      }
    });

    logger.info(JSON.stringify({
      pushNotificationId: id,
      sendToTopicResponse,
    }));
  }

  static async processSendToTopic(req: Request, res: Response) {
    const body: { pushNotificationId: number, topic: string } = req.body;
    const pushNotification = await PushNotification.findOne({
      where: {
        id: body.pushNotificationId,
      }
    });
    res.sendStatus(200);

    if (pushNotification) {
      await PushNotificationsController.sendToTopic(pushNotification);
      logger.info('PushNotification Topic ' + pushNotification.id + ' send!');

      const notificationTopic: INotificationTopic | null = await NotificationTopic.findOne({
        where: {
          name: pushNotification.topic,
        }
      });

      if (notificationTopic) {
        const users: IChekUserTopic[] = await ChekUserTopic.findAll({
          where: {
            notificationTopicId: notificationTopic.id,
          },
        });
        const usersLength = users.length;

        for (let i = 0; i < usersLength; i++) {
          const user: IChekUserTopic = users[i];
          const defaults = {
            userId: user.chekUserId,
            pushNotificationId: pushNotification.id,
            deviceId: '',
          };
          await PushNotificationMessage.findOrCreate({
            where: defaults,
            defaults: {
              ...defaults,
              status: PushNotificationStatus.SUCCESS,
            },
          });
        }

        await PushNotification.update({
          status: PushNotificationStatus.SUCCESS,
          successCount: users.length,
        }, {
          where: {
            id: pushNotification.id,
          }
        });
      } else {
        await PushNotification.update({
          status: PushNotificationStatus.FAILURE
        }, {
          where: {
            id: pushNotification.id,
          }
        });
        logger.error(`${pushNotification.id} failed, notificationTopic ${pushNotification.topic} not found.`);
      }
    } else {
      logger.error(`pushNotification ${body.pushNotificationId} not found.`);
    }
  }
}

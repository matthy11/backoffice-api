import { Request, Response } from 'express';
import rp from 'request-promise';
import logger from '../logger';
import { uploadFile } from '../services/cupon-file-manager';
interface MultipartRequest extends Request {
  files: any;
}
export default class CouponsController {
  static async createCampaign(req: Request, res: Response) {
    const _req = req as MultipartRequest;
    const { body: { name, type, allocationType, code, startAt, expiration, topicsIds = [] } } = _req;
    const { files: { file } } = _req;

    try {
      const requestResponse = await rp.post(
        `${process.env.DATA_URI}/trans-api/api/v1/coupons/coupon-campaign`,
        {
          json: true,
          headers: { Authorization: req.get('authorization') },
          body: {
            name,
            type,
            allocationType,
            code,
            startAt,
            expiration,
            topicsIds: [].concat(topicsIds)
          }
        }
      );

      res.json(requestResponse);

      uploadFile(file.path, requestResponse.id);
    } catch (e) {
      logger.error('[CouponsController:createCampaign] error', e);
      res.sendStatus(500);
    }
  }
}

import CouponsController from '../controllers/coupons.controller';
import { Router } from 'express';

const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const router = Router();
const prefix = '/api/v1/coupons';

router.route(prefix + '/coupon-campaign')
  .post(multipartMiddleware, CouponsController.createCampaign);

export default router;

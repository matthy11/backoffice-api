import NormativesController from '../controllers/normatives.controller';
import express from 'express';

const router = express.Router();

router.post('/api/v1/normatives/p41', NormativesController.normativeP41);
router.post(
  '/api/v1/normatives/balances',
  NormativesController.normativeBalances
);

export default router;

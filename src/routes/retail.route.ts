import express from 'express';
import RetailController from '../controllers/retail.controller';

const router = express.Router();

router.get('/api/v1/reports/retail', RetailController.generateRetail);
router.post(
  '/api/v1/reports/concilliation',
  RetailController.retailConcilliation
);
router.post('/api/v1/reports/upload', RetailController.uploadToFtp);

export default router;

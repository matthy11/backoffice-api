import express from 'express';
import ExportsController from '../controllers/exports/public.controller';
import cron from './../middleware/cron';
import NormativesController from '../controllers/normatives.controller';
import MonitorController from '../controllers/monitor.controller';

const router = express.Router();

router.get('/api/v1/exports/accounts', cron, ExportsController.accounts);
router.get('/api/v1/exports/cashinout', cron, ExportsController.depositsAndWithdraws);
router.get('/api/v1/normatives/d50', cron, NormativesController.normativeD50);
router.get('/api/v1/reports/api-monitor', cron, MonitorController.generateBodyApiMonitor);
//router.get('/api/v1/reports/auto-monitor', cron, MonitorController.generaterP2P);
//router.get('/api/v1/reports/api-monitor', cron, MonitorController.generateBodyApiMonitor);
router.get('/api/v1/reports/time-zone', cron, MonitorController.testTimezone);

export default router;
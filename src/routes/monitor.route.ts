import express from 'express';
import MonitorController from '../controllers/monitor.controller';

const router = express.Router();

router.post('/api/v1/reports/monitor', MonitorController.generaterP2P);

export default router;

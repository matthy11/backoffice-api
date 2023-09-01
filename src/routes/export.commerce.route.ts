import express from 'express';
import ExportsMovementsController from '../controllers/exports/movements.controller';
import verifyTokenCommerce from '../middleware/commerce-firebase.middleware';
import ExportsStorageFileController from '../controllers/exports/storageFile.controller';

const router = express.Router();
router.post('/api/v1/exports/commerces/movements', verifyTokenCommerce, ExportsMovementsController.commerceMovements);
router.post('/api/v1/exports/commerces/storageFile', verifyTokenCommerce, ExportsStorageFileController.downloadMovementsStorageFile);

export default router;
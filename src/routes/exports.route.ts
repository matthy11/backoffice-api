import express from 'express';
import ExportsMovementsController from '../controllers/exports/movements.controller';
import ExportsUsersController from '../controllers/exports/users.controller';
import ExportsReferralsController from '../controllers/exports/referrals.controller';
import ExportsCommercesController from '../controllers/exports/commerces.controller';
import ExportsStorageFileController from '../controllers/exports/storageFile.controller';
import ExportsCashOutsController from '../controllers/exports/cashouts.controller';

const router = express.Router();

router.post('/api/v1/exports/movements', ExportsMovementsController.accountMovements);
router.post('/api/v1/exports/storageFile', ExportsStorageFileController.downloadStorageFile);
router.post('/api/v1/exports/users', ExportsUsersController.users);
router.post('/api/v1/exports/cashouts', ExportsCashOutsController.massiveDepositFile);
router.post('/api/v1/exports/commerces', ExportsCommercesController.commerces);
router.post('/api/v1/exports/referrals', ExportsReferralsController.referrals);

export default router;

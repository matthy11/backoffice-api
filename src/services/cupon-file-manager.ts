
import { Storage } from '@google-cloud/storage';
import { createReadStream } from 'fs';
import logger from '../logger';

const COUPONS_BUCKET = process.env.COUPONS_BUCKET || '';

const gcs = new Storage();

const couponCampaignBucket = gcs.bucket(COUPONS_BUCKET);

export async function uploadFile(filePath: string, couponCampaignId: number) {
  const filename = `${couponCampaignId}`;
  const readStream = createReadStream(filePath);

  const gcpWriteStream = couponCampaignBucket.file(`${filename}`).createWriteStream({
    resumable: false,
    gzip: true
  });

  readStream.on('open', function () {
    logger.info('[CouponFileManager:uploadFile] uploading file to gcs', { filename })
    readStream.pipe(gcpWriteStream);
  });

  readStream.on('error', function (error) {
    logger.error('[CouponFileManager:uploadFile] error uploading file to gcs', { error, filename })
  });
}

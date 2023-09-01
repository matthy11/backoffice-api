import { Storage } from '@google-cloud/storage';

// In Local (npm run dev), credentials need to be explicit
// when in AppEnginge, there is no need for credentials
// as it search for it in the GCP environment
export const storage = new Storage(
  process.env.NODE_ENV === 'dev'
    ? {
      projectId: 'br-chek-prod',
      keyFilename: 'br-chek-prod.json'
    }
    : {}
).bucket(process.env.BUCKET ?? '');

export const storageCommerce = new Storage(
  process.env.NODE_ENV === 'dev'
    ? {
      projectId: 'br-chek-prod',
      keyFilename: 'br-chek-prod.json'
    }
    : {}
).bucket(process.env.COMMERCE_MOVEMENTS_BUCKET ?? '');

export const monitorStorage = new Storage(
  process.env.NODE_ENV === 'dev'
    ? {
      projectId: 'br-chek-prod',
      keyFilename: 'br-chek-prod.json'
    }
    : {}
).bucket(process.env.MONITOR_BUCKET ?? '');

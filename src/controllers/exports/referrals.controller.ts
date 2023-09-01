import xlsx from 'xlsx';
import rp from 'request-promise';
import moment from 'moment-timezone';
import { Request, Response } from 'express';
import logger from '../../logger';

export default class ExportsReferralsController {
  static async referrals(req: Request, res: Response) {
    const {
      body: { options }
    } = req;
    let referrals = [];
    const wb = xlsx.utils.book_new();
    const startDate = req.body.startDate || null;
    const endDate = req.body.endDate || null;
    const uri = `${process.env.DATA_URI}/trans-api/api/v1/referrals/export`;
    const data: any[] = [];

    try {
      logger.info(`Obteniendo datos desde ${uri}`, options);
      referrals = await rp.post(uri, {
        body: {
          startDate, endDate
        },
        json: true,
        headers: {
          Authorization: req.get('authorization')
        }
      });

    } catch (e) {
      logger.error(`Error al obtener info. ${e.message}`);
      return res.status(500).json({ message: 'Service Error', e });
    }
    if (referrals) {
      referrals.forEach((referred: any) => {
        const createdAt = moment(referred.createdAt).tz('America/Santiago');
        data.push({
          id: referred.accountId || referred.commerceId,
          name: referred.accountInfo ? referred.accountInfo.fullName : '',
          phoneNumber: referred.phoneNumber,
          email: referred.email,
          referredNumber: referred.referredNumber,
          referredId: referred.referredId,
          referredEmail: referred.referredEmail,
          referredName: referred.referredInfo ? referred.referredInfo.fullName : '',
          type: referred.type,
          createdAt: createdAt.format('YYYY-MM-DD HH:mm:ss'),
          year: createdAt.get('year'),
          month: createdAt.get('month') + 1,
          day: createdAt.get('date'),
          hour: createdAt.get('hour'),
          minute: createdAt.get('minute')
        });
      });
    }

    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, 'referidos');
    // xlsx.writeFile(wb, 'out.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'Referidos.xlsx'
    );
    const buffer = xlsx.write(wb, { type: 'buffer' });
    return res.send(Buffer.from(buffer));
  }
}
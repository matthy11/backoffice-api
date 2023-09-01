import xlsx from 'xlsx';
import rp from 'request-promise';
import moment from 'moment-timezone';
import { Request, Response } from 'express';
import logger from '../../logger';

export interface CashOutInfo {
  id: string;
  name: string;
  primaryAccountId: string;
  totalPayments?: string;
  totalRefunds?: string;
  commerceBankAccount?: {
    nationalId: string;
    accountNumber: string;
    bankAccountTypeId: string;
    bankId: string;
  };
}

export default class ExportsCashOutsController {
  static async massiveDepositFile(req: Request, res: Response) {
    const {
      body: {
        options: { startDate: start, endDate: end }
      }
    } = req;

    const startDate = moment(start)
      .tz('America/Santiago')
      .startOf('day')
      .format('YYYY-MM-DD HH:mm:ss.SSSZ');
    const endDate = moment(end)
      .tz('America/Santiago')
      .endOf('day')
      .format('YYYY-MM-DD HH:mm:ss.SSSZ');

    const wb = xlsx.utils.book_new();

    try {
      const uri = `${process.env.DATA_URI}/trans-api/api/v1/reports/cashout`;
      logger.info(`Obteniendo datos desde ${uri}`, {
        options: { startDate, endDate }
      });

      // Should return a length 2 array, the first containing totalPayments
      // the second containing totalRefunds. The objective is to merge both objs
      const {
        cashouts
      }: {
        cashouts: CashOutInfo[][];
      } = await rp.post(uri, {
        json: true,
        headers: {
          Authorization: req.get('authorization')
        },
        body: { options: { startDate, endDate } }
      });

      const payments = cashouts[0];
      const refunds = cashouts[0];

      const merged = payments.map((payment: CashOutInfo) => {
        const refund = refunds.find(
          (refund: CashOutInfo) => refund.id === payment.id
        );
        const totalDeposit =
          parseInt(payment.totalPayments || '0', 10) -
          parseInt(refund?.totalRefunds || '0', 10);
        return {
          ...payment,
          ...payment.commerceBankAccount,
          totalDeposit
        };
      });

      // Create worksheets from Array of Arrays
      const worksheet = xlsx.utils.json_to_sheet(merged);

      // Add worksheets to workbook
      xlsx.utils.book_append_sheet(wb, worksheet, 'Depósitos');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=' + 'Report.xlsx'
      );
      const buffer = xlsx.write(wb, { type: 'buffer' });
      return res.send(Buffer.from(buffer));
    } catch (e) {
      logger.error('Error while getting resource', e.message);
      return res.status(500).json({ message: 'Communication Error' });
    }
  }
}
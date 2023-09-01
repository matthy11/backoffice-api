import { IAccount } from '../../interfaces/Account';
import xlsx from 'xlsx';
import rp from 'request-promise';
import moment from 'moment-timezone';
import { Request, Response } from 'express';
import logger from '../../logger';
import { formatDate } from '../../services/utils';

export default class ExportsCommercesController {
  // Commerce list
  // NOT CURRENTLY IN USE
  static async commerces(req: Request, res: Response) {
    const {
      body: { options }
    } = req;

    let commerces: IAccount[] = [];
    const wb = xlsx.utils.book_new();
    const uri = `${process.env.DATA_URI}/trans-api/api/v1/commerces`;
    const data: any[] = [];

    let page = 1;
    while (true) {
      const params =
        options && options.start && options.end
          ? `?start=${options.start}&end=${options.end}&page=${page}&pageSize=1000`
          : `?page=${page}&pageSize=1000`;
      try {
        logger.info(`Obteniendo datos desde ${uri + params}`, options);
        commerces = await rp.get(uri + params, {
          json: true,
          headers: {
            Authorization: req.get('authorization')
          }
        });
      } catch (e) {
        logger.error(`Error al obtener info. ${e.message}`);
        return res.status(500).json({ message: 'Service Error' });
      }

      page = page + 1;
      if (commerces.length === 0) {
        break;
      }

      commerces.map((commerce: IAccount) => {
        const createdAt = moment(commerce.createdAt).tz('America/Santiago');

        data.push({
          ...commerce,
          createdAt: formatDate(commerce.createdAt),
          updatedAt: formatDate(commerce.updatedAt),
          year: createdAt.get('year'),
          month: createdAt.get('month') + 1,
          day: createdAt.get('date'),
          hour: createdAt.get('hour'),
          minute: createdAt.get('minute')
        });
      });
    }

    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, 'usuarios');
    // xlsx.writeFile(wb, 'out.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'Comercios.xlsx'
    );
    const buffer = xlsx.write(wb, { type: 'buffer' });
    return res.send(Buffer.from(buffer));
  }
}
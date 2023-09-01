import { zeroShift, getHolidaysAdjust } from './../services/utils';
import { IPayment } from './../interfaces';
import { Request, Response } from 'express';
import rp from 'request-promise';
import moment, { Moment } from 'moment-timezone';
import logger from '../logger';
import xlsx from 'xlsx';
import { AccountRepository } from '../repositories';
import { storage } from '../services/storage';

interface INormativeD50 {
  readonly OP: string;
  readonly RUT: string;
  readonly NOMBRE: string;
  readonly TIP_ACREEN: number;
  readonly TIP_CLI: number;
  readonly N_ABONOS: number;
  readonly M_ABONOS?: number;
  readonly N_CARGOS: number;
  readonly M_CARGOS?: number;
  readonly saldo: number;
}

class NormativesController {
  static async normativeP41(req: Request, res: Response) {
    const {
      body: { month }
    } = req;

    const startDate = moment(month)
      .tz('America/Santiago')
      .startOf('month');
    const endDate = moment(month)
      .tz('America/Santiago')
      .endOf('month');

    let p2p: IPayment[];
    let p2c: IPayment[];
    try {
      const uri = `${process.env.DATA_URI}/trans-api/api/v1/reports`;
      logger.info(`Getting data from ${uri}`, { startDate, endDate });
      const p2pPromise = rp.post(uri + '/p2p', {
        json: true,
        headers: { Authorization: req.get('authorization') },
        body: {
          options: { startDate, endDate }
        }
      });

      const p2cPromise = rp.post(uri + '/p2c', {
        json: true,
        headers: { Authorization: req.get('authorization') },
        body: {
          options: { startDate, endDate }
        }
      });

      [p2p, p2c] = await Promise.all([p2pPromise, p2cPromise]);
    } catch (e) {
      logger.error('Could not get info', e);
      return res.sendStatus(500);
    }

    const p2pLength = p2p.length;
    const p2cLength = p2c.length;
    const p2pSumAmounts = p2p.reduce(sumAmounts, 0);
    const p2cSumAmounts = p2c.reduce(sumAmounts, 0);
    const p2pNumber = zeroShift(7)(p2pLength);
    const p2cNumber = zeroShift(7)(p2cLength);
    const totalNumber = zeroShift(7)(p2pLength + p2cLength);
    const p2pAmount = zeroShift(12)(p2pSumAmounts);
    const p2cAmount = zeroShift(12)(p2cSumAmounts);
    const totalAmount = zeroShift(12)(p2pSumAmounts + p2cSumAmounts);

    const file: string[] = [];

    file.push(['P2C', p2cNumber, p2cAmount].join(' '));
    file.push(['P2P', p2pNumber, p2pAmount].join(' '));
    file.push(['   ', totalNumber, totalAmount].join(' '));

    res.setHeader('Content-type', 'application/octet-stream');
    res.setHeader('Content-disposition', 'attachment; filename=file.txt');

    return res.send(file.join('\n'));
  }

  static async normativeBalances(req: Request, res: Response) {
    const {
      body: { options }
    } = req;

    let usersAggregate: any;
    let commercesAggregate: any;
    const endDate = moment(options.endDate)
      .tz('America/Santiago')
      .endOf('day');

    try {
      // Only endDate is actually neccesary for endpoints, as we get total accounts
      // createdAt <= endDate
      // not those created in an interval (startDate <= createdAt <= endDate)
      const userPromise = rp.post(
        `${process.env.DATA_URI}/trans-api/api/v1/users/usersAggregate`,
        {
          json: true,
          headers: { Authorization: req.get('authorization') },
          body: {
            options: { endDate }
          }
        }
      );

      const commercesPromise = rp.post(
        `${process.env.DATA_URI}/trans-api/api/v1/commerces/aggregate`,
        {
          json: true,
          headers: { Authorization: req.get('authorization') },
          body: {
            options: { endDate }
          }
        }
      );

      [usersAggregate, commercesAggregate] = await Promise.all([
        userPromise,
        commercesPromise
      ]);
    } catch (e) {
      logger.error('Could not get info', e);
      return res.sendStatus(500);
    }

    const shift10 = zeroShift(10);
    const shift12 = zeroShift(12);

    const usersBalance = usersAggregate.balances[0].total;
    const totalUsers = usersAggregate.users;

    const commercesBalance = commercesAggregate.totalBalance.totalAmount;
    const totalCommerces = commercesAggregate.total;

    const totalAccounts = totalUsers + totalCommerces;
    const totalBalances =
      parseInt(usersBalance, 10) + parseInt(commercesBalance, 10);

    const file: string[] = [
      ['Usuarios ', shift10(totalUsers), shift12(usersBalance)].join(' '),
      ['Comercios', shift10(totalCommerces), shift12(commercesBalance)].join(
        ' '
      ),
      ['Total    ', shift10(totalAccounts), shift12(totalBalances)].join(' ')
    ];

    res.setHeader('Content-type', 'application/octet-stream');
    res.setHeader('Content-disposition', 'attachment; filename=file.txt');

    return res.send(file.join('\n'));
  }

  // NOT CURRENTLY USED: MOVED TO tf-cl-backoffice-api-go
  static async normativeD50(_: Request, res: Response) {
    // starts by sending to cron job to avoid timeouts
    res.sendStatus(200);

    const wb = xlsx.utils.book_new();

    const processDate = moment().tz('America/Santiago');
    const previousMonth = processDate.clone().subtract(1, 'month');
    const processDateFormatted = processDate.format('YYYY-MM-DD');
    logger.info('Generando normativo D50', { processDate: processDateFormatted });

    const pageSize = 1000;

    const { startDate, endDate } = getNormativeMonthRange(previousMonth.clone());

    let accountsWorksheetData: INormativeD50[] = [];
    let lastId: string | undefined;
    while (true) {
      const accounts = await AccountRepository.getNormativeD50(startDate, endDate, pageSize, lastId);
      if (accounts.length === 0) {
        break;
      }
      accountsWorksheetData = [
        ...accountsWorksheetData,
        ...accounts.map(account => {
          // this is to keep the ordering while parsing some inputs
          const json = account.toJSON() as INormativeD50;
          const formatAndClean = (name: string) => formatName(name.split('|').map(cleanName).join('|'));
          let name = '';
          const { ownerInfo } = account;
          if (account.ownerType !== 'commerce' && ownerInfo) {
            const secondLastName = ownerInfo.secondLastName ?? 'XNOSLNX';
            name = `${ownerInfo.lastName}|${secondLastName}|${ownerInfo.firstName}`
          }
          return {
            RUT: json.RUT,
            NOMBRE: account.ownerType === 'commerce' ?
              cleanName(account.commerceInfo?.name || '') :
              formatAndClean(name),
            OP: json.OP,
            TIP_ACREEN: json.TIP_ACREEN,
            TIP_CLI: json.TIP_CLI,
            N_ABONOS: json.N_ABONOS,
            M_ABONOS: json.M_ABONOS ?? 0,
            N_CARGOS: json.N_CARGOS,
            M_CARGOS: json.M_CARGOS ?? 0,
            saldo: json.saldo
          } as INormativeD50
        })
      ];
      lastId = (accounts[accounts.length - 1].toJSON() as INormativeD50).OP;
    };

    const accountsWorksheet = xlsx.utils.json_to_sheet(accountsWorksheetData);
    xlsx.utils.book_append_sheet(wb, accountsWorksheet);
    const buffer = xlsx.write(wb, { type: 'buffer' });
    const filename = `normativos/normativo_d50-${processDate.subtract(1, 'month').format('YYYY-MM')}.xlsx`
    const file = storage.file(filename);
    try {
      await file.save(buffer);
      logger.info('Archivo guardado correctamente.', { processDate: processDateFormatted });
    } catch (error) {
      logger.error('Archivo no subido', { processDate: processDateFormatted, error });
    }
    return;
  }
}

const sumAmounts = (acc: number, current: IPayment) => {
  return acc + current.amount;
};

export const getNormativeMonthRange = (month: Moment): { startDate: Moment; endDate: Moment } => {
  // actual month range
  const startDate = month.clone().startOf('month').startOf('day').add(14, 'hours');
  const endDate = month.clone().endOf('month').startOf('day').add(14, 'hours');

  // adjust startDate to banking month and holidays
  const startDateAdjust = getHolidaysAdjust(startDate.clone().subtract(1, 'day'));
  startDate.subtract(startDateAdjust, 'day');

  // adjust end of month if it falls in holiday/weekend
  // we subtract 1 because we are checking the same day and there wont be any adjust
  const endDateAdjust = getHolidaysAdjust(endDate.clone()) - 1;
  endDate.subtract(endDateAdjust, 'day');

  return { startDate, endDate }
}

export const cleanName = (name?: string): string => {
  if (!name) {
    return '';
  }
  return name
    .toLocaleUpperCase() // brings to uppercase
    .normalize("NFD") // transform ñ into n~ and é into e´
    .replace(/[\u0300-\u036f]/g, '') // clean those ~ `, ´ and ¨ if any
    .replace(/[^a-zA-Z0-9]/g, ' ') // replaces any other special character with a space, eg "a@a.com" -> "a a com"
    .replace(/ +/g, ' ') // replaces multiple spaces with a single one
    .trim(); // removes any residual trailing or leading spaces
}

// Name has to have LASTNAME|SECONDLASTNAME|NAME SECONDNAME format
// SECONDLASTNAME and SECONDNAME can be missing
export const formatName = (name?: string): string => {
  if (!name) {
    return '';
  }
  if (!name.includes('|')) {
    throw new Error('wrong format');
  }
  return name.replace('|', '/').replace('|', '/').replace('XNOSLNX', '');
}

export default NormativesController;

import { Request, Response } from 'express';
import request from 'request-promise';
import Client from 'promise-ftp';
// import fs from 'fs';
import {
  zeroShift,
  whiteSpaceFill,
  fullDateFormatter
} from '../services/utils';
import logger from '../logger';
import { Thenable } from 'bluebird';
import { IRefund, IPayment } from '../interfaces';

class RetailController {
  static async generateRetail(req: Request, res: Response): Promise<Response> {
    let {
      query: { date, processDate, paymentDate, depositDate }
    } = req;
    if (!date) {
      // If no date provided, set it to start of today
      date = new Date(new Date().setHours(0, 0, 0, 0));
    }
    let file = '';
    try {
      file = await generateRetailFile(
        date,
        req,
        processDate,
        paymentDate,
        depositDate
      );
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }

    res.setHeader('Content-type', 'application/octet-stream');
    res.setHeader('Content-disposition', 'attachment; filename=file.txt');

    return res.send(file);
  }

  // Get from FTP a concilliation File and compare it to chek's retail transactions
  static async retailConcilliation(req: Request, res: Response) {
    const {
      body: { date }
    } = req;

    const ftp = new Client();
    const fileName = `RIPLEYPAY_RENDICION_${fullDateFormatter(
      new Date(parseInt(date, 10)).toISOString(),
      true
    )}`;

    const retailFile = await generateRetailFile(date, req);

    ftp
      .connect({
        host: process.env.FTP_RENDICIONES_HOST,
        port: parseInt(process.env.FTP_RENDICIONES_PORT || '21', 10),
        user: process.env.FTP_RENDICIONES_USER,
        password: process.env.FTP_RENDICIONES_PASSWORD
      })
      .then(() => ftp.get(fileName))
      .then(
        (stream: NodeJS.ReadableStream): Thenable<string> => {
          const chunks: Buffer[] = [];
          return new Promise((resolve, reject) => {
            stream.once('error', (e: Error) => {
              // Reject on stream error
              reject(e);
            });
            stream.once('close', () => {
              // return file content after it read
              resolve(Buffer.concat(chunks).toString());
            });
            stream.on('data', (data: Buffer) => {
              // when data is received, add it to a chunk array to concat later
              chunks.push(data);
            });
            // start reading the stream
            stream.resume();
          });
        }
      )
      .then((concilliation: string) => {
        // get file's line and add a found flag
        const concilliationLines = concilliation
          .split('\n')
          .filter((line: string) => line.length > 0)
          .map((line: string) => ({ line, found: false }));

        // same than before, but also trim spaces
        const retailLinesWithHeaderAndFooter = retailFile
          .split('\n')
          .map((line: string) => ({ line: line.trim(), found: false }));

        // remove first line (header) and last line (footer)
        const retailLines = retailLinesWithHeaderAndFooter.slice(
          1,
          retailLinesWithHeaderAndFooter.length - 1
        );
        const retailLinesNumber = retailLines.length;
        concilliationLines.forEach(
          (concilliationLine: { line: string; found: boolean }) => {
            // example: 00109122019|04600000038390000000055|000000039906K7gCYQbKy7zWX19LOSl
            // but retailFile doest not have those characters between |
            // so we compare the rest only
            const comparableLine = `${concilliationLine.line.slice(
              0,
              11
            )}${concilliationLine.line.slice(34)}`;

            // search the line in retail generated file
            for (let i = 0; i < retailLinesNumber; i = i + 1) {
              const retailLine = retailLines[i];
              const comparableRetailLine = `${retailLine.line.slice(
                0,
                11
              )}${retailLine.line.slice(34)}`;

              if (comparableRetailLine === comparableLine) {
                retailLines[i].found = true;
                concilliationLine.found = true;
                break;
              }
            }
          }
        );
        return { retailLines, concilliationLines };
      })
      .then(({ retailLines, concilliationLines }) => {
        const linesNotFound = {
          retailGenerated: concilliationLines
            .filter(({ found }) => !found)
            .map(({ line }) => line),
          chekGenerated: retailLines
            .filter(({ found }) => !found)
            .map(({ line }) => line)
        };

        res.setHeader('Content-type', 'application/octet-stream');
        res.setHeader('Content-disposition', 'attachment; filename=file.txt');

        if (
          linesNotFound.chekGenerated.length > 0 ||
          linesNotFound.retailGenerated.length > 0
        ) {
          const file = [
            'Transacciones Presentes en CHEK, pero no Ripley',
            ...linesNotFound.chekGenerated,
            '===============',
            'Transacciones presentes en Ripley, pero no en CHEK',
            ...linesNotFound.retailGenerated
          ];

          return res.send(file.join('\n'));
        }
        return res.send('');
      })
      .then(() => ftp.end())
      .catch((e: Error) => {
        console.error(e);
        res.status(500).json({ message: e.message });
      });
  }

  // upload CHEK retail transactions to FTPs
  static async uploadToFtp(req: Request, res: Response) {
    const {
      body: { date, processDate, paymentDate, depositDate }
    } = req;

    const ftp = new Client();
    const ftp2 = new Client();
    const fileName = `ripleypay_abonos_${fullDateFormatter(
      new Date(parseInt(date, 10)).toISOString(),
      true
    )}`;

    const retailFile = await generateRetailFile(
      date,
      req,
      processDate,
      paymentDate,
      depositDate
    );

    const retailFileBuffer: Buffer = Buffer.from(retailFile);

    const ftpRendiciones = new Promise((resolve, reject) => {
      ftp
        .connect({
          host: process.env.FTP_RENDICIONES_HOST,
          port: parseInt(process.env.FTP_RENDICIONES_PORT || '21', 10),
          user: process.env.FTP_RENDICIONES_USER,
          password: process.env.FTP_RENDICIONES_PASSWORD
        })
        .then(() => ftp.put(retailFileBuffer, fileName))
        .then(() => ftp.end())
        .then(() => resolve())
        .catch((e: Error) => {
          logger.error(e.message);
          reject(e);
        });
    });

    const ftpAbonos = new Promise((resolve, reject) => {
      ftp2
        .connect({
          host: process.env.FTP_RENDICIONES_HOST,
          port: parseInt(process.env.FTP_RENDICIONES_PORT || '21', 10),
          user: process.env.FTP_ABONOS_USER,
          password: process.env.FTP_ABONOS_PASSWORD
        })
        .then(() => ftp2.put(retailFileBuffer, fileName))
        .then(() => ftp2.end())
        .then(() => resolve())
        .catch((e: Error) => {
          logger.error(e.message);
          reject(e);
        });
    });

    return Promise.all([ftpRendiciones, ftpAbonos])
      .then(() => {
        return res.json({ upload: 'ok' });
      })
      .catch((e: Error) => {
        return res.status(500).json({ message: e.message });
      });
  }
}

const generateRetailFile = async (
  date: string,
  req: Request,
  processDate?: string,
  paymentDate?: string,
  depositDate?: string
): Promise<string> => {
  // get Date object from date: string.
  const parsedDate = new Date(parseInt(date, 10));
  // copy parsedDate to a new variable, which will be startDate
  const startDate = new Date(parsedDate);
  // we get next day, used to get endDate
  const nextDate = new Date(
    new Date(parseInt(date, 10)).setDate(
      new Date(parseInt(date, 10)).getDate() + 1
    )
  );
  // set endDate
  const endDate = new Date(
    nextDate.setMilliseconds(nextDate.getMilliseconds() - 1)
  );
  // Get data from accounts service
  let file = '';
  let data: { payments: IPayment[]; refunds: IRefund[] };

  try {
    const options = { startDate, endDate, profileId: process.env.RETAIL_ID };
    logger.info(
      `Obteniendo datos desde ${process.env.DATA_URI} ${JSON.stringify(
        options
      )}`,
      options
    );
    data = await request.post(
      `${process.env.DATA_URI}/trans-api/api/v1/reports`,
      {
        json: true,
        headers: {
          Authorization: req.get('authorization')
        },
        body: {
          options
        }
      }
    );
  } catch (e) {
    logger.error(`Falló la obtención de datos: ${JSON.stringify(e.error)}`);
    console.error(e.error);
    // return res.status(500).json({ message: 'Error con servicio' });
    throw new Error('Error con servicio');
  }

  // Set HEADER only if parameters are provided
  if (paymentDate && depositDate && processDate) {
    file += `${paymentDate} ${depositDate} ${processDate} 001 COMERCIAL ECCSA S.A`;
    file += whiteSpaceFill(72 + 12); // 12 from previous
    file += 'HEADER\n';
  } else {
    // If not, selected calendar date
    const formattedDate = fullDateFormatter(parsedDate.toISOString());
    file += `${formattedDate} ${formattedDate} ${formattedDate} 001 COMERCIAL ECCSA S.A`;
    file += whiteSpaceFill(72 + 12); // 12 from previous
    file += 'HEADER\n';
  }

  const shifter10 = zeroShift(10);
  const shifter13 = zeroShift(13);
  let totalSalesAmount = 0;
  let totalRefundAmount = 0;

  data.payments.map(({ amount, id, createdAt, sale }: IPayment) => {
    let pointOfSalesInfo;
    if (sale) {
      pointOfSalesInfo = sale.pointOfSalesInfo
        ? sale.pointOfSalesInfo
        : { name: 'XXXXXXXXX00390007' }; // A Sale without pointOfSalesInfo is from .com
    } else {
      pointOfSalesInfo = { name: 'XXXXXXXXX00000000' };
    }

    const formattedDate = fullDateFormatter(createdAt); // DDMMYYYY
    const sucursal = pointOfSalesInfo.name.slice(10, 13);
    const caja = pointOfSalesInfo.name.slice(13);
    const cajaFormatted = shifter10(caja);
    const amountShifted = zeroShift(11)(amount);
    totalSalesAmount += amount;
    file += `001${formattedDate}${sucursal}0000000000${cajaFormatted}${amountShifted}${id}${whiteSpaceFill(
      75
    )}\n`;
  });

  data.refunds.map(({ amount, createdAt, refundPaymentId }: IRefund) => {
    // Refund.transactionId contains info from pointOfSales.
    // currently is null :(
    const formattedDate = fullDateFormatter(createdAt); // DDMMYYYY
    const sucursal = '000'; //pointOfSale.name.slice(10, 13);
    const caja = '0'; //pointOfSale.name.slice(13);
    const cajaFormatted = shifter10(caja);
    const amountShifted = zeroShift(11)(amount);
    totalRefundAmount += amount;
    file += `003${formattedDate}${sucursal}0000000000${cajaFormatted}${amountShifted}${refundPaymentId}${whiteSpaceFill(
      75
    )}\n`;
  });

  const numeroAbonos = shifter10(data.payments.length);
  const totalAbonos = shifter13(totalSalesAmount);
  const numeroNotasCredito = shifter10(data.refunds.length);
  const totalNotasCredito = shifter13(totalRefundAmount);
  const totalADepositar = shifter13(totalSalesAmount - totalRefundAmount); // Temporal

  file += `${numeroAbonos} ${totalAbonos} ${numeroNotasCredito} `;
  file += `${totalNotasCredito} ${totalADepositar} ${whiteSpaceFill(70)}FOOTER`;
  return file;
};
export default RetailController;

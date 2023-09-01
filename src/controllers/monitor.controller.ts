import {
  zeroShift,
  whiteSpaceFill,
  universalShifter
} from './../services/utils';
import { IMovement, IPayment } from './../interfaces';
// Related to Monitor PLUS file
import logger from '../logger';
import { Request, Response } from 'express';
import moment from 'moment-timezone';
import { monitorStorage } from '../services/storage';
import {
  PaymentsRepository,
  DataOptions,
  DepositsRepository,
  WithdrawRepository
} from './../repositories/index';
import { IMonitor } from '../interfaces/Monitor';
import rp from 'request-promise';

class MonitorController {
  // Generates a file with the last p2p movements
  // variable definitions found file Variables MONITOR PLUS (ask for it)
  static async testTimezone(req: Request, res: Response) {
    //@ts-ignore:next-line
    let req1 = req;
    console.log(
      moment()
        .tz('America/Santiago')
        .format('YYYY-MM-DD HH:mm:ss.SSSSSSZ')
    );
    return res.send(200);
  }

  static async generaterP2P(req: Request, res: Response) {
    logger.info('Generating monitor file', req.body);
    let {
      body: { date, interval }
    } = req;
    let isAuto = false;

    if (!date) {
      date = moment().tz('America/Santiago');
    } else {
      date = moment(+date).tz('America/Santiago');
    }

    if ((req as any).fromCron) {
      interval = 15;
      isAuto = true;
    }

    const file: string[] = [];
    // First characters are fixed
    const header = `N${date.format('DDMMYYYYHHmm')}01101USUARIO123`;
    // channel is always CHEK
    const channel = 'CHEK';
    // ip is not available temporarily;
    const ip = '000.000.000.000';
    // origin is always the same
    const origin = '01101';
    // free spaces are currently not used;
    const free2 = zeroShift(15)('0');
    const free3 = whiteSpaceFill(50);
    const free4 = whiteSpaceFill(50);

    let payments: IPayment[];
    try {
      let startDate, endDate: any;

      if (!isAuto) {
        startDate = interval
          ? date.clone().subtract(interval || 0, 'minutes')
          : moment(date).startOf('day');
        endDate = date.clone();
      } else {
        const remainder = interval - (date.minute() % interval);
        endDate = date
          .clone()
          .add(remainder, 'minutes')
          .subtract(interval, 'minutes')
          .set({ seconds: 0, miliseconds: 0 });
        startDate = endDate
          .clone()
          .subtract(interval, 'minutes')
          .set({ seconds: 0, miliseconds: 0 });

        date = endDate.clone();
      }

      const uri = `${process.env.DATA_URI}/trans-api/api/v1/reports/p2p`;
      logger.info(`Getting data from ${uri}`, { startDate, endDate });

      const options: DataOptions = {
        startDate: startDate.format(),
        endDate: endDate.format()
      };
      logger.info(JSON.stringify(options));
      payments = await PaymentsRepository.findAll(options);
    } catch (e) {
      logger.error('Could not get info', e);
      return res.sendStatus(500);
    }
    const whiteSpaceFiller50 = universalShifter(50, ' ', false); // Fills from right
    const whiteSpaceFiller9 = universalShifter(9, ' ', true); //Fills from left

    payments.forEach(
      ({
        id,
        createdAt,
        payerInfo,
        receiverInfo,
        payer: {
          id: originAccountId,
          ownerInfo: payerOwnerInfo,
          commerceInfo: payerCommerceInfo
        },
        receiver: {
          id: receiverAccountId,
          ownerInfo: receiverOwnerInfo,
          commerceInfo: receiverCommerceInfo
        },
        amount
      }: IPayment) => {
        let line = header;

        let originFirstName,
          originLastName,
          originRut,
          originEmail,
          originPhoneNumber,
          payerNominated;
        let receiverFirstName,
          receiverLastName,
          receiverRut,
          receiverEmail,
          receiverPhoneNumber;
        if ('user' === payerInfo?.type) {
          originFirstName = payerOwnerInfo?.firstName;
          originLastName = payerOwnerInfo?.lastName;
          originRut = payerOwnerInfo?.nationalId;
          originEmail = payerOwnerInfo?.email;
          originPhoneNumber = payerOwnerInfo?.phoneNumber;
          payerNominated =
            payerOwnerInfo?.primaryAccountCategory === 't1' ? 'NO' : 'SI';
        } else {
          originFirstName = payerCommerceInfo?.name;
          originLastName = '';
          originRut = payerCommerceInfo?.nationalId;
          originEmail = '';
          originPhoneNumber = payerCommerceInfo?.phoneNumber;
          payerNominated = 'SI';
        }
        if ('user' === receiverInfo?.type) {
          receiverFirstName = receiverOwnerInfo?.firstName;
          receiverLastName = receiverOwnerInfo?.lastName;
          receiverRut = receiverOwnerInfo?.nationalId;
          receiverEmail = receiverOwnerInfo?.email;
          receiverPhoneNumber = receiverOwnerInfo?.phoneNumber;
        } else {
          receiverFirstName = receiverCommerceInfo?.name;
          receiverLastName = '';
          receiverRut = receiverCommerceInfo?.nationalId;
          receiverEmail = '';
          receiverPhoneNumber = receiverCommerceInfo?.phoneNumber;
        }
        line += `${moment(createdAt)
          .tz('America/Santiago')
          .format('YYYYMMDDHHmmss')}`; // datetime
        line += originRut ? whiteSpaceFiller9(originRut) : zeroShift(9)('0'); // originRut
        line += whiteSpaceFiller50(
          originFirstName
            ? normalizeString(decodeURIComponent(originFirstName))
            : ''
        ); // originName
        line += whiteSpaceFiller50(
          originLastName
            ? normalizeString(decodeURIComponent(originLastName))
            : ''
        );
        line += originAccountId; // originAccountId
        line += whiteSpaceFiller50(originEmail || ''); // originEmail
        line += originPhoneNumber
          ? zeroShift(8)(originPhoneNumber.replace('+569', ''))
          : zeroShift(8)('0'); // originPhone

        line += receiverRut ? whiteSpaceFiller9(receiverRut) : zeroShift(9)(''); // receiverRut
        line += whiteSpaceFiller50(
          receiverFirstName
            ? normalizeString(decodeURIComponent(receiverFirstName))
            : ''
        ); // receiverName
        line += whiteSpaceFiller50(
          receiverLastName
            ? normalizeString(decodeURIComponent(receiverLastName))
            : ''
        ); // receiverLastName
        line += receiverAccountId; // receiverAccountId
        line += whiteSpaceFiller50(receiverEmail || ''); // receiverEmail
        line += receiverPhoneNumber
          ? zeroShift(8)(receiverPhoneNumber.replace('+569', ''))
          : zeroShift(8)('0'); // receiverPhone

        line += zeroShift(10)(amount + '00'); // amount
        line += channel;
        line += ip;
        line += id; // responseCode
        line += payerNominated; // nominated
        line += free2;
        line += free3;
        line += free4;
        line += origin;
        file.push(line);
      }
    );

    if (!isAuto) {
      res.setHeader('Content-type', 'application/octet-stream');
      res.setHeader('Content-disposition', 'attachment; filename=file.txt');

      return res.send(file.join('\n'));
    }

    // upload to storage
    const fileName = `monitor_${date.format('YYYYMMDDHHmm')}`;
    const content = file.join('\n');
    const storageFile = monitorStorage.file(fileName);
    try {
      await storageFile.save(content);
      logger.info('Archivo subido correctamente');
      return res.sendStatus(200);
    } catch (error) {
      logger.error('Archivo no subido', error);
      return res.sendStatus(500);
    }
  }

  static async generateBodyApiMonitor(req: Request, res: Response) {
    let SystemServices: IMonitor = {};
    logger.info('Generating monitor file', req.body);
    let {
      body: { date, interval }
    } = req;
    let isAuto = false;

    if (!date) {
      date = moment().tz('America/Santiago');
    } else {
      date = moment(+date).tz('America/Santiago');
    }

    if ((req as any).fromCron) {
      interval = 15;
      isAuto = true;
    }

    let dateHeader = moment()
      .tz('America/Santiago')
      .format('DDMMYYYYHHmm');
    SystemServices.indicatorReference = 'N';
    SystemServices.dayTransaction = dateHeader.substring(0, 2);
    SystemServices.monthTransaction = dateHeader.substring(2, 4);
    SystemServices.yearTransaction = dateHeader.substring(4, 8);
    SystemServices.hourTransaction = dateHeader.substring(8, 10);
    SystemServices.minuteTransaction = dateHeader.substring(10, 12);
    SystemServices.userCustomer = 'USUARIO123';
    SystemServices.eventReference = '01101';

    // channel is always CHEK
    const channel = 'CHEK';
    // ip is not available temporarily;
    const ip = '000.000.000.000';
    // origin is always the same
    const origin = '01101';
    // free spaces are currently not used;
    const free4 = whiteSpaceFill(50);

    let payments: IMovement[];
    let withdraws: IMovement[];
    let deposits: IMovement[];
    try {
      let startDate, endDate: any;

      if (!isAuto) {
        startDate = interval
          ? date.clone().subtract(interval || 0, 'minutes')
          : moment(date).startOf('day');
        endDate = date.clone();
      } else {
        const reminder = interval - (date.minute() % interval);
        endDate = date
          .clone()
          .add(reminder, 'minutes')
          .subtract(interval, 'minutes')
          .set({ seconds: 0, miliseconds: 0 });
        startDate = endDate
          .clone()
          .subtract(interval, 'minutes')
          .set({ seconds: 0, miliseconds: 0 });

        date = endDate.clone();
      }

      const options: DataOptions = {
        startDate: startDate.format(),
        endDate: endDate.format()
      };

      withdraws = await WithdrawRepository.findAllMonitor(options);
      deposits = await DepositsRepository.findAllMonitor(options);
      payments = await PaymentsRepository.findAllMonitor(options);
    } catch (e) {
      logger.error('Could not get info', e);
      return res.sendStatus(500);
    }
    const whiteSpaceFiller50 = universalShifter(50, ' ', false); // Fills from right
    const whiteSpaceFiller9 = universalShifter(9, ' ', true); //Fills from left
    const whiteSpaceFiller15 = universalShifter(15, ' ', true); //Fills from left
    const whiteSpaceFiller20 = universalShifter(20, ' ', true); //Fills from left

    withdraws.forEach(
      async ({
        sourceType,
        withdraw: {
          id,
          amount,
          createdAt,
          fromAccountId,
          type,
          reversed,
          toResourceInfo: {
            nationalId: recipientNationalId,
            name: recipientName,
            accountNumber: recipientAccountNumber,
            email
          },
          withdrawSourceAccount: { ownerInfo }
        }
      }: IMovement) => {
        let line = '';
        let isNominated =
          ownerInfo?.primaryAccountCategory === 't1' ? 'NO' : 'SI';
        let recipientPhoneNumber = zeroShift(8)('0');
        let [recipientFirstName, recipientLastName] = decodeURIComponent(
          recipientName
        ).split(' ');
        let recipientEmail;
        let reversedState;
        reversedState = reversed === true ? '1' : '0';
        if (type === 'tef') {
          recipientEmail = email;
        } else {
          recipientEmail = '';
        }
        line += `${moment(createdAt)
          .tz('America/Santiago')
          .format('YYYYMMDDHHmmss')}`; // datetime
        line += ownerInfo?.nationalId
          ? whiteSpaceFiller9(ownerInfo?.nationalId)
          : zeroShift(9)('0'); // originRut
        line += whiteSpaceFiller50(
          ownerInfo?.firstName
            ? normalizeString(decodeURIComponent(ownerInfo?.firstName))
            : ''
        ); // originName
        line += whiteSpaceFiller50(
          ownerInfo?.lastName
            ? normalizeString(decodeURIComponent(ownerInfo?.lastName))
            : ''
        );
        line += fromAccountId;
        line += whiteSpaceFiller50(ownerInfo?.email || '');
        line += ownerInfo?.phoneNumber
          ? zeroShift(8)(ownerInfo?.phoneNumber.replace('+569', ''))
          : zeroShift(8)('0');

        //desde aqui van los datos de withdraw segun tipo
        line += recipientNationalId
          ? whiteSpaceFiller9(recipientNationalId)
          : zeroShift(9)(''); // receiverRut
        line += whiteSpaceFiller50(
          recipientFirstName ? recipientFirstName : ''
        );
        line += whiteSpaceFiller50(recipientLastName ? recipientLastName : '');
        line += zeroShift(20)(recipientAccountNumber);
        line += whiteSpaceFiller50(recipientEmail!.replace(/%40/g, '@') || '');
        line += recipientPhoneNumber.replace('+569', '');

        line += zeroShift(10)(amount + '00'); // amount
        line += channel;
        line += ip;
        line += whiteSpaceFiller20(reversedState); // responseCode
        line += isNominated;
        line += whiteSpaceFiller15(sourceType);
        line += whiteSpaceFiller50(id);
        line += free4;
        line += origin;
        SystemServices.transactionDetail = line;
        try {
          const p2pPromise = sendFraudDiagnosisRequest(SystemServices, id);
          const resPromise = await Promise.all([p2pPromise]);
          console.log('withdraws response', resPromise[0]);
        } catch (error) {
          logger.error('Could not get info', error);
        }
      }
    );

    deposits.forEach(
      async ({
        sourceType,
        deposit: {
          id,
          amount,
          type,
          reversed,
          fromResourceInfo: { nationalId, accountNumber },
          createdAt,
          depositreceiver: { ownerInfo }
        }
      }: IMovement) => {
        let line = '';
        let reversedState;
        let isNominated =
          ownerInfo?.primaryAccountCategory === 't1' ? 'NO' : 'SI';
        let originNationalId,
          originFirstName,
          originLastName,
          originAccountNumber,
          originMail,
          originPhoneNumber = zeroShift(8)('0');
        if (type === 'transfer') {
          originNationalId = nationalId;
          originFirstName = '';
          originLastName = '';
          originAccountNumber = accountNumber;
          originMail = '';
        } else {
          originNationalId = '';
          originFirstName = '';
          originLastName = '';
          originAccountNumber = '';
          originMail = '';
        }
        reversedState = reversed === true ? '1' : '0';
        line += `${moment(createdAt)
          .tz('America/Santiago')
          .format('YYYYMMDDHHmmss')}`; // datetime
        line += originNationalId
          ? whiteSpaceFiller9(originNationalId)
          : zeroShift(9)('0');
        line += whiteSpaceFiller50(
          originFirstName
            ? normalizeString(decodeURIComponent(originFirstName))
            : ''
        ); //originFirstName
        line += whiteSpaceFiller50(
          originLastName
            ? normalizeString(decodeURIComponent(originLastName))
            : ''
        );
        line += zeroShift(20)(originAccountNumber!);
        line += whiteSpaceFiller50(originMail || ''); // originEmail
        line += originPhoneNumber;

        //Aqui empieza la data de la cuenta chek donde va el deposito
        line += ownerInfo?.nationalId
          ? whiteSpaceFiller9(ownerInfo?.nationalId)
          : zeroShift(9)('0'); // originRut

        line += whiteSpaceFiller50(
          ownerInfo?.firstName
            ? normalizeString(decodeURIComponent(ownerInfo?.firstName))
            : ''
        );

        line += whiteSpaceFiller50(
          ownerInfo?.lastName
            ? normalizeString(decodeURIComponent(ownerInfo?.lastName))
            : ''
        );
        line += ownerInfo?.primaryAccountId;
        line += whiteSpaceFiller50(
          ownerInfo?.email!.replace(/%40/g, '@') || ''
        );
        line += ownerInfo?.phoneNumber
          ? zeroShift(8)(ownerInfo?.phoneNumber.replace('+569', ''))
          : zeroShift(8)('0');

        line += zeroShift(10)(amount + '00'); // amount
        line += channel;
        line += ip;
        line += whiteSpaceFiller20(reversedState); // responseCode?
        line += isNominated;
        line += whiteSpaceFiller15(sourceType);
        line += whiteSpaceFiller50(id);
        line += free4;
        line += origin;
        SystemServices.transactionDetail = line;
        try {
          const p2pPromise = sendFraudDiagnosisRequest(SystemServices, id);
          const resPromise = await Promise.all([p2pPromise]);
          logger.log('deposits response', resPromise[0]);
        } catch (error) {
          logger.error('Could not get info', error);
        }
      }
    );

    payments.forEach(
      async ({
        sourceType,
        payment: {
          id,
          createdAt,
          payerInfo,
          receiverInfo,
          reversed,
          payer: {
            id: originAccountId,
            ownerInfo: payerOwnerInfo,
            commerceInfo: payerCommerceInfo
          },
          receiver: {
            id: receiverAccountId,
            ownerInfo: receiverOwnerInfo,
            commerceInfo: receiverCommerceInfo
          },
          amount
        }
      }: IMovement) => {
        let line = '';
        let reversedStatus;
        let originFirstName,
          originLastName,
          originRut,
          originEmail,
          originPhoneNumber,
          payerNominated;
        let receiverFirstName,
          receiverLastName,
          receiverRut,
          receiverEmail,
          receiverPhoneNumber;
        if ('user' === payerInfo?.type) {
          originFirstName = payerOwnerInfo?.firstName;
          originLastName = payerOwnerInfo?.lastName;
          originRut = payerOwnerInfo?.nationalId;
          originEmail = payerOwnerInfo?.email;
          originPhoneNumber = payerOwnerInfo?.phoneNumber;
          payerNominated =
            payerOwnerInfo?.primaryAccountCategory === 't1' ? 'NO' : 'SI';
        } else {
          originFirstName = payerCommerceInfo?.name;
          originLastName = '';
          originRut = payerCommerceInfo?.nationalId;
          originEmail = '';
          originPhoneNumber = payerCommerceInfo?.phoneNumber;
          payerNominated = 'SI';
        }
        if ('user' === receiverInfo?.type) {
          receiverFirstName = receiverOwnerInfo?.firstName;
          receiverLastName = receiverOwnerInfo?.lastName;
          receiverRut = receiverOwnerInfo?.nationalId;
          receiverEmail = receiverOwnerInfo?.email;
          receiverPhoneNumber = receiverOwnerInfo?.phoneNumber;
        } else {
          receiverFirstName = receiverCommerceInfo?.name;
          receiverLastName = '';
          receiverRut = receiverCommerceInfo?.nationalId;
          receiverEmail = '';
          receiverPhoneNumber = receiverCommerceInfo?.phoneNumber;
        }
        reversedStatus = reversed === true ? '1' : '0';
        line += `${moment(createdAt)
          .tz('America/Santiago')
          .format('YYYYMMDDHHmmss')}`; // datetime
        line += originRut ? whiteSpaceFiller9(originRut) : zeroShift(9)('0'); // originRut
        line += whiteSpaceFiller50(
          originFirstName
            ? normalizeString(decodeURIComponent(originFirstName))
            : ''
        ); // originName
        line += whiteSpaceFiller50(
          originLastName
            ? normalizeString(decodeURIComponent(originLastName))
            : ''
        );
        line += originAccountId; // originAccountId
        line += whiteSpaceFiller50(originEmail || ''); // originEmail
        line += originPhoneNumber
          ? zeroShift(8)(originPhoneNumber.replace('+569', ''))
          : zeroShift(8)('0'); // originPhone

        line += receiverRut ? whiteSpaceFiller9(receiverRut) : zeroShift(9)(''); // receiverRut
        line += whiteSpaceFiller50(
          receiverFirstName
            ? normalizeString(decodeURIComponent(receiverFirstName))
            : ''
        ); // receiverName
        line += whiteSpaceFiller50(
          receiverLastName
            ? normalizeString(decodeURIComponent(receiverLastName))
            : ''
        ); // receiverLastName
        line += receiverAccountId; // receiverAccountId
        line += whiteSpaceFiller50(receiverEmail!.replace(/%40/g, '@') || ''); // receiverEmail
        line += receiverPhoneNumber
          ? zeroShift(8)(receiverPhoneNumber.replace('+569', ''))
          : zeroShift(8)('0'); // receiverPhone
        line += zeroShift(10)(amount + '00'); // amount
        line += channel;
        line += ip;
        line += whiteSpaceFiller20(reversedStatus); // responseCode
        line += payerNominated; // nominated
        line += whiteSpaceFiller15(sourceType); //transaction type free2
        line += whiteSpaceFiller50(id); //free3
        line += free4;
        line += origin;
        SystemServices.transactionDetail = line;
        logger.info('systemservices', { systemServices: SystemServices });
        try {
          const p2pPromise = sendFraudDiagnosisRequest(SystemServices, id);
          const resPromise = await Promise.all([p2pPromise]);
          logger.log('payments response', resPromise[0]);
        } catch (error) {
          logger.error('Could not get info', error);
        }
      }
    );
    return res.sendStatus(200);
  }
}

const sendFraudDiagnosisRequest = (systemServices: IMonitor, id: string) => {
  const uri = `${process.env.API_MONITOR}`;  
  logger.info(`Insert data to ${uri}`, { systemServices });
  return rp.post(uri, {
    json: true,
    headers: {
      'Consumer-Sys-Code': 'CHL-CK-MOB',
      'Consumer-Enterprise-Code': 'BANCORIPLEY-CHL',
      'Consumer-Country-Code': 'CHL',
      'Trace-Client-Req-Timestamp': moment()
        .tz('America/Santiago')
        .format('YYYY-MM-DD HH:mm:ss.SSSSSSZ'),
      'Trace-Source-Id': id,
      'Trace-Process-Id': id,
      'Channel-Name': 'CHL-CK-MOB',
      'Channel-Mode': 'NO-PRESENCIAL',
      'X-IBM-Client-Id': '0f32526f4056b4ad6f7e511c1ecdbce7',
      'X-IBM-Client-Secret': '723e11c14626ca347038b51e72dbdc82',
      'x-token':
        'RDC1F86B7ACFABI39D3B8AC7EA476R334C69CEA19D96FB89C0F8AF6BOD909E56P',
      'Content-Type': 'application/json'
    },
    body: {
      RequestFraudDiagnosis: { SystemServices: systemServices }
    }
  });
};

const normalizeString = (value: string): string => {
  // normalize decomposes graphemes (é = e + ´)
  // replace all range of unsupported characters
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

export default MonitorController;

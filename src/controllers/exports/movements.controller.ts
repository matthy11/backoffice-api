import xlsx from 'xlsx';
// import FileSaver from 'file-saver';
import rp from 'request-promise';
import { IMovement } from '../../interfaces/Movement';
import { Request, Response } from 'express';
import logger from '../../logger';
import { formatDate } from '../../services/utils';
import { storageCommerce } from '../../services/storage';
import moment from 'moment-timezone';
import { GetSignedUrlConfig } from '@google-cloud/storage';
import { TransactionType } from '../../services/enums';
import { CommercesRepository, MovementsRepository } from '../../repositories';
import groupBy from '../../services/groupBy';

export interface DataOptions {
  startDate: string;
  endDate: string;
  orderBy?: string;
  limit?: number;
  commerceId?: string;
  profileId: string;
}

const glosaryData: any = (withStores?: boolean | null) => ({
  Id_transaccion: 'Identificador único de la transacción.',
  Fecha: 'Fecha y hora cuando se originó el movimiento. Formato fecha DD-MM-YYYY HH:MM',
  origenId: 'Identificador único de cuenta origen.',
  Origen: 'Nombre cuenta origen.',
  destinoId: 'Identificador único de cuenta destino.',
  Destino: 'Nombre cuenta destino.',
  Tipo_Transaccion: 'Tipo de movimiento que se registró. Los valores pueden ser PAGO, REEMBOLSO, PROPINA o Retiro de dinero.',
  id_Transaccion_Original: '[Exclusivo para reembolsos] Muestra el identificador del pago que se está reembolsando.',
  ...withStores && {
    Id_Sucursal: 'Código de identificación de la sucursal',
    Sucursal: 'Nombre de la sucursal',
  },
  Punto_de_venta: 'Caja que llevó a cabo la transacción',
  Id_POS: 'Código de identificación de la caja',
  monto: 'Monto de la transacción expresada en pesos chilenos'
})

export default class ExportsMovementsController {

  static async accountMovements(req: Request, res: Response) {
    const {
      body: { options }
    }: { body: { options: DataOptions } } = req;
    // Initialize empty xlsx file
    const wb = xlsx.utils.book_new();
    const uri = options.profileId
      ? `${process.env.DATA_URI}/trans-api/api/v1/users/movements`
      : `${process.env.DATA_URI}/trans-api/api/v1/movements/getData`;

    let movements: { [key: string]: IMovement[] };
    try {
      logger.info(`Obteniendo datos desde ${uri}`);
      movements = await rp.post(uri, {
        json: true,
        headers: {
          Authorization: req.get('authorization')
        },
        body: {
          options: {
            ...options,
            limit: undefined
            // Limit causes problems as it limit movements counts to not match parity
            // leaving payments without its counterpart
          }
        }
      });
    } catch (e) {
      logger.error(`Error al obtener info. ${e.message}`);
      return res.status(500).json({ message: 'Service Error' });
    }

    const data = transformDataMovements(movements, options);

    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, `commerce-movements`);
    // xlsx.writeFile(wb, 'out.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'Report.xlsx'
    );
    const buffer = xlsx.write(wb, { type: 'buffer' });
    return res.send(Buffer.from(buffer));
  }

  static async commerceMovements(req: Request, res: Response) {
    const {
      body: { options }
    }: { body: { options: DataOptions } } = req;
    logger.info('[MovementsControler:commerceMovements] report start', options);
    if (!options.commerceId || !options.startDate || !options.endDate) {
      return res.status(400).json({ message: 'Missing parameters' });
    };

    // Initialize empty xlsx file
    const wb = xlsx.utils.book_new();
    try {
      let movements: { [key: string]: IMovement[] };
      logger.info('[MovementsControler:commerceMovements] get commerce', options);
      const commerce = await CommercesRepository.getById(options.commerceId);

      if (!commerce) {
        logger.warn('[MovementsControler:commerceMovements] commerce not found', options);
        return res.status(404).json({ message: 'Commerce not found' });
      }

      logger.info('[MovementsControler:commerceMovements] get movements for commerce account', { ...options, commerce: commerce.toJSON() });

      const { startDate, endDate } = transformToRange(options);

      const results = await MovementsRepository.findAllForAccount(
        commerce.primaryAccountId,
        { ...options, startDate, endDate }
      );

      movements = groupBy(results, "sourceId");

      const data = transformDataMovementsPublicFile(movements, options, commerce.storesActive);
      const commerceName = commerce.name ? commerce.name.replace(/\s/g, '') + '_' : '';

      logger.info('[MovementsControler:commerceMovements] write excel data', options);

      const ws = xlsx.utils.json_to_sheet(data);
      const parseGlosaryData = Object.keys(glosaryData(commerce.storesActive)).map(key => {
        const value = glosaryData(commerce.storesActive)[key];
        return { 'Title': key, 'Value': value };
      });

      const wsGlosary = xlsx.utils.json_to_sheet(parseGlosaryData, {
        skipHeader: true
      });

      xlsx.utils.book_append_sheet(wb, ws, `Movimientos`);
      xlsx.utils.book_append_sheet(wb, wsGlosary, 'Glosario');

      logger.info('[MovementsControler:commerceMovements] upload excel start', options);
      const buffer = xlsx.write(wb, { type: 'buffer' });

      const startDateFormatted = moment(options.startDate).format('DDMMYYYY');
      const endDateFormatted = moment(options.endDate).format('DDMMYYYY');
      const requestDate = moment().format('YYYY-MM-DD');
      const expirationDate = moment().add(7, 'days').format('YYYY-MM-DD');
      const filename = `${commerceName}MOV_${startDateFormatted}_${endDateFormatted}.xlsx`;

      const urlConfig: GetSignedUrlConfig = {
        action: 'read',
        expires: expirationDate
      };

      try {
        const fileUploaded = storageCommerce.file(filename);
        await fileUploaded.save(buffer);
        logger.info("[MovementsControler:commerceMovements] File successfuly uploaded", { name: filename });

        const [fileUrl] = await fileUploaded.getSignedUrl(urlConfig).catch(() => [undefined]);

        return res.send({
          url: fileUrl,
          startDate: options.startDate,
          endDate: options.endDate,
          requestDate,
          expirationDate,
          status: 'done'
        }).status(200);

      } catch (error) {
        logger.error("[MovementsControler:commerceMovements] File not uploaded", { error, name: filename });
        return res.status(500).json({ message: 'File not Uploaded' });
      }

    } catch (e) {
      logger.error(`[MovementsControler:commerceMovements] ${e.message}`, { error: e });
      return res.status(500).json({ message: 'Service Error' });
    }
  }
}

function getOriginName(obj: IMovement): string {
  if (!obj) {
    return '';
  }

  // The payer may be the commerce (refund payment) or just the user (normal payment)
  if (obj.payment?.payer) {
    if (obj.payment.payer.type === 'commerce') {
      return getName(obj.payment.payer.commerceInfo);
    }
    return getName(obj.payment.payer.ownerInfo);
  }

  if (obj.deposit?.chargeId) {
    return getName(obj.deposit.sale?.depositInfo.additionalData.payerInfo);
  }

  if (obj.withdraw?.refundedDepositId) {
    return getName(obj.account?.commerceInfo)
  }

  if (obj.deposit) {
    return 'Cash-In';
  }

  if (obj.withdraw) {
    return 'Cash-Out';
  }
  return '';
}

function getOriginId(obj: IMovement): string {
  if (!obj) {
    return '';
  }

  if (obj.payment) {
    return obj.payment.fromAccountId
  }

  if (obj.withdraw) {
    return obj.withdraw.fromAccountId
  }

  return '-';
}

function getDestinationName(obj: IMovement): string {
  if (!obj) {
    return '';
  }

  // The receiver may be the commerce (refund payment) or just the user (normal payment)
  if (obj.payment?.receiver) {
    if (obj.payment.receiver.type === 'commerce') {
      return getName(obj.payment.receiver.commerceInfo)
    }
    return getName(obj.payment.receiver.ownerInfo)
  }

  if (obj.deposit?.chargeId) {
    return getName(obj.account?.commerceInfo);
  }

  if (obj.withdraw?.refundedDepositId) {
    return getName(obj.withdraw.deposit?.sale?.depositInfo.additionalData.payerInfo)
  }

  if (obj.deposit || obj.withdraw) {
    return getName(obj.account?.commerceInfo);
  }

  return '';
}

function getDestinationId(obj: IMovement): string {
  if (!obj) {
    return '';
  }

  if (obj.payment) {
    return obj.payment.toAccountId
  }

  if (obj.deposit) {
    return obj.deposit.toAccountId;
  }

  return '-';
}

function getTransactionOriginAndDestination(obj: IMovement): {
  origin: string,
  originId: string,
  destination: string,
  destinationId: string,
  transactionType: {
    transaction: TransactionType,
    refundedPaymentId: string | null
  }
} {
  const origin = getOriginName(obj);
  const originId = getOriginId(obj);
  const destination = getDestinationName(obj);
  const destinationId = getDestinationId(obj);
  const transactionType = getTransactionType(obj);
  return {
    origin,
    originId,
    destination,
    destinationId,
    transactionType
  }
}

function getStoreAndPOS(obj: IMovement): { storeId: string, storeName: string, posId: string, posName: string } {
  // normal deposit and withdraws do not have store and pos
  if ((obj.deposit && !obj.deposit.chargeId) || (obj.withdraw && !obj.withdraw.refundedDepositId)) {
    // the ?. doesnt work here because it will turn to true if deposit or withdraw doesn't exist
    return { storeId: '', posId: '', storeName: '', posName: '' };
  }

  if (obj.payment) {
    return {
      storeId: obj.payment.sale?.pointsOfSale?.store?.storeId || '',
      storeName: obj.payment.sale?.pointsOfSale?.store?.storeName || '',
      posId: obj.payment.sale?.pointOfSalesId || '',
      posName: obj.payment.sale?.pointOfSalesInfo?.name || ''
    }
  }

  // TEF Payment related

  if (obj.deposit?.chargeId) {
    return {
      storeId: obj.deposit?.sale?.pointsOfSale?.store?.storeId || '',
      storeName: obj.deposit?.sale?.pointsOfSale?.store?.storeName || '',
      posId: obj.deposit?.sale?.pointOfSalesId || '',
      posName: obj.deposit.sale?.pointOfSalesInfo?.name || ''
    }
  }

  if (obj.withdraw?.refundedDepositId) {
    return {
      storeId: obj.withdraw.deposit?.sale?.pointsOfSale?.store?.storeId || '',
      storeName: obj.withdraw.deposit?.sale?.pointsOfSale?.store?.storeName || '',
      posId: obj.withdraw.deposit?.sale?.pointOfSalesId || '',
      posName: obj.withdraw.deposit?.sale?.pointOfSalesInfo?.name || ''
    }
  }

  return { storeId: '', posId: '', storeName: '', posName: '' };;
}

export function transformToRange({ startDate, endDate }: { startDate: string, endDate: string }): { startDate: string, endDate: string } {
  const timezone = 'America/Santiago';
  const format = 'YYYY-MM-DD HH:mm:ss'
  const startToMoment = moment(`${startDate}T12:00:00Z`).tz(timezone).startOf('day').utc().format(format);
  const endToMoment = moment(`${endDate}T12:00:00Z`).tz(timezone).endOf('day').utc().format(format)
  return { startDate: startToMoment, endDate: endToMoment }
}

// not currently available
function transformDataMovements(movements: { [key: string]: IMovement[] }, options: DataOptions) {
  return Object.entries(movements).map(
    ([key, transactions]: [string, IMovement[]]) => {
      let origen, origenId, destino, destinoId;
      if (transactions[0].sourceType === 'payment') {
        origen = getOriginName(transactions[0]);
        origenId = transactions[0].payment?.fromAccountId;
        destino = getDestinationName(transactions[0]);
        destinoId = transactions[0].payment?.toAccountId;
      } else if (transactions[0].sourceType === 'deposit') {
        origen = getOriginName(transactions[0]);
        origenId = '-';
        destino = getDestinationName(transactions[0]);
        destinoId = transactions[0].deposit?.toAccountId;
      } else {
        origen = getDestinationName(transactions[0]);
        origenId = transactions[0].withdraw?.fromAccountId;
        destino = getOriginName(transactions[0]);
        destinoId = '-';
      }
      return {
        sourceId: key,
        fecha: formatDate(transactions[0].createdAt),
        reversada: transactions[0].reversed,
        fechaReversa: transactions[0].reversedAt
          ? formatDate(transactions[0].reversedAt)
          : '',
        origen,
        origenId,
        destino,
        destinoId,
        type: transactions[0].sourceType,
        subtype: transactions[0].sourceSubtype,
        monto: getVariation(transactions, options.profileId),
        saldo: getRemainingBalance(transactions, options.profileId),
      };
    }
  );
}

// used to export commerce accounts
function transformDataMovementsPublicFile(movements: { [key: string]: IMovement[] }, options: DataOptions, withStores?: boolean | null) {
  return Object.entries(movements).map(
    ([key, transactions]: [string, IMovement[]]) => {
      const { origin, originId, destination, destinationId, transactionType } = getTransactionOriginAndDestination(transactions[0]);
      const { storeId, storeName, posId, posName } = getStoreAndPOS(transactions[0]);

      return {
        Id_transaccion: key,
        Fecha: formatDate(transactions[0].createdAt),
        origenId: originId,
        Origen: origin,
        destinoId: destinationId,
        Destino: destination,
        Tipo_Transaccion: transactionType.transaction,
        id_Transaccion_Original: transactionType.refundedPaymentId,
        ...withStores && {
          Id_Sucursal: storeId,
          Sucursal: storeName,
        },
        Punto_de_Venta: posName,
        Id_POS: posId,
        monto: getVariation(transactions, options.profileId)
      };
    }
  );
}

function getTransactionType(movement: IMovement): {
  transaction: TransactionType,
  refundedPaymentId: string | null
} {
  if (!movement) {
    return {
      transaction: TransactionType.empty,
      refundedPaymentId: ''
    };
  }

  if (movement.payment) {
    if (movement.payment.refundedPaymentId) {
      return {
        transaction: TransactionType.refund,
        refundedPaymentId: movement.payment.refundedPaymentId
      };
    }

    if (movement.payment.reversed) {
      return {
        transaction: TransactionType.reverse,
        refundedPaymentId: movement.payment.refundedPaymentId
      };
    }

    if (movement.payment.tipFromPaymentId) {
      return {
        transaction: TransactionType.tip,
        refundedPaymentId: movement.payment.refundedPaymentId
      };
    }

    if (movement.payment.transactionId) {
      return {
        transaction: TransactionType.payment,
        refundedPaymentId: movement.payment.refundedPaymentId
      };
    }
  }

  // normal cashout
  if (movement.withdraw && !movement.withdraw.refundedDepositId) {
    return {
      transaction: TransactionType.cashOuts,
      refundedPaymentId: ''
    }
  }

  // TEF Payment Related

  if (movement.deposit?.sale) {
    if (movement.deposit.sale.isTip) {
      return {
        transaction: TransactionType.tip,
        refundedPaymentId: ''
      };
    }
    if (movement.deposit.sale.reversed) {
      return {
        transaction: TransactionType.reverse,
        refundedPaymentId: ''
      };
    }

    return {
      transaction: TransactionType.payment,
      refundedPaymentId: ''
    };
  }

  if (movement.withdraw?.refundId && movement.withdraw?.refundedDepositId) {
    return {
      transaction: TransactionType.refund,
      refundedPaymentId: movement.withdraw.refundedDepositId
    }
  }

  return {
    transaction: TransactionType.empty,
    refundedPaymentId: ''
  };
}

function getName(obj: any): string {
  if (!obj) {
    return '';
  }
  if (obj.fullName) {
    return obj.fullName;
  }
  return obj.name;
}

function getVariation(transaction: IMovement[], profileId: string): number {
  if (!profileId) {
    return Math.abs(transaction[0].balanceVariation);
  }
  if (transaction.length > 1) {
    // transaction[0] movement from payer
    // transaction[1] movement from receiver
    if (transaction[0].accountId === profileId) {
      return transaction[0].balanceVariation;
    } else {
      return transaction[1].balanceVariation;
    }
  } else {
    return transaction[0].balanceVariation;
  }
}

function getRemainingBalance(
  transaction: IMovement[],
  profileId: string
): number | string {
  if (transaction[0].reversed) {
    return '-';
  }
  if (transaction.length > 1) {
    if (transaction[0].accountId === profileId) {
      return transaction[0].remainingBalance;
    } else {
      return transaction[1].remainingBalance;
    }
  } else {
    return transaction[0].remainingBalance;
  }
}
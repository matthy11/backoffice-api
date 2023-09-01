import { IWithdraw, WithdrawModel } from './../../interfaces/Withdraw';
import { IDeposit, IBankAccount, IOneClick, DepositModel } from './../../interfaces/Deposit';
import { IAccount, AccountModel } from './../../interfaces/Account';
import xlsx from 'xlsx';
import moment from 'moment-timezone';
import { Request, Response } from 'express';
import logger from '../../logger';
import { storage } from '../../services/storage';
import { formatDate, getHolidaysAdjust } from '../../services/utils';
import { DepositsRepository, WithdrawRepository, AccountRepository } from '../../repositories';

export interface DataOptions {
  startDate: string;
  endDate: string;
  orderBy?: string;
  limit?: number;
  profileId: string;
}

class ExportsPublicController {

  // NOT CURRENTLY USED, moved to tf-cl-backoffice-api-go
  // Account (users + commerces) list + deposits and withdraws
  static async accounts(_: Request, res: Response) {
    // As it is a heavy cron job, we dont care about when it ends
    // this prevents the cron job showing errors
    res.sendStatus(200)
    const date = moment().subtract(1, 'day');
    const processDateFormatted = date.clone().format('YYYY-MM-DD');
    const processDate = date.clone().get('date');

    // if startDate is Monday, it should include Friday Post 14:00 transactions
    // all of saturdays and all of sundays.
    const adjust = getHolidaysAdjust(date.clone().subtract(1, 'day'));

    const startDate = date.clone()
      .tz('America/Santiago')
      .startOf('day')
      .subtract(adjust, 'day')
      .add(14, 'hours');
    const endDate = date.clone()
      .tz('America/Santiago')
      .endOf('day');

    // Accounts header line
    const accountsWorksheetData: (string | number)[][] = [
      [
        'id',
        'tier',
        'rut',
        'nombre',
        'apellido',
        'saldo antes de las 14',
        'saldo después de las 14',
        'monto de depósitos - reitros después de las 14',
        'tipo'
      ]
    ];

    // initialize accountsWorkSheet with an empty line
    const accountWorksheet = xlsx.utils.aoa_to_sheet([['']]);
    // then we add the table header at another row
    xlsx.utils.sheet_add_aoa(accountWorksheet, accountsWorksheetData, { origin: 'A3' });

    // Deposit header line
    const depositsWorksheetData: (string | number)[][] = [
      [
        'Tipo',
        'RUT Fuente',
        'RUT Destino',
        'ID Destino',
        'Monto',
        'Fecha',
        'Id Transacción',
        'Banco Destino',
        'Tipo de Cuenta',
        'Cuenta'
      ]
    ];

    // Withdraws header line
    const withdrawsWorksheetData: (string | number)[][] = [
      ['RUT', 'ID Fuente', 'Monto', 'Fecha', 'Id Transacción', 'Banco Destino',
        'Tipo de Cuenta', 'Cuenta']
    ];

    // date ranges serves for get its deposits and withdraws
    const options = {
      startDate: startDate.clone().utc().format(),
      endDate: endDate.clone().utc().format()
    };

    const wb = xlsx.utils.book_new();
    let accounts: AccountModel[], deposits: DepositModel[], withdraws: WithdrawModel[];
    deposits = [];
    withdraws = [];


    const depWithOptions = {
      startDate: startDate.format('YYYY-MM-DD HH:mm:ss.SSS'),
      endDate: endDate
        .clone()
        .startOf('day')
        .add(14, 'hours')
        .subtract(1, 'millisecond')
        .format('YYYY-MM-DD HH:mm:ss.SSS')
    };
    logger.info('Getting deposits and withdraws', { options: depWithOptions, processDate: processDateFormatted })

    try {
      // get all deposits and withdraws independently
      [deposits, withdraws] = await Promise.all([
        DepositsRepository.findAll(depWithOptions),
        WithdrawRepository.findAll(depWithOptions)]
      );
    } catch (e) {
      logger.error('Error while getting deposits and withdraws', { message: e.message, processDate: processDateFormatted });
    }

    let page = 1;
    let totalBefore14 = 0;
    let totalAfter14 = 0;
    let retries = 0;
    let lastId;
    const pageSize = 1000;
    // request paginated resource, avoiding network collapse
    while (true) {
      if (retries >= 5) {
        // Something happened with tf-cl-transactions-api
        // inspect that service
        logger.error('Error while getting resource failed more than 5 times', { page, ...options });
        return;
      }
      try {
        // get all accounts
        logger.info('Getting accounts', { ...options, lastId, processDate: processDateFormatted });
        accounts = await AccountRepository.findAllWithBalance({ startDate: options.startDate, endDate: options.endDate }, pageSize, lastId, {
          includeDeposits: true,
          excludeNoBalanceAccounts: false,
          includeWithdraws: true
        });
      } catch (e) {
        logger.error('Error while getting resource', { error: e, processDate: processDateFormatted });
        // retrying
        retries++;
        continue;
      }

      page = page + 1;
      retries = 0;

      if (accounts.length === 0) {
        // no more accounts to get
        break;
      }

      lastId = accounts[accounts.length - 1].id;

      // Iterate over accounts, calculate its balance
      // Deposits made after 14:00 hours by other banks
      // are not taken into account until next day.
      // We also need to add up withdraws post 14:00, because that money
      // is still in the core account
      accounts.forEach((accountModel: AccountModel) => {
        const account = accountModel.toJSON() as IAccount;

        let post14Deposits = 0;
        let post14Withdraws = 0;
        if (account.deposits) {
          post14Deposits = account.deposits.reduce(
            sumDepositsOrWithdraws(processDate),
            0
          );
        }

        if (account.withdraws) {
          post14Withdraws = account.withdraws.reduce(
            sumDepositsOrWithdraws(processDate),
            0
          );
        }

        const pre14Amount =
          (account.pastBalance || 0) - post14Deposits + post14Withdraws;

        const accountsData = [[
          account.id,
          account.category,
          account.ownerNationalId || '',
          account.ownerInfo?.firstName || account.commerceInfo?.name || '',
          account.ownerInfo?.lastName || '',
          pre14Amount,
          account.pastBalance || 0,
          post14Deposits - post14Withdraws,
          account.ownerType
        ]];

        // origin: -1 makes it to append data to the worksheet
        xlsx.utils.sheet_add_aoa(accountWorksheet, accountsData, { origin: -1 })

        totalBefore14 += pre14Amount;
        totalAfter14 += account.pastBalance || 0;
      });
    }

    logger.info('Finished getting accounts', { processDate: processDateFormatted });
    logger.info('Adding totals', { processDate: processDateFormatted });

    // Get the sums of balances and put them at the start
    const totals = [
      [
        '',
        '',
        '',
        '',
        '',
        'saldo antes de las 14',
        'saldo después de las 14',
        '',
        ''
      ],
      ['', '', '', '', '', totalBefore14, totalAfter14, '', ''],
      []
    ];

    xlsx.utils.sheet_add_aoa(accountWorksheet, totals, { origin: 'A1' });

    logger.info('Preparing cashouts', { processDate: processDateFormatted });

    // List all deposits made in the whole day
    deposits.forEach((deposit: DepositModel) => {
      const transactionId =
        deposit.type === 'oneclick'
          ? `${deposit.additionalData.authCode}*${(deposit.fromResourceInfo as IOneClick).brand
          }*${(deposit.fromResourceInfo as IOneClick).lastDigits}`
          : deposit.transactionId;

      depositsWorksheetData.push([
        deposit.type,
        (deposit.fromResourceInfo as IBankAccount)?.nationalId || '',
        deposit.account?.ownerNationalId || '',
        deposit.toAccountId,
        deposit.amount || 0,
        formatDate(deposit.createdAt),
        transactionId,
        (deposit.fromResourceInfo as IBankAccount)?.bankId || '',
        (deposit.fromResourceInfo as IBankAccount)?.accountTypeId || '',
        (deposit.fromResourceInfo as IBankAccount)?.accountNumber || '',
      ]);
    });

    logger.info('Preparing withdraws', { processDate: processDateFormatted });

    // List all withdraws made in the whole day
    withdraws.forEach((withdraw: WithdrawModel) => {
      withdrawsWorksheetData.push([
        withdraw.toResourceInfo.nationalId,
        withdraw.fromAccountId,
        withdraw.amount || 0,
        formatDate(withdraw.createdAt),
        withdraw.transactionId,
        withdraw.toResourceInfo.bankId,
        withdraw.toResourceInfo.bankAccountTypeId,
        withdraw.toResourceInfo.accountNumber
      ]);
    });

    logger.info('Adding worksheets', { processDate: processDateFormatted });
    // Create worksheets from Array of Arrays
    // const accountWorksheet = xlsx.utils.aoa_to_sheet(accountsWorksheetData);
    const depositWorksheet = xlsx.utils.aoa_to_sheet(depositsWorksheetData);
    const withdrawWorksheet = xlsx.utils.aoa_to_sheet(withdrawsWorksheetData);
    // Add worksheets to workbook
    xlsx.utils.book_append_sheet(wb, accountWorksheet, 'Cartera');
    xlsx.utils.book_append_sheet(wb, depositWorksheet, 'Cash In');
    xlsx.utils.book_append_sheet(wb, withdrawWorksheet, 'Cash Out');

    logger.info('Preparing upload', { processDate: processDateFormatted });
    const buffer = xlsx.write(wb, { type: 'buffer' });
    const formatted = endDate.clone().format('YYYYMMDD');
    const filename = `cartera_clientes_${formatted}.xlsx`;
    try {
      const file = storage.file(filename);
      await file.save(buffer);
      logger.info("File successfuly uploaded", { name: filename })
    } catch (error) {
      logger.error("File not uploaded", { error, name: filename });
    }
    return;
  }

  // WIP new way of getting accounts, waiting for approval to remove old way
  // for the moment, we keep both copies
  static async accountsLocal(_: Request, res: Response) {
    // As it is a heavy cron job, we dont care about when it ends
    // this prevents the cron job showing errors
    res.sendStatus(200)
    const date = moment().subtract(1, 'day');

    // if startDate is Monday, it should include Friday Post 14:00 transactions
    // all of saturdays and all of sundays.
    const adjust = getHolidaysAdjust(date.clone().subtract(2, 'day'));

    const startDate = date.clone()
      .tz('America/Santiago')
      .startOf('day')
      .subtract(adjust + 1, 'day')
      .add(14, 'hours');
    const endDate = date.clone()
      .tz('America/Santiago')
      .endOf('day');

    // Accounts header line
    const accountsWorksheetData: (string | number)[][] = [
      [
        'id',
        'tier',
        'rut',
        'nombre',
        'apellido',
        'saldo antes de las 14',
        'tipo'
      ]
    ];

    // Deposit header line
    const depositsWorksheetData: (string | number)[][] = [
      [
        'Tipo',
        'RUT Fuente',
        'RUT Destino',
        'ID Destino',
        'Monto',
        'Fecha',
        'Id Transacción',
        'Banco Destino',
        'Tipo de Cuenta',
        'Cuenta'
      ]
    ];

    // Withdraws header line
    const withdrawsWorksheetData: (string | number)[][] = [
      ['RUT', 'ID Fuente', 'Monto', 'Fecha', 'Id Transacción', 'Banco Destino',
        'Tipo de Cuenta', 'Cuenta']
    ];

    // date ranges serves for get its deposits and withdraws
    const options = {
      startDate: startDate.format('YYYY-MM-DD HH:mm:ss.SSSZ'),
      endDate: endDate
        .startOf('day')
        .add(14, 'hours')
        .subtract(1, 'millisecond')
        .format('YYYY-MM-DD HH:mm:ss.SSSZ')
    };

    const wb = xlsx.utils.book_new();
    let accounts: AccountModel[], deposits: DepositModel[], withdraws: WithdrawModel[];
    deposits = [];
    withdraws = [];

    try {
      // get all deposits and withdraws independently
      [deposits, withdraws] = await Promise.all([
        DepositsRepository.findAll(options),
        WithdrawRepository.findAll(options)]
      );
    } catch (e) {
      logger.error('Error while getting deposits and withdraws', e.message);
    }

    // accounts repository used this as plain string
    // passing directly the localized string doesn't work
    const endDateString = endDate.clone()
      .utc()
      .format();

    let page = 1;
    const pageSize = 1000;
    let totalBefore14 = 0;
    let retries = 0;
    let lastId;
    // request paginated resource, avoiding network collapse
    while (true) {
      if (retries >= 5) {
        // Something happened with tf-cl-transactions-api
        // inspect that service
        logger.error('Error while getting resource failed more than 5 times', {
          page, pageSize, ...options
        });
        return;
      }
      try {
        // get all accounts
        logger.info(`Obteniendo cuentas página ${page}`, {
          options: { page, ...options }
        });
        accounts = await AccountRepository.findAllWithBalance({ endDate: endDateString }, pageSize, lastId);
      } catch (e) {
        logger.error('Error while getting resource', { error: e });
        // retrying
        retries++;
        continue;
      }

      page = page + 1;
      retries = 0;

      if (accounts.length === 0) {
        // no more accounts to get
        break;
      }

      // for each account, push a line to the accountsSheets
      // also, calculate total sum of balances
      accounts.forEach((account: AccountModel) => {
        const pastBalance = (account.toJSON() as IAccount).pastBalance || 0
        accountsWorksheetData.push([
          account.id,
          account.category,
          account.ownerNationalId || '',
          account.ownerInfo?.firstName || account.commerceInfo?.name || '',
          account.ownerInfo?.lastName || '',
          pastBalance,
          account.ownerType
        ]);

        totalBefore14 += pastBalance;
      });
      // save last id for next page
      lastId = accounts[accounts.length - 1].id;
    }

    // Get the sums of balances and put them at the start
    accountsWorksheetData.unshift(
      [
        '',
        '',
        '',
        '',
        '',
        'saldo antes de las 14',
        '',
      ],
      ['', '', '', '', '', totalBefore14, ''],
      []
    );

    // List all deposits made in the whole day
    deposits.forEach((deposit: DepositModel) => {
      const transactionId =
        deposit.type === 'oneclick'
          ? `${deposit.additionalData.authCode}*${(deposit.fromResourceInfo as IOneClick).brand
          }*${(deposit.fromResourceInfo as IOneClick).lastDigits}`
          : deposit.transactionId;

      depositsWorksheetData.push([
        deposit.type,
        (deposit.fromResourceInfo as IBankAccount)?.nationalId || '',
        deposit.account?.ownerNationalId || '',
        deposit.toAccountId,
        deposit.amount || 0,
        formatDate(deposit.createdAt),
        transactionId,
        (deposit.fromResourceInfo as IBankAccount)?.bankId || '',
        (deposit.fromResourceInfo as IBankAccount)?.accountTypeId || '',
        (deposit.fromResourceInfo as IBankAccount)?.accountNumber || '',
      ]);
    });

    // List all withdraws made in the whole day
    withdraws.forEach((withdraw: WithdrawModel) => {
      withdrawsWorksheetData.push([
        withdraw.toResourceInfo.nationalId,
        withdraw.fromAccountId,
        withdraw.amount || 0,
        formatDate(withdraw.createdAt),
        withdraw.transactionId,
        withdraw.toResourceInfo.bankId,
        withdraw.toResourceInfo.bankAccountTypeId,
        withdraw.toResourceInfo.accountNumber
      ]);
    });

    // Create worksheets from Array of Arrays
    const accountWorksheet = xlsx.utils.aoa_to_sheet(accountsWorksheetData);
    const depositWorksheet = xlsx.utils.aoa_to_sheet(depositsWorksheetData);
    const withdrawWorksheet = xlsx.utils.aoa_to_sheet(withdrawsWorksheetData);
    // Add worksheets to workbook
    xlsx.utils.book_append_sheet(wb, accountWorksheet, 'Cartera');
    xlsx.utils.book_append_sheet(wb, depositWorksheet, 'Cash In');
    xlsx.utils.book_append_sheet(wb, withdrawWorksheet, 'Cash Out');

    const buffer = xlsx.write(wb, { type: 'buffer' });
    const formatted = endDate.clone().format('YYYYMMDD');
    const filename = `cartera_clientes_${formatted}.xlsx`;
    try {
      const file = storage.file(filename);
      await file.save(buffer);
      logger.info("File successfuly uploaded", { name: filename })
    } catch (error) {
      logger.error("File not uploaded", { error, name: filename });
    }
    return;
  }

  // Generates an Excel file with only deposits and withdraws for a period
  // its much like a shortcut as we work in a new way to generate the account file
  static async depositsAndWithdraws(_: Request, res: Response) {
    // As it is a heavy cron job, we dont care about when it ends
    // this prevents the cron job showing errors
    res.sendStatus(200)
    const date = moment();
    const processDate = date.clone().format('YYYY-MM-DD');
    logger.info('Started CASHIN-CASHOUT file', { processDate });

    const isHoliday = getHolidaysAdjust(date.clone());
    if (isHoliday > 1) {
      logger.info('Its holiday! no running today', { processDate });
      return;
    }

    // if startDate is Monday, it should include Friday Post 14:00 transactions
    // all of saturdays and all of sundays.
    const adjust = getHolidaysAdjust(date.clone().subtract(1, 'day'));

    const startDate = date.clone()
      .tz('America/Santiago')
      .startOf('day')
      .subtract(adjust, 'day')
      .add(14, 'hours');
    const endDate = date.clone()
      .tz('America/Santiago')
      .endOf('day');

    // Deposit header line
    const depositsWorksheetData: (string | number)[][] = [
      [
        'Tipo',
        'RUT Fuente',
        'RUT Destino',
        'ID Destino',
        'Monto',
        'Fecha',
        'Id Transacción',
        'Banco Destino',
        'Tipo de Cuenta',
        'Cuenta'
      ]
    ];

    // Withdraws header line
    const withdrawsWorksheetData: (string | number)[][] = [
      ['RUT', 'ID Fuente', 'Monto', 'Fecha', 'Id Transacción', 'Banco Destino',
        'Tipo de Cuenta', 'Cuenta']
    ];

    const wb = xlsx.utils.book_new();
    let deposits: DepositModel[], withdraws: WithdrawModel[];
    deposits = [];
    withdraws = [];

    const options = {
      startDate: startDate.format('YYYY-MM-DD HH:mm:ss.SSSZ'),
      endDate: endDate
        .startOf('day')
        .add(14, 'hours')
        .subtract(1, 'millisecond')
        .format('YYYY-MM-DD HH:mm:ss.SSSZ')
    };

    logger.info('Getting Deposits and Withdraws', { processDate });
    try {
      // get all deposits and withdraws independently
      [deposits, withdraws] = await Promise.all([
        DepositsRepository.findAll(options),
        WithdrawRepository.findAll(options)]
      );
    } catch (e) {
      logger.error('Error while getting deposits and withdraws', e.message);
    }
    logger.info('Preparing Cashouts', { processDate });
    // List all deposits made in the whole day
    deposits.forEach((deposit: DepositModel) => {
      const transactionId =
        deposit.type === 'oneclick'
          ? `${deposit.additionalData.authCode}*${(deposit.fromResourceInfo as IOneClick).brand
          }*${(deposit.fromResourceInfo as IOneClick).lastDigits}`
          : deposit.transactionId;

      depositsWorksheetData.push([
        deposit.type,
        (deposit.fromResourceInfo as IBankAccount)?.nationalId || '',
        deposit.account?.ownerNationalId || '',
        deposit.toAccountId,
        deposit.amount || 0,
        formatDate(deposit.createdAt),
        transactionId,
        (deposit.fromResourceInfo as IBankAccount)?.bankId || '',
        (deposit.fromResourceInfo as IBankAccount)?.accountTypeId || '',
        (deposit.fromResourceInfo as IBankAccount)?.accountNumber || '',
      ]);
    });

    logger.info('Preparing Withdraws', { processDate });
    // List all withdraws made in the whole day
    withdraws.forEach((withdraw: IWithdraw) => {
      withdrawsWorksheetData.push([
        withdraw.toResourceInfo.nationalId,
        withdraw.fromAccountId,
        withdraw.amount || 0,
        formatDate(withdraw.createdAt),
        withdraw.transactionId,
        withdraw.toResourceInfo.bankId,
        withdraw.toResourceInfo.bankAccountTypeId,
        withdraw.toResourceInfo.accountNumber
      ]);
    });

    // Create worksheets from Array of Arrays
    const depositWorksheet = xlsx.utils.aoa_to_sheet(depositsWorksheetData);
    const withdrawWorksheet = xlsx.utils.aoa_to_sheet(withdrawsWorksheetData);
    // Add worksheets to workbook
    xlsx.utils.book_append_sheet(wb, depositWorksheet, 'Cash In');
    xlsx.utils.book_append_sheet(wb, withdrawWorksheet, 'Cash Out');

    const buffer = xlsx.write(wb, { type: 'buffer' });
    const formatted = endDate.clone().format('YYYYMMDD');
    const filename = `cashin_cashout_${formatted}.xlsx`;
    try {
      const file = storage.file(filename);
      await file.save(buffer);
      logger.info("File successfuly uploaded", { name: filename })
    } catch (error) {
      logger.error("File not uploaded", { error, name: filename });
    }
    return;
  }
}

// Utils functions
const sumDepositsOrWithdraws = (processDate: number) => (
  acc: number,
  current: IDeposit | IWithdraw
) => {
  const transactionDate = moment(current.createdAt).tz('America/Santiago');
  if (
    transactionDate.hours() >= 14 &&
    transactionDate.get('date') === processDate
  ) {
    return acc + current.amount;
  }
  return acc;
};

export default ExportsPublicController;

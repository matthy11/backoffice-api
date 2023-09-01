import Account, { AccountModel } from "../interfaces/Account";
import { Sequelize, Op } from "sequelize";
import { Withdraw, Deposit, Movement } from "../interfaces";
import { Moment } from "moment";

export default class AccountRepository {
  static findAllWithBalance(
    {
      startDate,
      endDate
    }: {
      startDate?: string;
      endDate: string
    },
    pageSize: number,
    lastId?: string,
    options: {
      excludeNoBalanceAccounts?: boolean;
      includeDeposits?: boolean;
      includeWithdraws?: boolean;
    } = {
        includeDeposits: false,
        includeWithdraws: false,
        excludeNoBalanceAccounts: true
      }
  ): Promise<AccountModel[]> {
    // parse endDate to fix a literal-query
    const date = endDate.replace('T', ' ').replace('Z', '');
    // subquery to get the las movement made
    const subquery = Sequelize.literal(`(
      SELECT remainingBalance
      FROM movements m WHERE m.createdAt <= '${date}'
      AND m.accountId = accounts.id
      AND m.reversed = 0
      ORDER BY m.createdAt DESC
      LIMIT 1)`);
    // having condition to remove those with no movements/no balance
    const having = Sequelize.literal(`pastBalance is NOT NULL AND pastBalance > 0`);

    // includes deposits and/or withdraws
    const includeDeposits = options.includeDeposits ? [{
      model: Deposit,
      required: false,
      where: {
        reversed: 0,
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      }
    }] : []

    const includeWithdraws = options.includeWithdraws ? [{
      model: Withdraw,
      required: false,
      where: {
        reversed: 0,
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      }
    }] : [];

    // merge them both
    const include = [...includeDeposits, ...includeWithdraws];

    // final query, naming the subquery result as 'pastBalance'
    return Account.findAll({
      attributes: {
        include: [
          [subquery, 'pastBalance']
        ]
      },
      ...(options.includeWithdraws || options.includeDeposits) && {
        include
      },
      // conditionally add a where for pagination
      // limit & offset load everything into memory, and the higher the offset,
      // the higher the memory ussage. By using a mere where condition,
      // only those records that met this criteria are brought into memory,
      // making this "pagination" a lot faster
      where: {
        ...lastId && { id: { [Op.gt]: lastId } },
        createdAt: { [Op.lte]: endDate }
      },
      ...options.excludeNoBalanceAccounts && having,
      limit: pageSize,
      order: ['id']
    });
  };

  static async getNormativeD50(startDate: Moment, endDate: Moment, pageSize: number, lastId?: string):
    Promise<AccountModel[]> {
    const format = 'YYYY-MM-DD HH:mm:ss'
    const dateRange = {
      createdAt: {
        [Op.gte]: startDate.clone().format(format),
        [Op.lt]: endDate.clone().format(format)
      }
    }

    const endDateString = endDate.clone().utc().format(format)

    const pastBalanceSubquery = Sequelize.literal(`(
      SELECT remainingBalance
      FROM movements m WHERE m.createdAt < '${endDateString}'
      AND m.accountId = accounts.id
      AND m.reversed = 0
      ORDER BY m.createdAt DESC
      LIMIT 1)`);

    // used to flip inequality and value to use (1 for count or balanceVariation if sum)
    const caseGenerator = (type: 'deposit' | 'charge', sumOrCount: 'sum' | 'count') => {
      const value = sumOrCount === 'sum' ? 'movements.balanceVariation' : '1'
      const sign = type === 'deposit' ? '>=' : '<'
      // balanceVariation is negative for charges, so we flip the sign to 
      // show them as positives
      const valueSign = sumOrCount === 'sum' && type === 'charge' ? '-' : '';
      return `
        CASE
         WHEN movements.accountId IS NOT NULL
         AND movements.balanceVariation ${sign} 0
         THEN ${valueSign}${value}
         ELSE 0 
        END
      `
    }

    return Account.findAll({
      attributes: [
        ['ownerNationalId', 'RUT'],
        'ownerInfo',
        'ownerType',
        ['id', 'OP'],
        [Sequelize.fn('MAX', 20), 'TIP_ACREEN'],
        [Sequelize.literal('(CASE WHEN accounts.ownerType = "commerce" THEN 1 ELSE 4 END)'), 'TIP_CLI'],
        [Sequelize.fn('SUM',
          Sequelize.literal(caseGenerator('deposit', 'count'))), 'N_ABONOS'],
        [Sequelize.fn('SUM', Sequelize.literal(caseGenerator('deposit', 'sum'))), 'M_ABONOS'],
        [Sequelize.fn('SUM', Sequelize.literal(caseGenerator('charge', 'count'))), 'N_CARGOS'],
        [Sequelize.fn('SUM', Sequelize.literal(caseGenerator('charge', 'sum'))), 'M_CARGOS'],
        [Sequelize.fn('COALESCE', pastBalanceSubquery, 0), 'saldo']
      ],
      include: [{
        model: Movement,
        attributes: [],
        required: false,
        where: {
          reversed: false,
          ...dateRange
        }
      }],
      where: {
        ...lastId && { id: { [Op.gt]: lastId } },
        createdAt: {
          [Op.lt]: endDate.clone().format(format)
        },
        [Op.or]: [
          {
            [Op.and]: {
              category: {
                [Op.in]: ['t2', 't3']
              },
              ownerType: 'user'
            }
          },
          {
            ownerType: "commerce"
          }
        ]
      },
      limit: pageSize,
      subQuery: false, // allows limit to not generate a subquery on accounts
      order: ['id'],
      group: ['accounts.id'],
      having: Sequelize.literal('N_CARGOS > 0 OR N_ABONOS > 0 OR saldo > 0')
    })
  }
}
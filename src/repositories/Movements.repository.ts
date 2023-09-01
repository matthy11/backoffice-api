import { DataOptions } from "./index";
import Sequelize, { Op } from "sequelize";
import { sequelize } from "../config/database";
import {
  Movement,
  IMovement,
  Payment,
  Account,
  Deposit,
  Withdraw,
  Refund, Sale, PointOfSales, Store, Commerce, ChekUser
} from "../interfaces";
import logger from "../logger";

export default class MovementsRepository {
  // Accounts movement does not have the correct remainingBalance
  // because they are related by sourceId, not only account Id (as in findAll method)
  // so we get all source id related to an accountId,
  // then we get the movements related to the sourceids
  static async findAllForAccount(
    accountId: string | null,
    options: DataOptions
  ): Promise<IMovement[]> {
    logger.info('[MovementsRepository:findAllForAccount] getting movements', { accountId, options })
    const accountMovements = await Movement.findAll({
      attributes: ["sourceId"],
      where: { accountId }
    });

    const sourceIds = accountMovements.map(
      ({ sourceId }: IMovement) => sourceId
    );

    const order: any = [
      ["createdAt", options.orderBy ? options.orderBy : "ASC"],
      ["additionalData", "ASC"]
    ];

    let where: any = {
      accountId,
      sourceId: {
        [Op.in]: sourceIds
      },
      ...(options.startDate &&
        options.endDate && {
        createdAt: {
          [Op.gte]: options.startDate,
          [Op.lte]: options.endDate
        }
      })
    };
    // 1 cash-in, 2 cash-out, 3 to commerce, 4 to persons
    if (options.filterValues && options.filterValues.length > 0) {
      const orCondition: object[] = [];
      options.filterValues.forEach((type: string) => {
        switch (type) {
          case "1":
            orCondition.push({ sourceType: "deposit" });
            break;
          case "2":
            orCondition.push({ sourceType: "withdraw" });
            break;
          case "3":
            orCondition.push(
              Sequelize.literal(`payment.receiverInfo->"$.type"='commerce'`)
            );
            break;
          case "4":
            orCondition.push(
              Sequelize.literal(`payment.receiverInfo->"$.type"='user'`)
            );
            break;
          case "5":
            orCondition.push(
              Sequelize.literal(`payment.payerInfo->"$.type"='commerce'`)
            );
            break;
        }
      });
      where = {
        ...where,
        [Op.and]: {
          [Op.or]: orCondition
        }
      };
    }

    const movements = await Movement.findAll({
      limit: options.limit,
      subQuery: false,
      include: [
        {
          model: Payment,
          required: false, // Convierte el Left join en Inner Join,
          include: [
            {
              model: Refund,
              separate: true
            },
            {
              model: Account,
              as: "payer",
              include: [{
                model: Commerce,
                required: false,
                as: "commerceInfo",
              }, {
                model: ChekUser,
                required: false,
                as: "ownerInfo"
              }]
            },
            {
              model: Account,
              as: "receiver",
              include: [{
                model: Commerce,
                required: false,
                as: "commerceInfo",
              }, {
                model: ChekUser,
                required: false,
                as: "ownerInfo"
              }]
            }, {
              model: Sale,
              attributes: ["pointOfSalesInfo"],
              include: [{
                model: PointOfSales,
                attributes: ["id", "name"],
                include: [{
                  model: Store,
                  attributes: ["storeName", "storeId"],
                  required: false
                }]
              }]
            }
          ]
        },
        {
          model: Account,
          include: [{
            model: Commerce,
            required: false,
            as: "commerceInfo",
          }, {
            model: ChekUser,
            required: false,
            as: "ownerInfo"
          }]
        },
        {
          model: Deposit,
          required: false,
          include: [{
            model: Sale, // TEF payment
            include: [{
              model: PointOfSales,
              include: [{
                model: Store,
                required: false
              }]
            }]
          }]
        },
        {
          model: Withdraw,
          required: false,
          include: [{
            model: Deposit, // refunded TEF payment deposit
            required: false,
            include: [{
              model: Sale,
              include: [{
                model: PointOfSales,
                include: [{
                  model: Store,
                  required: false
                }]
              }]
            }]
          }]
        }
      ],
      order,
      where
    });

    return movements;
  }

  static async findAll(options: DataOptions): Promise<IMovement[]> {
    // Will always have a where, if not, it will search the entire movements db
    const now = new Date();
    const start = new Date().setHours(new Date().getHours() - 4);
    let where: any = {
      createdAt: {
        [Op.gte]: options.startDate || start,
        [Op.lte]: options.endDate || now
      }
    };
    // 1 cash-in, 2 cash-out, 3 to commerce, 4 to persons, 5 refunds
    if (options.filterValues && options.filterValues.length > 0) {
      const orCondition: object[] = [];
      options.filterValues.forEach((type: string) => {
        switch (type) {
          case "1":
            orCondition.push({ sourceType: "deposit" });
            break;
          case "2":
            orCondition.push({ sourceType: "withdraw" });
            break;
          case "3":
            orCondition.push(
              Sequelize.literal(`payment.receiverInfo->"$.type"='commerce'`)
            );
            break;
          case "4":
            orCondition.push(
              Sequelize.literal(`payment.receiverInfo->"$.type"='user'`)
            );
            break;
          case "5":
            orCondition.push(
              Sequelize.literal(`payment.payerInfo->"$.type"='commerce'`)
            );
            break;
        }
      });
      where = {
        ...where,
        [Op.and]: {
          [Op.or]: orCondition
        }
      };
    }

    const order: any = [
      ["createdAt", options.orderBy ? options.orderBy : "ASC"]
    ];

    const movements = await Movement.findAll({
      limit: options.limit,
      // Subquery to force limit on whole query, not just movements
      // in that way we can use payment.payerInfo in where condition
      // this only works because movements' relationships with accounts, payments,
      // deposits and withdraws is 1:1
      subQuery: false,
      attributes: {
        exclude: ["relatedResourceInfo", "updatedAt", "remainingBalance"]
      },
      include: [
        {
          model: Payment,
          attributes: { exclude: ["payerInfo", "receiverInfo"] },
          required: false, // Convierte el Left join en Inner Join,
          include: [
            {
              model: Refund
            },
            {
              model: Account,
              attributes: ["ownerInfo", "ownerType"],
              as: "payer"
            },
            {
              model: Account,
              attributes: ["ownerInfo", "ownerType"],
              as: "receiver"
            }
          ]
        },
        {
          model: Account,
          attributes: ["ownerInfo"]
        },
        {
          model: Deposit,
          required: false
        },
        {
          model: Withdraw,
          required: false
        }
      ],
      order,
      where
    });

    return movements;
  }

  static async findAllForCommerce(
    toAccountId: string,
    options: DataOptions
  ): Promise<IMovement[]> {
    const order: any = [
      ["createdAt", options.orderBy ? options.orderBy : "ASC"],
      ["additionalData", "ASC"]
    ];
    const movements = await Movement.findAll({
      include: [
        {
          model: Payment,
          required: true, // Convierte el Left join en Inner Join,
          where: {
            toAccountId,
            reversed: false
          },
          include: [
            {
              model: Refund
            },
            {
              model: Account,
              attributes: ["ownerInfo", "ownerType"],
              as: "payer"
            },
            {
              model: Account,
              attributes: ["ownerInfo", "ownerType"],
              as: "receiver"
            }
          ]
        }
      ],
      order,
      where: {
        ...(options.startDate &&
          options.endDate && {
          createdAt: {
            [Op.gte]: options.startDate,
            [Op.lte]: options.endDate
          }
        }),
        accountId: toAccountId
      }
    });

    return movements;
  }

  static async countByType(
    options: { start?: string; end?: string },
    mainOptions: { sourceType: string; sourceSubtype?: string },
    accountId?: string
  ): Promise<number> {
    const where = {
      ...(options.start &&
        options.end && {
        createdAt: {
          [Op.gte]: options.start,
          [Op.lte]: options.end
        }
      }),
      ...(accountId && { accountId }),
      [Op.and]: mainOptions
    };

    const result = await Movement.count({
      distinct: true,
      col: "sourceId",
      where
    });

    return result;
  }

  static async countByTypes(
    options: { start?: string; end?: string },
    accountId?: string
  ): Promise<any> {
    const whereConditions: any[] = [];
    // movementFactor is set to 0.5 if no accountId is present, because each p2p, p2c or refund
    // creates 2 movements row, and we dont want to count them twice
    let movementFactor = 0.5;
    if (options && options.start && options.end) {
      whereConditions.push(
        `movements.createdAt >= '${options.start}' AND movements.createdAt <= '${options.end}'`
      );
    }

    if (accountId) {
      whereConditions.push(`movements.accountId = '${accountId}'`);
      // when accountId is present, the movement parity disappears, so it is safe to use a factor of 1
      movementFactor = 1;
    }

    // Inner query categorize each movement as a deposit, a withdraw, p2c, p2p or refund,
    // outer query sums those values and gives them as a result.
    return sequelize.query(
      `
    SELECT SUM(deposits) as deposits,
    SUM(withdraws) as withdraws,
    SUM(paymentsToCommerce) as paymentsToCommerce,
    SUM(paymentsToPersons) as paymentsToPersons,
    SUM(refunds) as refunds
    FROM (SELECT
      (CASE WHEN movements.sourceType = 'deposit' THEN 1 ELSE 0 END) AS deposits,
      (CASE WHEN movements.sourceType = 'withdraw' THEN 1 ELSE 0 END) AS withdraws,
      (CASE WHEN payments.payerInfo->"$.type"='user' AND payments.receiverInfo->"$.type"='commerce' THEN ${movementFactor} ELSE 0 END) AS paymentsToCommerce,
      (CASE WHEN payments.payerInfo->"$.type"='user' AND payments.receiverInfo->"$.type"='user' THEN ${movementFactor} ELSE 0 END) AS paymentsToPersons,
      (CASE WHEN payments.payerInfo->"$.type"='commerce' AND payments.receiverInfo->"$.type"='user' THEN ${movementFactor} ELSE 0 END) AS refunds
       FROM movements
       LEFT OUTER JOIN payments ON movements.sourceId = payments.id
       ${whereConditions.length > 0
        ? "WHERE movements.reversed = 0 AND " + whereConditions.join(" AND ")
        : "WHERE movements.reversed = 0"
      })
    as aggregates;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
  }
}

import { DataOptions } from './index';
import { Op, Sequelize } from 'sequelize';
import {
  Payment,
  IPayment,
  Sale,
  Account,
  ChekUser,
  Commerce,
  Movement
} from '../interfaces';
import { MovementModel } from '../interfaces/Movement';

export default class PaymentsRepository {
  static async findTotalPayedTo(
    type: 'commerce' | 'user',
    options?: DataOptions
  ): Promise<any> {
    const payment = await Payment.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount']
      ],
      where: {
        reversed: false,
        [Op.and]: Sequelize.literal(`receiverInfo->"$.type"='${type}'`),
        ...(options &&
          options.startDate &&
          options.endDate && {
            createdAt: {
              [Op.gte]: options.startDate,
              [Op.lte]: options.endDate
            }
          })
      }
    });

    return payment;
  }

  static async findTotalReceivedFrom(
    type: 'commerce' | 'user',
    options?: DataOptions
  ): Promise<any> {
    const payment = await Payment.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount']
      ],
      where: {
        reversed: false,
        [Op.and]: Sequelize.literal(`payerInfo->"$.type"='${type}'`),
        ...(options &&
          options.startDate &&
          options.endDate && {
            createdAt: {
              [Op.gte]: options.startDate,
              [Op.lte]: options.endDate
            }
          })
      }
    });

    return payment;
  }

  static async getDataPerDay(options: {
    profileId: string;
    dateRange: { start: string; end: string };
    limit?: number;
  }): Promise<any[]> {
    const result = await Payment.findAll({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'countTransaction'],
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount'],
        [Sequelize.fn('DAY', Sequelize.col('createdAt')), 'day'],
        [Sequelize.fn('MONTH', Sequelize.col('createdAt')), 'month'],
        [Sequelize.fn('YEAR', Sequelize.col('createdAt')), 'year'],
        [Sequelize.fn('avg', Sequelize.col('amount')), 'average']
      ],
      where: {
        toAccountId: options.profileId,
        ...(options.dateRange.start &&
          options.dateRange.end && {
            createdAt: {
              [Op.between]: [options.dateRange.start, options.dateRange.end]
            }
          }),
        reversed: false,
        refundedPaymentId: {
          [Op.eq]: null
        }
      },
      group: [
        Sequelize.fn('YEAR', Sequelize.col('createdAt')),
        Sequelize.fn('MONTH', Sequelize.col('createdAt')),
        Sequelize.fn('DAY', Sequelize.col('createdAt'))
      ],
      order: [
        [Sequelize.fn('YEAR', Sequelize.col('createdAt')), 'DESC'],
        [Sequelize.fn('MONTH', Sequelize.col('createdAt')), 'DESC'],
        [Sequelize.fn('DAY', Sequelize.col('createdAt')), 'DESC']
      ],
      limit: options.limit && options.limit > 90 ? 90 : options.limit
    });

    return result;
  }

  static async getAggregateFor(options: {
    profileId: string;
    dates: { start: string; end: string };
  }): Promise<any> {
    const result = await Payment.findOne({
      attributes: [
        [Sequelize.fn('min', Sequelize.col('amount')), 'minPrice'],
        [Sequelize.fn('max', Sequelize.col('amount')), 'maxPrice'],
        [Sequelize.fn('sum', Sequelize.col('amount')), 'total'],
        [Sequelize.fn('avg', Sequelize.col('amount')), 'average'],
        [Sequelize.fn('COUNT', Sequelize.col('amount')), 'transactions']
      ],

      where: {
        toAccountId: options.profileId,
        reversed: false,
        refundedPaymentId: {
          [Op.eq]: null
        },
        ...(options.dates &&
          options.dates.start &&
          options.dates.end && {
            createdAt: {
              [Op.between]: [options.dates.start, options.dates.end]
            }
          })
      },
      raw: true
    });

    return result;
  }

  static async getUserAggregate(accountId: string): Promise<IPayment[]> {
    const aggregate = await Payment.findAll({
      attributes: [[Sequelize.fn('sum', Sequelize.col('amount')), 'total']],
      where: {
        fromAccountId: accountId,
        reversed: false
      }
    });
    return aggregate;
  }

  static async findAllPaymentSales(
    options: DataOptions,
    includeReversed: boolean = true // when false, we assume it is for reporting
  ): Promise<IPayment[]> {
    const results = await Payment.findAll({
      limit: options.limit,
      order: [['createdAt', options.orderBy ? options.orderBy : 'ASC']],
      ...(!includeReversed && {
        include: [
          {
            model: Sale,
            required: false
          }
        ]
      }),
      where: {
        ...(options.startDate &&
          options.endDate && {
            createdAt: {
              [Op.gte]: options.startDate,
              [Op.lte]: options.endDate
            }
          }),
        ...(options.profileId && {
          toAccountId: options.profileId
        }),
        ...(!includeReversed && {
          reversed: 0
        })
      }
    });
    return results;
  }

  // Return all person-commerce to other users or commerce payments
  static async findAll(options: DataOptions): Promise<IPayment[]> {
    const results = await Payment.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Account,
          attributes: ['id', 'ownerNationalId', 'phoneNumber', 'email'],
          as: 'payer',
          include: [
            {
              model: ChekUser,
              required: false,
              as: 'ownerInfo'
            },
            {
              model: Commerce,
              required: false,
              as: 'commerceInfo'
            }
          ]
        },
        {
          model: Account,
          attributes: ['id', 'ownerNationalId', 'phoneNumber', 'email'],
          as: 'receiver',
          include: [
            {
              model: ChekUser,
              required: false,
              as: 'ownerInfo'
            },
            {
              model: Commerce,
              required: false,
              as: 'commerceInfo'
            }
          ]
        }
      ],
      where: {
        reversed: false,
        ...(options.startDate &&
          options.endDate && {
            createdAt: {
              [Op.lte]: options.endDate,
              [Op.gte]: options.startDate
            }
          })
      }
    });
    return results;
  }

  static findAllMonitor({
    startDate,
    endDate
  }: {
    startDate: string;
    endDate: string;
  }): Promise<MovementModel[]> {
    return Movement.findAll({
      include: [
        {
          model: Payment,
          required: true,
          as: 'payment',
          where: {
            createdAt: {
              [Op.gte]: startDate,
              [Op.lte]: endDate
            }
            //reversed: 0,
          },
          include: [
            {
              model: Account,
              attributes: ['id', 'ownerNationalId', 'phoneNumber', 'email'],
              as: 'payer',
              include: [
                {
                  model: ChekUser,
                  required: false,
                  as: 'ownerInfo'
                },
                {
                  model: Commerce,
                  required: false,
                  as: 'commerceInfo'
                }
              ]
            },
            {
              model: Account,
              attributes: ['id', 'ownerNationalId', 'phoneNumber', 'email'],
              as: 'receiver',
              include: [
                {
                  model: ChekUser,
                  required: false,
                  as: 'ownerInfo'
                },
                {
                  model: Commerce,
                  required: false,
                  as: 'commerceInfo'
                }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'ASC']]
    });
  }
}

import { DepositModel } from '../interfaces/Deposit';
import { Deposit, Account, ChekUser, Movement } from '../interfaces';
import { Op } from 'sequelize';
import { MovementModel } from '../interfaces/Movement';

export default class DepositsRepository {
  static findAll({
    startDate,
    endDate
  }: {
    startDate: string;
    endDate: string;
  }): Promise<DepositModel[]> {
    return Deposit.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        },
        reversed: 0
      },
      include: [{ model: Account }],
      order: [['createdAt', 'ASC']]
    });
  }

  // static findAllMonitor({
  //   startDate,
  //   endDate
  // }: {
  //   startDate: string;
  //   endDate: string;
  // }): Promise<DepositModel[]> {
  //   return Deposit.findAll({
  //     where: {
  //       createdAt: {
  //         [Op.gte]: startDate,
  //         [Op.lte]: endDate
  //       },
  //       reversed: 0
  //     },
  //     include: [
  //       {
  //         model: Account,
  //         attributes: ['id', 'ownerNationalId', 'phoneNumber', 'email'],
  //         as: 'depositreceiver',
  //         include: [
  //           {
  //             model: ChekUser,
  //             required: false,
  //             as: 'ownerInfo'
  //           }
  //         ]
  //       }
  //     ],
  //     order: [['createdAt', 'ASC']]
  //   });
  // }

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
          model: Deposit,
          required: true,
          as: 'deposit',
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
              as: 'depositreceiver',
              include: [
                {
                  model: ChekUser,
                  required: false,
                  as: 'ownerInfo'
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

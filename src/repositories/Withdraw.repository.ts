import { WithdrawModel } from '../interfaces/Withdraw';
import { Withdraw, Account, ChekUser, Movement } from '../interfaces';
import { Op } from 'sequelize';
import { MovementModel } from '../interfaces/Movement';

export default class WithdrawRepository {
  static findAll({
    startDate,
    endDate
  }: {
    startDate: string;
    endDate: string;
  }): Promise<WithdrawModel[]> {
    return Withdraw.findAll({
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
          model: Withdraw,
          required: true,
          as: 'withdraw',
          where: {
            createdAt: {
              [Op.gte]: startDate,
              [Op.lte]: endDate
            },
            //reversed: 0,
            type: { [Op.notIn]: ['credit-card-purchase, withdraw-plaft'] }
          },
          include: [
            {
              model: Account,
              attributes: ['id', 'ownerNationalId', 'phoneNumber', 'email'],
              as: 'withdrawSourceAccount',
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

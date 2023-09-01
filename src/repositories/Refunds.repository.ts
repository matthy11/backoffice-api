import { Op } from "sequelize";
import { Refund, IRefund } from "./../interfaces";
import { DataOptions } from "./index";

export default class RefundsRepository {
  static async findAll(options: DataOptions): Promise<IRefund[]> {
    const results = await Refund.findAll({
      limit: options.limit,
      order: [["createdAt", options.orderBy ? options.orderBy : "ASC"]],
      where: {
        ...(options.startDate &&
          options.endDate && {
            createdAt: {
              [Op.gte]: options.startDate,
              [Op.lte]: options.endDate
            }
          }),
        ...(options.profileId && {
          fromAccountId: options.profileId
        })
      }
    });
    return results;
  }
}

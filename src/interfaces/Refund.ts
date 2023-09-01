// Info: https://sequelize.org/master/manual/typescript.html
import {
  Model,
  DataTypes,
} from "sequelize";
import { sequelize, GenericStatic } from "../config/database";

export interface IRefund extends Model {
  readonly id: number;
  readonly paymentId: string;
  readonly transactionId: string | null;
  readonly amount: number;
  readonly refundPaymentId: string;
  readonly toAccountId: string;
  readonly fromAccountId: string;
  readonly additionalData: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly refundWithdraws: {
    [key: string]:
    {
      amount: number;
      fromAccountId: string;
      fromAccountType: string;
    }
  } | null;
  readonly depositId: string | null;
  readonly institutionId: string | null;
  readonly reversed: boolean | null;
  readonly reversedAt: string | null;
  readonly refundReverseId: string | null;
}

// refund -> table Refunds
const Refund = sequelize.define("refund", {
  id: {
    primaryKey: true,
    type: DataTypes.STRING
  },
  paymentId: { type: DataTypes.STRING },
  transactionId: { type: DataTypes.STRING },
  amount: { type: DataTypes.INTEGER },
  refundPaymentId: { type: DataTypes.STRING },
  toAccountId: { type: DataTypes.STRING },
  fromAccountId: { type: DataTypes.STRING },
  additionalData: {
    type: DataTypes.STRING(2000),
    get(this: IRefund): any {
      const resource = JSON.parse(this.getDataValue("additionalData"));
      return resource;
    }
  },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },

  refundWithdraws: { type: DataTypes.JSON, },
  depositId: { type: DataTypes.STRING, },
  institutionId: { type: DataTypes.STRING, },
  reversed: { type: DataTypes.BOOLEAN, },
  reversedAt: { type: DataTypes.STRING, },
  refundReverseId: { type: DataTypes.STRING, },
}) as GenericStatic<IRefund>;

export default Refund;

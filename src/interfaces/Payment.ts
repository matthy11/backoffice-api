// Info: https://sequelize.org/master/manual/typescript.html
import { Model, DataTypes } from "sequelize";
import { sequelize, GenericStatic } from "../config/database";
import { ISale } from "./Sale";
import { IAccount } from "./Account";
import logger from "../logger";

export interface IPayment extends Model {
  readonly id: string;
  readonly tipPaymentId: string | null;
  readonly toAccountId: string;
  readonly chargeId: string | null;
  readonly refundedPaymentId: string | null;
  readonly reversedAt: string | null;
  readonly authorizationId: string | null;
  readonly additionalData: string | null;
  readonly payerInfo: { firstName?: string; lastName?: string; type: string } | null;
  readonly receiverInfo: { firstName?: string; lastName?: string; type: string } | null;
  readonly chargeAdditionalData: string | null;
  readonly message: string;
  readonly voidId: string | null;
  readonly transactionId: string | null;
  readonly tipFromPaymentId: string | null;
  readonly currency: string;
  readonly fromAccountId: string;
  readonly channel: string;
  readonly amount: number;
  readonly reversed: boolean;
  readonly type: string;
  readonly tipAmount: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;

  readonly sale: ISale | null;
  readonly payer: IAccount;
  readonly receiver: IAccount;
}

const Payment = sequelize.define("payment", {
  id: { type: DataTypes.STRING, primaryKey: true },
  tipPaymentId: { type: DataTypes.STRING },
  toAccountId: { type: DataTypes.STRING },
  chargeId: { type: DataTypes.STRING },
  refundedPaymentId: { type: DataTypes.STRING },
  reversedAt: { type: DataTypes.STRING },
  authorizationId: { type: DataTypes.STRING },
  additionalData: {
    type: DataTypes.STRING,
    get(this: IPayment): any {
      try {
        const resource = JSON.parse(this.getDataValue("additionalData"));
        return resource;
      } catch (e) {
        const id = this.getDataValue("id");
        logger.error(`Failed to parse Payment#${id}.additionalData`);
        return null;
      }
    }
  },
  message: {
    type: DataTypes.STRING,
    get(this: IPayment): string {
      try {
        const resource = decodeURIComponent(this.getDataValue("message"));
        return resource
      } catch (error) {
        const id = this.getDataValue("id");
        logger.error("Failed to decode", id, this.getDataValue("message"))
        return this.getDataValue("message");
      }

    }
  },
  voidId: { type: DataTypes.STRING },
  transactionId: { type: DataTypes.STRING },
  tipFromPaymentId: { type: DataTypes.STRING },
  currency: { type: DataTypes.STRING },
  fromAccountId: { type: DataTypes.STRING },
  channel: { type: DataTypes.STRING },
  amount: { type: DataTypes.INTEGER },
  reversed: { type: DataTypes.BOOLEAN },
  type: { type: DataTypes.STRING },
  tipAmount: { type: DataTypes.INTEGER },
  payerInfo: {
    type: DataTypes.STRING(2000),
    get(this: IPayment): any {
      try {
        const resource = JSON.parse(this.getDataValue("payerInfo"));
        return resource;
      } catch (e) {
        const id = this.getDataValue("id");
        logger.error(`Failed to parse Payment#${id}.payerInfo`);
        return null;
      }
    }
  },
  receiverInfo: {
    type: DataTypes.STRING(2000),
    get(this: IPayment): any {
      try {
        const resource = JSON.parse(this.getDataValue("receiverInfo"));
        return resource;
      } catch (e) {
        const id = this.getDataValue("id");
        logger.error(`Failed to parse Payment#${id}.receiverInfo`);
        return null;
      }
    }
  },
  chargeAdditionalData: {
    type: DataTypes.STRING(2000),
    get(this: IPayment): any {
      try {
        const resource = JSON.parse(this.getDataValue("chargeAdditionalData"));
        return resource;
      } catch (e) {
        const id = this.getDataValue("id");
        logger.error(`Failed to parse Payment#${id}.chargeAdditionalData`);
        return null;
      }
    }
  },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE }
}) as GenericStatic<IPayment>;

export default Payment;

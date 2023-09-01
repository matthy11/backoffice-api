// Info: https://sequelize.org/master/manual/typescript.html
import { Model, DataTypes } from "sequelize";
import { IPointOfSales } from ".";
import { sequelize, GenericStatic } from "../config/database";
import logger from "../logger";
import { decodeJsonFields } from "../utils/decode-json";

export interface ISale extends Model {
  readonly id: string;
  readonly payedAt: string;
  readonly pointOfSalesId: string;
  readonly commerceId: string;
  readonly amount: number;
  readonly reversed: boolean;
  readonly paymentInfo: {
    tipFromPaymentId: string | null;
    tipAmount: number;
    tipPayementId: string | null;
    payerInfo: { firstName: string; type: string; lastName: string };
    authorizationId: string | null;
    additionaldata: any | null;
    message: string | null;
    amount: number;
    type: string;
  };
  readonly toAccountId: string;
  readonly chargeInfo: {
    amount: number;
    type: string;
    keepAlive: boolean;
    isAuthorization: boolean;
    createdAt: string;
    fromAccountId: string;
    toAccountId: string | null;
    additionalData: any | null;
    message: string | null;
    acceptsMultiplePayments: boolean;
  };
  readonly chargeId: string;
  readonly paymentId: string;
  readonly reversedAt: string | null;
  readonly onCreateEventId: string;
  readonly pointOfSalesInfo?: {
    additionalData: any | null;
    commerceId: string;
    name: string;
  };
  readonly currency: string;
  readonly isTip: boolean;
  readonly fromAccountId: string;
  readonly updatedAt: string;
  readonly createdAt: string;

  readonly depositId: string | null;
  readonly depositInfo: any | null;
  readonly fromAccountsIds: any | null;
  readonly storeId: string | null;
  readonly userId: string | null;
  readonly tipFromSaleId: string | null;
  readonly tipSaleId: string | null;

  readonly pointsOfSale: IPointOfSales | null;
}


// sale -> table sales
const Sale = sequelize.define(
  "sales",
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    payedAt: { type: DataTypes.STRING },
    pointOfSalesId: { type: DataTypes.STRING },
    commerceId: { type: DataTypes.STRING },
    amount: { type: DataTypes.INTEGER },
    reversed: { type: DataTypes.BOOLEAN },
    paymentInfo: {
      type: DataTypes.STRING(2000),
      get(
        this: ISale
      ): {
        tipFromPaymentId: string | null;
        tipAmount: number;
        tipPayementId: string | null;
        payerInfo: { firstName: string; type: string; lastName: string };
        authorizationId: string | null;
        additionalData: any | null;
        message: string | null;
        amount: number;
        type: string;
      } | null {
        try {
          const resource = this.getDataValue("paymentInfo");
          return JSON.parse(resource);
        } catch (e) {
          const id = this.getDataValue("id");
          logger.error(`Failed to parse Sale#${id}.paymentInfo`);
          return null;
        }
      }
    },
    toAccountId: { type: DataTypes.STRING },
    chargeInfo: {
      type: DataTypes.STRING(2000),
      get(this: ISale): any {
        try {
          return JSON.parse(this.getDataValue("chargeInfo"));
        } catch (e) {
          const id = this.getDataValue("id");
          logger.error(`Failed to parse Sale#${id}.chargeInfo`);
          return null;
        }
      }
    },
    chargeId: { type: DataTypes.STRING },
    paymentId: { type: DataTypes.STRING },
    reversedAt: { type: DataTypes.STRING },
    onCreateEventId: { type: DataTypes.STRING },
    pointOfSalesInfo: {
      type: DataTypes.STRING,
      get(
        this: ISale
      ): {
        additionalData: any | null;
        commerceId: string;
        name: string;
      } | null {
        try {
          const resource = JSON.parse(this.getDataValue("pointOfSalesInfo"));
          return decodeJsonFields(resource);
        } catch (e) {
          const id = this.getDataValue("id");
          logger.error(`Failed to parse Sale#${id}.pointOfSalesInfo`);
          return null;
        }
      }
    },
    currency: { type: DataTypes.STRING },
    isTip: { type: DataTypes.BOOLEAN },
    fromAccountId: { type: DataTypes.STRING },
    updatedAt: { type: DataTypes.STRING },
    createdAt: { type: DataTypes.STRING },
    depositId: { type: DataTypes.STRING, },
    depositInfo: {
      type: DataTypes.JSON,
      get(this: ISale) {
        try {
          const depositInfo = this.getDataValue("depositInfo");
          return decodeJsonFields(depositInfo);
        } catch (e) {
          const id = this.getDataValue("id");
          logger.error(`Failed to parse Sale#${id}.depositInfo`);
          return null;
        }
      }
    },
    fromAccountsIds: { type: DataTypes.JSON, },
    storeId: { type: DataTypes.STRING, },
    userId: { type: DataTypes.STRING, },
    tipFromSaleId: { type: DataTypes.STRING, },
    tipSaleId: { type: DataTypes.STRING, },
  },
  {
    timestamps: false
  }
) as GenericStatic<ISale>;

export default Sale;

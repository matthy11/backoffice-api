import { Referrals } from "./Referrals";
import { Model, DataTypes } from "sequelize";
import { sequelize, GenericStatic } from "../config/database";
import { ICommerce } from "./Commerces";
import { IChekUser } from ".";

// this will serve as a DTO
export interface IAccount {
  readonly id: string;
  readonly ownerNationalId: string | null;
  readonly status: string;
  readonly transactionId: string | null;
  readonly balance: number;
  readonly currency: string;
  readonly category: string;
  readonly blockedBalance: number | null;
  readonly ownerType: string;
  readonly type: string;
  readonly maxBalance: number;
  readonly ownerId: string;
  readonly createdAt: string;
  readonly updatedAt: string;

  readonly pastBalance?: number;
  readonly totalWithdraws: number;
  readonly totalDeposits: number;
  readonly deposits: any[] | null;
  readonly withdraws?: any[] | null;
  readonly email: string | null;
  readonly phoneNumber: string | null;
  readonly referreds: Referrals[] | null;

  /** ownerInfo is the alias for a ChekUser */
  readonly ownerInfo?: IChekUser | null;
  /** commerceInfo is the alias for a Commerce */
  readonly commerceInfo?: ICommerce | null;
}

// we leave IAccount untouched to avoid other usage conflicts
export interface AccountModel extends IAccount, Model { }

const Account = sequelize.define("accounts", {
  id: { type: DataTypes.STRING, primaryKey: true },
  ownerNationalId: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING },
  transactionId: { type: DataTypes.STRING },
  balance: { type: DataTypes.INTEGER },
  currency: { type: DataTypes.STRING },
  phoneNumber: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  category: { type: DataTypes.STRING },
  blockedBalance: { type: DataTypes.STRING },
  ownerType: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING },
  maxBalance: { type: DataTypes.INTEGER },
  ownerId: { type: DataTypes.STRING },
  additionalData: {
    type: DataTypes.STRING(2000),
    get(this: AccountModel): any {
      try {
        const resource = JSON.parse(
          decodeURIComponent(this.getDataValue("additionalData"))
        );
        return resource;
      } catch (e) {
        return null;
      }
    }
  },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
}) as GenericStatic<AccountModel>;

export default Account;



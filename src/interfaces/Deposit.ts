import { IAccount } from './Account';
import { sequelize, GenericStatic } from '../config/database';
import { DataTypes, Model } from 'sequelize';
import { ISale } from './Sale';
import { decodeJsonFields } from '../utils/decode-json';
import logger from '../logger';
export interface IBankAccount {
  nationalId: string;
  accountNumber: string;
  accountTypeId: string;
  bankId: string;
}
export interface IOneClick {
  brand: string;
  lastDigits: string;
  source: string;
  nationalId?: string;
  accountNumber?: string;
}

// Deposit DTO
export interface IDeposit {
  readonly id: string;
  readonly amount: number;
  readonly type: string;
  readonly reversed: boolean;
  readonly fromResourceType: string;
  readonly fromResourceInfo: IBankAccount | IOneClick;
  readonly channel: string;
  readonly additionalData: any;
  readonly transactionId: string;
  readonly currency: string;
  readonly toAccountId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly reversedAt?: string;
  readonly account: IAccount;

  readonly chargeId: string | null;
  readonly depositReverseId: string | null;
  readonly institutionId: string | null;

  readonly sale?: ISale | null;
  readonly depositreceiver: IAccount;
}

// we leave IDeposit untouched to avoid other usage conflicts
export interface DepositModel extends IDeposit, Model {}

const Deposit = sequelize.define('deposits', {
  id: { type: DataTypes.STRING, primaryKey: true },
  amount: { type: DataTypes.INTEGER },
  type: { type: DataTypes.STRING },
  reversed: { type: DataTypes.BOOLEAN },
  fromResourceType: { type: DataTypes.STRING },
  fromResourceInfo: {
    type: DataTypes.STRING(2000),
    get(this: DepositModel): any {
      try {
        const resource = JSON.parse(this.getDataValue('fromResourceInfo'));
        return resource;
      } catch (e) {
        const depositId = this.getDataValue('id');
        logger.error(
          `Failed to parse Deposit#${depositId}.fromResourceInfo`,
          e
        );
        return null;
      }
    }
  },
  channel: { type: DataTypes.STRING },
  additionalData: {
    type: DataTypes.STRING(2000),
    get(this: DepositModel): any {
      try {
        const resource = JSON.parse(this.getDataValue('additionalData'));
        return decodeJsonFields(resource);
      } catch (e) {
        const depositId = this.getDataValue('id');
        logger.error(`Failed to parse Deposit#${depositId}.additionalData`, e);
        return '';
      }
    }
  },
  transactionId: { type: DataTypes.STRING },
  currency: { type: DataTypes.STRING },
  toAccountId: { type: DataTypes.STRING },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
  reversedAt: { type: DataTypes.DATE, allowNull: true },
  chargeId: { type: DataTypes.STRING },
  depositReverseId: { type: DataTypes.STRING },
  institutionId: { type: DataTypes.STRING }
}) as GenericStatic<DepositModel>;

export default Deposit;

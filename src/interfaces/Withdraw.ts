import { sequelize, GenericStatic } from '../config/database';
import { DataTypes, Model } from 'sequelize';
import { IDeposit } from './Deposit';
import { decodeJsonFields } from '../utils/decode-json';
import logger from '../logger';
import { IAccount } from './Account';
import { IMovement } from './Movement';

export interface IWithdraw {
  readonly id: string;
  readonly amount: number;
  readonly type: string;
  readonly reversed: boolean;
  readonly toResourceType: string;
  readonly toResourceInfo: {
    nationalId: string;
    accountNumber: string;
    bankId: string;
    name: string;
    bankAccountTypeId: string;
    email?: string;
  };
  readonly message: string;
  readonly additionalData: string;
  readonly transactionId: string;
  readonly currency: string;
  readonly fromAccountId: string;
  readonly createdAt: string;
  readonly updatedAt: string;

  readonly refundedDepositId: string | null;
  readonly refundId: string | null;
  readonly institutionId: string | null;
  readonly withdrawReverseId: string | null;

  readonly deposit: IDeposit | null;
  readonly withdrawSourceAccount: IAccount;
  readonly withdrawsMovements: IMovement;
}

// we leave IWithdraw untouched to avoid other usage conflicts
export interface WithdrawModel extends IWithdraw, Model {}

const Withdraw = sequelize.define('withdraws', {
  id: { type: DataTypes.STRING, primaryKey: true },
  amount: { type: DataTypes.INTEGER },
  type: { type: DataTypes.STRING },
  reversed: { type: DataTypes.BOOLEAN },
  toResourceType: { type: DataTypes.STRING },
  toResourceInfo: {
    type: DataTypes.STRING(2000),
    get(this: WithdrawModel): any {
      try {
        const resource = JSON.parse(this.getDataValue('toResourceInfo'));
        return resource;
      } catch (e) {
        const id = this.getDataValue('id');
        logger.error(`Failed to parse Withdraw#${id}.toResourceInfo`);
        return null;
      }
    }
  },
  message: { type: DataTypes.STRING },
  additionalData: {
    type: DataTypes.STRING(2000),
    get(this: WithdrawModel): any {
      try {
        const resource = JSON.parse(this.getDataValue('additionalData'));
        return decodeJsonFields(resource);
      } catch (e) {
        const id = this.getDataValue('id');
        logger.error(`Failed to parse Withdraw#${id}.additionalData`);
        return null;
      }
    }
  },
  transactionId: { type: DataTypes.STRING },
  currency: { type: DataTypes.STRING },
  fromAccountId: { type: DataTypes.STRING },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
  refundedDepositId: { type: DataTypes.STRING },
  refundId: { type: DataTypes.STRING },
  institutionId: { type: DataTypes.STRING },
  withdrawReverseId: { type: DataTypes.STRING }
}) as GenericStatic<WithdrawModel>;

export default Withdraw;

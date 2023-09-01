import { sequelize, GenericStatic } from '../config/database';
import { DataTypes, Model } from 'sequelize';
import { IPayment } from '.';
import { IWithdraw } from './Withdraw';
import { IDeposit } from './Deposit';
import { IAccount } from './Account';
import logger from '../logger';

export interface IMovement {
  readonly id: string;
  readonly reversed: boolean | null;
  readonly relatedResourceType: string;
  readonly remainingBalance: number;
  readonly balanceVariation: number;
  readonly reversedAt: string | null;
  readonly additionalData: any; // JSon
  readonly relatedResourceInfo: any; // JSon
  readonly sourceType: string;
  readonly accountId: string;
  readonly currency: string;
  readonly sourceId: string;
  readonly sourceSubtype: string;
  readonly createdAt: string;
  readonly updatedAt: string;

  readonly payment: IPayment;
  readonly withdraw: IWithdraw;
  readonly deposit: IDeposit;
  readonly account: IAccount | null;
}

export interface MovementModel extends IMovement, Model {}

const Movement = sequelize.define('movement', {
  id: { type: DataTypes.STRING, primaryKey: true },
  reversed: { type: DataTypes.BOOLEAN },
  relatedResourceType: { type: DataTypes.STRING },
  remainingBalance: { type: DataTypes.INTEGER },
  balanceVariation: { type: DataTypes.INTEGER },
  reversedAt: { type: DataTypes.DATE },
  additionalData: {
    type: DataTypes.STRING(2000),
    get(this: MovementModel): any {
      try {
        const resource = decodeURIComponent(
          this.getDataValue('additionalData')
        );
        return JSON.parse(resource);
      } catch (e) {
        const id = this.getDataValue('id');
        logger.error(`Failed to parse Movement#${id}.additionalData`);
        return null;
      }
    }
  },
  relatedResourceInfo: {
    type: DataTypes.STRING(2000),
    get(this: MovementModel): any {
      try {
        const resource = decodeURIComponent(
          this.getDataValue('relatedResourceInfo')
        );
        return JSON.parse(resource);
      } catch (e) {
        const id = this.getDataValue('id');
        logger.error(`Failed to parse Movement#${id}.relatedResourceInfo`);
        return null;
      }
    }
  },
  sourceType: { type: DataTypes.STRING },
  accountId: { type: DataTypes.STRING },
  currency: { type: DataTypes.STRING },
  sourceId: { type: DataTypes.STRING },
  sourceSubtype: { type: DataTypes.STRING },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE }
}) as GenericStatic<MovementModel>;

export default Movement;

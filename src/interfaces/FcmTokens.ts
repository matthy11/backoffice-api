// Info: https://sequelize.org/master/manual/typescript.html
import { Model, DataTypes } from "sequelize";
import { sequelize, GenericStatic } from "../config/database";

export interface IFcmToken extends Model {
  readonly deviceId: string;
  readonly active: boolean;
  readonly userId: string;
  readonly accountId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly id: string;
}

const FcmToken = sequelize.define("fcmTokens", {
  id: { type: DataTypes.STRING, primaryKey: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: false },
  userId: { type: DataTypes.STRING, allowNull: false },
  accountId: { type: DataTypes.STRING, allowNull: false },
  deviceId: { type: DataTypes.STRING, allowNull: false },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
}) as GenericStatic<IFcmToken>;

export default FcmToken;

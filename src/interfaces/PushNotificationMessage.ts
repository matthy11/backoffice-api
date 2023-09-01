// Info: https://sequelize.org/master/manual/typescript.html
import { Model, DataTypes } from "sequelize";
import { sequelize, GenericStatic } from "../config/database";

export interface IPushNotificationMessage extends Model {
  readonly status: string;
  readonly viewed: boolean;
  readonly deviceId: string;
  readonly userId: string;
  readonly pushNotificationId: number;
  readonly pushNotificationErrorId: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly id: number;
}

const PushNotificationMessage = sequelize.define("pushNotificationsMessages", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  viewed: { type: DataTypes.BOOLEAN, defaultValue: false },
  status: { type: DataTypes.ENUM, values: ['PENDING', 'SUCCESS', 'FAILURE'] },
  deviceId: { type: DataTypes.STRING, allowNull: false },
  userId: { type: DataTypes.STRING, allowNull: false },
  pushNotificationId: { type: DataTypes.INTEGER },
  pushNotificationErrorId: { type: DataTypes.INTEGER },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
}) as GenericStatic<IPushNotificationMessage>;

export default PushNotificationMessage;

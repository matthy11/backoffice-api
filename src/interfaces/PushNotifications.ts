// Info: https://sequelize.org/master/manual/typescript.html
import { Model, DataTypes } from "sequelize";
import { sequelize, GenericStatic } from "../config/database";

export interface IPushNotification extends Model {
  readonly id: number;
  readonly topic: string;
  readonly type: string;
  readonly status: string;
  readonly title: string;
  readonly body: string;
  readonly successCount: number;
  readonly failureCount: number;
  readonly startAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export enum PushNotificationType {
  MASSIVE = 'MASSIVE',
  TOPIC = 'TOPIC',
}

export enum PushNotificationStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
}

const PushNotification = sequelize.define("pushNotifications", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  topic: { type: DataTypes.STRING, allowNull: true },
  type: { type: DataTypes.ENUM, values: ['MASSIVE', 'TOPIC'] },
  status: { type: DataTypes.ENUM, values: ['PENDING', 'PROCESSED', 'SUCCESS', 'FAILURE'] },
  title: { type: DataTypes.STRING, allowNull: false },
  body: { type: DataTypes.STRING, allowNull: false },
  successCount: { type: DataTypes.INTEGER },
  failureCount: { type: DataTypes.INTEGER },
  startAt: { type: DataTypes.DATE, allowNull: true },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
}) as GenericStatic<IPushNotification>;

export default PushNotification;

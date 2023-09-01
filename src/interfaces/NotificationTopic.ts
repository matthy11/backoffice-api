// Info: https://sequelize.org/master/manual/typescript.html
import { Model, DataTypes, BelongsToManySetAssociationsMixin } from "sequelize";
import { sequelize, GenericStatic } from "../config/database";
import { IChekUser } from "./ChekUser";

export interface INotificationTopic extends Model {
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly id: string;
  readonly addChekUser: BelongsToManySetAssociationsMixin<IChekUser, string>
}

const NotificationTopic = sequelize.define("notificationTopic", {
  id: { type: DataTypes.STRING, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
}) as GenericStatic<INotificationTopic>;

export default NotificationTopic;

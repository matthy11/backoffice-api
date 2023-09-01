// Info: https://sequelize.org/master/manual/typescript.html
import { Model, DataTypes } from "sequelize";
import { sequelize, GenericStatic } from "../config/database";

export interface IChekUserTopic extends Model {
  readonly notificationTopicId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly chekUserId: string;
}

const ChekUserTopic = sequelize.define("chekUserTopic", {
  chekUserId: { type: DataTypes.STRING, primaryKey: true },
  notificationTopicId: { type: DataTypes.INTEGER, primaryKey: true },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
}) as GenericStatic<IChekUserTopic>;

export default ChekUserTopic;

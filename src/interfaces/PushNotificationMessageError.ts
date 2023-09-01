// Info: https://sequelize.org/master/manual/typescript.html
import { Model, BuildOptions, DataTypes } from "sequelize";
import { sequelize } from "../config/database";

export interface IPushNotificationMessageError extends Model {
    readonly code: string;
    readonly message: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly id: number;
}

type PushNotificationMessageErrorStatic = typeof Model & {
    new (values?: object, options?: BuildOptions): IPushNotificationMessageError;
};

const PushNotificationMessageError = <PushNotificationMessageErrorStatic>sequelize.define("pushNotificationsMessageErrors", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
});

export default PushNotificationMessageError;

// Info: https://sequelize.org/master/manual/typescript.html
import { Model, DataTypes } from "sequelize";
import { sequelize, GenericStatic } from "../config/database";
import { IStore } from "./Stores";

export interface IPointOfSales extends Model {
  readonly id: string;
  readonly accountId: string;
  readonly additionalData: string;
  readonly chargeId: string;
  readonly collaboratorUsersIds: string;
  readonly commerceCategoryId: string;
  readonly commerceId: string;
  readonly commerceName: string;
  readonly createByUserId: string;
  readonly createdAt: string;
  readonly currentShiftId: string;
  readonly name: string;
  readonly requestTip: string;
  readonly status: string;
  readonly updatedAt: string;
  readonly storeId: string;
  readonly store?: IStore | null
}

const PointOfSales = sequelize.define(
  "pointsOfSales",
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    accountId: { type: DataTypes.STRING },
    additionalData: { type: DataTypes.STRING },
    chargeId: { type: DataTypes.STRING },
    collaboratorUsersIds: { type: DataTypes.JSON },
    commerceCategoryId: { type: DataTypes.STRING },
    commerceId: { type: DataTypes.STRING },
    commerceName: { type: DataTypes.STRING },
    createByUserId: { type: DataTypes.STRING },
    createdAt: { type: DataTypes.DATE },
    currentShiftId: { type: DataTypes.STRING },
    name: {
      type: DataTypes.STRING,
      get(this: IPointOfSales): any {
        try {
          const resource = decodeURIComponent(this.getDataValue("name"));
          return resource;
        } catch (e) {
          return null;
        }
      }
    },
    requestTip: { type: DataTypes.BOOLEAN },
    status: { type: DataTypes.STRING },
    updatedAt: { type: DataTypes.DATE },
    storeId: { type: DataTypes.STRING },
  }
) as GenericStatic<IPointOfSales>;

export default PointOfSales;

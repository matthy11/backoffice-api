// Info: https://sequelize.org/master/manual/typescript.html
import { Model, DataTypes } from "sequelize";
import { sequelize, GenericStatic } from "../config/database";
import { IStore } from "./Stores";

export interface ICommerce extends Model {
  readonly id: string;

  readonly address: {
    additional: string;
    commune: string;
    number: string;
    region: string;
    street: string;
  } | null;

  readonly adminInfo: {
    documentId: string;
    email: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    phoneNumber: string;
  } | null;

  readonly bankAccountId: string | null;
  readonly categoryId: string | null;
  readonly createdAt: string;
  readonly documentId: string | null;
  readonly name: string | null;
  readonly businessName: string | null;
  readonly nationalId: string | null;
  readonly onCreateEventId: string | null;
  readonly ownerId: string | null;
  readonly ownerType: string | null;
  readonly phoneNumber: string | null;
  readonly primaryAccountCategory: string | null;
  readonly primaryAccountId: string | null;
  readonly primaryAccountMaxBalance: number;
  readonly status: string | null;
  readonly type: string | null;
  readonly updatedAt: string;
  readonly storesActive: boolean | null;
  readonly mainStoreId: string | null;

  readonly logoUrl?: string;

  // Sequelize relations
  readonly stores?: IStore[];
}

const Commerce = sequelize.define(
  "commerces",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    address: {
      type: DataTypes.JSON
    },
    adminInfo: {
      type: DataTypes.JSON
    },
    bankAccountId: {
      type: DataTypes.STRING
    },
    categoryId: {
      type: DataTypes.STRING
    },
    createdAt: {
      type: DataTypes.DATE(3)
    },
    documentId: {
      type: DataTypes.STRING
    },
    name: {
      type: DataTypes.STRING,
      get(this: ICommerce): string {
        return decodeURIComponent(this.getDataValue("name"))
      }
    },
    businessName: {
      type: DataTypes.STRING
    },
    nationalId: {
      type: DataTypes.STRING
    },
    onCreateEventId: {
      type: DataTypes.STRING
    },
    ownerId: {
      type: DataTypes.STRING
    },
    ownerType: {
      type: DataTypes.STRING
    },
    phoneNumber: {
      type: DataTypes.STRING
    },
    primaryAccountCategory: {
      type: DataTypes.STRING
    },
    primaryAccountId: {
      type: DataTypes.STRING
    },
    primaryAccountMaxBalance: {
      type: DataTypes.INTEGER
    },
    status: {
      type: DataTypes.STRING
    },
    type: {
      type: DataTypes.STRING
    },
    updatedAt: {
      type: DataTypes.DATE(3)
    },
    logoUrl: {
      type: DataTypes.TEXT
    },
    mainStoreId: {
      type: DataTypes.STRING
    },
    storesActive: {
      type: DataTypes.BOOLEAN
    },
  },
  {
    timestamps: false
  }
) as GenericStatic<ICommerce>;

export default Commerce;

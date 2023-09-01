// Info: https://sequelize.org/master/manual/typescript.html
import {
  Model,
  DataTypes,
  BelongsToGetAssociationMixin
} from "sequelize";
import { sequelize, GenericStatic } from "../config/database";
import { ICommerce } from "./Commerces";

export interface IStore extends Model {
  readonly id: string;
  readonly commerceId: string;
  readonly name: string; // commerce name
  readonly address: {
    additional?: string
    commune: string,
    lat: number,
    lng: number,
    number: string,
    region: string,
    street: string,
  };
  readonly lat: string;
  readonly lng: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly storeId: string; // firebase document id
  readonly isMainStore: boolean;
  readonly collaboratorUsersIds: string[];
  readonly status: 'active' | 'archived';
  readonly posCount: number;
  readonly archivedAt: string;
  readonly storeName: string;
  // Sequelize helper methods
  readonly commerce?: ICommerce;
  readonly getCommerce: BelongsToGetAssociationMixin<ICommerce>;
}

const Store = sequelize.define("stores", {
  id: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER
  },
  commerceId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: "commerces",
      key: "id"
    }
  },
  name: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.JSON,
    allowNull: false
  },
  lat: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lng: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE(3)
  },
  updatedAt: {
    type: DataTypes.DATE(3)
  },
  storeId: {
    type: DataTypes.STRING
  },
  isMainStore: {
    type: DataTypes.BOOLEAN
  },
  collaboratorUsersIds: {
    type: DataTypes.JSON
  },
  status: {
    type: DataTypes.STRING
  },
  posCount: {
    type: DataTypes.INTEGER
  },
  archivedAt: {
    type: DataTypes.STRING
  },
  storeName: {
    type: DataTypes.STRING
  }
}) as GenericStatic<IStore>;

export default Store;

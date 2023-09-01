import { Model, DataTypes } from "sequelize";
import { safeUnpack } from "../utils/unpack";
import { sequelize, GenericStatic } from "../config/database";
export interface IChekUser extends Model {
  bankAccountId: string | null;
  createdAt: string;
  email: string | null;
  firstName: string | null;
  gender: "F" | "M";
  identityCardValidated: boolean;
  identityFaceValidated: boolean;
  identityId: string | null;
  lastName: string | null;
  lastSignInAt: string | null;
  nationalId: string | null;
  onCreateEventId?: string;
  onTier1UpgradeEventId?: string;
  onTier2UpgradeEventId?: string;
  phoneNumber: string;
  primaryAccountCategory: string | null;
  primaryAccountId: string;
  primaryAccountMaxBalance: number | null;
  primaryAccountStatus: "active" | "blocked" | "closed";
  profileId: string | null;
  subscribedTopics?: string[];
  uid: string;
  docId: string;
  updatedAt: string;
  accountIds: string[];
  id?: string;
  // only t2 and t3 account have this
  secondLastName?: string;
  // helper field
  fullName: string;
}

// Model is too relaxed because it based of an inconsistent firebase model
const ChekUser = sequelize.define("chekUser", {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  bankAccountId: DataTypes.STRING,
  createdAt: DataTypes.DATE,
  email: DataTypes.STRING,
  firstName: {
    type: DataTypes.STRING,
    get(this: IChekUser): string {
      const firstName = safeUnpack.call(this, "firstName" as keyof IChekUser);
      return firstName;
    }
  },
  gender: DataTypes.ENUM("F", "M"),
  identityCardValidated: DataTypes.BOOLEAN,
  identityFaceValidated: DataTypes.BOOLEAN,
  identityId: DataTypes.STRING,
  lastName: {
    type: DataTypes.STRING,
    get(this: IChekUser): string {
      const lastName = safeUnpack.call(this, "lastName" as keyof IChekUser);
      return lastName;
    }
  },
  lastSignInAt: DataTypes.STRING,
  nationalId: DataTypes.STRING,
  onCreateEventId: DataTypes.STRING,
  onTier1UpgradeEventId: DataTypes.STRING,
  onTier2UpgradeEventId: DataTypes.STRING,
  phoneNumber: DataTypes.STRING,
  primaryAccountCategory: DataTypes.STRING,
  primaryAccountId: DataTypes.STRING,
  primaryAccountMaxBalance: DataTypes.INTEGER,
  primaryAccountStatus: DataTypes.ENUM("active", "blocked", "closed"),
  profileId: DataTypes.STRING,
  subscribedTopics: DataTypes.JSON,
  uid: DataTypes.STRING,
  docId: DataTypes.STRING,
  updatedAt: DataTypes.DATE,
  accountIds: DataTypes.JSON,
  secondLastName: {
    type: DataTypes.STRING,
    get(this: IChekUser): string {
      const secondLastName = safeUnpack.call(this, "secondLastName" as keyof IChekUser);
      return secondLastName;
    }
  },
  // helper field
  fullName: {
    type: DataTypes.VIRTUAL,
    get(this: IChekUser): string {
      const firstName = this.getDataValue("firstName") ?? '';
      const lastName = this.getDataValue("lastName") ?? '';
      const secondLastName = this.getDataValue("secondLastName") ?? '';

      const fullName = [firstName, lastName, secondLastName].map((name) => decodeURIComponent(name.trim())).join(' ').trim();

      if (fullName) {
        return fullName
      }

      return '';
    },
    set() {
      throw new Error("virtual field");
    }
  }
}) as GenericStatic<IChekUser>;

export default ChekUser;
import { Model } from "sequelize";

export function safeUnpack<T extends Model, Key extends keyof T>(this: T, key: Key): string {
  const value = this.getDataValue(key);
  if (value) {
    return decodeURIComponent(String(value));
  }
  return "";
}
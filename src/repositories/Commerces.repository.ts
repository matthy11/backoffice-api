import {
  Commerce,
} from "../interfaces";

export default class CommercesRepository {

  static getById(commerceId: string) {
    return Commerce.findOne({
      where: {
        id: commerceId
      }
    });
  }
}

import Deposit from './Deposit';
import Withdraw from './Withdraw';
import Account from './Account';
import Movement, { IMovement } from './Movement';
import Payment, { IPayment } from './Payment';
import Refund, { IRefund } from './Refund';
import Sale from './Sale';
import Commerce from './Commerces';
import Store from './Stores';
import PointOfSales, { IPointOfSales } from './PointOfSales';
import FcmToken, { IFcmToken } from '../interfaces/FcmTokens';
import PushNotification, {
  IPushNotification,
  PushNotificationType,
  PushNotificationStatus
} from '../interfaces/PushNotifications';
import PushNotificationMessage, {
  IPushNotificationMessage
} from '../interfaces/PushNotificationMessage';
import PushNotificationMessageError, {
  IPushNotificationMessageError
} from '../interfaces/PushNotificationMessageError';
import ChekUser, { IChekUser } from '../interfaces/ChekUser';
import NotificationTopic, {
  INotificationTopic
} from '../interfaces/NotificationTopic';
import ChekUserTopic, { IChekUserTopic } from '../interfaces/ChekUserTopics';

export interface DataOptions {
  startDate: string;
  endDate: string;
  orderBy?: string;
  limit?: number;
  profileId?: string;
  commerceId?: string;
  filterValues?: string[];
  filter?: string;
  page?: number;
  pageSize?: number;
}

// Declaración de asociaciones
Refund.belongsTo(Payment, { foreignKey: 'paymentId' });
Payment.hasMany(Refund, {
  foreignKey: 'paymentId'
});

Payment.belongsTo(Movement, { foreignKey: 'id', as: 'payment' });
Movement.hasOne(Payment, {
  foreignKey: 'id',
  sourceKey: 'sourceId',
  as: 'payment'
});

Withdraw.belongsTo(Movement, { foreignKey: 'id', as: 'withdraw' });
Movement.hasOne(Withdraw, {
  foreignKey: 'id',
  sourceKey: 'sourceId',
  as: 'withdraw'
});

Deposit.belongsTo(Movement, { foreignKey: 'id', as: 'deposit' });
Movement.hasOne(Deposit, {
  foreignKey: 'id',
  sourceKey: 'sourceId',
  as: 'deposit'
});

Movement.belongsTo(Account);
Account.hasMany(Movement);

Withdraw.belongsTo(Account, {
  foreignKey: 'fromAccountId',
  as: 'withdrawSourceAccount'
});
Account.hasMany(Withdraw, {
  foreignKey: 'fromAccountId',
  as: 'withdrawSourceAccount'
});

Deposit.belongsTo(Account, {
  foreignKey: 'toAccountId',
  as: 'depositreceiver'
});
Account.hasMany(Deposit, { foreignKey: 'toAccountId', as: 'depositreceiver' });

Payment.belongsTo(Account, { foreignKey: 'toAccountId', as: 'receiver' });
Payment.belongsTo(Account, { foreignKey: 'fromAccountId', as: 'payer' });
Account.hasMany(Payment, { foreignKey: 'toAccountId', as: 'receiver' });
Account.hasMany(Payment, { foreignKey: 'fromAccountId', as: 'payer' });

Payment.hasOne(Sale, { foreignKey: 'paymentId' });
Sale.hasOne(Payment, { foreignKey: 'id', sourceKey: 'paymentId' });

Sale.hasOne(PointOfSales, { foreignKey: 'id', sourceKey: 'pointOfSalesId' });
PointOfSales.hasMany(Sale, { foreignKey: 'pointOfSalesId' });

PointOfSales.belongsTo(Store, { foreignKey: 'storeId', targetKey: 'storeId' });
Store.hasMany(PointOfSales, { foreignKey: 'id', sourceKey: 'storeId' });

Account.hasOne(Commerce, { foreignKey: 'primaryAccountId' });
Account.hasOne(Commerce, {
  foreignKey: 'primaryAccountId',
  as: 'commerceInfo'
});
Commerce.belongsTo(Account, { foreignKey: 'primaryAccountId' });

Account.hasOne(ChekUser, {
  sourceKey: 'ownerId',
  foreignKey: 'id',
  as: 'ownerInfo'
});

Commerce.hasMany(Store, { foreignKey: 'commerceId' });
Store.belongsTo(Commerce, {
  foreignKey: 'commerceId'
});

ChekUser.belongsToMany(NotificationTopic, { through: ChekUserTopic });
NotificationTopic.belongsToMany(ChekUser, { through: ChekUserTopic });

Deposit.hasOne(Sale, { foreignKey: 'depositId' });
Sale.hasOne(Deposit, { foreignKey: 'id', sourceKey: 'depositId' });

Deposit.hasOne(Withdraw, { foreignKey: 'refundedDepositId' });
Withdraw.hasOne(Deposit, { foreignKey: 'id', sourceKey: 'refundedDepositId' });

export {
  Deposit,
  Withdraw,
  Account,
  Movement,
  Sale,
  Commerce,
  Payment,
  Store,
  PointOfSales,
  Refund,
  FcmToken,
  PushNotification,
  PushNotificationMessage,
  PushNotificationMessageError,
  ChekUser,
  ChekUserTopic,
  NotificationTopic,
  IMovement,
  IPayment,
  IRefund,
  IPointOfSales,
  IFcmToken,
  IPushNotification,
  IPushNotificationMessage,
  IPushNotificationMessageError,
  IChekUser,
  IChekUserTopic,
  INotificationTopic,
  PushNotificationType,
  PushNotificationStatus
};

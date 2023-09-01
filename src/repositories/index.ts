import DepositsRepository from "./Deposits.repository";
import WithdrawRepository from "./Withdraw.repository";
import AccountRepository from "./Account.repository";
import PaymentsRepository from "./Payments.repository";
import RefundsRepository from "./Refunds.repository";
import MovementsRepository from "./Movements.repository";
import CommercesRepository from "./Commerces.repository";


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

export {
  DepositsRepository,
  WithdrawRepository,
  AccountRepository,
  PaymentsRepository,
  RefundsRepository,
  MovementsRepository,
  CommercesRepository
}
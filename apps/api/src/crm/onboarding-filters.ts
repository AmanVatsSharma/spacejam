/**
 * File:        apps/api/src/crm/onboarding-filters.ts
 * Module:      API · CRM · Onboarding · Filters
 * Purpose:     Builds the TypeORM `where` for the `onboardings` query. "Still needs
 *              money" (`needsPayment`) is decided here, over the whole table, so a
 *              client never has to fetch a page of onboardings and filter it itself
 *              (which silently dropped old pending cheques once enough newer
 *              onboardings existed).
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-03
 */
import { FindOptionsWhere, ILike, In, IsNull } from 'typeorm';
import type { Onboarding } from '../typeorm/entities/onboarding.entity';
import type { OnboardingFiltersInput } from '../graphql/inputs/onboarding.input';
import { OnboardingPaymentStatus } from '../graphql/enums/onboarding-payment.enums';
import { escapeLike } from './onboarding-application';

/** Payment states in which an application still needs money (or a decision) before a client exists. */
export const OPEN_PAYMENT_STATES: OnboardingPaymentStatus[] = [
  OnboardingPaymentStatus.PENDING,
  OnboardingPaymentStatus.AWAITING_CLEARANCE,
  OnboardingPaymentStatus.FAILED,
];

type Where = FindOptionsWhere<Onboarding> | FindOptionsWhere<Onboarding>[];

/**
 * @param scopedCenterId a center manager's own center — always wins over `filters.centerId`.
 * @returns the where clause, or `null` when the filters can match nothing.
 */
export function buildOnboardingWhere(
  filters: OnboardingFiltersInput | undefined,
  scopedCenterId: string | undefined,
): Where | null {
  const base: FindOptionsWhere<Onboarding> = {};
  const centerId = scopedCenterId ?? filters?.centerId;
  if (centerId) base.centerId = centerId;
  if (filters?.status) base.status = filters.status;
  if (filters?.assignedToId) base.assignedToId = filters.assignedToId;
  if (!filters?.includeCancelled) base.cancelledAt = IsNull();

  if (filters?.needsPayment) {
    const open = OPEN_PAYMENT_STATES.filter((s) => !filters.paymentStatus || s === filters.paymentStatus);
    if (open.length === 0) return null; // e.g. needsPayment + PAID: nothing can match
    base.customerId = IsNull();
    base.paymentStatus = In(open);
  } else if (filters?.paymentStatus) {
    base.paymentStatus = filters.paymentStatus;
  }

  const term = filters?.search?.trim();
  return term
    ? ['companyName', 'contactName', 'contactEmail'].map((field) => ({
        ...base,
        [field]: ILike(`%${escapeLike(term)}%`),
      }))
    : base;
}

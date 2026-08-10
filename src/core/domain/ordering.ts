import { generateKeyBetween } from 'fractional-indexing';
import type { PlannerItem } from './types';

export const compareItemOrder = (
    left: PlannerItem,
    right: PlannerItem
): number => left.orderKey.localeCompare(right.orderKey);

export const createOrderKeyBetween = (
    previous: PlannerItem | null,
    next: PlannerItem | null
): string =>
    generateKeyBetween(previous?.orderKey ?? null, next?.orderKey ?? null);

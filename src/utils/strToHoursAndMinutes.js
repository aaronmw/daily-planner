import { toInt } from './toInt';

export const strToHoursAndMinutes = str =>
    str ? str.split(':').map(val => toInt(val)) : [0, 0];

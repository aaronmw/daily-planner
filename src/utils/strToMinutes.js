import strToHoursAndMinutes from './strToHoursAndMinutes';

const strToMinutes = str => {
    const [hours, minutes] = strToHoursAndMinutes(str);
    return hours * 60 + minutes;
};

export default strToMinutes;

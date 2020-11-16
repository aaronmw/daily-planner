import toInt from './toInt';

export default str => (str ? str.split(':').map(val => toInt(val)) : [0, 0]);

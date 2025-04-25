import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import format from 'date-fns/format';
import addDays from 'date-fns/addDays';
import addMonths from 'date-fns/addMonths';
import addYears from 'date-fns/addYears';
import getDate from 'date-fns/getDate';
import getMonth from 'date-fns/getMonth';
import getYear from 'date-fns/getYear';
import isValid from 'date-fns/isValid';
import parse from 'date-fns/parse';
import isEqual from 'date-fns/isEqual';
import isBefore from 'date-fns/isBefore';
import isAfter from 'date-fns/isAfter';
import startOfDay from 'date-fns/startOfDay';
import endOfDay from 'date-fns/endOfDay';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import endOfWeek from 'date-fns/endOfWeek';
import startOfYear from 'date-fns/startOfYear';
import endOfYear from 'date-fns/endOfYear';
import addHours from 'date-fns/addHours';
import addMinutes from 'date-fns/addMinutes';
import addSeconds from 'date-fns/addSeconds';
import getHours from 'date-fns/getHours';
import getMinutes from 'date-fns/getMinutes';
import getSeconds from 'date-fns/getSeconds';
import setMonth from 'date-fns/setMonth';
import setDate from 'date-fns/setDate';
import setYear from 'date-fns/setYear';
import setHours from 'date-fns/setHours';
import setMinutes from 'date-fns/setMinutes';
import setSeconds from 'date-fns/setSeconds';
import enUS from 'date-fns/locale/en-US';

// Create a custom adapter by extending the AdapterDateFns
class CustomDateFnsAdapter extends AdapterDateFns {
  constructor() {
    super({ locale: enUS });
    
    // Override the imported functions with local imports
    this.addDays = addDays;
    this.addMonths = addMonths;
    this.addYears = addYears;
    this.getDate = getDate;
    this.getMonth = getMonth;
    this.getYear = getYear;
    this.isValid = isValid;
    this.parse = parse;
    this.isEqual = isEqual;
    this.isBefore = isBefore;
    this.isAfter = isAfter;
    this.startOfDay = startOfDay;
    this.endOfDay = endOfDay;
    this.startOfMonth = startOfMonth;
    this.endOfMonth = endOfMonth;
    this.startOfWeek = startOfWeek;
    this.endOfWeek = endOfWeek;
    this.startOfYear = startOfYear;
    this.endOfYear = endOfYear;
    this.addHours = addHours;
    this.addMinutes = addMinutes;
    this.addSeconds = addSeconds;
    this.getHours = getHours;
    this.getMinutes = getMinutes;
    this.getSeconds = getSeconds;
    this.setMonth = setMonth;
    this.setDate = setDate;
    this.setYear = setYear;
    this.setHours = setHours;
    this.setMinutes = setMinutes;
    this.setSeconds = setSeconds;
    this.formatByString = (date, formatString) => format(date, formatString);
  }
}

export default CustomDateFnsAdapter; 
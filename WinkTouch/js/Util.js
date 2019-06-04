/**
 * @flow
 */
'use strict';
import Moment from 'moment';
require('moment/locale/fr.js');
require('moment/locale/fr-ca.js');
import { strings } from './Strings';

export const shortTimeFormat : string = 'H:mm';
export const timeFormat : string ='h:mm a';
export const time24Format: string = 'HH:mm';
export const dateFormat: string = 'MMM Do';
export const dayDateFormat: string = 'dd MMM Do';
export const farDateFormat: string = 'MMM YYYY';
export const yearDateFormat: string = 'MMM Do YYYY';
export const dayYearDateFormat: string = 'dd MMM Do YYYY';
export const dateTimeFormat : string = dateFormat+ ' '+timeFormat;
export const dayDateTimeFormat : string = dayDateFormat+ ' '+timeFormat;
export const dateTime24Format : string = dateFormat+ ' '+time24Format;
export const dayDateTime24Format : string = dayDateFormat+ ' '+time24Format;
export const yearDateTimeFormat : string = yearDateFormat+ ' '+timeFormat;
export const dayYearDateTimeFormat : string = dayYearDateFormat+ ' '+timeFormat;
export const yearDateTime24Format : string = yearDateFormat+ ' '+time24Format;
export const dayYearDateTime24Format : string = dayYearDateFormat+ ' '+time24Format;
export const jsonDateTimeFormat : string = 'YYYY-MM-DD[T]HH:mm';
export const jsonDateFormat: string = 'YYYY-MM-DD';

export function deepClone(object: any) : any {
    if (object===undefined) return undefined;
    if (object===null) return null;
    return JSON.parse(JSON.stringify(object));
}

export function toDate(time: Date) : Date {
  const date = new Date(time.getFullYear(), time.getMonth(), time.getDate());
  return date;
}

export function now() : Date {
  return new Date();
}

export function today(): Date {
  const today: Date = toDate(now());
  return today;
}

export function tomorrow(): Date {
  const nu: Date = now();
  const tomorrow: Date = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() + 1);
  return tomorrow;
}

export function addDays(date: Date, dayCount: number) {
  const newDate : Date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayCount);
  return newDate;
}

export function yesterday(): Date {
  const nu: Date = now();
  const yesterday: Date = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() - 1);
  return yesterday;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() == d2.getFullYear() &&
    d1.getMonth() == d2.getMonth() &&
    d1.getDate() == d2.getDate();
}

export function isSameYear(d1: Date, d2: Date): boolean {
  return d1.getFullYear() == d2.getFullYear();
}

export function isToday(date: Date|string) : boolean {
  if (!(date instanceof Date)) {
    date = parseDate(date);
  }
  return isSameDay(date, today());
}

export function isToyear(date: Date|string) : boolean {
  if (!(date instanceof Date)) {
    date = parseDate(date);
  }
  return isSameYear(date, now());
}

export function compareDates(d1: string, d2: string) {
  if (d1===d2) return 0;
  if (d1<d2) return -1;
  return 1;
}

export function minuteDifference(d1: Date, d2: Date) : number {
  const minuteDifference = Math.round((d1.getTime()-d2.getTime())/(1000*60));
  return minuteDifference;
}

export function hourDifference(d1: Date, d2: Date) : number {
  const hourDifference = Math.round((d1.getTime()-d2.getTime())/(1000*60*60));
  return hourDifference;
}

export function dayDifference(d1: Date, d2: Date) : number {
  const dayDifference = Math.round((toDate(d1).getTime()-toDate(d2).getTime())/(1000*60*60*24));
  return dayDifference;
}

export function weekDifference(d1: Date, d2: Date) : number {
  const weekDifference = Math.floor((toDate(d1).getTime()-toDate(d2).getTime())/(1000*60*60*24*7));
  return weekDifference;
}

export function yearDifference(d1: Date, d2: Date) : number {
  const ageMilis : number = Math.floor(toDate(d1).getTime()-toDate(d2).getTime());
  const yearDifference : number = Math.abs(new Date(ageMilis).getUTCFullYear() - 1970);
  return yearDifference;
}

export function parseDate(jsonDate: ?string) : ?Date {
  if (jsonDate===undefined || jsonDate===null || jsonDate.trim().length===0) return undefined;
  let utcDate : Date = new Date(jsonDate);
  let timezoneOffset : number = utcDate.getTimezoneOffset() * 60000; //Warning: don't try to be smart and cache the timeoffset.
  let date : Date = new Date(utcDate.valueOf()+timezoneOffset);
  return date;
}

export function formatDate(date: ?Date|?string, format: string): string {
  if (date===null || date===undefined || date==='' || date.toString().trim()==='') return '';
  if (!(date instanceof Date)) {
    date = parseDate(date);
  }
  const formattedDate : string = Moment(date).format(format);
  if (formattedDate==='Invalid date') return date;
  return formattedDate;
}

export function formatTime(time: ?string) : string {
  if (time===null|| time===undefined || time.toString().trim()==='') return '';
  const formattedTime : string = Moment(time, time24Format).format('LT');
  if (formattedTime==='Invalid date') return time;
  return formattedTime;
}

export function formatHour(time: ?string) : string {
  if (time===null|| time===undefined || time.toString().trim()==='') return '';
  const formattedTime : string = formatTime(time);
  const hour = formattedTime.substring(0, formattedTime.indexOf(':'));
  const suffix : ?string = formattedTime.includes(' ')?formattedTime.substring(formattedTime.indexOf(' ')):undefined;
  if (suffix) {
    return hour + suffix;
  }
  return hour;
}

export function formatDuration(date: Date|string|number, startDate?: Date|string) : string {
  if (!isNaN(date)) {
    date = new Date(date);
    if (startDate===undefined) {
      startDate = new Date(0);
    } else if (!isNaN(startDate)) {
      startDate = new Date(startDate);
    }
  } else {
    if (!(date instanceof Date))
      date = parseDate(date);
  }
  if (!(startDate instanceof Date))
    startDate = parseDate(startDate);
  if (date===startDate) return '';
  if (isSameDay(date, startDate)) {
    const minuteCount : number = Math.abs(minuteDifference(date, startDate));
    if (minuteCount===0) return '';
    if (minuteCount===1) return '1 '+strings.minute;
    if (minuteCount===30) return strings.halfAnHour;
    if (minuteCount===60) return '1 '+strings.hour;
    if (minuteCount<120) return minuteCount+ ' ' + strings.minutes;
    const hourCount = Math.abs(hourDifference(date, startDate));
    return hourCount+ ' '+strings.hours; //TODO minutes as decimals?
  }
  const dayCount : number = Math.abs(dayDifference(date,startDate));
  if (dayCount===1) return '1 '+ strings.day;
  return dayCount + ' '+strings.days;
}

export function formatAge(date: ?Date|?string) : string {
  if (date===undefined || date===null || date.toString().trim().length===0) return '';
  try {
    if (!(date instanceof Date))
      date = parseDate(date);
    const nu = now();
    const age : number = yearDifference(nu, date);
    return age.toString() + ' ' + strings.years;
  } catch (error) {
    console.log(error);
    return '';
  }
}

export function formatMoment(date: Date|string): string {
  if (__DEV__ && !(date instanceof Date) && !isNaN(date)) console.error('Date is a number: '+date);
  try {
    if (date===undefined || date===null || date.toString().trim().length===0) return '';
    if (!(date instanceof Date))
      date = parseDate(date);
    const nu = now();
    if (isSameDay(date, nu)) {
      return formatTime(date);
    }
    const dayCount : number = dayDifference(nu, date);
    if (dayCount<-100) return formatDate(date, farDateFormat);
    if (dayCount<-14) return formatDate(date, dateFormat);
    if (dayCount<-1) return formatDate(date, dateTime24Format);
    if (dayCount===-1) return 'Tomorrow '+formatDate(date, time24Format);
    if (dayCount===0) return formatDate(date, time24Format);
    if (dayCount===1) return 'Yesterday';
    if (dayCount <= 14)  return dayCount+' days ago';
    const weekCount : number = weekDifference(nu, date);
    if (weekCount <=8) return weekCount+' weeks ago';
    return formatDate(date, farDateFormat);
  } catch (error) {
    console.log(error);
    return '';
  }
}

export function capitalize(text: string) : string {
  if (!text || text.length==0) return text;
  if (text.length===1) return text.toUpperCase();
  return text.substring(0,1).toUpperCase()+text.substring(1);
}

export function formatStickySign(number: ?number, decimals: number) : string {
  if (number===undefined || number===null) return '';
  if (number<0) return number.toFixed(decimals);
  return '+'+number.toFixed(decimals);
}

export function formatDecimals(number: ?number, decimals: number) : string {
  if (number===undefined || number===null) return '';
  if (number===0 || number%1===0) {
    if (decimals===1) return '.0';
    if (decimals===2) return '.00';
    if (decimals===3) return '.000';
    return '.0000';
  }
  let formatted : string = Math.abs(number%1).toFixed(decimals).substr(1);
  return formatted;
}

export function formatDegree(number: ?number) : string {
  if (!number) return '';
  const degreeSymbol :string ='\u{00B0}';
  return number.toString()+degreeSymbol;
}

export function formatDiopter(sph: ?string|?number) {
  if (isEmpty(sph)) return '';
  if (isFinite(sph)) { //'-1.25'|-1.25
    if (Number.isFinite(sph))  //-1.25
      return formatStickySign(sph, 2);
    return formatStickySign(parseFloat(sph), 2);
  } //'balanced'
  return sph;
}

export function deAccent(text: string) : string {
  if (text==undefined) return text;
  let accents = {
    à: 'a',
    á: 'a',
    â: 'a',
    ã: 'a',
    ä: 'a',
    ç: 'c',
    è: 'e',
    é: 'e',
    ê: 'e',
    ë: 'e',
    ò: 'o',
    ô: 'o',
    õ: 'o',
    ö: 'o'
  };
  let chars = /[àáâãäçèéêëòôõö]/g;
  return text.replace(chars, (char) => accents[char] );
}

export function isEmpty(value: any) : boolean {
  if (value===undefined || value===null) return true;
  if (value==='' || (value.trim!==undefined && value.trim().length===0)) return true;
  if (value.length===0) return true;
  if (value instanceof Object) {
    if (Object.keys(value).length===0) return true;
    for (let subValue of Object.values(value)) {
      if (!isEmpty(subValue)) return false;
    }
    return true;
  }
  return false;
}

export function deepAssign(value: Object, newValue: Object) : Object {
  for (let [key: string, subNewValue: any] of Object.entries(newValue)) {
    let subValue : any = value[key];
    if (subValue===undefined || subValue===null) {
      value[key] = subNewValue;
    } else if (subNewValue instanceof Array) {
        if (isEmpty(subValue))
          subValue[subValue.length-1] = deepClone(subNewValue[0]);
        else if (subValue instanceof Array) {
          subValue.push(...subNewValue);
        } else {
          //silently ignore setting an array on non array
        }
    } else if (subNewValue instanceof Object) {
        deepAssign(subValue, subNewValue);
    } else {
        value[key] = subNewValue;
    }
  }
}

export function split(value: ?string, options: string[][]) : string[] {
  if (value===undefined) {
    let splittedValue : ?string[] = options.map((columnOptions: string[]) => undefined);
    return splittedValue;
  }
  value = value.trim();
  let splittedValue : ?string[] = options.map((columnOptions: string[]) => {
    let option : ?string = columnOptions.find((option: string) => value!==undefined && value.toLowerCase().startsWith(option.trim().toLowerCase()));
    if (option !== undefined) {
      value = value.slice(option.length);
      value = value.trim();
    }
    return option;
  });
  if (value.length>0) {
    if (splittedValue[splittedValue.length-1]===undefined)
      splittedValue[splittedValue.length-1] = value
    else
      splittedValue[splittedValue.length-1] += value;
  }
  return splittedValue;
}

export function combine(value : string[]) : ?string {
  if (value===undefined) return undefined;
  let combinedValue = undefined;
  value.forEach((subValue: string) => {
    if (subValue!==undefined) {
      if (combinedValue===undefined) combinedValue = ''
      subValue = subValue.toString();
      combinedValue += subValue;
    }
  });
  if (combinedValue!==undefined) combinedValue = combinedValue.trim();
  return combinedValue;
}

export function passesFilter(value: Object, filter: {}) : boolean {
  if (filter===undefined) return true;
  const filterEntries : [][] = Object.entries(filter);
  for (let i : number=0; i<filterEntries.length; i++) {
      const filterKey : string = filterEntries[i][0];
      const filterValue: string = filterEntries[i][1];
      if (filterKey!==undefined && filterValue!==undefined && filterValue.trim()!=='') {
          const subValue = value[filterKey];
          const passesFilter : boolean = subValue === filterValue;
          if (!passesFilter) return false;
      }
  }
  return true;
}

export function stripIndex(identifier: string) : string {
  if (identifier.endsWith(']')) {
    identifier = identifier.substring(0,identifier.indexOf('['));
  }
  return identifier;
}

function getIndex(identifier: string) : ?number {
  if (identifier.endsWith(']')) {
    let index = identifier.substring(identifier.indexOf('[')+1, identifier.indexOf(']'));
    return parseInt(index);
  }
  return undefined;
}

function subValue(value, identifier: string) {
  if (value===undefined || value===null) return value;
  let subValue = value[stripIndex(identifier)];
  const index : ?number = getIndex(identifier);
  if (index!==undefined) {
    subValue = subValue[index];
  }
  return subValue;
}

export function getValue(value, fieldIdentifier: string) {
  let identifiers : string[] = fieldIdentifier.split('.');
  for (const identifier: string of identifiers) {
    value = subValue(value, identifier);
  }
  return value;
}

export function setValue(value : {}, fieldIdentifier: string, fieldValue : any) {
  let identifiers : string[] = fieldIdentifier.split('.');
  for (let i = 0; i<identifiers.length-1;i++) {
    const identifier : string = identifiers[i];
    let childValue = subValue(value, identifier);
    if (childValue===undefined) {
      if (childValue===undefined) return;
      childValue = {};
      value[identifier] = childValue;
    }
    value = childValue;
  }
  const identifier : string = identifiers[identifiers.length-1];
  value[identifier] = fieldValue;
}

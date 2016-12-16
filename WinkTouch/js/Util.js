/**
 * @flow
 */
'use strict';
import dateFormat from 'dateformat';

export function toDate(time: Date) : Date {
  const date = new Date(time.getFullYear(), time.getMonth(), time.getDate());
  return date;
}

export function today(): Date {
  const now: Date = new Date();
  const today: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return today;
}

export function tomorrow(): Date {
  const now: Date = new Date();
  const tomorrow: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return tomorrow;
}

export function yesterday(): Date {
  const now: Date = new Date();
  const yesterday: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return yesterday;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() == d2.getFullYear() &&
    d1.getMonth() == d2.getMonth() &&
    d1.getDate() == d2.getDate();
}

export function dayDifference(d1: Date, d2: Date) : number {
  const dayDifference = Math.round((toDate(d1).getTime()-toDate(d2).getTime())/(1000*60*60*24));
  return dayDifference;
}

export function weekDifference(d1: Date, d2: Date) : number {
  const weekDifference = Math.floor((toDate(d1).getTime()-toDate(d2).getTime())/(1000*60*60*24*7));
  return weekDifference;
}

export function formatMoment(date: Date): string {
  const now = new Date();
  if (isSameDay(date, today()))
    return "Today";
  if (isSameDay(date, yesterday()))
    return "Yesterday";
  const dayCount : number = dayDifference(now, date);
  if (dayCount <= 14) {
    return dayCount+' days ago';
  }
  const weekCount : number = weekDifference(now, date);
  if (weekCount <=8) {
    return weekCount+' weeks ago';
  }
  return dateFormat(date, 'd/m/yy');
}
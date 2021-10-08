/**
 * @flow
 */
'use strict';

import AsyncStorage from '@react-native-async-storage/async-storage';

const cache = new Map();

export function cacheItem(id: string, data: any) {
  if (id === undefined || id === null) return;
  if (data === undefined) {
    cache.delete(id);
    //__DEV__ && console.log('Removing cached '+id+'.');
  } else {
    let existingData = getCachedItem(id);
    if (existingData) {
      if (existingData.version) {
        if (data.version === undefined || data.version < existingData.version) {
          return;
        }
      }
    }
    cache.set(id, data);
    //__DEV__ && console.log('Caching '+id+': '+JSON.stringify(data).substr(0, 80)+'...');
  }
}

export function cacheItemById(data: any) {
  if (data === undefined || data.id === undefined) return;
  cacheItem(data.id, data);
}

export function clearCachedItemById(data: any) {
  if (!data) return;
  if (data.id) {
    cache.delete(data.id);
  } else {
    cache.delete(id);
  }
}

export function cacheItemsById(items: []) {
  if (!items) return;
  items.forEach((item: any) => cacheItemById(item));
}

export function getCachedItem(id: string): any {
  if (id == undefined) return undefined;
  const cachedData = cache.get(id);
  return cachedData;
}

export function getCachedItems(ids: ?(string[])): ?(any[]) {
  if (ids === undefined || ids === null) return undefined;
  let items = ids.map((id) => getCachedItem(id));
  return items;
}

export function getCachedVersionNumber(id: string): number {
  const item: any = getCachedItem(id);
  if (item === undefined || item.version === undefined || item === null)
    return -1;
  return item.version;
}

export function clearDataCache() {
  cache.clear();
}

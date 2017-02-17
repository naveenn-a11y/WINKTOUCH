/**
 * @flow
 */
'use strict';

import {AsyncStorage} from 'react-native';

const cache = new Map();

export function cacheItem(key: string, data: any) {
  cache.set(key, data);
}

export function getCachedItem(key: string) : any {
  const cachedData = cache.get(key);
  return cachedData;
}

export function getCachedItems(keys: string[]) : [] {
    if (!keys) return [];
    let items = keys.map(key => getCachedItem(key));
    return items;
}

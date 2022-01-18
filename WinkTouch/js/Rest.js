/**
 * @flow
 */

'use strict';

import type {
  FieldDefinitions,
  RestResponse,
  Privileges,
  TokenPayload,
  Account,
} from './Types';
import base64 from 'base-64';
import {capitalize, deepClone, isEmpty, extractHostname} from './Util';
import {strings, getUserLanguage} from './Strings';
import {
  cacheItemById,
  cacheItemsById,
  cacheItem,
  getCachedVersionNumber,
  getCachedItem,
  clearCachedItemById,
} from './DataCache';
import {restVersion} from './Version';
import {setWinkRestUrl} from './WinkRest';
import AsyncStorage from '@react-native-async-storage/async-storage';

//export const restUrl : string = 'http://127.0.0.1:8080/Web/';
export const defaultHost: string = 'emr.downloadwink.com';

let token: string;
let privileges: Privileges = {
  pretestPrivilege: 'NOACCESS',
  medicalDataPrivilege: 'NOACCESS',
};

let requestNumber: number = 0;

export function getWinkEmrHostFromAccount(account: Account) {
  if (account.extraFields instanceof Array) {
    const winkEmrHost: Object = account.extraFields.find(
      (extraField: Object) => extraField.key === 'WinkEMRHost',
    );
    if (!isEmpty(winkEmrHost) && !isEmpty(winkEmrHost.value)) {
      return winkEmrHost.value;
    }
    return defaultHost;
  }
}
export function getNextRequestNumber(): number {
  return ++requestNumber;
}

function parsePrivileges(tokenPrivileges: TokenPrivileges): void {
  privileges.pretestPrivilege = 'NOACCESS';
  privileges.medicalDataPrivilege = 'NOACCESS';
  if (tokenPrivileges === undefined || tokenPrivileges === null) {
    return;
  }
  if (tokenPrivileges.pre === 'F') {
    privileges.pretestPrivilege = 'FULLACCESS';
  } else if (tokenPrivileges.pre === 'R') {
    privileges.pretestPrivilege = 'READONLY';
  }
  if (tokenPrivileges.med === 'F') {
    privileges.medicalDataPrivilege = 'FULLACCESS';
  } else if (tokenPrivileges.med === 'R') {
    privileges.medicalDataPrivilege = 'READONLY';
  }
}

export function decodeTokenPayload(token: string): ?TokenPayload {
  if (!token) {
    return null;
  }
  return JSON.parse(base64.decode(token.split('.')[1]));
}

export function setToken(newToken: ?string) {
  __DEV__ && console.log('Set token:' + newToken);
  token = newToken;
  if (!isEmpty(newToken)) {
    let payLoad: TokenPayload = decodeTokenPayload(newToken);
    parsePrivileges(payLoad ? payLoad.prv : undefined);
    __DEV__ &&
      console.log('Logged on user privileges = ' + JSON.stringify(privileges));
  }
}

export function getToken(): string {
  return token;
}

export function getPrivileges(): Privileges {
  return privileges;
}

export function getDataType(id: string): string {
  if (!id) {
    return id;
  }
  const dashIndex = id.indexOf('-');
  const dataType: string = capitalize(
    dashIndex >= 0 ? id.substring(0, dashIndex) : id,
  );
  return dataType;
}

export function stripDataType(id: string | number): number {
  if (!id) {
    return -1;
  }
  if (isNaN(id)) {
    const dashIndex = id.indexOf('-');
    const nummer: number = parseInt(id.substring(dashIndex + 1));
    return nummer;
  }
  return id;
}

function getItemFieldName(id: string): string {
  if (!id) {
    return 'response';
  }
  const dashIndex = id.indexOf('-');
  const fieldName: string = dashIndex >= 0 ? id.substring(0, dashIndex) : id;
  return fieldName;
}

function constructTypeUrl(id: string) {
  //TODO: cache type urls?
  const dataType: string = getDataType(id);
  const url: string = getRestUrl() + encodeURIComponent(dataType) + '/';
  return url;
}

function clearErrors(item: Object) {
  if (!(item instanceof Object)) {
    return;
  }
  Object.keys(item).forEach((key) => {
    if (key.endsWith('rror') || key.endsWith('rrors')) {
      delete item[key];
    } else {
      clearErrors(item[key]);
    }
  });
}

export function handleHttpError(httpResponse: any, httpBody?: Object) {
  console.log(
    'HTTP response error ' + httpResponse.status + ': ' + httpResponse.url,
  );
  console.log(httpResponse);
  if (httpBody && httpBody.errors) {
    throw httpBody.errors;
  }
  throw 'HTTP error ' + httpResponse.status;
}

export function getDefinitionCacheKey(
  id: string,
  language: string = getUserLanguage(),
): string {
  const cacheKey: string = getDataType(id) + 'Definition-' + language;
  return cacheKey;
}

export async function fetchItemDefinition(
  id: string,
  language: string,
): FieldDefinitions {
  if (!id) {
    return undefined;
  }
  const cacheKey: string = getDefinitionCacheKey(id, language);
  let definition: FieldDefinitions = getCachedItem(cacheKey);
  if (definition !== null && definition !== undefined) {
    return definition;
  }
  const url = constructTypeUrl(id) + 'FieldDefinition';
  const requestNr = ++requestNumber;
  __DEV__ &&
    console.log(
      'REQ ' + requestNr + ' Fetching definition ' + cacheKey + ': ' + url,
    );
  try {
    let httpResponse = await fetch(url, {
      method: 'get',
      headers: {
        Accept: 'application/json',
        'Accept-language': language,
      },
    });
    if (!httpResponse.ok) {
      handleHttpError(httpResponse);
    }
    __DEV__ &&
      console.log(
        'RES ' + requestNr + ' Fetching definition ' + cacheKey + ': ' + url,
      );
    let restResponse = await httpResponse.json();
    definition = restResponse.fields;
    cacheItem(cacheKey, definition);
    return definition;
  } catch (error) {
    console.log(error);
    alert(
      strings.formatString(
        strings.fetchItemError,
        getDataType(id).toLowerCase(),
        error,
      ),
    );
    throw error;
  }
}

function cacheResponseItems(restResponse: {}): void {
  if (!restResponse) {
    return;
  }
  for (let fieldName in restResponse) {
    if (fieldName === 'errors') {
      continue;
    }
    let field = restResponse[fieldName];
    if (field instanceof Array) {
      cacheItemsById(field);
    } else {
      cacheItemById(field);
    }
  }
}

function cacheLists(restResponse) {
  if (!restResponse) {
    return;
  }
  const fieldNames: string[] = Object.keys(restResponse);
  fieldNames.map((fieldName: string) => {
    if (fieldName.endsWith('List')) {
      cacheItemsById(restResponse[fieldName]);
    }
  });
}

export async function fetchItemById(id: string, ignoreCache?: boolean): any {
  if (!id) {
    return undefined;
  }
  const cachedVersion: number = ignoreCache ? -1 : getCachedVersionNumber(id);
  const url =
    constructTypeUrl(id) +
    encodeURIComponent(id) +
    (cachedVersion >= 0 ? '?version=' + cachedVersion : '');
  const requestNr = ++requestNumber;
  __DEV__ && console.log('REQ ' + requestNr + ' GET ' + url);
  try {
    let httpResponse = await fetch(url, {
      method: 'get',
      headers: {
        token: token,
        Accept: 'application/json',
        'Accept-language': getUserLanguage(),
      },
    });
    if (!httpResponse.ok) {
      handleHttpError(httpResponse);
    }
    const restResponse = await httpResponse.json();
    if (restResponse.upToDate) {
      __DEV__ &&
        console.log('RES ' + requestNr + ' GET ' + url + ': is up to date.');
      return getCachedItem(id);
    }
    if (restResponse.errors) {
      alert(restResponse.errors);
      console.log(
        'restResponse contains a system error: ' + JSON.stringify(restResponse),
      );
      return; //TODO: we should also return an object containing the system eroor?
    }
    __DEV__ && logRestResponse(restResponse, id, requestNr, 'GET', url);
    const item: any =
      restResponse.id === id
        ? restResponse
        : restResponse[getItemFieldName(id)];
    if (!item) {
      throw new Error(
        'The server did not return a ' +
          getItemFieldName(id) +
          ' for id ' +
          id +
          '.',
      );
    }
    cacheResponseItems(restResponse);
    return item;
  } catch (error) {
    console.log(error);
    alert(
      strings.formatString(
        strings.fetchItemError,
        getDataType(id).toLowerCase(),
      ),
    );
    throw error;
  }
}

export function logRestResponse(
  restResponse,
  id,
  requestNr: number,
  method: string,
  url: string,
) {
  let cleanedResponse = deepClone(restResponse);
  if (!cleanedResponse.hasValidationError && !cleanedResponse.errors) {
    if (cleanedResponse[getItemFieldName(id)]) {
      cleanedResponse = cleanedResponse[getItemFieldName(id)];
    }
  }
  if (cleanedResponse.definition) {
    cleanedResponse.definition = '{...}';
  }
  if (cleanedResponse.data) {
    cleanedResponse.data = '...';
  }
  console.log(
    'RES ' +
      requestNr +
      ' ' +
      method +
      ' ' +
      url +
      ' json body: ' +
      JSON.stringify(cleanedResponse),
  );
}

export async function storeItems(itemLsist: any[]) {}

/**
 * Returns the saved object when the save was successfull (it will have a new version number).
 * Returns the original object with validation error messages per field in case the the object did not pass validation.
 * Returns the original object with a list of business errors in case they happened.
 * Shows a popup and returns the orriginal object in case of a system error.
 * Shows a popup and Returns the latest object from the server in case there was a concurrency conflict. //TODO
 */
export async function storeItem(item: any): any {
  if (!item || !item.id) {
    return undefined;
  }
  clearErrors(item);
  const definition = item.definition;
  item.definition = undefined;
  const httpMethod: string = item.id.indexOf('-') > 0 ? 'PUT' : 'POST';
  const url = constructTypeUrl(item.id);
  const requestNr = ++requestNumber;
  __DEV__ &&
    console.log(
      'REQ ' +
        requestNr +
        ' ' +
        httpMethod +
        ' ' +
        url +
        ' json body: ' +
        JSON.stringify(item),
    );
  try {
    let httpResponse = await fetch(url, {
      method: httpMethod,
      headers: {
        'Content-Type': 'application/json',
        token: token,
        Accept: 'application/json',
        'Accept-language': getUserLanguage(),
      },
      body: JSON.stringify(item),
    });
    if (!httpResponse.ok) {
      handleHttpError(httpResponse);
    }
    const restResponse: RestResponse = await httpResponse.json();
    __DEV__ &&
      logRestResponse(restResponse, item.id, requestNr, httpMethod, url);
    if (restResponse.hasValidationError || restResponse.errors) {
      if (restResponse.errors) {
        __DEV__ &&
          console.log(
            'restResponse contains business errors: ' +
              JSON.stringify(restResponse),
          );
      } else if (restResponse.hasValidationError) {
        restResponse.errors = [strings.validationErrorMessage];
      }
      if (item.id.includes('-')) {
        clearCachedItemById(item);
        await fetchItemById(item.id); //TODO: I think its ok to not wait for the refresh of the cache
      }
      restResponse.definition = definition;
      return restResponse;
    }
    const updatedItem = restResponse[getItemFieldName(item.id)];
    if (!updatedItem) {
      console.log(
        'Missing ' +
          getItemFieldName(item.id) +
          ' key in restresponse :' +
          JSON.stringify(restResponse),
      );
      throw new Error(
        'The server did not return a ' +
          getItemFieldName(item.id) +
          ' after ' +
          (httpMethod === 'put' ? 'updating.' : 'creating.'),
      );
    }
    cacheLists(restResponse);
    cacheItemById(updatedItem);
    return updatedItem;
  } catch (error) {
    console.log(error);
    alert(
      strings.formatString(
        strings.storeItemError,
        getDataType(item.id).toLowerCase(),
        error,
      ),
    );
    item.errors = [
      strings.formatString(
        strings.storeItemError,
        getDataType(item.id).toLowerCase(),
        error,
      ),
    ];
    item.definition = definition;
    return item;
  }
}

export async function deleteItem(item: any): any {
  if (!item || !item.id || item.id.indexOf('-') < 0) {
    return undefined;
  }
  const url = constructTypeUrl(item.id) + item.id;
  //__DEV__ && alert('deleting '+url);
  try {
    let httpResponse = await fetch(url, {
      method: 'delete',
      headers: {
        'Content-Type': 'application/json',
        token: token,
        Accept: 'application/json',
        'Accept-language': getUserLanguage(),
      },
      body: JSON.stringify(item),
    });
    if (!httpResponse.ok) {
      handleHttpError(httpResponse);
    }
    const restResponse = await httpResponse.json();
    //alert(JSON.stringify(restResponse));
    if (restResponse.errors) {
      alert(restResponse.errors);
      console.log(
        'restResponse contains a system error: ' + JSON.stringify(restResponse),
      );
    } else {
      clearCachedItemById(item);
    }
  } catch (error) {
    console.log(error);
    alert(
      strings.formatString(
        strings.storeItemError,
        getDataType(item.id).toLowerCase(),
        error,
      ),
    );
    throw error;
  }
}

export function appendParameters(url: string, searchCritera: Object): string {
  if (!searchCritera) {
    return url;
  }
  const keys: string[] = Object.keys(searchCritera);
  if (keys.length === 0) {
    return url;
  }
  let firstParameter: boolean = true;
  for (let i: number = 0; i < keys.length; i++) {
    const parameterName: string = keys[i];
    const parameterValue: string = searchCritera[parameterName];
    if (parameterValue === undefined || parameterValue === null) {
      continue;
    }
    url = url + (firstParameter ? '?' : '&');
    (url = url + encodeURIComponent(parameterName)), (url = url + '=');
    url = url + encodeURIComponent(parameterValue);
    firstParameter = false;
  }
  return url;
}

export async function searchItems(list: string, searchCritera: Object): any {
  let url: string = getRestUrl() + list;
  const requestNr: number = ++requestNumber;
  try {
    url = appendParameters(url, searchCritera);
    __DEV__ && console.log('REQ ' + requestNr + ' GET ' + url);
    let httpResponse = await fetch(url, {
      method: 'get',
      headers: {
        token: token,
        Accept: 'application/json',
        'Accept-language': getUserLanguage(),
      },
    });
    if (!httpResponse.ok) {
      handleHttpError(httpResponse);
    }
    const restResponse = await httpResponse.json();
    __DEV__ &&
      console.log(
        'RES ' +
          requestNr +
          ' GET ' +
          url +
          ': ' +
          JSON.stringify(Object.keys(restResponse)),
        //JSON.stringify(restResponse)
      );
    if (restResponse.errors) {
      alert(restResponse.errors);
      console.log(
        'restResponse contains a system error: ' + JSON.stringify(restResponse),
      );
    }
    return restResponse;
  } catch (error) {
    console.log(error);
    alert(
      strings.formatString(
        strings.fetchItemError,
        list.substring(0, list.indexOf('/')).toLowerCase(),
        error,
      ),
    );
    throw error;
  }
}

export async function performActionOnItem(
  action: string,
  item: any,
  httpMethod: ?any = 'PUT',
): any {
  if (
    (item === null) | (item === undefined) ||
    (item instanceof Array && item.length === 0)
  ) {
    __DEV__ && console.error('item is mandatory');
  }
  let url: string =
    getRestUrl() +
    getDataType(item instanceof Array ? item[0].id : item.id) +
    '/' +
    encodeURIComponent(action);
  const requestNr = ++requestNumber;
  __DEV__ &&
    console.log(
      'REQ ' +
        requestNr +
        ' ' +
        httpMethod +
        ' ' +
        url +
        ' json body: ' +
        JSON.stringify(item),
    );
  try {
    let httpResponse = await fetch(url, {
      method: httpMethod,
      headers: {
        'Content-Type': 'application/json',
        token: token,
        Accept: 'application/json',
        'Accept-language': getUserLanguage(),
      },
      body: JSON.stringify(item),
    });
    if (!httpResponse.ok) {
      handleHttpError(httpResponse, await httpResponse.text());
    }
    const restResponse = await httpResponse.json();
    __DEV__ &&
      logRestResponse(restResponse, item.id, requestNr, httpMethod, url);
    if (restResponse.hasValidationError || restResponse.errors) {
      if (restResponse.errors) {
        __DEV__ &&
          console.log(
            'restResponse contains business errors: ' +
              JSON.stringify(restResponse),
          );
      } else if (restResponse.hasValidationError) {
        restResponse.errors = [strings.validationErrorMessage];
      }
      if (item instanceof Object && item.id.includes('-')) {
        clearCachedItemById(item);
        await fetchItemById(item.id); //TODO: I think its ok to not wait for the refresh of the cache
      }
      return restResponse;
    }
    if (item instanceof Array) {
      return restResponse;
    }
    const updatedItem = restResponse[getItemFieldName(item.id)];
    if (!updatedItem) {
      console.log(
        'Missing ' +
          getItemFieldName(item.id) +
          ' key in restresponse :' +
          JSON.stringify(restResponse),
      );
      throw new Error(
        'The server did not return a ' +
          getItemFieldName(item.id) +
          ' after ' +
          (httpMethod === 'put' ? 'updating.' : 'creating.'),
      );
    }
    cacheLists(restResponse);
    cacheItemById(updatedItem);
    return updatedItem;
  } catch (error) {
    console.log(error);
    alert(
      'Something went wrong trying to ' +
        action +
        ' a ' +
        getDataType(item.id) +
        '. Please try again.\n\n(Internal error = ' +
        error +
        ')',
    );
    throw error;
  }
}

export async function devDelete(path: string) {
  if (__DEV__ === false) {
    return;
  }
  let url: string = getRestUrl() + 'Dev/' + path;
  try {
    let httpResponse = await fetch(url, {
      method: 'delete',
      headers: {
        token: token,
        Accept: 'application/json',
        'Accept-language': getUserLanguage(),
      },
    });
    if (!httpResponse.ok) {
      handleHttpError(httpResponse);
    }
    const restResponse = await httpResponse.json();
    return restResponse;
  } catch (error) {
    console.log(error);
    alert(
      'Something went wrong trying to delete ' + path + '. Please try again.',
    );
    throw error;
  }
}

let restUrl: string;
export function getRestUrl(): string {
  return __DEV__ ? 'http://192.168.2.53:8080/Web/' : restUrl;
}

async function setRestUrl(winkEmrHost: string) {
  console.log('Switching emr host to ' + winkEmrHost);
  restUrl = 'https://' + winkEmrHost + '/' + restVersion + '/';
}

export function switchEmrHost(winkEmrHost: string) {
  const formattedWinkEmrHost: string = extractHostname(winkEmrHost);
  AsyncStorage.setItem('winkEmrHost', formattedWinkEmrHost);
  setRestUrl(formattedWinkEmrHost);
  setWinkRestUrl(formattedWinkEmrHost);
}

AsyncStorage.getItem('winkEmrHost').then((winkEmrHost) => {
  if (winkEmrHost === null || winkEmrHost === undefined || winkEmrHost === '') {
    winkEmrHost = defaultHost;
  }
  setRestUrl(winkEmrHost);
});

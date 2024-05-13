/**
 * @flow
 */
'use strict';

import {
  appendParameters,
  getToken,
  getNextRequestNumber,
  logRestResponse,
  handleHttpError,
} from './Rest';
import {strings, getUserLanguage, getUserLanguageShort} from './Strings';
import RNFS from 'react-native-fs';
import {isWeb} from './Styles';
import {getEmrHost} from "./Hosts";
import { WINK_APP_REST_URL, WINK_APP_WEB_SOCKET_URL } from '@env';

export const winkWebSocketUrl: string = isWeb ? process.env.WINK_APP_WEB_SOCKET_URL : WINK_APP_WEB_SOCKET_URL;

let winkRestUrl: string;
export function setWinkRestUrl() {
  getEmrHost();
  winkRestUrl = isWeb ? process.env.WINK_APP_REST_URL : WINK_APP_REST_URL;
  __DEV__ && console.log('Setting WINKRest backend server to ' + winkRestUrl);
}

export function getWinkRestUrl(): string {
  if (winkRestUrl === null || winkRestUrl === undefined || winkRestUrl === '') {
    setWinkRestUrl();
  }
  return winkRestUrl;
}

export async function postWinkWebSocketUrl(
  uri: string,
  parameters: Object,
  httpMethod: string = 'POST',
  body?: any,
): any {
  const url: string = appendParameters(winkWebSocketUrl + uri, parameters);
  const requestNr = getNextRequestNumber();
  __DEV__ &&
    console.log(
      'REQ ' +
        requestNr +
        ' ' +
        httpMethod +
        ' ' +
        url +
        ' body: ' +
        JSON.stringify(body),
    );
  try {
    let httpResponse = await fetch(url, {
      method: httpMethod,
      headers: {
        token: getToken(),
        'Content-Type': 'application/json',
        'Accept-language': getUserLanguage(),
      },
      body: JSON.stringify(body),
    });
    if (!httpResponse.ok) {
      handleHttpError(httpResponse, await httpResponse.text());
    }
    const restResponse = await httpResponse.json();
    __DEV__ && logRestResponse(restResponse, '', requestNr, httpMethod, url);
    return restResponse;
  } catch (error) {
    console.log(error);
    alert(strings.formatString(strings.serverError, error));
    return undefined;
  }
}

export async function fetchWinkRest(
  uri: string,
  parameters: Object,
  httpMethod: string = 'GET',
  body?: any,
): any {
  const url: string = appendParameters(getWinkRestUrl() + uri, parameters);
  const requestNr = getNextRequestNumber();
  __DEV__ &&
    console.log(
      'REQ ' +
        requestNr +
        ' ' +
        httpMethod +
        ' ' +
        url +
        ' body: ' +
        JSON.stringify(body),
    );
  try {
    let httpResponse = await fetch(url, {
      method: httpMethod,
      headers: {
        token: getToken(),
        'Content-Type': 'application/json',
        'Accept-language': getUserLanguage(),
      },
      body: JSON.stringify(body),
    });
    if (!httpResponse.ok) {
      handleHttpError(httpResponse, await httpResponse.text());
    }
    const restResponse = await httpResponse.json();
    __DEV__ && logRestResponse(restResponse, '', requestNr, httpMethod, url);
    return restResponse;
  } catch (error) {
    console.log(error);
    alert(strings.formatString(strings.serverError, error));
    return undefined;
  }
}

export async function createPdf(
  uri: string,
  filename: string,
  parameters: Object,
  method: string = 'post',
  body?: any,
): any {
  const url: string = appendParameters(getWinkRestUrl() + uri, parameters);
  __DEV__ &&
    console.log(method + ' ' + url + ': ' + (body ? JSON.stringify(body) : ''));
  try {
    let httpResponse = await fetch(url, {
      method: method,
      headers: {
        token: getToken(),
        'Content-Type': 'application/json',
        'Accept-language': getUserLanguageShort(),
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : '',
    });
    //alert(JSON.stringify(httpResponse));
    if (!httpResponse.ok) {
      await handleHttpError(httpResponse);
    }
    const restResponse = await httpResponse.json();
    if (restResponse.errors) {
      alert(restResponse.errors);
      __DEV__ &&
        console.log(
          'restResponse contains a system error: ' +
            JSON.stringify(restResponse),
        );
      return undefined;
    }
    if (isWeb) {
      const format: string = 'data:application/pdf;base64,';
      return format.concat(restResponse.data);
    } else {
      const fullFilename: string = RNFS.DocumentDirectoryPath + '/' + filename;
      await RNFS.exists(fullFilename).then((exists: boolean) => {
        if (exists) {
          try {
            return RNFS.unlink(fullFilename);
          } catch (e) {
            __DEV__ && console.log(e.message);
          }
        }
      });
      await RNFS.writeFile(fullFilename, restResponse.data, 'base64');
      __DEV__ && console.log('Created local file ' + fullFilename);
      return fullFilename;
    }
  } catch (error) {
    console.log(error);
    alert(strings.formatString(strings.serverError, error));
    throw error;
  }
}

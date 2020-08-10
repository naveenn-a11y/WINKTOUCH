/**
 * @flow
 */
'use strict';

import type {Exam} from './Types';
import { appendParameters, getToken, getNextRequestNumber, logRestResponse, handleHttpError} from './Rest';
import { strings, getUserLanguage, getUserLanguageShort } from './Strings';
import RNFS from 'react-native-fs';
//import base64 from 'base-64';
//import {NativeModules} from 'react-native';

//export let winkRestUrl = 'https://ws-touch.downloadwink.com/WinkRESTvEHR/';
//export let winkRestUrl = __DEV__? 'http://192.168.2.53:8080/WinkRESTv5.00.04/': 'https://ws-touch.downloadwink.com/WinkRESTv5.00.04/';
export let winkRestUrl = __DEV__? 'http://192.168.2.53:8080/WinkRESTv5.00.04/': 'https://ws-touch.downloadwink.com/WinkRESTvEHR5.00.09/';

export async function fetchWinkRest(uri: string, parameters: Object, httpMethod?: string = 'GET', body?: any = undefined) : any {
  const url :string  = appendParameters(winkRestUrl + uri, parameters);
  const requestNr = getNextRequestNumber();
  __DEV__ && console.log('REQ '+requestNr+' '+httpMethod+' '+url+' body: '+JSON.stringify(body));
  try {
    let httpResponse = await fetch(url, {
        method: httpMethod,
        headers: {
          'token': getToken(),
          'Content-Type': 'application/json',
          'Accept-language': getUserLanguage(),
        },
        body: JSON.stringify(body)
    });
    if (!httpResponse.ok) handleHttpError(httpResponse, await httpResponse.text());
    const restResponse = await httpResponse.json();
    __DEV__ && logRestResponse(restResponse, '', requestNr, httpMethod, url);
    return restResponse;
  } catch (error) {
    console.log(error);
    alert(strings.formatString(strings.serverError, error));
    return undefined;
  }
}

export async function createPdf(uri: string, filename: string, parameters: Object, method?: string = 'post', body?: any = undefined) : any {
  const url :string  = appendParameters(winkRestUrl + uri, parameters);
  __DEV__ && console.log(method+' '+url+': '+(body?JSON.stringify(body):''));
  try {
    let httpResponse = await fetch(url, {
        method: method,
        headers: {
          'token': getToken(),
          'Content-Type': 'application/json',
          'Accept-language': getUserLanguageShort(),
          'Accept':'application/json'
        },
        body: body?JSON.stringify(body):''
    });
    //alert(JSON.stringify(httpResponse));
    if (!httpResponse.ok) await handleHttpError(httpResponse);
    const restResponse = await httpResponse.json();
    if (restResponse.errors) {
      alert(restResponse.errors);
      __DEV__ && console.log('restResponse contains a system error: '+ JSON.stringify(restResponse));
      return undefined;
    }
    const fullFilename : string = RNFS.DocumentDirectoryPath+'/' + filename;
    await RNFS.exists(fullFilename).then((exists: boolean) => {
      if(exists) {
        try {
          return RNFS.unlink(fullFilename);
        } catch (e) {
          __DEV__ && console.log(e.message);
        }
      }
    });
    await RNFS.writeFile(fullFilename, restResponse['data'], 'base64');
    __DEV__ && console.log('Created local file '+fullFilename);
    return fullFilename;
  } catch (error) {
    console.log(error);
    alert(strings.formatString(strings.serverError, error));
    throw(error);
  }
}

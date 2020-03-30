/**
 * @flow
 */
'use strict';

import type {Exam} from './Types';
import { appendParameters, getToken} from './Rest';
import { strings, getUserLanguage, getUserLanguageShort } from './Strings';
import RNFS from 'react-native-fs';
//import base64 from 'base-64';
//import {NativeModules} from 'react-native';

//export const winkRestUrl = 'https://nikon-feasibility.downloadwink.com/WinkRESTvWinkWeb/';
export let winkRestUrl = 'https://ws-touch.downloadwink.com/WinkRESTvEHR/';
//export const winkRestUrl = 'http://192.168.88.22:8080/WinkRESTv4.08.30/';

async function handleHttpError(httpResponse: any) {
  let errorMessage : string =  'HTTP error '+httpResponse.status;
  try {
      let httpBody = await httpResponse.json();
      if (httpBody && httpBody.exception) errorMessage += ': '+httpBody.exception;
  } catch (error) {
  }
  console.log('HTTP response error '+httpResponse.status+': '+ httpResponse.url);
  throw new Error(errorMessage);
}

export async function putRest(uri: string, parameters: Object, method?: string = 'put', body?: any = undefined) : any {
  const url :string  = appendParameters(winkRestUrl + uri, parameters);
  __DEV__ && console.log(method+' '+url+': '+body?JSON.stringify(body):'');
  try {
    let httpResponse = await fetch(url, {
        method: method,
        headers: {
          'token': getToken(),
          'Content-Type': 'application/json',
          'Accept-language': getUserLanguage(),
        },
        body: body?JSON.stringify(body):''
    });
    if (!httpResponse.ok) await handleHttpError(httpResponse);
    const restResponse = await httpResponse.json();
    if (restResponse.errors) {
      alert(restResponse.errors);
      console.log('restResponse contains a system error: '+ JSON.stringify(restResponse));
      return;
    }
    return restResponse;
  } catch (error) {
    console.log(error);
    alert(strings.serverError);
    throw(error);
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
    alert(strings.serverError);
    throw(error);
  }
}

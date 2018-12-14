/**
 * @flow
 */
'use strict';

import { appendParameters, getToken} from './Rest';
import { strings, getUserLanguage } from './Strings';
//import RNFS from 'react-native-fs';
//import base64 from 'base-64';
//import {NativeModules} from 'react-native';

//export const winkRestUrl = 'https://test1.downloadwink.com/WinkRESTv4.07.35/';
export const winkRestUrl = 'https://ws-touch.downloadwink.com/WinkRESTvEHR/';

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
  __DEV__ && console.log(method+' '+url+': '+body?JSON.stringify(body):'');
  try {
    let httpResponse = await fetch(url, {
        method: method,
        headers: {
          'token': getToken(),
          'Content-Type': 'application/json',
          'Accept-language': getUserLanguage(),
          'Accept':'application/json'
        },
        body: body?JSON.stringify(body):''
    });
    //alert(JSON.stringify(httpResponse));
    if (!httpResponse.ok) await handleHttpError(httpResponse);
    const restResponse = await httpResponse.json();
    if (restResponse.errors) {
      alert(restResponse.errors);
      console.log('restResponse contains a system error: '+ JSON.stringify(restResponse));
      return;
    } else {
      await RNFS.exists(RNFS.DocumentDirectoryPath+'/' + filename).then((result) => {
        console.log("file exists: ", result);
         if(result){
          try {
            return RNFS.unlink(RNFS.DocumentDirectoryPath+'/' + filename);
          } catch (e) {
            console.log(e.message);
          }
        }
      });
      await RNFS.writeFile(RNFS.DocumentDirectoryPath+'/' + filename,restResponse['data'], 'base64');
      return "ok";
    }

   // return '';
  } catch (error) {
    console.log(error);
    alert(strings.serverError);
    throw(error);
  }
}

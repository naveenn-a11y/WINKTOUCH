/**
 * @flow
 */
'use strict';

import base64 from 'base-64';
import {createDemoData} from './DemoData';
import { cacheItem } from './DataCache'

export const restUrl : string = 'http://192.168.2.44:5984/ehr/';

let idCounter : number = Math.round(Math.random()*1236878991214);

function newId() : string {
  //https://wiki.apache.org/couchdb/HttpGetUuids
  const newId : string = String(++idCounter);
  return newId;
}

function encodeKey(key: string | string[]) : string {
  if (key instanceof Array) {
    let keys : string[] = key;
    let url : string = '[';
    for (let i=0; i<keys.length;) {
      if (keys[i])
        url = url + '"' + encodeURIComponent(keys[i]) + '"';
      else
        url = url + '""';
      if (++i <keys.length) {
        url = url + ',';
      }
    }
    url = url + ']';
    return url;
  } else {
    return encodeURIComponent(key);
  }
}

function cacheDocument(doc: any) {
  if (!doc || !doc._id) return;
  cacheItem(doc._id, doc);
}

export async function fetchDocument(documentId: string) {
  try {
    const requestUrl = restUrl+encodeURIComponent(documentId);
    let response = await fetch(requestUrl, {
      method: 'get',
      headers: {
        'Authorization': 'Basic ' + base64.encode('ehr:ehr'),
        'Accept': 'application/json'
      }});
    if (!response.ok) throw response.reason;
    const document = await response.json();
    cacheDocument(document);
    return document;
  } catch (error) {
    console.log('Error in fetchDocument for document '+documentId+': '+error);
    alert('Something went wrong trying to get data from the server. You can try again anytime.');
  }
}

export async function getRevision(documentId: string) : string {
  try {
    const requestUrl = restUrl+encodeURIComponent(documentId);
    let response = await fetch(requestUrl, {  method: 'head' });
    if (!response.ok) throw response.reason;
    const revisionInQuotes : string = response.headers.map.etag[0];
    const revision : string = revisionInQuotes.substring(1, revisionInQuotes.length-1);
    return revision;
  } catch (error) {
    console.log('Error in getRevision for document '+documentId+': '+error);
    alert('Something went wrong trying to get the newest revision data from the server. You can try again anytime.');
  }
}

export async function fetchViewDocuments(view: string, startKey: any, endKey: any) {
  try {
    const requestUrl = restUrl+'_design/views/_view/'+view+'?startkey='+encodeKey(startKey)+'&endkey='+encodeKey(endKey)+'&include_docs=true';
    let response = await fetch(requestUrl);
    if (!response.ok) throw response.reason;
    let responseJson = await response.json();
    let documents : [] = [];
    let rows : [] = responseJson.rows;
    for (let i=0; i<rows.length; i++) {
       const row = rows[i];
       const doc = row.doc;
       if (row.id==doc._id) {
         documents.push(doc);
       }
       cacheDocument(doc);
    }
    return documents;
  } catch (error) {
    console.log('Error in fetch view '+view+' documents: '+error);
    alert('Something went wrong trying to get the '+view+' data from the server. You can try again anytime.');
  }
}

export async function storeDocument(document: Object) {
    if (document._id === undefined) {
      document._id = document.dataType+newId()
    }
    const requestUrl = restUrl+encodeURIComponent(document._id);
    let response = await fetch(requestUrl, {
      method: 'put',
      headers: {
        'Authorization': 'Basic ' + base64.encode('ehr:ehr'),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(document)
    });
    let responseJson = await response.json();
    if (responseJson.ok!==true) {
      console.log(JSON.stringify(responseJson));
      throw new Error('The server could not save your changes because of a '+responseJson.reason+'. Please redo your changes.');
    }
    document._rev = responseJson.rev;
    cacheDocument(document);
    return document;
}

async function deleteEhrDatabase() {
    try {
        let response = await fetch(restUrl, {
            method: 'delete',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Basic ' + base64.encode('ehr:ehr')
            }
        });
        let json = await response.json();
        //todo check if suckseeded
    } catch (error) {
      console.log(error);
      alert('Something went wrong deleting the ehr database: '+error);
    }
}


async function createEhrDatabase() {
    try {
        let response = await fetch(restUrl, {
            method: 'put',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Basic ' + base64.encode('ehr:ehr')
            }
        });
        //todo check if suckseeded
    } catch (error) {
      console.log(error);
      alert('Something went wrong creating the ehr database: '+error);
    }
}

async function createViews() {
    const viewsDesign = {
      views: {
        users: {
          map: `function (doc) {
            if (doc.dataType==='User') {
              emit([doc.firstName+' '+doc.lastName, doc.userType]);
            }
          }`
        },
        appointments: {
          map: `function (doc) {
            if (doc.dataType==='Appointment') {
                emit([doc.doctorId,doc.start]);
                emit([doc.doctorId,doc.start], {_id: doc.patientId});
            }
          }`
        },
        visits: {
          map: `function (doc) {
            if (doc.dataType==='Visit') {
              emit([doc.patientId, start]);
              if (doc.preExamIds && doc.preExamIds.length>0) {
                for (var i=0; i<doc.preExamIds.length; i++) {
                  emit([doc.patientId, start], {_id: doc.preExamIds[i]});
                }
              }
              if (doc.examIds && doc.examIds.length>0) {
                for (var i=0; i<doc.examIds.length; i++) {
                  emit([doc.patientId, start], {_id: doc.examIds[i]});
                }
              }
            }
          }`
        },
        test: {
          map: `function (doc) {
            if (doc.type && doc[doc.type] && doc[doc.type].length>0) {
              emit(doc.type, doc[doc.type]);
            }
            if (doc.type === 'refractionTest')
              emit(doc.type, doc);
          }`
        }
      },
      language: 'javascript'
    };
    try {
        let response = await fetch(restUrl+'_design/views', {
            method: 'put',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Basic ' + base64.encode('ehr:ehr')
            },
            body: JSON.stringify(viewsDesign)
        });
        //todo check if suckseeded
    } catch (error) {
      console.log(error);
      alert('Something went wrong creating the ehr database: '+error);
    }
}

export async function recreateDatabase() {
  idCounter = 0;
  await deleteEhrDatabase();
  await createEhrDatabase();
  await createViews();
  await createDemoData();
}

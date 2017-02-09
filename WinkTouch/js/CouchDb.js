/**
 * @flow
 */
'use strict';

import base64 from 'base-64';
import {createDemoData} from './DemoData';
import { cacheItem } from './DataCache'

export const restUrl : string = 'http://192.168.2.44:5984/ehr/';

let idCounter : number = 0;

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

export async function fetchViewDocuments(view: string, startKey: any, endKey: any) {
  try {
    const requestUrl = restUrl+'_design/views/_view/'+view+'?startkey='+encodeKey(startKey)+'&endkey='+encodeKey(endKey)+'&include_docs=true';
    let response = await fetch(requestUrl);
    let responseJson = await response.json();
    if (responseJson.ok && responseJson.ok!==true) throw responseJson.reason;
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
    let response = await fetch(restUrl+document._id, {
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
      throw 'The server could not save your changes because of a '+responseJson.reason+' Please redo your changes.';
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
                emit([doc.doctorId,doc.scheduledStart]);
                emit([doc.doctorId,doc.scheduledStart], {_id: doc.patientId});
            }
          }`
        },
        visits: {
          map: `function (doc) {
            if (doc.dataType==='Visit') {
              emit([doc.patientId, start], doc);
            }
          }`
        },
        examitems: {
          map: `function (doc) {
            if (doc.dataType==='ExamItem') {
              emit([doc.itemType, doc.examId], doc);
            }
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
  await deleteEhrDatabase();
  await createEhrDatabase();
  await createViews();
  await createDemoData();
}

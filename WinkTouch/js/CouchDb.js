/**
 * @flow
 */
'use strict';

import base64 from 'base-64';
import {createDemoData} from './DemoData';

export const restUrl : string = 'http://192.168.2.44:5984/ehr/';

let idCounter : number = 0;

function newId() : string {
  //https://wiki.apache.org/couchdb/HttpGetUuids
  const newId : string = String(++idCounter);
  return newId;
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
        appointments: {
          map: `function (doc) {
            if (doc.dataType==='Appointment') {
              emit(doc.scheduledStart, doc);
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

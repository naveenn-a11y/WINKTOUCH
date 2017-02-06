/**
 * @flow
 */
'use strict';

import type {ExamItems} from './Types';
import { restUrl, storeDocument } from './CouchDb';

export function newExamItems(examId: string, itemType: string) : ExamItems {
  return {
    dataType: 'ExamItem',
    itemType,
    examId
  };
}

export async function createExamItem(itemType: string, item: any) {
  try {
      item.dataType = 'ExamItem';
      item.itemType = itemType;
      item = storeDocument(item);
      return item;
  } catch (error) {
    console.log(error);
    alert('Something went wrong trying to create an exam item of type '+itemType+' on the server. You can try again anytime.');
  }
}

export async function fetchExamItems(examId: string, itemType: string): ?ExamItem {
  try {
    let response = await fetch(restUrl+'/_design/views/_view/examitems?startkey='+
    encodeURIComponent('["'+itemType+'","'+examId+'"]')+'&endkey='+
    encodeURIComponent('["'+itemType+'","'+examId+'"]'), {
        method: 'get'
    });
    let json = await response.json();
    const examItems = json.rows.length===0?undefined:json.rows[0].value;
    return examItems;
  } catch (error) {
    console.error(error);
    alert('Something went wrong trying to get the '+itemType+' list from the server. You can try again anytime.');
    return [];
  }
}

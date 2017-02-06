/**
 * @flow
 */
'use strict';

import {storeDocument} from './CouchDb';

export function createExamItem(itemType: string, item: any) {
  try {
      item.dataType = 'ExamItem';
      item.itemType = itemType;
      item = storeDocument(item);
      return item;
  } catch (error) {
    console.log(error);
    alert('Something went wrong trying to store an exam item of type '+itemType+' on the server. You can try again anytime.');
  }
}

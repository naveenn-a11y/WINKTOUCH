/**
 * @flow
 */
'use strict';

import type { Upload } from './Types';
import { storeItem, fetchItemById } from './Rest';

export async function storeUpload(upload: Upload) : Upload {
  upload = await storeItem(upload);
  return upload;
}

export async function fetchUpload(uploadId: string) : Upload {
  const upload : Upload = await fetchItemById(uploadId);
  return upload;
}

export function getMimeType(upload: ?Upload) : string {
  if (!upload) return undefined;
  let mimeType: string = upload.mimeType;
  if (!mimeType) {
    let fileName : ?string = upload.name;
    if (fileName) {
      fileName = fileName.trim().toLowerCase();
      if (fileName.endsWith('.jpg')) {
        mimeType = 'image/jpeg;base64';
      } else if (fileName.endsWith('.png')) {
        mimeType = 'image/png;base64';
      } else if (fileName.endsWith('.pdf')) {
        mimeType = 'application/pdf;base64';
      }
    }
  }
  return mimeType;
}

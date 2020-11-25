/**
 * @flow
 */
'use strict';

import base64 from 'base-64';
import type {Upload} from './Types';
import {storeItem, fetchItemById} from './Rest';

export async function storeUpload(upload: Upload): Upload {
  upload = await storeItem(upload);
  return upload;
}

export async function fetchUpload(uploadId: string): Upload {
  const upload: Upload = await fetchItemById(uploadId);
  return upload;
}

export function getMimeType(upload: ?Upload): string {
  if (!upload) return undefined;
  let mimeType: string = upload.mimeType;
  if (!mimeType) {
    let fileName: ?string = upload.name;
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

export function getJpeg64Dimension(
  base64jpg: string,
): {width: number, height: number} {
  let decodedHeader: string = base64.decode(base64jpg.substring(0, 1024)); //size should be in the first kilo
  let lastByte: number = -1;
  for (var i = 0; i < decodedHeader.length; i++) {
    const byte: number = decodedHeader.charCodeAt(i);
    if (lastByte === 255 && byte === 192) {
      i += 4;
      const height: number =
        decodedHeader.charCodeAt(i) * 256 + decodedHeader.charCodeAt(i + 1);
      const width: number =
        decodedHeader.charCodeAt(i + 2) * 256 + decodedHeader.charCodeAt(i + 3);
      return {width, height};
    }
    lastByte = byte;
  }
  !__DEV__ && console.log("Couln't find size in jpeg");
  const width: number = 1024;
  const height: number = 768;
  return {width, height};
}

function toInt32(bytes): number {
  return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
}

export function getPng64Dimension(
  base64png: string,
): {width: number, height: number} {
  let decodedHeader: string = base64.decode(base64png.slice(0, 50));
  let widthBytes = [
    decodedHeader.charCodeAt(16),
    decodedHeader.charCodeAt(17),
    decodedHeader.charCodeAt(18),
    decodedHeader.charCodeAt(19),
  ];
  const width: number = toInt32(widthBytes);
  let heightBytes = [
    decodedHeader.charCodeAt(20),
    decodedHeader.charCodeAt(21),
    decodedHeader.charCodeAt(22),
    decodedHeader.charCodeAt(23),
  ];
  const height: number = toInt32(heightBytes);

  return {width, height};
}

export function getAspectRatio(upload: ?Upload): number {
  const defaultRatio: number = 3 / 4;
  if (!upload) return defaultRatio;
  const mimeType = getMimeType(upload);
  if (mimeType === 'image/jpeg;base64') {
    const dimension: {width: number, height: number} = getJpeg64Dimension(
      upload.data,
    );
    if (dimension.height === 0) return defaultRatio;
    return dimension.width / dimension.height;
  } else if (mimeType === 'image/png;base64') {
    const dimension: {width: number, height: number} = getPng64Dimension(
      upload.data,
    );
    if (dimension.height === 0) return defaultRatio;
    return dimension.width / dimension.height;
  } else {
    __DEV__ &&
      console.log(
        "Don't know how to get the aspect ratio out of a " + mimeType + ' yet',
      );
  }
  return defaultRatio;
}

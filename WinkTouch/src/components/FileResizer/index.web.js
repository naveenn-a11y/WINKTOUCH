import Resizer from 'react-image-file-resizer';

export const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
  const byteCharacters = window.atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, {type: contentType});
  return blob;
};

export const resizeFile = (
  image,
  maxWidth,
  maxHeight,
  type,
  quality,
  rotation,
  tempFolder = '',
) =>
  new Promise((resolve) => {
    const blob = b64toBlob(image, 'image/jpeg');
    Resizer.imageFileResizer(
      blob,
      maxWidth,
      maxHeight,
      type,
      quality,
      rotation,
      (uri) => {
        resolve(uri);
      },
      'base64',
    );
  });

import ImageResizer from 'react-native-image-resizer';
export async function resizeFile(
  image,
  maxWidth,
  maxHeight,
  type,
  quality,
  rotation,
  tempFolder = '',
) {
  const resizedImage = await ImageResizer.createResizedImage(
    'data:image/jpeg;base64,' + image,
    maxWidth,
    maxHeight,
    type,
    quality,
    rotation,
    tempFolder,
  );
  return resizedImage;
}

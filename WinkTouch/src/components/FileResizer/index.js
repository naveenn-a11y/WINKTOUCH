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
    image,
    maxWidth,
    maxHeight,
    type,
    quality,
    rotation,
    tempFolder,
  );
  return resizedImage;
}

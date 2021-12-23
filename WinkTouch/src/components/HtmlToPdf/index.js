import {NativeModules} from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';

export async function printHtml(html: string) {
  let file = await generatePDF(html, false);
  const job: any = await NativeModules.RNPrint.print({filePath: file.filePath});
  await RNFS.unlink(file.filePath);
  return job;
}

export async function generatePDF(html: string, isBase64: boolean) {
  const pageWidth: number = 612;
  const pageAspectRatio: number = 8.5 / 11;
  const pageHeight: number = pageWidth / pageAspectRatio;
  let options = {
    html,
    fileName: 'Print',
    width: pageWidth,
    height: pageHeight,
    base64: isBase64,
    padding: 10,
    bgColor: '#FFFFFF',
  };
  let file = await RNHTMLtoPDF.convert(options);
  return file;
}

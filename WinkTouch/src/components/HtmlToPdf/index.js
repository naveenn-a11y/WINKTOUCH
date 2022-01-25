import {NativeModules} from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import {PDFDocument, PDFPage} from 'pdf-lib';

export async function printHtml(html: string, PDFAttachment:Array<any> =[], cb:function=()=>{}) {
  const pageWidth: number = 612;
  const pageAspectRatio: number = 8.5 / 11;
  const pageHeight: number = pageWidth / pageAspectRatio;

  let pdf = await generatePDF(html, false);
  let resultPdf = await PDFDocument.load(pdf?.base64);

  for (var pdfInstance of PDFAttachment) {
    let index = 0;
    const newPdf = await PDFDocument.load(pdfInstance.base64);
    for (const page: PDFPage of newPdf.getPages()) {
      index += 1;
      const documentPage: PDFPage = resultPdf.addPage();
      documentPage.setSize(pageWidth, pageHeight);
      const embedPage = await resultPdf.embedPage(page);
      const dims = embedPage.scale(0.9);
      documentPage.drawPage(embedPage, {
        ...dims,
        x: 0,
        y: pageHeight - dims.height,
      });
      if (index === newPdf.getPages().length) {
        const text = pdfInstance.index;
        const textSize = 15;
        documentPage.drawText(text, {x: 0, y: 10, size: textSize});
      }
    }
  }
  const resultBase64: string = await resultPdf.saveAsBase64();
  const fPath = `${RNFS.DocumentDirectoryPath}/pdfFileName.pdf`;
  await RNFS.writeFile(fPath, resultBase64, 'base64');
  cb();
  const job: any = await NativeModules.RNPrint.print({filePath: fPath});
  await RNFS.unlink(fPath);
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
    base64: true,
    padding: 10,
    bgColor: '#FFFFFF',
  };
  let pdf = await RNHTMLtoPDF.convert(options);
  return pdf;
}

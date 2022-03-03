import html2pdf from 'html2pdf.js';
import PDFLib, {PDFDocument, PDFPage} from 'pdf-lib';

export async function printHtml(html: string, PDFAttachment:Array<any> =[], cb:function=()=>{}) {
  const pdf = await generatePDF(html, false);
  const resultPdf = await addPDFAttachment(pdf,PDFAttachment);
  const resultBase64: string = await resultPdf.saveAsBase64();

  const blob = base64ToBlob(resultBase64, 'application/pdf');
  const url = URL.createObjectURL(blob);

  cb();
  x = window.open('');
  x.document.open();
  x.document.write('<html><title>Patient File</title><body style="margin:0px;">');
  x.document.write("<iframe width='100%' height='100%' src='" + url + "'></iframe>");
  x.document.write('</body></html>');
  x.document.close();
  return pdf;
}
export async function addPDFAttachment(pdf,PDFAttachment:Array<any> =[]){
  const pageWidth: number = 612;
  const pageAspectRatio: number = 8.5 / 11;
  const pageHeight: number = pageWidth / pageAspectRatio;
  let resultPdf = await PDFDocument.load(pdf?.base64);

  for (let pdfInstance of PDFAttachment) {
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
  return resultPdf
}
export async function generatePDF(html: string, isBase64: boolean) {
  let data = await html2pdf()
    .set(getOptions())
    .from(html)
    .toPdf()
    .output('datauristring');
  if (data.startsWith('data')) {
    data = data.split(',')[1];
  }
  const job = {base64: data};
  return job;
}
function base64ToBlob(base64, type = '') {
  const binStr = atob(base64);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  return new Blob([arr], {type: type});
}
function getOptions() {
  const pageWidth: number = 612;
  const pageAspectRatio: number = 8.5 / 11;
  const pageHeight: number = pageWidth / pageAspectRatio;
  const opt = {
    filename: 'Print.pdf',
    pagebreak: {
      mode: ['css', 'avoid-all'],
      // before: '.breakBefore',
      avoid: ['img', 'div'],
    },
    margin: 15,
    jsPDF: {
      unit: 'pt',
      format: [pageHeight, pageWidth],
      orientation: 'portrait',
    },
    html2canvas: {scale: 2.5, useCORS: true},
  };
  return opt;
}

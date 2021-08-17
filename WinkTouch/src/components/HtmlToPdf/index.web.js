import html2pdf from 'html2pdf.js';

export async function printHtml(html: string) {
  /* const job = await html2pdf()
    .set(getOptions())
    .from(html)
    .toPdf()
    .output('dataurlnewwindow');
*/
  const job = undefined;
  var x = window.open();
  x.document.open();
  x.document.write(html);
  x.document.close();

  return job;
}

export async function generatePDF(html: string, isBase64: boolean) {
  let data = await html2pdf()
    .set(getOptions())
    .from(html)
    .toPdf()
    .output('datauristring');
  if (data.startsWith('data')) data = data.split(',')[1];
  const job = {base64: data};
  return job;
}
function getOptions() {
  const pageWidth: number = 612;
  const pageAspectRatio: number = 8.5 / 11;
  const pageHeight: number = pageWidth / pageAspectRatio;
  const opt = {
    filename: 'Print.pdf',
    pagebreak: {mode: ['css']},
    jsPDF: {
      unit: 'pt',
      format: [pageHeight, pageWidth],
      orientation: 'portrait',
    },
    html2canvas: {scale: 2.5},
  };
  return opt;
}

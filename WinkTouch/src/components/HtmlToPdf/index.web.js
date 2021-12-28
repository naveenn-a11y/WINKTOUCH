import html2pdf from 'html2pdf.js';
export async function printHtml(html: string) {
  const pdf = await generatePDF(html,false);

  const blob = base64ToBlob( pdf?.base64, 'application/pdf' );
  const url = URL.createObjectURL( blob );

  x = window.open("");
  x.document.open();
  x.document.write('<html><title>Patient File</title><body style="margin:0px;">');
  x.document.write("<iframe width='100%' height='100%' src='" + url + "'></iframe>");
  x.document.write('</body></html>');
  x.document.close();
  
  // x = window.open("");
  // x.document.open();
  // x.document.write(html);
  // x.document.close();
  return pdf;
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
function base64ToBlob( base64, type = "" ) {
  const binStr = atob( base64 );
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[ i ] = binStr.charCodeAt( i );
  }
  return new Blob( [ arr ], { type: type } );
}
function getOptions() {
  const pageWidth: number = 612;
  const pageAspectRatio: number = 8.5 / 11;
  const pageHeight: number = pageWidth / pageAspectRatio;
  const opt = {
    filename: 'Print.pdf',
    pagebreak: {mode: ['css','avoid-all'], before:".breakBefore",avoid: ['img','div']},
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

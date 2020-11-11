import html2pdf from 'html2pdf.js';

export async function printHtml(html: string) {
  console.log('HTMLLL: ' + html);
  const job = await html2pdf()
    .set(getOptions())
    .from(html)
    .toPdf()
    .output('dataurlnewwindow');
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
  const opt = {
    margin: 54,
    filename: 'Print.pdf',
    jsPDF: {unit: 'pt', format: 'a4', orientation: 'portrait'},
  };
  return opt;
}

export async function printHtml(html: string) {
  var x = window.open();
  x.document.open();
  x.document.write(html);
  x.document.close();

  const job = undefined;
  // x = window.open("");
  // x.document.open();

  // const pdf = await generatePDF(html);
  // const blob = base64ToBlob( pdf?.base64, 'application/pdf' );
  // const url = URL.createObjectURL( blob );

  // x.document.write('<html><title>Patient File</title><body style="margin:0px;">');
  // x.document.write("<iframe width='100%' height='100%' src='" + url + "'></iframe>");
  // x.document.write('</body></html>');
  // x.document.close();

  return job;
}
export async function generatePDF(html: string,) {
  let result = await fetch('http://localhost:7000/generatePdf', {
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({html}),
  });
  const {pdf} = await result.json();
  return pdf
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

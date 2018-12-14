/**
 * @flow
 */
'use strict';
import {NativeModules} from 'react-native';
//import RNHTMLtoPDF from 'react-native-html-to-pdf';
//import RNFS from 'react-native-fs';
import { strings } from './Strings';
import { createPdf } from './WinkRest';

/**
async function testPrintHtml() {
  let html = {
      html: '<h1>Prescription</h1><Table><TR><TD></TD><TD>Sph</TD><TD>Cyl</TD></TR><TR><TD>OD:</TD><TD>+1.25</TD></TR></Table>',
      fileName: 'test',
      base64: true,
  };

  try {
    const results = await RNHTMLtoPDF.convert(html);
    const jobName = await NativeModules.RNPrint.print(results.filePath);
    console.log(`Printing ${jobName} completed!`);
  } catch (err) {
    console.error(err)
  }
}
*/

export async function printRx(visitId: string) {
  try {
    const filename : string = 'Rx.pdf';
    await createPdf('webresources/reports', filename,{'type':'eye-exam'},'post',{'visitId':visitId});
    const jobName = await NativeModules.RNPrint.print(RNFS.DocumentDirectoryPath+'/' + filename);
  } catch (error) {
    alert(strings.serverError); //TODO rxError
  }
}

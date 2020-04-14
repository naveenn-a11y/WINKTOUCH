/**
 * @flow
 */
'use strict';
import {NativeModules} from 'react-native';
import PDFLib, { PDFDocument, PDFPage } from 'react-native-pdf-lib';
import type { User,PatientInfo, Visit } from './Types';
import RNFS from 'react-native-fs';
import { strings } from './Strings';
import { createPdf } from './WinkRest';
import { formatDate, now, officialDateFormat, prefix, postfix} from './Util';
import { getExam } from './Exam';
import { getCachedItem } from './DataCache';
import { getDoctor, getStore } from './DoctorApp';
import { fetchItemById } from './Rest';
import { fetchUpload, getJpeg64Dimension, getPng64Dimension, getMimeType } from './Upload';
import { winkRestUrl } from './WinkRest';
import RNHTMLtoPDF from 'react-native-html-to-pdf';



export async function printPatientFile(visitHtml: string) {
    const html = visitHtml;
    let options = {
      html,
      fileName: 'Patient Exam File'
    };
    let file = await RNHTMLtoPDF.convert(options);
  await NativeModules.RNPrint.print({filePath: file.filePath});
  }

export async function printRx(visitId: string) {
  try {
    const filename : string = 'Rx.pdf';
    await createPdf('webresources/reports', filename, {'type':'eye-exam'},'post',{'visitId':visitId});
    const jobName = await NativeModules.RNPrint.print({filePath: RNFS.DocumentDirectoryPath+'/' + filename});
  } catch (error) {
    alert(strings.serverError); //TODO rxError
  }
}

export async function printClRx(visitId: string) {
  try {
    const filename : string = 'Rx.pdf';
    await createPdf('webresources/reports', filename, {'type':'clRx'},'post',{'visitId':visitId});
    const jobName = await NativeModules.RNPrint.print({filePath: RNFS.DocumentDirectoryPath+'/' + filename});
  } catch (error) {
    alert(strings.serverError); //TODO clrxError
  }
}

async function listLocalFiles() : string[]{
  const fileNames : string[] = await RNFS.readdir(RNFS.DocumentDirectoryPath);
  __DEV__ && fileNames.forEach(fileName => console.log(fileName));
  return fileNames;
}

export async function deleteLocalFiles() {
  console.log('Deleting local files');
  let fileNames = await listLocalFiles();
  for (let i=0; i<fileNames.length; i++) {
    if (fileNames[i].includes('.')) {
      await RNFS.unlink(RNFS.DocumentDirectoryPath+'/'+fileNames[i]);
    }
  }
}

async function loadRxLogo() {
  //TODO: only fetch once
  __DEV__ && console.log('Fetching Rx logo');
  await RNFS.downloadFile({
    fromUrl: winkRestUrl+'/webresources/attachement/845/431/Rx.jpg',
    toFile: RNFS.DocumentDirectoryPath+'/Rx-logo.jpg'
  });
}

loadRxLogo();

async function addLogo(page: PDFPage, pageHeight: number, border: number) {
  if (!(await RNFS.exists(RNFS.DocumentDirectoryPath+'/Rx-logo.jpg'))) {
    await loadRxLogo();
    if (!(await RNFS.exists(RNFS.DocumentDirectoryPath+'/Rx-logo.jpg'))) {
      return;
    }
  }
  page.drawImage(RNFS.DocumentDirectoryPath+'/Rx-logo.jpg', 'jpg', {x: border, y: pageHeight-border-100, width: 100, height: 100});
}

function addDrHeader(visitId: string, page: PDFPage, pageWidth: number, pageHeight: number, border: number) {
  const store : Store = getStore();
  const visit: Visit = getCachedItem(visitId);
  //const doctor = getDoctor();
  if (!visit || !visit.userId) return;
  const doctor : User = getCachedItem(visit.userId);
  if (!doctor) return;
  const leftBorder : number = pageWidth-120-border;
  const top: number = pageHeight-border;
  let x : number = leftBorder;
  let y : number = top;
  let fontSize: number = 10;
  y-=fontSize*1.15;
  //page.drawText('Dr FirstName Latname - License Number', {x,y,fontSize});
  page.drawText(doctor.firstName+prefix(doctor.lastName,' ')+prefix(doctor.license,' - '), {x,y,fontSize});
  y-=fontSize*2;
  if (!store) return;
  page.drawText(store.streetNumber+' '+store.streetName+prefix(store.unit, ', '), {x,y,fontSize});
  y-=fontSize*1.15;
  page.drawText(store.postalCode+' '+store.city, {x,y,fontSize});
  y-=2*fontSize;
  page.drawText(store.telephone, {x,y,fontSize});
}

function addCurrentDate(page: PDFPage, pageHeight: number, border: number) {
  const fontSize : number = 12;
  page.drawText('Date: '+formatDate(now(), officialDateFormat), {x: border, y: pageHeight-150-border, fontSize});
}

function addPatientHeader(visitId: string, page: PDFPage, pageWidth: number, pageHeight: number, border: number) {
  const visit: Visit = getCachedItem(visitId);
  if (!visit) return;
  const patient: PatientInfo = getCachedItem(visit.patientId);
  if (!patient) return;
  const top: number = pageHeight-175-border;
  const fontSize: number = 10;
  let column1 : number = border;
  let column2 : number = pageWidth-border-300;
  let x : number = column1;
  let y : number = top;
  y-=fontSize*1.15;
  page.drawText(postfix(patient.lastName,' ')+patient.firstName, {x,y,fontSize:fontSize+2});
  y-=(fontSize+2)*1.15;
  page.drawText(postfix(patient.streetNumber, ' ')+patient.streetName+prefix(patient.unit, ', '), {x,y,fontSize});
  x = column2;
  page.drawText(prefix(patient.dateOfBirth, ''), {x,y,fontSize});
  x = column1;
  y-=fontSize*1.15;
  page.drawText(patient.city, {x,y,fontSize});
  x = column2;
  page.drawText(''+patient.medicalCard, {x,y,fontSize});
  x = column1;
  y-=fontSize*1.15;
  page.drawText(''+patient.postalCode, {x,y,fontSize});
  x = column2;
  page.drawText(''+patient.cell+' '+patient.phone, {x,y,fontSize});
  y-=fontSize*2;
  page.drawRectangle({
    x: border-10,
    y,
    width: pageWidth-2*border+20,
    height: 1
  });
}

function addMedicalRxLines(visitId: string, page: PDFPage, pageHeight: number, border: number) {
  const medicationExam : Exam = getExam('Prescription', getCachedItem(visitId));
  if (medicationExam===undefined || medicationExam===null) return;
  const prescriptions = medicationExam['Prescription'];
  if (prescriptions===undefined || prescriptions===null) return;
  const fontSize : number = 12;
  let x : number = border;
  let y : number = pageHeight-border-280;
  prescriptions.forEach((prescription, i) => {
      let formattedRxLine : string = prescription['Label'];
      formattedRxLine += prefix(prescription['Strength'],', ');
      formattedRxLine += prefix(prescription['Dosage'],', ');
      formattedRxLine += prefix(prescription['Frequency'],', ');
      formattedRxLine += prefix(prescription['Refill'],', ');
      formattedRxLine += prefix(prescription['Do not substitute'],', ');
      page.drawText(formattedRxLine, {x, y, fontSize});
      y-=fontSize*1.5;
      formattedRxLine = prefix(prescription['Instructions'],'       ');
      if (formattedRxLine) {
        page.drawText(formattedRxLine, {x, y, fontSize});
        y-=fontSize*1.15;
      }
      formattedRxLine = prefix(prescription['Duration'],'       '+strings.during+' ');
      if (formattedRxLine) {
        page.drawText(formattedRxLine, {x, y, fontSize});
        y-=fontSize*1.15;
      }
      const commentLine : string = prescription['Comment'];
      if (commentLine) {
        y-=fontSize*.5;
        let lines = commentLine.split('\n');
        lines.forEach((line, j) => {
          page.drawText(prefix(line, '       '), {x, y, fontSize});
          y-=fontSize*1.15;
        });
      }
      y-=fontSize;
  });
}



async function addSignature(visitId: string, page: PDFPage, pageWidth: number, border: number) {
  const visit: Visit = getCachedItem(visitId);
  const signedDate : ?string = visit.prescription && visit.prescription.signedDate?formatDate(visit.prescription.signedDate, officialDateFormat):undefined;

  const fontSize : number = 10;
  let x : number = border*3;
  let y : number = border+fontSize*4;
  page.drawText(strings.drSignature+':', {x, y, fontSize});
  x+=60;
  if (signedDate) {
    let doctor : User = getCachedItem(visit.userId);
    if (!doctor) {
      doctor = await fetchItemById(visit.userId); //TODO: This does not work actually
    }
    if (!doctor) {
      __DEV__ && console.error('Failed to fetch doctor '+visit.userId);
    } else {
      if (doctor.signatureId) {
        const fullFilename : string = RNFS.DocumentDirectoryPath+'/' + doctor.signatureId+'.base64';
        let signature : Upload = getCachedItem(doctor.signatureId);
        if (!signature) {
          signature = await fetchUpload(doctor.signatureId);
          if (!signature) {
            __DEV__ && console.warn('failed to download singature '+doctor.signatureId);
            return;
          }
          await RNFS.writeFile(fullFilename, signature.data, 'base64');
          __DEV__ && console.log('Created local file '+fullFilename);
        } else {
          if (!(await RNFS.exists(fullFilename))) {
            await RNFS.writeFile(fullFilename, signature.data, 'base64');
            __DEV__ && console.log('Created local file '+fullFilename);
          }
        }
        const mimeType : string = getMimeType(signature);
        if (mimeType==='image/jpeg;base64') {
          let dimension = getJpeg64Dimension(signature.data);
          page.drawImage(fullFilename, 'jpg', {x, y: border, width: 150, height: dimension.height/dimension.width*150});
        } else if (mimeType==='image/png;base64') {
          let dimension = getPng64Dimension(signature.data);
          page.drawImage(fullFilename, 'png', {x, y: border, width: 150, height: dimension.height/dimension.width*150});
        } else {
          __DEV__ && console.log('Unsupported signature image type:'+ signature.name+' '+signature.mimeType);
        }
      }
    }
  }

  x = pageWidth-170;
  page.drawText(strings.signedDate+':'+prefix(signedDate,' '), {x, y, fontSize});

}

export async function printMedicalRx(visitId: string) {
  const pageWidth : number = 612; //US Letter portrait 8.5 inch * 72 dpi
  const pageAspectRatio : number = 8.5/11; //US Letter portrait
  const pageHeight : number = pageWidth/pageAspectRatio;
  const border: number = 40;

  const rxPage : PDFPage = PDFPage
    .create()
    .setMediaBox(pageWidth, pageHeight);

  await addLogo(rxPage, pageHeight, border);
  addDrHeader(visitId, rxPage, pageWidth, pageHeight, border);
  addCurrentDate(rxPage, pageHeight, border);
  addPatientHeader(visitId, rxPage, pageWidth, pageHeight, border);
  addMedicalRxLines(visitId, rxPage, pageHeight, border);
  await addSignature(visitId, rxPage, pageWidth, border);

  const docsDir = await PDFLib.getDocumentsDirectory();
  const pdfPath = `${docsDir}/print.pdf`;
  let filePath = await PDFDocument.create(pdfPath).addPages(rxPage).write();
  await NativeModules.RNPrint.print({filePath: filePath});
  __DEV__ && console.log('printed medical rx for '+visitId);
}

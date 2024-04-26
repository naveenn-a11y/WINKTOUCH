/**
 * @flow
 */

'use strict';
import {NativeModules, Image} from 'react-native';
import PDFLib, {PDFDocument, PDFPage} from 'react-native-pdf-lib';
import type {User, PatientInfo, Visit} from './Types';
import RNFS from 'react-native-fs';
import {getUserLanguage, strings} from './Strings';
import {createPdf, fetchWinkRest} from './WinkRest';
import {
  formatDate,
  now,
  officialDateFormat,
  prefix,
  postfix,
  isEmpty,
  getDoctorFullName,
} from './Util';
import {getExam} from './Exam';
import {getCachedItem} from './DataCache';
import {getStore, getAccount} from './DoctorApp';
import {fetchItemById} from './Rest';
import {
  fetchUpload,
  getJpeg64Dimension,
  getPng64Dimension,
  getMimeType,
} from './Upload';
import {getWinkRestUrl} from './WinkRest';
import {isWeb} from './Styles';
import {base64ToBlob} from '../src/components/HtmlToPdf';
import {loadBase64ImageForWeb} from './ImageField';
import {getPatientFullName} from './Patient';

export async function printRx(
  visitId: string,
  printFinalRx: boolean,
  printVAs: boolean,
  printMPDs: boolean,
  printBPDs: boolean,
  printNotesOnRx: boolean,
  drRecommendationArray: string[],
  binocularPD: ?string = '',
) {
  try {
    const filename: string = 'Rx.pdf';
    const path = await createPdf(
      'webresources/reports',
      filename,
      {type: 'eye-exam'},
      'post',
      {
        visitId: visitId,
        rxRecommendations: drRecommendationArray,
        printFinalRx: printFinalRx,
        printVAs: printVAs,
        printMPDs: printMPDs,
        printBPDs: printBPDs,
        printPDs: printBPDs || printMPDs,
        printNotesOnRx: printNotesOnRx,
        binocularPD: binocularPD,
      },
    );
    if (isWeb) {
      const htmlContent: string = `<iframe src="${path}" height="100%" width="100%" frameBorder="0"></iframe>`;
      var x = window.open();
      x.document.open();
      x.document.write(htmlContent);
      x.document.close();
    } else {
      const jobName = await NativeModules.RNPrint.print({
        filePath: RNFS.DocumentDirectoryPath + '/' + filename,
      });
    }
  } catch (error) {
    alert(strings.serverError); //TODO rxError
  }
}

export async function printClRx(visitId: string) {
  try {
    const filename: string = 'Rx.pdf';
    const path = await createPdf(
      'webresources/reports',
      filename,
      {type: 'clRx'},
      'post',
      {
        visitId: visitId,
        showTrialDetails: false,
      },
    );
    if (isWeb) {
      const htmlContent: string = `<iframe src="${path}" height="100%" width="100%" frameBorder="0"></iframe>`;
      var x = window.open();
      x.document.open();
      x.document.write(htmlContent);
      x.document.close();
    } else {
      const jobName = await NativeModules.RNPrint.print({
        filePath: RNFS.DocumentDirectoryPath + '/' + filename,
      });
    }
  } catch (error) {
    alert(strings.serverError); //TODO clrxError
  }
}

export async function emailRx(
  visitId: string,
  printFinalRx: boolean,
  printVAs: boolean,
  printMPDs: boolean,
  printBPDs: boolean,
  printNotesOnRx: boolean,
  drRecommendationArray: string[],
  binocularPD: ?string = '',
) {
  try {
    let parameters: {} = {type: 'eye-exam'};
    let body: {} = {
      visitId: visitId,
      rxRecommendations: drRecommendationArray,
      printFinalRx: printFinalRx,
      printVAs: printVAs,
      printMPDs: printMPDs,
      printBPDs: printBPDs,
      printPDs: printBPDs || printMPDs,
      printNotesOnRx: printNotesOnRx,
      binocularPD: binocularPD,
    };
    let response = await fetchWinkRest(
      'webresources/reports/email',
      parameters,
      'POST',
      body,
    );
    return response;
  } catch (error) {
    alert(strings.serverError); //TODO rxError
  }
}

export async function emailClRx(visitId: string) {
  try {
    let parameters: {} = {type: 'clRx'};
    let body: {} = {
      visitId: visitId,
      showTrialDetails: false,
    };
    let response = await fetchWinkRest(
      'webresources/reports/email',
      parameters,
      'POST',
      body,
    );
    return response;
  } catch (error) {
    alert(strings.serverError); //TODO clrxError
  }
}

async function listLocalFiles(): string[] {
  if (isWeb) return;
  const fileNames: string[] = await RNFS.readdir(RNFS.DocumentDirectoryPath);
  __DEV__ && fileNames.forEach((fileName) => console.log(fileName));
  return fileNames;
}

export async function deleteLocalFiles() {
  if (isWeb) return;
  console.log('Deleting local files');
  let fileNames = await listLocalFiles();
  for (let i = 0; i < fileNames.length; i++) {
    if (fileNames[i].includes('.')) {
      await RNFS.unlink(RNFS.DocumentDirectoryPath + '/' + fileNames[i]);
    }
  }
}

async function loadRxLogo(): Promise<string> {
  //TODO: only fetch once
  __DEV__ && console.log('Fetching Rx logo');
  const url: string =
    getWinkRestUrl() + 'webresources/attachement/845/431/Rx.jpg';
  if (isWeb) {
    const path: string = await loadBase64ImageForWeb(url);
    return path;
  } else {
    await RNFS.downloadFile({
      fromUrl: url,
      toFile: RNFS.DocumentDirectoryPath + '/Rx-logo.jpg',
    });
  }
}

async function addLogo(
  page: PDFPage,
  pageHeight: number,
  border: number,
  pdfDoc?: PDFDocument,
) {
  if (isWeb) {
    const rxLogo: string = await loadRxLogo();
    if (rxLogo === undefined || rxLogo === null || rxLogo === '') {
      return;
    }
    const image = await pdfDoc.embedJpg(rxLogo);
    page.drawImage(image, {
      x: border,
      y: pageHeight - border - 65,
      width: 65,
      height: 65,
    });
  } else {
    if (!(await RNFS.exists(RNFS.DocumentDirectoryPath + '/Rx-logo.jpg'))) {
      await loadRxLogo();
      if (!(await RNFS.exists(RNFS.DocumentDirectoryPath + '/Rx-logo.jpg'))) {
        return;
      }
    }
    page.drawImage(RNFS.DocumentDirectoryPath + '/Rx-logo.jpg', 'jpg', {
      x: border,
      y: pageHeight - border - 65,
      width: 65,
      height: 65,
    });
  }
}

async function addStoreLogo(
  page: PDFPage,
  pdfDoc?: PDFDocument,
  x: number,
  y: number,
) {
  if (isWeb) {
    await addStoreLogoWeb(page, pdfDoc, x, y);
  } else {
    await addStoreLogoIos(page, pdfDoc, x, y);
  }
}

async function addStoreLogoWeb(
  page: PDFPage,
  pdfDoc?: PDFDocument,
  x: number,
  y: number,
) {
  const url: string =
    getWinkRestUrl() +
    `webresources/attachement/${getAccount().id}/${
      getStore().storeId
    }/storelogo.png`;
  __DEV__ && console.log(`Fetching Store logo: ${url}`);

  const storeLogo = await loadBase64ImageForWeb(url);

  if (storeLogo === undefined || storeLogo === null || storeLogo === '') {
    return;
  }
  const imageDim = await getImageDimensions(storeLogo);
  const width: number = imageDim.width ? imageDim.width : 110;

  const image = await pdfDoc.embedPng(storeLogo);
  page.drawImage(image, {
    x: x - width,
    y: y - 50,
    width,
    height: imageDim.height ? imageDim.height : 54,
  });
}

async function addStoreLogoIos(
  page: PDFPage,
  pdfDoc?: PDFDocument,
  x: number,
  y: number,
) {
  const url: string =
    getWinkRestUrl() +
    `webresources/attachement/${getAccount().id}/${
      getStore().storeId
    }/storelogo.png`;
  const fileName = `Store-logo${getAccount().id}${getStore().storeId}.png`;
  __DEV__ && console.log(`Fetching Store logo: ${url}`, fileName);

  await RNFS.downloadFile({
    fromUrl: url,
    toFile: RNFS.DocumentDirectoryPath + '/' + fileName,
  });

  if (!(await RNFS.exists(RNFS.DocumentDirectoryPath + '/' + fileName))) {
    return;
  }

  const fPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
  const imageDim = await getImageDimensions(fPath);
  const width: number = imageDim.width ? imageDim.width : 110;

  page.drawImage(fPath, 'png', {
    x: x - width,
    y: y - 50,
    width,
    height: imageDim.height ? imageDim.height : 54,
  });
}

export function getImageDimensions(storeLogo: string): Promise<any> {
  return new Promise((resolve) => {
    Image.getSize(
      storeLogo,
      (width, height) => {
        const ratio = height / width;
        const imageWidth = 120;
        const imageHeight = imageWidth * ratio;
        resolve({width: imageWidth, height: imageHeight});
      },
      (error) => {
        resolve({});
      },
    );
  });
}

async function addText(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  page: PDFPage,
  pdfDoc?: PDFDocument,
) {
  if (isWeb) {
    await addTextWeb(text, x, y, fontSize, page, pdfDoc);
  } else {
    await addTextIos(text, x, y, fontSize, page);
  }
}
async function addTextIos(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  page: PDFPage,
) {
  const size = await PDFLib.measureText(text, 'Times New Roman', fontSize);
  let textWidth: number = size.width;
  if (textWidth > 150) {
    textWidth += 20;
  }
  page.drawText(text, {
    x: x - textWidth - 15,
    y: y,
    size: fontSize,
    fontName: 'Times New Roman',
  });
}
async function addTextWeb(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  page: PDFPage,
  pdfDoc?: PDFDocument,
) {
  const font = await pdfDoc.embedFont('Times-Roman');
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  console.log('SIZEEE WEB: ' + JSON.stringify(textWidth));

  page.drawText(text, {
    x: x - textWidth,
    y: y,
    font,
    size: fontSize,
  });
}
async function addDrHeader(
  visitId: string,
  page: PDFPage,
  pageWidth: number,
  pageHeight: number,
  border: number,
  pdfDoc?: PDFDocument,
) {
  const visit: Visit = getCachedItem(visitId);
  //const doctor = getDoctor();
  if (!visit || !visit.userId) {
    return;
  }
  const vStore: Store = getCachedItem(visit.storeId);
  const store: Store = !isEmpty(vStore) ? vStore : getStore();
  const doctor: User = getCachedItem(visit.userId);
  if (!doctor) {
    return;
  }
  const leftBorder: number = pageWidth - 180 - border;
  const boxWidthTopRight: number = 190;
  const top: number = pageHeight - border;

  let y: number = top;
  let x: number = leftBorder + boxWidthTopRight;
  let fontSize: number = 10;

  await addStoreLogo(page, pdfDoc, leftBorder + boxWidthTopRight, y);

  y -= fontSize * 2 + 50;
  const doctorName: string =
    getDoctorFullName(doctor) +
    prefix(doctor.providerType, ' - ') +
    prefix(doctor.license, ' - ');
  await addText(doctorName, x, y, fontSize, page, pdfDoc);

  //page.drawText('Dr FirstName Latname - License Number', {x,y,fontSize});

  y -= fontSize * 2;
  if (!store) {
    return;
  }
  const storeName: string =
    postfix(store.unit, '-') + store.streetNumber + ' ' + store.streetName;
  await addText(storeName, x, y, fontSize, page, pdfDoc);

  y -= fontSize * 1.15;
  const city: string = store.city + prefix(store.pr, ', ');
  await addText(city, x, y, fontSize, page, pdfDoc);

  if (!isEmpty(store.postalCode)) {
    y -= fontSize * 1.15;
    const postalCode: string = store.postalCode;
    await addText(postalCode, x, y, fontSize, page, pdfDoc);
  }

  if (!isEmpty(store.telephone)) {
    y -= 2 * fontSize;
    const telephone: string = prefix(store.telephone, 'T: ');
    await addText(telephone, x, y, fontSize, page, pdfDoc);
  }
  if (!isEmpty(store.fax)) {
    y -= 2 * fontSize;
    const fax: string = prefix(store.fax, 'F: ');
    await addText(fax, x, y, fontSize, page, pdfDoc);
  }
}

function addCurrentDate(page: PDFPage, pageHeight: number, border: number) {
  const fontSize: number = 12;
  page.drawText('Date: ' + formatDate(now(), officialDateFormat), {
    x: border,
    y: pageHeight - 150 - border,
    size: fontSize,
  });
}

function addPatientHeader(
  visitId: string,
  page: PDFPage,
  pageWidth: number,
  pageHeight: number,
  border: number,
) {
  const visit: Visit = getCachedItem(visitId);
  if (!visit) {
    return;
  }
  const patient: PatientInfo = getCachedItem(visit.patientId);
  if (!patient) {
    return;
  }
  const top: number = pageHeight - 170 - border;
  const fontSize: number = 10;
  let column1: number = border;
  let column2: number = pageWidth - border - 300;
  let x: number = column1;
  let y: number = top;
  y -= fontSize * 1.15;
  page.drawText(getPatientFullName(patient), {
    x,
    y,
    size: fontSize + 2,
  });
  y -= (fontSize + 2) * 1.15;
  page.drawText(
    postfix(patient.unit, '-') +
      postfix(patient.streetNumber, ' ') +
      patient.streetName,
    {x, y, size: fontSize},
  );
  x = column2;
  page.drawText(prefix(patient.dateOfBirth, strings.dob + ': '), {
    x,
    y,
    size: fontSize,
  });
  x = column1;
  y -= fontSize * 1.15;
  page.drawText(patient.city + prefix(patient.province, ', '), {
    x,
    y,
    size: fontSize,
  });
  x = column2;
  page.drawText(prefix(patient.medicalCard, strings.healthCard + ': '), {
    x,
    y,
    size: fontSize,
  });
  x = column1;
  y -= fontSize * 1.15;
  page.drawText('' + patient.postalCode, {x, y, size: fontSize});
  x = column2;
  page.drawText(prefix(patient.cell + ' ' + patient.phone, 'T: '), {
    x,
    y,
    size: fontSize,
  });
  y -= fontSize * 2;
  page.drawRectangle({
    x: border - 10,
    y,
    width: pageWidth - 2 * border + 20,
    height: 1,
  });
}

function addMedicalRxLines(
  visitId: string,
  page: PDFPage,
  pageHeight: number,
  border: number,
  labelsArray: string[],
) {
  const medicationExam: Exam = getExam('Prescription', getCachedItem(visitId));
  if (medicationExam === undefined || medicationExam === null) {
    return;
  }
  const prescriptions = medicationExam.Prescription;
  if (prescriptions === undefined || prescriptions === null) {
    return;
  }

  const fontSize: number = 12;
  let x: number = border;
  let y: number = pageHeight - border - 280;
  let dim = {x, y};
  prescriptions.forEach((prescription, i) => {
    let formattedRxLine: string = !isEmpty(prescription.Label)
      ? prescription.Label
      : '';
    if (
      labelsArray.indexOf(strings.all) !== -1 ||
      labelsArray.indexOf(formattedRxLine) !== -1
    ) {
      formattedRxLine += prefix(
        prescription.Strength,
        !isEmpty(formattedRxLine) ? ', ' : '',
      );
      formattedRxLine += prefix(
        prescription.Eye,
        !isEmpty(formattedRxLine) ? ', ' : '',
      );
      formattedRxLine += prefix(
        prescription.Dosage,
        !isEmpty(formattedRxLine) ? ', ' : '',
      );
      if (formattedRxLine) {
        dim.x = x;
        printWrappedLine(formattedRxLine, page, fontSize, dim);
      }

      formattedRxLine = prefix(prescription.Frequency, '       ');
      formattedRxLine += prefix(
        prescription.Duration,
        ', ' + strings.duration + ': ',
      );
      if (formattedRxLine) {
        dim.x = x + 20;
        printWrappedLine(formattedRxLine, page, fontSize, dim);
      }
      formattedRxLine = prefix(prescription.Instructions, '       ');
      formattedRxLine += prefix(
        prescription.Refill,
        !isEmpty(formattedRxLine.trim()) ? ', ' : '',
      );
      formattedRxLine += prefix(
        prescription['Do not substitute'],
        !isEmpty(formattedRxLine.trim()) ? ', ' : '',
      );
      if (formattedRxLine) {
        dim.x = x + 20;
        printWrappedLine(formattedRxLine, page, fontSize, dim);
      }
      const commentLine: string = prescription.Comment;
      if (commentLine) {
        dim.y = dim.y - fontSize * 0.5;
        dim.x = x + 20;
        let lines = commentLine.split('\n');
        lines.forEach((line, j) => {
          printWrappedLine(line, page, fontSize, dim);
        });
      }
      dim.y = dim.y - fontSize;
    }
  });
}

function printWrappedLine(
  sentence: string,
  page: PDFPage,
  fontSize: number,
  dim: {x: number, y: number},
) {
  const wrappedSentence = [];
  wrapString(sentence, wrappedSentence);
  wrappedSentence.forEach((newLine) => {
    page.drawText(newLine.trimStart(), {x: dim.x, y: dim.y, size: fontSize});
    dim.y = dim.y - fontSize * 1.15;
  });
}

function wrapString(sentence: string, splitSentence: []) {
  const maximumCharLength: number = 90;
  if (sentence.length > maximumCharLength) {
    const substr = sentence.substring(0, maximumCharLength);
    const lastSpaceIndex = substr.lastIndexOf(' ');

    if (lastSpaceIndex === -1 || lastSpaceIndex === maximumCharLength - 1) {
      //space does not exist and space is not the last character
      splitSentence.push(substr);
      return wrapString(sentence.substring(maximumCharLength), splitSentence);
    } else if (sentence[maximumCharLength] === ' ') {
      //space exist and next character has space i.e can accommodate the last word
      splitSentence.push(substr);
      return wrapString(sentence.substring(maximumCharLength), splitSentence);
    } else {
      //last word is too long - split and print excluding the last word
      splitSentence.push(substr.substring(0, lastSpaceIndex));
      return wrapString(sentence.substring(lastSpaceIndex + 1), splitSentence);
    }
  } else {
    splitSentence.push(sentence);
    return;
  }
}

async function addSignatureWeb(
  doctor: User,
  page: PDFPage,
  pageWidth: number,
  border: number,
  pdfDoc?: PDFDocument,
) {
  let x: number = border * 3;

  let signature: Upload = getCachedItem(doctor.signatureId);
  if (!signature) {
    signature = await fetchUpload(doctor.signatureId);
    if (!signature) {
      __DEV__ &&
        console.warn('failed to download singature ' + doctor.signatureId);
      return;
    }
  }
  const mimeType: string = getMimeType(signature);
  if (mimeType === 'image/jpeg;base64') {
    let dimension = getJpeg64Dimension(signature.data);
    const image = await pdfDoc.embedJpg(signature.data);
    page.drawImage(image, {
      x,
      y: border,
      width: 150,
      height: (dimension.height / dimension.width) * 150,
    });
  } else if (mimeType === 'image/png;base64') {
    let dimension = getPng64Dimension(signature.data);
    const image = await pdfDoc.embedPng(signature.data);
    page.drawImage(image, {
      x,
      y: border,
      width: 150,
      height: (dimension.height / dimension.width) * 150,
    });
  } else {
    __DEV__ &&
      console.log(
        'Unsupported signature image type:' +
          signature.name +
          ' ' +
          signature.mimeType,
      );
  }
}

async function addSignatureNative(
  doctor: User,
  page: PDFPage,
  pageWidth: number,
  border: number,
) {
  let x: number = border * 3;

  const fullFilename: string =
    RNFS.DocumentDirectoryPath + '/' + doctor.signatureId + '.base64';
  let signature: Upload = getCachedItem(doctor.signatureId);
  if (!signature) {
    signature = await fetchUpload(doctor.signatureId);
    if (!signature) {
      __DEV__ &&
        console.warn('failed to download singature ' + doctor.signatureId);
      return;
    }
    await RNFS.writeFile(fullFilename, signature.data, 'base64');
    __DEV__ && console.log('Created local file ' + fullFilename);
  } else {
    if (!(await RNFS.exists(fullFilename))) {
      await RNFS.writeFile(fullFilename, signature.data, 'base64');
      __DEV__ && console.log('Created local file ' + fullFilename);
    }
  }
  const mimeType: string = getMimeType(signature);
  if (mimeType === 'image/jpeg;base64') {
    let dimension = getJpeg64Dimension(signature.data);
    page.drawImage(fullFilename, 'jpg', {
      x,
      y: border,
      width: 150,
      height: (dimension.height / dimension.width) * 150,
    });
  } else if (mimeType === 'image/png;base64') {
    let dimension = getPng64Dimension(signature.data);
    page.drawImage(fullFilename, 'png', {
      x,
      y: border,
      width: 150,
      height: (dimension.height / dimension.width) * 150,
    });
  } else {
    __DEV__ &&
      console.log(
        'Unsupported signature image type:' +
          signature.name +
          ' ' +
          signature.mimeType,
      );
  }
}
async function addSignature(
  visitId: string,
  page: PDFPage,
  pageWidth: number,
  border: number,
  pdfDoc?: PDFDocument,
) {
  const visit: Visit = getCachedItem(visitId);
  const signedDate: ?string =
    visit.prescription && visit.prescription.signedDate
      ? formatDate(visit.prescription.signedDate, officialDateFormat)
      : undefined;
  const fontSize: number = 10;
  let x: number = border * 3;
  let y: number = border + fontSize * 4;
  page.drawText(strings.drSignature + ':', {x, y, size: fontSize});
  x += 60;
  if (signedDate) {
    let doctor: User = getCachedItem(visit.userId);
    if (!doctor) {
      doctor = await fetchItemById(visit.userId); //TODO: This does not work actually
    }
    if (!doctor) {
      __DEV__ && console.error('Failed to fetch doctor ' + visit.userId);
    } else {
      console.log('Doctor Signature: ' + JSON.stringify(doctor.signatureId));
      if (doctor.signatureId) {
        isWeb
          ? await addSignatureWeb(doctor, page, pageWidth, border, pdfDoc)
          : await addSignatureNative(doctor, page, pageWidth, border);
      }
    }
  }

  x = pageWidth - 170;
  page.drawText(strings.signedDate + ':' + prefix(signedDate, ' '), {
    x,
    y,
    size: fontSize,
  });
}

function addRxFootNote(
  visitId: string,
  page: PDFPage,
  pageHeight: number,
  border: number,
) {
  const fontSize: number = 8;
  const visit: Visit = getCachedItem(visitId);
  if (!visit || !visit.userId) {
    return;
  }
  const vStore: Store = getCachedItem(visit.storeId);
  const store: Store = !isEmpty(vStore) ? vStore : getStore();
  const footNote = store.defaultMedicationRxNote
    ? store.defaultMedicationRxNote
    : '';
  page.drawText(footNote, {
    x: border,
    y: border,
    size: fontSize,
  });
}

export async function printMedicalRx(visitId: string, labelsArray: string[]) {
  const pageWidth: number = 612; //US Letter portrait 8.5 inch * 72 dpi
  const pageAspectRatio: number = 8.5 / 11; //US Letter portrait
  const pageHeight: number = pageWidth / pageAspectRatio;
  const border: number = 40;
  let rxPage: PDFPage;
  let pdfDoc: PDFDocument;
  if (isWeb) {
    pdfDoc = await PDFDocument.create();
    rxPage = pdfDoc.addPage();
    rxPage.setSize(pageWidth, pageHeight);
  } else {
    rxPage = PDFPage.create().setMediaBox(pageWidth, pageHeight);
  }

  await addLogo(rxPage, pageHeight, border, pdfDoc);
  await addDrHeader(visitId, rxPage, pageWidth, pageHeight, border, pdfDoc);
  addCurrentDate(rxPage, pageHeight, border);
  addPatientHeader(visitId, rxPage, pageWidth, pageHeight, border);
  addMedicalRxLines(visitId, rxPage, pageHeight, border, labelsArray);
  await addSignature(visitId, rxPage, pageWidth, border, pdfDoc);
  addRxFootNote(visitId, rxPage, pageHeight, border);
  if (isWeb) {
    const pdfData = await pdfDoc.saveAsBase64();
    const format: string = 'data:application/pdf;base64,';
    const path: string = format.concat(pdfData);
    const htmlContent: string = `<iframe src="${path}" height="100%" width="100%" frameBorder="0"></iframe>`;
    var x = window.open();
    x.document.open();
    x.document.write(htmlContent);
    x.document.close();
  } else {
    const docsDir = await PDFLib.getDocumentsDirectory();
    const pdfPath = `${docsDir}/print.pdf`;
    let filePath = await PDFDocument.create(pdfPath).addPages(rxPage).write();
    await NativeModules.RNPrint.print({filePath: filePath});
  }

  __DEV__ && console.log('printed medical rx for ' + visitId);
}

export async function printBase64Pdf(pdfData: string) {
  if (isWeb) {
    const blob = base64ToBlob(pdfData, 'application/pdf');
    const path = URL.createObjectURL(blob);
    const htmlContent: string = `<iframe src="${path}" height="100%" width="100%" frameBorder="0"></iframe>`;

    var x = window.open();
    x.document.open();
    x.document.write(htmlContent);
    x.document.close();
  } else {
    const docsDir = await PDFLib.getDocumentsDirectory();
    const pdfPath = `${docsDir}/print.pdf`;
    await RNFS.writeFile(pdfPath, pdfData, 'base64');
    const job: any = await NativeModules.RNPrint.print({filePath: pdfPath});
    await RNFS.unlink(pdfPath);
  }
}


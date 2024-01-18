/**
 * @flow
 */
'use strict';

import type {PatientDocument, ImageDrawing, PatientInfo} from './Types';

import React, {Component} from 'react';
import ReactNative, {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  NativeModules,
} from 'react-native';
import mailer from 'react-native-mail';
import {Svg, Path, Polyline, Circle} from 'react-native-svg';
import RNBeep from 'react-native-a-beep';
import {line, curveBasis} from 'd3-shape';
import simplify from 'simplify-js';
import ViewShot from 'react-native-view-shot';
import PDFLib, {PDFDocument, PDFPage} from 'react-native-pdf-lib';
import RNFS from 'react-native-fs';
import {
  styles,
  fontScale,
  imageStyle,
  printWidth,
  isWeb,
  widthPercentageToDP,
} from './Styles';
import {strings} from './Strings';
import {getDoctor} from './DoctorApp';
import {
  formatDate,
  now,
  yearDateFormat,
  jsonDateFormat,
  replaceFileExtension,
  isEmpty,
} from './Util';
import {Camera, PaperClip, Undo, Pencil, Printer, Mail, Garbage} from './Favorites';
import {DocumentScanner} from './DocumentScanner';
import {fetchUpload, getMimeType, getAspectRatio} from './Upload';
import {getCachedItem} from './DataCache';
import {searchPatientDocuments, storePatientDocument} from './Patient';
import {ClearTile, UpdateTile, RefreshTile} from './Widgets';
import {storeUpload} from './Upload';
import {getVisit} from './Exam';
import {PdfViewer} from '../src/components/PdfViewer';
import * as htmlToImage from 'html-to-image';
import {CustomModal as Modal} from './utilities/Modal';

export async function loadDocuments(
  type: string,
  patientId: string,
  showAllDocuments: boolean = false,
): PatientDocument[] {
  if (!type) {
    return [];
  }
  let restResponse: RestResponse = await searchPatientDocuments(
    patientId,
    type,
    showAllDocuments,
  );
  const patientDocuments: PatientDocument[] = restResponse.patientDocumentList;
  return patientDocuments;
}

function isCloseBy(point: {x: number, y: nummber}, line: string) {
  //__DEV__ && console.log('isCloseBy: ('+point.x+','+point.y+') '+line);
  const points = line.split(' ');
  for (let i: number = 0; i < points.length; i++) {
    const splitIndex: number = points[i].indexOf(',');
    const x: number = parseInt(points[i].substring(0, splitIndex), 10);
    const y: number = parseInt(points[i].substring(splitIndex + 1), 10);
    if (Math.abs(x - point.x) < 10 && Math.abs(y - point.y) < 10) {
      return true;
    }
  }
  return false;
}

export async function getBase64Image(image: string) {
  if (image === undefined || image === 'upload') {
    return undefined;
  }
  if (image === './image/perimetry.png') {
    return require('./image/base64/perimetry');
  }
  if (image === './image/champvisuel.png') {
    return require('./image/base64/champvisuel');
  }
  if (image === './image/H.png') {
    return require('./image/base64/H');
  }
  if (image === './image/anteriorOD.png') {
    return require('./image/base64/anteriorOD');
  }
  if (image === './image/anteriorOS.png') {
    return require('./image/base64/anteriorOS');
  }
  if (image === './image/anteriorSegOD.png') {
    return require('./image/base64/anteriorSegOD');
  }
  if (image === './image/anteriorSegOS.png') {
    return require('./image/base64/anteriorSegOS');
  }
  if (image === './image/anteriorOD_faded.png') {
    return require('./image/base64/anteriorOD_faded');
  }
  if (image === './image/anteriorOS_faded.png') {
    return require('./image/base64/anteriorOS_faded');
  }
  if (image === './image/anteriorSegOD_faded.png') {
    return require('./image/base64/anteriorSegOD_faded');
  }
  if (image === './image/anteriorSegOS_faded.png') {
    return require('./image/base64/anteriorSegOS_faded');
  }
  if (image === './image/anteriorSegOD_resized.png') {
    return require('./image/base64/anteriorSegOD_resized');
  }
  if (image === './image/anteriorSegOS_resized.png') {
    return require('./image/base64/anteriorSegOS_resized');
  }
  if (image == './image/posteriorOD.png') {
    return require('./image/base64/posteriorOD');
  }
  if (image === './image/posteriorOS.png') {
    return require('./image/base64/posteriorOS');
  }
  if (image == './image/fundusOD.png') {
    return require('./image/base64/fundusOD');
  }
  if (image === './image/fundusOS.png') {
    return require('./image/base64/fundusOS');
  }
  if (image === './image/retinaOD.png') {
    return require('./image/base64/retinaOD');
  }
  if (image === './image/retinaOS.png') {
    return require('./image/base64/retinaOS');
  }
  if (image === './image/gonioscopyOD.png') {
    return require('./image/base64/gonioscopyOD');
  }
  if (image === './image/gonioscopyOS.png') {
    return require('./image/base64/gonioscopyOS');
  }
  if (image === './image/notations.png') {
    return require('./image/base64/notations');
  }
  if (image === './image/contactlensOD.png') {
    return require('./image/base64/contactlensOD');
  }
  if (image === './image/contactlensOS.png') {
    return require('./image/base64/contactlensOS');
  }
  if (image === './image/amsler.png') {
    return require('./image/base64/amsler');
  }
  if (image === './image/d15.jpg') {
    return require('./image/base64/d15');
  }
  if (image === './image/eyeexamtemplate.png') {
    return require('./image/base64/eyeexamtemplate');
  }
  if (image === './image/ToulchExamFront.jpg') {
    return require('./image/base64/ToulchExamFront');
  }
  if (image === './image/ToulchExamBack.jpg') {
    return require('./image/base64/ToulchExamBack');
  }
  if (image === './image/ToulchMeds.jpg') {
    return require('./image/base64/ToulchMeds');
  }
  if (image.startsWith('http:') || image.startsWith('https:')) {
    const path: string = await loadBase64ImageForWeb(image);
    return {data: path};
  }
  return undefined;
}

export async function loadBase64ImageForWeb(
  image: string,
  filePath?: string,
): Promise<string> {
  if (
    isWeb &&
    (image.startsWith('http:') ||
      image.startsWith('https:') ||
      image.startsWith('blob:'))
  ) {
    try {
      const imageToBase64 = require('./utilities/ImageToBase64');
      const response = await imageToBase64(image);
      let format: string = 'data:image/jpg;base64,';
      if (filePath !== undefined) {
        if (filePath.endsWith('.pdf')) {
          format = 'data:application/pdf;base64,';
        } else if (filePath.endsWith('.png')) {
          format = 'data:image/png;base64,';
        } else {
          format = 'data:image/jpg;base64,';
        }
      } else {
        if (image.endsWith('pdf')) {
          format = 'data:application/pdf;base64,';
        } else if (image.endsWith('jpg')) {
          format = 'data:image/jpg;base64,';
        } else {
          format = 'data:image/png;base64,';
        }
      }

      const path: string = format.concat(response);

      return path;
    } catch (error) {
      __DEV__ && console.log(error);
      return undefined;
    }
  }
  return undefined;
}

export class ImageField extends Component {
  props: {
    value: ImageDrawing,
    label?: string,
    readonly?: boolean,
    style?: any,
    image?: string,
    size?: string,
    resolution: string,
    fileName?: string,
    type?: string,
    sync?: boolean,
    patientId: string,
    examId: string,
    popup?: boolean,
    drawable?: boolean,
    multiValue?: boolean,
    onChangeValue?: (value: ImageDrawing) => void,
    enableScroll?: () => void,
    disableScroll?: () => void,
    replaceImage?: boolean,
    forceSync?: boolean,
  };
  state: {
    isActive: boolean,
    penDown: boolean,
    lines: string[],
    selectedLineIndex: number,
    cameraOn: boolean,
    attachOn: boolean,
    eraseMode: boolean,
    upload: Upload,
    patientDocuments: PatientDocument[],
    pdf?: string,
    imageWebUri?: string,
  };
  lastTap: number;
  static defaultProps = {
    size: 'M',
    popup: true,
    resolution: '600x400',
  };
  scrollTimer;
  screenShotTimer;

  constructor(props: any) {
    super(props);
    this.lastTap = 0;
    this.state = {
      isActive: false,
      penDown: false,
      lines: [],
      selectedLineIndex: -1,
      cameraOn: false,
      attachOn: false,
      eraseMode: false,
      upload:
        this.props.value && this.props.value.image
          ? getCachedItem(this.props.value.image)
          : undefined,
      patientDocuments: undefined,
      pdf: undefined,
      imageWebUri: undefined,
    };
  }

  componentDidMount() {
    this.loadImage();
  }

  componentDidUpdate(prevProps: any) {
    if (
      this.props.examId === prevProps.examId &&
      this.props.fileName === prevProps.fileName
    ) {
      if (
        (this.props.value === undefined && prevProps.value === undefined) ||
        (this.props.value &&
          this.props.value.image === undefined &&
          prevProps.value &&
          prevProps.value.image === undefined) ||
        (this.props.value &&
          this.props.value.image &&
          prevProps.value &&
          prevProps.value.image &&
          prevProps.value.image === this.props.value.image)
      ) {
        //__DEV__ && console.log('ImageField did update with ignorable value change '+this.props.value+' previous: '+prevProps.value);
      } else {
        //__DEV__ && console.log('ImageField did update with new value ' +this.props.value+' previous: '+prevProps.value);
        this.loadImage();
      }
      return;
    }
    //__DEV__ && console.log('ImageField got reused for a different exam or image');
    //__DEV__ && console.log('ImageField in '+this.props.examId+' did update with new data: '+JSON.stringify(prevProps.value)+'->'+JSON.stringify(this.props.value));
    if (this.state.isActive) {
      this.cancelScrollTimer();
      //this.commitEdit(prevProps); TODO
      alert(strings.drawingNotSavedWarning);
    }
    if (this.state.pdf) {
      this.uploadScreenShot();
    }
    this.setState({
      isActive: false,
      penDown: false,
      lines: [],
      selectedLineIndex: -1,
      cameraOn: false,
      attachOn: false,
      upload:
        this.props.value && this.props.value.image
          ? getCachedItem(this.props.value.image)
          : undefined,
      patientDocuments: undefined,
      pdf: undefined,
    });
    this.loadImage();
  }

  componentWillUnmount() {
    //__DEV__ && console.log('Imagefield will unmount');
    this.cancelScrollTimer();
    if (this.state.isActive) {
      this.commitEdit();
    }

    if (this.state.pdf) {
      this.uploadScreenShot();
    }
  }

  async loadImage() {
    await this.loadImageForWeb();
    if (this.props.forceSync) {
      this.scheduleScreenShot();
    }
    this.setState({upload: undefined});
    const imageDrawing: ImageDrawing = this.props.value;
    if (
      !imageDrawing ||
      !imageDrawing.image ||
      !imageDrawing.image.startsWith('upload-')
    ) {
      return;
    }

    let upload: Upload = await fetchUpload(imageDrawing.image);

    // if (this.props.value !== imageDrawing) return;
    this.setState({upload, cameraOn: false, attachOn: false});
  }

  async loadImageForWeb() {
    const image: string =
      this.props.value && this.props.value.image
        ? this.props.value.image
        : this.props.image;
    const path: string = await loadBase64ImageForWeb(image);
    this.setState({imageWebUri: path});
  }

  shouldComponentUpdate(nextProps, nextState): boolean {
    if (nextProps.value != this.props.value) {
      return true;
    }
    if (
      nextProps.value &&
      nextProps.value === this.props.value &&
      nextProps.value.image !== this.props.image
    ) {
      return true;
    }
    if (nextProps.label != this.props.label) {
      return true;
    }
    if (nextProps.readonly != this.props.readonly) {
      return true;
    }
    if (nextProps.style != this.props.style) {
      return true;
    }
    if (nextProps.image != this.props.image) {
      return true;
    }
    if (nextProps.size != this.props.size) {
      return true;
    }
    if (nextProps.resolution != this.props.resolution) {
      return true;
    }
    if (nextProps.popup != this.props.popup) {
      return true;
    }
    if (nextProps.patientId != this.props.patientId) {
      return true;
    }
    if (nextProps.examId != this.props.examId) {
      return true;
    }
    if (nextState.isActive != this.state.isActive) {
      return true;
    }
    if (nextState.penDown != this.state.penDown) {
      return true;
    }
    if (nextState.upload != this.state.upload) {
      return true;
    }
    if (nextState.attachOn != this.state.attachOn) {
      return true;
    }
    if (nextState.patientDocuments != this.state.patientDocuments) {
      return true;
    }
    if (nextState.lines != this.state.lines) {
      return true;
    }
    if (nextState.selectedLineIndex != this.state.selectedLineIndex) {
      return true;
    }
    if (nextState.lines === undefined || this.state.lines === undefined) {
      return true;
    }
    if (nextState.lines.length < 1 || this.state.lines.length < 1) {
      return true;
    }
    if (
      nextState.lines[nextState.lines.length - 1] !==
      this.state.lines[this.state.lines.length - 1]
    ) {
      return true;
    }
    if (nextState.cameraOn != this.state.cameraOn) {
      return true;
    }

    //__DEV__ && console.log('Image field should not update');
    return false;
  }

  startEditing = () => {
    if (this.props.readonly) {
      return;
    }
    //__DEV__ && console.log('Starting edit');
    let lines: string[] =
      this.props.value && this.props.value.lines
        ? this.props.value.lines.slice(0)
        : [this.props.resolution];
    this.setState({isActive: true, lines, selectedLineIndex: -1});
  };

  commitEdit = (): void => {
    //__DEV__ && console.log('Committing image edit');
    if (this.props.popup) {
      this.setState({isActive: false});
    }
    if (!this.props.onChangeValue) {
      return;
    }
    let value = this.props.value;
    if (value === undefined || value === null) {
      value = {};
      if (this.props.image && this.props.image != 'upload') {
        value.image = this.props.image;
      }
    }
    let lines: ?(string[]) = this.state.lines;
    if (lines === undefined || lines === null || lines.length <= 1) {
      lines = undefined;
    }
    value.lines = lines;
    //__DEV__ && console.log('Committing line edit: '+JSON.stringify(value));
    this.props.onChangeValue(value);
  };

  idleTimeout = () => {
    //__DEV__ && console.log('drawing timed out '+this.state.isActive);
    if (this.state.isActive) {
      this.toggleEdit();
    }
  };

  toggleEdit = () => {
    this.lastTap = 0;
    let timer;
    if (!this.props.enableScroll || !this.props.disableScroll) {
      return;
    }
    if (this.state.isActive) {
      this.cancelScrollTimer();
      RNBeep.beep(false);
      this.setState({isActive: false, eraseMode: false});
      this.props.enableScroll();
      this.commitEdit();
    } else {
      RNBeep.beep();
      this.props.disableScroll();
      this.startEditing();
      this.startScrollTimer();
    }
  };

  showCamera = () => {
    this.setState({cameraOn: true, attachOn: false});
  };

  cancelCamera = () => {
    this.setState({cameraOn: false});
  };

  async saveUpload(
    uploadId: string,
    size: ?string,
    type: ?string,
    label: ?string,
  ) {
    const upload: ?Upload =
      uploadId != undefined ? getCachedItem(uploadId) : undefined;
    this.setState({cameraOn: false, attachOn: false, upload});
    if (this.props.type && uploadId) {
      let patientDocument: PatientDocument = {
        id: 'patientDocument',
        patientId: this.props.patientId,
        postedOn: formatDate(now(), jsonDateFormat),
        name: label,
        category: isEmpty(type) ? this.props.type : type,
        uploadId,
      };
      patientDocument = await storePatientDocument(patientDocument);
      if (patientDocument.errors) {
        alert(strings.pmsImageSaveError);
      }
    }
    this.props.onChangeValue({
      image: uploadId,
      size: size,
      type: type,
      label: label,
    });
  }

  async showDocuments() {
    if (!this.props.type) {
      return;
    }
    const type: string =
      this.props.value && this.props.value.type
        ? this.props.value.type
        : this.props.type;
    if (!this.state.documents) {
      await this.loadDocuments(type);
    }
    this.setState({cameraOn: false, attachOn: true});
  }

  hideDocuments = () => {
    if (!this.props.type) {
      return;
    }
    this.setState({cameraOn: false, attachOn: false});
  };

  async loadDocuments(type: string) {
    const patientDocuments: PatientDocument[] = await loadDocuments(
      type,
      this.props.patientId,
    );
    this.setState({patientDocuments});
  }

  renderDocumentTrailPopup() {
    return (
      <TouchableWithoutFeedback onPress={this.hideDocuments}>
        <View style={styles.popupBackground}>
          <Text style={styles.modalTitle}>
            {strings.formatString(strings.documentTrailTitle, this.props.type)}
          </Text>
          <View style={styles.flexColumnLayout}>
            <View style={styles.centeredRowLayout}>
              <View style={styles.modalColumn}>
                {this.state.patientDocuments &&
                  this.state.patientDocuments.map(
                    (patientDocument: PatientDocument, row: number) => {
                      const isSelected: boolean = false;
                      return (
                        <TouchableOpacity
                          key={row}
                          onPress={() =>
                            this.props.onChangeValue({
                              image: patientDocument.uploadId,
                            })
                          }>
                          <View
                            style={
                              isSelected
                                ? styles.popupTileSelected
                                : styles.popupTile
                            }>
                            <Text
                              style={
                                isSelected
                                  ? styles.modalTileLabelSelected
                                  : styles.modalTileLabel
                              }>
                              {patientDocument.name +
                                ' ' +
                                formatDate(
                                  patientDocument.postedOn,
                                  yearDateFormat,
                                )}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    },
                  )}
              </View>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  simplify(line: string): string {
    //__DEV__ && console.log('simplifying '+line);
    let coordinates: string[] = line.split(' ');
    if (coordinates.length <= 1) {
      return line;
    }
    if (coordinates.length < 5) {
      let minX = 0;
      let maxX = 0;
      let minY = 0;
      let maxY = 0;
      for (let i = 0; i < coordinates.length; i++) {
        let splitIndex: number = coordinates[i].indexOf(',');
        const x: number = parseInt(coordinates[i].substring(0, splitIndex), 10);
        const y: number = parseInt(
          coordinates[i].substring(splitIndex + 1),
          10,
        );
        if (i === 0) {
          minX = x;
          maxX = x;
          minY = y;
          maxY = y;
        } else {
          if (x < minX) {
            minX = x;
          } else if (x > maxX) {
            maxX = x;
          }
          if (y < minY) {
            minY = y;
          } else if (y > maxY) {
            maxY = y;
          }
          if (maxY - minY > 5 || maxX - minX > 5) {
            break;
          }
        }
      }
      if (maxY - minY < 5 && maxX - minX < 5) {
        return coordinates[0];
      }
    }
    let points: {x: number, y: number}[] = coordinates.map(
      (coordinate: string) => {
        let splitIndex: number = coordinate.indexOf(',');
        const x: number = parseInt(coordinate.substring(0, splitIndex), 10);
        const y: number = parseInt(coordinate.substring(splitIndex + 1), 10);
        return {x, y};
      },
    );
    let sizeBefore = points.length;
    points = simplify(points, 0.6, true);
    let sizeAfter = points.length;
    coordinates = points.map((point: {x: number, y: number}) => {
      return point.x + ',' + point.y;
    });
    __DEV__ && console.log('reduced ' + sizeBefore + ' -> ' + sizeAfter);
    line = coordinates.join(' ');
    return line;
  }

  cancelEdit = (): void => {
    this.setState({isActive: false, lines: [this.props.resolution]});
  };

  selectLine(selectedLineIndex: number): void {
    this.setState({selectedLineIndex});
  }

  penDown(event, scale) {
    this.cancelScrollTimer();
    this.cancelScreenShot();
    this.updatePosition(event, scale);
  }

  startScrollTimer() {
    this.cancelScrollTimer();
    this.scrollTimer = setTimeout(this.idleTimeout.bind(this), 4000);
  }

  cancelScrollTimer() {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
      this.scrollTimer = undefined;
    }
  }

  async uploadScreenShot() {
    let pdfData: ?string = this.state.pdf;
    if (!pdfData) {
      return;
    }
    if (isWeb) {
      pdfData = pdfData.split(',')[1];
    } else {
      pdfData = await RNFS.readFile(pdfData, 'base64');
    }
    let visitDate: string = getVisit(getCachedItem(this.props.examId)).date;
    let upload: Upload = {
      id: 'upload',
      data: pdfData,
      mimeType: 'application/pdf;base64',
      name: this.props.fileName,
      date: visitDate,
      argument1: this.props.patientId,
      argument2: this.props.examId,
    };
    upload = await storeUpload(upload);
    if (upload.id === 'upload' || upload.id === undefined || upload.errors) {
      alert(
        strings.formatString(strings.pmsImageSaveError, this.props.fileName),
      );
      return;
    }

    if (this.props.type) {
      let patientDocument: PatientDocument = {
        id: 'patientDocument',
        patientId: this.props.patientId,
        postedOn: visitDate,
        name: this.props.fileName,
        category: this.props.type,
        uploadId: upload.id,
      };
      patientDocument = await storePatientDocument(patientDocument);
      if (patientDocument.errors) {
        alert(strings.pmsImageSaveError);
      }
      __DEV__ &&
        console.log('Uploading patient document done for upload: ' + upload.id);
    }
  }

  async takeScreenShot() {
    __DEV__ && console.log('Taking screenshot');
    const pdf: string = await this.generatePdf();
    this.setState({pdf});
  }

  scheduleScreenShot() {
    if (this.screenShotTimer) {
      clearTimeout(this.screenShotTimer);
    }
    this.screenShotTimer = setTimeout(this.takeScreenShot.bind(this), 1500);
  }

  cancelScreenShot() {
    if (this.screenShotTimer) {
      clearTimeout(this.screenShotTimer);
    }
    this.screenShotTimer = undefined;
  }

  liftPen() {
    //__DEV__ && console.log('Pen up');
    if (
      (this.props.popup === false || this.props.image === 'upload') &&
      this.tap() == 2 &&
      this.state.lines.length > 2 &&
      this.state.lines[this.state.lines.length - 1].length < 40 &&
      this.state.lines[this.state.lines.length - 2].length < 40
    ) {
      this.state.lines.splice(this.state.lines.length - 2, 2);
      this.setState({lines: this.state.lines, penDown: false}, () => {
        if (this.props.sync) {
          this.scheduleScreenShot();
        }
        this.commitEdit();
      });
      this.toggleEdit();
      return;
    }
    if (this.state.eraseMode) {
      this.toggleEdit();
      return;
    }
    if (!this.props.popup) {
      this.startScrollTimer();
    }
    const lastLineIndex = this.state.lines.length - 1;
    if (lastLineIndex > 0) {
      let lastLine: string = this.state.lines[lastLineIndex];
      lastLine = this.simplify(lastLine);
      this.state.lines[lastLineIndex] = lastLine;
    }
    if (this.props.popup) {
      this.setState({lines: this.state.lines, penDown: false});
    } else {
      this.setState({lines: this.state.lines, penDown: false}, () => {
        if (this.props.sync) {
          this.scheduleScreenShot();
        }
        this.commitEdit();
      });
    }
  }

  updatePosition(event: any, scale: numbfer): void {
    const x: number = Math.floor(event.nativeEvent.locationX / scale);
    const y: number = Math.floor(event.nativeEvent.locationY / scale);
    if (this.state.eraseMode) {
      let lines = this.state.lines.filter(
        (line, index: number) => index == 0 || !isCloseBy({x, y}, line),
      );
      if (lines.length !== this.state.lines.length) {
        this.setState({lines, selectedIndex: undefined});
      }
      return;
    }
    let lines: string[] = this.state.lines.slice();
    let firstPoint: boolean = false;
    if (!this.state.penDown) {
      lines.push('');
      firstPoint = true;
      //__DEV__ && console.log('Pen down');
    }
    const lineIndex: number = lines.length - 1;
    let line: string = lines[lineIndex];
    const newPoint: string = x + ',' + y;
    if (!firstPoint) {
      if (line.endsWith(newPoint)) {
        return;
      } //ignore double points
      line = line + ' ';
    }
    line = line + newPoint;
    lines[lineIndex] = line;
    if (firstPoint) {
      this.setState({lines, penDown: true, selectedLineIndex: lineIndex});
    } else {
      this.setState({lines});
    }
  }

  clearImage = () => {
    this.cancelScrollTimer();
    if (this.state.isActive) {
      this.setState({isActive: false});
      RNBeep.beep(false);
    }
    if (this.props.enableScroll) {
      this.props.enableScroll();
    }
    if (this.props.onChangeValue) {
      this.props.onChangeValue(undefined);
    }
    if (this.props.sync) {
      this.scheduleScreenShot();
    }
  };

  clear = () => {
    const selectedLineIndex: number = this.state.selectedLineIndex;
    if (selectedLineIndex >= 0) {
      let lines: string[] = this.state.lines.slice();
      lines.splice(selectedLineIndex, 1);
      this.setState({lines, selectedLineIndex: -1});
    } else {
      this.setState({lines: [this.props.resolution], selectedLineIndex: -1});
    }
  };

  undo = () => {
    if (!this.state.isActive) {
      return;
    }
    this.cancelScrollTimer();
    let lines: string[] = this.state.lines.slice();
    if (lines === undefined || lines.length === 1) {
      return;
    }
    lines.splice(lines.length - 1, 1);
    this.setState({lines, selectedLineIndex: -1}, this.commitEdit);
    if (this.props.sync) {
      this.scheduleScreenShot();
    }
    this.startScrollTimer();
  };

  clearLines = () => {
    let lines: string[] = this.state.lines.slice();
    if (lines === undefined || lines.length === 1) {
      return;
    }
    lines = [lines[0]];
    this.setState({lines, selectedLineIndex: -1}, this.commitEdit);
    if (this.props.sync) {
      this.scheduleScreenShot();
    }
  };

  tap = (): number => {
    //__DEV__ && console.log('tap');
    if (new Date().getTime() - this.lastTap < 200) {
      //Double tap
      this.lastTap = undefined;
      return 2;
    }
    this.lastTap = new Date().getTime();
    return 1;
  };

  startErasing = () => {
    this.setState({eraseMode: true}, this.toggleEdit);
  };

  async generatePdf(): string {
    //TODO: configuration for paper size they use, fe A4 or USLetter
    const pageWidth: number = 612; //US Letter portrait 8.5 inch * 72 dpi
    const pageAspectRatio: number = 8.5 / 11; //US Letter portrait
    const pageHeight: number = pageWidth / pageAspectRatio;

    let fileUri;
    if (isWeb) {
      fileUri =
        this.refs && this.refs.viewShotWeb
          ? await htmlToImage.toPng(this.refs.viewShotWeb)
          : undefined;
    } else {
      fileUri =
        this.refs && this.refs.viewShot
          ? await this.refs.viewShot.capture()
          : undefined;
    }

    if (fileUri === undefined) {
      const mimeType: string = getMimeType(this.state.upload);
      const isPdf: boolean = mimeType
        ? mimeType.includes('application/pdf')
        : false;
      if (isPdf) {
        const path = this.requireImage().uri;
        if (isWeb) {
          return (fileUri = path);
        } else {
          const fullFilename: string =
            RNFS.DocumentDirectoryPath + '/' + 'document.pdf';
          const data = path.split(',')[1];
          await RNFS.writeFile(fullFilename, data, 'base64');
          return (fileUri = fullFilename);
        }
      }
    } else {
      const aspectRatio = this.aspectRatio();
      const size: number =
        this.props.value && this.props.value.size
          ? this.props.value.size
          : this.props.size;
      let width = Math.floor(printWidth(size));
      let height = Math.floor(width / aspectRatio);
      if (height > pageHeight) {
        height = Math.floor(pageHeight);
        width = Math.floor(pageHeight * aspectRatio);
      }
      if (width > pageWidth) {
        width = Math.floor(pageWidth);
        height = Math.floor(width / aspectRatio);
      }
      const type: string = fileUri.split(',')[0];
      const isPng: boolean = type === 'data:image/png;base64';
      if (isWeb) {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const image = isPng
          ? await pdfDoc.embedPng(fileUri)
          : await pdfDoc.embedJpg(fileUri);
        page.setSize(pageWidth, pageHeight);
        page.drawImage(image, {
          x: 0,
          y: pageHeight - height,
          width: width,
          height: height,
        });
        const pdfData = await pdfDoc.saveAsBase64();
        const format: string = 'data:application/pdf;base64,';
        return format.concat(pdfData);
      } else {
        //__DEV__ && console.log('imagesize = '+width+'x'+height+' pageSize='+pageWidth+'x'+pageHeight);
        const page1 = PDFPage.create()
          .setMediaBox(pageWidth, pageHeight)
          .drawImage(fileUri, isPng ? 'png' : 'jpg', {
            x: 0,
            y: pageHeight - height,
            width: width,
            height: height,
          });
        const docsDir = await PDFLib.getDocumentsDirectory();
        const fileName =
          'print' + (this.props.fileName ? this.props.fileName : '') + '.pdf';
        const pdfPath = `${docsDir}/${fileName}`;
        let path = await PDFDocument.create(pdfPath).addPages(page1).write();
        //__DEV__ && console.log('PDF = '+path);
        return path;
      }
    }
  }

  async print() {
    const path: string = await this.generatePdf();
    if (isWeb) {
      const htmlContent: string = `<iframe src="${path}" height="100%" width="100%" frameBorder="0"></iframe>`;
      var x = window.open();
      x.document.open();
      x.document.write(htmlContent);
      x.document.close();
    } else {
      await NativeModules.RNPrint.print({filePath: path});
    }
  }

  async email() {
    const path: string = await this.generatePdf();
    console.log('Path: ' + JSON.stringify(path));
    const patient: PatientInfo = getCachedItem(this.props.patientId);
    const doctorName: string =
      getDoctor().firstName + ' ' + getDoctor().lastName;
    const documentName: string = this.props.fileName
      ? this.props.fileName
      : this.props.type
      ? this.props.type
      : strings.document;
    const body: string = strings.formatString(
      strings.scanEmailBody,
      documentName.toLowerCase(),
      patient ? patient.firstName + ' ' + patient.lastName : '',
      doctorName,
    );
    const fileName: string = replaceFileExtension(documentName, 'pdf');
    mailer.mail(
      {
        recipients: patient ? [patient.email] : undefined,
        subject: strings.formatString(
          strings.scanEmailTitle,
          patient ? patient.firstName + ' ' + patient.lastName : '',
        ),
        body,
        isHTML: true,
        attachments: [
          {
            path: path,
            type: 'pdf',
            name: fileName,
          },
        ],
      },
      (error, event) => {
        error && console.log('Error opening email app:', error);
        if (error === 'not_available') {
          alert(strings.emailAppUnavailableError);
        }
      },
    );
  }

  isPdf(image: any) {
    let isPdf: boolean = false;
    try {
      const mimeType = image
        ? image.uri
          ? image.uri.split(',')[0]
          : image.split(',')[0]
        : undefined;
      isPdf = mimeType ? mimeType.includes('application/pdf') : false;
    } catch (e) {
      isPdf = false;
    }
    return isPdf;
  }

  requireImage() {
    if (this.state.upload) {
      return {
        uri: `data:${getMimeType(this.state.upload)},${this.state.upload.data}`,
      };
    }

    const image: string =
      this.props.value && this.props.value.image
        ? this.props.value.image
        : this.props.image;

    if (image === undefined || image === 'upload') {
      return undefined;
    }
    if (image === './image/perimetry.png') {
      return require('./image/perimetry.png');
    }
    if (image === './image/champvisuel.png') {
      return require('./image/champvisuel.png');
    }
    if (image === './image/H.png') {
      return require('./image/H.png');
    }
    if (image === './image/anteriorOD.png') {
      return require('./image/anteriorOD.png');
    }
    if (image === './image/anteriorOS.png') {
      return require('./image/anteriorOS.png');
    }
    if (image === './image/anteriorSegOD.png') {
      return require('./image/anteriorSegOD.png');
    }
    if (image === './image/anteriorSegOS.png') {
      return require('./image/anteriorSegOS.png');
    }
    if (image === './image/anteriorOD_faded.png') {
      return require('./image/anteriorOD_faded.png');
    }
    if (image === './image/anteriorOS_faded.png') {
      return require('./image/anteriorOS_faded.png');
    }
    if (image === './image/anteriorSegOD_faded.png') {
      return require('./image/anteriorSegOD_faded.png');
    }
    if (image === './image/anteriorSegOS_faded.png') {
      return require('./image/anteriorSegOS_faded.png');
    }
    if (image === './image/anteriorSegOD_resized.png') {
      return require('./image/anteriorSegOD_resized.png');
    }
    if (image === './image/anteriorSegOS_resized.png') {
      return require('./image/anteriorSegOS_resized.png');
    }
    if (image == './image/posteriorOD.png') {
      return require('./image/posteriorOD.png');
    }
    if (image === './image/posteriorOS.png') {
      return require('./image/posteriorOS.png');
    }
    if (image == './image/fundusOD.png') {
      return require('./image/fundusOD.png');
    }
    if (image === './image/fundusOS.png') {
      return require('./image/fundusOS.png');
    }
    if (image === './image/retinaOD.png') {
      return require('./image/retinaOD.png');
    }
    if (image === './image/retinaOS.png') {
      return require('./image/retinaOS.png');
    }
    if (image === './image/gonioscopyOD.png') {
      return require('./image/gonioscopyOD.png');
    }
    if (image === './image/gonioscopyOS.png') {
      return require('./image/gonioscopyOS.png');
    }
    if (image === './image/notations.png') {
      return require('./image/notations.png');
    }
    if (image === './image/contactlensOD.png') {
      return require('./image/contactlensOD.png');
    }
    if (image === './image/contactlensOS.png') {
      return require('./image/contactlensOS.png');
    }
    if (image === './image/amsler.png') {
      return require('./image/amsler.png');
    }
    if (image === './image/d15.jpg') {
      return require('./image/d15.jpg');
    }
    if (image === './image/eyeexamtemplate.png') {
      return require('./image/eyeexamtemplate.png');
    }
    if (!image.startsWith('http:') && !image.startsWith('https:')) {
      const imageValue = !image.startsWith('data:image/png;base64,')
        ? 'data:image/png;base64,' + image
        : image;
      return {uri: imageValue, cache: 'force-cache'};
    }
    if (isWeb && (image.startsWith('http:') || image.startsWith('https:'))) {
      const path: string = this.state.imageWebUri;
      if (path === undefined || path === null || path === '') {
        return {uri: image, cache: 'force-cache'};
      } else {
        return {uri: path, cache: 'force-cache'};
      }
    }
    return {uri: image, cache: 'force-cache'};
  }

  resolution(): number[] {
    let resolutionText: ?string =
      this.props.value != undefined &&
      this.props.value.lines != undefined &&
      this.props.value.lines.length > 0
        ? this.props.value.lines[0]
        : undefined;
    if (resolutionText == undefined) {
      resolutionText = this.props.resolution;
    }
    const resolution: string[] = resolutionText.split('x');
    if (resolution.length != 2) {
      console.warn('Image resolution is corrupt: ' + resolutionText);
      return [640, 480];
    }
    const width: number = Number.parseInt(resolution[0]);
    const height: number = Number.parseInt(resolution[1]);
    return [width, height];
  }

  aspectRatio(): number {
    if (this.state.upload) {
      return getAspectRatio(this.state.upload);
    }
    const resolution: number[] = this.resolution();
    const aspectRatio: number = resolution[0] / resolution[1];
    return aspectRatio;
  }

  renderGraph(
    lines: string[],
    style: {width: number, height: number},
    scale: number,
  ) {
    if (!lines || lines.length === 0) {
      return null;
    }
    const strokeWidth: number = (3 * fontScale) / scale;
    return (
      <Svg
        style={{position: 'absolute'}}
        width={style.width}
        height={style.height}>
        {lines.map((lijn: string, index: number) => {
          if (lijn.indexOf('x') > 0) {
            return null;
          }
          if (lijn.indexOf(' ') > 0) {
            const points = lijn.split(' ');
            //console.log('line='+lijn);
            return (
              <Path
                d={line()
                  .x((point: string) => point.substring(0, point.indexOf(',')))
                  .y((point: string) => point.substring(point.indexOf(',') + 1))
                  .curve(curveBasis)(points)}
                scale={scale}
                key={'L' + index}
                fill="none"
                stroke={'black'}
                strokeWidth={strokeWidth}
              />
            );
          }
          let commaIndex: number = lijn.indexOf(',');
          let x: string = lijn.substring(0, commaIndex);
          let y: string = lijn.substring(commaIndex + 1);
          return (
            <Circle
              cx={x}
              cy={y}
              r={strokeWidth}
              scale={scale}
              fill={'black'}
              key={'C' + index}
            />
          );
        })}
      </Svg>
    );
  }

  renderChoppyGraph(
    lines: string[],
    style: {width: number, height: number},
    scale: number,
  ) {
    if (!lines) {
      return null;
    }
    const strokeWidth: number = 3 * fontScale;
    return (
      <Svg
        style={{position: 'absolute'}}
        width={style.width}
        height={style.height}>
        {lines.map((line: string, index: number) => {
          if (line.indexOf('x') > 0) {
            return;
          }
          if (line.indexOf(' ') > 0) {
            return (
              <Polyline
                points={line}
                fill="none"
                stroke="black"
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                scale={scale}
                key={'L' + index}
              />
            );
          }
          let commaIndex = line.indexOf(',');
          let x: string = line.substring(0, commaIndex);
          let y: string = line.substring(commaIndex + 1);
          return (
            <Circle
              cx={x}
              cy={y}
              r={strokeWidth}
              fill="black"
              scale={scale}
              key={'C' + index}
            />
          );
        })}
      </Svg>
    );
  }

  renderPopup() {
    if (
      this.props.popup === true &&
      this.props.image === 'upload' &&
      this.props.drawable === false
    ) {
      const width: number = widthPercentageToDP('60%');
      const pageAspectRatio: number = 8.5 / 11;
      const height: number = width / pageAspectRatio;
      const style = {
        width,
        height,
        resizeMode: 'contain',
      };
      const scale: number = style.width / this.resolution()[0];
      return (
        <TouchableWithoutFeedback onPress={this.commitEdit}>
          <View style={styles.popupBackground}>
            <ScrollView scrollEnabled={true}>
              <Text style={styles.modalTitle}>{this.props.label}</Text>
              <View>
                <View
                  style={[styles.centeredColumnLayout, {alignItems: 'center'}]}>
                  <View style={styles.centeredRowLayout}>
                    <TouchableOpacity onPress={() => this.print()}>
                      <View style={styles.popupTile}>
                        <Printer
                          style={styles.drawIcon}
                          disabled={this.state.isActive}
                        />
                      </View>
                    </TouchableOpacity>
                  </View>
                  <View
                    style={styles.solidWhite}
                    onStartShouldSetResponder={(event) => true}
                    onResponderReject={(event) =>
                      this.setState({isActive: false})
                    }
                    onMoveShouldSetResponder={(event) => true}
                    onResponderTerminationRequest={(event) => false}
                    onResponderTerminate={(event) => this.cancelEdit()}>
                    <PdfViewer style={style} source={this.requireImage().uri} />
                    {this.renderGraph(this.state.lines, style, scale)}
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      );
    } else {
      const style: {width: number, height: number} = imageStyle(
        'XL',
        this.aspectRatio(),
      );

      return (
        <TouchableWithoutFeedback onPress={isWeb ? () => {} : this.commitEdit}>
          <View style={styles.popupBackground}>
            <Text style={styles.modalTitle}>{this.props.label}</Text>
            <View>
              <View
                style={[styles.centeredColumnLayout, {alignItems: 'center'}]}>
                <View style={styles.centeredRowLayout}>
                  <ClearTile commitEdit={this.clear} />
                  <UpdateTile commitEdit={this.commitEdit} />
                  <RefreshTile commitEdit={this.cancelEdit} />
                </View>
                {this.renderDrawableView()}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      );
    }
  }

  renderDrawableView() {
    const style: {width: number, height: number} = imageStyle(
      'XL',
      this.aspectRatio(),
    );
    const scale: number = style.width / this.resolution()[0];
    return (
      <View
        style={styles.solidWhite}
        onStartShouldSetResponder={(event) => true}
        onResponderGrant={(event) => this.penDown(event, scale)}
        onResponderReject={(event) =>
          isWeb ? {} : this.setState({isActive: false})
        }
        onMoveShouldSetResponder={(event) => true}
        onResponderTerminationRequest={(event) => false}
        onResponderMove={(event) => this.updatePosition(event, scale)}
        onResponderRelease={(event) => this.liftPen()}
        onResponderTerminate={(event) => {
          if (isWeb) {
            throw new Error('onResponderTerminate'); //this makes it trigger the proper responder i.e. onResponderRelease or onResponderMove
          } else {
            this.cancelEdit();
          }
        }}>
        <Image source={this.requireImage()} style={style} />
        {this.renderGraph(this.state.lines, style, scale)}
      </View>
    );
  }

  renderIcons() {
    if (
      this.props.image === 'upload' &&
      (!this.props.value || !this.props.value.image)
    ) {
      if (this.props.readonly) {
        return null;
      }
      return (
        <View style={styles.flowLeft} key={'fieldIcons'}>
          {!isWeb && (
            <TouchableOpacity onPress={this.showCamera}>
              <Camera style={styles.screenIcon} />
            </TouchableOpacity>
          )}
          {this.props.type && (
            <TouchableOpacity onPress={() => this.showDocuments()}>
              <PaperClip style={styles.screenIcon} />
            </TouchableOpacity>
          )}
        </View>
      );
    }
    if (this.props.popup === false || this.props.image === 'upload') {
      return (
        <View style={styles.drawingIcons} key={'drawingIcons'}>
          <TouchableOpacity onPress={() => this.print()}>
            <Printer style={styles.drawIcon} disabled={this.state.isActive} />
          </TouchableOpacity>
          <TouchableOpacity
              onPress={() => this.clearImage()}>
              <Garbage style={styles.groupIcon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => this.email()}>
            <Mail style={styles.drawIcon} disabled={this.state.isActive} />
          </TouchableOpacity>
          {!this.props.readonly && this.props.drawable && (
            <TouchableOpacity onPress={this.toggleEdit}>
              <Pencil style={styles.drawIcon} disabled={this.state.isActive} />
            </TouchableOpacity>
          )}
          {this.props.multiValue && this.props.drawable === false && !isWeb && (
            <TouchableOpacity onPress={this.showCamera}>
              <Camera style={styles.drawIcon} />
            </TouchableOpacity>
          )}
          {this.props.multiValue && this.props.drawable === false && isWeb && (
            <TouchableOpacity onPress={() => this.showDocuments()}>
              <PaperClip style={styles.drawIcon} />
            </TouchableOpacity>
          )}
          {!this.props.readonly && this.state.isActive && (
            <TouchableOpacity onPress={this.undo}>
              <Undo style={styles.drawIcon} />
            </TouchableOpacity>
          )}
        </View>
      );
    }
  }

  renderViewShotChildren(
    image: any,
    isPdf: boolean,
    scale: number,
    style: {width: number, height: number},
  ) {
    return (
      <View
        style={styles.solidWhite}
        onStartShouldSetResponder={(event) => this.state.isActive}
        onResponderGrant={(event) => {
          this.penDown(event, scale);
        }}
        onResponderReject={(event) => this.setState({isActive: false})} //TODO: toggleEdit in stead?
        onMoveShouldSetResponder={(event) => false}
        onResponderTerminationRequest={(event) => false}
        onResponderMove={(event) => this.updatePosition(event, scale)}
        onResponderRelease={(event) => this.liftPen()}
        onResponderTerminate={(event) => this.liftPen()}>
        {image !== undefined && (
          <TouchableWithoutFeedback
            onLongPress={this.startErasing}
            onPressOut={() => {
              if (this.tap() === 2 && !this.props.readonly === true) {
                this.toggleEdit();
              }
            }}
            disabled={this.state.isActive}>
            <View>
              {image && isPdf && (
                <PdfViewer style={style} source={image.uri} isPreview={false} />
              )}
              {image && !isPdf && <Image source={image} style={style} />}
              {this.renderGraph(
                this.state.isActive
                  ? this.state.lines
                  : this.props.value && this.props.value.lines
                  ? this.props.value.lines
                  : undefined,
                style,
                scale,
              )}
            </View>
          </TouchableWithoutFeedback>
        )}
      </View>
    );
  }

  render() {
    const size: number =
      this.props.value && this.props.value.size
        ? this.props.value.size
        : this.props.size;
    let style: {width: number, height: number} = imageStyle(
      size,
      this.aspectRatio(),
    );

    const scale: number = style.width / this.resolution()[0];
    const image = this.requireImage();
    const isPdf: boolean = this.isPdf(image);

    if (
      this.props.popup === true &&
      this.props.image === 'upload' &&
      this.props.drawable === false
    ) {
      style = imageStyle('S', this.aspectRatio());
      return (
        <View style={styles.fieldContainer}>
          <View>
            <TouchableOpacity
              style={styles.fieldContainer}
              onPress={this.startEditing}
              disabled={this.props.readonly}>
              <View>
                {image && isPdf && (
                  <PdfViewer
                    style={style}
                    source={image.uri}
                    isPreview={true}
                  />
                )}
                {image && !isPdf && <Image source={image} style={style} />}
                {this.props.value &&
                  this.renderGraph(this.props.value.lines, style, scale)}
              </View>
            </TouchableOpacity>
            {this.renderIcons()}
            {this.state.isActive && (
              <Modal
                visible={this.state.isActive}
                transparent={true}
                animationType={'fade'}
                onRequestClose={this.cancelEdit}>
                {this.renderPopup()}
              </Modal>
            )}
            {this.state.cameraOn && (
              <Modal
                visible={this.state.cameraOn}
                transparant={false}
                animationType={'slide'}>
                <DocumentScanner
                  uploadId={
                    this.props.value && this.props.value.image
                      ? this.props.value.image
                      : undefined
                  }
                  size={this.props.size}
                  fileName={
                    this.props.value && this.props.value.label
                      ? this.props.value.label
                      : this.props.fileName
                  }
                  onCancel={this.cancelCamera}
                  onSave={(
                    uploadId: string,
                    size: ?string,
                    type: ?string,
                    label: ?string,
                  ) => this.saveUpload(uploadId, size, type, label)}
                  patientId={this.props.patientId}
                  examId={this.props.examId}
                  replaceImage={this.props.replaceImage}
                  type={
                    this.props.value && this.props.value.type
                      ? this.props.value.type
                      : this.props.type
                  }
                  isPdf={true}
                  isAttachment={false}
                />
              </Modal>
            )}
            {this.state.attachOn && (
              <Modal
                visible={this.state.attachOn}
                transparant={false}
                animationType={'slide'}>
                <DocumentScanner
                  uploadId={
                    this.props.value && this.props.value.image
                      ? this.props.value.image
                      : undefined
                  }
                  size={this.props.size}
                  fileName={
                    this.props.value && this.props.value.label
                      ? this.props.value.label
                      : this.props.fileName
                  }
                  onCancel={this.hideDocuments}
                  onSave={(
                    uploadId: string,
                    size: ?string,
                    type: ?string,
                    label: ?string,
                  ) => this.saveUpload(uploadId, size, type, label)}
                  patientId={this.props.patientId}
                  examId={this.props.examId}
                  replaceImage={this.props.replaceImage}
                  type={
                    this.props.value && this.props.value.type
                      ? this.props.value.type
                      : this.props.type
                  }
                  isPdf={true}
                  patientDocuments={this.state.patientDocuments}
                  isAttachment={true}
                />
              </Modal>
            )}
          </View>
          {this.props.children}
        </View>
      );
    } else if (this.props.popup === false || this.props.image === 'upload') {
      return (
        <View style={[styles.centeredColumnLayout, {alignItems: 'center'}]}>
          {image !== undefined && !isWeb && (
            <ViewShot ref="viewShot" options={{format: 'jpg', quality: 0.9}}>
              {this.renderViewShotChildren(image, isPdf, scale, style)}
              {this.props.children}
            </ViewShot>
          )}
          {image !== undefined && isWeb && (
            <View ref="viewShotWeb">
              {this.renderViewShotChildren(image, isPdf, scale, style)}
              {this.props.children}
            </View>
          )}
          {this.renderIcons()}
          {this.state.cameraOn && (
            <Modal
              visible={this.state.cameraOn}
              transparant={false}
              animationType={'slide'}>
              <DocumentScanner
                uploadId={
                  this.props.value && this.props.value.image
                    ? this.props.value.image
                    : undefined
                }
                size={this.props.size}
                fileName={
                  this.props.value && this.props.value.label
                    ? this.props.value.label
                    : this.props.fileName
                }
                onCancel={this.cancelCamera}
                onSave={(
                  uploadId: string,
                  size: ?string,
                  type: ?string,
                  label: ?string,
                ) => this.saveUpload(uploadId, size, type, label)}
                patientId={this.props.patientId}
                examId={this.props.examId}
                replaceImage={this.props.replaceImage}
                type={
                  this.props.value && this.props.value.type
                    ? this.props.value.type
                    : this.props.type
                }
                isPdf={false}
              />
            </Modal>
          )}
          {this.state.attachOn && (
            <Modal
              visible={this.state.attachOn}
              transparant={false}
              animationType={'slide'}>
              <DocumentScanner
                uploadId={
                  this.props.value && this.props.value.image
                    ? this.props.value.image
                    : undefined
                }
                size={this.props.size}
                fileName={
                  this.props.value && this.props.value.label
                    ? this.props.value.label
                    : this.props.fileName
                }
                onCancel={this.hideDocuments}
                onSave={(
                  uploadId: string,
                  size: ?string,
                  type: ?string,
                  label: ?string,
                ) => this.saveUpload(uploadId, size, type, label)}
                patientId={this.props.patientId}
                examId={this.props.examId}
                replaceImage={this.props.replaceImage}
                type={
                  this.props.value && this.props.value.type
                    ? this.props.value.type
                    : this.props.type
                }
                isPdf={false}
                patientDocuments={this.state.patientDocuments}
                isAttachment={true}
              />
            </Modal>
          )}
        </View>
      );
    }
    return (
      <View style={styles.fieldContainer}>
        <View>
          <TouchableOpacity
            style={styles.fieldContainer}
            onPress={this.startEditing}
            disabled={this.props.readonly}>
            <View>
              {image && isPdf && (
                <PdfViewer style={style} source={image.uri} isPreview={false} />
              )}
              {image && !isPdf && <Image source={image} style={style} />}
              {this.props.value &&
                this.renderGraph(this.props.value.lines, style, scale)}
            </View>
          </TouchableOpacity>
          {this.renderIcons()}
          {this.state.isActive && (
            <Modal
              visible={this.state.isActive}
              transparent={true}
              animationType={'fade'}
              onRequestClose={this.cancelEdit}>
              {this.renderPopup()}
            </Modal>
          )}
          {this.state.cameraOn && (
            <Modal
              visible={this.state.cameraOn}
              transparant={false}
              animationType={'slide'}>
              <DocumentScanner
                uploadId={
                  this.props.value && this.props.value.image
                    ? this.props.value.image
                    : undefined
                }
                size={this.props.size}
                fileName={
                  this.props.value && this.props.value.label
                    ? this.props.value.label
                    : this.props.fileName
                }
                onCancel={this.cancelCamera}
                onSave={(
                  uploadId: string,
                  size: ?string,
                  type: ?string,
                  label: ?string,
                ) => this.saveUpload(uploadId, size, type, label)}
                patientId={this.props.patientId}
                examId={this.props.examId}
                replaceImage={this.props.replaceImage}
                type={
                  this.props.value && this.props.value.type
                    ? this.props.value.type
                    : this.props.type
                }
                isPdf={false}
              />
            </Modal>
          )}
          {this.state.attachOn && (
            <Modal
              visible={this.state.attachOn}
              transparant={false}
              animationType={'slide'}>
              <DocumentScanner
                uploadId={
                  this.props.value && this.props.value.image
                    ? this.props.value.image
                    : undefined
                }
                size={this.props.size}
                fileName={
                  this.props.value && this.props.value.label
                    ? this.props.value.label
                    : this.props.fileName
                }
                onCancel={this.hideDocuments}
                onSave={(
                  uploadId: string,
                  size: ?string,
                  type: ?string,
                  label: ?string,
                ) => this.saveUpload(uploadId, size, type, label)}
                patientId={this.props.patientId}
                examId={this.props.examId}
                replaceImage={this.props.replaceImage}
                type={
                  this.props.value && this.props.value.type
                    ? this.props.value.type
                    : this.props.type
                }
                isPdf={false}
                patientDocuments={this.state.patientDocuments}
                isAttachment={true}
              />
            </Modal>
          )}
        </View>
        {this.props.children}
      </View>
    );
  }
}

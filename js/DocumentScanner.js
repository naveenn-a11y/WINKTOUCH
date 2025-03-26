/**
 * @flow
 */

'use strict';

import { PDFDocument, PDFPage } from 'pdf-lib';
import { Component } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import RNFS from 'react-native-fs';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import NativeScanner from '../src/components/DocumentScanner';
import { resizeFile } from '../src/components/FileResizer';
import { PdfViewer } from '../src/components/PdfViewer';
import { getAllCodes } from './Codes';
import { getCachedItem } from './DataCache';
import { loadDocuments } from './ImageField';
import { strings } from './Strings';
import {
  fontScale,
  imageWidth,
  isWeb,
  printWidth,
  styles
} from './Styles';
import type { CodeDefinition, Dimension, PatientDocument, Upload } from './Types';
import {
  fetchUpload,
  getJpeg64Dimension,
  getMimeType,
  getPng64Dimension,
  storeUpload,
} from './Upload';
import { formatDate, isEmpty, yearDateFormat } from './Util';
import {
  CameraTile,
  ClearTile,
  CloseTile,
  Label,
  RefreshTile,
  SizeTile,
  UpdateTile,
} from './Widgets';

export class DocumentScanner extends Component {
  props: {
    uploadId: string,
    fileName: string,
    category?: ?string,
    patientId: string,
    examId: string,
    onSave: (uploadId: string, size: ?string) => void,
    onCancel: () => void,
    size: string,
    replaceImage?: boolean,
    type?: string,
    isPdf?: boolean,
    patientDocuments?: PatientDocument[],
    isAttachment?: boolean,
  };
  state: {
    file: ?string,
    scaledFile: ?string,
    saving: boolean,
    isDirty: boolean,
    sizeSSelected: boolean,
    sizeMSelected: boolean,
    sizeLSelected: boolean,
    documentCategory: CodeDefinition,
    upload: ?Upload,
    patientDocuments?: PatientDocument[],
    patientDocument?: PatientDocument,
    name?: string,
  };

  static defaultProps = {
    size: 'L',
  };

  constructor(props) {
    super(props);

    const documentCategories: CodeDefinition[] =
      getAllCodes('documentCategories');
    const documentCategory: CodeDefinition = documentCategories.find(
      (dc: CodeDefinition) =>
        (dc.description ? dc.description : dc.code) === this.props.type,
    );
    this.state = {
      file: undefined,
      saving: false,
      isDirty: false,
      sizeSSelected: false,
      sizeMSelected: true,
      sizeLSelected: false,
      scaledFile: undefined,
      documentCategory: documentCategory,
      upload: undefined,
      patientDocuments: this.props.patientDocuments,
      patientDocument: undefined,
      name: this.props.fileName,
    };
  }

  async setImageFromUpload(patientDocument: PatientDocument) {
    let upload: ?Upload = getCachedItem(patientDocument.uploadId);
    if (upload === undefined) {
      upload = await fetchUpload(patientDocument.uploadId);
    }
    const data: string = upload ? upload.data : undefined;
    const mimeType: string = getMimeType(upload);
    if (mimeType && !mimeType.includes('application/pdf')) {
      this.resizeImage(data, this.getSelectedSize(), mimeType);
    }
    const fullPath: string = `${mimeType},${data}`;
    this.setState({
      file: fullPath,
      scaledFile: data,
      upload: upload,
      isDirty: true,
      patientDocument: patientDocument,
    });
  }

  async drawImage(
    pdfDoc: PDFDocument,
    pageWidth: number,
    pageHeight: number,
  ): PDFDocument {
    const documentPage: PDFPage = pdfDoc.addPage();
    documentPage.setSize(pageWidth, pageHeight);
    const dimensionAfter = getJpeg64Dimension(this.state.scaledFile);
    const image = await pdfDoc.embedJpg(this.state.scaledFile);
    const size: string = this.getSelectedSize();
    const addY: number = size === 'XL' ? 0 : 10;

    const width = Math.floor(printWidth(size));
    const aspectRatio: number = dimensionAfter.width / dimensionAfter.height;
    const height = Math.floor(width / aspectRatio);

    // Adding a margin of 36
    const margin = 36;
    const xOffset = (pageWidth - width) / 2; // This is to center the image

    documentPage.drawImage(image, {
      x: xOffset,
      y: pageHeight - height - addY - margin,
      width: width,
      height: height,
    });
    return pdfDoc;
  }

  async drawPdf(
    pdfDoc: PDFDocument,
    pageWidth: number,
    pageHeight: number,
  ): PDFDocument {
    const newPdf = await PDFDocument.load(this.state.scaledFile);
    for (const page: PDFPage of newPdf.getPages()) {
      const documentPage: PDFPage = pdfDoc.addPage();
      const {width, height} = page.getSize();
      pageWidth = pageWidth > width ? pageWidth : width;
      pageHeight = pageHeight > height ? pageHeight : height;
      documentPage.setSize(pageWidth, pageHeight);
      const embedPage = await pdfDoc.embedPage(page);
      const dims = embedPage.scale(1);
      documentPage.drawPage(embedPage, {
        ...dims,
        x: 0,
        y: pageHeight - dims.height,
      });
    }
    return pdfDoc;
  }
  isPdf(upload?: Upload) { 
    let mimeType: string = upload ? getMimeType(upload) : undefined;
    let isPdf: boolean = false;
    if (mimeType === undefined) {
      mimeType = this.state.file ? this.state.file.split(',')[0] : undefined;
    }
    isPdf = mimeType ? mimeType.includes('application/pdf') : false;
    return isPdf;
  }
  async addPage(pageWidth: number, pageHeight: number) {
    let pdfDoc: PDFDocument;
    const upload: ?Upload = getCachedItem(this.props.uploadId);
    const isExistingPdf: boolean = this.isPdf(upload);
    pdfDoc =
      upload && isExistingPdf
        ? await PDFDocument.load(upload.data)
        : await PDFDocument.create();

    const isNewPdfUpload: boolean = this.isPdf(
      this.state.patientDocument ? this.state.upload : undefined,
    );
    if (isNewPdfUpload) {
      pdfDoc = await this.drawPdf(pdfDoc, pageWidth, pageHeight);
    } else {
      pdfDoc = await this.drawImage(pdfDoc, pageWidth, pageHeight);
    }

    const path: string = await pdfDoc.saveAsBase64();
    return path;
  }
  async createDocument(): string {
    const pageWidth: number = 612;
    const pageAspectRatio: number = 8.5 / 11;
    const pageHeight: number = pageWidth / pageAspectRatio;
    const path: string = await this.addPage(pageWidth, pageHeight);
    return path;
  }

  async saveDocument(): Upload {
    if (!this.state.file) {
      return;
    }
    this.setState({saving: true});
    let upload: Upload;
    const parentUpload: ?Upload = getCachedItem(this.props.uploadId);
    //check if current upload arg1 and arg2 are the same as current arg1 & arg2
    let uploadId: string = parentUpload
      ? parentUpload.argument1 === this.props.patientId &&
        parentUpload.argument2 === this.props.examId
        ? this.props.uploadId
        : 'upload'
      : 'upload';
    if (parentUpload === undefined) {
      uploadId = this.state.upload
        ? this.state.upload.argument1 === this.props.patientId &&
          this.state.upload.argument2 === this.props.examId
          ? this.state.upload.id
          : 'upload'
        : 'upload';
    }

    const pdfData: string = this.props.isPdf
      ? await this.createDocument()
      : this.state.scaledFile;
    const isCurrentFilePdf: boolean = this.isPdf();
    upload = {
      id: uploadId,
      data: pdfData,
      mimeType:
        isCurrentFilePdf || this.props.isPdf
          ? 'application/pdf'
          : 'image/jpeg;base64',
      name: this.props.fileName,
      argument1: this.props.patientId,
      argument2: this.props.examId,
      replace: this.props.replaceImage,
    };

    upload = await storeUpload(upload);
    if (upload.errors) {
      alert(
        strings.formatString(strings.pmsImageSaveError, this.props.fileName),
      );
      this.setState({
        saving: false,
      });
      return upload;
    }

    // check if the current upload exist && has not changed

    this.setState({
      saving: false,
      isDirty: false,
    });
    this.props.onSave(
      upload.id,
      this.getSelectedSize(),
      this.state.documentCategory
        ? this.state.documentCategory.description
        : this.props.type,
      !isEmpty(this.state.name) ? this.state.name : this.props.fileName,
    );
  }
  getSelectedSize() {
    const size: string = this.state.sizeSSelected
      ? 'M'
      : this.state.sizeMSelected
      ? 'L'
      : this.state.sizeLSelected
      ? 'XL'
      : 'XL';
    return size;
  }

  async uploadFile(file: string, size?: string = 'L') {
    const mimeType: string = file.split(',')[0];
    const base64Data: string = file.split(',')[1];
    if (mimeType.includes('application/pdf')) {
      const pageWidth: number = 612;
      const pageAspectRatio: number = 8.5 / 11;
      const pageHeight: number = pageWidth / pageAspectRatio;
      const style: any = {width: pageWidth, height: pageHeight};
      this.setState({
        style: style,
        scaledFile: base64Data,
        isDirty: true,
      });
    } else {
      this.resizeImage(base64Data, size, mimeType);
    }
  }

  async resizeImage(
    image: string,
    size?: string = 'L',
    mimeType?: string = 'image/jpeg;base64',
  ) {
    let dimension: Dimension;
    let resized: boolean = false;
    if (mimeType.includes('image/png')) {
      dimension = getPng64Dimension(image);
    } else {
      dimension = getJpeg64Dimension(image);
    }
    const maxWidth: number = Math.round(imageWidth(size) * 1.1);

    //Image is too big so lets resize
    const tempFolder = 'temp';
    let resizedImage = await resizeFile(
      image,
      dimension.width > maxWidth ? maxWidth : dimension.width,
      dimension.height,
      'JPEG',
      75,
      0,
      tempFolder,
    );
    if (isWeb) {
      image = resizedImage.split(',')[1];
    } else {
      image = await RNFS.readFile(resizedImage.path, 'base64');
      RNFS.unlink(RNFS.DocumentDirectoryPath + '/' + tempFolder);
    }
    const dimensionAfter = getJpeg64Dimension(image);
    __DEV__ &&
      console.log(
        'Resized image from ' + dimension.width + 'x' + dimension.height,
        ' to ' +
          dimensionAfter.width +
          'x' +
          dimensionAfter.height +
          ' ' +
          Math.round(resizedImage.size / 1024) +
          'Kb',
      );
    resized = true;

    this.setState({
      scaledFile: image,
      isDirty: this.state.isDirty || resized,
    });
  }

  clear = () => {
    this.props.onSave(undefined);
  };

  sizeOnChange = (field: name) => {
    if (field === undefined || field === null || field === '') {
      return;
    }
    if (
      this.state.file === undefined ||
      this.state.file === null ||
      this.state.file === ''
    ) {
      return;
    }

    const mimeType: string = this.state.file.split(',')[0];
    const base64Data: string = this.state.file.split(',')[1];
    if (field === 'size-s') {
      this.resizeImage(base64Data, 'M', mimeType);
      this.setState({
        sizeSSelected: true,
        sizeMSelected: false,
        sizeLSelected: false,
      });
    } else if (field === 'size-m') {
      this.resizeImage(base64Data, 'L', mimeType);
      this.setState({
        sizeSSelected: false,
        sizeMSelected: true,
        sizeLSelected: false,
      });
    } else if (field === 'size-l') {
      this.resizeImage(base64Data, 'XL', mimeType);
      this.setState({
        sizeSSelected: false,
        sizeMSelected: false,
        sizeLSelected: true,
      });
    }
  };
  async documentCategoryOnChange(dc: CodeDefinition, index: number) {
    if (this.props.isAttachment) {
      const patientDocuments: PatientDocument[] = await loadDocuments(
        dc.description,
        this.props.patientId,
      );
      this.setState({patientDocuments: patientDocuments});
    }
    if (
      this.state.patientDocument !== undefined &&
      this.state.file !== undefined
    ) {
      this.setState({
        file: undefined,
        patientDocument: undefined,
        upload: undefined,
      });
    }
    this.setState({documentCategory: dc});
  }

  changeText(value: string) {
    this.setState({name: value});
  }

  renderDocumentCategories() {
    const documentCategories: CodeDefinition[] =
      getAllCodes('documentCategories');

    return (
      documentCategories &&
      documentCategories.map((dc: CodeDefinition, index: number) => (
        <TouchableOpacity
          onPress={() => this.documentCategoryOnChange(dc, index)}
          testID={'dc' + index + 1}>
          <View
            style={
              this.state.documentCategory === dc
                ? styles.popupTileSelected
                : styles.popupTile
            }>
            <Text>{dc.description}</Text>
          </View>
        </TouchableOpacity>
      ))
    );
  }
  renderDocumentAttachments() {
    return (
      this.state.patientDocuments &&
      this.state.patientDocuments.map(
        (patientDocument: PatientDocument, row: number) => {
          return (
            <TouchableOpacity
              key={row}
              onPress={() => this.setImageFromUpload(patientDocument)}>
              <View
                style={
                  this.state.patientDocument === patientDocument
                    ? styles.popupTileSelected
                    : styles.popupTile
                }>
                <Text
                  style={
                    this.state.patientDocument === patientDocument
                      ? styles.modalTileLabelSelected
                      : styles.modalTileLabel
                  }>
                  {patientDocument.name +
                    ' ' +
                    formatDate(patientDocument.postedOn, yearDateFormat)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        },
      )
    );
  }

  renderDocumentName() {
    return (
      <TextInput
        returnKeyType="done"
        editable={this.props.isPdf}
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.formField}
        value={this.state.name}
        onChangeText={(text: string) => this.changeText(text)}
      />
    );
  }
  renderScannerTool(isPdf: ?boolean = false) {
    return (
      <View style={[styles.sideBar, {maxWidth: 500 * fontScale}]}>
        <ScrollView scrollEnabled={true}>
          {!isPdf && (
            <View style={styles.formRow}>
              <View style={styles.formRowHeader}>
                <Label value={strings.documentSize} />
              </View>
            </View>
          )}
          {!isPdf && (
            <View style={styles.formRow}>
              <SizeTile
                name="size-s"
                commitEdit={this.sizeOnChange}
                isSelected={this.state.sizeSSelected}
                minWidth={80}
              />
              <SizeTile
                name="size-m"
                commitEdit={this.sizeOnChange}
                isSelected={this.state.sizeMSelected}
                minWidth={80}
              />
              <SizeTile
                name="size-l"
                commitEdit={this.sizeOnChange}
                isSelected={this.state.sizeLSelected}
                minWidth={80}
              />
            </View>
          )}
          <View style={styles.formRow}>
            <View style={styles.formRowHeader}>
              <Label value={strings.documentCategory} />
            </View>
          </View>
          <View style={[styles.formRow, {flexWrap: 'wrap'}]}>
            {this.renderDocumentCategories()}
          </View>
          <View style={styles.formRow}>
            <View style={styles.formRowHeader}>
              <Label value={strings.documentName} />
            </View>
          </View>
          <View style={[styles.formRow, {flexWrap: 'wrap'}]}>
            {this.renderDocumentName()}
          </View>
          {this.props.isAttachment && (
            <View style={styles.formRow}>
              <View style={styles.formRowHeader}>
                <Label value={strings.attachment} />
              </View>
            </View>
          )}
          {this.props.isAttachment && (
            <View style={[styles.formRow, {flexWrap: 'wrap'}]}>
              {this.renderDocumentAttachments()}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }
  render() {
    const upload: ?Upload =
      this.state.upload && this.state.patientDocument
        ? this.state.upload
        : undefined;
    let mimeType: string = upload ? getMimeType(upload) : undefined;
    let isPdf: boolean = false;
    if (mimeType === undefined) {
      mimeType = this.state.file ? this.state.file.split(',')[0] : undefined;
    }
    isPdf = mimeType ? mimeType.includes('application/pdf') : false;

    return (
      <View style={styles.popupFullScreen}>
        <View style={styles.flexRow}>
          {this.state.saving === false && this.state.file !== undefined && (
            <ScrollView scrollEnabled={true}>
              <View style={styles.flow}>
                <TouchableWithoutFeedback onPress={this.props.onCancel}>
                  <View style={styles.modalCamera}>
                    <View style={styles.columnLayout}>
                      <View style={styles.centeredRowLayout}>
                        {isPdf && (
                          <PdfViewer
                            style={styles.scannedImage}
                            source={`data:${mimeType},${this.state.scaledFile}`}
                          />
                        )}
                        {!isPdf && (
                          <Image
                            style={styles.scannedImage}
                            source={{
                              uri: `data:${
                                mimeType ? mimeType : 'image/jpeg;base64'
                              },${this.state.scaledFile}`,
                            }}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                    </View>
                    <View style={styles.rowLayout}>
                      {!isWeb && (
                        <CameraTile
                          commitEdit={() => this.setState({file: undefined})}
                        />
                      )}
                      <ClearTile commitEdit={this.clear} />
                      <RefreshTile commitEdit={this.props.onCancel} />
                      {this.state.isDirty && (
                        <UpdateTile commitEdit={() => this.saveDocument()} />
                      )}
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </ScrollView>
          )}

          <View style={styles.centeredRowLayout}>
            <View style={styles.modalCamera}>
              {this.state.saving === true && <ActivityIndicator size="large" />}
              {this.state.saving === false && this.state.file === undefined && (
                <NativeScanner
                  onPictureTaken={(data) =>
                    this.setState(
                      {file: data.croppedImage, patientDocument: undefined},
                      () =>
                        this.uploadFile(
                          data.croppedImage,
                          this.getSelectedSize(),
                        ),
                    )
                  }
                  style={styles.scanner}
                />
              )}
              {!(
                this.state.file !== undefined && this.state.saving === false
              ) && (
                <View style={styles.rowLayout}>
                  <CloseTile commitEdit={this.props.onCancel} />
                </View>
              )}
            </View>
          </View>

          {(this.state.file !== undefined ||
            this.state.patientDocuments !== undefined) &&
            this.renderScannerTool(isPdf)}
        </View>
      </View>
    );
  }
}

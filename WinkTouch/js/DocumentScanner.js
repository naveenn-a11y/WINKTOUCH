/**
 * @flow
 */
'use strict';

import React, {Component} from 'react';
import {
  Image,
  View,
  TouchableWithoutFeedback,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import NativeScanner from '../src/components/DocumentScanner';
import {resizeFile} from '../src/components/FileResizer';
import RNFS from 'react-native-fs';
import type {Upload, CodeDefinition} from './Types';
import {
  ClearTile,
  UpdateTile,
  CameraTile,
  RefreshTile,
  CloseTile,
  SizeTile,
  Label,
} from './Widgets';
import {styles, fontScale, imageStyle, isWeb, printWidth} from './Styles';
import {storeUpload, getPng64Dimension, getMimeType} from './Upload';
import {getCachedItem} from './DataCache';
import {strings} from './Strings';
import PDFLib, {PDFDocument, PDFPage} from 'react-native-pdf-lib';
import {PdfViewer} from '../src/components/PdfViewer';
import {getAllCodes, getCodeDefinition, formatCode} from './Codes';

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
  };
  state: {
    image: ?string,
    scaledImage: ?string,
    saving: boolean,
    isDirty: boolean,
    sizeSSelected: boolean,
    sizeMSelected: boolean,
    sizeLSelected: boolean,
    style: any,
    documentCategory: CodeDefinition,
  };

  static defaultProps = {
    size: 'L',
  };

  constructor(props) {
    super(props);
    const upload: ?Upload = getCachedItem(this.props.uploadId);
    const image: string = upload ? upload.data : undefined;
    const documentCategories: CodeDefinition[] = getAllCodes(
      'documentCategories',
    );
    const documentCategory: CodeDefinition = documentCategories.find(
      (dc: CodeDefinition) =>
        (dc.description ? dc.description : dc.code) === this.props.type,
    );
    this.state = {
      image: image,
      saving: false,
      isDirty: false,
      sizeSSelected: false,
      sizeMSelected: true,
      sizeLSelected: false,
      style: {
        width: 1000 * fontScale,
        height: 750 * fontScale,
        resizeMode: 'contain',
      },
      scaledImage: image,
      documentCategory: documentCategory,
    };
  }

  async addPageWeb(
    pdfDoc: PDFDocument,
    documentPage: PDFPage,
    pageWidth: number,
    pageHeight: number,
  ) {
    const dimensionAfter = getPng64Dimension(this.state.scaledImage);
    const image = await pdfDoc.embedPng(this.state.scaledImage);
    const size: string = this.getSelectedSize();
    const addY: number = size === 'XL' ? 0 : 50;
    const width = Math.floor(printWidth(size));
    const aspectRatio: number = dimensionAfter.width / dimensionAfter.height;
    const height = Math.floor(width / aspectRatio);
    documentPage.drawImage(image, {
      x: pageWidth / 2 - width / 2,
      y: pageHeight / 2 - height / 2 + addY,
      width: width,
      height: height,
    });
  }
  async addPageNative(
    pdfDoc: PDFDocument,
    documentPage: PDFPage,
    pageWidth: number,
    pageHeight: number,
  ) {
    const fullFilename: string =
      RNFS.DocumentDirectoryPath + '/' + this.props.type + '.base64';
    const dimensionAfter = getPng64Dimension(this.state.scaledImage);
    await RNFS.writeFile(fullFilename, this.state.scaledImage, 'base64');
    const size: string = this.getSelectedSize();
    const addY: number = size === 'XL' ? 0 : 50;
    const width = Math.floor(printWidth(size));
    const aspectRatio: number = dimensionAfter.width / dimensionAfter.height;
    const height = Math.floor(width / aspectRatio);
    documentPage.drawImage(fullFilename, 'png', {
      x: pageWidth / 2 - width / 2,
      y: pageHeight / 2 - height / 2 + addY,
      width: width,
      height: height,
    });
  }
  async createDocument(): string {
    let path: string = undefined;
    const pageWidth: number = 612;
    const pageAspectRatio: number = 8.5 / 11;
    const pageHeight: number = pageWidth / pageAspectRatio;
    let documentPage: PDFPage = undefined;
    let pdfDoc: PDFDocument = undefined;
    const upload: ?Upload = getCachedItem(this.props.uploadId);
    const mimeType: string = upload ? getMimeType(upload) : undefined;
    const isPdf: boolean =
      mimeType !== undefined
        ? mimeType === 'application/pdf' ||
          mimeType === 'application/pdf;base64'
        : false;
    if (isWeb) {
      pdfDoc = isPdf
        ? await PDFDocument.load(upload.data)
        : await PDFDocument.create();
      documentPage = pdfDoc.addPage();
      documentPage.setSize(pageWidth, pageHeight);
      await this.addPageWeb(pdfDoc, documentPage, pageWidth, pageHeight);
      path = await pdfDoc.saveAsBase64();
    } else {
      documentPage = isPdf
        ? PDFDocument.modify(upload.data)
            .addPage()
            .setMediaBox(pageWidth, pageHeight)
        : PDFPage.create().setMediaBox(pageWidth, pageHeight);
      await this.addPageNative(pdfDoc, documentPage, pageWidth, pageHeight);
      const docsDir = await PDFLib.getDocumentsDirectory();
      const pdfPath = `${docsDir}/document.pdf`;
      let filePath = await PDFDocument.create(pdfPath)
        .addPages(documentPage)
        .write();
      path = await RNFS.readFile(filePath, 'base64');
    }
    return path;
  }

  async saveDocument(): Upload {
    if (!this.state.image) return;
    this.setState({saving: true});
    let upload: Upload = undefined;

    if (this.props.isPdf) {
      const pdfData: string = await this.createDocument();
      upload = {
        id: 'upload',
        data: pdfData,
        mimeType: 'application/pdf',
        name: this.props.fileName,
        argument1: this.props.patientId,
        argument2: this.props.examId,
        replace: this.props.replaceImage,
      };
    } else {
      upload = {
        id: 'upload',
        data: this.state.scaledImage,
        mimeType: 'image/png;base64',
        name: this.props.fileName,
        argument1: this.props.patientId,
        argument2: this.props.examId,
        replace: this.props.replaceImage,
      };
    }

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
    if (this.props.category) {
      //TODO?
    }
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
  async resizeImage(image: string, size?: string = 'L') {
    const dimensionBefore = getPng64Dimension(image);
    let ratio: number = 3 / 4;
    if (dimensionBefore !== undefined && dimensionBefore.height > 0)
      ratio = dimensionBefore.width / dimensionBefore.height;

    __DEV__ &&
      console.log(
        'Dimension of Image before resize: ' +
          dimensionBefore.width +
          'x' +
          dimensionBefore.height +
          ' ' +
          Math.round(image.size / 1024) +
          ' kbytes.',
      );
    const style = imageStyle(size.toUpperCase(), ratio);

    const tempFolder = 'temp';
    let resizedImage = await resizeFile(
      image,
      style.width,
      style.height,
      'PNG',
      100,
      0,
      tempFolder,
    );
    if (isWeb) {
      image = resizedImage.split(',')[1];
    } else {
      image = await RNFS.readFile(resizedImage.path, 'base64');
      RNFS.unlink(RNFS.DocumentDirectoryPath + '/' + tempFolder);
    }
    const dimensionAfter = getPng64Dimension(image);
    __DEV__ &&
      console.log(
        'Resized image to ' +
          dimensionAfter.width +
          'x' +
          dimensionAfter.height +
          ' ' +
          Math.round(resizedImage.size / 1024) +
          ' kbytes.',
      );

    this.setState({
      style: style,
      scaledImage: image,
      isDirty: true,
    });
  }

  clear = () => {
    this.props.onSave(undefined);
  };

  sizeOnChange = (field: name) => {
    if (field === undefined || field === null || field === '') return;
    if (field === 'size-s') {
      this.resizeImage(this.state.image, 'M');
      this.setState({
        sizeSSelected: true,
        sizeMSelected: false,
        sizeLSelected: false,
      });
    } else if (field === 'size-m') {
      this.resizeImage(this.state.image, 'L');
      this.setState({
        sizeSSelected: false,
        sizeMSelected: true,
        sizeLSelected: false,
      });
    } else if (field === 'size-l') {
      this.resizeImage(this.state.image, 'XL');
      this.setState({
        sizeSSelected: false,
        sizeMSelected: false,
        sizeLSelected: true,
      });
    }
  };
  documentCategoryOnChange = (dc: CodeDefinition, index: number) => {
    this.setState({documentCategory: dc});
  };

  renderDocumentCategories() {
    const documentCategories: CodeDefinition[] = getAllCodes(
      'documentCategories',
    );

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
  renderScannerTool() {
    return (
      <View style={styles.sideBar}>
        <View style={styles.formRow}>
          <View style={styles.formRowHeader}>
            <Label value={strings.documentSize} />
          </View>
        </View>
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
        <View style={styles.formRow}>
          <View style={styles.formRowHeader}>
            <Label value={strings.documentCategory} />
          </View>
        </View>
        <View style={[styles.formRow, {flexWrap: 'wrap'}]}>
          {this.renderDocumentCategories()}
        </View>
      </View>
    );
  }
  render() {
    const upload: ?Upload = getCachedItem(this.props.uploadId);
    const mimeType: string = upload ? getMimeType(upload) : undefined;
    const isPdf: boolean =
      mimeType !== undefined
        ? mimeType === 'application/pdf' ||
          mimeType === 'application/pdf;base64'
        : false;

    return (
      <View style={styles.popupFullScreen}>
        <View style={styles.flexRow}>
          <ScrollView scrollEnabled={true}>
            <View style={styles.flow}>
              <TouchableWithoutFeedback onPress={this.props.onCancel}>
                <View style={styles.modalCamera}>
                  {this.state.saving === true && (
                    <ActivityIndicator size="large" />
                  )}
                  {this.state.saving === false &&
                    this.state.image !== undefined && (
                      <View style={styles.columnLayout}>
                        <View style={styles.centeredRowLayout}>
                          {isPdf && !this.state.isDirty && (
                            <PdfViewer
                              style={this.state.style}
                              source={`data:${mimeType},${this.state.scaledImage}`}
                            />
                          )}
                          {(!isPdf || this.state.isDirty) && (
                            <Image
                              style={this.state.style}
                              source={{
                                uri: `data:${
                                  mimeType ? mimeType : `image/png;base64`
                                },${this.state.scaledImage}`,
                              }}
                              resizeMode="contain"
                            />
                          )}
                        </View>
                      </View>
                    )}
                  {this.state.saving === false &&
                    this.state.image === undefined && (
                      <NativeScanner
                        onPictureTaken={(data) =>
                          this.setState({image: data.croppedImage}, () =>
                            this.resizeImage(data.croppedImage),
                          )
                        }
                        style={styles.scanner}
                      />
                    )}
                  {this.state.image !== undefined &&
                  this.state.saving === false ? (
                    <View style={styles.rowLayout}>
                      <CameraTile
                        commitEdit={() => this.setState({image: undefined})}
                      />
                      <ClearTile commitEdit={this.clear} />
                      <RefreshTile commitEdit={this.props.onCancel} />
                      {this.state.isDirty && (
                        <UpdateTile commitEdit={() => this.saveDocument()} />
                      )}
                    </View>
                  ) : (
                    <View style={styles.rowLayout}>
                      <CloseTile commitEdit={this.props.onCancel} />
                    </View>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </ScrollView>
          {this.state.image !== undefined && this.renderScannerTool()}
        </View>
      </View>
    );
  }
}

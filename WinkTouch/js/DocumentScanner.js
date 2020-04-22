/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Text, Image, TouchableOpacity, View, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import Scanner from 'react-native-document-scanner';
import base64 from 'base-64';
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';
import type { Upload } from './Types';
import { ClearTile, UpdateTile, CameraTile, RefreshTile, CloseTile } from './Widgets';
import { styles, fontScale, imageStyle } from './Styles';
import { storeUpload, getJpeg64Dimension } from './Upload';
import { getCachedItem } from './DataCache';
import { strings } from './Strings';


export class DocumentScanner extends Component {
  props: {
    uploadId: string,
    fileName: string,
    category?: ?string,
    patientId: string,
    examId: string,
    onSave: (uploadId: string) => void,
    onCancel: () => void,
    size: string,
  }
  state: {
    image: ?string,
    saving: boolean,
    isDirty: boolean
  }

  static defaultProps = {
    size: 'M'
  }

  constructor(props) {
    super(props);
    const upload : ?Upload = getCachedItem(this.props.uploadId);
    const image : string = upload?upload.data:undefined;
    this.state = {
      image: image,
      saving: false,
      isDirty: false
    };
  }

  async saveImage() : Upload {
    if (!this.state.image) return;
    this.setState({ saving: true });
    let upload : Upload = {
      id: 'upload',
      data: this.state.image,
      mimeType: 'image/jpeg;base64',
      name: this.props.fileName,
      argument1: this.props.patientId,
      argument2: this.props.examId
    };
    upload = await storeUpload(upload);
    if (upload.errors) {
      alert(strings.formatString(strings.pmsImageSaveError, this.props.fileName));
      this.setState({
        saving: false
      });            
      return upload;
    }
    if (this.props.category) {
      //TODO?
    }
    this.setState({
      saving: false,
      isDirty: false
    });
    this.props.onSave(upload.id);
  }

  async tookPicture(image: string) {
    const dimension : {width: number, height: number} = getJpeg64Dimension(image);
    const maxSize: number = Math.round(imageStyle(this.props.size).width/fontScale*1.1);
    if (dimension.width>maxSize) {
      const tempFolder = 'temp';
      let resizedImage = await ImageResizer.createResizedImage('data:image/jpeg;base64,'+image, maxSize, dimension.height, 'JPEG', 70, 0, tempFolder);
      image = await RNFS.readFile(resizedImage.path, 'base64');
      const dimensionAfter = getJpeg64Dimension(image);
      __DEV__ && console.log('Resized image to '+dimensionAfter.width+'x'+dimensionAfter.height+' '+Math.round(resizedImage.size/1024)+' kbytes.');
      RNFS.unlink(RNFS.DocumentDirectoryPath+'/' + tempFolder);
    }
    this.setState({ image, isDirty: true });
  }

  clear = () => {
    this.props.onSave(undefined);
  }

  render() {
    return (
      <View style={styles.popupFullScreen}>
        <TouchableWithoutFeedback onPress={this.props.onCancel}>
          <View style={styles.modalCamera}>
          {this.state.saving===true && <ActivityIndicator ize="large" />}
          {this.state.saving===false && this.state.image!==undefined && <Image style={styles.bigImage} source={{ uri: `data:image/jpeg;base64,${this.state.image}`}} resizeMode="contain" />}
          {this.state.saving===false && this.state.image===undefined && <Scanner
              useBase64={true}
              onPictureTaken={data => this.setState({image: data.croppedImage}, () => this.tookPicture(data.croppedImage))}
              captureMultiple={false}
              overlayColor="rgba(255,130,0, 0.7)"
              enableTorch={false}
              useFrontCam={false}
              brightness={0.2}
              saturation={-0.1}
              quality={1.0}
              contrast={1.5}
              detectionCountBeforeCapture={3}
              detectionRefreshRateInMS={60}
              style={styles.scanner}
            />
          }
          {(this.state.image!==undefined && this.state.saving===false) ?
            <View style={styles.rowLayout}>
              <CameraTile commitEdit={() => this.setState({ image: undefined })} />
              <ClearTile commitEdit={this.clear} />
              <RefreshTile commitEdit={this.props.onCancel} />
              {this.state.isDirty  && <UpdateTile commitEdit={() => this.saveImage()} />}
            </View>:
            <View style={styles.rowLayout}>
              <CloseTile commitEdit={this.props.onCancel} />
            </View>
          }
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }
}

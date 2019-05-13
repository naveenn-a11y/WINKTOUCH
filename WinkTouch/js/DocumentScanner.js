/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Text, Image, TouchableOpacity, View, TouchableWithoutFeedback } from 'react-native';
import Scanner from 'react-native-document-scanner';
import type { Upload } from './Types';
import { ClearTile, UpdateTile, CameraTile, RefreshTile, CloseTile } from './Widgets';
import { styles } from './Styles';
import { storeUpload } from './Upload';
import { getCachedItem } from './DataCache';

export class DocumentScanner extends Component {
  props: {
    uploadId: string,
    fileName: string,
    category?: ?string,
    patientId: string,
    examId: string,
    onSave: (uploadId: string) => void,
    onCancel: () => void,
  }
  state: {
    image: ?string,
    saving: boolean,
    isDirty: boolean,
    flashEnabled: boolean,
    useFrontCam: boolean,
    lastDetectionType: string,
  }

  constructor(props) {
    super(props);
    const upload : ?Upload = getCachedItem(this.props.uploadId);
    const image : string = upload?upload.data:undefined;
    this.state = {
      image: image,
      saving: false,
      isDirty: false,
      flashEnabled: false,
      useFrontCam: false,
    };
  }

  renderDetectionType() {
    switch (this.state.lastDetectionType) {
      case 0:
        return "Correct rectangle found"
      case 1:
        return "Bad angle found";
      case 2:
        return "Rectangle too far";
      default:
        return "No rectangle detected yet";
    }
  }

  async saveImage() : Upload {
    if (!this.state.image) return;
    let upload : Upload = {
      id: 'upload',
      data: this.state.image,
      mimeType: 'image/jpeg;base64',
      name: this.props.fileName,
      argument1: this.props.patientId,
      argument2: this.props.examId
    };
    upload = await storeUpload(upload);
    if (this.props.category) {

    }
    this.setState({
      saving: false,
      isDirty: false
    });
    this.props.onSave(upload.id);
  }

  tookPicture(image: string) {
    this.setState({ image, isDirty: true });
  }

  clear = () => {
    this.props.onSave(undefined);
  }

  render() {
    return (
      <View style={styles.popupFullScreen}>
        <TouchableWithoutFeedback onPress={this.props.onCancel}>
          <View style={styles.modalColumn}>
          {this.state.image ?
            <Image style={styles.bigImage} source={{ uri: `data:image/jpeg;base64,${this.state.image}`}} resizeMode="contain" /> :
            <Scanner
              useBase64
              onPictureTaken={data => this.tookPicture(data.croppedImage)}
              overlayColor="rgba(255,130,0, 0.7)"
              enableTorch={this.state.flashEnabled}
              useFrontCam={this.state.useFrontCam}
              brightness={0.15}
              saturation={0}
              quality={0.5}
              contrast={1.2}
              onRectangleDetect={({ stableCounter, lastDetectionType }) => this.setState({ stableCounter, lastDetectionType })}
              detectionCountBeforeCapture={3}
              detectionRefreshRateInMS={50}
              style={styles.scanner}
            />
          }
            {this.state.image && !this.state.saving ?
              <View style={styles.rowLayout}>
                <CameraTile commitEdit={() => this.setState({ image: '' })} />
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

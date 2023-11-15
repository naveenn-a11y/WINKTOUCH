/**
 * @flow
 */
'use strict';

import React, {Component} from 'react';
import {
  View,
  Image,
  TouchableHighlight,
  ImagePickerIOS,
  Text,
} from 'react-native';
import {styles, fontScale} from './Styles';

export class ImagePicker extends Component {
  state: {
    canUseCamera: boolean,
    photo: {uri: any},
  };
  constructor(props: any) {
    super(props);
    this.state = {
      canUseCamera: false,
      photo: null,
    };
  }

  showCamera() {
    //ImagePickerIOS.canUseCamera((canUseCamera) => console.log(canUseCamera));

    ImagePickerIOS.openCameraDialog(
      {},
      (photoURI) => this.setState({photo: {uri: photoURI}}),
      () => console.log('camera cancelled'),
    );
  }

  render() {
    return (
      <TouchableHighlight onPress={() => this.showCamera()}>
        <View>
          <Image
            source={require('./image/camera.png')}
            style={{
              width: 20 * fontScale,
              height: 20 * fontScale,
              resizeMode: 'contain',
              padding: 20 * fontScale,
            }}
          />
          <Image
            source={this.state.photo}
            style={{
              width: 350 * fontScale,
              height: 260 * fontScale,
              resizeMode: 'contain',
            }}
          />
        </View>
      </TouchableHighlight>
    );
  }
}

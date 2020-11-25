import React, {Component} from 'react';
import {Text, View} from 'react-native';
import Scanner from 'react-native-document-scanner';

export default class NativeScanner extends Component {
  props: {
    onPictureTaken: (data: any) => void,
    style: any,
  };

  constructor(props: any) {
    super(props);
  }
  render() {
    return (
      <Scanner
        useBase64={true}
        onPictureTaken={this.props.onPictureTaken}
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
        style={this.props.style}
      />
    );
  }
}

import React, {Component} from 'react';
import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Scanner, {RectangleOverlay} from 'react-native-rectangle-scanner';
import RNFS from 'react-native-fs';
import {fontScale} from '../../../js/Styles';

export default class NativeScanner extends Component {
  props: {
    onPictureTaken: (data: any) => void,
    style: any,
  };

  constructor(props) {
    super(props);
    this.state = {
      flashEnabled: false,
      detectedRectangle: false,
      processingImage: false,
      takingPicture: false,
      device: {
        initialized: false,
        hasCamera: false,
        permissionToUseCamera: false,
        flashIsAvailable: true,
        previewHeightPercent: 1,
        previewWidthPercent: 1,
      },
      previewHeight: 0,
      previewWidth: 0,
    };

    this.camera = React.createRef();
    this.imageProcessorTimeout = null;
  }

  componentWillUnmount() {
    clearTimeout(this.imageProcessorTimeout);
  }
  setPreviewHeight(height) {
    this.setState({previewHeight: height});
  }
  setPreviewWidth(width) {
    this.setState({previewWidth: width});
  }
  onDeviceSetup = (deviceDetails) => {
    const {
      hasCamera,
      permissionToUseCamera,
      flashIsAvailable,
      previewHeightPercent,
      previewWidthPercent,
    } = deviceDetails;
    this.setState({
      device: {
        initialized: true,
        hasCamera,
        permissionToUseCamera,
        flashIsAvailable,
        previewHeightPercent: previewHeightPercent || 1,
        previewWidthPercent: previewWidthPercent || 1,
      },
    });
  };

  getPreviewSize() {
    let dimensions = Dimensions.get('window');
    const height: number = dimensions.height;
    const width: number = dimensions.width;
    if (dimensions.width > dimensions.height) {
      dimensions.width = height;
      dimensions.height = width;
    }
    const heightMargin =
      ((1 - this.state.previewHeight) * dimensions.height) / 2;
    const widthMargin = ((1 - this.state.previewWidth) * dimensions.width) / 2;
    const previewHeightPercent = this.state.previewHeight / dimensions.height;
    const previewWidthPercent = this.state.previewWidth / dimensions.width;
    if (dimensions.height > dimensions.width) {
      // Portrait
      return {
        height: previewHeightPercent,
        width: previewWidthPercent,
        marginTop: heightMargin,
        marginLeft: widthMargin,
      };
    }
    // Landscape
    return {
      width: previewHeightPercent,
      height: previewWidthPercent,
      marginTop: widthMargin,
      marginLeft: heightMargin,
    };
  }
  getCameraDisabledMessage() {
    const {device} = this.state;
    if (device.initialized) {
      if (!device.hasCamera) {
        return 'Could not find a camera on the device.';
      }
      if (!device.permissionToUseCamera) {
        return 'Permission to use camera has not been granted.';
      }
    }
    return 'Failed to set up the camera.';
  }

  capture = () => {
    if (this.state.takingPicture) return;
    if (this.state.processingImage) return;
    this.setState({takingPicture: true, processingImage: true});
    this.camera.current.capture();

    this.imageProcessorTimeout = setTimeout(() => {
      if (this.state.takingPicture) {
        this.setState({takingPicture: false});
      }
    }, 100);
  };

  async onPictureTaken(event: any) {
    this.setState({takingPicture: false});
  }

  async onPictureProcessed(event: any) {
    const base64CroppedImage: string = await RNFS.readFile(
      event.croppedImage,
      'base64',
    );
    RNFS.unlink(event.croppedImage);
    this.setState({
      image: event,
      takingPicture: false,
      processingImage: false,
    });
    event.croppedImage = 'image/jpeg;base64,' + base64CroppedImage;
    this.props.onPictureTaken(event);
  }

  renderFlashControl() {
    const {flashEnabled, device} = this.state;
    if (!device.flashIsAvailable) return null;
    return (
      <TouchableOpacity
        style={styles.flashControl}
        activeOpacity={0.8}
        onPress={() => this.setState({flashEnabled: !flashEnabled})}>
        <Icon name="flashlight" style={styles.buttonIcon} />
      </TouchableOpacity>
    );
  }
  renderCameraControl() {
    const cameraIsDisabled =
      this.state.takingPicture || this.state.processingImage;
    const disabledStyle = {opacity: cameraIsDisabled ? 0.8 : 1};
    return (
      <View style={styles.cameracontainer}>
        <View style={[styles.cameraOutline, disabledStyle]}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.cameraButton}
            onPress={this.capture}
          />
        </View>
      </View>
    );
  }

  renderCameraControls() {
    return (
      <View style={styles.buttonBottomContainer}>
        {this.renderCameraControl()}
        {this.renderFlashControl()}
      </View>
    );
  }

  render() {
    return (
      <View>
        <View
          onLayout={(event) => {
            const {width, height} = event.nativeEvent.layout;
            this.setPreviewHeight(height);
            this.setPreviewWidth(width);
          }}>
          <Scanner
            useBase64={true}
            onPictureTaken={(event: any) => this.onPictureTaken(event)}
            onPictureProcessed={(event: any) => this.onPictureProcessed(event)}
            enableTorch={this.state.flashEnabled}
            ref={this.camera}
            capturedQuality={1}
            onRectangleDetected={({detectedRectangle}) =>
              this.setState({detectedRectangle})
            }
            onDeviceSetup={this.onDeviceSetup}
            onTorchChanged={({enabled}) =>
              this.setState({flashEnabled: enabled})
            }
            style={this.props.style}
            onErrorProcessingImage={(err) => console.log('error', err)}
          />
          {!this.state.processingImage && (
            <RectangleOverlay
              detectedRectangle={this.state.detectedRectangle}
              backgroundColor="rgba(255,181,6, 0.2)"
              borderColor="rgb(255,181,6)"
              borderWidth={4}
              detectedBackgroundColor="rgba(255,181,6, 0.3)"
              detectedBorderWidth={6}
              detectedBorderColor="rgb(255,218,124)"
              onDetectedCapture={this.capture}
              previewRatio={this.getPreviewSize()}
              allowDetection
            />
          )}
        </View>
        <SafeAreaView>{this.renderCameraControls()}</SafeAreaView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  buttonBottomContainer: {
    display: 'flex',
    bottom: 40 * fontScale,
    flexDirection: 'row',
    position: 'absolute',
  },
  buttonIcon: {
    color: 'white',
    fontSize: 36 * fontScale,
    marginBottom: 3 * fontScale,
    textAlign: 'center',
  },
  cameraButton: {
    backgroundColor: 'white',
    borderRadius: 50 * fontScale,
    flex: 1,
    margin: 3 * fontScale,
  },
  cameracontainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-start',
  },
  cameraOutline: {
    alignSelf: 'flex-start',
    left: 30 * fontScale,
    borderColor: 'white',
    borderRadius: 50 * fontScale,
    borderWidth: 3 * fontScale,
    height: 70 * fontScale,
    width: 70 * fontScale,
  },

  flashControl: {
    alignItems: 'center',
    borderRadius: 30 * fontScale,
    height: 50 * fontScale,
    justifyContent: 'center',
    margin: 8 * fontScale,
    paddingTop: 7 * fontScale,
    width: 50 * fontScale,
  },
});

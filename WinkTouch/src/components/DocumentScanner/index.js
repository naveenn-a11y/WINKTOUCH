import {PropTypes} from 'prop-types';
import React, {Component} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Scanner, {
  Filters,
  RectangleOverlay,
} from 'react-native-rectangle-scanner';
import RNFS from 'react-native-fs';

let previewHeight: number = 0;
let previewWidth: number = 0;
function setPreviewHeight(height) {
  previewHeight = height;
}
function setPreviewWidth(width) {
  previewWidth = width;
}
function getPreviewSize() {
  const dimensions = Dimensions.get('window');
  const previewHeightPercent = previewHeight / dimensions.height;
  const previewWidthPercent = previewWidth / dimensions.width;

  // We use set margin amounts because for some reasons the percentage values don't align the camera preview in the center correctly.
  const heightMargin = ((1 - previewHeightPercent) * dimensions.height) / 2;
  const widthMargin = ((1 - previewWidthPercent) * dimensions.width) / 2;
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
export default class NativeScanner extends Component {
  props: {
    onPictureTaken: (data: any) => void,
    style: any,
  };

  constructor(props) {
    super(props);
    this.state = {
      flashEnabled: false,
      showScannerView: false,
      didLoadInitialLayout: false,
      detectedRectangle: false,
      isMultiTasking: false,
      loadingCamera: true,
      processingImage: false,
      takingPicture: false,
      overlayFlashOpacity: new Animated.Value(0),
      device: {
        initialized: false,
        hasCamera: false,
        permissionToUseCamera: false,
        flashIsAvailable: false,
        previewHeightPercent: 1,
        previewWidthPercent: 1,
      },
    };

    this.camera = React.createRef();
    this.imageProcessorTimeout = null;
  }

  componentDidMount() {
    if (this.state.didLoadInitialLayout && !this.state.isMultiTasking) {
      this.turnOnCamera();
    }
  }

  componentDidUpdate() {
    if (this.state.didLoadInitialLayout) {
      if (this.state.isMultiTasking) return this.turnOffCamera(true);
      if (this.state.device.initialized) {
        if (!this.state.device.hasCamera) return this.turnOffCamera();
        if (!this.state.device.permissionToUseCamera)
          return this.turnOffCamera();
      }
      if (this.props.cameraIsOn === true && !this.state.showScannerView) {
        return this.turnOnCamera();
      }
      if (this.props.cameraIsOn === false && this.state.showScannerView) {
        return this.turnOffCamera(true);
      }
      if (this.props.cameraIsOn === undefined) {
        return this.turnOnCamera();
      }
    }
    return null;
  }

  componentWillUnmount() {
    clearTimeout(this.imageProcessorTimeout);
  }

  onDeviceSetup = (deviceDetails) => {
    console.log('deviceDetails: ' + JSON.stringify(deviceDetails));
    const {
      hasCamera,
      permissionToUseCamera,
      flashIsAvailable,
      previewHeightPercent,
      previewWidthPercent,
    } = deviceDetails;
    this.setState({
      loadingCamera: false,
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
    const dimensions = Dimensions.get('window');
    // We use set margin amounts because for some reasons the percentage values don't align the camera preview in the center correctly.
    const heightMargin = ((1 - previewHeight) * dimensions.height) / 2;
    const widthMargin = ((1 - previewWidth) * dimensions.width) / 2;
    const previewHeightPercent = previewHeight / dimensions.height;
    const previewWidthPercent = previewWidth / dimensions.width;
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
    if (this.state.isMultiTasking) {
      return 'Camera is not allowed in multi tasking mode.';
    }

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

  turnOnCamera() {
    if (!this.state.showScannerView) {
      this.setState({
        showScannerView: true,
        loadingCamera: true,
      });
    }
  }

  turnOffCamera(shouldUninitializeCamera = false) {
    if (shouldUninitializeCamera && this.state.device.initialized) {
      this.setState(({device}) => ({
        showScannerView: false,
        device: {...device, initialized: false},
      }));
    } else if (this.state.showScannerView) {
      this.setState({showScannerView: false});
    }
  }

  triggerSnapAnimation() {
    Animated.sequence([
      Animated.timing(this.state.overlayFlashOpacity, {
        toValue: 0.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(this.state.overlayFlashOpacity, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(this.state.overlayFlashOpacity, {
        toValue: 0.6,
        delay: 100,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(this.state.overlayFlashOpacity, {
        toValue: 0,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }
  capture = () => {
    if (this.state.takingPicture) return;
    if (this.state.processingImage) return;
    this.setState({takingPicture: true, processingImage: true});
    this.camera.current.capture();
    this.triggerSnapAnimation();

    // If capture failed, allow for additional captures
    this.imageProcessorTimeout = setTimeout(() => {
      if (this.state.takingPicture) {
        this.setState({takingPicture: false});
      }
    }, 100);
  };

  // The picture was captured but still needs to be processed.
  async onPictureTaken(event: any) {
    this.setState({takingPicture: false});
    console.log('Eventssssssssssssss: ' + JSON.stringify(event));

    //   this.props.onPictureTaken(event);
  }

  // The picture was taken and cached. You can now go on to using it.
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
      showScannerView: this.props.cameraIsOn || false,
    });
    event.croppedImage = 'image/jpeg;base64,' + base64CroppedImage;
    this.props.onPictureTaken(event);
  }

  renderFlashControl() {
    const {flashEnabled, device} = this.state;
    if (!device.flashIsAvailable) return null;
    return (
      <TouchableOpacity
        style={[
          styles.flashControl,
          {backgroundColor: flashEnabled ? '#FFFFFF80' : '#00000080'},
        ]}
        activeOpacity={0.8}
        onPress={() => this.setState({flashEnabled: !flashEnabled})}>
        <Icon
          name="ios-flashlight"
          style={[
            styles.buttonIcon,
            {fontSize: 28, color: flashEnabled ? '#333' : '#FFF'},
          ]}
        />
      </TouchableOpacity>
    );
  }

  renderCameraControls() {
    const cameraIsDisabled =
      this.state.takingPicture || this.state.processingImage;
    const disabledStyle = {opacity: cameraIsDisabled ? 0.8 : 1};

    return (
      <>
        <View style={styles.buttonBottomContainer}>
          <View style={styles.cameracontainer}>
            <View style={[styles.cameraOutline, disabledStyle]}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.cameraButton}
                onPress={this.capture}
              />
            </View>
          </View>
          <View>{this.renderFlashControl()}</View>
        </View>
      </>
    );
  }

  renderCameraOverlay() {
    let loadingState = null;
    if (this.state.loadingCamera) {
      loadingState = (
        <View style={styles.overlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="white" />
            <Text style={styles.loadingCameraMessage}>Loading Camera</Text>
          </View>
        </View>
      );
    } else if (this.state.processingImage) {
      loadingState = (
        <View style={styles.overlay}>
          <View style={styles.loadingContainer}>
            <View style={styles.processingContainer}>
              <ActivityIndicator color="#333333" size="large" />
              <Text style={{color: '#333333', fontSize: 30, marginTop: 10}}>
                Processing
              </Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <>
        {loadingState}
        <SafeAreaView style={[styles.overlay]}>
          {this.renderCameraControls()}
        </SafeAreaView>
      </>
    );
  }

  renderCameraView() {
    console.log('Props Style: ' + JSON.stringify(this.props.style));
    if (this.state.showScannerView) {
      const previewSize = this.getPreviewSize();
      let rectangleOverlay = null;
      if (!this.state.loadingCamera && !this.state.processingImage) {
        rectangleOverlay = (
          <RectangleOverlay
            detectedRectangle={this.state.detectedRectangle}
            backgroundColor="rgba(255,181,6, 0.2)"
            borderColor="rgb(255,181,6)"
            borderWidth={4}
            detectedBackgroundColor="rgba(255,181,6, 0.3)"
            detectedBorderWidth={6}
            detectedBorderColor="rgb(255,218,124)"
            onDetectedCapture={this.capture}
            allowDetection
          />
        );
      }
      return (
        <View
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0)',
            position: 'relative',
            marginTop: previewSize.marginTop,
            marginLeft: previewSize.marginLeft,
            height: `${previewSize.height * 100}%`,
            width: `${previewSize.width * 100}%`,
          }}>
          <Scanner
            onPictureTaken={(event: any) => this.onPictureTaken(event)}
            onPictureProcessed={(event: any) => this.onPictureProcessed(event)}
            enableTorch={this.state.flashEnabled}
            ref={this.camera}
            capturedQuality={1.0}
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
          <Animated.View
            style={{
              ...styles.overlay,
              backgroundColor: 'white',
              opacity: this.state.overlayFlashOpacity,
            }}
          />
          {this.renderCameraOverlay()}
        </View>
      );
    }

    let message = null;
    if (this.state.loadingCamera) {
      message = (
        <View style={styles.overlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="white" />
            <Text style={styles.loadingCameraMessage}>Loading Camera</Text>
          </View>
        </View>
      );
    } else {
      message = (
        <Text style={styles.cameraNotAvailableText}>
          {this.getCameraDisabledMessage()}
        </Text>
      );
    }
    return <View style={styles.cameraNotAvailableContainer}>{message}</View>;
  }

  render() {
    return (
      <View>
        <View
          style={this.props.style}
          onLayout={(event) => {
            const {width, height} = event.nativeEvent.layout;
            setPreviewHeight(height);
            setPreviewWidth(width);
          }}>
          <Scanner
            useBase64={true}
            onPictureTaken={(event: any) => this.onPictureTaken(event)}
            onPictureProcessed={(event: any) => this.onPictureProcessed(event)}
            enableTorch={this.state.flashEnabled}
            ref={this.camera}
            capturedQuality={0.6}
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
          {!this.state.loadingCamera && !this.state.processingImage && (
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
        <SafeAreaView style={[styles.overlay]}>
          {this.renderCameraControls()}
        </SafeAreaView>
      </View>
    );
  }

  retryCapture = () => {
    this.setState({
      image: null,
    });
  };
}

const styles = StyleSheet.create({
  preview: {
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'contain',
  },
  previewBox: {
    width: 350,
    height: 350,
  },
  previewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  buttonBottomContainer: {
    display: 'flex',
    bottom: 40,
    flexDirection: 'row',
    position: 'absolute',
  },
  buttonContainer: {
    position: 'relative',
    backgroundColor: '#000000',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 40,
    padding: 10,
    width: 100,
  },
  buttonGroup: {
    backgroundColor: '#00000080',
    borderRadius: 17,
  },
  buttonIcon: {
    color: 'white',
    fontSize: 22,
    marginBottom: 3,
    textAlign: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 13,
  },
  cameraButton: {
    backgroundColor: 'white',
    borderRadius: 50,
    flex: 1,
    margin: 3,
  },
  cameraNotAvailableContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 15,
  },
  cameraNotAvailableText: {
    color: 'white',
    fontSize: 25,
    textAlign: 'center',
  },
  cameracontainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  cameraOutline: {
    alignSelf: 'center',
    left: 30,
    borderColor: 'white',
    borderRadius: 50,
    borderWidth: 3,
    height: 70,
    width: 70,
  },
  container: {
    backgroundColor: 'black',
    flex: 1,
  },
  flashControl: {
    alignItems: 'center',
    borderRadius: 30,
    height: 50,
    justifyContent: 'center',
    margin: 8,
    paddingTop: 7,
    width: 50,
  },
  loadingCameraMessage: {
    color: 'white',
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    bottom: 0,
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  processingContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(220, 220, 220, 0.7)',
    borderRadius: 16,
    height: 140,
    justifyContent: 'center',
    width: 200,
  },
  scanner: {
    flex: 1,
  },
});

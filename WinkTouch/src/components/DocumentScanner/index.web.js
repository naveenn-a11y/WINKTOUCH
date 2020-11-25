import React, {Component} from 'react';
import {Text, View, TouchableOpacity, Button} from 'react-native';
import {Camera} from 'expo-camera';
import {strings} from '../../../js/Strings';

export default class NativeScanner extends Component {
  props: {
    onPictureTaken: (data: any) => void,
    style: any,
  };
  state: {
    hasPermission: boolean,
    type: any,
  };
  camera: any;
  constructor(props) {
    super(props);
    this.state = {
      hasPermission: false,
      type: Camera.Constants.Type.back,
    };
  }

  async componentDidMount() {
    const status = await Camera.isAvailableAsync();
    this.setHasPermission(status);
  }
  setHasPermission(status: boolean) {
    this.setState({hasPermission: status});
  }

  setType(type: any) {
    this.setState({type: type});
  }
  async snap() {
    if (this.camera) {
      const options = {base64: true};
      let data = await this.camera.takePictureAsync(options);
      if (data && data.base64.startsWith('data'))
        data = data.base64.split(',')[1];
      this.props.onPictureTaken({croppedImage: data});
    }
  }
  render() {
    if (
      this.state.hasPermission === null ||
      this.state.hasPermission === undefined
    ) {
      return <View />;
    }
    if (this.state.hasPermission === false) {
      return (
        <View>
          <Text>{strings.NoCameraAccess}</Text>
          <Button onPress={() => this.load()} title="Learn More" />
        </View>
      );
    }
    return (
      <Camera
        ref={(ref) => {
          this.camera = ref;
        }}
        style={this.props.style}
        type={this.state.type}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            flexDirection: 'row',
            justifyContent: 'center',
          }}>
          <TouchableOpacity
            style={{
              alignSelf: 'flex-end',
              alignItems: 'center',
            }}
            onPress={() => {
              this.setType(
                this.state.type === Camera.Constants.Type.back
                  ? Camera.Constants.Type.front
                  : Camera.Constants.Type.back,
              );
            }}>
            <Text style={{fontSize: 18, marginBottom: 10, color: 'white'}}>
              {strings.flip}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              alignSelf: 'flex-end',
              alignItems: 'center',
              marginLeft: 10,
            }}
            onPress={() => {
              this.snap();
            }}>
            <Text style={{fontSize: 18, marginBottom: 10, color: 'white'}}>
              {strings.snapshot}
            </Text>
          </TouchableOpacity>
        </View>
      </Camera>
    );
  }
}

import Dropzone from 'react-dropzone';
import React, {Component} from 'react';
import {Text, View, Image} from 'react-native';
import {loadBase64ImageForWeb} from '../../../js/ImageField';
import {strings} from '../../../js/Strings';

export class UploadZone extends Component {
  props: {
    onUpdateUpload: (upload: string) => void,
  };
  state: {
    imageFiles: any,
  };
  constructor(props) {
    super(props);
    this.state = {imageFiles: []};
  }
  async onDrop(imageFiles) {
    imageFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      }),
    );
    const upload: string = await loadBase64ImageForWeb(imageFiles[0].preview);
    this.props.onUpdateUpload(upload);
  }
  render() {
    return (
      <View>
        <Dropzone accept="image/*" onDrop={this.onDrop.bind(this)}>
          {({getRootProps, getInputProps}) => (
            <View>
              <div {...getRootProps({className: 'dropzone'})}>
                <input {...getInputProps()} />
                <p>{strings.dragNDrop}</p>
              </div>
            </View>
          )}
        </Dropzone>
      </View>
    );
  }
}

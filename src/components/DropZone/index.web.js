import { Component } from 'react';
import Dropzone from 'react-dropzone';
import { View } from 'react-native';
import { loadBase64ImageForWeb } from '../../../js/ImageField';
import { strings } from '../../../js/Strings';
import { fontScale } from '../../../js/Styles';

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
    const upload: string = await loadBase64ImageForWeb(
      imageFiles[0].preview,
      imageFiles[0].path,
    );
    this.props.onUpdateUpload(upload);
  }
  render() {
    return (
      <View>
        <Dropzone accept={{
          'image/*': [".png", ".jpeg", ".jpg"],
          'application/pdf': [".pdf"]
        }} onDrop={this.onDrop.bind(this)}>
          {({getRootProps, getInputProps}) => (
            <View>
              <div
                {...getRootProps({className: 'dropzone'})}
                style={styles.dropzone}>
                <input {...getInputProps()} />
                <p style={styles.dropzoneText}>{strings.dragNDrop}</p>
              </div>
            </View>
          )}
        </Dropzone>
      </View>
    );
  }
}

const styles = {
  dropzone: {
    width: '95%',
    borderWidth: 1,
    borderStyle: 'dashed',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 400 * fontScale,
    cursor: 'pointer',
  },
  dropzoneText: {width: '50%', fontSize: fontScale * 40, textAlign: 'center'},
};

import React, {Component, PureComponent} from 'react';
import {HtmlEditor} from '../src/components/TinyMceEditor/HtmlEditor';
import {styles} from './Styles';
import {
  View,
  Text,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
type PatientFileScreenProps = {
  navigation: any,
};

type PatientFileScreenState = {
  patientFileHtml: string,
};

export class PatientFileScreen extends Component<
  PatientFileScreenProps,
  PatientFileScreenState,
> {
  editor: ?HtmlEditor;

  constructor(props: ReferralScreenProps) {
    super(props);
    this.state = {
      patientFileHtml:
        this.props.navigation.state &&
        this.props.navigation.state.params &&
        this.props.navigation.state.params.patientFileHtml
          ? this.props.navigation.state.params.patientFileHtml
          : '',
    };
  }

  render() {
    return (
      <View style={styles.pages}>
        <HtmlEditor
          style={styles.page}
          ref={(ref) => (this.editor = ref)}
          value={this.state.patientFileHtml}
        />
      </View>
    );
  }
}

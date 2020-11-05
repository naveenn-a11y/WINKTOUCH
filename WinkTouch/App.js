import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  Button,
  Platform,
  Alert,
} from 'react-native';
import * as RNLocalize from 'react-native-localize';
import {translate, setI18nConfig} from './src/components/LanguageProvider/Util';

import Calendar from 'react-native-calendar';
import DeviceInfo from 'react-native-device-info';
import Mailer from 'react-native-mail';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {strings} from './src/components/LanguageProvider/Strings';

export default class App extends React.Component {
  state: {
    isDatePickerVisible: boolean,
  };
  constructor(props) {
    super(props);
    this.state = {
      isDatePickerVisible: false,
    };
    setI18nConfig();
  }

  async componentDidMount() {
    RNLocalize.addEventListener('change', this.handleLocalizationChange);
  }

  componentWillUnmount() {
    RNLocalize.removeEventListener('change', this.handleLocalizationChange);
  }

  handleLocalizationChange = () => {
    setI18nConfig()
      .then(() => this.forceUpdate())
      .catch((error) => {
        console.error(error);
      });
  };

  showDatePicker = () => {
    this.setState({isDatePickerVisible: true});
  };

  hideDatePicker = () => {
    this.setState({isDatePickerVisible: false});
  };

  handleConfirm = (date) => {
    console.warn('A date has been picked: ', date);
    this.hideDatePicker();
  };

  render() {
    return (
      <View>
        <View>
          <Calendar />
        </View>
        <View>
          <Button
            title="Show Date Picker"
            onPress={() => this.showDatePicker()}
          />
          <DateTimePickerModal
            isVisible={this.state.isDatePickerVisible}
            mode="date"
            onConfirm={this.handleConfirm}
            onCancel={this.hideDatePicker}
          />
          <Text>{strings.trialWarning}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

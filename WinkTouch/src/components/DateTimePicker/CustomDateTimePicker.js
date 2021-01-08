import DateTimePicker from 'react-native-modal-datetime-picker';

import React, {Component} from 'react';

import {View, TouchableOpacity, Text} from 'react-native';

import {styles} from '../../../js/Styles';

import {formatDate, jsonDateFormat} from '../../../js/Util';

export default class CustomDateTimePicker extends Component {
  props: {
    selected: Date,

    onChange: (date: Date) => void,

    onCancel: () => void,

    isVisible: boolean,

    confirmText?: string,

    cancelText?: string,

    confirmTextStyle?: any,

    cancelTextStyle?: any,

    isTextInput?: boolean,
  };

  state: {
    isModalActive: boolean,

    date: Date,
  };

  constructor(props: any) {
    super(props);

    this.state = {
      isModalActive: !this.props.isTextInput,

      date: this.props.selected,
    };
  }

  toogleModal(isActive: boolean) {
    this.setState({isModalActive: isActive});
  }

  updateDate = (selectedDate: ?Date) => {
    this.setState({date: selectedDate, isModalActive: false});

    this.props.onChange(selectedDate);
  };

  cancelDate = (selectedDate: ?Date) => {
    this.setState({isModalActive: false});

    this.props.onCancel();
  };

  render() {
    console.log('isModalActive: ' + this.state.isModalActive);

    if (!this.state.isModalActive) {
      return (
        <View>
          <TouchableOpacity
            onPress={() => this.toogleModal(true)}
            testID="registration.date">
            <Text style={styles.text}>
              {formatDate(this.state.date, jsonDateFormat)}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <DateTimePicker
        isVisible={this.props.isVisible}
        hideTitleContainerIOS={true}
        date={this.state.date}
        mode="date"
        onConfirm={this.updateDate}
        onCancel={this.cancelDate}
        confirmTextIOS={this.props.confirmText}
        confirmTextStyle={this.props.confirmTextStyle}
        cancelTextIOS={this.props.cancelText}
        cancelTextStyle={this.props.cancelTextStyle}
      />
    );
  }
}

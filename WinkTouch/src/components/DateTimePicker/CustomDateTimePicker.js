import DateTimePicker from 'react-native-modal-datetime-picker';
import React, {Component} from 'react';

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
  };

  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <DateTimePicker
        isVisible={this.props.isVisible}
        hideTitleContainerIOS={true}
        date={new Date()}
        mode="date"
        onConfirm={this.props.onChange}
        onCancel={this.props.onCancel}
        confirmTextIOS={this.props.confirmText}
        confirmTextStyle={this.props.confirmTextStyle}
        cancelTextIOS={this.props.cancelText}
        cancelTextStyle={this.props.cancelTextStyle}
      />
    );
  }
}

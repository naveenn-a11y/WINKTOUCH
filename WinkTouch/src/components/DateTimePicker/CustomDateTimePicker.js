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

  state: {
    date: Date,
  };

  constructor(props: any) {
    super(props);

    this.state = {
      date: this.props.selected,
    };
  }

  updateDate = (selectedDate: ?Date) => {
    this.setState({date: selectedDate});
    this.props.onChange(selectedDate);
  };

  cancelDate = (selectedDate: ?Date) => {
    this.props.onCancel();
  };

  render() {
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

import DateTimePicker from 'react-datepicker';
import React, {Component} from 'react';
import {Button, Portal} from 'react-native-paper';
import Dialog from '../../../js/utilities/Dialog';
import 'react-datepicker/dist/react-datepicker.css';

const minDate: Date = new Date(2010, 1, 1);
const maxDate: Date = new Date();

export default class CustomDateTimePicker extends Component {
  props: {
    selected: Date,
    onChange: (date: Date) => void,
    onCancel: () => void,
    isVisible: boolean,
    confirmText: string,
    cancelText: string,
    title: string,
    style?: any,
    isTextInput?: boolean,
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

  cancelDialog = () => {
    this.props.onCancel();
  };
  confirmDialog = () => {
    this.props.onChange(this.state.date);
  };
  updateDate = (selectedDate: ?Date) => {
    this.setState({
      date: selectedDate,
    });
  };

  render() {
    return (
      <Portal>
        <Dialog
          visible={this.props.isVisible}
          onDismiss={this.cancelDialog}
          dismissable={true}
          style={this.props.style}>
          <Dialog.Title>{this.props.title}</Dialog.Title>
          <Dialog.Content>
            <DateTimePicker
              selected={this.state.date}
              onChange={(date) => this.updateDate(date)}
              inline
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              minDate={minDate}
              maxDate={maxDate}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={this.cancelDialog}>{this.props.cancelText}</Button>
            <Button onPress={this.confirmDialog}>
              {this.props.confirmText}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }
}

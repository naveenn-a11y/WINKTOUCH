import DateTimePicker from 'react-datepicker';
import React, {Component} from 'react';
import {Button, Dialog, Portal} from 'react-native-paper';

import 'react-datepicker/dist/react-datepicker.css';

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
  };
  state: {
    date: Date,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      date: new Date(),
    };
  }

  cancelDialog = () => {
    this.props.onCancel();
  };
  confirmDialog = () => {
    this.props.onChange(this.state.date);
  };
  updateDate = (selectedDate: ?Date) => {
    this.setState({date: selectedDate});
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
                selected={this.props.selected}
                onChange={(date) => this.updateDate(date)}
                inline
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={this.cancelDialog}>
                {this.props.cancelText}
              </Button>
              <Button onPress={this.confirmDialog}>
                {this.props.confirmText}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

    );
  }
}

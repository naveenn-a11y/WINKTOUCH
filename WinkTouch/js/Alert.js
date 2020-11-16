import React, {Component} from 'react';
import {Text, View, ScrollView} from 'react-native';
import {Button, Paragraph, Dialog, Portal, Provider} from 'react-native-paper';
import {isEmpty} from './Util';
import {isWeb} from './Styles';
type AlertProps = {
  style: any,
  title?: string,
  message?: string,
  data?: any,
  dismissable?: boolean,
  confirmActionLabel: string,
  cancelActionLabel: string,
  onConfirmAction: (selectedData: ?any) => void,
  onCancelAction: () => void,
};
type AlertState = {
  visible: boolean,
};

export class Alert extends Component<AlertProps, AlertState> {
  constructor(props: AlertProps) {
    super(props);
    this.state = {
      visible: true,
    };
  }
  static defaultProps = {
    title: '',
    message: '',
    dismissable: false,
  };

  cancelDialog = () => {
    this.setState({visible: false});
    this.props.onCancelAction();
  };
  confirmDialog = (selectedData: ?any) => {
    this.setState({visible: false});
    this.props.onConfirmAction(selectedData);
  };

  renderContent() {
    if (!isEmpty(this.props.message)) {
      return <Paragraph>{this.props.message}</Paragraph>;
    } else if (!isEmpty(this.props.data)) {
      if (this.props.data instanceof Array) {
        return (
          <View style={isWeb ? {Height: 'auto', maxHeight: 200} : undefined}>
            <Dialog.ScrollArea>
              <ScrollView>
                {this.props.data.map((importData: any) => {
                  return (
                    <Button onPress={() => this.confirmDialog(importData)}>
                      {importData.label}
                    </Button>
                  );
                })}
              </ScrollView>
            </Dialog.ScrollArea>
          </View>
        );
      } else {
        return (
          <Button onPress={this.confirmDialog}>{this.props.data.label}</Button>
        );
      }
    } else {
      return null;
    }
  }
  render() {
    return (
      <Provider>
        <Portal>
          <Dialog
            visible={this.state.visible}
            onDismiss={this.cancelDialog}
            dismissable={this.props.dismissable}
            style={this.props.style}>
            <Dialog.Title>{this.props.title}</Dialog.Title>
            <Dialog.Content>{this.renderContent()}</Dialog.Content>
            <Dialog.Actions>
              <Button onPress={this.cancelDialog}>
                {this.props.cancelActionLabel}
              </Button>
              <Button onPress={this.confirmDialog}>
                {this.props.confirmActionLabel}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </Provider>
    );
  }
}

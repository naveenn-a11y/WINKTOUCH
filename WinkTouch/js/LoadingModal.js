import React, { Component } from "react";
import { Text, View, Modal, ActivityIndicator } from "react-native";
import { styles, selectionColor } from "./Styles";

type LoadingModalProps = {
  isLoading: boolean,
};

export class LoadingModal extends Component {
  constructor(props: LoadingModalProps) {
    super(props);
  }

  render() {
    return (
      <Modal
        visible={this.props.isLoading}
        transparent={true}
        animationType={"none"}
      >
        <View
          style={[
            styles.popupBackground,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          {this.props.isLoading && (
            <ActivityIndicator size="large" color={selectionColor} />
          )}
        </View>
      </Modal>
    );
  }
}

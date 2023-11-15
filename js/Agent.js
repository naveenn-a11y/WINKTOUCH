import React, {Component} from 'react';
import {
  Button as RnButton,
  KeyboardAvoidingView,
  Linking,
  StatusBar,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {fontScale, isWeb, styles} from './Styles';
import {strings} from './Strings';
import {Button} from './Widgets';
import {isEmpty} from './Util';
import type {AgentAssumption} from './Types';

export class AgentAsumptionScreen extends Component {
  props: {
    onConfirmLogin: (agent: AgentAssumption) => void,
  };

  state: {
    agent: AgentAssumption,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      agent: {},
    };
  }

  setZendesk = (zendeskRef: ?string) => {
    let agent: AgentAssumption = this.state.agent;
    agent.zendeskRef = zendeskRef;
    this.setState({agent});
  };
  setReason = (reason: ?string) => {
    let agent: AgentAssumption = this.state.agent;
    agent.reason = reason;
    this.setState({agent});
  };
  focusReasonField = () => {
    this.refs.focusField.focus();
  };

  proceedRequest() {
    if (isEmpty(this.state.agent.reason)) {
      alert('Please provide at least the reason of this login');
    } else {
      this.props.onConfirmLogin(this.state.agent);
    }
  }

  render() {
    const style = isWeb
      ? [styles.centeredColumnLayout, {alignItems: 'center'}]
      : styles.centeredColumnLayout;

    return (
      <View style={styles.screeen}>
        <StatusBar hidden={true} />
        <View style={style}>
          <KeyboardAvoidingView behavior="position">
            <View style={style}>
              <View>
                <TouchableOpacity onPress={this.reset}>
                  <Text style={styles.h1}>{strings.agentAssumptionTitle}</Text>
                </TouchableOpacity>
                <Text style={{fontSize: 25 * fontScale, color: 'red'}}>
                  {strings.agentLoginWarning}
                </Text>
              </View>

              <View style={styles.fieldContainer}>
                <TextInput
                  placeholder={strings.zendesk}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  style={styles.field400}
                  value={this.state.agent.zendeskRef}
                  onChangeText={this.setZendesk}
                  onSubmitEditing={this.focusReasonField}
                  testID="agent.zendeskField"
                />
              </View>

              <View style={styles.fieldContainer}>
                <TextInput
                  multiline={true}
                  numberOfLines={10}
                  placeholder={strings.reason}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  style={[styles.formFieldLines, {minWidth: 400 * fontScale}]}
                  value={this.state.agent.reason}
                  onChangeText={this.setReason}
                  onSubmitEditing={() => this.proceedRequest()}
                  testID="agent.reasonField"
                />
              </View>
              <View
                style={
                  isWeb
                    ? (styles.buttonsRowLayout, {flex: 1})
                    : styles.buttonsRowLayout
                }>
                <Button
                  title={strings.submitLogin}
                  disabled={
                    isEmpty(this.state.agent.reason) &&
                    isEmpty(this.state.agent.zendeskRef)
                  }
                  onPress={() => this.proceedRequest()}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    );
  }
}

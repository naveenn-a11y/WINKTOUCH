// @flow
import React, {Component, PureComponent} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Voice from 'react-native-voice';
import RNBeep from 'react-native-a-beep';
import {selectionFontColor, recordingFontColor, isWeb} from './Styles';
import {getUserLanguage} from './Strings';

export class Microphone extends PureComponent {
  props: {
    style: any,
    onSpoke: (text: string) => void,
  };
  recording: boolean = false;

  state: {
    text: string,
    isListening: boolean,
    timer: any,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      text: '',
      isListening: false,
      timer: null,
    };
  }

  async startListening() {
    __DEV__ && console.log('Start listening');
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    this.setState({text: '', isListening: true});
    try {
      await Voice.start(getUserLanguage());
      RNBeep.PlaySysSound(RNBeep.iOSSoundIDs.BeginRecording);
    } catch (e) {
      console.error(e);
      alert('Failed to start listening to your voice.');
    }
  }

  async stopListening() {
    try {
      await Voice.stop();
      RNBeep.PlaySysSound(RNBeep.iOSSoundIDs.EndRecording);
      __DEV__ && console.log('Stopped listening: ' + this.state.text);
      let timer = setTimeout(this.endSpeech.bind(this), 1000);
      this.setState({timer, isListening: false});
    } catch (e) {
      console.error(e);
      this.setState({isListening: false});
      alert('Failed to stop listening to your voice.');
    }
  }

  onSpeechResults(event) {
    let text: string = event.value.join();
    __DEV__ && console.log('Speech result:' + text);
    this.setState({text});
  }

  endSpeech() {
    const text: string = this.state.text;
    __DEV__ && console.log('Final speech: ' + text);
    this.setState({text: '', timer: null});
    if (text !== '' && text !== undefined) {
      this.props.onSpoke(text);
    }
  }

  componentWillUnmount() {
    if (this.state.timer) {
      clearTimeout(this.state.timer);
    }
  }

  render() {
    if (isWeb) return null;
    else
      return (
        <TouchableWithoutFeedback
          onPressIn={() => this.startListening()}
          onPressOut={() => this.stopListening()}>
          <Icon
            name="mic"
            style={this.props.style}
            color={
              this.state.isListening ? recordingFontColor : selectionFontColor
            }
          />
        </TouchableWithoutFeedback>
      );
  }
}

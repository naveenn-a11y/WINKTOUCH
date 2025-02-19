'use strict';

import React, { Component } from 'react';
import {
  Image,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  StatusBar,
  Platform
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import publicIp from 'react-native-public-ip';
import { styles, fontScale, isWeb } from './Styles';
import {
  strings,
  getUserLanguage,
  switchLanguage,
  getUserLanguageIcon,
} from './Strings';
import { Button } from './Widgets';
import { handleHttpError } from './Rest';
import {
  dbVersion,
  touchVersion,
  bundleVersion,
  deploymentVersion,
} from './Version';
import { WINK_APP_ECOMM_URL, WINK_APP_PUBLIC_IP } from '@env';

const eCommUrl = isWeb ? process.env.WINK_APP_ECOMM_URL : WINK_APP_ECOMM_URL;
const getSecurityQuestionsUrl = () => eCommUrl + '/WinkRegistrationQuestions';
const getSecurityQuestionUrl = () => eCommUrl + '/WinkRegistrationEmail?mac=EMRFree&source=touch';
const getRegistrationUrl = () => eCommUrl + '/WinkRegistrationSecurity?mac=EMRPaid&source=touch&touchVersion=true';
const getTouchVersionUrl = () => eCommUrl + '/WinkTouchVersion';

async function fetchIp(): string {
  const ip = await DeviceInfo.getIpAddress();
  return ip;
}

async function fetchPublicIp(): string {
  const ip: string = await publicIp();
  return ip;
}

export let isAtWink: boolean;

async function determineIfAtWink(): void {
  if (Platform.OS === 'web') {
      const publicIp: string = await fetchPublicIp();
      isAtWink = publicIp === process.env.WINK_APP_PUBLIC_IP;
  }

  if (Platform.OS === 'ios') {
    const localIp = await fetchIp();
    if (localIp && localIp.startsWith('192.168.88.')) {
      const publicIp: string = await fetchPublicIp();
      isAtWink = WINK_APP_PUBLIC_IP;
    } else {
      isAtWink = false;
    }
  }
}

determineIfAtWink();

async function fetchSecurityQuestions() {
  const url = getSecurityQuestionsUrl();
  try {
    let httpResponse = await fetch(url, {
      method: 'get',
      headers: {
        'Accept-language': getUserLanguage(),
      },
    });
    if (!httpResponse.ok) {
      handleHttpError(httpResponse);
    }
    let body: string = await httpResponse.text();
    if (!body) {
      return [];
    }
    let questions: string[] = body.split('\n');
    questions = questions.map((question: string) =>
      question.substring(question.indexOf(' ') + 1),
    );
    return questions;
  } catch (error) {
    console.log(error);
    alert(strings.securityQuestionsError);
    throw error;
  }
}

async function fetchSecurityQuestionIndex(email: string) {
  if (!email) {
    return undefined;
  }
  const ip: string = await fetchIp();
  const url =
    getSecurityQuestionUrl() + '&email=' + encodeURIComponent(email) + '&ip=' + ip;
  try {
    let httpResponse = await fetch(url);
    if (!httpResponse.ok) {
      handleHttpError(httpResponse);
    }
    let body: string = await httpResponse.text();
    let questionIndex: number = parseInt(body);
    return questionIndex;
  } catch (error) {
    console.log(error);
    alert(strings.securityQuestionsError);
    throw error;
  }
}

async function fetchRegistration(
  email: string,
  securityQuestionIndex: number,
  securityAnswer: string,
) {
  if (!email || !securityAnswer) {
    return undefined;
  }
  const ip: string = await fetchIp();
  const url =
    getRegistrationUrl() +
    '&email=' +
    encodeURIComponent(email) +
    '&securityQuestion=' +
    encodeURIComponent(securityQuestionIndex) +
    '&answer=' +
    encodeURIComponent(securityAnswer) +
    '&ip=' +
    ip;
  __DEV__ && console.log(url);
  try {
    let httpResponse = await fetch(url, {
      method: 'get',
      headers: {
        Accept: 'application/json',
        'Accept-language': getUserLanguage(),
      },
    });
    if (!httpResponse.ok) {
      handleHttpError(httpResponse);
    }
    let registration: Registration = await httpResponse.json();
    //TODO handle error
    /**
    if (response && response.startsWith('java.lang.Exception: ')) {
      let errorMessage = response.substring(20);
      alert(errorMessage);
      return undefined;
    } */
    return registration;
  } catch (error) {
    console.log(error);
    alert(strings.fetchAccountsError);
    throw error;
  }
}

export async function fetchTouchVersion(path: string): string {
  if (!path) {
    return undefined;
  }
  const url = getTouchVersionUrl() + '?path=' + encodeURIComponent(path);
  __DEV__ && console.log('REQ touch version:' + url);
  try {
    let httpResponse = await fetch(url, {
      method: 'get',
      headers: {
        Accept: 'application/json',
        'Accept-language': getUserLanguage(),
      },
    });
    if (!httpResponse.ok) {
      handleHttpError(httpResponse);
    }
    let touchVersion: string = await httpResponse.text();
    //TODO handle error
    __DEV__ && console.log('RES touch version: ' + touchVersion);
    return touchVersion;
  } catch (error) {
    console.log(error);
    alert(strings.fetchAccountsError);
    throw error;
  }
}

export class RegisterScreen extends Component {
  props: {
    email?: string,
    onRegistered: (registration: Registration) => void,
    onReset: () => void,
  };
  state: {
    email: ?string,
    securityQuestions: string[],
    securityQuestionIndex: ?number,
    securityAnswer: ?string,
  };
  unmounted: boolean;

  constructor(props) {
    super(props);
    this.state = {
      email:
        this.props.email === 'DemoCustomer@downloadwink.com'
          ? undefined
          : this.props.email,
      securityQuestions: [],
      securityQuestionIndex: undefined,
      securityAnswer: undefined,
    };
  }

  componentDidMount() {
    this.unmounted = false;
    this.loadSecurityQuestions();
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.email === this.props.email) {
      return;
    }
    this.loadSecurityQuestions();
    this.setState({
      email: this.props.email,
      securityQuestionIndex: undefined,
      securityAnswer: undefined,
    });
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  async loadSecurityQuestions() {
    let securityQuestions: string[] = await fetchSecurityQuestions();
    if (!this.unmounted) {
      this.setState({securityQuestions});
    }
  }

  async submitEmail(isRegistered: boolean) {
    await fetchPublicIp();
    const email: ?string = this.state.email;
    if (email === undefined || email === null || email.trim().length < 3) {
      alert(strings.enterRegisteredEmail);
      return;
    }
    if (!isRegistered) {
      fetchSecurityQuestionIndex(email);
      const trialRegistration: Registration = {
        email: 'DemoCustomer@downloadwink.com',
        bundle:
          'aJlnFTJv0FBp--NZ8a-epxcISJ69b99414bd-11b8-4bb3-bbb3-8b32aaf3da86',
        path: '/webstart/1904_FCTMZKCLM1_BC',
      };
      this.props.onRegistered(trialRegistration);
      return;
    }
    let securityQuestionIndex: number = await fetchSecurityQuestionIndex(email);
    if (securityQuestionIndex < 0) {
      securityQuestionIndex = undefined;
    }
    if (securityQuestionIndex === undefined) {
      alert(strings.unRegisteredEmail);
    }
    this.setState({securityQuestionIndex});
  }

  async submitSecurityAnswer() {
    const answer: ?string = this.state.securityAnswer;
    if (answer === undefined || answer === null || answer.trim().length === 0) {
      alert(strings.answerSecurityQuestion);
      return;
    }
    let registration: ?Registration = await fetchRegistration(
      this.state.email,
      this.state.securityQuestionIndex,
      this.state.securityAnswer,
    );
    if (
      (registration && registration.bundle === undefined) ||
      registration.bundle === null ||
      registration.bundle.trim() === ''
    ) {
      alert(strings.touchNotConfigured);
      this.resetRegistration();
      return;
    }
    this.props.onRegistered(registration);
  }

  resetRegistration = () => {
    this.props.onReset();
  };

  render() {
    const style = isWeb
      ? [styles.centeredColumnLayout, {alignItems: 'center'}]
      : styles.centeredColumnLayout;
    const buttonsRowLayout = isWeb
      ? [styles.buttonsRowLayout, {flex: 1}]
      : styles.buttonsRowLayout;
    return (
      <View style={styles.screeen}>
        <StatusBar hidden={true} />
        <View style={style}>
          <KeyboardAvoidingView behavior="position">
            <View style={style}>
              <Text style={styles.h1} testID={'screenTitle'}>
                {strings.registrationScreenTitle}
              </Text>
              <Image
                source={require('./image/winklogo-big.png')}
                style={{width: 250 * fontScale, height: 250 * fontScale}}
              />
              {this.state.securityQuestionIndex === undefined && (
                <View style={style}>
                  <Text style={styles.label}>
                    {strings.enterRegisteredEmail}
                  </Text>
                  <View style={{flexDirection: 'row'}}>
                    <View style={{flex: 100}}>
                      <TextInput
                        placeholder={strings.emailAdres}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        style={styles.searchField}
                        value={this.state.email}
                        onChangeText={(email: string) => this.setState({email})}
                        testID={'registration.emailInput'}
                      />
                    </View>
                  </View>
                  <View style={buttonsRowLayout}>
                    <Button
                      title={strings.connectToPms}
                      onPress={() => this.submitEmail(true)}
                      testID={'connectToPmsButton'}
                    />
                    <Button
                      title={strings.tryForFree}
                      onPress={() => this.submitEmail(false)}
                      testID={'tryItButton'}
                    />
                  </View>
                </View>
              )}
              {this.state.securityQuestionIndex !== undefined && (
                <View style={style}>
                  <View>
                    <TouchableOpacity
                      onPress={this.resetRegistration}
                      testID={'resetRegistrationButton'}>
                      <Text style={styles.label}>{this.state.email}</Text>
                    </TouchableOpacity>
                  </View>
                  <View>
                    <Text style={styles.label} testID={'securityQuestion'}>
                      {this.state.securityQuestions !== undefined
                        ? this.state.securityQuestions[
                            this.state.securityQuestionIndex
                          ]
                        : ''}
                    </Text>
                  </View>
                  <View>
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="send"
                      style={styles.field400}
                      value={this.state.securityAnswer}
                      onChangeText={(securityAnswer: string) =>
                        this.setState({securityAnswer})
                      }
                      onSubmitEditing={() => this.submitSecurityAnswer()}
                      testID={'securityAnswerInput'}
                    />
                  </View>
                  <View style={buttonsRowLayout}>
                    <Button
                      title={strings.submitSecurityAnswer}
                      onPress={() => this.submitSecurityAnswer()}
                      testID={'submitSecurityAnswerButton'}
                    />
                  </View>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
        <TouchableOpacity
          style={styles.flag}
          testID={'switchLanguage'}
          onPress={() => {
            switchLanguage();
            this.loadSecurityQuestions();
          }}>
          <Text style={styles.flagFont}>{getUserLanguageIcon()}</Text>
        </TouchableOpacity>
        <Text
          style={{
            position: 'absolute',
            bottom: 20 * fontScale,
            right: 20 * fontScale,
            fontSize: 14 * fontScale,
          }}
          testID={'appVersion'}>
          Version {deploymentVersion}.{touchVersion}.{bundleVersion}.{dbVersion}
        </Text>
      </View>
    );
  }
}

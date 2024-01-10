/**
 * @flow
 */

'use strict';

import React, {Component} from 'react';
import {
  Image,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';
import {styles, fontScale, isWeb} from './Styles';
import {getUserLanguage, strings} from './Strings';
import {Button} from './Widgets';
import {getAccount, getDoctor, getStore} from './DoctorApp';
import {
  getNextRequestNumber,
  getRestUrl,
  getToken,
  handleHttpError,
} from './Rest';
import type {Account, Store, User} from './Types';
import DeviceInfo from 'react-native-device-info';
import base64 from 'base-64';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {CustomModal as Modal} from './utilities/Modal';

export class LockScreen extends Component {
  state: {
    password: ?string,
    isSecureTextEntry: boolean,
  };
  constructor(props: any) {
    super(props);
    this.state = {
      password: undefined,
      isSecureTextEntry: true,
    };
  }

  async login() {
    let doctorLoginUrl = getRestUrl() + 'login/doctors';
    const user: User = getDoctor();
    user.username = await AsyncStorage.getItem('userName'); //no username in getDoctor.
    const token: string = getToken();
    const account: ?Account = getAccount();
    const store: ?Store = getStore();
    if (
      user.username === undefined ||
      user.username === null ||
      user.username.trim().length === 0
    ) {
      return;
    }
    let password: ?string = this.state.password;
    if (password === null || password === undefined) {
      password = '';
    }

    if (!account || !store) {
      return;
    }
    let loginData = {
      accountsId: account.id.toString(),
      storeId: store.storeId.toString(),
      expiration: 24 * 365,
      deviceId: DeviceInfo.getUniqueId(),
    };
    const requestNr = getNextRequestNumber();
    __DEV__ &&
      console.log(
        'REQ ' +
          requestNr +
          ' POST ' +
          doctorLoginUrl +
          ' login for ' +
          user.username,
      );
    try {
      let httpResponse = await fetch(doctorLoginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-language': getUserLanguage(),
          token: token,
          Authorization:
            'Basic ' + base64.encode(user.username + ':' + password),
        },
        body: JSON.stringify(loginData),
      });
      console.log(
        'RES ' +
          requestNr +
          ' POST ' +
          doctorLoginUrl +
          ' login OK for ' +
          user.username +
          ':' +
          httpResponse.ok,
      );
      if (!httpResponse.ok) {
        const contentType: ?string = httpResponse.headers.get('Content-Type');
        if (
          contentType !== undefined &&
          contentType !== null &&
          contentType.startsWith('text/html')
        ) {
          handleHttpError(httpResponse, await httpResponse.text());
        } else {
          handleHttpError(httpResponse, await httpResponse.json());
        }
      }
      let responseJson = await httpResponse.json();
      if (responseJson.success === true || responseJson.user) {
        this.props.route.params.onUserLogin(); //restart tracker
        this.props.navigation.goBack();
      }
    } catch (error) {
      alert(strings.loginFailed + ': ' + error);
    }
  }

  setPassword = (password: ?string) => {
    this.setState({password});
  };

  focusPasswordField = () => {
    this.refs.focusField.focus();
  };

  toggleSecuredTextState(isSecureTextEntry: boolean) {
    this.setState({isSecureTextEntry: !isSecureTextEntry});
    this.focusPasswordField();
  }

  render() {
    return (
      <Modal>
        <View style={styles.centeredScreenLayout}>
          <View
            style={{
              width: '80%',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <KeyboardAvoidingView
              behavior="position"
              style={
                isWeb
                  ? {flex: 1, justifyContent: 'center', flexWrap: 'wrap'}
                  : {}
              }>
              <View
                style={{
                  backgroundColor: '#eee',
                  flexDirection: 'row',
                  padding: '10%',
                  justifyContent: 'space-evenly',
                  borderRadius: 20,
                }}>
                <View>
                  <Image
                    source={require('./image/winklogo-big.png')}
                    style={{
                      width: 250 * fontScale,
                      height: 250 * fontScale,
                    }}
                  />
                </View>
                <View style={{marginLeft: 20, marginRight: 20}} />
                <View>
                  <View style={{marginBottom: 10}}>
                    <Text
                      style={{
                        fontSize: 30,
                        marginBottom: 5,
                        fontWeight: '500',
                      }}>
                      {strings.lockScreenTitle}
                    </Text>
                    <Text style={{fontSize: 12}}>{strings.enterPassword}</Text>
                  </View>

                  <View style={{flexDirection: 'row'}}>
                    <View style={{flexDirection: 'row'}}>
                      <TextInput
                        placeholder={strings.password}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="go"
                        secureTextEntry={this.state.isSecureTextEntry}
                        ref="focusField"
                        style={styles.field400}
                        value={this.state.password}
                        selectTextOnFocus={true}
                        testID="lockscreen.passwordField"
                        onChangeText={this.setPassword}
                        onSubmitEditing={() => this.login()}
                      />
                      <TouchableOpacity 
                        style={{position: 'absolute', right: 0, alignSelf: 'center'}}
                        onPress={() => this.toggleSecuredTextState(this.state.isSecureTextEntry)}
                      >
                        <View>
                          {this.state.isSecureTextEntry 
                          ? 
                          <Icon name="eye" style={[styles.screenIcon, styles.paddingLeftRight10]} color="gray" /> 
                          : 
                          <Icon name="eye-off" style={[styles.screenIcon, styles.paddingLeftRight10]} color="gray" />}
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View
                    style={
                      isWeb
                        ? [styles.buttonsRowLayout, {flex: 1}]
                        : styles.buttonsRowLayout
                    }>
                    <Button
                      onPress={() => this.login()}
                      title={strings.resumeSession}
                    />
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      marginTop: 5,
                      justifyContent: 'flex-end',
                    }}>
                    <Text>
                      {strings.notLabel}{' '}
                      {getDoctor().firstName + ' ' + getDoctor().lastName} ?
                    </Text>
                    <TouchableOpacity
                      style={{marginLeft: 10}}
                      onPress={() =>
                        this.props.route.params.onUserLogout()
                      }>
                      <Text>{strings.logout}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    );
  }
}

/**
 * @flow
 */

'use strict';

import React, {Component} from 'react';
import {
  Button as RnButton,
  Image,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  InteractionManager,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import codePush from 'react-native-code-push';
import DeviceInfo from 'react-native-device-info';
import type {
  Account,
  Store,
  User,
  Registration,
  Visit,
  AgentAssumption,
} from './Types';
import base64 from 'base-64';
import {styles, fontScale, isWeb} from './Styles';
import {Button, ListField, TilesField} from './Widgets';
import {
  strings,
  switchLanguage,
  getUserLanguage,
  getUserLanguageIcon,
} from './Strings';
import {
  getRestUrl,
  handleHttpError,
  getNextRequestNumber,
  getWinkEmrHostFromAccount,
  switchEmrHost,
  searchItems,
} from './Rest';
import {
  dbVersion,
  touchVersion,
  bundleVersion,
  deploymentVersion,
  ecommVersion,
} from './Version';
import {fetchCodeDefinitions} from './Codes';
import {getCurrentHost} from '../scripts/Util';
import {isEmpty} from './Util';
import {cacheItemsById} from './DataCache';
import {AgentAsumptionScreen} from './Agent';

//const accountsUrl = 'https://test1.downloadwink.com:8443/wink-ecomm'+ecommVersion+'/WinkRegistrationAccounts';
const accountsUrl =
  'https://emr.downloadwink.com/wink-ecommV5' + '/WinkRegistrationAccounts';

async function fetchAccounts(path: string) {
  if (!path) {
    return;
  }
  let privileged: boolean = false;
  let emrOnly: boolean = true;
  const url =
    accountsUrl +
    '?dbVersion=' +
    encodeURIComponent(dbVersion) +
    '&path=' +
    encodeURIComponent(path) +
    '&biggerThen=true&privileged=' +
    privileged +
    '&emrOnly=' +
    emrOnly;
  __DEV__ && console.log('Fetching accounts: ' + url);
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
    let accounts: Account[] = await httpResponse.json();
    return accounts;
  } catch (error) {
    console.log(error);
    alert(strings.fetchAccountsError);
    throw error;
  }
}

async function fetchStores(account: Account): Store[] {
  if (account === null || account === undefined) {
    return;
  }
  const searchCriteria = {accountsId: account.id};
  let restResponse = await searchItems('Store/list', searchCriteria);
  const stores: Store[] = restResponse.stores ? restResponse.stores : [];
  cacheItemsById(stores);
  return stores;
}
export class MfaScreen extends Component {
  props: {
    registration: Registration,
    account: Account,
    store: Store,
    userName: String,
    password: String,
    onLogin: (
      account: Account,
      user: User,
      store: Store,
      token: string,
    ) => void,
    onMfaReset: () => void,
    qrImageUrl: ?string,
    onScanQrCode: () => void,
  };

  state: {
    code: ?string,
  };
  constructor(props: any) {
    super(props);
    this.state = {
      code: undefined,
    };
  }

  async verify() {
    let mfaVerifyUrl = getRestUrl() + 'login/verifyCode';
    const userName = this.props.userName;
    const password: ?string = this.props.password;
    const code: ?string = this.state.code;
    if (isEmpty(userName) || isEmpty(password) || isEmpty(code)) {
      return;
    }

    const account: ?Account = this.props.account;
    let store: ?Store = this.props.store;
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
        'REQ ' + requestNr + ' POST ' + mfaVerifyUrl + ' login for ' + userName,
      );
    try {
      let httpResponse = await fetch(mfaVerifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-language': getUserLanguage(),
          Authorization:
            'Basic ' + base64.encode(userName + ':' + password + ':' + code),
        },
        body: JSON.stringify(loginData),
      });
      console.log(
        'RES ' +
          requestNr +
          ' POST ' +
          mfaVerifyUrl +
          ' login OK for ' +
          userName +
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
      let token: string;
      if (isWeb) {
        for (let entry of httpResponse.headers.entries()) {
          if (entry[0] === 'token') {
            token = entry[1];
          }
        }
      } else {
        token = httpResponse.headers.map.token;
      }

      let user: User = responseJson.user;
      store = responseJson.store;
      this.props.onLogin(account, user, store, token);
    } catch (error) {
      alert(strings.loginFailed + ': ' + error);
    }
  }

  async scanCode() {
    let mfaScanUrl = getRestUrl() + 'login/scanCode';
    const userName = this.props.userName;
    const password: ?string = this.props.password;
    if (isEmpty(userName) || isEmpty(password)) {
      return;
    }

    const account: ?Account = this.props.account;
    let store: ?Store = this.props.store;
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
        'REQ ' + requestNr + ' POST ' + mfaScanUrl + ' login for ' + userName,
      );
    try {
      let httpResponse = await fetch(mfaScanUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-language': getUserLanguage(),
          Authorization: 'Basic ' + base64.encode(userName + ':' + password),
        },
        body: JSON.stringify(loginData),
      });
      console.log(
        'RES ' +
          requestNr +
          ' POST ' +
          mfaScanUrl +
          ' login OK for ' +
          userName +
          ':' +
          httpResponse.ok,
      );
      this.props.onScanQrCode();
    } catch (error) {
      alert(strings.loginFailed + ': ' + error);
    }
  }

  setCode = (code: ?string) => {
    this.setState({code});
  };

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
              <Text style={styles.h1}>
                {this.props.qrImageUrl
                  ? strings.mfaCodeScanTitle
                  : strings.mfaCodeVerificationTitle}
              </Text>
              <View>
                <TouchableOpacity
                  onLongPress={this.props.onMfaReset}
                  testID="login.registrationEmail">
                  <Text style={styles.label}>
                    {this.props.registration.email}
                  </Text>
                </TouchableOpacity>
              </View>
              {!this.props.qrImageUrl && (
                <Image
                  source={require('./image/winklogo-big.png')}
                  style={{
                    width: 250 * fontScale,
                    height: 250 * fontScale,
                    margin: 20 * fontScale,
                  }}
                />
              )}
              <View style={styles.fieldContainer}>
                {this.props.qrImageUrl ? (
                  <Image
                    source={{
                      uri: `data:image/png;base64,${this.props.qrImageUrl}`,
                    }}
                    style={{
                      width: 360 * fontScale,
                      height: 360 * fontScale,
                      margin: 20 * fontScale,
                    }}
                  />
                ) : (
                  <TextInput
                    placeholder={strings.enterCode}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="go"
                    secureTextEntry={true}
                    ref="focusField"
                    style={styles.field400}
                    value={this.state.code}
                    selectTextOnFocus={true}
                    testID="login.mfaCodeField"
                    onChangeText={this.setCode}
                    onSubmitEditing={() => this.verify()}
                  />
                )}
              </View>

              <View
                style={
                  isWeb
                    ? (styles.buttonsRowLayout, {flex: 1})
                    : styles.buttonsRowLayout
                }>
                {this.props.qrImageUrl ? (
                  <Button
                    title={strings.mfaCodeScanned}
                    onPress={() => this.scanCode()}
                  />
                ) : (
                  <Button
                    title={strings.verifyCode}
                    onPress={() => this.verify()}
                  />
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
        <TouchableOpacity style={styles.flag} onPress={this.switchLanguage}>
          <Text style={styles.flagFont}>{getUserLanguageIcon()}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.version}
          onLongPress={() =>
            !isWeb
              ? codePush.restartApp()
              : window.location.replace(getCurrentHost())
          }>
          <Text style={styles.versionFont}>
            Version {deploymentVersion}.{touchVersion}.{bundleVersion}.
            {dbVersion}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}
export class LoginScreen extends Component {
  props: {
    registration: Registration,
    onReset: () => void,
    onLogin: (
      account: Account,
      user: User,
      store: Store,
      token: string,
    ) => void,
    onMfaRequired: () => void,
  };
  state: {
    accounts: Account[],
    account: ?string,
    store: ?string,
    userName: ?string,
    password: ?string,
    isTrial: boolean,
    isMfaRequired: ?boolean,
    qrImageUrl: ?string,
    agentAssumptionRequired: ?boolean,
    agent: ?AgentAssumption,
  };
  constructor(props: any) {
    super(props);
    this.state = {
      accounts: [],
      account: undefined,
      store: undefined,
      userName: undefined,
      password: __DEV__ ? 'test' : undefined,
      isTrial: false,
      isMfaRequired: false,
      qrImageUrl: undefined,
      agentAssumptionRequired: false,
      agent: {},
    };
  }
  componentDidUpdate(prevProps: any, prevState: any) {
    if (prevProps.registration !== this.props.registration) {
      this.fetchAccountsStores(this.props.registration);
    }
    if (prevState.account !== this.state.account) {
      let currAccount = this.state.accounts.find(
        (account) => account.name === this.state.account,
      );
      if (currAccount) {
        let store =
          currAccount.stores?.length > 0
            ? this.formatStore(currAccount.stores[0])
            : undefined;
        if (store === undefined) {
          this.fetchStores(currAccount);
        } else {
          this.setStore(store);
        }
      } else if (!currAccount && !this.state.account) {
        this.setStore(undefined);
      }
    }
  }

  async fetchStores(account: Account) {
    const storeStr: string = this.state.store;
    const stores: Store[] = await fetchStores(account);
    let accounts: Account[] = [...this.state.accounts];
    let formattedStore: string;
    if (!isEmpty(storeStr)) {
      formattedStore =
        stores?.length > 0
          ? stores.find(
              (s: Store) =>
                this.formatStore(s).toLowerCase().trim() ===
                storeStr.toLowerCase().trim(),
            )
          : undefined;
    }
    if (isEmpty(formattedStore)) {
      formattedStore =
        stores?.length > 0 ? this.formatStore(stores[0]) : undefined;
    }
    account.stores = stores;
    const index = this.state.accounts.findIndex(
      (a: Account) => a.id === account.id,
    );
    if (index >= 0) {
      accounts[index] = account;
    }
    this.setState({accounts});
    this.setStore(formattedStore);
  }

  async componentDidMount() {
    await this.loadDefaultValues();
    this.fetchAccountsStores(this.props.registration);
  }

  reset = () => {
    AsyncStorage.removeItem('account');
    AsyncStorage.removeItem('store');
    AsyncStorage.removeItem('userName');
    this.props.onReset();
  };

  switchEmrHost = (account: Account) => {
    switchEmrHost(getWinkEmrHostFromAccount(account));
    this.forceUpdate();
  };

  async fetchAccountsStores(registration: Registration) {
    if (!registration) {
      return;
    }
    let accounts: Account[] = await fetchAccounts(this.props.registration.path);
    if (!accounts) {
      accounts = [];
    }
    if (accounts !== this.state.accounts) {
      if (accounts.length === 0) {
        alert(strings.noAccountsWarning);
      }
      const isTrial = registration.email === 'DemoCustomer@downloadwink.com';
      if (!isTrial && accounts.length > 1) {
        accounts = accounts.filter(
          (account: Account) => account.isDemo !== true,
        );
      }
      let account = this.state.account;
      if (account === undefined && accounts.length > 0) {
        account = this.formatAccount(accounts[0]);

        if (accounts[0].stores && accounts[0].stores.length > 0) {
          let store = this.formatStore(accounts[0].stores[0]);
          this.setStore(store);
        } else {
          this.fetchStores(accounts[0]);
        }

        if (isTrial) {
          this.setState(
            {accounts, userName: 'Henry', password: 'Lomb', isTrial},
            this.setAccount(account),
          );
        } else {
          this.setState({accounts, isTrial}, this.setAccount(account));
        }
      } else {
        if (isTrial) {
          this.setState(
            {accounts, userName: 'Henry', password: 'Lomb', isTrial},
            this.fetchCodes(),
          );
        } else {
          this.setState({accounts, isTrial}, this.fetchCodes());
        }

        let currAccount = accounts.find((a: Account) => a.name === account);
        if (currAccount.stores === null || currAccount.stores === undefined) {
          this.fetchStores(currAccount);
        }
      }
    }
  }

  fetchCodes(): void {
    InteractionManager.runAfterInteractions(() => {
      let account: ?Account = this.getAccount();
      if (!account || account.id === undefined) {
        return;
      }
      this.switchEmrHost(account);
      fetchCodeDefinitions(getUserLanguage(), account.id);
    });
  }

  async loadDefaultValues() {
    let account: ?string = await AsyncStorage.getItem('account');
    if (account == null) {
      account = undefined;
    }
    let store: ?string = await AsyncStorage.getItem('store');
    if (store === null) {
      store = undefined;
    }
    let userName: ?string = await AsyncStorage.getItem('userName');
    if (userName === null) {
      userName = undefined;
    }
    this.setState({account, store, userName});
  }

  getAccount(): ?Account {
    const selectedAccount: ?string = this.state.account;
    const account: ?Account = this.state.accounts.find(
      (account: Account) => this.formatAccount(account) === selectedAccount,
    );
    return account;
  }

  setAccount = (account: ?string) => {
    if (
      account === undefined ||
      account === null ||
      account.trim().length === 0
    ) {
      AsyncStorage.removeItem('account');
    } else {
      AsyncStorage.setItem('account', account);
    }
    this.setState({account}, this.fetchCodes());
  };

  formatAccount(account: Account) {
    return account.name;
  }

  setStore = (store: ?string) => {
    if (store === undefined || store === null || store.trim().length === 0) {
      AsyncStorage.removeItem('store');
    } else {
      AsyncStorage.setItem('store', store);
    }
    this.setState({store});
  };

  formatStore(store: Store) {
    return store.name + ' ' + store.city;
  }

  getStore(): ?Store {
    const selectedStore: ?string = this.state.store;
    let account: ?Account = this.getAccount();
    if (!account) {
      return undefined;
    }
    const store: ?Store = account.stores.find(
      (store: Store) => this.formatStore(store) === selectedStore,
    );
    return store;
  }

  setUserName = (userName: ?string) => {
    if (
      userName === undefined ||
      userName === null ||
      userName.trim().length === 0
    ) {
      AsyncStorage.removeItem('userName');
    } else {
      AsyncStorage.setItem('userName', userName);
    }
    this.setState({userName});
  };

  setPassword = (password: ?string) => {
    this.setState({password});
  };

  focusPasswordField = () => {
    this.refs.focusField.focus();
  };

  isOmsUser(): boolean {
    const username: string = this.state.userName;
    if (isEmpty(username)) {
      return false;
    }
    const endPart: string = username.substring(username.indexOf('@'));
    return endPart.toLowerCase().trim() === '@downloadwink.com';
  }

  async processLogin() {
    if (this.isOmsUser()) {
      this.setState({agentAssumptionRequired: true});
    } else {
      this.login();
    }
  }
  async login() {
    let loginPath: string = 'login/doctors';

    let userName = this.state.userName;
    if (
      userName === undefined ||
      userName === null ||
      userName.trim().length === 0
    ) {
      return;
    }
    let password: ?string = this.state.password;
    if (password === null || password === undefined) {
      password = '';
    }
    const account: ?Account = this.getAccount();
    let store: ?Store = this.getStore();
    if (!account || !store) {
      return;
    }
    let loginData = {
      accountsId: account.id.toString(),
      storeId: !isEmpty(store.id)
        ? store.id.toString()
        : store.storeId.toString(),
      expiration: 24 * 365,
      deviceId: DeviceInfo.getUniqueId(),
    };
    if (this.isOmsUser()) {
      loginPath = 'login/oms';
      loginData = {
        accountsId: account.id.toString(),
        storeId: !isEmpty(store.id)
          ? store.id.toString()
          : store.storeId.toString(),
        expiration: 24 * 365,
        deviceId: DeviceInfo.getUniqueId(),
        zendesk: this.state.agent.zendeskRef,
        reason: this.state.agent.reason,
      };
    }
    let doctorLoginUrl = getRestUrl() + loginPath;
    const requestNr = getNextRequestNumber();
    __DEV__ &&
      console.log(
        'REQ ' +
          requestNr +
          ' POST ' +
          doctorLoginUrl +
          ' login for ' +
          userName,
      );
    try {
      let httpResponse = await fetch(doctorLoginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-language': getUserLanguage(),
          Authorization: 'Basic ' + base64.encode(userName + ':' + password),
        },
        body: JSON.stringify(loginData),
      });
      console.log(
        'RES ' +
          requestNr +
          ' POST ' +
          doctorLoginUrl +
          ' login OK for ' +
          userName +
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
      if (responseJson.mfa === true) {
        if (responseJson.secretImageUri) {
          this.setQRImageUrl(responseJson.secretImageUri);
        }
        this.setMfaRequired(true);
      } else {
        let token: string;
        if (isWeb) {
          for (let entry of httpResponse.headers.entries()) {
            if (entry[0] === 'token') {
              token = entry[1];
            }
          }
        } else {
          token = httpResponse.headers.map.token;
        }

        let user: User = responseJson.user;
        store = responseJson.store;
        this.props.onLogin(account, user, store, token);
      }
    } catch (error) {
      alert(strings.loginFailed + ': ' + error);
    }
    this.setState({agentAssumptionRequired: false});
  }

  setQRImageUrl = (qrImageUrl: string) => {
    this.setState({
      qrImageUrl: qrImageUrl,
    });
  };
  setMfaRequired = (mfa: boolean) => {
    this.setState({
      isMfaRequired: mfa,
    });
  };

  setAgentAssumption(agent: AgentAssumption) {
    this.setState({agent}, () => this.login());
  }

  switchLanguage = () => {
    switchLanguage();
    this.forceUpdate();
    this.fetchCodes();
  };

  renderMfaScreen() {
    return (
      <MfaScreen
        registration={this.props.registration}
        account={this.getAccount()}
        store={this.getStore()}
        userName={this.state.userName}
        password={this.state.password}
        onLogin={(account: Account, user: User, store: Store, token: string) =>
          this.props.onLogin(account, user, store, token)
        }
        onMfaReset={() => this.setMfaRequired(false)}
        onScanQrCode={() => this.setQRImageUrl(undefined)}
        qrImageUrl={this.state.qrImageUrl}
      />
    );
  }
  render() {
    if (this.state.isMfaRequired) {
      return this.renderMfaScreen();
    }
    if (this.isOmsUser() && this.state.agentAssumptionRequired) {
      return (
        <AgentAsumptionScreen
          onConfirmLogin={(agent: AgentAssumption) =>
            this.setAgentAssumption(agent)
          }
        />
      );
    }
    const style = isWeb
      ? [styles.centeredColumnLayout, {alignItems: 'center'}]
      : styles.centeredColumnLayout;

    const accountNames: string[] = this.state.accounts.map((account: Account) =>
      this.formatAccount(account),
    );
    const account: ?Account = this.getAccount();
    const storeNames: string[] =
      account && account.stores
        ? account.stores.map((store: Store) => this.formatStore(store))
        : [];
    return (
      <View style={styles.screeen}>
        <StatusBar hidden={true} />
        <View style={style}>
          <KeyboardAvoidingView behavior="position">
            <View style={style}>
              {!this.state.isTrial && (
                <Text style={styles.h1}>{strings.loginscreenTitle}</Text>
              )}
              {this.state.isTrial && (
                <View>
                  <TouchableOpacity onPress={this.reset}>
                    <Text style={styles.h1}>{strings.loginscreenTitle}</Text>
                  </TouchableOpacity>
                  <Text style={{fontSize: 25 * fontScale, color: 'red'}}>
                    {strings.trialWarning}
                  </Text>
                  <RnButton
                    title={strings.winkLink}
                    onPress={() => {
                      Linking.openURL('http://www.downloadwink.com');
                    }}
                  />
                </View>
              )}
              {!this.state.isTrial && (
                <View>
                  <TouchableOpacity
                    onLongPress={this.reset}
                    testID="login.registrationEmail">
                    <Text style={styles.label}>
                      {this.props.registration.email}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              <Image
                source={require('./image/winklogo-big.png')}
                style={{
                  width: 250 * fontScale,
                  height: 250 * fontScale,
                  margin: 20 * fontScale,
                }}
              />
              <View>
                <ListField
                  label={strings.account}
                  freestyle={true}
                  value={this.state.account}
                  style={styles.field400}
                  containerStyle={styles.fieldContainer}
                  options={accountNames}
                  onChangeValue={this.setAccount}
                  popupStyle={styles.alignPopup}
                  simpleSelect={true}
                  renderOptionsOnly={true}
                  isValueRequired={true}
                  testID="login.account"
                />
              </View>
              <View>
                <ListField
                  label={strings.store}
                  freestyle={true}
                  value={this.state.store}
                  style={styles.field400}
                  containerStyle={styles.fieldContainer}
                  options={storeNames}
                  onChangeValue={this.setStore}
                  simpleSelect={true}
                  isValueRequired={true}
                  renderOptionsOnly={true}
                  popupStyle={styles.alignPopup}
                  testID="login.store"
                />
              </View>
              {!this.state.isTrial && (
                <View style={styles.fieldContainer}>
                  <TextInput
                    placeholder={strings.userName}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    style={styles.field400}
                    value={this.state.userName}
                    onChangeText={this.setUserName}
                    onSubmitEditing={this.focusPasswordField}
                    testID="login.userNameField"
                  />
                </View>
              )}
              {!this.state.isTrial && (
                <View style={styles.fieldContainer}>
                  <TextInput
                    placeholder={strings.password}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="go"
                    secureTextEntry={true}
                    ref="focusField"
                    style={styles.field400}
                    value={this.state.password}
                    selectTextOnFocus={true}
                    testID="login.passwordField"
                    onChangeText={this.setPassword}
                    onSubmitEditing={() => this.processLogin()}
                  />
                </View>
              )}
              <View
                style={
                  isWeb
                    ? (styles.buttonsRowLayout, {flex: 1})
                    : styles.buttonsRowLayout
                }>
                <Button
                  title={strings.submitLogin}
                  disabled={account === undefined}
                  onPress={() => this.processLogin()}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
        <TouchableOpacity style={styles.flag} onPress={this.switchLanguage}>
          <Text style={styles.flagFont}>{getUserLanguageIcon()}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.version}
          onLongPress={() =>
            !isWeb
              ? codePush.restartApp()
              : window.location.replace(getCurrentHost())
          }>
          <Text style={styles.versionFont}>
            Version {deploymentVersion}.{touchVersion}.{bundleVersion}.
            {dbVersion}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

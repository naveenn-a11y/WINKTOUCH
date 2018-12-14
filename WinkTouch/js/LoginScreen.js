/**
 * @flow
 */
'use strict';

import React, {Component} from 'react';
import {Image,Text,TextInput,View, TouchableOpacity,ScrollView, AsyncStorage, PanResponder, StatusBar, KeyboardAvoidingView, InteractionManager } from 'react-native';
import type { Account, Store , User , Registration } from './Types';
import base64 from 'base-64';
import {styles, fontScale} from './Styles';
import { Button, TilesField } from './Widgets';
import { strings, switchLanguage, getUserLanguage } from './Strings';
import { restUrl, searchItems, handleHttpError } from './Rest';
import { dbVersion, touchVersion, bundleVersion, deploymentVersion} from './EhrApp';
import { fetchCodeDefinitions} from './Codes';

//const accountsUrl = 'https://test1.downloadwink.com:8443/wink-ecomm/WinkRegistrationAccounts';
const accountsUrl = 'https://ecomm-touch.downloadwink.com/wink-ecomm/WinkRegistrationAccounts';
const doctorLoginUrl = restUrl+'login/doctors';

async function fetchAccounts(path: string) {
  if (!path) return;
  const url = accountsUrl + '?dbVersion='+encodeURIComponent(dbVersion)+'&path='+encodeURIComponent(path)+'&biggerThen=true&priviliged=false';
  try {
    let httpResponse = await fetch(url, {
        method: 'get',
        headers: {
          'Accept-language': getUserLanguage()
        },
    });
    if (!httpResponse.ok) handleHttpError(httpResponse);
    let accounts : Account[] = await httpResponse.json();
    accounts = accounts.filter((account: Account) => account.isDemo!==true);
    return accounts;
  } catch (error) {
    console.log(error);
    alert(strings.fetchAccountsError);
    throw(error);
  }
}

export class LoginScreen extends Component {
  props: {
    registration: Registration,
    onReset: () => void,
    onLogin: (user: User, store: Store, token: string) => void,
  }
  state: {
    accounts: Account[],
    account: ?string,
    store: ?string,
    userName: ?string,
    password: ?string
  }
  constructor(props: any) {
    super(props);
    this.state = {
      accounts: [],
      account: undefined,
      store: undefined,
      userName: undefined,
      password: __DEV__?'12345':undefined
    };
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.registration!==this.props.registration)
      this.fetchAccountsStores(nextProps.registration);
  }

  async componentWillMount() {
    await this.loadDefaultValues();
    this.fetchAccountsStores(this.props.registration);
  }

  reset = () => {
      AsyncStorage.removeItem('account');
      AsyncStorage.removeItem('store');
      AsyncStorage.removeItem('userName');
      this.props.onReset();
  }

  async fetchAccountsStores(registration: Registration) {
    if (!registration) return;
    let accounts : Account[] = await fetchAccounts(this.props.registration.path);
    if (!accounts) accounts = [];
    if (accounts !== this.state.accounts) {
      if (accounts.length===0) {
        alert(strings.noAccountsWarning);
      }
      let account = this.state.account;
      if (account===undefined && accounts.length>0) {
        account = this.formatAccount(accounts[0]);
        let store = (accounts.length>0 && accounts[0].stores && accounts[0].stores.length>0)?this.formatStore(accounts[0].stores[0]):undefined;
        this.setStore(store);
        this.setState({accounts}, this.setAccount(account));
      } else {
        this.setState({accounts}, this.fetchCodes());
      }
    }
  }

  fetchCodes() : void {
    InteractionManager.runAfterInteractions(() => {
      let account : ?Account = this.getAccount();
      if (!account || account.id===undefined) return;
      fetchCodeDefinitions(getUserLanguage(), account.id);
    });
  }

  async loadDefaultValues() {
    let account: ?string = await AsyncStorage.getItem('account');
    if (account==null) account = undefined;
    let store : ?string = await AsyncStorage.getItem('store');
    if (store===null) store = undefined;
    let userName : ?string = await AsyncStorage.getItem('userName');
    if (userName===null) userName = undefined;
    this.setState({account, store, userName});
  }

  getAccount() : ?Account {
    const selectedAccount : ?string = this.state.account;
    const account : ?Account = this.state.accounts.find((account: Account) => this.formatAccount(account) === selectedAccount);
    return account;
  }

  setAccount = (account: ?string) => {
    if (account===undefined || account===null || account.trim().length===0) AsyncStorage.removeItem('account')
    else AsyncStorage.setItem('account', account);
    this.setState({account}, this.fetchCodes());
  }

  formatAccount(account: Account) {
    return account.name;
  }

  setStore = (store: ?string) => {
    if (store===undefined || store===null || store.trim().length===0) AsyncStorage.removeItem('store')
    else AsyncStorage.setItem('store', store);
    this.setState({store});
  }

  formatStore(store: Store) {
    return store.name + ' ' + store.city;
  }

  getStore() : ?Store {
    const selectedStore : ?string = this.state.store;
    let account : ?Account = this.getAccount();
    if (!account) return undefined;
    const store : ?Store = account.stores.find((store: Store) => this.formatStore(store) === selectedStore);
    return store;
  }

  setUserName = (userName: ?string) => {
    if (userName === undefined || userName ===null || userName.trim().length===0) AsyncStorage.removeItem('userName')
    else AsyncStorage.setItem('userName', userName);
    this.setState({userName});
  }

  setPassword = (password: ?string) => {
    this.setState({password});
  }

  focusPasswordField = () => {
    this.refs.focusField.focus();
  }

  async login() {
    let userName = this.state.userName;
    if (userName===undefined || userName===null || userName.trim().length===0)
      return;
    let password: ?string = this.state.password;
    if (password===null || password===undefined) password = '';
    const account: ?Account = this.getAccount();
    const store: ?Store = this.getStore();
    if (!account || !store) return;
    let loginData = {accountsId: (account.id).toString(), storeId: (store.storeId).toString()};
    try {
        let httpResponse = await fetch(doctorLoginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Accept-language': getUserLanguage(),
                'expiration' : (24 * 31 * 12).toString(), //1 year
                'Authorization': 'Basic ' + base64.encode(userName + ':' + password)
            },
            body: JSON.stringify(loginData)
        });
        if (!httpResponse.ok) {
          const contentType : ?string = httpResponse.headers.get('Content-Type');
          if (contentType!==undefined && contentType!==null && contentType.startsWith('text/html'))
            handleHttpError(httpResponse, await httpResponse.text());
          else
            handleHttpError(httpResponse, await httpResponse.json());
        }
        let token : string = httpResponse.headers.map.token;
        let user : User = (await httpResponse.json()).user;
        this.props.onLogin(user, store, token);
    } catch (error) {
        alert(strings.loginFailed+ ': '+error);
    }
  }

  switchLanguage = () => {
    switchLanguage();
    this.forceUpdate();
    this.fetchCodes();
  }

  render() {
      const accountNames: string[] =  this.state.accounts.map((account: Account) => this.formatAccount(account));
      const account : ?Account = this.getAccount();
      const storeNames : string[] = (account&&account.stores)?account.stores.map((store: Store) => this.formatStore(store)):[];
      return <View style={styles.screeen}>
        <StatusBar hidden={true} />
        <View style={styles.centeredColumnLayout}>
          <KeyboardAvoidingView behavior='position'>
            <View style={styles.centeredColumnLayout}>
              <Text style={styles.h1}>{strings.loginscreenTitle}</Text>
              <View><TouchableOpacity onLongPress={this.reset}><Text style={styles.label}>{this.props.registration.email}</Text></TouchableOpacity></View>
              <Image source={require('./image/winklogo-big.png')} style={{width: 250 *fontScale, height: 250 *fontScale, margin: 20 * fontScale}}/>
              <View><TilesField label={strings.account} value={this.state.account} style={styles.field400} containerStyle={styles.fieldContainer} options={accountNames} onChangeValue={this.setAccount}/></View>
              <View><TilesField label={strings.store} value={this.state.store} style={styles.field400} containerStyle={styles.fieldContainer} options={storeNames} onChangeValue={this.setStore}/></View>
              <View style={styles.fieldContainer}><TextInput placeholder={strings.userName} autoCapitalize='none' autoCorrect={false} returnKeyType='next' style={styles.field400} value={this.state.userName}
                  onChangeText={this.setUserName} onSubmitEditing={this.focusPasswordField}/></View>
              <View style={styles.fieldContainer}><TextInput placeholder={strings.password} autoCapitalize='none' autoCorrect={false} returnKeyType='go' secureTextEntry={true} ref='focusField'
                  style={styles.field400} value={this.state.password}
                  onChangeText={this.setPassword} onSubmitEditing={() => this.login()}/></View>
              <View style={styles.buttonsRowLayout}>
                <Button title={strings.submitLogin} disabled={account===undefined} onPress={() => this.login()} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
        <TouchableOpacity style={styles.flag} onPress={this.switchLanguage}><Text style={styles.flagFont}>{strings.getLanguage()==='fr'?'🇫🇷':'🇺🇸'}</Text></TouchableOpacity>
        <Text style={{position: 'absolute', bottom:20 * fontScale, right:  20 * fontScale, fontSize: 14 * fontScale}}>Version {deploymentVersion}.{touchVersion}.{bundleVersion}.{dbVersion}</Text>
      </View>
  }
}

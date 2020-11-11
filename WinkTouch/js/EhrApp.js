/**
 * @flow
 */
'use strict';
import React, {Component} from 'react';
import {
  View,
  TextInput,
  StatusBar,
  AppState,
  InteractionManager,
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';

import codePush, {SyncStatus} from 'react-native-code-push';
import type {Registration, Store, User} from './Types';
import {fetchItemById} from './Rest';
import {LoginScreen} from './LoginScreen';
import {DoctorApp} from './DoctorApp';
import {RegisterScreen, fetchTouchVersion} from './Registration';
import {setDeploymentVersion, checkBinaryVersion} from './Version';
import {getVisitTypes, fetchVisitTypes} from './Visit';
import {fetchUserDefinedCodes} from './Codes';
import {isWeb} from './Styles';

!isWeb && codePush.getCurrentPackage().then(currentPackage => {if (currentPackage!==null && currentPackage!==undefined) setDeploymentVersion(currentPackage.label)});

function logUpdateStatus(status: number) {
  switch (status) {
    case SyncStatus.CHECKING_FOR_UPDATE:
      console.log('CodePush Checking for update');
      break;
    case SyncStatus.AWAITING_USER_ACTION:
      console.log('CodePush Waiting for user action');
      break;
    case SyncStatus.DOWNLOADING_PACKAGE:
      console.log('CodePush Downloading package');
      break;
    case SyncStatus.INSTALLING_UPDATE:
      console.log('CodePush Installing update');
      break;
    case SyncStatus.UP_TO_DATE:
      console.log('CodePush Package up to date');
      break;
    case SyncStatus.UPDATE_INSTALLED:
      console.log('CodePush Package installed');
      codePush.notifyAppReady();
      break;
    case SyncStatus.UPDATE_IGNORED:
      console.log('CodePush Updated ignored');
      break;
    case SyncStatus.UNKNOWN_ERROR:
      console.log('CodePush Unknown error');
      break;
    case SyncStatus.INSTALLING_UPDATE:
      console.log('CodePush Installing update');
      break;
    default:
      console.log('CodePush Status: ' + status);
  }
}

let lastUpdateCheck: ?Date = undefined;

export async function checkAndUpdateDeployment(registration: ?Registration) {
  if (__DEV__) {
    console.log('Checking and updating bundle (not on dev).');
    checkBinaryVersion();
    return;
  }
  if (!registration || !registration.path) return;
  checkBinaryVersion();
  try {
    let codePushBundleKey = await fetchTouchVersion(registration.path);
    //if (lastUpdateCheck && ((new Date()).getTime()-lastUpdateCheck.getTime())<1*60000) return; //Prevent hammering code-push servers
    if (registration.bundle !== codePushBundleKey) {
      registration.bundle = codePushBundleKey;
      if (registration.bundle) {
        AsyncStorage.setItem('bundle', registration.bundle);
      } else {
        AsyncStorage.removeItem('bundle');
      }
    }
  } catch (error) {
    __DEV__ && console.log('Fetching touch version failed: ' + error);
  }

  __DEV__ &&
    console.log('checking code-push deployment key:' + registration.bundle);
  lastUpdateCheck = new Date();
  //let packageVersion = await codePush.checkForUpdate(registration.bundle);
  //alert(packageVersion==null?'no update available for '+registration.bundle:'Update available for '+registration.bundle+' '+packageVersion.label);
  codePush.disallowRestart();
  await codePush.sync(
    {
      updateDialog: false,
      deploymentKey: registration.bundle,
      installMode: codePush.InstallMode.IMMEDIATE,
    },
    logUpdateStatus,
  );
  codePush.allowRestart();
}

export class EhrApp extends Component {
  state: {
    isRegistered: boolean,
    isLoggedOn: boolean,
    isLocked: boolean,
    registration: ?Registration,
    account: ?Account,
    user: ?User,
    store: ?Store,
    token: ?string,
  };

  constructor() {
    super();
    this.state = {
      isRegistered: false,
      isLoggedOn: false,
      isLocked: false,
      registration: undefined,
      account: undefined,
      user: undefined,
      store: undefined,
      token: undefined,
    };
  }

  reset = () => {
    AsyncStorage.removeItem('path');
    AsyncStorage.removeItem('bundle');
    AsyncStorage.removeItem('userName');
    let registration: ?Registration = this.state.registration;
    if (registration) {
      (registration.path = undefined), (registration.bundle = undefined);
    }
    this.setState({
      isRegistered: false,
      isLoggedOn: false,
      registration,
      account: null,
      user: null,
      store: null,
    });
  };

  setRegistration(registration?: Registration) {
    const isRegistered: boolean =
      registration != undefined &&
      registration != null &&
      registration.email != undefined &&
      registration.path != undefined &&
      registration.bundle !== undefined &&
      registration.bundle !== null &&
      registration.bundle.length > 0;
    this.setState(
      {isRegistered, registration},
      () => isRegistered && this.checkForUpdate(),
    );
  }

  async safeRegistration(registration: Registration) {
    if (registration === undefined || registration === null) {
      AsyncStorage.removeItem('bundle');
    } else {
      if (registration.email) {
        AsyncStorage.setItem('email', registration.email);
      } else {
        AsyncStorage.removeItem('email');
      }
      if (registration.bundle) {
        AsyncStorage.setItem('bundle', registration.bundle);
      } else {
        AsyncStorage.removeItem('bundle');
      }
      if (registration.path) {
        AsyncStorage.setItem('path', registration.path);
      } else {
        AsyncStorage.removeItem('path');
      }
    }
    this.setRegistration(registration);
  }

  userLoggedOn = (
    account: Account,
    user: User,
    store: Store,
    token: string,
  ) => {
    this.checkForUpdate();
    this.setState({
      isLoggedOn:
        account !== undefined &&
        user !== undefined &&
        token !== undefined &&
        store !== undefined,
      account,
      user,
      store,
      token,
    });
    if (this.state.isLoggedOn && isWeb) {
      AsyncStorage.setItem('userAccount', JSON.stringify(account));
      AsyncStorage.setItem('userStore', JSON.stringify(store));
      AsyncStorage.setItem('token', token);
      AsyncStorage.setItem('user', JSON.stringify(user));
    }

    fetchVisitTypes();
    fetchUserDefinedCodes();
  };

  logout = () => {
    this.setState({
      isLoggedOn: false,
      token: undefined,
      user: undefined,
      account: undefined,
      store: undefined,
    });
    lastUpdateCheck = undefined;
    if (isWeb) {
      AsyncStorage.removeItem('userAccount');
      AsyncStorage.removeItem('userStore');
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('user');
    }

    this.checkForUpdate();
  };

  checkForUpdate() {
    checkAndUpdateDeployment(this.state.registration);
  }

  async loadRegistration() {
    const email: string = await AsyncStorage.getItem('email');
    const bundle: string = await AsyncStorage.getItem('bundle');
    const path: string = await AsyncStorage.getItem('path');
    const registration: Registration = {email, bundle, path};
    console.log(
      'WinkTouch app is registered to : ' +
        email +
        ' bundle: ' +
        bundle +
        ' path: ' +
        path,
    );
    this.setRegistration(registration);
  }

  startLockingDog() {
    //TODO
  }
  async loadUserInfo() {
    const account: Account = await AsyncStorage.getItem('userAccount');
    const store: Store = await AsyncStorage.getItem('userStore');
    const user: string = await AsyncStorage.getItem('user');
    const token: string = await AsyncStorage.getItem('token');
    console.log('Account: ' + JSON.stringify(account));
    console.log('Store: ' + JSON.stringify(store));
    console.log('User: ' + JSON.stringify(user));
    console.log('Token: ' + JSON.stringify(token));
    this.setState({
      isLoggedOn:
        account !== undefined &&
        account !== null &&
        user !== undefined &&
        user !== null &&
        token !== undefined &&
        token !== null &&
        store !== undefined &&
        store !== null,
      account,
      user,
      store,
      token,
    });
  }

  componentDidMount() {
    this.loadRegistration();
    isWeb && this.loadUserInfo();
    this.startLockingDog();
    //let updateTimer = setInterval(this.checkForUpdate.bind(this), 1*3600000); //Check every hour in alpha stage
    //this.setState({updateTimer});
    AppState.addEventListener('change', this.onAppStateChange.bind(this));
  }

  componentWillUnmount() {
    //if (this.state.updateTimer) {
    //  clearInterval(this.state.updateTimer);
    //}
    AppState.removeEventListener('change', this.onAppStateChange.bind(this));
  }

  onAppStateChange(nextState: any) {
    __DEV__ && console.log('next app state =' + nextState);
    if (nextState === 'active') {
      this.checkForUpdate();
    }
  }

  render() {
    if (!this.state.isRegistered) {
      return (
        <RegisterScreen
          email={
            this.state.registration ? this.state.registration.email : undefined
          }
          onReset={this.reset}
          onRegistered={(registration: Registration) =>
            this.safeRegistration(registration)
          }
        />
      );
    }
    if (!this.state.isLoggedOn) {
      return (
        <LoginScreen
          registration={this.state.registration}
          onLogin={this.userLoggedOn}
          onReset={this.reset}
        />
      );
    }

    return (
      <DoctorApp
        registration={this.state.registration}
        account={this.state.account}
        user={this.state.user}
        token={this.state.token}
        store={this.state.store}
        onLogout={this.logout}
      />
    );
  }
}

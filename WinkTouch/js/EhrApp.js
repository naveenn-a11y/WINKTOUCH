/**
 * @flow
 */
'use strict';
import React, {Component} from 'react';
import {View, ActivityIndicator, AppState, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import codePush, {SyncStatus} from 'react-native-code-push';
import type {Registration, Store, User} from './Types';
import {LoginScreen} from './LoginScreen';
import {DoctorApp} from './DoctorApp';
import {RegisterScreen, fetchTouchVersion} from './Registration';
import {setDeploymentVersion, checkBinaryVersion} from './Version';
import {AppUpdateScreen} from './AppUpdate';
import {isIos, isWeb} from './Styles';
import InactivityTracker from './utilities/InactivityTracker';
import NavigationService from './utilities/NavigationService';
import RemoteConfig from './utilities/RemoteConfig';

!isWeb &&
  codePush.getCurrentPackage().then((currentPackage) => {
    if (currentPackage !== null && currentPackage !== undefined) {
      setDeploymentVersion(currentPackage.label);
    }
  });

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

let lastUpdateCheck: ?Date;

export async function checkAndUpdateDeployment(registration: ?Registration) {
  if (__DEV__) {
    console.log('Checking and updating bundle (not on dev).');
    checkBinaryVersion();
    return;
  }
  if (!registration || !registration.path) {
    return;
  }
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
  if (!isWeb) {
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
    isMfaProvided: ?boolean,
    isUpdateRequired: Boolean,
    latestBuild: number,
    latestVersion: number,
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
      loading: true,
      isMfaProvided: false,
      isUpdateRequired: false,
      latestBuild: 1,
      latestVersion: 1,
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
      isMfaProvided: false,
    });
  };

  mfaRequired = () => {
    this.setState({
      isMfaProvided: true,
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
      {isRegistered, registration, loading: false},
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

  async userLoggedOn(
    account: Account,
    user: User,
    store: Store,
    token: string,
  ) {
    this.checkForUpdate();
    const isLoggedOn: boolean =
      account !== undefined &&
      user !== undefined &&
      token !== undefined &&
      store !== undefined;
    this.setState(
      {
        isLoggedOn,
        account,
        user,
        store,
        token,
      },
      () => console.log('done set loading'),
    );
  }

  logout = () => {
    this.setState({
      isLoggedOn: false,
      token: undefined,
      user: undefined,
      account: undefined,
      store: undefined,
      isMfaProvided: false,
    });
    lastUpdateCheck = undefined;
    this.tracker && this.tracker.stop();
    this.checkForUpdate();
  };

  checkForUpdate() {
    checkAndUpdateDeployment(this.state.registration);
    this.checkAppstoreUpdateNeeded();
  }

  async loadRegistration() {
    const email: string = await AsyncStorage.getItem('email');
    const bundle: string = await AsyncStorage.getItem('bundle');
    const path: string = await AsyncStorage.getItem('path');
    const registration: Registration = {email, bundle, path};
    console.log(
      'WINKemr app is registered to : ' +
        email +
        ' bundle: ' +
        bundle +
        ' path: ' +
        path,
    );
    this.setRegistration(registration);
  }

  async checkAppstoreUpdateNeeded() {
    if (isIos) {
      const {isUpdateRequired, latestBuild, latestVersion} =
        await RemoteConfig.shouldUpdateApp();
      this.setState({isUpdateRequired, latestBuild, latestVersion});
    }
  }

  startLockingDog(ttlInMins?: number) {
    this.tracker = new InactivityTracker({
      ttlInMins: ttlInMins ? ttlInMins : 5, //to be safe, 5min is default value
      onSessionTimeout: () => {
        this.lockScreen();
      },
      onResume: () => {
        this.unlockScreen();
      },
    });

    this.tracker.start(); //start inactivity tracker
  }

  lockScreen() {
    //navigate to lock screen
    this.setState({
      isLocked: true,
    });
  }

  unlockScreen() {
    this.setState({
      isLocked: false,
    });
  }

  onUserLogin = () => {
    this.tracker && this.tracker.start();
  };

  async componentDidMount() {
    //let updateTimer = setInterval(this.checkForUpdate.bind(this), 1*3600000); //Check every hour in alpha stage
    //this.setState({updateTimer});
    isIos && (await RemoteConfig.activateRemoteConfig());
    AppState.addEventListener('change', this.onAppStateChange.bind(this));
    await this.loadRegistration();
  }

  componentWillUnmount() {
    //if (this.state.updateTimer) {
    //  clearInterval(this.state.updateTimer);
    //}
    AppState.removeEventListener('change', this.onAppStateChange.bind(this));
  }

  componentDidUpdate(prevProp, prevState) {
    if (prevState.isLocked != this.state.isLocked) {
      if (!this.state.isLocked) {
        NavigationService.dismissLockScreen();
      }
      if (this.state.isLoggedOn && this.state.isLocked) {
        NavigationService.navigate('lock', {
          onUserLogin: this.onUserLogin,
          onUserLogout: this.logout,
        });
      }
    }
  }

  onAppStateChange(nextState: any) {
    __DEV__ && console.log('next app state =' + nextState);
    if (nextState === 'active') {
      this.checkForUpdate();
      this.tracker && this.tracker.appIsActive();
    }
    if (nextState === 'background') {
      this.tracker && this.tracker.appIsInBackground();
    }
  }
  setLoading = (loading) => {
    this.setState({loading});
  };

  render() {
    if (this.state.loading) {
      return (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
    if (this.state.isUpdateRequired) {
      return (
        <AppUpdateScreen
          latestBuild={this.state.latestBuild}
          latestVersion={this.state.latestVersion}
        />
      );
    }
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
          onLogin={(
            account: Account,
            user: User,
            store: Store,
            token: string,
          ) => this.userLoggedOn(account, user, store, token)}
          onMfaRequired={this.mfaRequired}
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
        onStartLockingDog={(ttlInMins: number) =>
          this.startLockingDog(ttlInMins)
        }
      />
    );
  }
}

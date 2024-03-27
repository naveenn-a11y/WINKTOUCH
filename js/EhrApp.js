/**
 * @flow
 */

'use strict';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Component } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import codePush, { SyncStatus } from 'react-native-code-push';
import { DefaultTheme, Provider } from 'react-native-paper';
import { AppUpdateScreen } from './AppUpdate';
import { DoctorApp } from './DoctorApp';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './Registration';
import { isIos, isWeb } from './Styles';
import type { Registration, Store, User } from './Types';
import { deepClone, sleep } from './Util';
import {
  checkBinaryVersion,
  setDeploymentVersion,
} from './Version';
import { NetworkInfo } from './Widgets';
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
    default:
      console.log('CodePush Status: ' + status);
  }
}

let lastUpdateCheck: ?Date;

export async function syncWithCodepush(codepushEnvironmentKey?: String) {
  if (isWeb) return;
  if (__DEV__) {
    console.log(
      'Checking and updating codepush bundle if needed (not on dev).',
    );
    return;
  }
  if (!codepushEnvironmentKey) {
    return;
  }
  checkBinaryVersion();

  __DEV__ &&
    console.log(
      'syncing code-push deployment with key:' + codepushEnvironmentKey,
    );
  lastUpdateCheck = new Date();
  codePush.disallowRestart();
  await codePush.sync(
    {
      updateDialog: false,
      deploymentKey: codepushEnvironmentKey,
      installMode: codePush.InstallMode.IMMEDIATE,
    },
    logUpdateStatus,
  );
  codePush.allowRestart();
}

async function refreshWebDeployment(codePushEnvironmentKey: String, delaySeconds: number = 0) {
  if (!isWeb) return;
  if (delaySeconds>0) {
    console.log('Waiting '+delaySeconds+' seconds to refresh browser');
    await sleep(delaySeconds*1000);
  }
  console.log('Refreshing webapp with web bundle for environment '+codePushEnvironmentKey);
  await AsyncStorage.setItem('bundle', codePushEnvironmentKey);
  window.location.reload();
}

const theme = {
  ...DefaultTheme,
  dark: false,
};

let netInfoListener = null;
let appStateListener = null;

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
    showNetworkInfo: boolean,
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
      showNetworkInfo: false,
    };
  }

  resetApp = () => {
    AsyncStorage.removeItem('path');
    if (!isWeb) AsyncStorage.removeItem('bundle');
    AsyncStorage.removeItem('userName');
    let registration = deepClone(this.state.registration);
    registration.path = null;
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

  async loadRegistration() {
    const email: string = await AsyncStorage.getItem('email');
    const bundle: string = await AsyncStorage.getItem('bundle');
    const path: string = await AsyncStorage.getItem('path');
    const registration: Registration = {email, bundle, path};
    __DEV__ && console.log('Loading registration from storage: ' + JSON.stringify(registration));
    this.setRegistration(registration);
  }

  async setRegistration(registration?: Registration) {
    const isRegistered: boolean =
      registration !== undefined &&
      registration != null &&
      registration.email !== undefined &&
      registration.path !== undefined &&
      registration.bundle !== undefined &&
      registration.bundle !== null &&
      registration.bundle.length > 0;
    this.setState(
      {isRegistered, registration, loading: false},
      () => isRegistered && this.checkForCodepushUpdate(),
    );
  }

  async safeRegistration(registration: Registration) {
    const currentBundle = await AsyncStorage.getItem('bundle');
    if (registration === undefined || registration === null) {
      if (!isWeb) AsyncStorage.removeItem('bundle');
    } else {
      registration = deepClone(registration);
      if (registration.email) {
        AsyncStorage.setItem('email', registration.email);
      } else {
        AsyncStorage.removeItem('email');
      }
      if (registration.bundle) {
        AsyncStorage.setItem('bundle', registration.bundle);
      } else {
        if (!isWeb) AsyncStorage.removeItem('bundle');
      }
      if (registration.path) {
        AsyncStorage.setItem('path', registration.path);
      } else {
        AsyncStorage.removeItem('path');
      }
      if (registration.bundle && registration.bundle!==currentBundle) {
        console.log('Registration changed bundle from '+this.state.registration.bundle+' to '+registration.bundle);
        if (isWeb) {
          refreshWebDeployment(registration.bundle);
          return;
        }
        else syncWithCodepush(registration.bundle);
      } else {
        console.log('Web registration bundle did not change and still is '+registration.bundle);
      }
    }
    await this.setRegistration(registration);
  }

  async userLoggedOn(
    account: Account,
    user: User,
    store: Store,
    token: string,
  ) {
    if (!isWeb) this.checkForCodepushUpdate();
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
      }
    );
  }

  logout = () => {
    if (isWeb) {
      refreshWebDeployment(this.state.registration?.bundle, .2);
      return;
    }
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
    if (!isWeb) this.checkForCodepushUpdate();
  };

  checkForCodepushUpdate() {
    syncWithCodepush(this.state.registration?.bundle);
    this.checkAppstoreUpdateNeeded();
  }

  async checkAppstoreUpdateNeeded() {
    if (isIos) {
      const {isUpdateRequired, latestBuild, latestVersion} = await RemoteConfig.shouldUpdateApp();
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

  handleConnectivityChange = state => {
    __DEV__ && console.log("Internet Info: ", state)
    this.setState({
      showNetworkInfo: !(state.isConnected && state.isInternetReachable)
    })
  }

  async componentDidMount() {
    //let updateTimer = setInterval(this.checkForUpdate.bind(this), 1*3600000); //Check every hour in alpha stage
    //this.setState({updateTimer});
    NetInfo.configure({
      reachabilityLongTimeout: 60 * 1000, // 60s
      reachabilityShortTimeout: 3 * 1000, // 5s
      reachabilityRequestTimeout: 15 * 1000, // 15s
      reachabilityShouldRun: () => true,
      shouldFetchWiFiSSID: false, // met iOS requirements to get SSID. Will leak memory if set to true without meeting requirements.
      useNativeReachability: true
    });
    netInfoListener = NetInfo.addEventListener(this.handleConnectivityChange);
    isIos && (await RemoteConfig.activateRemoteConfig());
    appStateListener = AppState.addEventListener('change', this.onAppStateChange.bind(this));
    await this.loadRegistration();
  }

  componentWillUnmount() {
    //if (this.state.updateTimer) {
    //  clearInterval(this.state.updateTimer);
    //}
    netInfoListener();
    appStateListener.remove();
  }

  componentDidUpdate(prevProp, prevState) {
    if (prevState.isLocked !== this.state.isLocked) {
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
    if (nextState === 'active') {
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
        <Provider theme={theme}>
          <AppUpdateScreen
            latestBuild={this.state.latestBuild}
            latestVersion={this.state.latestVersion}
          />
          {this.state.showNetworkInfo && <NetworkInfo />}
        </Provider>
      );
    }
    if (!this.state.isRegistered) {
      return (
        <Provider theme={theme}>
          <RegisterScreen
            email={
              this.state.registration ? this.state.registration.email : undefined
            }
            onReset={this.resetApp}
            onRegistered={(registration: Registration) =>
              this.safeRegistration(registration)
            }
          />
          {this.state.showNetworkInfo && <NetworkInfo />}
        </Provider>
      );
    }
    if (!this.state.isLoggedOn) {
      return (
        <Provider theme={theme}>
          <LoginScreen
            registration={this.state.registration}
            onLogin={(
              account: Account,
              user: User,
              store: Store,
              token: string,
            ) => this.userLoggedOn(account, user, store, token)}
            onMfaRequired={this.mfaRequired}
            onReset={this.resetApp}
          />
          {this.state.showNetworkInfo && <NetworkInfo />}
        </Provider>
      );
    }
    return (
      <Provider theme={theme}>
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
        {this.state.showNetworkInfo && <NetworkInfo />}
      </Provider>
    );
  }
}

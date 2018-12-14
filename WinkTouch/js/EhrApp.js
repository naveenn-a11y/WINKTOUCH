/**
 * @flow
 */
'use strict';
import React, {Component} from 'react';
import {View, TextInput, StatusBar, AsyncStorage} from 'react-native';
import codePush , { SyncStatus } from 'react-native-code-push';
import DeviceInfo from 'react-native-device-info';
import type { Registration , Store, User} from './Types';
import { LoginScreen } from './LoginScreen';
import { DoctorApp } from './DoctorApp';
import { RegisterScreen } from './Registration';

export let deploymentVersion: string = 'vx';
export const dbVersion : string = '1187'; //TODO move to plist
export const touchVersion: string = DeviceInfo.getVersion();
export const bundleVersion: string = DeviceInfo.getBuildNumber(); //

codePush.getCurrentPackage().then(currentPackage => {if (currentPackage!==null && currentPackage!==undefined) deploymentVersion = currentPackage.label});

function logUpdateStatus(status: number) {
  switch (status) {
   case SyncStatus.CHECKING_FOR_UPDATE:
        console.log('CodePush Checking for update')
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
      console.log('CodePush Status: '+status);
    }
}

export async function checkAndUpdateDeployment(registration: ?Registration) {
  if (__DEV__) return;
  if (registration===undefined || registration===null || registration.bundle===undefined) return;
  //console.log('checking deployment key:' + registration.bundle);
  //let packageVersion = await codePush.checkForUpdate(registration.bundle);
  //alert(packageVersion==null?'no update available for '+registration.bundle:'Update available for '+registration.bundle+' '+packageVersion.label);
  codePush.sync({ updateDialog: false, deploymentKey: registration.bundle, installMode: codePush.InstallMode.IMMEDIATE}, logUpdateStatus);
}


export class EhrApp extends Component {
    state : {
        isRegistered: boolean,
        isLoggedOn: boolean,
        isLocked: boolean,
        registration: ?Registration,
        user: ?User,
        store: ?Store,
        token: ?string
    };

    constructor() {
        super();
        this.state = {
            isRegistered: false,
            isLoggedOn: false,
            isLocked: false,
            registration: undefined,
            user: undefined,
            store: undefined,
            token: undefined
        };
    }

    reset = () => {
        AsyncStorage.removeItem('path');
        AsyncStorage.removeItem('bundle');
        AsyncStorage.removeItem('userName');
        let registration : ?Registration = this.state.registration;
        if (registration) {
          registration.path = undefined,
          registration.bundle = undefined
        }
        this.setState({
            isRegistered: false,
            isLoggedOn: false,
            registration,
            user: null,
            store: null
        });
    }

    setRegistration(registration?: Registration) {
      const isRegistered : boolean = registration!=undefined && registration!=null && registration.email!=undefined && registration.path!=undefined && registration.bundle!==undefined && registration.bundle!==null && registration.bundle.length>0;
      this.setState({isRegistered, registration});
      if (isRegistered===true) checkAndUpdateDeployment(registration);
    }

    async safeRegistration(registration: Registration) {
        if (registration===undefined || registration===null) {
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

    userLoggedOn(user: User, store: Store, token: string) {
        this.setState({isLoggedOn: user!==undefined && token!==undefined && store!==undefined, user, store, token});
    }

    logout = () => {
        this.setState({isLoggedOn: false, token: undefined, store: undefined});
        checkAndUpdateDeployment(this.state.registration);
    }

    async loadRegistration() {
        const email : string = await AsyncStorage.getItem('email');
        const bundle : string = await AsyncStorage.getItem('bundle');
        const path: string = await AsyncStorage.getItem('path');
        const registration : Registration = {email, bundle, path};
        console.log('WinkTouch app is registered to : ' + email + ' bundle: '+bundle+ ' path: '+path);
        this.setRegistration(registration);
    }

    startLockingDog() {
        //TODO
    }

    componentWillMount() {
        this.loadRegistration();
        this.startLockingDog();
    }

    render() {
        if (!this.state.isRegistered) {
            return <RegisterScreen email={this.state.registration?this.state.registration.email:undefined} onReset={this.reset}
              onRegistered={(registration: Registration) => this.safeRegistration(registration)}/>
        }
        if (!this.state.isLoggedOn) {
            return <LoginScreen registration={this.state.registration} onLogin={(user: User, store: Store, token: string) => this.userLoggedOn(user, store, token)} onReset={this.reset}/>
        }
        return <DoctorApp registration={this.state.registration} user={this.state.user} token={this.state.token} store={this.state.store} onLogout={this.logout}/>
    }
}

EhrApp = codePush({ checkFrequency: codePush.CheckFrequency.MANUAL })(EhrApp);

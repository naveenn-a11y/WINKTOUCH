/**
 * @flow
 */
'use strict';

import { Platform, NativeEventEmitter, NativeModules } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {cacheItem, getCachedItem, clearCachedItemById} from '../DataCache';

class InactivityTracker {
  constructor({ttlInMins, onSessionTimeout, onResume}) {
    this.ttlInSeconds = ttlInMins * 60 * 1000;
    this.onSessionTimeout = onSessionTimeout;
    this.onResume = onResume;
    this.logoutTimeTracker = null;
    this.LOGOUT_TIME_KEY = '_logoutTime';
    this.IS_ACTIVE = '_isActiveKey';
    this.IS_LOADED = '_isLoaded';
    this._iosEventTrackerEmitter = NativeModules.EventTrackerModule ? new NativeEventEmitter(NativeModules.EventTrackerModule) : null;
    this._iosEventSubscription = null
  }

  async load(): void {
    const isTrackerActive = await this.fetchFromStorage(this.IS_ACTIVE);
    if (isTrackerActive === null) {
      //Tracker is not initialised
      this.start();
    } else {
      this.saveToStorage(this.IS_LOADED, true, 'START');

      if (JSON.parse(isTrackerActive) === true) {
        //Tracker is running
        const isExpired = await this.hasTimeExpired();
        isExpired ? this.stop() : this.start();
      } else {
        this.stop();
      }
    }
  }

  start(): void {
    let newExpectedLogoutTime = Date.now() + this.ttlInSeconds;
    this.saveToStorage(this.LOGOUT_TIME_KEY, newExpectedLogoutTime, 'START');
    this.saveToStorage(this.IS_ACTIVE, true, 'START');
    this.saveToStorage(this.IS_LOADED, true, 'START');
    cacheItem(this.LOGOUT_TIME_KEY, newExpectedLogoutTime);

    //TODO: delay start to ensure it has saved to local storage.
    this.observeEvents();
    this.monitorLogoutTimeHasNotExpired();
    this.onResume();
    __DEV__ && console.log('Inactivity Tracker started.');
  }

  stop(): void {
    clearInterval(this.monitor);
    this.stopObserveEvents();
    this.saveToStorage(this.IS_ACTIVE, false, 'STOP');
    this.onSessionTimeout();
    __DEV__ && console.log('Inactivity Tracker stopped.');
  }

  async hasTimeExpired(): boolean {
    const logoutTime = await this.fetchFromStorage(this.LOGOUT_TIME_KEY);
    const expectedLogoutTime = parseInt(logoutTime || 0, 10);
    return (
      logoutTime != null &&
      expectedLogoutTime > 0 &&
      expectedLogoutTime < Date.now()
    );
  }

  async isRunning(): boolean {
    const isTrackerInit = await this.fetchFromStorage(this.IS_LOADED);
    if (isTrackerInit === null) {
      return false; //tracker is not loaded
    }

    const isTrackerActive = await this.fetchFromStorage(this.IS_ACTIVE);
    if (isTrackerActive === null) {
      return false;
    } else {
      return JSON.parse(isTrackerActive) === true;
    }
  }

  async isInit(): boolean {
    const isTrackerInit = await this.fetchFromStorage(this.IS_LOADED);
    if (isTrackerInit === null) {
      return false;
    } else {
      return JSON.parse(isTrackerInit) === true;
    }
  }

  //handle touch event
  resetLogoutTime = () => {
    if (this.logoutTimeTracker) {
      clearTimeout(this.logoutTimeTracker);
    }

    //delays before updating cache with new expected logout time
    this.logoutTimeTracker = setTimeout(() => {
      let newExpectedLogoutTime = Date.now() + this.ttlInSeconds;
      cacheItem(this.LOGOUT_TIME_KEY, newExpectedLogoutTime);
    }, 100);
  };

  monitorLogoutTimeHasNotExpired(): void {
    if (!this.monitor) {
      this.startInterval();
    } else {
      clearInterval(this.monitor); //this is needed to clear intervals on other opened tabs
      this.startInterval();
    }
  }

  startInterval(): void {
    this.monitor = setInterval(() => {
      const expectedLogoutTime = parseInt(
        getCachedItem(this.LOGOUT_TIME_KEY) || 0,
        10,
      );
      if (expectedLogoutTime > 0 && expectedLogoutTime < Date.now()) {
        this.stop();
      }
    }, 1000);
  }

  async appIsInBackground(): void {
    //save time to localstorage when app moves to background
    const isActive = await this.isRunning();
    if (isActive) {
      let newExpectedLogoutTime = Date.now() + this.ttlInSeconds;
      this.saveToStorage(
        this.LOGOUT_TIME_KEY,
        newExpectedLogoutTime,
        'APPINBACKGROUND',
      );
    }
  }

  async appIsActive(): void {
    const isInit = await this.isInit();
    if (isInit) {
      this.load();
    }
  }

  saveToStorage(id: String, data: any, source: string): void {
    AsyncStorage.setItem(id, JSON.stringify(data));
  }

  async fetchFromStorage(id): void {
    const expectedTime = await AsyncStorage.getItem(id);
    return expectedTime;
  }

  removeFromStorage(key): void {
    //(Platform.OS === 'web') ? localStorage.removeItem(key) : AsyncStorage.removeItem(key);
    AsyncStorage.removeItem(key);
  }

  observeEvents(): void {
    (Platform.OS === 'web') ? this.observeWebEvents() : (Platform.OS === 'ios') ? this.observeIosEvents() : () => {};
  }

  observeWebEvents(): void {
    window.addEventListener('mousemove', this.resetLogoutTime);
    window.addEventListener('scroll', this.resetLogoutTime);
    window.addEventListener('keydown', this.resetLogoutTime);
  }

  observeIosEvents(): void {
    this._iosEventSubscription = this._iosEventTrackerEmitter.addListener('eventDetected', this.resetLogoutTime);
  }

  stopObserveEvents(): void {
    (Platform.OS === 'web') ? this.stopObserveWebEvents() : (Platform.OS === 'ios') ? this.stopObserveIosEvents() : () => {};
  }

  stopObserveWebEvents(): void {
    window.removeEventListener('mousemove', this.resetLogoutTime);
    window.removeEventListener('scroll', this.resetLogoutTime);
    window.removeEventListener('keydown', this.resetLogoutTime);
  }

  stopObserveIosEvents(): void {
    this._iosEventSubscription ? this._iosEventSubscription.remove() : () => {};
  }

  //use destroy when user completely logs out
  destroy(): void {
    clearInterval(this.monitor);
    this.stopObserveEvents();
    clearCachedItemById(this.LOGOUT_TIME_KEY);
    this.removeFromStorage(this.LOGOUT_TIME_KEY);
    this.removeFromStorage(this.IS_ACTIVE);
    this.removeFromStorage(this.IS_LOADED);
    __DEV__ && console.log('Inactivity Tracker destroyed!');
  }
}

export default InactivityTracker;

/**
 * @flow
 */
'use strict';

import DeviceInfo from 'react-native-device-info';
import { strings } from './Strings';

export let deploymentVersion: string = 'v398';
export let restVersion: string = 'EHR-3.9';
export const dbVersion : string = '1685'; //TODO move to plist
export const touchVersion: string = DeviceInfo.getVersion();
export const bundleVersion: string = DeviceInfo.getBuildNumber();
const minimalTouchVersion = 3.0;

export function setDeploymentVersion(version: string) : void {
  __DEV__ && console.log('Current code push deployment version: '+version);
  if (deploymentVersion!=version) {
    __DEV__ && console.log('App is not up to date: '+version);
  }
}

export function checkBinaryVersion() :void {
  const binaryVersion = DeviceInfo.getVersion();
  if (Number.parseFloat(binaryVersion)<minimalTouchVersion) {
    alert(strings.updateAppStore);
  };
}

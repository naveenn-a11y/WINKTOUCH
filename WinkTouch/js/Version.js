/**
 * @flow
 */
'use strict';

import DeviceInfo from 'react-native-device-info';
import {strings} from './Strings';
import {isWeb} from './Styles';

export let deploymentVersion: string = 'v412';
export let restVersion: string = 'EHR-412';
export let ecommVersion: string = 'V5';
export const dbVersion: string = '1918';
export const touchVersion: string = !isWeb ? DeviceInfo.getVersion() : '1';
export const bundleVersion: string = !isWeb ? DeviceInfo.getBuildNumber() : '1';
const minimalTouchVersion = 3.0;

export function setDeploymentVersion(version: string): void {
  __DEV__ && console.log('Current code push deployment version: ' + version);
  if (deploymentVersion !== version) {
    __DEV__ && console.log('App is not up to date: ' + version);
  }
}

export function checkBinaryVersion(): void {
  const binaryVersion = DeviceInfo.getVersion();
  if (Number.parseFloat(binaryVersion) < minimalTouchVersion) {
    alert(strings.updateAppStore);
  }
}

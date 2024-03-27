/**
 * @flow
 */
'use strict';

import DeviceInfo from 'react-native-device-info';
import {strings} from './Strings';
import {isWeb} from './Styles';
import {now} from './Util';

__DEV__ && console.log('process.env', process.env);

export let deploymentVersion: string = process.env.WINK_DEPLOYMENT_VERSION || 'unknown';
export let ehrApiVersion: string = process.env.WINK_EHR_API_VERSION || 'unknown';
export let winkRESTVersion: string = process.env.WINK_REST_VERSION || 'unknown';
export let ecommVersion: string = process.env.WINK_ECOMM_VERSION || 'unknown';
export const dbVersion: string = process.env.WINK_DB_VERSION || 'unknown';
export const touchVersion: string = !isWeb ? DeviceInfo.getVersion() : '1';
export const bundleVersion: string = !isWeb ? DeviceInfo.getBuildNumber() : '1';
const minimalTouchVersion = 4.8;

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

async function fetchTestflight() {
  const installer = await DeviceInfo.getInstallerPackageName();
  return installer === 'TestFlight';
}

export let isTestFlight: boolean = false;

if (!isWeb) {
  fetchTestflight().then((result) => {
    isTestFlight = result;
  });
}

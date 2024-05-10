/**
 * @flow
 */
'use strict';

import DeviceInfo from 'react-native-device-info';
import Config from 'react-native-config';
import { strings } from './Strings';
import { isWeb } from './Styles';

if (isWeb) {
  __DEV__ && console.log('process.env', process.env);
}

if (!isWeb) {
  __DEV__ && console.log('Config', Config);
}

export const deploymentVersion: string = isWeb ? process.env.WINK_DEPLOYMENT_VERSION : Config.WINK_DEPLOYMENT_VERSION;
export const ehrApiVersion: string = isWeb ? process.env.WINK_EHR_API_VERSION : Config.WINK_EHR_API_VERSION;
export const winkRESTVersion: string = isWeb ? process.env.WINK_REST_VERSION : Config.WINK_REST_VERSION;
export const ecommVersion: string = isWeb ? process.env.WINK_ECOMM_VERSION : Config.WINK_ECOMM_VERSION;
export const dbVersion: string = isWeb ? process.env.WINK_DB_VERSION : Config.WINK_DB_VERSION;
export const touchVersion: string = !isWeb ? DeviceInfo.getVersion() : '1';
export const bundleVersion: string = !isWeb ? DeviceInfo.getBuildNumber() : '1';
const MINIMAL_TOUCH_VERSION = 4.8;
const EHR_VERSION_NUMBER = '4.13.1';

export function setDeploymentVersion(version: string): void {
  __DEV__ && console.log('Current code push deployment version: ' + version);
  if (deploymentVersion !== version) {
    __DEV__ && console.log('App is not up to date: ' + version);
  }
}

export function checkBinaryVersion(): void {
  const binaryVersion = DeviceInfo.getVersion();
  if (Number.parseFloat(binaryVersion) < MINIMAL_TOUCH_VERSION) {
    alert(strings.updateAppStore);
  }
}

async function fetchTestflight() {
  const installer = await DeviceInfo.getInstallerPackageName();
  return installer === 'TestFlight';
}

export let isTestFlight: boolean = false; // NOSONAR

if (!isWeb) {
  fetchTestflight().then((result) => {
    isTestFlight = result;
  });
}

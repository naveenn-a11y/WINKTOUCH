/**
 * @flow
 */
'use strict';

import DeviceInfo from 'react-native-device-info';
import { strings } from './Strings';
import { isWeb } from './Styles';
import { WINK_APP_ECOMM_VERSION } from '@env';

export const deploymentVersion: string = 'v413';
export const ehrApiVersion: string = 'EHR-413';
export const ecommVersion: string = isWeb ? process.env.WINK_APP_ECOMM_VERSION : WINK_APP_ECOMM_VERSION;
export const dbVersion: string = '2058';
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

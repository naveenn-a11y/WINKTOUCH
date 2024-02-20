/**
 * @flow
 */
'use strict';

import DeviceInfo from 'react-native-device-info';
import {strings} from './Strings';
import {isWeb} from './Styles';
import {now} from './Util';

// This is a test constant. The goal is to read the version number
// during build and create an XML file that can be included in the
// dist folder. We now can add version number to the folder name
// in Nexus and can be used in other places as needed for CI/CD.
export const VERSION_NUMBER = '4.13.12';

export let deploymentVersion: string = 'v413';
export let ehrApiVersion = 'EHR-413';
export let winkRESTVersion: string = '6.00.12.03';
export let ecommVersion: string = 'V5';
export const dbVersion: string = '2058';
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

async function fetchTestflight() {
  const installer = await DeviceInfo.getInstallerPackageName();
  return installer === 'TestFlight';
}

export let isTestFlight = false;

if (!isWeb) {
  fetchTestflight().then((result) => {
    isTestFlight = result;
  });
}

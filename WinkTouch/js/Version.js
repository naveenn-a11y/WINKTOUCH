/**
 * @flow
 */
'use strict';

import DeviceInfo from 'react-native-device-info';
import { strings } from './Strings';

export let deploymentVersion: string = 'vx';
export const dbVersion : string = '1580'; //TODO move to plist
export const touchVersion: string = DeviceInfo.getVersion();
export const bundleVersion: string = DeviceInfo.getBuildNumber();
const minimalTouchVersion = 3.0;

export function setDeploymentVersion(version: string) : void {
  deploymentVersion = version;
}

export function checkBinaryVersion() :void {
  const binaryVersion = DeviceInfo.getVersion();
  if (Number.parseFloat(binaryVersion)<minimalTouchVersion) {
    alert(strings.updateAppStore);
  };
}

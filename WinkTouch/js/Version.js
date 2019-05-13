/**
 * @flow
 */
'use strict';

import DeviceInfo from 'react-native-device-info';

export let deploymentVersion: string = 'vx';
export const dbVersion : string = '1425'; //TODO move to plist
export const touchVersion: string = DeviceInfo.getVersion();
export const bundleVersion: string = DeviceInfo.getBuildNumber(); //

export function setDeploymentVersion(version: string) : void {
  deploymentVersion = version;
}

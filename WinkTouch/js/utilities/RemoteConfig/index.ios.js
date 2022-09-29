/**
 * @flow
 */

'use strict';

import remoteConfig from '@react-native-firebase/remote-config';
import DeviceInfo from 'react-native-device-info';
import {isEmpty} from '../../Util';

let _appEnv = 'prod';

async function getAppEnvironment(): string {
  const installerPackage = await DeviceInfo.getInstallerPackageName(); // iOS: "AppStore", "TestFlight", "Other"
  const env = installerPackage === 'AppStore' ? 'prod' : 'dev';
  _appEnv = env;
  return env;
}

async function activateRemoteConfig() {
  const appEnv = await getAppEnvironment();
  const appstoreUrl =
    appEnv === 'prod'
      ? 'itms-apps://apps.apple.com/ca/app/winkemr/id1259308891'
      : 'https://testflight.apple.com/join/U4q33P6d';
  const configDefaults = {
    [`ios_force_update_required_${appEnv}`]: false,
    [`latest_ios_build_${appEnv}`]: 1,
    [`latest_ios_version_${appEnv}`]: 1,
    [`appstore_url_${appEnv}`]: appstoreUrl,
  };
  await remoteConfig().setDefaults(configDefaults);
  const fetchedRemotelyawait = await remoteConfig().fetchAndActivate();

  const minimumFetchIntervalMillis = appEnv === 'prod' ? 21600000 : 120000; //6hrs - prod, 2mins - dev
  __DEV__ &&
    console.log('Remote config cached for ', minimumFetchIntervalMillis);

  await remoteConfig().setConfigSettings({
    minimumFetchIntervalMillis: minimumFetchIntervalMillis,
  });

  if (!fetchedRemotelyawait) {
    __DEV__ && console.log("Can't fetch remote config");
  }
}

async function getLatestBuildNumber(bundle: string): number {
  const latestBuildStr: any = await remoteConfig().getString(
    `latest_ios_build_${_appEnv}`,
  );
  const latestBuildJson: any = JSON.parse(latestBuildStr);
  if (!isEmpty(latestBuildJson[bundle])) {
    return latestBuildJson[bundle];
  }
  return !isEmpty(latestBuildJson.default) ? latestBuildJson.default : 1;
}

async function getLatestVersion(bundle: string): number {
  const latestVersionStr: any = remoteConfig().getString(
    `latest_ios_version_${_appEnv}`,
  );
  const latestVersionJson: any = JSON.parse(latestVersionStr);
  if (!isEmpty(latestVersionJson[bundle])) {
    return latestVersionJson[bundle];
  }
  return !isEmpty(latestVersionJson.default) ? latestVersionJson.default : 1;
}

async function getForceUpdate(): boolean {
  const forceUpdate = await remoteConfig().getBoolean(
    `ios_force_update_required_${_appEnv}`,
  );
  return forceUpdate;
}

async function getAppstoreUrl(): string {
  const forceUpdate = await remoteConfig().getString(`appstore_url_${_appEnv}`);
  return forceUpdate;
}

async function shouldUpdateApp(bundle: string): boolean {
  const latestBuild = await this.getLatestBuildNumber(bundle);
  const latestVersion = await this.getLatestVersion(bundle);
  const forceUpdate = await this.getForceUpdate();

  const currentVersion = Number(DeviceInfo.getVersion());
  const currentBuild = Number(DeviceInfo.getBuildNumber());

  if (forceUpdate) {
    if (currentBuild < latestBuild) {
      return true;
    }
    if (currentVersion < latestVersion) {
      return true;
    }
  }

  return false;
}

export default {
  activateRemoteConfig,
  getLatestBuildNumber,
  getLatestVersion,
  getForceUpdate,
  shouldUpdateApp,
  getAppstoreUrl,
};

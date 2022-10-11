/**
 * @flow
 */

'use strict';

import remoteConfig from '@react-native-firebase/remote-config';
import DeviceInfo from 'react-native-device-info';

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

  const minimumFetchIntervalMillis = appEnv === 'prod' ? 900000 : 120000; //15min - prod, 2mins - dev
  __DEV__ &&
    console.log('Remote config cached for ', minimumFetchIntervalMillis);

  await remoteConfig().setConfigSettings({
    minimumFetchIntervalMillis: minimumFetchIntervalMillis,
  });

  const fetchedRemotelyawait = await remoteConfig().fetchAndActivate();

  if (!fetchedRemotelyawait) {
    __DEV__ && console.log("Can't fetch remote config");
  }
}

async function getLatestBuildNumber(): number {
  const latestBuild = await remoteConfig().getNumber(
    `latest_ios_build_${_appEnv}`,
  );
  return latestBuild;
}

async function getLatestVersion(): number {
  const latestVersion = await remoteConfig().getNumber(
    `latest_ios_version_${_appEnv}`,
  );
  return latestVersion;
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

async function shouldUpdateApp(): {
  isUpdateRequired: boolean,
  latestBuild: number,
  latestVersion: number,
} {
  await remoteConfig().fetchAndActivate();

  const latestBuild = await this.getLatestBuildNumber();
  const latestVersion = await this.getLatestVersion();
  const forceUpdate = await this.getForceUpdate();

  const currentVersion = Number(DeviceInfo.getVersion());
  const currentBuild = Number(DeviceInfo.getBuildNumber());

  if (forceUpdate) {
    if (currentVersion < latestVersion) {
      return {isUpdateRequired: true, latestBuild, latestVersion};
    }
    if (currentVersion == latestVersion && currentBuild < latestBuild) {
      return {isUpdateRequired: true, latestBuild, latestVersion};
    }
  }

  return {isUpdateRequired: false, latestBuild, latestVersion};
}

export default {
  activateRemoteConfig,
  getLatestBuildNumber,
  getLatestVersion,
  getForceUpdate,
  shouldUpdateApp,
  getAppstoreUrl,
};

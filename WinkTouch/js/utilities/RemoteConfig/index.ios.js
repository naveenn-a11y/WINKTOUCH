/**
 * @flow
 */

 'use strict';

import remoteConfig from '@react-native-firebase/remote-config';
import DeviceInfo from 'react-native-device-info';

let _appEnv = "prod";

async function getAppEnvironment() : string {
    const installerPackage = await DeviceInfo.getInstallerPackageName(); // iOS: "AppStore", "TestFlight", "Other"
    const env =  (installerPackage === "AppStore") ? "prod" : "dev";
    _appEnv = env;
    return env;
}

async function activateRemoteConfig() {
    const appEnv = await getAppEnvironment();
    const configDefaults = {
        [`ios_force_update_required_${appEnv}`]: false,
        [`latest_ios_build_${appEnv}`]: 1,
        [`latest_ios_version_${appEnv}`]: 1
    };
    await remoteConfig().setDefaults(configDefaults);
    const fetchedRemotelyawait = await remoteConfig().fetchAndActivate();
    
    const minimumFetchIntervalMillis = appEnv === "prod" ? 21600000 : 3600000; //6hrs - prod, 1hr - dev
    __DEV__ && console.log("Remote config cached for ", minimumFetchIntervalMillis);

    await remoteConfig().setConfigSettings({
      minimumFetchIntervalMillis: minimumFetchIntervalMillis, //cache for 6hours
    });

    if (!fetchedRemotelyawait) {
        __DEV__ && console.log("Can't fetch remote config");
    }
}

async function getLatestBuildNumber() : number {
    const latestBuild = await remoteConfig().getNumber(`latest_ios_build_${_appEnv}`);
    return latestBuild;
}

async function getLatestVersion() : number {
    const latestVersion = remoteConfig().getNumber(`latest_ios_version_${_appEnv}`);
    return latestVersion;
}

async function getForceUpdate() : boolean {
    const forceUpdate = await remoteConfig().getBoolean(`ios_force_update_required_${_appEnv}`)
    return forceUpdate;
}

async function shouldUpdateApp() : boolean {
    const latestBuild = await this.getLatestBuildNumber();
    const latestVersion = await this.getLatestVersion();
    const forceUpdate = await this.getForceUpdate();
    
    const currentVersion = Number(DeviceInfo.getVersion());
    const currentBuild = Number(DeviceInfo.getBuildNumber());

    if (forceUpdate) {
      if(currentBuild < latestBuild){
          return true;
      }
      if(currentVersion < latestVersion) {
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
}

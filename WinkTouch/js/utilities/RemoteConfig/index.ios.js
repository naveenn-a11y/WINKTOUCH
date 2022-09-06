import remoteConfig from '@react-native-firebase/remote-config';
import DeviceInfo from 'react-native-device-info';

async function activateRemoteConfig() {
    await remoteConfig().setDefaults({
      'ios_force_update_required': false,
      'latest_ios_build': 1,
      'latest_ios_version': 1
    });
    const fetchedRemotelyawait = await remoteConfig().fetchAndActivate();

    await remoteConfig().setConfigSettings({
      minimumFetchIntervalMillis: 2160000,
    });

    if (!fetchedRemotelyawait) {
        __DEV__ && console.log("Can't fetch remote config");
    }
}

async function getLatestBuildNumber() : number {
    const latestBuild = await remoteConfig().getNumber('latest_ios_build');
    return latestBuild;
}

async function getLatestVersion() : number {
    const latestVersion = remoteConfig().getNumber('latest_ios_version');
    return latestVersion;
}

async function getForceUpdate() : boolean {
    const forceUpdate = await remoteConfig().getBoolean('ios_force_update_required')
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

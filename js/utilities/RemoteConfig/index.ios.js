/**
 * @flow
 */

 'use strict';

import AsyncStorage from '@react-native-async-storage/async-storage';
import remoteConfig from '@react-native-firebase/remote-config';
import DeviceInfo from 'react-native-device-info';
import { isEmpty } from '../../Util';
 
 let _appstoreUrl = 'itms-apps://apps.apple.com/ca/app/winkemr/id1259308891'; //'https://testflight.apple.com/join/U4q33P6d'

 
 async function activateRemoteConfig() {
   const configDefaults = {
     [`ios_force_update_required`]: false,
     [`latest_ios_build`]: 1,
     [`latest_ios_version`]: 1,
     [`appstore_url`]: _appstoreUrl,
   };
   await remoteConfig().setDefaults(configDefaults);
   const minimumFetchIntervalMillis = __DEV__ ? 900000 : 120000; //15min - prod, 2mins - dev
 
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
 
 async function getLatestBuildNumber(bundle: string): number {
   const latestBuildStr: any = await remoteConfig().getString(
     `latest_ios_build`,
   );
   const latestBuildJson: any = JSON.parse(latestBuildStr);
   if (!isEmpty(latestBuildJson[bundle])) {
     return latestBuildJson[bundle];
   }
   return !isEmpty(latestBuildJson.default) ? latestBuildJson.default : 1;
 }
 
 async function getLatestVersion(bundle: string): number {
   const latestVersionStr: any = remoteConfig().getString(
     `latest_ios_version`,
   );
   const latestVersionJson: any = JSON.parse(latestVersionStr);
   if (!isEmpty(latestVersionJson[bundle])) {
     return latestVersionJson[bundle];
   }
   return !isEmpty(latestVersionJson.default) ? latestVersionJson.default : 1;
 }
 
 async function getForceUpdate(bundle: string): boolean {
   const forceUpdateStr = await remoteConfig().getString(
     `ios_force_update_required`,
   );

   const forceUpdateJson: any = JSON.parse(forceUpdateStr);
   if (!isEmpty(forceUpdateJson[bundle])) {
     return forceUpdateJson[bundle];
   }
   return !isEmpty(forceUpdateJson.default) ? forceUpdateJson.default : false;
 }
 
async function getAppstoreUrl(): string {
    const bundle: string = await AsyncStorage.getItem('bundle');
    const appstoreUrlStr = await remoteConfig().getString(`appstore_url`);

    const appstoreUrlJson: any = JSON.parse(appstoreUrlStr);
    if (!isEmpty(appstoreUrlJson[bundle])) {
        return appstoreUrlJson[bundle];
    }
    return !isEmpty(appstoreUrlJson.default) ? appstoreUrlJson.default : _appstoreUrl;
}
 
 async function shouldUpdateApp(): {
   isUpdateRequired: boolean,
   latestBuild: number,
   latestVersion: number,
 } {
   const bundle: string = await AsyncStorage.getItem('bundle');
   await remoteConfig().fetchAndActivate();
   const latestBuild = await this.getLatestBuildNumber(bundle);
   const latestVersion = await this.getLatestVersion(bundle);
 
   const forceUpdate = await this.getForceUpdate(bundle);
 
   const currentVersion = Number(DeviceInfo.getVersion());
   const currentBuild = Number(DeviceInfo.getBuildNumber());
 
   if (forceUpdate) {
     if (currentVersion < latestVersion) {
       return {isUpdateRequired: true, latestBuild, latestVersion};
     }
     if (currentVersion === latestVersion && currentBuild < latestBuild) {
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
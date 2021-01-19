/**
 * @flow
 */
'use strict';

import React, {Component} from 'react';
import {Text, View, StatusBar} from 'react-native';
import DeviceInfo from 'react-native-device-info';

export default class DeviceInfoTest extends Component<> {
  render() {
    return (
      <View>
        <StatusBar hidden={true} />
        <Text>Device Info:</Text>
        <Text>UID: {DeviceInfo.getUniqueId()}</Text>
        <Text>Model: {DeviceInfo.getModel()}</Text>
        <Text>DeviceId: {DeviceInfo.getDeviceId()}</Text>
      </View>
    );
  }
}

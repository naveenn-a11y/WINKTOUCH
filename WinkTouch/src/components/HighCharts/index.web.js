import React, {Component} from 'react';
import {Text, View} from 'react-native';

export class Highcharts extends Component {
  props: {
    useCDN: boolean,
    useSSL: boolean,
    style: any,
    options: any,
  };

  constructor(props: any) {
    super(props);
  }
  render() {
    return (
      <View>
        <Text> This feature is not supported for Web ! </Text>
      </View>
    );
  }
}

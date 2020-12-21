import React, {Component} from 'react';
import HighchartsReactNative from '@highcharts/highcharts-react-native';

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
      <HighchartsReactNative
        useCDN={this.props.useCDN}
        useSSL={this.props.useSSL}
        styles={this.props.style}
        options={this.props.options}
      />
    );
  }
}

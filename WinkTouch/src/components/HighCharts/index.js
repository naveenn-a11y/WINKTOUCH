import React, {Component} from 'react';
import ChartView from 'react-native-highcharts';

export class Highcharts extends Component {
  props: {
    useCDN: boolean,
    useSSL: boolean,
    style: any,
    conf: any,
  };

  constructor(props: any) {
    super(props);
  }
  render() {
    const options = {
      global: {
        useUTC: false,
        useCDN: this.props.useCDN,
        useSSL: this.props.useSSL,
      },
      lang: {
        decimalPoint: ',',
        thousandsSep: '.',
      },
    };
    return (
      <ChartView
        style={this.props.style}
        config={this.props.conf}
        options={options}
        originWhitelist={['*']}
      />
    );
  }
}

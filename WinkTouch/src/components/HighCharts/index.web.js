import React, {Component} from 'react';
import HighchartsReact from 'highcharts-react-official';
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
    let config: any = this.props.options;
    if (config === undefined || config === null) return;
    config.series.map((series: any, index: Number) => {
      const data: any = series.data.map((e: Number) =>
        e === undefined ? null : e,
      );
      config.series[index].data = data;
    });
    return (
      <HighchartsReact
        useCDN={this.props.useCDN}
        useSSL={this.props.useSSL}
        styles={this.props.style}
        options={config}
      />
    );
  }
}

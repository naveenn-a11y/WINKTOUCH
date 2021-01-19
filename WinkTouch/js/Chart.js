/**
 * @flow
 */
'use strict';

import React, {Component} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Highcharts from 'highcharts';
import HighchartsReactNative from '@highcharts/highcharts-react-native';
import type {Exam} from './Types';
import {styles, fontScale, windowWidth, windowHeight} from './Styles.js';
import {getExamHistory} from './Exam';
import {formatMoment} from './Util';
import {getCachedItem} from './DataCache';

type ChartData = {type: string, name: string, data: number[]};
type ChartSeries = ChartData[];

class LineChart extends Component {
  props: {
    title: string,
    xLabels: string[],
    series?: ChartSeries,
  };

  render() {
    if (this.props.series === undefined) return null;
    let conf = {
      chart: {
        type: 'line',
        animation: Highcharts.svg,
        marginRight: 10 * fontScale,
      },
      title: {
        text: this.props.title,
      },
      xAxis: {
        categories: this.props.xLabels,
      },
      yAxis: {
        plotLines: [
          {
            value: 0,
            width: 1,
            color: '#808080',
          },
        ],
        title: {
          text: '',
        },
      },
      legend: {
        enabled: true,
      },
      plotOptions: {
        line: {
          dataLabels: {
            enabled: true,
          },
          connectNulls: true,
        },
      },
      exporting: {
        enabled: false,
      },
      series: this.props.series,
    };
    return (
      <HighchartsReactNative
        useCDN={true}
        useSSL={true}
        styles={{top: 0, width: windowWidth * 0.85, height: windowHeight}}
        options={conf}
      />
    );
  }
}

export class ExamChartScreen extends Component {
  props: {
    navigation: any,
  };
  params: {
    exam: Exam,
  };
  state: {
    series?: ChartSeries,
    labels?: string[],
  };
  constructor(props: any) {
    super(props);
    this.state = {
      series: undefined,
      labels: undefined,
    };
  }

  componentDidMount() {
    this.generateGraphSeries(this.props.navigation.state.params.exam);
  }

  generateChartData(field: string, examHistory: Exam[]): ChartData {
    const fieldTree: string[] = field.split('.');
    //let definition = examHistory[0].definition;
    //fieldTree.forEach(fieldName => {if (definition!==undefined) definition = definition[fieldName]}); TODO
    let series: number[] = [];
    examHistory.map((exam: Exam) => {
      let data = exam
        ? exam[this.props.navigation.state.params.exam.definition.name]
        : undefined;
      fieldTree.forEach(fieldName => {
        if (data !== undefined) {
          if (data instanceof Array) {
            if (data.length > 0) {
              data = data[0];
            } else {
              data = undefined;
            }
          }
          data = data[fieldName];
        }
      });
      series.push(data);
    });
    return {
      type: 'line',
      name: field,
      data: series,
    };
  }

  generateGraphSeries(exam: Exam): ChartSeries {
    if (
      exam.definition.graph === undefined ||
      exam.definition.graph.fields === undefined
    )
      return undefined;
    const examHistory: Exam[] = getExamHistory(exam).reverse();
    let labels: string[] = examHistory.map((exam: Exam) =>
      exam ? formatMoment(getCachedItem(exam.visitId).date) : undefined,
    );
    let series: ChartSeries = exam.definition.graph.fields.map(
      (field: string) => this.generateChartData(field, examHistory),
    );
    this.setState({series, labels});
  }

  render() {
    return (
      <View style={styles.centeredScreenLayout}>
        <View style={styles.centeredColumnLayout}>
          <LineChart
            series={this.state.series}
            title={this.props.navigation.state.params.exam.definition.name}
            xLabels={this.state.labels}
          />
        </View>
      </View>
    );
  }
}

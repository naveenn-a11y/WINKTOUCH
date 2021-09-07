/**
 * @flow
 */
'use strict';

import React, {Component} from 'react';
import {View, Text, Picker, TouchableOpacity} from 'react-native';
import {Button} from './Widgets';
import {
  Calendar,
  Mode,
  modeToNum,
  ICalendarEvent,
} from 'react-native-big-calendar';
import {styles, windowHeight} from './Styles';
import {strings} from './Strings';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';

export const themes: Record<string, PartialTheme> = {
  default: {},
  dark: {
    palette: {
      primary: {
        main: '#6185d0',
        contrastText: '#000',
      },
      gray: {
        '100': '#333',
        '200': '#666',
        '300': '#888',
        '500': '#aaa',
        '800': '#ccc',
      },
    },
  },
  green: {
    palette: {
      primary: {
        main: '#4caf50',
        contrastText: '#fff',
      },
    },
    eventCellOverlappings: [
      {
        main: '#17651a',
        contrastText: '#fff',
      },
      {
        main: '#08540b',
        contrastText: '#fff',
      },
    ],
  },
};

export const events: ICalendarEvent<{color?: string}>[] = [
  {
    title: 'Comprehensive Exam',
    start: dayjs().set('hour', 0).set('minute', 0).set('second', 0).toDate(),
    end: dayjs().set('hour', 1).set('minute', 30).toDate(),
  },
  {
    title: 'CL Fitting',
    start: dayjs().set('hour', 10).set('minute', 0).toDate(),
    end: dayjs().set('hour', 10).set('minute', 30).toDate(),
  },
  {
    title: 'Emergency',
    start: dayjs().set('hour', 14).set('minute', 30).toDate(),
    end: dayjs().set('hour', 15).set('minute', 30).toDate(),
  },
  {
    title: 'Post Surgery',
    start: dayjs().set('hour', 16).set('minute', 0).toDate(),
    end: dayjs().set('hour', 18).set('minute', 30).toDate(),
    color: 'purple',
  },
  {
    title: 'Full exam',
    start: dayjs().add(1, 'day').set('hour', 7).set('minute', 45).toDate(),
    end: dayjs().add(1, 'day').set('hour', 13).set('minute', 30).toDate(),
  },
  {
    title: 'Comprehensive Exam',
    start: dayjs().add(1, 'day').set('hour', 8).set('minute', 25).toDate(),
    end: dayjs().add(1, 'day').set('hour', 9).set('minute', 55).toDate(),
  },
  {
    title: 'Comprehensive Exam',
    start: dayjs().add(1, 'day').set('hour', 8).set('minute', 25).toDate(),
    end: dayjs().add(1, 'day').set('hour', 11).set('minute', 0).toDate(),
  },
  {
    title: 'Comprehensive Exam',
    start: dayjs().set('hour', 13).set('minute', 0).toDate(),
    end: dayjs().set('hour', 14).set('minute', 15).toDate(),
  },
];

function useEvents(defaultEvents: ICalendarEvent[]) {
  return {};
}
class Agenda extends Component {
  render() {
    return (
      <View style={styles.tabCard}>
        <Text style={styles.screenTitle}>
          Agenda of the day for all doctors
        </Text>
        <Text>
          WARNING: this screen is not working yet. Please use the Wink PMS
          calendar for now.
        </Text>
      </View>
    );
  }
}

class NewApointment extends Component {
  renderArrow = (direction) => {
    if (direction == 'left')
      return <Icon name="arrow-left" type="MaterialIcons" />;
    if (direction == 'right')
      return <Icon name="arrow-right" type="MaterialIcons" />;
  };
  render() {
    const events = [
      {
        title: 'Meeting',
        start: new Date(2021, 9, 3, 10, 0, 0, 0),
        end: new Date(2021, 9, 3, 10, 30, 0, 0),
      },
      {
        title: 'Coffee break',
        start: new Date(2021, 9, 2, 15, 45),
        end: new Date(2021, 9, 2, 16, 30),
      },
    ];

    return (
      <View style={styles.tabCard}>
        <Calendar events={events} height={800} />
      </View>
    );
  }
}
const today = new Date();
export class AgendaScreen extends Component {
  state: {
    date: Date,
    mode: any,
    theme: any,
  };
  constructor(props: any) {
    super(props);
    this.state = {
      mode: 'week',
      date: today,
      theme: 'default',
    };
  }
  _onToday = () => {
    this.setState({date: today});
  };
  _onPrevDate = () => {
    if (this.state.mode === 'month') {
      this.setState({
        date: dayjs(this.state.date)
          .add(dayjs(this.state.date).date() * -1, 'day')
          .toDate(),
      });
    } else {
      this.setState({
        date: dayjs(this.state.date)
          .add(modeToNum(this.state.mode, this.state.date) * -1, 'day')
          .toDate(),
      });
    }
  };
  _onNextDate = () => {
    this.setState({
      date: dayjs(this.state.date)
        .add(modeToNum(this.state.mode, this.state.date), 'day')
        .toDate(),
    });
  };

  _onDaily = () => {
    this.setState({mode: 'day'});
  };
  _onWeekly = () => {
    this.setState({mode: 'week'});
  };
  _onMonthly = () => {
    this.setState({mode: 'month'});
  };
  render() {
    return (
      <View style={styles.page}>
        <View
          style={[styles.centeredRowLayout, {justifyContent: 'space-around'}]}>
          <TouchableOpacity onPress={this._onPrevDate}>
            <Text style={styles.linkButton}>{'Previous'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this._onToday}>
            <Text style={styles.linkButton}>{'Today'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this._onDaily}>
            <Text style={styles.linkButton}>{'Daily'}</Text>
          </TouchableOpacity>
          <Text style={styles.text}>
            {dayjs(this.state.date).format('MMMM YYYY')}
          </Text>
          <TouchableOpacity onPress={this._onWeekly}>
            <Text style={styles.linkButton}>{'Weekly'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this._onMonthly}>
            <Text style={styles.linkButton}>{'Monthly'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this._onNextDate}>
            <Text style={styles.linkButton}>{'Next'}</Text>
          </TouchableOpacity>
        </View>
        <Calendar
          date={this.state.date}
          height={windowHeight}
          events={events}
          mode={this.state.mode}
          theme={themes[this.state.theme]}
        />
      </View>
    );
  }
}

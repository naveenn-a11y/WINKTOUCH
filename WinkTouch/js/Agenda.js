/**
 * @flow
 */
'use strict';

import React, {Component} from 'react';
import {View, Text, TouchableOpacity, InteractionManager} from 'react-native';
import {Calendar, modeToNum, ICalendarEvent} from 'react-native-big-calendar';
import {styles, windowHeight, fontScale, isWeb} from './Styles';
import {strings} from './Strings';
import dayjs from 'dayjs';
import {
  AppointmentTypes,
  AppointmentIcons,
  fetchAppointments,
} from './Appointment';
import {Appointment, AppointmentType} from './Types';
import {
  formatDate,
  timeFormat,
  isToday,
  dayYearDateTimeFormat,
  now,
  jsonDateFormat,
  farDateFormat,
} from './Util';
import {getCachedItem} from './DataCache';
import {PatientTags} from './Patient';
import {getStore, getDoctor} from './DoctorApp';
import {
  Button as NativeBaseButton,
  Portal,
  Dialog,
  Title,
} from 'react-native-paper';

export class AgendaScreen extends Component {
  props: {
    navigation: any,
  };
  state: {
    date: Date,
    mode: any,
    appointments: Appointment[],
    event: Appointment,
    showDialog: boolean,
  };
  today = new Date();
  lastRefresh: number;
  constructor(props: any) {
    super(props);
    this.state = {
      mode: 'week',
      date: this.today,
      appointments: [],
      event: undefined,
      showDialog: false,
    };
    this.lastRefresh = 0;
  }

  componentDidMount() {
    this.refreshAppointments();
  }

  _onSetEvent = (event: Appointment) => {
    this.setState({event: event, showDialog: true});
  };
  async refreshAppointments() {
    if (now().getTime() - this.lastRefresh < 5 * 1000) {
      this.setState(this.state.appointments);
      return;
    }
    this.lastRefresh = now().getTime();
    InteractionManager.runAfterInteractions(() =>
      this.props.navigation.setParams({refreshAppointments: false}),
    );
    let appointments = await fetchAppointments(
      'store-' + getStore().storeId,
      getDoctor().id,
      undefined,
      undefined,
      dayjs(this.today).subtract(2, 'year').format(jsonDateFormat),
    );

    this.setState({appointments});
  }
  _onToday = () => {
    this.setState({date: this.today});
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

  cancelDialog = () => {
    this.setState({event: undefined, showDialog: false});
  };

  openPatientFile = (event: Appointment) => {
    this.cancelDialog();
    this.props.navigation.navigate('appointment', {
      appointment: event,
    });
  };
  renderContent(event: Appointment) {
    const patient: Patient = getCachedItem(event.patientId);
    return (
      <View style={!isWeb ? {Height: 'auto', maxHeight: 150} : undefined}>
        <Title>
          {patient && patient.firstName} {patient && patient.lastName}
          <PatientTags patient={patient} />
        </Title>
        <View style={styles.flexRow}>
          <Text style={styles.text}>
            {isToday(event.start)
              ? formatDate(event.start, timeFormat)
              : formatDate(event.start, dayYearDateTimeFormat)}
          </Text>
          <Text style={styles.text}>{' - '}</Text>
          <Text style={styles.text}>
            {isToday(event.end)
              ? formatDate(event.end, timeFormat)
              : formatDate(event.end, dayYearDateTimeFormat)}
          </Text>
        </View>
        <View style={styles.flexRow}>
          <AppointmentIcons appointment={event} orientation="horizontal" />
        </View>
      </View>
    );
  }
  renderEventDetails() {
    const event: Appointment = this.state.event;
    return (
      <Portal theme={{colors: {backdrop: 'transparent'}}}>
        <Dialog
          style={styles.alert}
          visible={this.state.showDialog}
          onDismiss={this.cancelDialog}
          dismissable={true}>
          <Dialog.Title>
            <AppointmentTypes appointment={event} />
            {event.title}
          </Dialog.Title>
          <Dialog.Content>{this.renderContent(event)}</Dialog.Content>
          <Dialog.Actions>
            <NativeBaseButton onPress={this.cancelDialog}>
              {strings.close}
            </NativeBaseButton>
            <NativeBaseButton onPress={() => this.openPatientFile(event)}>
              {strings.open}
            </NativeBaseButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }
  renderAppointment(event, touchableOpacityProps) {
    const patient: Patient = getCachedItem(event.patientId);
    const appointmentType: AppointmentType =
      event && event.appointmentTypes
        ? getCachedItem(event.appointmentTypes[0])
        : undefined;
    return (
      <TouchableOpacity
        {...touchableOpacityProps}
        style={[
          ...(touchableOpacityProps.style: RecursiveArray<ViewStyle>),
          {
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: 'lightgrey',
            borderLeftColor:
              appointmentType && appointmentType.color
                ? appointmentType.color
                : 'white',
            borderLeftWidth: 10,
            borderStyle: 'solid',
            borderRadius: 6,
          },
        ]}>
        <View>
          <View style={styles.rowLayout}>
            <AppointmentIcons appointment={event} />
            <View style={{marginHorizontal: 5 * fontScale}}>
              <View style={styles.rowLayout}>
                <Text style={styles.text}>
                  {patient && patient.firstName} {patient && patient.lastName}
                </Text>
                <PatientTags patient={patient} />
              </View>
              <Text style={styles.text}>{event.title}</Text>
              <Text style={styles.text}>
                {isToday(event.start)
                  ? formatDate(event.start, timeFormat)
                  : formatDate(event.start, dayYearDateTimeFormat)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
  render() {
    return (
      <View style={styles.page}>
        {this.state.showDialog && this.renderEventDetails()}
        <View
          style={[styles.centeredRowLayout, {justifyContent: 'space-around'}]}>
          <TouchableOpacity onPress={this._onPrevDate}>
            <Text style={styles.linkButton}>{strings.previous}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this._onToday}>
            <Text style={styles.linkButton}>{strings.today}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this._onDaily}>
            <Text style={styles.linkButton}>{strings.daily}</Text>
          </TouchableOpacity>
          <Text style={styles.text}>
            {formatDate(this.state.date, farDateFormat)}
          </Text>
          <TouchableOpacity onPress={this._onWeekly}>
            <Text style={styles.linkButton}>{strings.weekly}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={this._onNextDate}>
            <Text style={styles.linkButton}>{strings.next}</Text>
          </TouchableOpacity>
        </View>
        <Calendar
          date={this.state.date}
          height={windowHeight}
          events={this.state.appointments}
          onPressEvent={(event) => this._onSetEvent(event)}
          mode={this.state.mode}
          renderEvent={(
            event: ICalendarEvent<T>,
            touchableOpacityProps: CalendarTouchableOpacityProps,
          ) => this.renderAppointment(event, touchableOpacityProps)}
        />
      </View>
    );
  }
}

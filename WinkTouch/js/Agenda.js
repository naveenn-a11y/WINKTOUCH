/**
 * @flow
 */
'use strict';

import React, {Component} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  InteractionManager,
  Picker,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {Calendar, modeToNum, ICalendarEvent} from 'react-native-big-calendar';
import {styles, windowHeight, fontScale, isWeb, selectionColor} from './Styles';
import {strings} from './Strings';
import dayjs from 'dayjs';
import {
  AppointmentTypes,
  AppointmentIcons,
  fetchAppointments,
  fetchEvents,
} from './Appointment';
import {Appointment, AppointmentType} from './Types';
import {
  formatDate,
  timeFormat,
  isToday,
  dayYearDateTimeFormat,
  now,
  jsonDateFormat,
  farDateFormat2,
  yearDateFormat,
  isEmpty,
  formatAge,
  prefix,
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {formatCode} from './Codes';
import {FormTextInput} from './Form';
import { fetchVisitHistory} from './Visit';

export class AgendaScreen extends Component {
  props: {
    navigation: any,
  };
  state: {
    date: Date,
    mode: any,
    appointments: Appointment[],
    events: Appointment[],
    event: Appointment,
    showDialog: boolean,
    isLoading: boolean,
  };
  today = new Date();
  lastRefresh: number;
  daysInWeek: number;
  constructor(props: any) {
    super(props);
    this.state = {
      mode: 'custom',
      date: this.today,
      appointments: [],
      events: [],
      event: undefined,
      showDialog: false,
      isLoading: false,
    };
    this.lastRefresh = 0;
    this.daysInWeek = 6;
  }

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.refreshAppointments(true, true, this.daysInWeek);
    });
  }

  _onSetEvent = (event: Appointment) => {
    this.setState({event: event, showDialog: true});
  };
  async refreshAppointments(
    refresh: ?boolean,
    includeDayEvents: ?boolean = false,
    maxDays: number = this.daysInWeek,
  ) {
    if (!refresh && now().getTime() - this.lastRefresh < 5 * 1000) {
      this.setState(this.state.appointments);
      return;
    }
    this.lastRefresh = now().getTime();
    InteractionManager.runAfterInteractions(() =>
      this.props.navigation.setParams({refreshAppointments: false}),
    );
    this.setState({isLoading: true});
    try {
      const fromDate =
        this.state.mode === 'custom'
          ? dayjs(this.state.date).startOf('week')
          : dayjs(this.state.date);
      let appointments = await fetchAppointments(
        'store-' + getStore().storeId,
        getDoctor().id,
        maxDays,
        undefined,
        fromDate.format(jsonDateFormat),
        true,
      );
      if (includeDayEvents) {
        const events = await fetchEvents('store-' + getStore().storeId);
        this.setState({events});
      }
      appointments = [...appointments, ...this.state.events];
      this.setState({appointments, isLoading: false});
    } catch (e) {
      this.setState({isLoading: false});
    }
  }
  _onToday = () => {
    this.setState({date: this.today}, () => {
      this.refreshAppointments(
        true,
        false,
        this.state.mode === 'day' ? 1 : this.daysInWeek,
      );
    });
  };
  _onPrevDate = () => {
    if (this.state.mode === 'month') {
      this.setState({
        date: dayjs(this.state.date)
          .add(dayjs(this.state.date).date() * -1, 'day')
          .toDate(),
      });
    } else {
      this.setState(
        {
          date: dayjs(this.state.date)
            .add(modeToNum(this.state.mode, this.state.date) * -1, 'day')
            .toDate(),
        },
        () => {
          this.refreshAppointments(
            true,
            false,
            this.state.mode === 'day' ? 1 : this.daysInWeek,
          );
        },
      );
    }
  };
  _onNextDate = () => {
    this.setState(
      {
        date: dayjs(this.state.date)
          .add(modeToNum(this.state.mode, this.state.date), 'day')
          .toDate(),
      },
      () => {
        this.refreshAppointments(
          true,
          false,
          this.state.mode === 'day' ? 1 : this.daysInWeek,
        );
      },
    );
  };

  _onSetMode = (mode: string) => {
    this.setState({mode: mode}, () => {
      this.refreshAppointments(
        true,
        false,
        this.state.mode === 'day' ? 1 : this.daysInWeek,
      );
    });
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
    const patient: PatientInfo | Patient = getCachedItem(event.patientId);
    let genderShort: string = formatCode('genderCode', patient.gender);
    if (genderShort.length > 0) genderShort = genderShort.substring(0, 1);
    return (
      <View
        style={
          !isWeb
            ? {height: 400 * fontScale, maxHeight: 800 * fontScale}
            : undefined
        }>
        <AppointmentIcons appointment={event} orientation="horizontal" />

        <Title>
          {patient && patient.firstName} {patient && patient.lastName}
          <View style={styles.rowLayout}>
            <Text style={styles.text}>({genderShort}) </Text>
            <PatientTags patient={patient} showDescription={true} />
            <Text style={styles.text}>
              {patient.dateOfBirth ? formatAge(patient.dateOfBirth) : ''}
            </Text>
          </View>
        </Title>

        <View style={styles.formRow}>
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
        <View style={styles.flexColumnLayout}>
          {!isEmpty(event.supplierName) && (
            <View style={styles.formRow}>
              <Text style={styles.text}>{event.supplierName}</Text>
            </View>
          )}
          {!isEmpty(patient.medicalCard) && (
            <View style={styles.formRow}>
              <Icon name="card-account-details" style={styles.text} />
              <Text style={styles.text}>
                {prefix(patient.medicalCard, '  ')}
                {prefix(patient.medicalCardVersion, '-')}
                {prefix(patient.medicalCardExp, '-')}
              </Text>
            </View>
          )}
          {(!isEmpty(patient.cell) || !isEmpty(patient.phone)) && (
            <View style={styles.formRow}>
              <Icon name="cellphone" style={styles.text} />
              <Text style={[styles.text, {marginLeft: 10 * fontScale}]}>
                {patient.cell ? patient.cell + ' ' : patient.phone}
              </Text>
            </View>
          )}
          {!isEmpty(patient.email) && (
            <View style={styles.formRow}>
              <Icon name="email" style={styles.text} />
              <Text style={[styles.text, {marginLeft: 10 * fontScale}]}>
                {patient.email}
              </Text>
            </View>
          )}
          {!isEmpty(event.comment) && (
            <View style={styles.formRow}>
              <FormTextInput
                label=""
                multiline={true}
                readonly={true}
                value={event.comment}
              />
            </View>
          )}
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
  render() {
    return (
      <View style={styles.page}>
        {this.state.isLoading && this.renderLoading()}
        {this.state.showDialog && this.renderEventDetails()}
        <View style={styles.topFlow}>
          <TouchableOpacity onPress={this._onToday}>
            <Text
              style={
                isWeb
                  ? [styles.textfield, {margin: 10 * fontScale}]
                  : styles.textfield
              }>
              {strings.today}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this._onPrevDate}>
            <Icon name="chevron-left" style={styles.screenIcon} />
          </TouchableOpacity>

          <TouchableOpacity onPress={this._onNextDate}>
            <Icon name="chevron-right" style={styles.screenIcon} />
          </TouchableOpacity>

          <Text style={[styles.h2, {padding: 10 * fontScale}]}>
            {formatDate(
              this.state.date,
              this.state.mode === 'day' ? yearDateFormat : farDateFormat2,
            )}
          </Text>
          <View style={styles.topRight}>
            <Picker
              style={{
                padding: 10 * fontScale,
                width: 200,
                height: 44,
                alignSelf: 'flex-end',
              }}
              itemStyle={{height: 44}}
              selectedValue={this.state.mode}
              onValueChange={(mode) => this._onSetMode(mode)}>
              <Picker.Item value="day" label={strings.daily} />
              <Picker.Item value="custom" label={strings.weekly} />
            </Picker>
          </View>
        </View>
        <NativeCalendar
          date={this.state.date}
          mode={this.state.mode}
          appointments={this.state.appointments}
          _onSetEvent={(event: Appointment) => this._onSetEvent(event)}
        />
      </View>
    );
  }

  renderLoading() {
    if (this.state.isLoading) {
      return (
        <Modal
          visible={this.state.isLoading}
          transparent={true}
          animationType={'none'}
          onRequestClose={this.cancelEdit}>
          <View style={styles.container}>
            {this.state.isLoading && (
              <ActivityIndicator size="large" color={selectionColor} />
            )}
          </View>
        </Modal>
      );
    }
    return null;
  }
}

class Event extends Component {
  props: {
    event: ICalendarEvent<T>,
    touchableOpacityProps: CalendarTouchableOpacityProps,
  };
  state: {
    locked:boolean
  };
  constructor(props: any) {
    super(props);
    this.state = {
     locked: false
    };
  };
  componentDidMount(){this.getLockedState()};
  componentDidUpdate(){this.getLockedState()};
  shouldComponentUpdate(nextProps, nextState) {
    if(this.state.locked === nextState.locked) return false
    return true};
  getLockedState = async ()=>{
    const {patientId, id: appointmentId} = this.props.event;
    const visitHistory: string[] = await fetchVisitHistory(patientId);
    visitHistory.map((visitId) => {
      const visit: Visit = getCachedItem(visitId);
      if (visit.appointmentId == appointmentId && visit.locked) this.setState({locked: true});
    });
  };
  render() {
    const {event,touchableOpacityProps} = this.props;
    const {locked} = this.state
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
            padding: 0,
          },
        ]}>
        <View>
          <View style={styles.rowLayout}>
            <AppointmentIcons appointment={event} />
            <View style={{marginHorizontal: 5 * fontScale}}>
              <View style={styles.rowLayout}>
                <Text style={locked ? styles.grayedText : styles.text}>
                  {patient && patient.firstName} {patient && patient.lastName}
                </Text>
                <PatientTags patient={patient} />
              </View>
              <Text style={locked ? styles.grayedText : styles.text}>{event.title}</Text>
              <Text  style={locked ? styles.grayedText : styles.text}>
                {isToday(event.start)
                  ? formatDate(event.start, timeFormat)
                  : formatDate(event.start, dayYearDateTimeFormat)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
}


class NativeCalendar extends Component {
  props: {
    date: Date,
    mode: any,
    appointments: Appointment[],
    _onSetEvent: (event: Appointment) => void,
  };

  constructor(props: any) {
    super(props);
  }
  componentDidUpdate= async () => {
    console.log('appointments :>> ', this.appointments);
  }
  shouldComponentUpdate(nextProps) {
    return (
      nextProps.mode !== this.props.mode ||
      nextProps.date !== this.props.date ||
      nextProps.appointments !== this.props.appointments
    );
  }



  render() {
    return (
      <Calendar
        date={this.props.date}
        height={windowHeight}
        events={this.props.appointments}
        onPressEvent={(event) => this.props._onSetEvent(event)}
        mode={this.props.mode}
        ampm={true}
        weekStartsOn={1}
        weekEndsOn={6}
        renderEvent={ (
          event: ICalendarEvent<T>,
          touchableOpacityProps: CalendarTouchableOpacityProps,
        ) =>  <Event event={event} touchableOpacityProps={touchableOpacityProps}/>}
      />
    );
  }
}

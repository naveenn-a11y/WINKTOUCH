/**
 * @flow
 */

'use strict';

import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  InteractionManager,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {Calendar, modeToNum, ICalendarEvent} from 'react-native-big-calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  styles,
  windowHeight,
  windowWidth,
  fontScale,
  isWeb,
  selectionColor,
} from './Styles';
import {FormTextInput, FormRow, FormInput} from './Form';
import {strings} from './Strings';
import dayjs from 'dayjs';
import {
  AppointmentTypes,
  AppointmentIcons,
  fetchAppointments,
  fetchEvents,
  isAppointmentLocked,
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
import {getCachedItem, getCachedItems} from './DataCache';
import {getPatientFullName, PatientTags} from './Patient';
import {getStore, getDoctor} from './DoctorApp';
import {
  Button as NativeBaseButton,
  Portal,
  Dialog,
  Title,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {formatCode} from './Codes';
import {fetchVisitForAppointment, fetchVisitHistory} from './Visit';
import {searchUsers} from './User';
import type {Visit} from './Types';
import DropDown from '../src/components/Picker';

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
    doctors: Array,
    selectedDoctors: Array,
    isVisible: boolean,
    dropDown: boolean,
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
      doctors: [],
      selectedDoctors: [],
      isVisible: false,
      dropDown: false,
    };
    this.lastRefresh = 0;
    this.daysInWeek = 6;
  }

  async componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.getDoctors();
      this.getSelectedDoctorsFromStorage();
    });
  }

  async getDoctors() {
    let users: User[] = await searchUsers('', false);
    const doctors = users.map((u) => ({
      label: `${u.firstName} ${u.lastName}`,
      value: u.id,
    }));
    this.setState({doctors});
  }
  getSelectedDoctorsFromStorage = async () => {
    const doctors = await AsyncStorage.getItem('selectedDoctors');
    if (doctors) {
      const selectedDoctors = JSON.parse(doctors);
      this.setState(
        {
          selectedDoctors,
          mode: selectedDoctors.length > 1 && !isWeb ? 'day' : 'custom',
        },
        () => this.refreshAppointments(true, true, this.daysInWeek),
      );
    }
  };
  onChangeSelectedDoctors = async (selectedDoctors) => {
    this.setState({selectedDoctors});
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
        this.state.selectedDoctors,
        maxDays,
        undefined,
        fromDate.format(jsonDateFormat),
        true,
      );
      if (includeDayEvents) {
        const events = await fetchEvents('store-' + getStore().storeId);
        this.setState({events});
      }
      // appointments = [...appointments, ...this.state.events];
      this.setState({appointments, isLoading: false});
    } catch (e) {
      this.setState({isLoading: false});
    }
  }

  _onSetEvent = (event: Appointment) => {
    this.setState({event: event, showDialog: true});
  };
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
  openDoctorsOptions = () => {
    this.setState({isVisible: true});
  };
  cancelDoctorsOptions = () => {
    this.setState({isVisible: false});
  };

  getAppoitmentsForSelectedDoctors = () => {
    AsyncStorage.setItem(
      'selectedDoctors',
      JSON.stringify(this.state.selectedDoctors),
    );
    if (this.state.selectedDoctors.length > 1 && !isWeb) {
      this._onSetMode('day');
    } else {
      this.refreshAppointments(
        true,
        false,
        this.state.mode === 'day' ? 1 : this.daysInWeek,
      );
    }
    this.cancelDoctorsOptions();
  };

  openPatientFile = (event: Appointment) => {
    this.cancelDialog();
    this.props.navigation.navigate('appointment', {
      appointment: event,
    });
  };
  renderContent(event: Appointment) {
    const patient: PatientInfo | Patient = getCachedItem(event.patientId);
    const doctor = this.state.doctors.find(({value}) => event.userId == value);
    let genderShort: string = formatCode('genderCode', patient.gender);
    if (genderShort.length > 0) {
      genderShort = genderShort.substring(0, 1);
    }
    return (
      <View
        style={
          !isWeb
            ? {height: 400 * fontScale, maxHeight: 800 * fontScale}
            : undefined
        }>
        <Text style={styles.text}>Doctor: {doctor.label} </Text>
        <AppointmentIcons appointment={event} orientation="horizontal" />
        <Title>
          {getPatientFullName(patient)}
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
            <Text style={{color: 'black'}}> {event.title}</Text>
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
  renderDoctorsOptions() {
    return (
      <Portal theme={{colors: {backdrop: 'transparent'}}}>
        <Dialog
          style={{
            width: '50%',
            height: '70%',
            alignSelf: 'center',
            backgroundColor: '#fff',
          }}
          visible={this.state.isVisible}
          onDismiss={this.cancelDoctorsOptions}
          dismissable={true}>
          <Dialog.Title>
            <Text style={{color: 'black'}}> {strings.chooseDoctor}</Text>
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={{padding: 10}}>
              <FormInput
                multiOptions={true}
                value={this.state.selectedDoctors}
                showLabel={false}
                readonly={false}
                definition={{options: this.state.doctors}}
                onChangeValue={this.onChangeSelectedDoctors}
                errorMessage={'error'}
                isTyping={false}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <NativeBaseButton onPress={this.cancelDoctorsOptions}>
              {strings.close}
            </NativeBaseButton>
            <NativeBaseButton onPress={this.getAppoitmentsForSelectedDoctors}>
              {strings.apply}
            </NativeBaseButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }
  openDropDown = () => {
    this.setState({dropDown: true});
  };
  closeDropDown = () => {
    this.setState({dropDown: false});
  };
  render() {
    const {isLoading, showDialog, isVisible, mode, dropDown} = this.state;
    const options =
      this.state.selectedDoctors.length > 1 && !isWeb
        ? [{label: strings.daily, value: 'day'}]
        : [
            {label: strings.daily, value: 'day'},
            {label: strings.weekly, value: 'custom'},
          ];

    return (
      <View style={styles.page}>
        {isLoading && this.renderLoading()}
        {showDialog && this.renderEventDetails()}
        {isVisible && this.renderDoctorsOptions()}
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
            <TouchableOpacity
              style={styles.chooseButton}
              onPress={this.openDoctorsOptions}>
              <Text>{strings.chooseDoctor}</Text>
            </TouchableOpacity>
            <View>
              <DropDown
                mode={mode}
                visible={dropDown}
                onClose={this.closeDropDown}
                onShow={this.openDropDown}
                onChange={(mode) => this._onSetMode(mode)}
                options={options}
              />
            </View>
          </View>
        </View>
        <NativeCalendar
          selectedDoctors={this.state.selectedDoctors}
          doctors={this.state.doctors}
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
    selectedDoctors: [],
    eventWidth: Number,
    event: ICalendarEvent<T>,
    touchableOpacityProps: CalendarTouchableOpacityProps,
  };
  state: {
    locked: boolean,
  };
  constructor(props: any) {
    super(props);
    this.state = {locked: false};
  }
  componentDidMount() {
    this.getLockedState();
  }

  getLockedState = async () => {
    const appointment: Appointment = this.props.event;
    let visitHistory: Visit[] = getCachedItems(
      getCachedItem('visitHistory-' + appointment.patientId),
    );
    if (visitHistory) {
      const locked: boolean = isAppointmentLocked(appointment);

      this.setState({locked: locked});
    } else {
      const visit: Visit = await fetchVisitForAppointment(appointment.id);
      this.setState({locked: visit ? visit.locked : false});
    }
  };

  render() {
    const {locked} = this.state;
    const {event, eventWidth, selectedDoctors, touchableOpacityProps} =
      this.props;

    const index = selectedDoctors.findIndex((u) => u == event.userId);
    if (index < 0) {
      return null;
    }
    const eventStyleProps = {
      minWidth: '1%',
      width: eventWidth / 1.05,
      start: eventWidth * index,
    };

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
          eventStyleProps,
          {
            borderWidth: 0.5,
            borderColor: 'lightgrey',
            backgroundColor: '#fff',
            borderLeftColor:
              appointmentType && appointmentType.color
                ? appointmentType.color
                : 'white',
            borderLeftWidth: 5,
            borderStyle: 'solid',
            borderRadius: 4,
            justifyContent: 'center',
            paddingTop: 1,
            paddingBottom: 0,
          },
        ]}>
        <View style={[styles.rowLayout, {height: '100%'}]}>
          <Text style={locked ? styles.grayedText : styles.text}>
            {getPatientFullName(patient)}
          </Text>
          <PatientTags patient={patient} locked={locked} />
          <View style={{flexGrow: 100, alignItems: 'flex-end'}}>
            <AppointmentIcons appointment={event} />
          </View>
        </View>
        {/* </View> */}
      </TouchableOpacity>
    );
  }
}

class NativeCalendar extends Component {
  props: {
    date: Date,
    mode: any,
    selectedDoctors: [],
    doctors: [],
    appointments: Appointment[],
    _onSetEvent: (event: Appointment) => void,
  };
  numOfDays: Number = 7;

  shouldComponentUpdate(nextProps) {
    return (
      nextProps.mode !== this.props.mode ||
      nextProps.date !== this.props.date ||
      nextProps.appointments !== this.props.appointments
    );
  }

  render() {
    const {selectedDoctors, doctors, date, appointments, mode} = this.props;
    const calendarWidth = Dimensions.get('window').width - 180 * fontScale - 50; //window - sidebar - hour range

    const weekCellWidth = calendarWidth / this.numOfDays;
    const weekEventWidth = weekCellWidth / selectedDoctors.length;

    const dayCellWidth = calendarWidth;
    const dayEventWidth = dayCellWidth / selectedDoctors.length;

    const cellWidth = mode == 'day' ? dayCellWidth : weekCellWidth;
    const eventWidth = mode == 'day' ? dayEventWidth : weekEventWidth;

    return (
      <>
        <Calendar
          ampm
          mode={mode}
          date={date}
          height={windowHeight}
          events={appointments}
          weekStartsOn={1}
          weekEndsOn={this.numOfDays}
          hourRowHeight={90}
          showAllDayEventCell={false}
          onPressEvent={(event) => this.props._onSetEvent(event)}
          renderEvent={(
            event: ICalendarEvent<T>,
            touchableOpacityProps: CalendarTouchableOpacityProps,
          ) => (
            <Event
              event={event}
              eventWidth={eventWidth}
              touchableOpacityProps={touchableOpacityProps}
              selectedDoctors={this.props.selectedDoctors}
            />
          )}
          renderHeader={(header: ICalendarEvent<T>) => {
            return (
              <View style={agendaStyles.header(calendarWidth)}>
                {header.dateRange.map((d) => (
                  <View style={agendaStyles.cell(cellWidth)}>
                    <Text style={agendaStyles.date}>
                      {new Date(d).toDateString()}
                    </Text>
                    <View style={agendaStyles.row}>
                      {selectedDoctors.map((d) => {
                        const doc = doctors.find((doc) => doc.value == d);
                        return (
                          <View style={agendaStyles.label(eventWidth)}>
                            <Text numberOfLines={2}>{doc?.label}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            );
          }}
        />
      </>
    );
  }
}

const agendaStyles = {
  header: (w) => ({width: w, flexDirection: 'row', alignSelf: 'flex-end'}),
  cell: (w) => ({width: w, alignItems: 'center', justifyContent: 'center'}),
  date: {fontSize: 15, marginTop: 7, marginBottom: 7, fontWeight: 'bold'},
  row: {flexDirection: 'row'},
  label: (w) => ({
    width: w,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 0.8,
    borderColor: 'lightgray',
  }),
};

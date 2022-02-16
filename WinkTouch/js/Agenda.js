/**
 * @flow
 */
'use strict';

import React, {Component} from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  InteractionManager,
  Picker,
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
import {fetchVisitForAppointment, fetchVisitHistory} from './Visit';
import {searchUsers} from './User';
import type {Visit} from './Types';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';

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
    const selectedDoctors = await AsyncStorage.getItem('selectedDoctors');
    if (!!selectedDoctors) {
      const doctors = JSON.parse(selectedDoctors);
      this.setState(
        {
          selectedDoctors: doctors,
          mode: doctors.length <= 1 ? 'custom' : 'day',
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
      appointments = [...appointments, ...this.state.events];
      let temp = {};
      let events = [];
      appointments.map((ev) => {
        temp[ev.start] = (temp[ev.start] || 0) + 1;
        events.push({...ev, index: temp[ev.start] - 1});
      });
      this.setState({appointments: events, isLoading: false});
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
  openDoctorsOptiosn = () => {
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
    if (this.state.selectedDoctors.length > 1) this._onSetMode('day');
    else
      this.refreshAppointments(
        true,
        false,
        this.state.mode === 'day' ? 1 : this.daysInWeek,
      );
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
  renderDoctorsOptions() {
    return (
      <Portal theme={{colors: {backdrop: 'transparent'}}}>
        <Dialog
          style={{width: '50%', height: '70%', alignSelf: 'center'}}
          visible={this.state.isVisible}
          onDismiss={this.cancelDoctorsOptions}
          dismissable={true}>
          <Dialog.Title>{strings.chooseDoctor}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={{padding: 10}}>
              <FormInput
                label={'choose'}
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
            <NativeBaseButton onPress={this.getAppoitmentsForSelectedDoctors}>
              {strings.apply}
            </NativeBaseButton>
            <NativeBaseButton onPress={this.cancelDoctorsOptions}>
              {strings.close}
            </NativeBaseButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }
  render() {
    const {isLoading, showDialog, isVisible} = this.state;
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
              onPress={this.openDoctorsOptiosn}>
              <Text>{strings.chooseDoctor}</Text>
            </TouchableOpacity>

            <Picker
              style={{padding: 10 * fontScale, width: 200}}
              itemStyle={{height: 44}}
              selectedValue={this.state.mode}
              onValueChange={(mode) => this._onSetMode(mode)}>
              <Picker.Item value="day" label={strings.daily} />
              {this.state.selectedDoctors.length <= 1 && (
                <Picker.Item value="custom" label={strings.weekly} />
              )}
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
    opened: boolean,
    locked: boolean,
    width: Number,
  };
  constructor(props: any) {
    super(props);
    this.state = {
      locked: false,
      opened: false,
      width: 0,
    };
  }
  componentDidMount() {
    this.getLockedState();
    this.setWidth();
    Dimensions.addEventListener('change', () => this.setWidth());
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
  openMenue = () => {
    this.setState({opened: true});
  };
  closeMenue = () => {
    this.setState({opened: false});
  };
  setWidth = () => {
    const dim = Dimensions.get('screen');
    this.setState({width: dim.width});
  };

  render() {
    const {opened, locked, width} = this.state;
    const {mode, events, event, touchableOpacityProps} = this.props;
    const calendarWidth = width - 300;
    const maxNum = mode == 'day' ? Math.floor(calendarWidth / 130) : 3;
    const patient: Patient = getCachedItem(event.patientId);
    const appointmentType: AppointmentType =
      event && event.appointmentTypes
        ? getCachedItem(event.appointmentTypes[0])
        : undefined;
    const eventStyleProps =
      mode == 'day'
        ? {
            marginTop: 20,
            width: calendarWidth / maxNum,
            start: (calendarWidth / maxNum + 5) * event.index,
          }
        : {start: 0, marginTop: event.index * 25};
    const showMoreStyleProps =
      mode == 'day' ? {marginTop: 50} : {marginTop: 70};

    return event.index == maxNum ? (
      <TouchableOpacity
        {...touchableOpacityProps}
        onPress={this.openMenue}
        style={[
          ...(touchableOpacityProps.style: RecursiveArray<ViewStyle>),
          showMoreStyleProps,
          {start: 0, height: 22, backgroundColor: 'transparent'},
        ]}>
        <View>
          <View style={styles.rowLayout}>
            <Menu opened={opened} onBackdropPress={this.closeMenue}>
              <MenuTrigger
                text={`Show all(${events.length})`}
                onPress={this.openMenue}
              />
              <MenuOptions>
                {events.map((e) => (
                  <MenuOption
                    text={e.title}
                    onSelect={touchableOpacityProps.onPress}
                  />
                ))}
              </MenuOptions>
            </Menu>
          </View>
        </View>
      </TouchableOpacity>
    ) : event.index < maxNum ? (
      <TouchableOpacity
        {...touchableOpacityProps}
        style={[
          ...(touchableOpacityProps.style: RecursiveArray<ViewStyle>),
          eventStyleProps,
          {
            height: 22,
            backgroundColor: 'white',
            borderWidth: 0.5,
            borderColor: 'lightgrey',
            borderLeftColor:
              appointmentType && appointmentType.color
                ? appointmentType.color
                : 'white',
            borderLeftWidth: 10,
            borderStyle: 'solid',
            borderRadius: 4,
            justifyContent: 'center',
            paddingTop: 1,
            paddingBottom: 0,
          },
        ]}>
        <View style={[styles.rowLayout, {height: '100%'}]}>
          <AppointmentIcons appointment={event} />
          {/* <View style={{marginHorizontal: 5 * fontScale}}>
               <View style={styles.rowLayout}>
                 <Text style={locked ? styles.grayedText : styles.text}>
                   {patient && patient.firstName} {patient && patient.lastName}
                 </Text>
                 <PatientTags patient={patient} locked={locked} />
               </View> */}
          <Text style={locked ? styles.grayedText : styles.text}>
            {event.title}
          </Text>
          {/* <Text style={locked ? styles.grayedText : styles.text}>
              {isToday(event.start)
                ? formatDate(event.start, timeFormat)
                : formatDate(event.start, dayYearDateTimeFormat)}
            </Text> */}
        </View>
        {/* </View> */}
      </TouchableOpacity>
    ) : null;
  }
}

class NativeCalendar extends Component {
  props: {
    date: Date,
    mode: any,
    appointments: Appointment[],
    _onSetEvent: (event: Appointment) => void,
  };

  shouldComponentUpdate(nextProps) {
    return (
      nextProps.mode !== this.props.mode ||
      nextProps.date !== this.props.date ||
      nextProps.appointments !== this.props.appointments
    );
  }
  render() {
    return (
      <>
        <Calendar
          date={this.props.date}
          height={windowHeight}
          events={this.props.appointments}
          onPressEvent={(event) => this.props._onSetEvent(event)}
          mode={this.props.mode}
          ampm={true}
          weekStartsOn={1}
          weekEndsOn={6}
          renderEvent={(
            event: ICalendarEvent<T>,
            touchableOpacityProps: CalendarTouchableOpacityProps,
          ) => (
            <Event
              event={event}
              events={this.props.appointments}
              mode={this.props.mode}
              touchableOpacityProps={touchableOpacityProps}
            />
          )}
          hourRowHeight={90}
          showAllDayEventCell={false}
        />
      </>
    );
  }
}

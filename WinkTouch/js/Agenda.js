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
import {FormTextInput, FormRow, FormInput, FormOptions, FormCode} from './Form';
import {strings} from './Strings';
import dayjs from 'dayjs';
import {
  AppointmentTypes,
  AppointmentIcons,
  fetchAppointments,
  fetchEvents,
  isAppointmentLocked,
  AppointmentDetails,
  bookAppointment,
  cancelAppointment,
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
import {
  CabinetScreen,
  getPatientFullName,
  PatientCard,
  PatientTags,
} from './Patient';
import {getStore, getDoctor} from './DoctorApp';
import {
  Button as NativeBaseButton,
  Portal,
  Dialog,
  Title,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {formatCode, getAllCodes} from './Codes';
import {fetchVisitForAppointment, fetchVisitHistory} from './Visit';
import {searchUsers} from './User';
import type {CodeDefinition, Patient, PatientInfo, Visit} from './Types';
import DropDown from '../src/components/Picker';
import moment from 'moment';
import {PatientSearch} from './FindPatient';

const calendarWidth = Dimensions.get('window').width - 180 * fontScale - 50;

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
    doctorsModal: boolean,
    isPatientDialogVisible: boolean,
    dropDown: boolean,
    selectedPatient?: patient | PatientInfo,
    cancelModal: boolean,
    cancelReason: string,
    cancelNotes: string,
    deleting: boolean,
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
      doctorsModal: false,
      isPatientDialogVisible: false,
      dropDown: false,
      selectedPatient: undefined,
      cancelModal: false,
      cancelReason: 'patient',
      cancelNotes: '',
      deleting: false,
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
  onChangeCancelReason = (cancelReason) => {
    this.setState({cancelReason});
  };
  onChangeCancelNotes = (cancelNotes) => {
    this.setState({cancelNotes});
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
  isNewEvent(event: Appointment): boolean {
    return isEmpty(event.patientId) && !event.isBusy;
  }

  _onSetEvent = (event: Appointment) => {
    this.setState({event: event});
    if (this.isNewEvent(event)) {
      this.openPatientDialog();
    } else {
      this.setState({showDialog: true});
    }
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
    this.setState({doctorsModal: true});
  };
  cancelDoctorsOptions = () => {
    this.setState({doctorsModal: false});
  };

  openPatientDialog = () => {
    this.setState({isPatientDialogVisible: true});
  };
  cancelPatientDialog = () => {
    this.setState({isPatientDialogVisible: false});
  };
  openCancelDialog = () => {
    this.setState({cancelModal: true});
  };
  cancelCancelDialog = () => {
    this.setState({
      cancelModal: false,
      cancelNotes: '',
      cancelReason: 'patient',
    });
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
  cancelAppointment = async () => {
    this.setState({deleting: true});
    const event: Appointment = this.state.event;
    const res = await cancelAppointment({
      emrOnly: true,
      appointmentId: event.id,
      cancelledComment: this.state.cancelNotes,
      cancelledReason: this.state.cancelReason == 'store' ? 1 : 2,
    });
    if (!!res) {
      this.setState({
        cancelModal: false,
        event: undefined,
        showDialog: false,
        deleting: false,
        cancelNotes: '',
        cancelReason: 'patient',
      });
      this.refreshAppointments(
        true,
        false,
        this.state.mode === 'day' ? 1 : this.daysInWeek,
      );
    } else this.setState({deleting: false});
  };

  openPatientFile = (event: Appointment) => {
    this.cancelDialog();
    this.props.navigation.navigate('appointment', {
      appointment: event,
    });
  };

  updateEvent = async (appointment: Appointment) => {
    //Call Backend

    const bookedAppointment: Appointment = await bookAppointment(
      appointment.patientId,
      appointment.appointmentTypes,
      appointment.numberOfSlots,
      appointment.id,
      appointment.supplierName,
      appointment.earlyRequest,
      appointment.earlyRequestComment,
      false,
      appointment.comment,
    );
    if (bookedAppointment) {
      this.cancelDialog();
    }

    const index = this.state.appointments.findIndex(
      (e: Appointment) => e.id === bookedAppointment.id,
    );

    if (index >= 0) {
      let appointments: Appointment[] = [...this.state.appointments];
      appointments[index] = bookedAppointment;
      this.setState({appointments: appointments});
    }
  };
  selectPatient(patient: Patient | PatientInfo) {
    this.cancelPatientDialog();

    this.setState({selectedPatient: patient, showDialog: true});
  }

  renderEventDetails() {
    let event: Appointment = this.state.event;
    if (event === undefined || event === null) {
      return null;
    }
    const isNewEvent: boolean = this.isNewEvent(event);
    if (isNewEvent) {
      event = Object.assign({patientId: this.state.selectedPatient.id}, event);
      event.title = strings.newAppointment;
    }
    return this.renderAppointmentDetail(event, isNewEvent);
  }

  renderPatientScreen() {
    return (
      <Portal theme={{colors: {backdrop: 'transparent'}}}>
        <Dialog
          style={[styles.screeen, {width: calendarWidth}]}
          visible={this.state.isPatientDialogVisible}
          onDismiss={this.cancelPatientDialog}
          dismissable={true}>
          <CabinetScreen
            onSelectPatient={(patient: Patient | PatientInfo) =>
              this.selectPatient(patient)
            }
            navigation={this.props.navigation}
            isBookingAppointment={true}
          />
        </Dialog>
      </Portal>
    );
  }

  renderAppointmentDetail(event: Appointment, isNewEvent: boolean) {
    return (
      <Portal theme={{colors: {backdrop: 'transparent'}}}>
        <Dialog
          visible={this.state.showDialog}
          onDismiss={this.cancelDialog}
          dismissable={true}
          style={{
            width: '50%',
            minHeight: '40%',
            maxHeight: '90%',
            alignSelf: 'center',
            backgroundColor: '#fff',
          }}>
          <Dialog.Title>
            {!isNewEvent && <AppointmentTypes appointment={event} />}
            <Text style={{color: 'black'}}> {event.title}</Text>
          </Dialog.Title>
          <Dialog.Content>
            <AppointmentDetails
              appointment={event}
              isNewAppointment={isNewEvent}
              onUpdateAppointment={(appointment: Appointment) =>
                this.updateEvent(appointment)
              }
              onOpenAppointment={(appointment: Appointment) =>
                this.openPatientFile(appointment)
              }
              onCloseAppointment={() => this.cancelDialog()}
              onCancelAppointment={() => this.openCancelDialog()}
            />
          </Dialog.Content>
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
          visible={this.state.doctorsModal}
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
  renderCancellationDialog() {
    const event: Appointment = this.state.event;
    const patient: PatientInfo | Patient = getCachedItem(event.patientId);

    return (
      <Portal theme={{colors: {backdrop: 'transparent'}}}>
        <Dialog
          style={{
            // width: '45%',
            // height: '41%',
            // alignSelf: 'center',
            // backgroundColor: '#fff',
            width: '50%',
            minHeight: '40%',
            maxHeight: '90%',
            alignSelf: 'center',
            backgroundColor: '#fff',
          }}
          visible={this.state.cancelModal}
          onDismiss={this.cancelCancelDialog}
          dismissable={true}>
          <Dialog.Title>
            <Text style={{color: 'black'}}> Appointment Cancellation</Text>
          </Dialog.Title>
          <Dialog.Content>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 5,
              }}>
              <Text style={{fontSize: fontScale * 20, fontWeight: '400'}}>
                Patient Name:{' '}
              </Text>
              <Text style={{fontSize: fontScale * 18, fontWeight: '500'}}>
                {patient.firstName} {patient.lastName}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 5,
              }}>
              <Text style={{fontSize: fontScale * 20, fontWeight: '400'}}>
                Cancelled by:{' '}
              </Text>
              <FormInput
                multiOptions
                singleSelect
                value={this.state.cancelReason}
                showLabel={false}
                readonly={false}
                definition={{
                  options: [
                    {label: 'Patient', value: 'patient'},
                    {label: 'Store', value: 'store'},
                  ],
                }}
                onChangeValue={this.onChangeCancelReason}
                errorMessage={'error'}
                isTyping={false}
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 5,
              }}>
              <Text style={{fontSize: fontScale * 20, fontWeight: '400'}}>
                Notes:{'    '}
              </Text>
              <FormInput
                value={this.state.cancelNotes}
                showLabel={false}
                readonly={false}
                onChangeValue={this.onChangeCancelNotes}
                definition={{}}
                multiline
                isTyping={false}
                style={{
                  height: 100,
                  width: '85%',
                  backgroundColor: '#EFEFEF',
                  borderRadius: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <NativeBaseButton onPress={this.cancelCancelDialog}>
              {strings.close}
            </NativeBaseButton>
            <NativeBaseButton
              onPress={this.cancelAppointment}
              disabled={this.state.deleting}>
              {this.state.deleting ? (
                <ActivityIndicator />
              ) : (
                'Cancel Appointment'
              )}
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
    const {
      isLoading,
      showDialog,
      doctorsModal,
      mode,
      dropDown,
      isPatientDialogVisible,
      cancelModal,
    } = this.state;

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
        {isPatientDialogVisible && this.renderPatientScreen()}
        {showDialog && this.renderEventDetails()}
        {doctorsModal && this.renderDoctorsOptions()}
        {cancelModal && this.renderCancellationDialog()}

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

    const patient: Patient = getCachedItem(event.patientId);

    const appointmentType: AppointmentType =
      event && event.appointmentTypes
        ? getCachedItem(event.appointmentTypes[0])
        : undefined;

    const eventStyleProps = {
      minWidth: '1%',
      width: eventWidth / 1.05,
      start: eventWidth * index,
      justifyContent: 'center',
      paddingTop: 1,
      paddingBottom: 0,
      borderRadius: 4,
      borderWidth: 0.5,
      borderColor: 'lightgray',
      borderStyle: 'solid',
      backgroundColor: '#fff',
    };

    return event.isBusy && !patient ? (
      <View
        style={[
          ...(touchableOpacityProps.style: RecursiveArray<ViewStyle>),
          eventStyleProps,
          {backgroundColor: '#EFEFEF'},
        ]}>
        <Text style={styles.grayedText}>{strings.unAvailable}</Text>
      </View>
    ) : !event.isBusy && !patient ? (
      <TouchableOpacity
        {...touchableOpacityProps}
        style={[
          ...(touchableOpacityProps.style: RecursiveArray<ViewStyle>),
          eventStyleProps,
        ]}>
        <Text style={styles.grayedText}>{strings.available}</Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        {...touchableOpacityProps}
        style={[
          ...(touchableOpacityProps.style: RecursiveArray<ViewStyle>),
          eventStyleProps,
          {
            borderLeftWidth: 5,
            borderLeftColor:
              appointmentType && appointmentType.color
                ? appointmentType.color
                : 'white',
          },
        ]}>
        <View style={[styles.rowLayout, {height: '100%'}]}>
          <Text style={locked ? styles.grayedText : styles.text}>
            {patient ? getPatientFullName(patient) : 'Available'}
          </Text>
          {patient && <PatientTags patient={patient} locked={locked} />}
          <View style={{flexGrow: 100, alignItems: 'flex-end'}}>
            <AppointmentIcons appointment={event} />
          </View>
        </View>
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
          swipeEnabled={false}
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
                    <Text style={agendaStyles.day}>
                      {moment(new Date(d)).format('ddd').toUpperCase()}
                    </Text>
                    <Text style={agendaStyles.date}>
                      {moment(new Date(d)).format('D')}
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
  day: {fontSize: 12, fontWeight: 'bold', color: 'gray', marginTop: 10},
  date: {
    fontSize: 18,
    marginTop: 3,
    marginBottom: 8,
    fontWeight: '400',
    opacity: 0.8,
  },
  row: {flexDirection: 'row'},
  label: (w) => ({
    width: w,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 0.8,
    borderColor: 'lightgray',
  }),
};

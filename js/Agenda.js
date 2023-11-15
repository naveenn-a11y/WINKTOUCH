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
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {Calendar, modeToNum, ICalendarEvent} from 'react-native-big-calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {styles, windowHeight, fontScale, isWeb, selectionColor} from './Styles';
import {NavigationActions} from 'react-navigation';
import {FormRow, FormInput} from './Form';
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
  WaitingList,
  manageAvailability,
  cancelAppointment,
  hasAppointmentBookAccess,
  updateAppointment,
  doubleBook,
} from './Appointment';
import {Appointment, AppointmentType} from './Types';
import {
  formatDate,
  now,
  jsonDateFormat,
  farDateFormat2,
  isEmpty,
  yearDateFormat,
  deepClone,
  getValue,
} from './Util';
import {getCachedItem, getCachedItems, cacheItemsById} from './DataCache';
import {CabinetScreen, getPatientFullName, PatientTags} from './Patient';
import {getStore} from './DoctorApp';
import {Button as NativeBaseButton, Portal, Dialog} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {fetchVisitForAppointment} from './Visit';
import {searchUsers} from './User';
import type {CodeDefinition, Patient, PatientInfo, Visit} from './Types';
import moment from 'moment';
import {Button} from './Widgets';
import {AvailabilityModal} from './agendas';
import {getAllCodes} from './Codes';
import {ProfileHeader} from './Profile';
import {Menu} from 'react-native-paper';
import {getPrivileges} from './Rest';

const WEEKDAYS = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};
const OVERLAP_OFFSET: number = 40;
const OVERLAP_PADDING: number = 3;

function getOrderOfEvent(event, eventList) {
  let events = eventList
    .filter(function (e) {
      return (
        (dayjs(event.start).isBetween(e.start, e.end, 'minute', '[)') ||
          dayjs(e.start).isBetween(event.start, event.end, 'minute', '[)')) &&
        e.userId === event.userId
      );
    })
    .sort(function (a, b) {
      if (dayjs(a.start).isSame(b.start)) {
        return dayjs(a.start).diff(a.end) < dayjs(b.start).diff(b.end) ? -1 : 1;
      } else {
        return dayjs(a.start).isBefore(b.start) ? -1 : 1;
      }
    });

  var index = events.indexOf(event);
  const orderOfEvent = index === -1 ? 0 : index;
  return orderOfEvent;
}

function isStoreOpen(
  date: Date,
  minInclusive?: boolean,
  hourRowIndex?: number,
): boolean {
  const storeHours: CodeDefinition[] = getAllCodes('storeHours');
  if (
    storeHours === null ||
    storeHours === undefined ||
    storeHours.length === 0
  ) {
    return true;
  }
  const workDay: CodeDefinition = storeHours.find(
    (element: CodeDefinition) => element.code === date.getDay(),
  );

  if (!workDay.isOpen) {
    return false;
  }
  const strHourOpen: string = workDay.open.substr(0, workDay.open.indexOf(':'));
  const strHourClose: string = workDay.close.substr(
    0,
    workDay.close.indexOf(':'),
  );

  const openHour: number = parseInt(strHourOpen);
  const openMin: number = parseInt(workDay.open.substr(strHourOpen.length + 1));
  const closeHour: number = parseInt(strHourClose);
  const closeMin: number = parseInt(
    workDay.close.substr(strHourClose.length + 1),
  );

  const dateTimeOpen: Date = new Date(date);
  const dateTimeClose: Date = new Date(date);

  const storeOpenTime: number = dateTimeOpen.setHours(
    openHour,
    minInclusive ? openMin : 0,
    0,
  );
  const storeCloseTime: number = dateTimeClose.setHours(
    closeHour,
    minInclusive ? closeMin : 0,
    0,
  );
  if (hourRowIndex >= 0) {
    if (hourRowIndex < openHour || hourRowIndex >= closeHour) {
      return false;
    }
    return true;
  }
  if (date.getTime() < storeOpenTime || date.getTime() >= storeCloseTime) {
    return false;
  }

  return true;
}

export class AgendaScreen extends Component {
  props: {
    navigation: any,
  };
  state: {
    date: Date,
    mode: any,
    appointments: Appointment[],
    waitingListAppointments: Appointment[],
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
    copiedAppointment: Appointment,
    rescheduleAppointment: boolean,
    newAppointment: Appointment,
    waitingListModal: boolean,
    rescheduledAppointment: boolean,
    refresh: boolean,
    doubleBookingModal: boolean,
    selectedTime: any,
    manageAvailabilities: boolean,
    showNewAvailabilityOptions: boolean,
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
      waitingListAppointments: [],
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
      cancelReason: 2,
      cancelNotes: '',
      deleting: false,
      copiedAppointment: undefined,
      rescheduleAppointment: false,
      waitingListModal: false,
      rescheduledAppointment: false,
      refresh: false,
      doubleBookingModal: false,
      selectedTime: undefined,
      manageAvailabilities: false,
      calendarWidth: Dimensions.get('window').width - 180 * fontScale - 50,
      showNewAvailabilityOptions: true,
    };
    this.lastRefresh = 0;
    this.daysInWeek = 7;
  }

  async componentDidMount() {
    this.getDoctors();
    this.getSelectedDoctorsFromStorage();
    Dimensions.addEventListener('change', this._onDimensionsChange);
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this._onDimensionsChange);
    if (this.state.refresh) {
      this.asyncComponentWillUnmount();
    }
  }

  async asyncComponentWillUnmount() {
    if (this.props.navigation.state.params?.refreshStateKey) {
      const setParamsAction = NavigationActions.setParams({
        params: {refresh: true},
        key: this.props.navigation.state.params.refreshStateKey,
      });
      this.props.navigation.dispatch(setParamsAction);
    }
  }
  _onDimensionsChange = () => {
    const width = Dimensions.get('window').width - 180 * fontScale - 50;
    this.setState({calendarWidth: width});
  };

  async getDoctors() {
    let users: User[] = await searchUsers('', false, getStore().id);
    cacheItemsById(users);
    const doctors = users.map((u) => this.convertUserToJson(u));
    this.setState({doctors});
    this.fetchUsersFromAppointments();
  }

  convertUserToJson(user: User): any {
    const userJson: any = {
      label: `${user.firstName} ${user.lastName}`,
      value: user.id,
    };
    return userJson;
  }
  getSelectedDoctorsFromStorage = async () => {
    const doctors = await AsyncStorage.getItem('selectedDoctors');
    if (doctors) {
      let selectedDoctors = JSON.parse(doctors);
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
      this.setState({
        appointments: [...appointments],
        isLoading: false,
      });
    } catch (e) {
      this.setState({isLoading: false});
    }
  }

  async fetchUsersFromAppointments() {
    const fromDate =
      this.state.mode === 'custom'
        ? dayjs(this.state.date).startOf('week')
        : dayjs(this.state.date);
    let doctors: any = deepClone(this.state.doctors);
    let appointments = await fetchAppointments(
      'store-' + getStore().storeId,
      undefined,
      this.daysInWeek,
      undefined,
      fromDate.format(jsonDateFormat),
      false,
      true,
    );
    appointments.map((app: Appointment) => {
      const doc: any = doctors.find((doc) => doc.value === app.userId);
      if (doc === undefined || doc === null) {
        const userJson: any = this.convertUserToJson(getCachedItem(app.userId));
        doctors.push(userJson);
      }
    });
    const selectedDoctors = this.state.selectedDoctors.filter(
      (value: string) => {
        const doc: any = doctors.find((doc) => doc.value === value);
        return doc !== undefined;
      },
    );
    AsyncStorage.setItem('selectedDoctors', JSON.stringify(selectedDoctors));
    this.setState({doctors, selectedDoctors});
  }

  isNewEvent(event: Appointment): boolean {
    return isEmpty(event.patientId) && !event.isBusy;
  }

  _onCellPress = (date: Date) => {
    const oneHour = 60 * 60 * 1000;
    const time = new Date(date).getTime();
    const store = getStore().id;
    const fullAccessAppointment: boolean =
      getPrivileges().appointmentPrivilege === 'FULLACCESS';
    if (!fullAccessAppointment) {
      return;
    }
    if (!isStoreOpen(date, false)) {
      alert(strings.closedStoreTimeSlotErrorMessage);
      return;
    }
    const event = {
      storeId: store,
      start: new Date(moment(time).set({second: 0, millisecond: 0})),
      end: new Date(moment(time + oneHour).set({second: 0, millisecond: 0})),
      emptySlot: true,
    };
    // Check if its within store open Hours

    this.setState({event: event});
    this.openManageAvailabilities(true);
  };
  _onSetEvent = (event: Appointment) => {
    this.setState({event: event});
    if (this.isNewEvent(event)) {
      if (this.state.copiedAppointment) {
        this.setState({rescheduleAppointment: true, newAppointment: event});
      } else {
        this.openManageAvailabilities(false);
      }
    } else {
      event.isBusy
        ? this.openManageAvailabilities(false)
        : this.setState({showDialog: true});
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
          this.fetchUsersFromAppointments();
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
        this.fetchUsersFromAppointments();
      },
    );
  };

  _onSetMode = (mode: string) => {
    this.setState({mode: mode, dropDown: false}, () => {
      this.refreshAppointments(
        true,
        false,
        this.state.mode === 'day' ? 1 : this.daysInWeek,
      );
    });
  };

  cancelDialog = () => {
    this.setState({event: undefined, showDialog: false, isLoading: false});
    if (this.state.selectedTime) {
      this.setState({doubleBookingModal: false, selectedTime: undefined});
    }
  };
  endReschedule = () => {
    this.setState({
      copiedAppointment: undefined,
      rescheduleAppointment: false,
      showDialog: false,
      newAppointment: undefined,
    });
  };
  openDoctorsOptions = () => {
    this.setState({doctorsModal: true});
  };
  cancelDoctorsOptions = () => {
    this.setState({doctorsModal: false});
  };

  setUnavailableAppointment = async (): void => {
    this.setState({isLoading: true});
    this.cancelManageAvailabilities();
    const event: Appointment = this.state.event;
    event.isBusy = true;
    await this.updateEvent(event, false);
    this.refreshAppointments(
      true,
      false,
      this.state.mode === 'day' ? 1 : this.daysInWeek,
    );
    this.setState({isLoading: false});
  };

  resetAppointment = async (): void => {
    this.setState({isLoading: true});
    this.cancelManageAvailabilities();
    const event: Appointment = this.state.event;
    event.inactive = true;
    await this.updateEvent(event, false);
    this.refreshAppointments(
      true,
      false,
      this.state.mode === 'day' ? 1 : this.daysInWeek,
    );

    this.setState({isLoading: false});
  };

  openManageAvailabilities = (showNewOptions: boolean): void => {
    this.setState({showNewAvailabilityOptions: showNewOptions});
    this.setState({manageAvailabilities: true});
  };
  cancelManageAvailabilities = () => {
    this.setState({manageAvailabilities: false});
  };
  openPatientDialog = () => {
    this.cancelManageAvailabilities();
    this.setState({isPatientDialogVisible: true});
  };
  cancelPatientDialog = () => {
    this.setState({
      isPatientDialogVisible: false,
      doubleBookingModal: false,
      selectedTime: undefined,
      selectedPatient: undefined,
    });
  };
  openCancelDialog = () => {
    this.setState({cancelModal: true});
  };
  openDoubleBookDialog = () => {
    this.setState({
      doubleBookingModal: true,
      rescheduleAppointment: false,
      copiedAppointment: undefined,
    });
  };
  cancelCancelDialog = () => {
    this.setState({
      cancelModal: false,
      cancelNotes: '',
      cancelReason: 2,
    });
  };
  cancelDoubleBookDialog = () => {
    this.setState({doubleBookingModal: false});
  };
  openWaitingListDialog = () => {
    this.setState({waitingListModal: true, isPatientDialogVisible: false});
  };
  cancelWaitingListDialog = () => {
    this.setState({waitingListModal: false});
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
    this.setState({
      deleting: true,
      isLoading: true,
      cancelModal: false,
      showDialog: false,
    });
    const event: Appointment = this.state.event;
    const res = await cancelAppointment({
      id: event.id,
      appointmentId: event.id,
      cancelledComment: this.state.cancelNotes,
      cancelledReason: this.state.cancelReason,
    });
    if (res) {
      this.refreshAppointments(
        true,
        false,
        this.state.mode === 'day' ? 1 : this.daysInWeek,
      );
    }
    this.setState({
      isLoading: false,
      event: undefined,
      deleting: false,
      cancelNotes: '',
      cancelReason: 2,
    });
  };

  openPatientFile = (event: Appointment) => {
    this.cancelDialog();
    this.props.navigation.navigate('appointment', {
      appointment: event,
      refresh: true,
    });
  };

  rescheduleEvent = async (appointment: Appointment) => {
    //Call Backend
    const newId = this.state.newAppointment
      ? this.state.newAppointment.id
      : appointment.newId;

    this.setState({
      isLoading: true,
      showDialog: false,
      rescheduleAppointment: false,
    });
    const bookedAppointment: Appointment = await bookAppointment(
      appointment.patientId,
      appointment.appointmentTypes,
      appointment.numberOfSlots,
      newId,
      !isEmpty(getValue(appointment, 'supplier.id'))
        ? appointment.supplier.id
        : 0,
      appointment.earlyRequest,
      appointment.earlyRequestComment,
      true,
      appointment.comment,
      appointment.id,
    );
    this.setState({
      waitingListModal: false,
      rescheduledAppointment: true,
    });

    if (bookedAppointment) {
      this.refreshAppointments(
        true,
        false,
        this.state.mode === 'day' ? 1 : this.daysInWeek,
      );
    }
    setTimeout(() => this.setState({rescheduledAppointment: false}), 5000);
    this.cancelDialog();
    this.endReschedule();
  };

  updateEvent = async (appointment: Appointment, isNewEvent?: boolean) => {
    let updatedAppointment: Appointment;
    if (isNewEvent) {
      updatedAppointment = await bookAppointment(
        appointment.patientId,
        appointment.appointmentTypes,
        appointment.numberOfSlots,
        appointment.id,
        !isEmpty(getValue(appointment, 'supplier.id'))
          ? appointment.supplier.id
          : 0,
        appointment.earlyRequest,
        appointment.earlyRequestComment,
        false,
        appointment.comment,
      );
    } else {
      updatedAppointment = await updateAppointment(appointment);
    }
    if (
      (isNewEvent && updatedAppointment) ||
      (updatedAppointment && appointment.status === 2)
    ) {
      this.cancelDialog();
    }

    let appointments: Appointment[];
    if (appointment.status === 2) {
      this.refreshAppointments(
        true,
        false,
        this.state.mode === 'day' ? 1 : this.daysInWeek,
      );
    } else {
      const index = this.state.appointments.findIndex(
        (e: Appointment) => e.id === updatedAppointment.id,
      );
      if (index >= 0) {
        appointments = [...this.state.appointments];
        appointments[index] = updatedAppointment;
      }
    }

    if (!isNewEvent && appointment.status !== 2) {
      this.setState({
        event: updatedAppointment,
        appointments: appointments,
        refresh: true,
      });
    } else if (isNewEvent && appointment.status !== 2) {
      this.setState({
        appointments: appointments,
        refresh: true,
      });
    }
  };

  onDoubleBooking = async (appointment: Appointment) => {
    this.setState({isLoading: true, showDialog: false});
    const selectedTime = this.state.selectedTime;

    const res = await doubleBook(
      appointment.patientId,
      appointment.appointmentTypes,
      appointment.id,
      selectedTime.time,
      selectedTime.atEnd,
      appointment.comment,
    );
    if (res) {
      this.refreshAppointments(
        true,
        false,
        this.state.mode === 'day' ? 1 : this.daysInWeek,
      );
    }
    this.setState({
      isLoading: false,
      doubleBookingModal: false,
      selectedTime: undefined,
      event: null,
    });
  };

  updateAvailability = async (event: Appointment) => {
    this.setState({isLoading: true});

    const start = moment(event.start).toISOString(true);

    const startMill = moment(event.start).toDate().getTime();
    const endMill = moment(event.end).toDate().getTime();
    const startTime = moment(event?.start).format('h:mm a');
    const endTime = moment(event?.end).format('h:mm a');
    const duration = moment.duration(moment(event.end).diff(start)).asMinutes();
    if (!isStoreOpen(new Date(event.start), true) || !isStoreOpen(new Date(event.end), true)) {
      this.setState({isLoading: false});
      alert(strings.closedStoreTimeSlotErrorMessage);
      return;
    }
    const {errors, appointment}: Appointment = await manageAvailability(
      event?.userId,
      event.slotType == 1 ? 0 : 3,
      duration,
      startMill,
      endMill,
      startTime,
      endTime,
      event.appointmentTypes,
    );
    if (errors) {
      alert(errors[0]);
    } else {
      this.cancelManageAvailabilities();
      this.refreshAppointments(
        true,
        false,
        this.state.mode === 'day' ? 1 : this.daysInWeek,
      );
    }
    this.setState({isLoading: false});
  };

  selectPatient(patient: Patient | PatientInfo) {
    this.setState({
      selectedPatient: patient,
      showDialog: true,
      isPatientDialogVisible: false,
    });
  }

  renderEventDetails() {
    let event: Appointment = {...this.state.event};
    if (event === undefined || event === null) {
      return null;
    }
    const isNewEvent: boolean = this.isNewEvent(event);
    let isDoublebooking: boolean = false;

    if (isNewEvent) {
      event = Object.assign({patientId: this.state.selectedPatient.id}, event);
      event.title = strings.newAppointment;
    }
    if (this.state.selectedTime) {
      isDoublebooking = true;
      event.patientId = this.state.selectedPatient?.id;
      event.title = strings.doubleBook;
      event.comment = '';
      event.earlyRequest = false;
      event.earlyRequestComment = '';
    }
    return this.renderAppointmentDetail(event, isNewEvent, isDoublebooking);
  }

  renderPatientScreen() {
    const isDoubleBooking: boolean = this.state.selectedTime;
    return (
      <Portal theme={{colors: {backdrop: 'transparent'}}}>
        <Dialog
          style={[styles.screeen, {width: this.state.calendarWidth}]}
          visible={this.state.isPatientDialogVisible}
          onDismiss={this.cancelPatientDialog}
          dismissable={true}>
          <CabinetScreen
            onSelectPatient={(patient: Patient | PatientInfo) =>
              this.selectPatient(patient)
            }
            navigation={this.props.navigation}
            isBookingAppointment={true}
            openWaitingListDialog={
              !isDoubleBooking && this.openWaitingListDialog
            }
          />
        </Dialog>
      </Portal>
    );
  }

  doubleBookingTimeField = () => {
    const Label = this.state.selectedTime.atEnd ? strings.last : strings.first;
    return (
      <View style={styles.doubleBookingTimeField}>
        <Text>
          {this.state.selectedTime.time === 0
            ? strings.sameSlot
            : `${
                Label + ' ' + this.state.selectedTime.time + ' ' + strings.mins
              }`}
        </Text>
      </View>
    );
  };
  onUpdateAppointment = (
    appointment: Appointment,
    isDoublebooking: boolean,
    rescheduleAppointment: boolean,
    isNewEvent: ?boolean,
  ) => {
    if (isDoublebooking) {
      this.onDoubleBooking(appointment);
    } else if (rescheduleAppointment) {
      this.rescheduleEvent(appointment);
    } else {
      this.updateEvent(appointment, isNewEvent);
    }
  };

  renderAppointmentDetail(
    event: Appointment,
    isNewEvent: boolean,
    isDoublebooking: boolean,
    rescheduleAppointment: boolean,
  ) {
    return (
      <Portal theme={{colors: {backdrop: 'transparent'}}}>
        <Dialog
          visible={
            rescheduleAppointment
              ? this.state.rescheduleAppointment
              : this.state.showDialog
          }
          onDismiss={
            rescheduleAppointment ? this.endReschedule : this.cancelDialog
          }
          dismissable={true}
          style={styles.AppointmentDialog}>
          <Dialog.Title>
            <FormRow>
              {!isNewEvent && <AppointmentTypes appointment={event} />}
              <Text style={{color: 'black'}}> {event.title}</Text>
              {isDoublebooking && this.doubleBookingTimeField()}
            </FormRow>
          </Dialog.Title>

          <Dialog.Content>
            <AppointmentDetails
              appointment={event}
              isNewAppointment={isNewEvent}
              onOpenAppointment={(appointment: Appointment) =>
                this.openPatientFile(appointment)
              }
              onCancelAppointment={() => this.openCancelDialog()}
              isDoublebooking={isDoublebooking}
              rescheduleAppointment={rescheduleAppointment}
              onCopyAppointment={this.setCopiedAppointment}
              openDoubleBookingModal={this.openDoubleBookDialog}
              onCloseAppointment={() => {
                rescheduleAppointment
                  ? this.endReschedule()
                  : this.cancelDialog();
              }}
              onUpdateAppointment={(appointment: Appointment) => {
                this.onUpdateAppointment(
                  appointment,
                  isDoublebooking,
                  rescheduleAppointment,
                  isNewEvent,
                );
              }}
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
          style={styles.AppointmentDialog}
          visible={this.state.cancelModal}
          onDismiss={this.cancelCancelDialog}
          dismissable={true}>
          <Dialog.Title>
            <Text style={{color: 'black'}}>{strings.cancelAppointment}</Text>
          </Dialog.Title>
          <Dialog.Content>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 5,
              }}>
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
                {strings.cancelledBy}
              </Text>
              <FormInput
                multiOptions
                singleSelect
                value={this.state.cancelReason}
                showLabel={false}
                readonly={false}
                definition={{
                  options: [
                    {label: strings.patient, value: 2},
                    {label: strings.store, value: 1},
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
                strings.cancelAppointment
              )}
            </NativeBaseButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }
  renderDoubleBookDialog() {
    const times = [5, 10, 15, 20, 25, 30, 45, 60];
    const onSelectTime = (atEnd: Boolean, time: number) => {
      this.setState({
        selectedTime: {atEnd, time},
        isPatientDialogVisible: true,
        showDialog: false,
        doubleBookingModal: false,
      });
    };

    return (
      <Portal theme={{colors: {backdrop: 'transparent'}}}>
        <Dialog
          style={[styles.AppointmentDialog, {minHeight: '45%'}]}
          visible={this.state.doubleBookingModal}
          onDismiss={this.cancelDoubleBookDialog}
          dismissable={true}>
          <Dialog.Title>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                justifyContent: 'space-between',
              }}>
              <Text style={{color: 'black'}}>{strings.doubleBook}</Text>
              <Button
                buttonStyle={{paddingHorizontal: 14, paddingVertical: 7}}
                title={strings.sameSlot}
                onPress={() => onSelectTime(false, 0)}
              />
            </View>
          </Dialog.Title>
          <Dialog.Content>
            <View style={{display: 'flex', flexDirection: 'column'}}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  width: '100%',
                  alignItems: 'center',
                }}>
                <View style={{width: fontScale * 90}}>
                  <Text style={{fontSize: fontScale * 25, fontWeight: '500'}}>
                    {strings.first}
                  </Text>
                </View>

                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    maxWidth: '85%',
                  }}>
                  {times.map((time, index) => {
                    return (
                      <Button
                        buttonStyle={{
                          paddingHorizontal: 18,
                          paddingVertical: 7,
                          width: 92,
                          textAlign: 'center',
                        }}
                        key={'time' + index}
                        title={
                          time === 60
                            ? '1 ' + strings.hour
                            : time + ' ' + strings.mins
                        }
                        onPress={() => onSelectTime(false, time)}
                      />
                    );
                  })}
                </View>
              </View>

              <View
                style={{
                  marginTop: 10,
                  display: 'flex',
                  flexDirection: 'row',
                  width: '100%',
                  alignItems: 'center',
                }}>
                <View style={{width: fontScale * 90}}>
                  <Text style={{fontSize: fontScale * 25, fontWeight: '500'}}>
                    {strings.last}
                  </Text>
                </View>

                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    maxWidth: '85%',
                  }}>
                  {times.map((time, index) => {
                    return (
                      <Button
                        key={'time' + index}
                        buttonStyle={{
                          paddingHorizontal: 18,
                          paddingVertical: 7,
                          width: 92,
                          textAlign: 'center',
                        }}
                        title={
                          time === 60
                            ? '1 ' + strings.hour
                            : time + ' ' + strings.mins
                        }
                        onPress={() => onSelectTime(true, time)}
                      />
                    );
                  })}
                </View>
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <NativeBaseButton onPress={this.cancelDoubleBookDialog}>
              {strings.close}
            </NativeBaseButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }

  renderCopyDialog() {
    const patient: PatientInfo | Patient = getCachedItem(
      this.state.copiedAppointment.patientId,
    );
    return (
      <View style={styles.copyDialog}>
        <Text style={styles.copyText}>
          {`${strings.appointmentFor} ${getPatientFullName(patient)} ${
            strings.successfullyCopied
          }`}
        </Text>
      </View>
    );
  }
  renderRescheduleFromWaitingListDialog() {
    return (
      <View style={styles.copyDialog}>
        <Text style={styles.copyText}>{strings.successfullyRescheduled}</Text>
      </View>
    );
  }
  renderRescheduleDialog() {
    let event: Appointment = this.state.copiedAppointment;
    if (event === undefined || event === null) {
      return null;
    }
    event = Object.assign({patientId: event.patientId}, event);
    event.title = strings.rescheduleAppointment;
    return this.renderAppointmentDetail(event, true, false, true);
  }

  openDropDown = () => {
    this.setState({dropDown: true});
  };
  closeDropDown = () => {
    this.setState({dropDown: false});
  };
  setCopiedAppointment = (event: Appointment = null) => {
    if (event) {
      this.cancelDialog();
      this.setState({
        copiedAppointment: event,
      });
    } else {
      this.setState({copiedAppointment: null});
    }
  };

  renderWaitingList() {
    return (
      <WaitingList
        event={this.state.event}
        waitingListModal={this.state.waitingListModal}
        onCloseWaitingList={this.cancelWaitingListDialog}
        onUpdateAppointment={(appointment: Appointment) =>
          this.rescheduleEvent(appointment)
        }
      />
    );
  }

  renderDropDownButton(
    options: [{label: string, value: string}],
    mode: string,
  ) {
    return (
      <TouchableOpacity onPress={this.openDropDown}>
        <View style={[styles.chooseButton, {flexDirection: 'row'}]}>
          <Text
            style={{marginLeft: 10 * fontScale, marginRight: 10 * fontScale}}>
            {this.getModeLabel(options, mode)}
          </Text>
          <Icon name="chevron-down" color="gray" />
        </View>
      </TouchableOpacity>
    );
  }

  getModeLabel(
    options: [{label: string, value: string}],
    mode: string,
  ): string {
    let result = options.find((option) => {
      return option.value === mode;
    });
    return result !== undefined ? result.label : '';
  }

  render() {
    const {
      isLoading,
      showDialog,
      doctorsModal,
      mode,
      dropDown,
      isPatientDialogVisible,
      cancelModal,
      copiedAppointment,
      rescheduleAppointment,
      waitingListModal,
      rescheduledAppointment,
      doubleBookingModal,
      manageAvailabilities,
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
        {isPatientDialogVisible && this.renderPatientScreen()}
        {showDialog && !rescheduleAppointment && this.renderEventDetails()}
        {doctorsModal && this.renderDoctorsOptions()}
        {cancelModal && this.renderCancellationDialog()}
        {copiedAppointment && this.renderCopyDialog()}
        {rescheduleAppointment && this.renderRescheduleDialog()}
        {doubleBookingModal && this.renderDoubleBookDialog()}
        {rescheduledAppointment && this.renderRescheduleFromWaitingListDialog()}
        {waitingListModal && this.renderWaitingList()}
        {manageAvailabilities && (
          <AvailabilityModal
            show={this.state.manageAvailabilities}
            selectedDoctors={this.state.selectedDoctors}
            event={this.state.event}
            updateAvailability={this.updateAvailability}
            cancelManageAvailabilities={this.cancelManageAvailabilities}
            showNewAvailabilityOptions={this.state.showNewAvailabilityOptions}
            setUnavailableAppointment={this.setUnavailableAppointment}
            resetAppointment={this.resetAppointment}
            bookAppointment={this.openPatientDialog}
          />
        )}

        {this.state.calendarWidth < 900 && <ProfileHeader />}
        <View style={[styles.topFlow, styles.topFlow2]}>
          {this.state.calendarWidth >= 900 && <ProfileHeader />}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <TouchableOpacity
              style={styles.chooseButton}
              onPress={this._onToday}>
              <Text>{strings.today}</Text>
            </TouchableOpacity>
            <View
              style={{
                flexDirection: 'row',
                marginLeft: 30 * fontScale,
                marginRight: 20 * fontScale,
              }}>
              <TouchableOpacity onPress={this._onPrevDate}>
                <Icon
                  name="chevron-left"
                  style={[styles.screenIcon, styles.paddingLeftRight10]}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={this._onNextDate}>
                <Icon
                  name="chevron-right"
                  style={[styles.screenIcon, styles.paddingLeftRight10]}
                />
              </TouchableOpacity>
            </View>
            <View>
              <Text style={styles.h3}>
                {formatDate(
                  this.state.date,
                  this.state.mode === 'day' ? yearDateFormat : farDateFormat2,
                )}
              </Text>
            </View>
          </View>

          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity
              style={styles.chooseButton}
              onPress={this.openDoctorsOptions}>
              <Text>{strings.chooseDoctor}</Text>
            </TouchableOpacity>
            <View>
              <Menu
                visible={dropDown}
                onDismiss={this.closeDropDown}
                style={{
                  paddingTop: 50 * fontScale,
                  paddingLeft: 10 * fontScale,
                }}
                anchor={this.renderDropDownButton(options, mode)}>
                {options.map((option) => {
                  return (
                    <Menu.Item
                      onPress={() => this._onSetMode(option.value)}
                      title={option.label}
                    />
                  );
                })}
              </Menu>
            </View>
          </View>
        </View>
        <NativeCalendar
          calendarWidth={this.state.calendarWidth}
          selectedDoctors={this.state.selectedDoctors}
          doctors={this.state.doctors}
          date={this.state.date}
          mode={this.state.mode}
          appointments={this.state.appointments}
          _onSetEvent={(event: Appointment) => this._onSetEvent(event)}
          _onCellPress={(event: Date) => this._onCellPress(event)}
        />
        {isLoading && this.renderLoading()}
      </View>
    );
  }

  renderLoading() {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={selectionColor} />
      </View>
    );
  }
}

class Event extends Component {
  props: {
    selectedDoctors: [],
    eventWidth: Number,
    event: ICalendarEvent<T>,
    eventOrder: number,
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
  /*
   getLockedState = async () => {
    const appointment: Appointment = this.props.event;
    if (!appointment.emptySlot) {
      let visitHistory: Visit[] = getCachedItems(
        getCachedItem('visitHistory-' + appointment.patientId),
      );
      if (visitHistory) {
        const locked: boolean = isAppointmentLocked(appointment);
        this.setState({locked: locked});
      } else if (appointment.patientId && appointment.status !== 2) {
        const visit: Visit = await fetchVisitForAppointment(appointment.id);
        this.setState({locked: visit ? visit.locked : false});
      }
    }
  };
  */
  getLockedState = async () => {
    const appointment: Appointment = this.props.event;
    if (!appointment.emptySlot) {
      const locked: boolean = isAppointmentLocked(appointment);
      this.setState({locked: locked});
    }
  };

  render() {
    const {locked} = this.state;
    const {event, eventWidth, selectedDoctors, touchableOpacityProps} =
      this.props;

    const index = selectedDoctors.findIndex((u) => u === event.userId);
    if (index < 0) {
      return null;
    }

    const patient: Patient = getCachedItem(event.patientId);
    const appointmentType: AppointmentType =
      event && event.appointmentTypes
        ? getCachedItem(event.appointmentTypes[0])
        : undefined;
    let start: number = 0;
    if (this.props.eventOrder === undefined || this.props.eventOrder === null) {
      start = 0;
    } else {
      start = this.props.eventOrder * OVERLAP_OFFSET;
    }
    start += OVERLAP_PADDING;
    if (start > eventWidth) {
      start = 0;
    }

    let startRatio = start / 1.05;
    const zIndex = start <= 0 ? 1 : parseInt(start);
    const eventStyleProps = {
      minWidth: '1%',
      width: eventWidth / 1.05 - startRatio,
      start: eventWidth * index + start,
      justifyContent: 'center',
      paddingTop: 1,
      paddingBottom: 0,
      borderRadius: 4,
      borderWidth: 0.5,
      borderColor: 'lightgray',
      borderStyle: 'solid',
      backgroundColor: '#fff',
      zIndex: zIndex,
    };
    return event.isBusy && !patient ? (
      <TouchableOpacity
        {...touchableOpacityProps}
        style={[
          ...(touchableOpacityProps.style: RecursiveArray<ViewStyle>),
          eventStyleProps,
          {backgroundColor: '#EFEFEF'},
        ]}>
        <Text style={styles.grayedText}>{strings.unAvailable}</Text>
      </TouchableOpacity>
    ) : !event.isBusy && !patient ? (
      <TouchableOpacity
        {...touchableOpacityProps}
        style={[
          ...(touchableOpacityProps.style: RecursiveArray<ViewStyle>),
          eventStyleProps,
          event.emptySlot ? {backgroundColor: '#EFEFEF', zIndex: 0} : {},
        ]}
        disabled={!hasAppointmentBookAccess(event) && !event.emptySlot}>
        {!event.emptySlot && (
          <Text style={styles.grayedText}>{strings.available}</Text>
        )}
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
    calendarWidth: any,
    appointments: Appointment[],
    _onSetEvent: (event: Appointment) => void,
    _onCellPress: (event: Date) => void,
  };
  numOfDays: Number = 7;

  shouldComponentUpdate(nextProps) {
    return (
      nextProps.mode !== this.props.mode ||
      nextProps.date !== this.props.date ||
      nextProps.appointments !== this.props.appointments ||
      nextProps.calendarWidth !== this.props.calendarWidth
    );
  }

  render() {
    const {selectedDoctors, doctors, date, appointments, mode, calendarWidth} =
      this.props;

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
          overlapOffset={OVERLAP_OFFSET}
          mode={mode}
          date={date}
          swipeEnabled={false}
          height={windowHeight}
          events={appointments}
          weekStartsOn={0}
          weekEndsOn={6}
          hourRowHeight={90}
          scrollOffsetMinutes={480}
          showAllDayEventCell={false}
          onPressCell={(event) => this.props._onCellPress(event)}
          onPressEvent={(event) => this.props._onSetEvent(event)}
          calendarCellStyle={(date, hourRowIndex) => {
            let cellStyles = {
              backgroundColor: 'white',
              color: 'white',
            };

            if (!isStoreOpen(date, true, hourRowIndex)) {
              cellStyles = {
                ...cellStyles,
                backgroundColor: '#f5f5f5',
              };
            } else {
              cellStyles = {
                ...cellStyles,
              };
            }

            return cellStyles;
          }}
          renderEvent={(
            event: ICalendarEvent<T>,
            touchableOpacityProps: CalendarTouchableOpacityProps,
          ) => (
            <Event
              event={event}
              eventOrder={getOrderOfEvent(event, appointments)}
              eventWidth={eventWidth}
              touchableOpacityProps={touchableOpacityProps}
              selectedDoctors={this.props.selectedDoctors}
              key={event?.id}
            />
          )}
          renderHeader={(header: ICalendarEvent<T>) => {
            return (
              <View style={agendaStyles.header(calendarWidth)}>
                {header.dateRange.map((d, index) => (
                  <View style={agendaStyles.cell(cellWidth)} key={index + d}>
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
                          <View
                            key={doc?.label + index}
                            style={agendaStyles.label(eventWidth)}>
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

export const agendaStyles = {
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
  input: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: 'lightgray',
    paddingVertical: 5,
    paddingHorizontal: 5,
    flex: 100,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
  },
};

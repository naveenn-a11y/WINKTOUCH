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
import {FormInput, FormOptions, FormRow} from './Form';
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
  manageAvailability,
  cancelAppointment,
  hasAppointmentBookAccess,
  getAppointmentTypes,
} from './Appointment';
import {Appointment, AppointmentType} from './Types';
import {
  formatDate,
  now,
  jsonDateFormat,
  farDateFormat2,
  isEmpty,
  yearDateFormat,
  timeFormat,
  dateFormat,
  yearDateTimeFormat,
} from './Util';
import {getCachedItem, getCachedItems} from './DataCache';
import {CabinetScreen, getPatientFullName, PatientTags} from './Patient';
import {getStore} from './DoctorApp';
import {Button as NativeBaseButton, Portal, Dialog} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {fetchVisitForAppointment} from './Visit';
import {searchUsers} from './User';
import type {Patient, PatientInfo, Visit} from './Types';
import DropDown from '../src/components/Picker';
import moment from 'moment';

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
    copiedAppointment: Appointment,
    rescheduleAppointment: boolean,
    newAppointment: Appointment,
    manageAvailabilities: boolean,
    slot: boolean,
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
      cancelReason: 2,
      cancelNotes: '',
      deleting: false,
      copiedAppointment: undefined,
      rescheduleAppointment: false,
      manageAvailabilities: false,
      slot: 1,
      duration: 30,
      appointmentTypes: [],
      calendarWidth: Dimensions.get('window').width - 180 * fontScale - 50,
    };
    this.lastRefresh = 0;
    this.daysInWeek = 7;
  }

  async componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.getDoctors();
      this.getSelectedDoctorsFromStorage();
      Dimensions.addEventListener('change', this._onDimensionsChange);
    });
  }
  _onDimensionsChange = () => {
    const width = Dimensions.get('window').width - 180 * fontScale - 50;
    this.setState({calendarWidth: width});
  };

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
      const emptySlots = this.createEmptySlots(appointments);
      this.setState({
        appointments: [...emptySlots, ...appointments],
        isLoading: false,
      });
    } catch (e) {
      this.setState({isLoading: false});
    }
  }
  isNewEvent(event: Appointment): boolean {
    return isEmpty(event.patientId) && !event.isBusy;
  }

  _onSetEvent = (event: Appointment) => {
    this.setState({event: event});
    if (event.emptySlot) {
      this.openManageAvailabilities();
    } else if (this.isNewEvent(event)) {
      if (this.state.copiedAppointment) {
        this.setState({rescheduleAppointment: true, newAppointment: event});
      } else {
        this.openPatientDialog();
      }
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
  openManageAvailabilities = () => {
    this.setState({manageAvailabilities: true});
  };
  cancelManageAvailabilities = () => {
    this.setState({manageAvailabilities: false, appointmentTypes: [], slot: 1});
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
      cancelReason: 2,
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
      id: event.id,
      appointmentId: event.id,
      cancelledComment: this.state.cancelNotes,
      cancelledReason: this.state.cancelReason,
    });
    if (res) {
      this.setState({
        cancelModal: false,
        event: undefined,
        showDialog: false,
        deleting: false,
        cancelNotes: '',
        cancelReason: 2,
      });
      this.refreshAppointments(
        true,
        false,
        this.state.mode === 'day' ? 1 : this.daysInWeek,
      );
    } else {
      this.setState({deleting: false});
    }
  };

  openPatientFile = (event: Appointment) => {
    this.cancelDialog();
    this.props.navigation.navigate('appointment', {
      appointment: event,
    });
  };

  rescheduleEvent = async (appointment: Appointment) => {
    //Call Backend
    const bookedAppointment: Appointment = await bookAppointment(
      appointment.patientId,
      appointment.appointmentTypes,
      appointment.numberOfSlots,
      this.state.newAppointment.id,
      appointment.supplierName,
      appointment.earlyRequest,
      appointment.earlyRequestComment,
      true,
      appointment.comment,
      appointment.id,
    );

    if (bookedAppointment) {
      this.cancelDialog();
      this.endReschedule();
      this.refreshAppointments(
        true,
        false,
        this.state.mode === 'day' ? 1 : this.daysInWeek,
      );
    }
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
      this.refreshAppointments(
        true,
        false,
        this.state.mode === 'day' ? 1 : this.daysInWeek,
      );
    }
  };
  updateAvailability = async () => {
    const start = moment(this.state.event.start).toISOString(true);
    const end = moment(start)
      .add(this.state.duration, 'minutes')
      .toISOString(true);
    const {errors, appointment}: Appointment = await manageAvailability(
      this.state.event?.userId,
      this.state.slot == 1 ? 0 : 3,
      this.state.duration,
      start,
      end,
      this.state.appointmentTypes,
    );
    if (errors) alert(errors[0]);
    else {
      this.cancelManageAvailabilities();
      this.refreshAppointments(
        true,
        false,
        this.state.mode === 'day' ? 1 : this.daysInWeek,
      );
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
          />
        </Dialog>
      </Portal>
    );
  }

  renderAppointmentDetail(
    event: Appointment,
    isNewEvent: boolean,
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
              rescheduleAppointment={rescheduleAppointment}
              isNewAppointment={isNewEvent}
              onUpdateAppointment={(appointment: Appointment) => {
                rescheduleAppointment
                  ? this.rescheduleEvent(appointment)
                  : this.updateEvent(appointment);
              }}
              onOpenAppointment={(appointment: Appointment) =>
                this.openPatientFile(appointment)
              }
              onCancelAppointment={() => this.openCancelDialog()}
              onCloseAppointment={() => {
                rescheduleAppointment
                  ? this.endReschedule()
                  : this.cancelDialog();
              }}
              onCopyAppointment={(appointment: Appointment) => {
                this.setCopiedAppointment(appointment);
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
  renderAppointmentsTypes() {
    const updateValue = (val, index) => {
      let apps = this.state.appointmentTypes;
      if (val) apps.push(val);
      else apps.splice(index, 1);
      this.setState({appointmentTypes: apps});
    };
    let appointmentsType: string[] = this.state.appointmentTypes;
    let dropdowns = [];
    dropdowns.push(
      <FormRow>
        <FormOptions
          options={getAppointmentTypes()}
          showLabel={false}
          label={strings.AppointmentType}
          value={appointmentsType ? appointmentsType[0] : ''}
          onChangeValue={(code: ?string | ?number) => updateValue(code, 0)}
        />
      </FormRow>,
    );
    if (appointmentsType && appointmentsType.length >= 1) {
      for (let i: number = 1; i <= appointmentsType.length; i++) {
        if (i < 5) {
          dropdowns.push(
            <FormRow>
              <FormOptions
                options={getAppointmentTypes()}
                showLabel={false}
                label={strings.AppointmentType}
                value={appointmentsType[i]}
                onChangeValue={(code: ?string | ?number) =>
                  updateValue(code, i)
                }
              />
            </FormRow>,
          );
        }
      }
    }

    return dropdowns;
  }
  renderManageAvailabilities() {
    const doctor: User = getCachedItem(this.state.event?.userId);
    const start = this.state.event?.start;
    return (
      <Portal theme={{colors: {backdrop: 'transparent'}}}>
        <Dialog
          style={{width: '50%', alignSelf: 'center', backgroundColor: '#fff'}}
          visible={this.state.manageAvailabilities}
          onDismiss={this.cancelManageAvailabilities}
          dismissable={true}>
          <Dialog.Content>
            <FormInput
              multiOptions
              singleSelect
              value={this.state.slot}
              style={{flexDirection: 'row', justifyContent: 'space-evenly'}}
              showLabel={false}
              readonly={false}
              definition={{
                options: [
                  {label: strings.createAvailability, value: 1},
                  {label: strings.markAsUnavailable, value: 2},
                ],
              }}
              onChangeValue={(slot) => this.setState({slot})}
              errorMessage={'error'}
              isTyping={false}
            />
            <View style={{marginTop: 25}}>
              <View style={agendaStyles.field}>
                <Text style={[styles.textfield, styles.availabilitiesField]}>
                  {strings.store} :
                </Text>
                <View style={agendaStyles.input}>
                  <Text style={{opacity: 0.7}}>{getStore().name}</Text>
                </View>
              </View>
              <View style={agendaStyles.field}>
                <Text style={[styles.textfield, styles.availabilitiesField]}>
                  {strings.doctor} :
                </Text>
                <View style={agendaStyles.input}>
                  <Text
                    style={{
                      opacity: 0.7,
                    }}>{`${doctor?.firstName} ${doctor?.lastName}`}</Text>
                </View>
              </View>
              <View style={agendaStyles.field}>
                <Text style={[styles.textfield, styles.availabilitiesField]}>
                  {strings.duration} :
                </Text>
                <View
                  style={{
                    width: '75%',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <FormOptions
                    readonly
                    showLabel={false}
                    options={[30, 60, 90]}
                    label={strings.duration}
                    value={this.state.duration}
                    onChangeValue={(code: ?string | ?number) => {
                      this.setState({duration: code});
                    }}
                  />
                  <Text style={{marginLeft: 10}}>{strings.minutes}</Text>
                </View>
              </View>
              <View style={agendaStyles.field}>
                <Text style={[styles.textfield, styles.availabilitiesField]}>
                  {strings.AppointmentType} :
                </Text>
                <View style={{width: '75%'}}>
                  {this.renderAppointmentsTypes()}
                </View>
              </View>
              <View style={agendaStyles.field}>
                <Text style={[styles.textfield, styles.availabilitiesField]}>
                  {strings.time} :
                </Text>
                <View style={agendaStyles.input}>
                  <Text style={{opacity: 0.7}}>
                    {' '}
                    {formatDate(start, dateFormat)}
                    {'  '}
                    {moment(start).format('h:mm a')}
                    {' - '}
                    {formatDate(
                      moment(start)
                        .add(this.state.duration, 'minutes')
                        .format('h:mm a'),
                      timeFormat,
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <NativeBaseButton onPress={this.cancelManageAvailabilities}>
              {strings.close}
            </NativeBaseButton>
            <NativeBaseButton onPress={this.updateAvailability}>
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
  renderRescheduleDialog() {
    let event: Appointment = this.state.copiedAppointment;
    if (event === undefined || event === null) {
      return null;
    }
    event = Object.assign({patientId: event.patientId}, event);
    event.title = strings.rescheduleAppointment;
    return this.renderAppointmentDetail(event, true, true);
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

  createEmptySlots = (appointments = []) => {
    const store = 'store-' + getStore().storeId;
    const {date, mode, selectedDoctors} = this.state;
    const emptyAppointments = [];
    const startDate =
      mode === 'day'
        ? moment(date).startOf('day')
        : moment(date).startOf('isoWeek').set({hour: 8});
    const endDate =
      mode === 'day'
        ? moment(date).endOf('day')
        : moment(date)
            .endOf('isoWeek')
            .set({hour: 21, minute: 0, second: 0, millisecond: 0});
    const halfHour = 1000 * 60 * 30;
    const AppointmentByStartDate = {};
    for (let appointment of appointments) {
      const key = new Date(appointment.start).toString();
      AppointmentByStartDate[key] = appointment;
    }
    for (let doctor of selectedDoctors) {
      let loop = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      while (loop <= end) {
        if (
          moment(loop).isBefore(moment(loop).set({hour: 21})) &&
          moment(loop).isAfter(moment(loop).set({hour: 7})) &&
          (!AppointmentByStartDate[new Date(loop).toString()] ||
            AppointmentByStartDate[new Date(loop).toString()]?.userId !==
              doctor)
        ) {
          emptyAppointments.push({
            userId: doctor,
            storeId: store,
            start: new Date(loop),
            end: new Date(loop + halfHour),
            emptySlot: true,
          });
        }
        loop += halfHour;
      }
    }
    return emptyAppointments;
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
      copiedAppointment,
      rescheduleAppointment,
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
        {isLoading && this.renderLoading()}
        {isPatientDialogVisible && this.renderPatientScreen()}
        {showDialog && !rescheduleAppointment && this.renderEventDetails()}
        {doctorsModal && this.renderDoctorsOptions()}
        {cancelModal && this.renderCancellationDialog()}
        {copiedAppointment && this.renderCopyDialog()}
        {rescheduleAppointment && this.renderRescheduleDialog()}
        {manageAvailabilities && this.renderManageAvailabilities()}

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
          calendarWidth={this.state.calendarWidth}
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
    if (!appointment.emptySlot) {
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
      zIndex: 10,
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
          mode={mode}
          date={date}
          swipeEnabled={false}
          height={windowHeight}
          events={appointments}
          weekStartsOn={1}
          weekEndsOn={this.numOfDays}
          hourRowHeight={90}
          scrollOffsetMinutes={480}
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
  input: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: 'lightgray',
    width: '75%',
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '70%',
    justifyContent: 'space-between',
  },
};

/**
 * @flow
 */

'use strict';

import React, {Component} from 'react';
import {
  Image,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  InteractionManager,
  RefreshControl,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import type {
  PatientInfo,
  Patient,
  Appointment,
  Visit,
  User,
  AppointmentType,
  CodeDefinition,
} from './Types';
import {getAccount} from './DoctorApp';
import {styles, fontScale, isWeb, selectionFontColor} from './Styles';
import {strings, getUserLanguage} from './Strings';
import {
  formatDate,
  timeFormat,
  isToday,
  capitalize,
  formatDuration,
  jsonDateFormat,
  today,
  yearDateTimeFormat,
  dayYearDateTimeFormat,
  farDateFormat2,
  isEmpty,
  formatAge,
  prefix,
  deAccent,
  yearDateFormat,
} from './Util';
import {
  FormRow,
  FormTextInput,
  FormCode,
  FormCheckBox,
  FormNumberInput,
  FormOptions,
  FormInput,
} from './Form';
import {
  VisitHistory,
  fetchVisitHistory,
  fetchVisitForAppointment,
} from './Visit';
import {
  PatientCard,
  fetchPatientInfo,
  PatientTags,
  getPatientFullName,
} from './Patient';
import {
  cacheItem,
  getCachedItem,
  getCachedItems,
  cacheItemsById,
} from './DataCache';
import {
  searchItems,
  fetchItemById,
  stripDataType,
  performActionOnItem,
  storeItem,
  getRestUrl,
  getToken,
  handleHttpError,
} from './Rest';
import {formatCode, getAllCodes, getCodeDefinition} from './Codes';
import {getStore} from './DoctorApp';
import {
  Button as NativeBaseButton,
  Dialog,
  Portal,
  Title,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ArrowIcon from 'react-native-vector-icons/MaterialIcons';

const PRIVILEGE = {
  NOACCESS: 'NOACCESS',
  READONLY: 'READONLY',
  BOOKONLY: 'BOOKONLY',
  FULLACCESS: 'FULLACCESS',
};

function hasAppointmentReadAccess(appointment: Appointment): boolean {
  if (!appointment) {
    return false;
  }
  return (
    appointment.appointmentPrivilege === PRIVILEGE.READONLY ||
    appointment.appointmentPrivilege === PRIVILEGE.BOOKONLY ||
    appointment.appointmentPrivilege === PRIVILEGE.FULLACCESS
  );
}

export function hasAppointmentBookAccess(appointment: Appointment): boolean {
  if (!appointment) {
    return false;
  }
  return (
    appointment.appointmentPrivilege === PRIVILEGE.BOOKONLY ||
    appointment.appointmentPrivilege === PRIVILEGE.FULLACCESS
  );
}

function hasAppointmentFullAccess(appointment: Appointment): boolean {
  if (!appointment) {
    return false;
  }
  return appointment.appointmentPrivilege === PRIVILEGE.FULLACCESS;
}

export function getAppointmentTypes(): CodeDefinition[] {
  let appointmentTypes: CodeDefinition[] = getAllCodes('procedureCodes');
  if (appointmentTypes && appointmentTypes.length > 0) {
    appointmentTypes = appointmentTypes.filter(
      (type: CodeDefinition) => type.isAppointmentType,
    );
  }
  return appointmentTypes;
}

export function isAppointmentLocked(appointment: Appointment): boolean {
  if (appointment === undefined) {
    return false;
  }
  let visitHistory: Visit[] = getCachedItems(
    getCachedItem('visitHistory-' + appointment.patientId),
  );
  if (visitHistory) {
    visitHistory = visitHistory.filter(
      (visit: Visit) => visit.appointmentId === appointment.id && visit.locked,
    );
    if (visitHistory.length > 0) {
      return true;
    }
  }
  return false;
}
export async function fetchAppointment(
  appointmentId: string,
): Promise<Appointment> {
  let appointment: Appointment = await fetchItemById(appointmentId);
  return appointment;
}

export async function fetchEvents(storeId: ?string): Promise<Appointment> {
  const searchCritera = {storeId: storeId};
  let restResponse = await searchItems('Appointment/events', searchCritera);
  let dayEvents: Appointment[] = restResponse.dayEventsList;
  cacheItemsById(dayEvents);
  return dayEvents;
}
export async function fetchAppointments(
  storeId: ?string,
  doctorId: ?string,
  maxDays: ?number,
  patientId: ?string,
  startDate: ?Date = today(),
  includeDayEvents: ?boolean = false,
  includeAvailableSlots: ?boolean = false,
  earlyRequest: ?boolean = false,
  showAllStores: ?boolean = false,
): Promise<Appointment[]> {
  const searchCriteria = {
    storeId: storeId,
    doctorId: doctorId,
    patientId: patientId,
    startDate: formatDate(startDate, jsonDateFormat),
    maxDays: maxDays ? maxDays.toString() : undefined,
    includeAvailableSlots,
    earlyRequestOnly: earlyRequest,
    showAllStores,
  };
  let restResponse = await searchItems(
    'Appointment/list/booked',
    searchCriteria,
  );
  let users: User[] = restResponse.userList;
  let patients: PatientInfo[] = restResponse.patientList;
  let appointmentTypes: AppointmentType[] = restResponse.appointmentTypeList;
  let appointments: Appointment[] = restResponse.appointmentList;

  cacheItemsById(users);
  cacheItemsById(appointmentTypes);
  cacheItemsById(appointments);
  cacheItemsById(patients);
  patients.map((patient: PatientInfo) => {
    let patientAppts: Appointment[] = appointments.filter(
      (appointment: Appointment) => appointment.patientId === patient.id,
    );

    cacheItem('appointmentsHistory-' + patient.id, patientAppts);
  });

  return appointments;
}

export async function bookAppointment(
  patientId: ?string,
  appointmentTypeId: ?(string[]),
  numberOfSlots: ?number,
  slotId: ?string,
  supplierId: ?string,
  earlyRequest: ?boolean,
  earlyRequestComment: ?string,
  rescheduled: ?boolean,
  comment: ?string,
  oldappointmentId: ?string,
): Promise<Appointment> {
  const reschedulingParms = rescheduled
    ? {
        appointmentModification: true,
        oldappointmentId: oldappointmentId,
      }
    : {};
  const searchCriteria = {
    patientId: patientId,
    appointmentTypeId: appointmentTypeId ? appointmentTypeId : 0,
    numberOfSlots: numberOfSlots,
    slotId: slotId,
    earlyRequest: earlyRequest ? true : false,
    earlyRequestComment: !isEmpty(earlyRequestComment)
      ? earlyRequestComment
      : '',
    rescheduled: rescheduled,
    id: slotId,
    storeId: getStore().id,
    supplierId: !isEmpty(supplierId) ? supplierId : 0,
    comment: comment,
    ...reschedulingParms,
  };
  const params = {
    emrOnly: true,
  };
  const appointment: Appointment = await performActionOnItem(
    '',
    searchCriteria,
    'POST',
    params,
  );
  return appointment;
}
export async function doubleBook(
  patientId: ?string,
  appointmentTypeId: ?(string[]),
  id: ?string,
  durationMinutes: ?number,
  atEnd: ?boolean,
  comment: ?string,
): Promise<Appointment> {
  const searchCriteria = {
    patientId: patientId,
    appointmentTypeId: appointmentTypeId ? appointmentTypeId : 0,
    id: id,
    durationMinutes: durationMinutes,
    atEnd: atEnd,
    comment: comment,
  };
  const params = {
    emrOnly: true,
  };
  const appointment: Appointment = await performActionOnItem(
    'doubleBook',
    searchCriteria,
    'POST',
    params,
  );
  return appointment;
}
export async function manageAvailability(
  doctorId: ?string,
  action: ?number,
  duration: ?number,
  startDateTime: string,
  endDateTime: string,
  appointmentTypeId: ?(string[]),
): Promise<Appointment> {
  const searchCriteria = {
    doctorId,
    action,
    duration,
    frequency: 0,
    startDateTime,
    endDateTime,
    appointmentTypeId: appointmentTypeId ? appointmentTypeId : 0,
  };
  let url = getRestUrl() + 'Appointment/manageSlots?emrOnly=true';
  try {
    let httpResponse = await fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        token: getToken(),
        Accept: 'application/json',
        'Accept-language': getUserLanguage(),
      },
      body: JSON.stringify(searchCriteria),
    });
    if (!httpResponse.ok) {
      handleHttpError(httpResponse);
    }
    let appointments: Appointment[] = await httpResponse.json();
    return appointments;
  } catch (error) {
    console.log(error);
    alert(strings.fetchItemError);
    throw error;
  }
}
export async function cancelAppointment(body) {
  const appointment: Appointment = await performActionOnItem(
    'cancel',
    body,
    'POST',
    {emrOnly: true},
  );
  return appointment;
}

export async function updateAppointment(appointment: Appointment) {
  if (appointment === undefined || appointment === null) {
    return;
  }
  appointment = await storeItem(appointment);
  return appointment;
}

export class AppointmentTypes extends Component {
  props: {
    appointment: Appointment,
    orientation?: string,
  };
  static defaultProps = {
    orientation: 'vertical',
  };
  render() {
    const boxSize: number =
      (this.props.orientation === 'horizontal' ? 10 : 10) * fontScale;
    const isHorizontal: boolean = this.props.orientation === 'horizontal';
    return (
      <View
        style={{
          flexDirection: isHorizontal ? 'row' : 'column',
          marginHorizontal: 3 * fontScale,
          marginTop: isHorizontal ? 20 * fontScale : 0,
        }}>
        {this.props.appointment.appointmentTypes &&
          getCachedItems(this.props.appointment.appointmentTypes).map(
            (appointmentType: AppointmentType, index: number) => {
              if (
                appointmentType === null ||
                appointmentType === undefined ||
                appointmentType.color === undefined ||
                appointmentType.color === null
              ) {
                return null;
              }
              return (
                <View
                  style={{
                    backgroundColor: appointmentType.color,
                    padding: boxSize,
                    height: boxSize,
                    width: boxSize,
                    margin: 1 * fontScale,
                  }}
                  key={index}
                />
              );
            },
          )}
      </View>
    );
  }
}

class AppointmentIcon extends Component {
  props: {
    name: string,
  };
  render() {
    const boxSize: number = 22 * fontScale;
    if (this.props.name === 'invoiced') {
      return (
        <Image
          source={require('./image/calendar/paidx2.png')}
          style={{
            width: boxSize,
            height: boxSize,
            margin: 1 * fontScale,
            resizeMode: 'contain',
          }}
        />
      );
    } else if (this.props.name === 'lastNoShow') {
      return (
        <Image
          source={require('./image/calendar/lastNoShowx2.png')}
          style={{
            width: boxSize,
            height: boxSize,
            margin: 1 * fontScale,
            resizeMode: 'contain',
          }}
        />
      );
    } else if (this.props.name === 'existingPatient') {
      return (
        <Image
          source={require('./image/calendar/existingPatientx2.png')}
          style={{
            width: boxSize,
            height: boxSize,
            margin: 1 * fontScale,
            resizeMode: 'contain',
          }}
        />
      );
    } else if (this.props.name === 'newPatient') {
      return (
        <Image
          source={require('./image/calendar/newPatientx2.png')}
          style={{
            width: boxSize,
            height: boxSize,
            margin: 1 * fontScale,
            resizeMode: 'contain',
          }}
        />
      );
    } else if (this.props.name === 'leftWithRx') {
      return (
        <Image
          source={require('./image/calendar/leftWithRxx2.png')}
          style={{
            width: boxSize,
            height: boxSize,
            margin: 1 * fontScale,
            resizeMode: 'contain',
          }}
        />
      );
    } else if (this.props.name === 'unconfirmed') {
      return (
        <Image
          source={require('./image/calendar/unconfirmedx2.png')}
          style={{
            width: boxSize,
            height: boxSize,
            margin: 1 * fontScale,
            resizeMode: 'contain',
          }}
        />
      );
    } else if (this.props.name === 'pending') {
      return (
        <Image
          source={require('./image/calendar/unconfirmedx2.png')}
          style={{
            width: boxSize,
            height: boxSize,
            margin: 1 * fontScale,
            resizeMode: 'contain',
          }}
        />
      );
    } else if (this.props.name === 'confirmed') {
      return (
        <Image
          source={require('./image/calendar/confirmedx2.png')}
          style={{
            width: boxSize,
            height: boxSize,
            margin: 1 * fontScale,
            resizeMode: 'contain',
          }}
        />
      );
    } else if (this.props.name === 'cancelled') {
      return (
        <Image
          source={require('./image/calendar/unconfirmedx2.png')}
          style={{
            width: boxSize,
            height: boxSize,
            margin: 1 * fontScale,
            resizeMode: 'contain',
          }}
        />
      );
    } else if (this.props.name === 'noShow') {
      return (
        <Image
          source={require('./image/calendar/noShowx2.png')}
          style={{
            width: boxSize,
            height: boxSize,
            margin: 1 * fontScale,
            resizeMode: 'contain',
          }}
        />
      );
    } else if (this.props.name === 'waiting') {
      return (
        <Image
          source={require('./image/calendar/waitingx2.png')}
          style={{
            width: boxSize,
            height: boxSize,
            margin: 1 * fontScale,
            resizeMode: 'contain',
          }}
        />
      );
    } else if (this.props.name === 'completed') {
      return (
        <Image
          source={require('./image/calendar/completedx2.png')}
          style={{
            width: boxSize,
            height: boxSize,
            margin: 1 * fontScale,
            resizeMode: 'contain',
          }}
        />
      );
    } else if (this.props.name === 'family') {
      return (
        <Image
          source={require('./image/calendar/familyx2.png')}
          style={{
            width: boxSize,
            height: boxSize,
            margin: 1 * fontScale,
            resizeMode: 'contain',
          }}
        />
      );
    } else if (__DEV__) {
      return <Text style={styles.text}>{this.props.name}</Text>;
    }
    return null;
  }
}

export class AppointmentIcons extends Component {
  props: {
    appointment: Appointment,
    orientation?: string,
  };
  static defaultProps = {
    orientation: 'vertical',
  };
  render() {
    if (
      !this.props.appointment ||
      !this.props.appointment.indicators ||
      this.props.appointment.indicators.length == 0
    ) {
      return null;
    }
    const isHorizontal: boolean = this.props.orientation === 'horizontal';
    return (
      <View
        style={{
          flexDirection: isHorizontal ? 'row' : 'column',
          marginHorizontal: 3 * fontScale,
          marginTop: isHorizontal ? 20 * fontScale : 0,
        }}>
        {this.props.appointment.indicators.map(
          (indicator: string, index: number) => {
            return <AppointmentIcon name={indicator} key={index} />;
          },
        )}
      </View>
    );
  }
}

export class AppointmentNotification extends Component {
  props: {
    patient: Patient,
    showIcons?: boolean,
  };
  render() {
    return (
      <View style={styles.rowLayout}>
        {this.props.showIcons && (
          <Image
            source={require('./image/calendar/waitingx2.png')}
            style={{
              width: 18 * fontScale,
              height: 18 * fontScale,
              resizeMode: 'contain',
              marginVertical: 3 * fontScale,
            }}
          />
        )}
        {this.props.showIcons && <AppointmentStatus orientation="horizontal" />}
        <Text style={styles.text}>{this.props.patient.lastName}</Text>
      </View>
    );
  }
}

export class UpcomingAppointments extends Component {
  render() {
    return (
      <View style={styles.sideMenuList}>
        <AppointmentNotification patient={{lastName: 'Next patient 1'}} />
        <AppointmentNotification patient={{lastName: 'Next patient 2'}} />
      </View>
    );
  }
}

export class AppointmentSummary extends Component {
  props: {
    appointment: Appointment,
    onPress: () => void,
    locked: boolean,
  };
  state: {
    locked: ?boolean,
  };
  static defaultProps = {
    locked: false,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      locked: this.props.locked,
    };
  }
  componentDidMount() {
    this.getLockedState();
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.locked === this.props.locked) {
      return;
    }

    this.setState({locked: this.props.locked});
  }

  getLockedState = async () => {
    const appointment: Appointment = this.props.appointment;
    const visit: Visit = await fetchVisitForAppointment(appointment.id);
    this.setState({locked: visit ? visit.locked : false});
  };

  render() {
    const patient: Patient = getCachedItem(this.props.appointment.patientId);
    let cardStyle =
      styles['card' + capitalize(this.props.appointment.status.toString())];
    const date: string = this.props.appointment.start;
    return (
      <TouchableOpacity onPress={this.props.onPress}>
        <View style={cardStyle}>
          <View style={{flexDirection: 'row'}}>
            <AppointmentTypes appointment={this.props.appointment} />
            <AppointmentIcons appointment={this.props.appointment} />
            <View style={{marginHorizontal: 5 * fontScale}}>
              <Text
                style={
                  this.state.locked === true ? styles.grayedText : styles.text
                }>
                {isToday(date)
                  ? formatDate(date, timeFormat)
                  : formatDate(date, dayYearDateTimeFormat)}
              </Text>
              <Text
                style={
                  this.state.locked === true ? styles.grayedText : styles.text
                }>
                {this.props.appointment.title}
              </Text>
              <View style={{flexDirection: 'row'}}>
                <View style={{maxWidth: 330 * fontScale}}>
                  <Text
                    style={
                      this.state.locked === true
                        ? styles.grayedText
                        : styles.text
                    }>
                    {getPatientFullName(patient)}
                  </Text>
                </View>
                <View>
                  <PatientTags
                    patient={{}}
                    locked={this.state.locked === true}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}

export class AppointmentsSummary extends Component {
  props: {
    appointments: Appointment[],
    onRefreshAppointments: () => void,
    navigation: any,
  };
  state: {
    refreshing: boolean,
    isLocked: false,
  };
  constructor(props: any) {
    super(props);
    this.state = {
      refreshing: false,
    };
  }

  async refresh() {
    this.setState({refreshing: true});
    await this.props.onRefreshAppointments();
    this.setState({refreshing: false});
  }

  render() {
    //TODO flatlist
    return (
      <ScrollView
        refreshControl={
          this.props.onRefreshAppointments ? (
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={() => this.refresh()}
            />
          ) : undefined
        }>
        <View style={styles.topFlow}>
          {this.props.appointments &&
            this.props.appointments.map(
              (appointment: Appointment, index: number) => {
                return (
                  <AppointmentSummary
                    key={index}
                    appointment={appointment}
                    locked={isAppointmentLocked(appointment)}
                    onPress={() =>
                      this.props.navigation.navigate('appointment', {
                        appointment,
                      })
                    }
                  />
                );
              },
            )}
        </View>
      </ScrollView>
    );
  }
}

export class AppointmentTitle extends Component {
  props: {
    appointment: Appointment,
  };

  render() {
    if (!this.props.appointment || !this.props.appointment.id) {
      return null;
    }
    const date: string = this.props.appointment.start;
    return (
      <View>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.screenTitle}>{this.props.appointment.title}</Text>
          <AppointmentTypes
            appointment={this.props.appointment}
            orientation="horizontal"
          />
          <AppointmentIcons
            appointment={this.props.appointment}
            orientation="horizontal"
          />
        </View>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.text}>
            {strings.scheduledAt}{' '}
            {isToday(date)
              ? formatDate(date, timeFormat)
              : formatDate(date, dayYearDateTimeFormat)}{' '}
            {strings.forDuration}{' '}
            {formatDuration(this.props.appointment.end, date)}.
          </Text>
        </View>
      </View>
    );
  }
}

export class AppointmentDetails extends Component {
  props: {
    appointment: Appointment,
    onUpdateAppointment: (appointment: Appointment) => void,
    onOpenAppointment: (appointment: Appointment) => void,
    onCloseAppointment: () => void,
    onCancelAppointment: () => void,
    openDoubleBookingModal: (appointment: Appointment) => void,
    onCopyAppointment: (appointment: Appointment) => void,
    isNewAppointment: boolean,
    rescheduleAppointment: boolean,
    isDoublebooking: boolean,
  };
  state: {
    status: Number,
    isEditable: boolean,
    editedAppointment: ?Appointment,
  };
  constructor(props: any) {
    super(props);
    this.state = {
      isEditable: false,
      editedAppointment: undefined,
      status: props.appointment.status,
    };
  }
  componentDidMount() {
    if (this.props.isNewAppointment || this.props.isDoublebooking) {
      this.startEdit();
    }
  }

  startEdit() {
    !isWeb && LayoutAnimation.easeInEaseOut();
    let appointmentClone: Appointment = {...this.props.appointment};
    if (
      (this.props.rescheduleAppointment || this.props.isDoublebooking) &&
      appointmentClone?.appointmentTypes?.length > 0
    ) {
      let splittedAppointmentsCode = [];
      for (let type of appointmentClone.appointmentTypes) {
        const appointmentTypeId = stripDataType(type).toString();
        splittedAppointmentsCode.push(appointmentTypeId);
      }
      appointmentClone = {
        ...appointmentClone,
        appointmentTypes: [...splittedAppointmentsCode],
      };
      this.setState({editedAppointment: appointmentClone});
    }
    this.cloneAppointment();
    this.setState({isEditable: true});
  }

  cloneAppointment(): Appointment {
    let appointmentClone: Appointment = {...this.props.appointment};
    this.setState({editedAppointment: appointmentClone});
    return appointmentClone;
  }

  getWaitingListOptions(): CodeDefinition[] {
    const noOption: CodeDefinition = {code: false, description: 0};
    const yesOption: CodeDefinition = {code: true, description: 1};
    const waitingListOptions: CodeDefinition[] = [noOption, yesOption];
    return waitingListOptions;
  }

  cancelEdit() {
    !isWeb && LayoutAnimation.easeInEaseOut();
    this.setState({isEditable: false});
    if (this.props.isNewAppointment || this.props.isDoublebooking) {
      this.props.onCloseAppointment();
    }
  }

  commitEdit() {
    !isWeb && LayoutAnimation.easeInEaseOut();

    this.props.onUpdateAppointment(this.state.editedAppointment);

    if (!this.props.isNewAppointment || !this.props.isDoublebooking) {
      this.setState({isEditable: false, editedAppointment: undefined});
    }
  }

  openAppointment() {
    !isWeb && LayoutAnimation.easeInEaseOut();
    this.props.onOpenAppointment(this.props.appointment);
  }

  closeAppointment() {
    !isWeb && LayoutAnimation.easeInEaseOut();
    this.props.onCloseAppointment();
  }

  getInsuranceProviders(): CodeDefinition[] {
    const selfPaid: CodeDefinition = {
      code: 0,
      description: strings.selfPaid,
    };

    const allInsuranceProviders: CodeDefinition[] =
      getAllCodes('insuranceProviders');
    const options: CodeDefinition[] = [selfPaid].concat(allInsuranceProviders);
    return options;
  }

  validateNumberOfSlots(code: ?string, numberOfSlots: ?number): boolean {
    const appointment: Appointment = this.state.editedAppointment;

    if (!code) {
      const appointmentTypes: any = appointment.appointmentTypes;
      if (appointmentTypes === undefined || appointmentTypes === null) {
        return true;
      }

      for (let i = 0; i < appointmentTypes.length; i++) {
        const appointmentType: CodeDefinition = getCodeDefinition(
          'procedureCodes',
          appointmentTypes[i],
        );
        if (!appointmentType) {
          continue;
        }
        if (!numberOfSlots || numberOfSlots < appointmentType.numberOfSlots) {
          return false;
        }
      }
      return true;
    } else {
      const appointmentType: CodeDefinition = getCodeDefinition(
        'procedureCodes',
        code,
      );

      if (
        !appointment.numberOfSlots ||
        appointmentType.numberOfSlots > appointment.numberOfSlots
      ) {
        appointment.numberOfSlots = appointmentType.numberOfSlots;
        this.setState({editedAppointment: appointment});
      }
    }
    return true;
  }

  updateValue(
    propertyName: string,
    newValue: any,
    index?: number,
  ): Appointment {
    let editedAppointment: ?Appointment;

    if (!this.state.editedAppointment) {
      editedAppointment = this.cloneAppointment();
    } else {
      editedAppointment = this.state.editedAppointment;
    }
    if (!editedAppointment) {
      return;
    }

    if (index >= 0) {
      if (
        editedAppointment[propertyName] === undefined ||
        editedAppointment[propertyName] === null
      ) {
        editedAppointment[propertyName] = [];
      }
      editedAppointment[propertyName][index] = newValue;

      if (newValue === undefined || newValue === null) {
        editedAppointment[propertyName] = editedAppointment[
          propertyName
        ].filter((element) => {
          return !(element === null || element === undefined);
        });
      }
    } else {
      editedAppointment[propertyName] = newValue;
    }

    this.setState(editedAppointment);
    return editedAppointment;
  }

  getDateFormat(date: ?string): string {
    if (!date) {
      return yearDateFormat;
    }

    return farDateFormat2;
  }

  renderAppointmentsTypes() {
    let appointmentsType: string[] =
      this.state.editedAppointment.appointmentTypes;
    const labelWidth: number = 200 * fontScale;
    let dropdowns = [];
    let appointmentDataTypeId: number = appointmentsType
      ? stripDataType(appointmentsType[0])
      : -1;
    dropdowns.push(
      <FormRow>
        <FormOptions
          labelWidth={labelWidth}
          options={getAppointmentTypes()}
          showLabel={true}
          label={strings.AppointmentType}
          value={
            appointmentDataTypeId > 0 ? appointmentDataTypeId.toString() : ''
          }
          onChangeValue={(code: ?string | ?number) => {
            this.updateValue('appointmentTypes', code, 0);
            this.validateNumberOfSlots(code);
          }}
        />
      </FormRow>,
    );
    if (appointmentsType && appointmentsType.length >= 1) {
      for (let i: number = 1; i <= appointmentsType.length; i++) {
        if (i < 5) {
          appointmentDataTypeId = stripDataType(appointmentsType[i]);
          dropdowns.push(
            <FormRow>
              <FormOptions
                labelWidth={labelWidth}
                options={getAppointmentTypes()}
                showLabel={true}
                label={strings.AppointmentType}
                value={
                  appointmentDataTypeId > 0
                    ? appointmentDataTypeId.toString()
                    : ''
                }
                onChangeValue={(code: ?string | ?number) => {
                  this.updateValue('appointmentTypes', code, i);
                  this.validateNumberOfSlots(code);
                }}
              />
            </FormRow>,
          );
        }
      }
    }

    return dropdowns;
  }

  render() {
    const appointment: Appointment = this.props.appointment;
    const user: User = getCachedItem(appointment.userId);
    const patient: PatientInfo | Patient = getCachedItem(appointment.patientId);
    const hasBookAccess: boolean = hasAppointmentBookAccess(appointment);

    let genderShort: string = formatCode('genderCode', patient.gender);
    const allDescriptions: string[] = [
      'pending',
      'confirmed',
      'cancelled',
      'noShow',
      'waiting',
      'completed',
    ];
    if (genderShort.length > 0) {
      genderShort = genderShort.substring(0, 1);
    }
    if (!this.state.isEditable || !this.state.editedAppointment) {
      return (
        <View>
          <TouchableOpacity
            onPress={() => this.startEdit()}
            styles={{flexDirection: 'column', flex: 100}}
            disabled={!hasBookAccess}>
            {user && (
              <Text style={styles.text}>
                {strings.doctor}: {user.firstName} {user.lastName}
              </Text>
            )}

            <AppointmentIcons
              appointment={appointment}
              orientation="horizontal"
            />
            <Title style={{color: '#000'}}>
              {getPatientFullName(patient)}{' '}
            </Title>
            <View style={styles.rowLayout}>
              <Text style={styles.text}>({genderShort}) </Text>
              <PatientTags patient={patient} showDescription={true} />
              <Text style={styles.text}>
                {patient.dateOfBirth ? formatAge(patient.dateOfBirth) : ''}
              </Text>
            </View>

            <View style={styles.formRow}>
              <Text style={styles.text}>
                {isToday(appointment.start)
                  ? formatDate(appointment.start, timeFormat)
                  : formatDate(appointment.start, dayYearDateTimeFormat)}
              </Text>
              <Text style={styles.text}>{' - '}</Text>
              <Text style={styles.text}>
                {isToday(appointment.end)
                  ? formatDate(appointment.end, timeFormat)
                  : formatDate(appointment.end, dayYearDateTimeFormat)}
              </Text>
            </View>
            {!isEmpty(appointment.supplierName) && (
              <View style={styles.formRow}>
                <Text style={styles.text}>{appointment.supplierName}</Text>
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
            {!isEmpty(appointment.comment) && (
              <View style={styles.formRow}>
                <FormTextInput
                  label=""
                  multiline={true}
                  readonly={true}
                  value={appointment.comment}
                />
              </View>
            )}
          </TouchableOpacity>
          <View style={{width: '30%'}}>
            <FormRow>
              <AppointmentIcon
                key={this.state.status}
                name={allDescriptions[this.state.status]}
              />
              <FormCode
                hideClear
                showLabel={false}
                readonly={false}
                code="appointmentStatusCode"
                value={this.state.status}
                onChangeValue={(code: ?string | ?number) => {
                  this.props.onUpdateAppointment(
                    this.updateValue('status', code),
                  );
                }}
              />
            </FormRow>
          </View>
          {hasBookAccess && (
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 10,
              }}>
              <TouchableOpacity
                onPress={() => this.props.onCancelAppointment()}
                style={styles.appointmentActionButton}>
                <Text style={{color: '#fff'}}>{strings.cancelAppointment}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(appointment) =>
                  this.props.openDoubleBookingModal(appointment)
                }
                style={styles.appointmentActionButton}>
                <Text style={{color: '#fff'}}> {strings.doubleBook}</Text>
              </TouchableOpacity>
              {this.props.onCopyAppointment && (
                <TouchableOpacity
                  onPress={() =>
                    this.props.onCopyAppointment(this.props.appointment)
                  }
                  style={styles.appointmentActionButton}>
                  <Text style={{color: '#fff'}}> {strings.reschedule}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {!this.props.isNewAppointment && (
            <Dialog.Actions>
              <NativeBaseButton onPress={() => this.closeAppointment()}>
                {strings.close}
              </NativeBaseButton>
              <NativeBaseButton onPress={() => this.openAppointment()}>
                {strings.open}
              </NativeBaseButton>
            </Dialog.Actions>
          )}
        </View>
      );
    }
    const labelWidth: number = 200 * fontScale;
    return (
      <View>
        <FormRow>
          <FormTextInput
            labelWidth={labelWidth}
            label={strings.patient}
            readonly={true}
            value={getPatientFullName(patient)}
          />
        </FormRow>
        {this.renderAppointmentsTypes()}
        <FormRow>
          <FormOptions
            labelWidth={labelWidth}
            options={this.getInsuranceProviders()}
            showLabel={true}
            label={strings.insurer}
            value={
              this.state.editedAppointment.supplierName
                ? this.state.editedAppointment.supplierName
                : 0
            }
            onChangeValue={(code: ?string | ?number) =>
              this.updateValue('supplierName', code)
            }
          />
        </FormRow>
        <FormRow>
          <FormCheckBox
            labelWidth={labelWidth}
            showLabel={true}
            label={strings.waitingList}
            options={this.getWaitingListOptions()}
            value={this.state.editedAppointment.earlyRequest}
            onChangeValue={(code: ?string | ?number) => {
              this.updateValue('earlyRequest', code);
              if (code === false || code === undefined || code === null) {
                this.updateValue('earlyRequestComment', '');
              }
            }}
          />
        </FormRow>

        {this.state.editedAppointment.earlyRequest && (
          <FormRow>
            <FormTextInput
              labelWidth={labelWidth}
              label={strings.waitingListComment}
              value={this.state.editedAppointment.earlyRequestComment}
              onChangeText={(newValue: ?string) =>
                this.updateValue('earlyRequestComment', newValue)
              }
            />
          </FormRow>
        )}
        {!this.props.isDoublebooking && (
          <FormRow>
            <FormNumberInput
              labelWidth={labelWidth}
              label={strings.numberOfSlots}
              required={true}
              minValue={1}
              maxValue={9}
              value={
                this.state.editedAppointment.numberOfSlots
                  ? this.state.editedAppointment.numberOfSlots
                  : 1
              }
              onChangeValue={(newValue: ?number) => {
                if (this.validateNumberOfSlots(undefined, newValue)) {
                  this.updateValue('numberOfSlots', newValue);
                }
              }}
            />
          </FormRow>
        )}

        {!this.props.isNewAppointment && !this.props.isDoublebooking && (
          <FormRow>
            <FormCode
              labelWidth={labelWidth}
              label={strings.status}
              readonly={false}
              code="appointmentStatusCode"
              value={this.state.editedAppointment.status}
              onChangeValue={(code: ?string | ?number) =>
                this.updateValue('status', code)
              }
            />
          </FormRow>
        )}
        {user && (
          <FormRow>
            <FormTextInput
              labelWidth={labelWidth}
              label={strings.doctor}
              readonly={true}
              value={user.firstName + ' ' + user.lastName}
            />
          </FormRow>
        )}
        <FormRow>
          <FormTextInput
            labelWidth={labelWidth}
            label={strings.comment}
            multiline={true}
            value={this.state.editedAppointment.comment}
            onChangeText={(newValue: ?string) =>
              this.updateValue('comment', newValue)
            }
          />
        </FormRow>
        {hasBookAccess && (
          <View style={[styles.bottomItems, {alignSelf: 'flex-end'}]}>
            <NativeBaseButton onPress={() => this.cancelEdit()}>
              {strings.cancel}
            </NativeBaseButton>

            <NativeBaseButton onPress={() => this.commitEdit()}>
              {this.props.isNewAppointment && !this.props.rescheduleAppointment
                ? strings.book
                : this.props.isNewAppointment &&
                  this.props.rescheduleAppointment
                ? strings.reschedule
                : this.props.isDoublebooking
                ? strings.doubleBook
                : strings.update}
            </NativeBaseButton>
          </View>
        )}
      </View>
    );
  }
}

export class AppointmentScreen extends Component {
  props: {
    navigation: any,
  };
  params: {
    appointment: Appointment,
  };
  state: {
    appointment: ?Appointment,
    patientInfo: PatientInfo,
    visitHistory: string[],
    patientDocumentHistory: string[],
    scrollEnabled: boolean,
  };
  unmounted: boolean;

  constructor(props: any) {
    super(props);
    let params = this.props.navigation.state.params;
    this.unmounted = false;
    const appointment: ?Appointment =
      params.appointment && params.appointment.id != undefined
        ? getCachedItem(params.appointment.id)
        : params.appointment;
    const patientId: string = appointment
      ? appointment.patientId
      : params.patientInfo.id;
    this.state = {
      appointment,
      patientInfo: getCachedItem(patientId),
      visitHistory: getCachedItem('visitHistory-' + patientId),
      patientDocumentHistory: getCachedItem(
        'patientDocumentHistory-' + patientId,
      ),
      scrollEnabled: true,
    };
  }

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.refreshVisitHistory();
      this.refreshPatientInfo();
      this.refreshAppointment();
    });
  }

  componentDidUpdate(prevProps: any) {
    let params = this.props.navigation.state.params;
    if (params.refresh === true) {
      this.props.navigation.setParams({refresh: false});
      const appointment: ?Appointment =
        params.appointment && params.appointment.id != undefined
          ? getCachedItem(params.appointment.id)
          : params.appointment;
      const patientId: string = appointment
        ? appointment.patientId
        : params.patientInfo.id;
      this.setState({
        patientInfo: getCachedItem(patientId),
        visitHistory: getCachedItem('visitHistory-' + patientId),
        patientDocumentHistory: getCachedItem(
          'patientDocumentHistory-' + patientId,
        ),
      });
      this.forceUpdate();
    }
  }

  getPatientId(): string {
    const params = this.props.navigation.state.params;
    return params.appointment
      ? params.appointment.patientId
      : params.patientInfo.id;
  }

  updateAppointment = (appointment: Appointment) => {
    this.setState({appointment});
  };

  hasAppointment(): boolean {
    return (
      this.state.appointment ||
      this.props.navigation.state.params.hasAppointment
    );
  }

  async storeAppointment(appointment: ?Appointment) {
    if (!appointment) {
      return;
    }
    try {
      appointment = await storeDocument(appointment);
      if (!this.unmounted) {
        this.setState({appointment});
      }
    } catch (error) {
      if (this.unmounted) {
        let params = this.props.navigation.state.params;
        this.props.navigation.navigate('appointment', params.appointment);
      } else {
        this.refreshAppointment();
      }
    }
  }

  async refreshVisitHistory() {
    const visitHistory: string[] = await fetchVisitHistory(this.getPatientId());
    this.setState({
      visitHistory,
      patientDocumentHistory: getCachedItem(
        'patientDocumentHistory-' + this.getPatientId(),
      ),
    });
  }

  refreshFromCache = () => {
    const patientId = this.state.patientInfo.id;
    this.setState({
      patientInfo: getCachedItem(patientId),
      visitHistory: getCachedItem('visitHistory-' + patientId),
      patientDocumentHistory: getCachedItem(
        'patientDocumentHistory-' + patientId,
      ),
    });
  };

  async refreshAppointment() {
    let params = this.props.navigation.state.params;
    if (
      params.appointment === undefined ||
      params.appointment.id === undefined
    ) {
      return;
    }
    let appointment = await fetchAppointment(params.appointment.id);
    if (
      this.state.appointment &&
      appointment.version !== this.state.appointment.version
    ) {
      this.setState({appointment});
    }
  }

  async refreshPatientInfo() {
    const patientInfo: PatientInfo = await fetchPatientInfo(
      this.getPatientId(),
    );
    if (this.state.patientInfo === undefined) {
      this.setState({patientInfo});
    } else if (
      patientInfo.version &&
      patientInfo.version !== this.state.patientInfo.version
    ) {
      this.setState({patientInfo});
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  enableScroll = () => {
    if (this.state.scrollEnabled === true) {
      return;
    }
    this.setState({scrollEnabled: true});
  };

  disableScroll = () => {
    if (this.state.scrollEnabled === false) {
      return;
    }
    this.setState({scrollEnabled: false});
  };

  render() {
    let params = this.props.navigation.state.params;
    return (
      <KeyboardAwareScrollView scrollEnabled={this.state.scrollEnabled}>
        {this.state.appointment && (
          <AppointmentTitle appointment={this.state.appointment} />
        )}
        <PatientCard
          patientInfo={this.state.patientInfo}
          navigation={this.props.navigation}
          refreshStateKey={this.props.navigation.state.key}
        />
        <VisitHistory
          patientInfo={this.state.patientInfo}
          appointment={params.appointment}
          visitHistory={this.state.visitHistory}
          patientDocumentHistory={this.state.patientDocumentHistory}
          navigation={this.props.navigation}
          onRefresh={this.refreshFromCache}
          appointmentStateKey={this.props.navigation.state.key}
          enableScroll={this.enableScroll}
          disableScroll={this.disableScroll}
          hasAppointment={this.hasAppointment()}
        />
      </KeyboardAwareScrollView>
    );
  }
}
export class WaitingList extends Component {
  props: {
    event: Appointment,
    waitingListModal: boolean,
    onCloseWaitingList: () => void,
    onUpdateAppointment: (appointment: Appointment) => void,
  };
  state: {
    fetchingWaitingList: boolean,
    waitingListAppointments: Array,
    allStores: boolean,
    orderDesc: boolean,
    docHeaderSelected: boolean,
    storeHeaderSelected: boolean,
    dateHeaderSelected: boolean,
    filter: string,
    selectedWaitingEvent?: Appointment,
  };
  constructor(props: any) {
    super(props);
    this.state = {
      fetchingWaitingList: false,
      waitingListAppointments: [],
      allStores: false,
      orderDesc: false,
      docHeaderSelected: false,
      storeHeaderSelected: false,
      dateHeaderSelected: false,
      filter: '',
      selectedWaitingEvent: undefined,
    };
  }
  componentDidMount = () => {
    this.waitingListAppointments();
    this.orderByDate();
  };

  closeDialog = () => {
    this.props.onCloseWaitingList();
  };
  async waitingListAppointments() {
    try {
      this.setState({fetchingWaitingList: true});
      let appointments = await fetchAppointments(
        this.state.allStores ? undefined : getStore().id,
        undefined,
        undefined,
        undefined,
        this.props.event.start,
        false,
        false,
        true,
        this.state.allStores,
      );
      this.setState({
        fetchingWaitingList: false,
        waitingListAppointments: appointments,
      });
    } catch (e) {
      this.setState({fetchingWaitingList: false});
    }
  }
  updateOrder = () => {
    const order: boolean = this.state.orderDesc;
    this.setState({orderDesc: !order});
  };
  compareDate(a, b): number {
    if (b.start < a.start) {
      return -1;
    } else if (b.start > a.start) {
      return 1;
    }
    return 0;
  }
  groupByDate(): any {
    let data: any[] = [...this.state.waitingListAppointments];
    data.sort(this.compareDate);
    return data;
  }
  orderByDate = () => {
    if (!this.state.dateHeaderSelected) {
      this.setState({
        groupBy: 'Date',
        dateHeaderSelected: true,
        docHeaderSelected: false,
        storeHeaderSelected: false,
        orderDesc: true,
      });
    } else {
      this.updateOrder();
    }
  };
  compareDoctor(a, b): number {
    const doctor1: User = getCachedItem(a.userId);
    const doctor2: User = getCachedItem(b.userId);
    if (doctor1.firstName.toLowerCase() < doctor2.firstName.toLowerCase()) {
      return -1;
    } else if (
      doctor1.firstName.toLowerCase() > doctor2.firstName.toLowerCase()
    ) {
      return 1;
    }
    return 0;
  }
  groupByDoctor() {
    let data: any[] = [...this.state.waitingListAppointments];
    data.sort(this.compareDoctor);
    return data;
  }
  orderByDoctor = () => {
    if (!this.state.docHeaderSelected) {
      this.setState({
        groupBy: 'Doctor',
        dateHeaderSelected: false,
        docHeaderSelected: true,
        storeHeaderSelected: false,
        orderDesc: true,
      });
    } else {
      this.updateOrder();
    }
  };
  compareStore(a, b): number {
    const id1 = stripDataType(a.storeId);
    const id2 = stripDataType(b.storeId);
    const store1 = getAccount().stores.find((store) => store.storeId === id1);
    const store2 = getAccount().stores.find((store) => store.storeId === id2);
    if (store1.name.toLowerCase() < store2.name.toLowerCase()) {
      return -1;
    } else if (store1.name.toLowerCase() > store2.name.toLowerCase()) {
      return 1;
    }
    return 0;
  }
  groupByStore() {
    let data: any[] = [...this.state.waitingListAppointments];
    data.sort(this.compareStore);
    return data;
  }
  orderByStore = () => {
    if (!this.state.storeHeaderSelected) {
      this.setState({
        groupBy: 'Store',
        dateHeaderSelected: false,
        docHeaderSelected: false,
        storeHeaderSelected: true,
        orderDesc: true,
      });
    } else {
      this.updateOrder();
    }
  };

  renderFilterField() {
    const style = [styles.searchField, {minWidth: 350 * fontScale}];

    return (
      <TextInput
        returnKeyType="search"
        placeholder={strings.findRow}
        autoCorrect={false}
        autoCapitalize="none"
        style={style}
        value={this.state.filter}
        onChangeText={(filter: string) => this.setState({filter})}
        testID={'waitingListFilter'}
      />
    );
  }

  getItems(): any[] {
    let data: any[] = [...this.state.waitingListAppointments];
    let filterData: any[] = [];
    if (this.state.groupBy === 'Date') {
      data = this.groupByDate();
    } else if (this.state.groupBy === 'Doctor') {
      data = this.groupByDoctor();
    } else if (this.state.groupBy === 'Store') {
      data = this.groupByStore();
    }
    if (!this.state.orderDesc) {
      data.reverse();
    }
    const filter: ?string =
      this.state.filter !== undefined && this.state.filter !== ''
        ? deAccent(this.state.filter.trim().toLowerCase())
        : undefined;
    data = data.map((item) => {
      let type = '';
      const patient: PatientInfo | Patient = getCachedItem(item.patientId);
      const doctor: User = getCachedItem(item.userId);
      const storeId = item.storeId?.split('-')[1];
      const store = getAccount().stores.find(
        (store) => store.storeId == storeId,
      );
      if (item.appointmentTypes) {
        item.appointmentTypes.map((id, index) => {
          const t = getCachedItem(id);
          type +=
            index == item.appointmentTypes.length - 1
              ? `${t.name}.`
              : `${t.name}, `;
        });
      }
      filterData.push({
        patient: `${patient?.firstName} ${patient?.lastName}`,
        home: patient.phone,
        cell: patient.cell,
        work: patient.work,
        doctor: `${doctor?.firstName} ${doctor?.lastName}`,
        store: store?.name,
        comment: item.earlyRequestComment || '',
      });
      return {
        ...item,
        type,
        patient: `${patient?.firstName} ${patient?.lastName}`,
        age: formatAge(patient.dateOfBirth),
        home: patient.phone,
        cell: patient.cell,
        work: patient.work,
        doctor: `${doctor?.firstName} ${doctor?.lastName}`,
        store,
      };
    });
    if (filter) {
      data = data.filter(
        (item: any, index) =>
          item != null &&
          item !== undefined &&
          JSON.stringify(Object.values(filterData[index])).trim().length > 0 &&
          deAccent(
            JSON.stringify(Object.values(filterData[index])).toLowerCase(),
          ).indexOf(filter) >= 0,
      );
    }
    return data;
  }

  render() {
    const event: Appointment = this.props.event;
    console.log('Event: ' + JSON.stringify(event));
    const user: User = getCachedItem(event.userId);
    const appointments = this.getItems();
    const titleStyle = {
      marginBottom: 5,
      fontWeight: '500',
      fontSize: fontScale * 23,
    };
    const headerStyle = {
      fontWeight: '500',
      textAlign: 'center',
      fontSize: fontScale * 23,
    };
    return (
      <Portal theme={{colors: {backdrop: 'transparent'}}}>
        <Dialog
          style={{
            width: '70%',
            minHeight: '60%',
            maxHeight: '90%',
            alignSelf: 'center',
            backgroundColor: '#fff',
          }}
          visible={this.props.waitingListModal}
          onDismiss={this.closeDialog}
          dismissable={true}>
          <Dialog.Title>
            <Text style={{color: '#1db3b3'}}>{strings.waitingList}</Text>
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={{padding: 10, flexGrow: 1}}>
              <View style={{marginVertical: 15}}>
                <Text style={titleStyle}>
                  {strings.date}:{'  '}
                  {formatDate(event.start, yearDateTimeFormat)}
                </Text>
                <Text style={titleStyle}>
                  {strings.store}: {'  '}
                  {getStore().name}
                </Text>
                <Text style={titleStyle}>
                  {strings.doctor}:{'  '}
                  {user?.firstName} {user?.lastName}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20 * fontScale,
                }}>
                <View>{this.renderFilterField()}</View>
                <View>
                  <FormInput
                    optional
                    singleSelect
                    multiOptions
                    value={this.state.allStores}
                    showLabel={false}
                    readonly={false}
                    definition={{
                      options: [{label: strings.showAllStores, value: true}],
                    }}
                    onChangeValue={(v) => {
                      this.setState({allStores: !!v}, () =>
                        this.waitingListAppointments(),
                      );
                    }}
                    errorMessage={'error'}
                    isTyping={false}
                  />
                </View>
              </View>
              {this.state.fetchingWaitingList ? (
                <ActivityIndicator
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              ) : (
                <>
                  <View>
                    <View style={styles.listRow}>
                      <Text style={[headerStyle, styles.container]}>
                        {strings.patient}
                      </Text>
                      <Text style={[headerStyle, styles.container]}>
                        {strings.age}
                      </Text>
                      <Text style={[headerStyle, styles.container]}>
                        {strings.home}
                      </Text>
                      <Text style={[headerStyle, styles.container]}>
                        {strings.cell}
                      </Text>
                      <Text style={[headerStyle, styles.container]}>
                        {strings.work}
                      </Text>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                        onPress={this.orderByStore}>
                        {this.state.storeHeaderSelected && (
                          <ArrowIcon
                            name={
                              this.state.orderDesc
                                ? 'arrow-downward'
                                : 'arrow-upward'
                            }
                            color={selectionFontColor}
                          />
                        )}
                        <Text
                          style={{
                            ...headerStyle,
                            color: this.state.storeHeaderSelected
                              ? '#5ed4d4'
                              : 'black',
                          }}>
                          {strings.store}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                        onPress={this.orderByDoctor}>
                        {this.state.docHeaderSelected && (
                          <ArrowIcon
                            name={
                              this.state.orderDesc
                                ? 'arrow-downward'
                                : 'arrow-upward'
                            }
                            color={selectionFontColor}
                          />
                        )}
                        <Text
                          style={{
                            ...headerStyle,
                            color: this.state.docHeaderSelected
                              ? '#5ed4d4'
                              : 'black',
                          }}>
                          {strings.doctor}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                        onPress={this.orderByDate}>
                        {this.state.dateHeaderSelected && (
                          <ArrowIcon
                            name={
                              this.state.orderDesc
                                ? 'arrow-downward'
                                : 'arrow-upward'
                            }
                            color={selectionFontColor}
                          />
                        )}
                        <Text
                          style={{
                            ...headerStyle,
                            color: this.state.dateHeaderSelected
                              ? '#5ed4d4'
                              : 'black',
                          }}>
                          {strings.appDateAndTime}
                        </Text>
                      </TouchableOpacity>
                      <Text style={[headerStyle, styles.container]}>
                        {strings.comment}
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 1,
                        width: '100%',
                        backgroundColor: 'gray',
                        marginVertical: 5,
                      }}
                    />
                  </View>
                  <FlatList
                    data={appointments}
                    initialNumToRender={20}
                    showsVerticalScrollIndicator={false}
                    extraData={{filter: this.state.filter}}
                    renderItem={({item, index}) => {
                      const selected =
                        this.state.selectedWaitingEvent?.id === item.id;
                      const textStyle = {
                        flex: 1,
                        textAlign: 'center',
                        color: selected ? '#1db3b3' : 'black',
                      };
                      return (
                        <TouchableOpacity
                          onPress={() =>
                            this.setState({selectedWaitingEvent: item})
                          }
                          style={[
                            styles.listRow,
                            {
                              backgroundColor:
                                index % 2 === 0 ? '#F9F9F9' : '#FFFFFF',
                            },
                          ]}>
                          <Text style={textStyle}>{item.patient}</Text>
                          <Text style={textStyle}>{item?.age}</Text>
                          <Text style={textStyle}>{item?.home}</Text>
                          <Text style={textStyle}>{item?.cell}</Text>
                          <Text style={textStyle}>{item?.work}</Text>
                          <Text style={textStyle}>{item.store?.name}</Text>
                          <Text style={textStyle}>{item.doctor}</Text>
                          <View style={{flex: 1}}>
                            <Text style={textStyle}>
                              {formatDate(item.start, yearDateTimeFormat)}
                            </Text>
                            <Text style={{fontWeight: '500', ...textStyle}}>
                              {item?.type}
                            </Text>
                          </View>
                          <Text style={textStyle}>
                            {item?.earlyRequestComment}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <NativeBaseButton onPress={this.closeDialog}>
              {strings.close}
            </NativeBaseButton>
            <NativeBaseButton
              onPress={() => {
                this.props.onUpdateAppointment({
                  ...event,
                  earlyRequest: false,
                  newId: event.id,
                  id: this.state.selectedWaitingEvent.id,
                  patientId: this.state.selectedWaitingEvent.patientId,
                  appointmentTypes:
                    this.state.selectedWaitingEvent.appointmentTypes,
                  title: this.state.selectedWaitingEvent.title,
                });
              }}
              disabled={!this.state.selectedWaitingEvent}>
              {strings.reschedule}
            </NativeBaseButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }
}

/**
 * @flow
 */

'use strict';

import React, {Component} from 'react';
import {
  Image,
  View,
  TouchableHighlight,
  Text,
  Button,
  ScrollView,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  InteractionManager,
  RefreshControl,
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
import {styles, fontScale, isWeb} from './Styles';
import {strings} from './Strings';
import {
  formatDate,
  timeFormat,
  time24Format,
  dateTimeFormat,
  dayDateTime24Format,
  dayYearDateTime24Format,
  now,
  isToday,
  formatMoment,
  capitalize,
  formatDuration,
  jsonDateTimeFormat,
  jsonDateFormat,
  today,
  dayYearDateTimeFormat,
  farDateFormat2,
  isEmpty,
  formatAge,
  prefix,
} from './Util';
import {
  FormRow,
  FormTextInput,
  FormDateInput,
  FormDateTimeInput,
  FormDurationInput,
  FormCode,
  FormCheckBox,
  FormNumberInput,
  FormOptions,
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
} from './Rest';
import {formatCode, getAllCodes, getCodeDefinition} from './Codes';
import {getStore} from './DoctorApp';
import {Button as NativeBaseButton, Dialog, Title} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
): Promise<Appointment[]> {
  const searchCriteria = {
    storeId: storeId,
    doctorId: doctorId,
    patientId: patientId,
    startDate: formatDate(startDate, jsonDateFormat),
    maxDays: maxDays ? maxDays.toString() : undefined,
    includeAvailableSlots,
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
): Promise<Appointment> {
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
export async function cancelAppointment(body) {
  const appointment: Appointment = await performActionOnItem(
    'cancel',
    body,
    'POST',
    {emrOnly: true},
  );
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
    isNewAppointment: boolean,
  };
  state: {
    isEditable: boolean,
    editedAppointment: ?Appointment,
  };
  constructor(props: any) {
    super(props);
    this.state = {
      isEditable: false,
      editedAppointment: undefined,
    };
  }
  componentDidMount() {
    if (this.props.isNewAppointment) {
      this.startEdit();
    }
  }

  startEdit() {
    !isWeb && LayoutAnimation.easeInEaseOut();
    let appointmentClone: Appointment = {...this.props.appointment};

    this.setState({isEditable: true, editedAppointment: appointmentClone});
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
    if (this.props.isNewAppointment) {
      this.props.onCloseAppointment();
    }
  }

  commitEdit() {
    !isWeb && LayoutAnimation.easeInEaseOut();

    this.props.onUpdateAppointment(this.state.editedAppointment);
    if (!this.props.isNewAppointment) {
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

  getAppointmentTypes(): CodeDefinition[] {
    let appointmentTypes: CodeDefinition[] = getAllCodes('procedureCodes');
    if (appointmentTypes && appointmentTypes.length > 0) {
      appointmentTypes = appointmentTypes.filter(
        (type: CodeDefinition) => type.isAppointmentType,
      );
    }
    return appointmentTypes;
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

  updateValue(propertyName: string, newValue: any, index?: number) {
    let editedAppointment: ?Appointment = this.state.editedAppointment;

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
  }

  getDateFormat(date: ?string): string {
    if (!date) {
      return yearDateFormat;
    }

    return farDateFormat2;
  }

  renderAppointmentsTypes() {
    const labelWidth: number = 200 * fontScale;
    const appointmentsType: string[] =
      this.state.editedAppointment.appointmentTypes;
    let dropdowns = [];
    dropdowns.push(
      <FormRow>
        <FormOptions
          labelWidth={labelWidth}
          options={this.getAppointmentTypes()}
          showLabel={true}
          label={strings.AppointmentType}
          value={appointmentsType ? appointmentsType[0] : ''}
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
          dropdowns.push(
            <FormRow>
              <FormOptions
                labelWidth={labelWidth}
                options={this.getAppointmentTypes()}
                showLabel={true}
                label={strings.AppointmentType}
                value={appointmentsType[i]}
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

    let genderShort: string = formatCode('genderCode', patient.gender);
    if (genderShort.length > 0) {
      genderShort = genderShort.substring(0, 1);
    }
    if (!this.state.isEditable || !this.state.editedAppointment) {
      return (
        <View>
          <TouchableOpacity
            onPress={() => this.startEdit()}
            styles={{flexDirection: 'column', flex: 100}}>
            {user && (
              <Text style={styles.text}>
                {strings.doctor}: {user.firstName} {user.lastName}
              </Text>
            )}

            <AppointmentIcons
              appointment={appointment}
              orientation="horizontal"
            />
            <Title>{getPatientFullName(patient)} </Title>
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
          <TouchableOpacity
            onPress={() => this.props.onCancelAppointment()}
            style={{
              width: 150,
              marginTop: 20,
              borderRadius: 10,
              paddingVertical: 10,
              backgroundColor: '#1db3b3',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text style={{color: '#fff'}}> {strings.cancelAppointment}</Text>
          </TouchableOpacity>
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

        {!this.props.isNewAppointment && (
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
        <View style={[styles.bottomItems, {alignSelf: 'flex-end'}]}>
          <NativeBaseButton onPress={() => this.cancelEdit()}>
            {strings.cancel}
          </NativeBaseButton>
          <NativeBaseButton
            disabled={!this.props.isNewAppointment}
            onPress={() => this.commitEdit()}>
            {strings.book}
          </NativeBaseButton>
        </View>
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

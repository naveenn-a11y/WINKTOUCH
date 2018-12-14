/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Image, View, TouchableHighlight, Text, Button, ScrollView, TouchableOpacity, TextInput, LayoutAnimation, InteractionManager, RefreshControl} from 'react-native';
import base64 from 'base-64';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import type {PatientInfo, Patient, Appointment, Visit, User, AppointmentType} from './Types';
import { styles, fontScale } from './Styles';
import { strings } from './Strings';
import { formatDate, time24Format, dateTimeFormat, dayDateTime24Format, dayYearDateTime24Format, now, isToday, formatMoment, capitalize, parseDate, formatDuration, jsonDateTimeFormat, jsonDateFormat, today, dayYearDateTimeFormat } from './Util';
import { PatientCard } from './Patient';
import { FormRow, FormTextInput, FormDateInput, FormDateTimeInput, FormDurationInput, FormCode } from './Form';
import { VisitHistory, fetchVisitHistory } from './Visit';
import { fetchPatientInfo, PatientTags } from './Patient';
import { cacheItem, getCachedItem, getCachedItems, cacheItemsById, cacheItemById, clearCachedItemById} from './DataCache';
import { searchItems, fetchItemById, stripDataType } from './Rest';
import { putRest } from './WinkRest';
import { formatCode, parseCode } from './Codes';

export async function fetchAppointment(appointmentId: string) : Appointment {
  let appointment : Appointment = await fetchItemById(appointmentId);
  return appointment;
}

export async function fetchAppointments(storeId: ?string, doctorId: ?string, maxDays: number, patientId?: string) : Appointment[] {
    console.log('fetching appointments at '+formatDate(now(), dayDateTime24Format));
    const searchCriteria = {
      storeId: storeId,
      doctorId: doctorId,
      patientId: patientId,
      startDate: formatDate(today(),jsonDateFormat),
      maxDays: maxDays.toString()
    };
    let restResponse = await searchItems('Appointment/list/booked', searchCriteria);
    let users : User[] = restResponse.userList;
    let patients: PatientInfo[] = restResponse.patientList;
    let appointmentTypes: AppointmentType[] = restResponse.appointmentTypeList;
    let appointments : Appointment[] = restResponse.appointmentList;
    cacheItemsById(users);
    cacheItemsById(appointmentTypes);
    cacheItemsById(appointments);
    cacheItemsById(patients);
    return appointments;
}

export async function rescheduleAppointment(appointment : Appointment) {
  let appointmentId : number = stripDataType(appointment.id);
  const parameters = {
    status: 2,
    cancelReason: 2,
    cancelledComment: 'Walk in',
    idPatient: stripDataType(appointment.patientId),
    duration: 15 //TODO
  };
  appointment = await putRest('webresources/appointments/ehr/'+appointmentId, parameters);
  cacheItemById(appointment);
  return appointment;
}

class AppointmentTypes extends Component {
  props: {
    appointment: Appointment,
    orientation?: string
  }
  static defaultProps = {
    orientation: 'vertical'
  }
  render() {
    const boxSize :number = (this.props.orientation==='horizontal'?10:10)*fontScale;
    return <View style={{flexDirection: (this.props.orientation==='horizontal'?'row':'column'), marginHorizontal:3*fontScale}}>
      {this.props.appointment.appointmentTypes && getCachedItems(this.props.appointment.appointmentTypes).map((appointmentType: AppointmentType, index: number) =>
          {appointmentType && <View style={{backgroundColor: appointmentType.color, padding:boxSize, height:boxSize, width:boxSize}} key={index}><Text></Text></View>}
      ) }
    </View>
  }
}

class AppointmentIcons extends Component {
  props: {
    appointment: Appointment,
    orientation?: string
  }
  static defaultProps = {
    orientation: 'vertical'
  }
  render() {
    return <View style={this.props.orientation==='horizontal'?styles.rowLayout:undefined}>
      <Image source={require('./image/calendar/waitingx2.png')} style={{
        width: 22 * fontScale,
        height: 22 * fontScale,
        resizeMode: 'contain'
      }} />
      <Image source={require('./image/calendar/existingPatientx2.png')} style={{
        width: 22 * fontScale,
        height: 22 * fontScale,
        resizeMode: 'contain'
      }} />
      <Image source={require('./image/calendar/readReplyx2.png')} style={{
        width: 22 * fontScale,
        height: 22 * fontScale,
        resizeMode: 'contain'
      }} />
      <Image source={require('./image/calendar/paidx2.png')} style={{
        width: 22 * fontScale,
        height: 22 * fontScale,
        resizeMode: 'contain'
      }} />
    </View>
  }
}

export class AppointmentNotification extends Component {
  props: {
    patient: Patient,
    showIcons?: boolean
  }
  render() {
    return <View style={styles.rowLayout}>
        {this.props.showIcons &&<Image source={require('./image/calendar/waitingx2.png')} style={{
          width: 18 * fontScale,
          height: 18 * fontScale,
          resizeMode: 'contain',
          marginVertical: 3 * fontScale
        }} />}
        {this.props.showIcons && <AppointmentStatus orientation='horizontal'/>}
        <Text style={styles.text}>{this.props.patient.lastName}</Text>
    </View>
  }
}

export class UpcomingAppointments extends Component {
  render() {
    return <View style={styles.sideMenuList}>
      <AppointmentNotification patient={{lastName: 'Next patient 1'}}/>
      <AppointmentNotification patient={{lastName: 'Next patient 2'}}/>
    </View>
  }
}

export class AppointmentSummary extends Component {
    props: {
        appointment: Appointment,
        onPress: () => void
    };

    constructor(props: any) {
        super(props);
    }

    render() {
        const patient : Patient = getCachedItem(this.props.appointment.patientId);
        let cardStyle = styles['card'+capitalize(this.props.appointment.status.toString())];
        return <TouchableOpacity onPress={this.props.onPress}>
            <View style={cardStyle}>
              <View style={{flexDirection: 'row'}}>
                <AppointmentTypes appointment={this.props.appointment}/>
                <AppointmentIcons />
                <View style={{marginHorizontal: 5*fontScale}} >
                  <Text style={styles.text}>{formatDate(this.props.appointment.start, dayYearDateTimeFormat)}</Text>
                  <Text style={styles.text}>{this.props.appointment.title}</Text>
                  <Text style={styles.text}>{patient && patient.firstName} {patient && patient.lastName}</Text>
                  <PatientTags patient={patient} />
                  <Text style={styles.text}>{formatCode('appointmentStatusCode', this.props.appointment.status)}</Text>
                </View>
              </View>
            </View>
        </TouchableOpacity>
    }
}

export class AppointmentsSummary extends Component {
    props: {
        appointments: Appointment[],
        onRefreshAppointments: () => void,
        navigation: any
    }
    state: {
        refreshing: boolean
    }
    constructor(props: any) {
        super(props);
        this.state = {
          refreshing: false
        }
    }

    async refresh() {
      this.setState({refreshing: true});
      await this.props.onRefreshAppointments();
      this.setState({refreshing: false});
    }

    render() { //TODO flatlist
        return <ScrollView refreshControl={this.props.onRefreshAppointments?
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={() => this.refresh()}
          />:undefined}>
          <View style={styles.topFlow}>
                {this.props.appointments && this.props.appointments.map((appointment: Appointment, index: number) => {
                    return <AppointmentSummary key={index} appointment={appointment} onPress={() => this.props.navigation.navigate('appointment', {appointment})} />
                })}
        </View>
        </ScrollView>
    }
}

export class AppointmentDetails extends Component {
    props: {
        appointment: Appointment,
        onUpdateAppointment: (appointment: Appointment) => void
    }
    state: {
        isEditable: boolean,
        editedAppointment: ?Appointment
    }
    constructor(props: any) {
        super(props);
        this.state = {
            isEditable: false,
            editedAppointment: undefined
        }
    }

    startEdit() {
        if (__DEV__===false) return;
        LayoutAnimation.easeInEaseOut();
        let appointmentClone : Appointment = {...this.props.appointment};
        this.setState({ isEditable: true, editedAppointment: appointmentClone});
    }

    cancelEdit() {
        LayoutAnimation.easeInEaseOut();
        this.setState({ isEditable: false });
    }

    commitEdit() {
        LayoutAnimation.easeInEaseOut();
        let appointment = this.props.onUpdateAppointment(this.state.editedAppointment);
        this.props.onUpdateAppointment(appointment);
        this.setState({ isEditable: false, editedAppointment: undefined });
    }

    updateValue(propertyName: string, newValue: any) {
      let editedAppointment : ?Appointment = this.state.editedAppointment;
      if (!editedAppointment) return;
      editedAppointment[propertyName] = newValue;
      this.setState(editedAppointment);
    }

    getDateFormat(date: ?string) : string {
      if (!date) return yearDateFormat;
      let sameYear : boolean = date.startsWith(now().getFullYear().toString());
      return sameYear?dayDateTime24Format:dayYearDateTime24Format;
    }

    render() {
        const user : User = getCachedItem(this.props.appointment.userId);
        if (!this.state.isEditable || !this.state.editedAppointment) {
            return <TouchableOpacity onPress={() => this.startEdit()}>
                <View style={styles.card}>
                    <View style={styles.centeredRowLayout}>
                      <Text style={styles.screenTitle}>{this.props.appointment.title}</Text>
                      <AppointmentTypes appointment={this.props.appointment} orientation='horizontal'/>
                      <AppointmentIcons appointment={this.props.appointment} orientation='horizontal'/>
                    </View>
                    <Text style={styles.text}>{strings.scheduledAt} {formatDate(this.props.appointment.start, this.getDateFormat(this.props.appointment.start))} {strings.forDuration} {formatDuration(this.props.appointment.end, this.props.appointment.start)}.</Text>
                    <Text style={styles.text}>{strings.status}: {formatCode('appointmentStatusCode', this.props.appointment.status)}</Text>
                    <Text style={styles.text}>{strings.doctor}: {user.firstName} {user.lastName}</Text>
                </View>
            </TouchableOpacity>
        }
        const labelWidth: number = 200 * fontScale;
        return <View style={styles.form}>
            <Text style={styles.screenTitle}>{this.state.editedAppointment.title} {strings.appointmentTitle}</Text>
            <FormRow>
                <FormDateTimeInput labelWidth={labelWidth} readonly={true} includeDay={true} label='Scheduled start time' value={this.state.editedAppointment.start}/>
                <FormDurationInput label='Duration' value={this.state.editedAppointment.end} startDate={this.state.editedAppointment.start}
                  onChangeValue={(newValue: ?string) => this.updateValue('end', newValue)} />
            </FormRow>
            <FormRow>
                <FormCode labelWidth={labelWidth} label='Status' readonly={false} code='appointmentStatusCode' value={this.state.editedAppointment.status} onChangeValue={(code: ?string|?number) => this.updateValue('status', code)}/>
            </FormRow>
            <FormRow>
                <FormTextInput labelWidth={labelWidth} label='Doctor' readonly={true} value={user.firstName+ ' '+user.lastName} />
            </FormRow>
            <View style={styles.buttonsRowLayout}>
                <Button title='Cancel' onPress={() => this.cancelEdit()} />
                <Button title='Update' onPress={() => this.commitEdit()} />
            </View>
        </View>
    }
}

export class AppointmentScreen extends Component {
    props: {
        navigation: any
    }
    params: {
        appointment: Appointment,
    }
    state: {
        appointment: Appointment,
        patientInfo: PatientInfo,
        visitHistory: string[]
    }
    unmounted: boolean;

    constructor(props: any) {
        super(props);
        this.params = this.props.navigation.state.params;
        this.unmounted = false;
        this.state = {
          appointment: getCachedItem(this.params.appointment.id),
          patientInfo: getCachedItem(this.params.appointment.patientId),
          visitHistory: getCachedItem('visitHistory-'+this.params.appointment.patientId)
        }
    }

    componentWillMount() {
    }

    componentDidMount() {
      InteractionManager.runAfterInteractions(() => {
        this.refreshVisitHistory();
        this.refreshAppointment();
        this.refreshPatientInfo();
      });
    }

    componentWillReceiveProps(nextProps: any) {
      this.params = nextProps.navigation.state.params;
      if (this.params.refresh===true) {
        this.props.navigation.setParams({refresh: false});
        this.setState({visitHistory: getCachedItem('visitHistory-'+this.params.appointment.patientId)});
        this.forceUpdate();
      }
    }

    updateHistory = (visit: Visit) => {
      this.setState({
        visitHistory: getCachedItem('visitHistory-'+this.params.appointment.patientId)
      });
    }

    updateAppointment = (appointment: Appointment) => {
      this.setState({appointment});
    }

    async storeAppointment(appointment: ?Appointment) {
      if (!appointment) return;
      try {
        appointment = await storeDocument(appointment);
        if (!this.unmounted)
          this.setState({appointment});
      } catch (error) {
        if (this.unmounted) {
          this.props.navigation.navigate('appointment', this.params.appointment);
        } else {
          this.refreshAppointment();
        }
      }
    }

    async refreshAppointment() {
      let appointment = await fetchAppointment(this.params.appointment.id);
      if (this.state.appointment && appointment.version!==this.state.appointment.version)
        this.setState({appointment});
    }

    async refreshPatientInfo() {
      const patientInfo : PatientInfo = await fetchPatientInfo(this.params.appointment.patientId);
      if (patientInfo.version!==this.state.patientInfo.version)
        this.setState({patientInfo});
    }

    async refreshVisitHistory() {
      const visitHistory : string[] = await fetchVisitHistory(this.params.appointment.patientId);
      this.setState({visitHistory});
    }

    componentWillUnmount() {
      this.unmounted = true;
    }

    render() { //TODO FlatList
        return <KeyboardAwareScrollView>
            {this.state.appointment && <AppointmentDetails appointment={this.state.appointment} onUpdateAppointment={this.updateAppointment} />}
            <PatientCard patientInfo={this.state.patientInfo} navigation={this.props.navigation} />
            <VisitHistory appointment={this.params.appointment} visitHistory={this.state.visitHistory}
              navigation={this.props.navigation} onAddVisit={this.updateHistory} appointmentStateKey={this.props.navigation.state.key}/>
        </KeyboardAwareScrollView>
    }
}

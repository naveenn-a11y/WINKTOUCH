/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Image, View, TouchableHighlight, Text, Button, ScrollView, TouchableOpacity, TextInput, LayoutAnimation, InteractionManager, RefreshControl} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import type {PatientInfo, Patient, Appointment, Visit, User, AppointmentType} from './Types';
import { styles, fontScale } from './Styles';
import { strings } from './Strings';
import { formatDate, timeFormat, time24Format, dateTimeFormat, dayDateTime24Format, dayYearDateTime24Format, now, isToday, formatMoment, capitalize, formatDuration, jsonDateTimeFormat, jsonDateFormat, today, dayYearDateTimeFormat } from './Util';
import { FormRow, FormTextInput, FormDateInput, FormDateTimeInput, FormDurationInput, FormCode } from './Form';
import { VisitHistory, fetchVisitHistory } from './Visit';
import { PatientCard, fetchPatientInfo, PatientTags } from './Patient';
import { cacheItem, getCachedItem, getCachedItems, cacheItemsById, cacheItemById, clearCachedItemById} from './DataCache';
import { searchItems, fetchItemById, stripDataType } from './Rest';
import { formatCode } from './Codes';

export async function fetchAppointment(appointmentId: string) : Promise<Appointment> {
  let appointment : Appointment = await fetchItemById(appointmentId);
  return appointment;
}

export async function fetchAppointments(storeId: ?string, doctorId: ?string, maxDays: number, patientId?: string) : Promise<Appointment[]> {
    //__DEV__ && console.log('fetching appointments at '+formatDate(now(), dayDateTime24Format));
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
    const isHorizontal : boolean = this.props.orientation==='horizontal';
    return <View style={{flexDirection: (isHorizontal?'row':'column'), marginHorizontal:3*fontScale, marginTop:(isHorizontal?20*fontScale:0)}}>
      {this.props.appointment.appointmentTypes && getCachedItems(this.props.appointment.appointmentTypes).map((appointmentType: AppointmentType, index: number) =>
          {
            if (appointmentType===null || appointmentType===undefined || appointmentType.color===undefined || appointmentType.color===null) return null;
            return <View style={{backgroundColor: appointmentType.color, padding:boxSize, height:boxSize, width:boxSize, margin:1*fontScale}} key={index}></View>
          }
      )}
    </View>
  }
}

class AppointmentIcon extends Component {
  props: {
    name: string
  }
  render() {
    const boxSize :number = 22*fontScale;
    if ('invoiced'===this.props.name) return <Image source={require('./image/calendar/paidx2.png')} style={{
      width: boxSize,
      height: boxSize,
      margin:1*fontScale,
      resizeMode: 'contain'
    }} />
    else if ('lastNoShow'===this.props.name) return <Image source={require('./image/calendar/lastNoShowx2.png')} style={{
      width: boxSize,
      height: boxSize,
      margin:1*fontScale,
      resizeMode: 'contain'
    }} />
    else if ('existingPatient'===this.props.name) return <Image source={require('./image/calendar/existingPatientx2.png')} style={{
      width: boxSize,
      height: boxSize,
      margin:1*fontScale,
      resizeMode: 'contain'
    }} />
    else if ('newPatient'===this.props.name) return <Image source={require('./image/calendar/newPatientx2.png')} style={{
      width: boxSize,
      height: boxSize,
      margin:1*fontScale,
      resizeMode: 'contain'
    }} />
    else if ('leftWithRx'===this.props.name) return <Image source={require('./image/calendar/leftWithRxx2.png')} style={{
      width: boxSize,
      height: boxSize,
      margin:1*fontScale,
      resizeMode: 'contain'
    }} />
    else if ('unconfirmed'===this.props.name) return <Image source={require('./image/calendar/unconfirmedx2.png')} style={{
      width: boxSize,
      height: boxSize,
      margin:1*fontScale,
      resizeMode: 'contain'
    }} />
    else if ('confirmed'===this.props.name) return <Image source={require('./image/calendar/confirmedx2.png')} style={{
      width: boxSize,
      height: boxSize,
      margin:1*fontScale,
      resizeMode: 'contain'
    }} />
    else if ('noShow'===this.props.name) return <Image source={require('./image/calendar/noShowx2.png')} style={{
      width: boxSize,
      height: boxSize,
      margin:1*fontScale,
      resizeMode: 'contain'
    }} />
    else if ('waiting'===this.props.name) return <Image source={require('./image/calendar/waitingx2.png')} style={{
      width: boxSize,
      height: boxSize,
      margin:1*fontScale,
      resizeMode: 'contain'
    }} />
    else if ('completed'===this.props.name) return <Image source={require('./image/calendar/completedx2.png')} style={{
      width: boxSize,
      height: boxSize,
      margin:1*fontScale,
      resizeMode: 'contain'
    }} />
    else if ('family'===this.props.name) return <Image source={require('./image/calendar/familyx2.png')} style={{
      width: boxSize,
      height: boxSize,
      margin:1*fontScale,
      resizeMode: 'contain'
    }} />
    else if (__DEV__) return <Text style={styles.text}>{this.props.name}</Text>
    return null;
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
    if (!this.props.appointment || !this.props.appointment.indicators || this.props.appointment.indicators.length==0)
      return null;
    const isHorizontal : boolean = this.props.orientation==='horizontal';
    return <View style={{flexDirection: (isHorizontal?'row':'column'), marginHorizontal:3*fontScale, marginTop:(isHorizontal?20*fontScale:0)}}>
    {this.props.appointment.indicators.map((indicator: string, index: number) => {
      return <AppointmentIcon name={indicator} key={index}/>
    })}
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
        const date : string = this.props.appointment.start;
        return <TouchableOpacity onPress={this.props.onPress}>
            <View style={cardStyle}>
              <View style={{flexDirection: 'row'}}>
                <AppointmentTypes appointment={this.props.appointment}/>
                <AppointmentIcons appointment={this.props.appointment}/>
                <View style={{marginHorizontal: 5*fontScale}} >
                  <Text style={styles.text}>{isToday(date)?formatDate(date, timeFormat):formatDate(date, dayYearDateTimeFormat)}</Text>
                  <Text style={styles.text}>{this.props.appointment.title}</Text>
                  <View style={{flexDirection: 'row'}}>
                    <Text style={styles.text}>{patient && patient.firstName} {patient && patient.lastName}</Text>
                    <PatientTags patient={patient} />
                  </View>
                {/**<Text style={styles.text}>{formatCode('appointmentStatusCode', this.props.appointment.status)}</Text>*/}
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

export class AppointmentTitle extends Component {
  props: {
      appointment: Appointment
  }

  render() {
      if (!this.props.appointment || !this.props.appointment.id) return null;
      const date : string = this.props.appointment.start;
      return  <View>
            <View style={styles.centeredRowLayout}>
              <Text style={styles.screenTitle}>{this.props.appointment.title}</Text>
              <AppointmentTypes appointment={this.props.appointment} orientation='horizontal'/>
              <AppointmentIcons appointment={this.props.appointment} orientation='horizontal'/>
            </View>
            <View style={styles.centeredRowLayout}>
              <Text style={styles.text}>{strings.scheduledAt} {isToday(date)?formatDate(date, timeFormat):formatDate(date, dayYearDateTimeFormat)} {strings.forDuration} {formatDuration(this.props.appointment.end, date)}.</Text>
            </View>
        </View>
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
        appointment: ?Appointment,
        patientInfo: PatientInfo,
        visitHistory: string[],
        patientDocumentHistory: string[],
        scrollEnabled: boolean,
    }
    unmounted: boolean;

    constructor(props: any) {
        super(props);
        let params = this.props.navigation.state.params;
        this.unmounted = false;
        const appointment: ?Appointment = (params.appointment && params.appointment.id!=undefined)?getCachedItem(params.appointment.id):params.appointment;
        const patientId : string = appointment?appointment.patientId:params.patientInfo.id;
        this.state = {
          appointment,
          patientInfo: getCachedItem(patientId),
          visitHistory: getCachedItem('visitHistory-'+patientId),
          patientDocumentHistory: getCachedItem('patientDocumentHistory-'+patientId),
          scrollEnabled: true
        }
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
      if (params.refresh===true) {
        this.props.navigation.setParams({refresh: false});
        const appointment: ?Appointment = (params.appointment && params.appointment.id!=undefined)?getCachedItem(params.appointment.id):params.appointment;
        const patientId : string = appointment?appointment.patientId:params.patientInfo.id;
        this.setState({
          patientInfo: getCachedItem(patientId),
          visitHistory: getCachedItem('visitHistory-'+patientId),
          patientDocumentHistory: getCachedItem('patientDocumentHistory-'+patientId)
        });
        this.forceUpdate();
      }
    }

    getPatientId() : string {
      const params = this.props.navigation.state.params;
      return params.appointment?params.appointment.patientId:params.patientInfo.id;
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
          let params = this.props.navigation.state.params;
          this.props.navigation.navigate('appointment', params.appointment);
        } else {
          this.refreshAppointment();
        }
      }
    }

    async refreshVisitHistory() {
      const visitHistory : string[] = await fetchVisitHistory(this.getPatientId());
      this.setState({
        visitHistory,
        patientDocumentHistory: getCachedItem('patientDocumentHistory-'+this.getPatientId())
      });
    }

    refreshFromCache = () => {
      const patientId = this.state.patientInfo.id;
      this.setState({
        patientInfo: getCachedItem(patientId),
        visitHistory: getCachedItem('visitHistory-'+patientId),
        patientDocumentHistory: getCachedItem('patientDocumentHistory-'+patientId)
      });
    }


    async refreshAppointment() {
      let params = this.props.navigation.state.params;
      if (params.appointment===undefined || params.appointment.id===undefined) return;
      let appointment = await fetchAppointment(params.appointment.id);
      if (this.state.appointment && appointment.version!==this.state.appointment.version)
        this.setState({appointment});
    }

    async refreshPatientInfo() {
      const patientInfo : PatientInfo = await fetchPatientInfo(this.getPatientId());
      if (patientInfo.version && patientInfo.version!==this.state.patientInfo.version)
        this.setState({patientInfo});
    }

    componentWillUnmount() {
      this.unmounted = true;
    }

    enableScroll = () => {
      if (this.state.scrollEnabled===true) return;
      this.setState({scrollEnabled: true});
    }

    disableScroll = () => {
      if (this.state.scrollEnabled===false) return;
      this.setState({scrollEnabled: false});
    }

    render() {
        let params = this.props.navigation.state.params;
        return <KeyboardAwareScrollView scrollEnabled={this.state.scrollEnabled}>
            {this.state.appointment && <AppointmentTitle appointment={this.state.appointment} />}
            <PatientCard patientInfo={this.state.patientInfo} navigation={this.props.navigation} refreshStateKey={this.props.navigation.state.key}/>
            <VisitHistory patientInfo={this.state.patientInfo} appointment={params.appointment} visitHistory={this.state.visitHistory} patientDocumentHistory={this.state.patientDocumentHistory}
              navigation={this.props.navigation} onRefresh={this.refreshFromCache} appointmentStateKey={this.props.navigation.state.key}
              enableScroll={this.enableScroll} disableScroll={this.disableScroll} />
        </KeyboardAwareScrollView>
    }
}

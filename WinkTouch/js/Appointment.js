/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Image, View, TouchableHighlight, Text, Button, ScrollView, TouchableOpacity, TextInput, LayoutAnimation } from 'react-native';
import dateFormat from 'dateformat';
import base64 from 'base-64';
import { styles, fontScale } from './Styles';
import type {PatientInfo, Patient, Appointment, Visit} from './Types';
import { PatientCard, getCachedPatientInfo } from './Patient';
import { FormRow, FormTextInput, FormDateInput } from './Form';
import { VisitHistory, fetchVisitHistory } from './Visit';
import { fetchPatient, fetchPatientInfo, PatientTypes } from './Patient';
import { storeDocument, fetchViewDocuments } from './CouchDb';
import { getCachedItem, getCachedItems} from './DataCache';

export async function fetchAppointments(doctorId: string) : Appointment[] {
  const startKey: string[] = [doctorId,'2016-12-13T9'];
  const endKey: string[] = [doctorId,'2018'];
  let appointments : Appointment[] = await fetchViewDocuments('appointments', startKey, endKey);
  return appointments;
}

export async function createAppointment(appointment: Appointment) : Appointment {
  try {
      appointment.dataType = 'Appointment';
      appointment = await storeDocument(appointment);
      return appointment;
  } catch (error) {
    console.log(error);
    alert('Something went wrong trying to store the appointment on the server. You can try again anytime.');
  }
}

class AppointmentStatus extends Component {
  render() {
    return <View>
      <View style={{backgroundColor: 'red', padding:10*fontScale}}></View>
      <View style={{backgroundColor: 'purple', padding:10*fontScale}}></View>
    </View>
  }
}

class AppointmentIcons extends Component {
  render() {
    return <View>
      <Image source={require('./image/calendar/waitingx2.png')} style={{
        width: 20 * fontScale,
        height: 20 * fontScale,
        resizeMode: 'contain'
      }} />
      <Image source={require('./image/calendar/existingPatientx2.png')} style={{
        width: 20 * fontScale,
        height: 20 * fontScale,
        resizeMode: 'contain'
      }} />
      <Image source={require('./image/calendar/readReplyx2.png')} style={{
        width: 20 * fontScale,
        height: 20 * fontScale,
        resizeMode: 'contain'
      }} />
      <Image source={require('./image/calendar/paidx2.png')} style={{
        width: 20 * fontScale,
        height: 20 * fontScale,
        resizeMode: 'contain'
      }} />
    </View>
  }
}

export default class AppointmentSummary extends Component {
    props: {
        appointment: Appointment,
        onPress: () => void
    };

    constructor(props: any) {
        super(props);
    }

    appointmentStatus() : string {
      const statuses : string[] = ['Booked','Confirmed','Late','Started','Done'];
      const status : string = statuses[Math.floor(Math.random()*statuses.length)];
      return status;
    }

    render() {
        const status : string = this.appointmentStatus();
        const patient : Patient = getCachedItem(this.props.appointment.patientId);
        let cardStyle = styles['card'+status];
        return <TouchableOpacity onPress={this.props.onPress}>
            <View style={cardStyle}>
              <View style={{flexDirection: 'row'}}>
                <AppointmentStatus />
                <AppointmentIcons />
                <View style={{marginHorizontal: 5*fontScale}} >
                  <Text style={styles.text}>{dateFormat(this.props.appointment.scheduledStart, 'h:MM')} till {dateFormat(this.props.appointment.scheduledEnd, 'h:MM')}</Text>
                  <Text style={styles.text}>{patient.firstName} {patient.lastName}</Text><PatientTypes />
                  <Text style={styles.text}>{this.props.appointment.type}</Text>
                  <Text style={styles.text}>{this.props.appointment.patientPresence}</Text>
                </View>
              </View>
            </View>
        </TouchableOpacity>
    }
}

export class AppointmentsSummary extends Component {
    props: {
        appointments: Appointment[],
        onNavigationChange: (action: string, data: any) => void
    }
    constructor(props: any) {
        super(props);
    }

    render() {
        return <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between'
        }}>
            <ScrollView horizontal={true}>
                {this.props.appointments && this.props.appointments.map((appointment: Appointment, index: number) => {
                    return <AppointmentSummary key={index} appointment={appointment} onPress={() => this.props.onNavigationChange('showAppointment', appointment)} />
                })}
            </ScrollView>
        </View>
    }
}

class AppointmentDetails extends Component {
    props: {
        appointment: Appointment
    }
    state: {
        isEditable: boolean
    }
    constructor(props) {
        super(props);
        this.state = {
            isEditable: false
        }
    }

    startEdit() {
        LayoutAnimation.easeInEaseOut();
        this.setState({ isEditable: true });
    }

    cancelEdit() {
        LayoutAnimation.easeInEaseOut();
        this.setState({ isEditable: false });
    }

    saveEdit() {
        LayoutAnimation.easeInEaseOut();
        this.setState({ isEditable: false });
    }

    render() {
        if (!this.state.isEditable) {
            return <TouchableOpacity onPress={() => this.startEdit()}>
                <View style={styles.card}>
                    <Text style={styles.screenTitle}>{this.props.appointment.type}</Text>
                    <Text style={styles.text}>Visit is scheduled to start in 5 minutes and finish after 20 minutes</Text>
                    <Text style={styles.text}>Patient is in wating room since 10 minutes</Text>
                    <Text style={styles.text}>The exam will take place in {this.props.appointment.location}by Doctor {this.props.appointment.doctorId}</Text>
                </View>
            </TouchableOpacity>
        }
        const labelWidth: number = 200 * fontScale;
        return <View style={styles.form}>
            <Text style={styles.screenTitle}>{this.props.appointment.type}</Text>
            <FormRow>
                <FormDateInput labelWidth={labelWidth} label='Scheduled start time' value={this.props.appointment.scheduledStart} />
                <FormDateInput label='Duration' value={this.props.appointment.scheduledEnd} />
            </FormRow>
            <FormRow>
                <FormTextInput labelWidth={labelWidth} label='Status' value={this.props.appointment.bookingStatus} />
            </FormRow>
            <FormRow>
                <FormTextInput labelWidth={labelWidth} label='Location' value={this.props.appointment.location} />
            </FormRow>
            <FormRow>
                <FormTextInput labelWidth={labelWidth} label='Doctor' value={this.props.appointment.doctorId} />
            </FormRow>
            <View style={styles.buttonsRowLayout}>
                <Button title='Cancel' onPress={() => this.cancelEdit()} />
                <Button title='Update' onPress={() => this.saveEdit()} />
            </View>
        </View>
    }
}

export class AppointmentScreen extends Component {
    props: {
        appointment: Appointment,
        onNavigationChange: (action: string, data: any) => void,
        onUpdate: (itemType: string, item: any) => void
    }
    state: {
        patientInfo: PatientInfo,
        visitHistory: Visit[]
    }
    constructor(props: any) {
        super(props);
        this.state = {
          patientInfo: getCachedPatientInfo(getCachedItem(this.props.appointment.patientId)),
          visitHistory: getCachedItems(getCachedItem('visitHistory'+this.props.appointment.patientId))
        }
        this.refreshPatientInfo();
        this.refreshVisitHistory();
    }

    componentWillReceiveProps(nextProps: any) {
      this.setState({
        patientInfo: getCachedPatientInfo(getCachedItem(nextProps.appointment.patientId)),
        visitHistory: getCachedItems(getCachedItem('visitHistory'+nextProps.appointment.patientId))
      });
    }

    async refreshPatientInfo() {
      let patient = await fetchPatient(this.props.appointment.patientId);
      const patientInfo : PatientInfo = await fetchPatientInfo(patient);
      this.setState({patientInfo});
    }

    async refreshVisitHistory() {
      const visitHistory : Visit[] = await fetchVisitHistory(this.props.appointment.patientId);
      this.setState({visitHistory});
    }

    render() {
        return <ScrollView>
            <AppointmentDetails appointment={this.props.appointment} />
            <PatientCard patientInfo={this.state.patientInfo} onNavigationChange={this.props.onNavigationChange} />
            <VisitHistory appointment={this.props.appointment} visitHistory={this.state.visitHistory}
                onNavigationChange={this.props.onNavigationChange} onUpdate={this.props.onUpdate} />
        </ScrollView>
    }
}

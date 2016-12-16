/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Image, View, TouchableHighlight, Text, Button, ScrollView, TouchableOpacity, TextInput, LayoutAnimation } from 'react-native';
import dateFormat from 'dateformat';
import { styles, fontScale } from './Styles';
import { PatientCard } from './Patient';
import type {Patient } from './Patient';
import { FormRow, FormTextInput, FormDateInput } from './Form';
import { VisitHistory } from './Visit';

export type Appointment = {
    id: number,
    type: string,
    scheduledStart: Date,
    scheduledEnd: Date,
    bookingStatus: string,
    location: string,
    patient: Patient,
    patientPresence: string,
    doctor: string
};

export let fetchAppointments = (): Appointment[] => {
    let appointment1: Appointment = {
        id: 1,
        type: 'Complaint after new glasses',
        scheduledStart: new Date(2016, 11, 14, 10, 30),
        scheduledEnd: new Date(2016, 11, 14, 10, 50),
        bookingStatus: 'confirmed',
        location: 'the oval office',
        patient: {
            firstName: 'Siegfried',
            lastName: 'De Bleeckere',
            birthDate: new Date(1979, 12, 29)
        },
        patientPresence: 'Patient will be late',
        doctor: 'Conrad Murray'
    };
    let appointment2: Appointment = {
        id: 2,
        type: 'Take in new patient',
        scheduledStart: new Date(2016, 11, 14, 11, 0),
        scheduledEnd: new Date(2016, 11, 14, 11, 30),
        bookingStatus: 'confirmed',
        location: 'the oval office',
        patient: {
            firstName: 'Samuel',
            lastName: 'De Bleeckere',
            birthDate: new Date(1976, 2, 17)
        },
        patientPresence: 'In waiting room',
        doctor: 'Conrad Murray'
    };
    let appointment3: Appointment = {
        id: 3,
        type: 'Patient complaint',
        scheduledStart: new Date(2016, 11, 14, 11, 30),
        scheduledEnd: new Date(2016, 11, 14, 10, 45),
        bookingStatus: 'confirmed',
        location: 'the oval office',
        patient: {
            firstName: 'Vincent',
            lastName: 'De Bleeckere',
            birthDate: new Date(1974, 2, 21)
        },
        patientPresence: 'Checked in',
        doctor: 'The spin doctor'
    };
    return [appointment1, appointment2, appointment3, appointment3, appointment3, appointment3,];
}

export default class AppointmentSummary extends Component {
    props: {
        appointment: Appointment,
        onPress: () => void
    }
    constructor(props: any) {
        super(props);
    }

    render() {
        return <TouchableOpacity onPress={this.props.onPress}>
            <View style={styles.card}>
                <Text>{this.props.appointment.patient.firstName} {this.props.appointment.patient.lastName}</Text>
                <Text>{dateFormat(this.props.appointment.scheduledStart, 'h:MM')}till {dateFormat(this.props.appointment.scheduledEnd, 'h:MM')}</Text>
                <Text>{this.props.appointment.type}</Text>
                <Text>{this.props.appointment.patientPresence}</Text>
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
                    <Text style={styles.text}>The exam will take place in {this.props.appointment.location}by Doctor {this.props.appointment.doctor}</Text>
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
                <FormTextInput labelWidth={labelWidth} label='Doctor' value={this.props.appointment.doctor} />
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
        onNavigationChange: (action: string, data: any) => void
    }
    constructor(props: any) {
        super(props);
    }

    render() {
        return <ScrollView>
            <AppointmentDetails appointment={this.props.appointment} />
            <PatientCard patient={this.props.appointment.patient} onNavigationChange={this.props.onNavigationChange} />
            <VisitHistory appointment={this.props.appointment}
                onNavigationChange={this.props.onNavigationChange} />
        </ScrollView>
    }
}

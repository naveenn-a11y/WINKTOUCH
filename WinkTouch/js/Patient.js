/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Image, View, TouchableHighlight, Text, Button, TouchableOpacity, ScrollView } from 'react-native';
import dateFormat from 'dateformat';
import { styles, fontScale} from './Styles';
import { strings } from './Strings';
import { FormRow, FormEmailInput, FormTextInput } from './Form';
import { ExamCardSpecifics } from './Exam';

export type Patient = {
    id: number,
    firstName: string,
    lastName: string,
    birthDate?: Date
}


export class PatientCard extends Component {
    props: {
        patient: Patient,
        onNavigationChange: (action: string, data: any) => void
    }

    constructor(props: any) {
        super(props);
    }

    render() {
        return <TouchableOpacity onPress={() => this.props.onNavigationChange('showPatient', this.props.patient)}>
            <View style={styles.card}>
                <View style={styles.formRow}>
                    <View>
                        <Image source={require('./image/bradpitt.png')} style={{
                            width: 120 * fontScale,
                            height: 140 * fontScale,
                            resizeMode: 'contain'
                        }} />
                    </View>
                    <View style={{ flex: 100 }}>
                        <Text style={styles.cardTitle}>{this.props.patient.firstName + ' ' + this.props.patient.lastName}</Text>
                        <View style={styles.formRow}>
                            <View style={{ flex: 40 }}>
                                <Text style={styles.text}>Male age 40</Text>
                                <Text style={styles.text}>Diabetis patient for 4 years</Text>
                                <Text style={styles.text}>Diagnosed crosseyed retard</Text>
                                <Text style={styles.text}>Wears contacts and bifocal glasses</Text>
                            </View>
                            <View style={{ flex: 40 }}>
                                <Text style={styles.text}>Married with children</Text>
                                <Text style={styles.text}>Insured by RAMQ</Text>
                                <Text style={styles.text}>5147978008 Montreal</Text>
                                <Text style={styles.text}>samuel@downloadwink.com</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    }
}

export class PatientTitle extends Component {
    props: {
        patient: Patient
    }
    render() {
        if (!this.props.patient)
            return null;
        return <Text style={styles.screenTitle}>{this.props.patient.firstName} {this.props.patient.lastName}</Text>
    }
}

class PatientMedicalHistory extends Component {
    props: {
        patient: Patient
    }
    render() {
        if (!this.props.patient)
            return null;
        return <View style={styles.tabCard}>
            <Text style={styles.screenTitle}>Medical History</Text>
        </View>
    }
}

class PatientFamilyHistory extends Component {
    props: {
        patient: Patient
    }
    render() {
        if (!this.props.patient)
            return null;
        return <View style={styles.tabCard}>
            <Text style={styles.screenTitle}>Family History</Text>
        </View>
    }
}

class PatientSocialHistory extends Component {
    props: {
        patient: Patient
    }
    render() {
        if (!this.props.patient)
            return null;
        return <View style={styles.tabCard}>
            <Text style={styles.screenTitle}>Social History</Text>
        </View>
    }
}


class PatientHealth extends Component {
    props: {
        patient: Patient
    }
    render() {
        if (!this.props.patient)
            return null;
        return <View style={styles.tabCard}>
            <Text style={styles.screenTitle}>Health</Text>
        </View>
    }
}

export class PatientMedications extends Component {
    props: {
        patient: Patient
    }
    render() {
        if (!this.props.patient)
            return null;
        return <View style={styles.tabCard}>
            <Text style={styles.screenTitle}>Medications</Text>
        </View>
    }
}


export class PatientAllergies extends Component {
    props: {
        patient: Patient
    }
    render() {
        if (!this.props.patient)
            return null;
        return <View style={styles.tabCard}>
            <Text style={styles.screenTitle}>Allergies</Text>
        </View>
    }
}

export class PatientBillingInfo extends Component {
    props: {
        patient: Patient
    }
    render() {
        if (!this.props.patient)
            return null;
        return <View style={styles.tabCard}>
            <Text style={styles.screenTitle}>Insurance and Billing</Text>
        </View>
    }
}


export class PatientContact extends Component {
    props: {
        patient: Patient
    }
    state: {
        isEditable: boolean
    }
    constructor(props: any) {
        super(props);
        this.state = {
            isEditable: false
        }
    }
    cancelEdit() {

    }

    saveEdit() {

    }

    render() {
        if (!this.props.patient)
            return null;
        return <View style={styles.tabCard}>
            <Text style={styles.screenTitle}>Contact</Text>
            <View style={styles.form}>
              <FormRow>
                <FormTextInput label={strings.firstName} value={'John'} />
                <FormTextInput label={strings.lastName} value={'Doe'} />
              </FormRow>
              <FormRow>
                <FormTextInput label={strings.addressLine1} value={'7270 rue Lajeunesse'} />
              </FormRow>
              <FormRow>
                <FormTextInput label={strings.addressLine2} value={''} />
              </FormRow>
              <FormRow>
                <FormTextInput label={strings.addressLine3} value={'Montreal QC H2R 2H4'} />
              </FormRow>
              <FormRow>
                <FormTextInput label={strings.phoneNr} value={''} />
                <FormTextInput label={strings.cellPhoneNr} value={'+15147978008'} />
              </FormRow>
              <FormRow>
                <FormEmailInput label='Email' value={'samuel@downloadwink.com'} />
              </FormRow>
              <View style={styles.buttonsRowLayout}>
                <Button title='Cancel' onPress={() => this.cancelEdit()} />
                <Button title='Update' onPress={() => this.saveEdit()} />
              </View>
            </View>
        </View>
    }
}

export class PatientOcularHistoryCard extends ExamCardSpecifics {
    render() {
        return <Text style={styles.text}>Ocular History</Text>
    }
}
export class PatientMedicalHistoryCard extends ExamCardSpecifics {
    render() {
        return <Text style={styles.text}>Medical History</Text>
    }
}
export class PatientMedicationsCard extends ExamCardSpecifics {
    render() {
        return <Text style={styles.text}>Medications</Text>
    }
}
export class PatientAllergiesCard extends ExamCardSpecifics {
    render() {
        return <Text style={styles.text}>Allergies</Text>
    }
}
export class PatientFamilyHistoryCard extends ExamCardSpecifics {
    render() {
        return <Text style={styles.text}>Family History</Text>
    }
}
export class PatientSocialHistoryCard extends ExamCardSpecifics {
    render() {
        return <Text style={styles.text}>Social History</Text>
    }
}

export class PatientScreen extends Component {
    props: {
        patient: Patient,
        onNavigationChange: (action: string, data: any) => void
    }
    state: {
        patient: Patient
    }

    constructor(props: any) {
        super(props);
        this.state = {
            patient: props.patient
        }
    }

    render() {
        return <ScrollView>
            <PatientTitle patient={this.state.patient} />
            <PatientContact patient={this.state.patient} />
            <PatientBillingInfo patient={this.state.patient} />
            {/**
            <PatientHealth patient={this.state.patient} />
            <PatientOcularHistory patient={this.state.patient} />
            <PatientMedicalHistory patient={this.state.patient} />
            <PatientMedications patient={this.state.patient} />
            <PatientAllergies patient={this.state.patient} />
            <PatientFamilyHistory patient={this.state.patient} />
            <PatientSocialHistory patient={this.state.patient} />
            */}
        </ScrollView>
    }
}

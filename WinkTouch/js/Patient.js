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
import type {Patient, PatientInfo} from './Types';

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
        patientInfo: PatientInfo
    }
    render() {
        if (!this.props.patientInfo)
            return null;
        return <Text style={styles.screenTitle}>{this.props.patientInfo.firstName} {this.props.patientInfo.lastName}</Text>
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
      patientInfo: PatientInfo,
      editable?: boolean
    }
    state: {
      editedPatientInfo: PatientInfo
    }
    static defaultProps = {
      editable: true
    }
    constructor(props: any) {
        super(props);
        this.state = {
          editedPatientInfo: this.props.patientInfo
        }
    }

    componentWillReceiveProps(nextProps: any) {
      this.setState({editedPatientInfo: nextProps.patientInfo});
    }

    update(propertyName: string, value: string) {
      if (!this.props.editable) return;
      if (this.state.editedPatientInfo[propertyName]===value)
        return;
      this.state.editedPatientInfo[propertyName] = value
      this.setState({editedPatientInfo:  this.state.editedPatientInfo});
    }

    cancelEdit() {

    }

    saveEdit() {
      console.log(this.state.editedPatientInfo);
    }

    render() {
        if (!this.props.patientInfo)
            return null;
        return <View style={styles.tabCard}>
            <Text style={styles.screenTitle}>Contact</Text>
            <View style={styles.form}>
              <FormRow>
                <FormTextInput label={strings.firstName} value={this.state.editedPatientInfo.firstName} onChangeText={(text: string) => this.update('firstName', text)}/>
                <FormTextInput label={strings.lastName} value={this.props.patientInfo.lastName} />
              </FormRow>
              <FormRow>
                <FormTextInput label={strings.streetName} value={this.props.patientInfo.streetName} />
                <FormTextInput label={strings.streetNumber} value={this.props.patientInfo.streetNumber} />
              </FormRow>
              <FormRow>
                <FormTextInput label={strings.city} value={this.props.patientInfo.city} />
                <FormTextInput label={strings.postalCode} value={this.props.patientInfo.postalCode} />
              </FormRow>
              <FormRow>
                <FormTextInput label={strings.country} value={this.props.patientInfo.country} />
              </FormRow>
              <FormRow>
                <FormTextInput label={strings.phoneNr} value={this.props.patientInfo.phone} />
                <FormTextInput label={strings.cellPhoneNr} value={this.props.patientInfo.cell} />
              </FormRow>
              <FormRow>
                <FormEmailInput label={strings.email} value={this.props.patientInfo.email} />
              </FormRow>
              {this.props.editable?<View style={styles.buttonsRowLayout}>
                <Button title='Cancel' onPress={() => this.cancelEdit()} />
                <Button title='Update' onPress={() => this.saveEdit()} />
              </View>:null}
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
        patientInfo: Patient
    }

    constructor(props: any) {
        super(props);
        this.state = {
            patientInfo: undefined
        }
    }

    render() {
        return <ScrollView>
            <PatientTitle patientInfo={this.state.patientInfo} />
            <PatientContact patient={this.state.patientInfo} />
            <PatientBillingInfo patient={this.state.patientInfo} />
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

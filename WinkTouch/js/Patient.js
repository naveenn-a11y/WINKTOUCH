/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Image, View, TouchableHighlight, Text, Button, TouchableOpacity, ScrollView, LayoutAnimation} from 'react-native';
import dateFormat from 'dateformat';
import { styles, fontScale} from './Styles';
import { strings } from './Strings';
import { FormRow, FormEmailInput, FormTextInput } from './Form';
import { ExamCardSpecifics } from './Exam';
import type {Patient, PatientInfo} from './Types';
import { fetchPatientInfo, storePatientInfo} from './FindPatient';

export class PatientCard extends Component {
    props: {
        patientInfo?: PatientInfo,
        onNavigationChange: (action: string, data: any) => void
    }

    constructor(props: any) {
        super(props);
    }

    render() {
        if (!this.props.patientInfo) return null;
        return <TouchableOpacity onPress={() => this.props.onNavigationChange('showPatient', this.props.patientInfo)}>
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
                        <Text style={styles.cardTitle}>{this.props.patientInfo.firstName + ' ' + this.props.patientInfo.lastName}</Text>
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
      editable?: boolean,
      onUpdatePatientInfo?: (patientInfo: PatientInfo) => void
    }
    state: {
      editedPatientInfo: PatientInfo
    }
    static defaultProps = {
      editable: true
    }
    constructor(props: any) {
        super(props);
        const editedPatientInfo: PatientInfo = JSON.parse(JSON.stringify(this.props.patientInfo));
        this.state = {editedPatientInfo: editedPatientInfo};
    }

    componentWillReceiveProps(nextProps: any) {
      this.setState({editedPatientInfo: JSON.parse(JSON.stringify(nextProps.patientInfo))});
    }

    update(propertyName: string, value: string) {
      if (!this.props.editable) return;
      if (this.state.editedPatientInfo[propertyName]===value)
        return;
      this.state.editedPatientInfo[propertyName] = value
      this.setState({editedPatientInfo:  this.state.editedPatientInfo});
    }

    cancelEdit() {
      const editedPatientInfo: PatientInfo = JSON.parse(JSON.stringify(this.props.patientInfo));
      LayoutAnimation.easeInEaseOut();
      this.setState({editedPatientInfo: editedPatientInfo});
    }

    saveEdit() {
      storePatientInfo(this.state.editedPatientInfo);
      if (this.props.onUpdatePatientInfo)
        this.props.onUpdatePatientInfo(this.state.editedPatientInfo);
    }

    render() {
        return <View style={styles.tabCard}>
            <Text style={styles.screenTitle}>Contact</Text>
            <View style={styles.form}>
              <FormRow>
                <FormTextInput label={strings.firstName} value={this.state.editedPatientInfo.firstName} onChangeText={(text: string) => this.update('firstName', text)}/>
                <FormTextInput label={strings.lastName} value={this.state.editedPatientInfo.lastName} onChangeText={(text: string) => this.update('lastName', text)} />
              </FormRow>
              <FormRow>
                <FormTextInput label={strings.streetName} value={this.state.editedPatientInfo.streetName} onChangeText={(text: string) => this.update('streetName', text)} />
                <FormTextInput label={strings.streetNumber} value={this.state.editedPatientInfo.streetNumber} onChangeText={(text: string) => this.update('streetNumber', text)} />
              </FormRow>
              <FormRow>
                <FormTextInput label={strings.city} value={this.state.editedPatientInfo.city} onChangeText={(text: string) => this.update('city', text)} />
                <FormTextInput label={strings.postalCode} value={this.state.editedPatientInfo.postalCode} onChangeText={(text: string) => this.update('postalCode', text)} />
              </FormRow>
              <FormRow>
                <FormTextInput label={strings.country} value={this.state.editedPatientInfo.country} onChangeText={(text: string) => this.update('country', text)} />
              </FormRow>
              <FormRow>
                <FormTextInput label={strings.phoneNr} value={this.state.editedPatientInfo.phone} onChangeText={(text: string) => this.update('phone', text)} />
                <FormTextInput label={strings.cellPhoneNr} value={this.state.editedPatientInfo.cell} onChangeText={(text: string) => this.update('cell', text)} />
              </FormRow>
              <FormRow>
                <FormEmailInput label={strings.email} value={this.state.editedPatientInfo.email} onChangeText={(text: string) => this.update('email', text)} />
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
        patientInfo: PatientInfo,
        onNavigationChange: (action: string, data: any) => void
    }

    render() {
        return <ScrollView>
            <PatientTitle patientInfo={this.props.patientInfo} />
            <PatientContact patientInfo={this.props.patientInfo} />
            <PatientBillingInfo patient={this.props.patientInfo} />
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

/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Image, View, TouchableHighlight, Text, Button, ScrollView, TextInput, Modal, LayoutAnimation } from 'react-native';
import { styles, fontScale } from './Styles';
import type {Patient } from './Patient';
import { PatientTitle, PatientBillingInfo, PatientContact, PatientCard } from './Patient';
import { AppointmentsSummary, fetchAppointments } from './Appointment';
import type {Appointment } from './Appointment';
import { PrescriptionCard } from './Assessment';

class PatientList extends Component {
  props: {
    isVisible: boolean,
    isPopup: boolean,
    patients: Patient[],
    onSelect: (patient: Patient) => void,
    onDismiss?: () => void,
    onNewPatient?: () => void
  }
  constructor(props: any) {
    super(props);
  }

  render() {
    if (!this.props.isVisible)
      return null;
    return <View>
        {this.props.patients.map((patient: Patient, index: number) => {
          return <Button key={index} title={patient.firstName+' '+patient.lastName}  onPress={() => this.props.onSelect(patient)} />
        })}
    </View >;
  }
}

export class FindPatient extends Component {
  props: {
    popupResults?: boolean,
    onSelectPatient: (patient: Patient) => void,
    onNewPatient?: (searchCirterium: string) => void,
  }
  state: {
    searchCriterium: string,
    patients: Patient[],
    showPatientList: boolean
  }
  constructor(props: any) {
    super(props);
    this.state = {
      searchCriterium: '',
      patients: [],
      showPatientList: false
    }
  }

  async searchPatient() {
    try {
      let response = await fetch('https://dev1.downloadwink.com/Wink/Patient/list?accountsId=2&searchData='+this.state.searchCriterium, {
          method: 'get',
      });
      let json = await response.json();
      LayoutAnimation.easeInEaseOut();
      this.setState({
        showPatientList: true,
        patients: json.response});
    } catch (error) {
      console.error(error);
    }
  }

  selectPatient(patient: Patient) {
    LayoutAnimation.easeInEaseOut();
    if (this.props.popupResults)
      this.setState({ showPatientList: false });
    this.props.onSelectPatient(patient);
  }

  newPatient() {
    this.setState({ showPatientList: false });
    this.props.onNewPatient && this.props.onNewPatient(this.state.searchCriterium);
  }

  cancelSearch() {
    this.setState({ showPatientList: false });
  }

  render() {
    return <View style={styles.tabCard}>
      <TextInput placeholder='Find patient' returnKeyType='search' autoCorrect={false}
        style={styles.textfieldLeft} value={this.state.searchCriterium}
        onChangeText={(text: string) => this.setState({ searchCriterium: text })}
        onSubmitEditing={() => this.searchPatient()} />
      <PatientList isPopup={this.props.popupResults}
        patients={this.state.patients}
        isVisible={this.state.showPatientList}
        onDismiss={() => this.cancelSearch()}
        onNewPatient={() => this.newPatient()}
        onSelect={(patient: Patient) => this.selectPatient(patient)} />
    </View>
  }
}

export class FindPatientScreen extends Component {
  props: {
    onNavigationChange: (action: string, data: any) => void
  }
  state: {
    patient: Patient
  }
  constructor(props: any) {
    super(props);
    this.state = {
      patient: null
    }
  }

  selectPatient(patient: Patient) {
    this.setState({ patient });
  }

  render() {
    return <ScrollView>
      <FindPatient popupResults={false}
        onSelectPatient={(patient: Patient) => this.selectPatient(patient)} />
      <PatientTitle patient={this.state.patient} />
      <PatientContact patient={this.state.patient} />
      <PatientBillingInfo patient={this.state.patient} />
      <PrescriptionCard patient={this.state.patient} />
    </ScrollView>
  }
}

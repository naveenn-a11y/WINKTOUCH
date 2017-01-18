/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Image, View, TouchableHighlight, Text, Button, ScrollView, TextInput, Modal, LayoutAnimation } from 'react-native';
import { styles, fontScale } from './Styles';
import type {Patient, PatientInfo, RestResponse } from './Types';
import { PatientTitle, PatientBillingInfo, PatientContact, PatientCard } from './Patient';
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

export async function searchPatients(searchText: string) : Patient[] {
  try {
    let response = await fetch('https://dev1.downloadwink.com/Wink/Patient/list?accountsId=2&searchData='+searchText, {
        method: 'get',
    });
    let json = await response.json();
    const patients : Patient[] = json.response;
    return patients;
  } catch (error) {
    console.log(error);
    alert('Something went wrong trying to get the patient list from the server. You can try again.');
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

  async searchPatients() {
      const patients : Patient[] = await searchPatients(this.state.searchCriterium);
      LayoutAnimation.easeInEaseOut();
      this.setState({
        showPatientList: (patients && patients.length>0),
        patients
      });
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
        onSubmitEditing={() => this.searchPatients()} />
      <PatientList isPopup={this.props.popupResults}
        patients={this.state.patients}
        isVisible={this.state.showPatientList}
        onDismiss={() => this.cancelSearch()}
        onNewPatient={() => this.newPatient()}
        onSelect={(patient: Patient) => this.selectPatient(patient)} />
    </View>
  }
}

export async function fetchPatientInfo(patientId: number) : PatientInfo {
  try {
    let response = await fetch('https://dev1.downloadwink.com/Wink/Patient/?accountsId=2&patientId='+patientId, {
        method: 'get',
    });
    const restResponse : RestResponse = await response.json();
    const patientInfo: PatientInfo = restResponse.response[0];
    return patientInfo;
  } catch (error) {
    console.log(error);
    alert('Something went wrong trying to get the patient information from the server. Please try again.');
    //TODO: signal error to the waiting thread so it can clean up ?
  }
}

export class FindPatientScreen extends Component {
  props: {
    onNavigationChange: (action: string, data: any) => void
  }
  state: {
    patientInfo?: PatientInfo
  }
  constructor(props: any) {
    super(props);
    this.state = {
      patientInfo: undefined
    }
  }

  async selectPatient(patient: Patient) {
    const patientInfo : PatientInfo = await fetchPatientInfo(patient.id);
    LayoutAnimation.easeInEaseOut();
    this.setState({
      patientInfo: patientInfo
    });
  }

  render() {
    return <ScrollView>
      <FindPatient popupResults={false}
        onSelectPatient={(patient: Patient) => this.selectPatient(patient)} />
      <PatientContact patientInfo={this.state.patientInfo} />
      <PatientBillingInfo patient={this.state.patientInfo} />
      <PrescriptionCard patient={this.state.patientInfo} editable={false}/>
    </ScrollView>
  }
}

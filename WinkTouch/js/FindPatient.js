/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Image, View, TouchableHighlight, Text, Button, ScrollView, TextInput, Modal, LayoutAnimation } from 'react-native';
import { styles, fontScale } from './Styles';
import { strings } from './Strings';
import type {Patient, PatientInfo, RestResponse } from './Types';
import { PatientTitle, PatientBillingInfo, PatientContact, PatientCard } from './Patient';
import { PrescriptionCard } from './Assessment';
import { WinkButton } from './Widgets';

export async function searchPatients(accountsId: number, searchText: string) : Patient[] {
  try {
    let response = await fetch('https://dev1.downloadwink.com/Wink/Patient/list?accountsId='+accountsId+'&searchData='+searchText, {
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

export async function fetchPatientInfo(patient: Patient) : PatientInfo {
  if (!patient) return undefined;
  try {
    let response = await fetch('https://dev1.downloadwink.com/Wink/Patient/?accountsId=2&patientId='+patient.patientId, {
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

export async function storePatientInfo(patientInfo: PatientInfo) : PatientInfo {
  if (!patientInfo) return undefined;
  try {
    console.log(JSON.stringify(patientInfo));
    let response = await fetch('https://dev1.downloadwink.com/Wink/Patient/', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientInfo)
    });
    //const restResponse : RestResponse = await response.json();
    return patientInfo;
  } catch (error) {
    console.log(error);
    alert('Something went wrong trying to store the patient information on the server. Please try again.');
    //TODO: signal error to the waiting thread so it can clean up ?
  }
}

export async function createPatient() : PatientInfo {
  return  {
      "dateOfBirth": "",
      "lastName": "",
      "phone": "",
      "cell": "",
      "streetName": "",
      "city": "",
      "country": "",
      "id": 2,
      "medicalCard": "",
      "medicalCardExp": "",
      "postalCode": "",
      "email": "",
      "province": "",
      "gender": 0,
      "streetNumber": "",
      "firstName": ""
    }
}

class PatientList extends Component {
  props: {
    visible: boolean,
    patients: Patient[],
    onSelect: (patient: Patient) => void
  }

  render() {
    if (!this.props.visible)
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
    onSelectPatient: (patient: Patient) => void,
    onNewPatient: () => void
  }
  state: {
    searchCriterium: string,
    patients: Patient[],
    showPatientList: boolean,
    showNewPatientButton: boolean,
  }
  constructor(props: any) {
    super(props);
    this.state = {
      searchCriterium: '',
      patients: [],
      showPatientList: false,
      showNewPatientButton: false
    }
  }

  async searchPatients() {
      this.setState({showPatientList: false, patients: []});
      const patients : Patient[] = await searchPatients(2, this.state.searchCriterium);
      this.setState({
        showPatientList: (patients && patients.length>0),
        showNewPatientButton: true,
        patients
      });
      LayoutAnimation.spring();
  }

  newPatient() {
    this.setState({ showPatientList: false, showNewPatientButton:false, patients: []});
    this.props.onNewPatient();
    LayoutAnimation.easeInEaseOut();
  }

  render() {
    return <View style={styles.tabCard}>
      <TextInput placeholder='Find patient' returnKeyType='search' autoCorrect={false}
        style={styles.textfieldLeft} value={this.state.searchCriterium}
        onChangeText={(text: string) => this.setState({ searchCriterium: text })}
        onSubmitEditing={() => this.searchPatients()} />
      <PatientList
        patients={this.state.patients}
        visible={this.state.showPatientList}
        onSelect={this.props.onSelectPatient} />
      <WinkButton title={strings.newPatient} visible={this.state.showNewPatientButton} onPress={() => this.newPatient()}/>
    </View>
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
    const patientInfo : PatientInfo = await fetchPatientInfo(patient);
    this.setState({
      patientInfo: patientInfo
    });
  }

  update(propertyName: string, value: any) : void {
    this.setState({[propertyName]: value});
  }

  newPatient() {
    let patientInfo : PatientInfo = createPatient();
    this.setState({
      patientInfo: patientInfo
    });
  }

  render() {
    return <ScrollView>
      <FindPatient onSelectPatient={(patient: Patient) => this.selectPatient(patient)} onNewPatient={()=>this.newPatient()} />
      {this.state.patientInfo?<View>
        <PatientContact patientInfo={this.state.patientInfo} onUpdatePatientInfo={(patientInfo: PatientInfo) => this.update('patientInfo', patientInfo)}/>
        <PatientBillingInfo patient={this.state.patientInfo} />
        <PrescriptionCard patient={this.state.patientInfo} editable={false}/>
      </View>:null}
    </ScrollView>
  }
}

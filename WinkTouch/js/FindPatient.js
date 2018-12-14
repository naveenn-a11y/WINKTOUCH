/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Image, View, TouchableHighlight, Text, ScrollView, TextInput, Modal, LayoutAnimation, InteractionManager} from 'react-native';
import type {Patient, PatientInfo, Appointment, Visit} from './Types';
import { styles, fontScale } from './Styles';
import { strings } from './Strings';
import { Button } from './Widgets';
import { PatientTitle, PatientBillingInfo, PatientContact, PatientCard, fetchPatientInfo } from './Patient';
import { PrescriptionCard } from './Assessment';
import { searchItems } from './Rest';
import { cacheItemsById } from './DataCache';
import { fetchAppointments, AppointmentSummary, rescheduleAppointment } from './Appointment';
import { hourDifference, parseDate, now } from './Util';
import { getVisitHistory } from './Visit';

const maxPatientListSize : number = 40;

export async function searchPatients(searchText: string) : Patient[] {
    const searchCriteria = {
      searchData: searchText
    };
    let restResponse = await searchItems('Patient/list', searchCriteria);
    let patients: Patient[] = restResponse.patientList;
    if (patients && patients.length>40) patients=patients.slice(0, maxPatientListSize);
    return patients;
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
    return <View style={styles.flow}>
        {this.props.patients.map((patient: Patient, index: number) => {
          return <View style={styles.centeredRowLayout} key={index}><Button title={patient.firstName+' '+patient.lastName}  onPress={() => this.props.onSelect(patient)} /></View>
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
      this.props.onSelectPatient(undefined);
      this.setState({showPatientList: false, patients: []});
      const patients : Patient[] = await searchPatients(this.state.searchCriterium);
      this.setState({
        showPatientList: patients!=undefined && patients.length>0,
        showNewPatientButton: patients===undefined || patients.length<maxPatientListSize,
        patients
      });
      LayoutAnimation.spring();
  }

  newPatient() {
    this.setState({ showPatientList: false, showNewPatientButton:false, patients: []});
    this.props.onNewPatient();
    InteractionManager.runAfterInteractions(() => LayoutAnimation.easeInEaseOut());
  }

  render() {
    return <View style={styles.tabCard}>
      <TextInput placeholder='Find patient' returnKeyType='search' autoCorrect={false} autoFocus={true}
        style={styles.searchField} value={this.state.searchCriterium}
        onChangeText={(text: string) => this.setState({ searchCriterium: text })}
        onSubmitEditing={() => this.searchPatients()} />
      <PatientList
        patients={this.state.patients}
        visible={this.state.showPatientList}
        onSelect={this.props.onSelectPatient} />
      {this.state.showNewPatientButton?<View style={styles.centeredRowLayout}><Button title={strings.newPatient} visible={this.state.showNewPatientButton} onPress={() => this.newPatient()}/></View>:null}
    </View>
  }
}

function getLastPrescriptionVisit(patientId: string) : ?Visit {
  if (patientId===undefined) return undefined;
  const visitHistory : ?Visit[] = getVisitHistory(patientId);
  if (!visitHistory) return undefined;
  const lastPrescriptionVisit :?Visit = visitHistory.find((visit: Visit) => visit.prescription!==undefined);
  return lastPrescriptionVisit;
}


export class FindPatientScreen extends Component {
  props: {
    navigation: any,
  }
  params: {
    showBilling?: boolean,
    showAppointments?: boolean,
    nextNavigation?: {action: string, params: any}
  }
  state: {
    patientInfo?: PatientInfo,
    appointments?: Appointment[],
    lastPrescriptionVisit?: Visit
  }

  constructor(props: any) {
    super(props);
    this.params = this.props.navigation.state.params;
    this.state = {
      patientInfo: undefined,
      appointments: undefined,
      lastPrescriptionVisit: undefined
    }
  }

  componentWillReceiveProps(nextProps: any) {
    this.params = nextProps.navigation.state.params;
  }


  async selectPatient(patient: Patient) {
    const patientInfo : ?PatientInfo = patient?await fetchPatientInfo(patient.id):undefined;
    const lastPrescriptionVisit :?Visit = patient && getLastPrescriptionVisit(patient.id);
    if (this.params.showAppointments && patient && patient.id) {
      let appointments = await fetchAppointments(undefined, undefined, 100, patient.id);
      this.setState({patientInfo, appointments, lastPrescriptionVisit}, this.refreshPatientVisits);
    } else {
      this.setState({patientInfo, lastPrescriptionVisit}, this.refreshPatientVisits);
    }
  }

  async refreshPatientVisits() {
    if (!this.state.patientInfo) return;

  }

  updatePatientInfo = (patientInfo: PatientInfo) : void => {
    this.setState({patientInfo});
  }

  createPatient() {
    alert('Create patient not yet implemented.');
  }

  newPatient() {
    let patientInfo : ?PatientInfo = this.createPatient();
    this.setState({
      patientInfo: patientInfo
    });
  }

  async startVisit(appointment?: Appointment) {
    if (appointment) {
      if (Math.abs(hourDifference(parseDate(appointment.start), now()))>1)
        appointment = await rescheduleAppointment(appointment);
    } else {
      appointment = {id: undefined, patientId: this.state.patientInfo.id, title: this.params.nextNavigation.title};
    }
    this.props.navigation.navigate("appointment", {appointment});
  }

  renderAppointments() {
    if (!this.params.showAppointments || !this.state.appointments || this.state.appointments.length===0)
      return null;
    return <View style={styles.centeredColumnLayout}>
      <Text style={styles.instructionText}>{strings.existingAppointmentWarning}</Text>
      <View style={styles.topFlow}>
        {this.state.appointments.map((appointment: Appointment, index: number) => <AppointmentSummary key={index} appointment={appointment} onPress={() => this.startVisit(appointment)}/>)}
      </View>
    </View>
  }

  renderNextAction() {
    if (!this.params.nextNavigation) return null;
    return <View style={styles.tabCard}>
        {this.renderAppointments()}
        <View style={styles.centeredRowLayout}><Button title={strings.startNewVisit} onPress={() => this.startVisit()} /></View>
    </View>
  }

  render() {
    return <ScrollView>
      <FindPatient onSelectPatient={(patient: Patient) => this.selectPatient(patient)} onNewPatient={()=>this.newPatient()} />
      {this.state.patientInfo && <View>
        <PatientContact patientInfo={this.state.patientInfo} onUpdatePatientInfo={this.updatePatientInfo}/>
        {this.params.showBilling && <PatientBillingInfo patient={this.state.patientInfo} />}
        <PrescriptionCard visit={this.state.lastPrescriptionVisit} editable={false}/>
        {this.renderNextAction()}
      </View>}
    </ScrollView>
  }
}

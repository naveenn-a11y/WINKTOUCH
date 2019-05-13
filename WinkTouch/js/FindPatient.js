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
import { cacheItemsById, getCachedItem } from './DataCache';
import { fetchAppointments, AppointmentSummary, rescheduleAppointment } from './Appointment';
import { hourDifference, parseDate, now } from './Util';
import { VisitHistoryCard, fetchVisitHistory, VisitHistory } from './Visit';
import { PatientMedicationCard } from './Medication';
import { PatientRefractionCard } from './Refraction';

const maxPatientListSize : number = 40;

export async function searchPatients(searchText: string) : Patient[] {
    const searchCriteria = {
      searchData: searchText
    };
    let restResponse = await searchItems('Patient/list', searchCriteria);
    let patients: Patient[] = restResponse.patientList;
    if (patients && patients.length>40) patients=patients.slice(0, maxPatientListSize);
    cacheItemsById(patients);
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
      LayoutAnimation.spring();
      this.setState({
        showPatientList: patients!=undefined && patients.length>0,
        showNewPatientButton: patients===undefined || patients.length<maxPatientListSize,
        patients
      });
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
      {__DEV__ && this.state.onNewPatient && this.state.showNewPatientButton?<View style={styles.centeredRowLayout}><Button title={strings.newPatient} visible={this.state.showNewPatientButton} onPress={() => this.newPatient()}/></View>:null}
    </View>
  }
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
    patientInfo: ?PatientInfo,
    appointments: ?Appointment[],
    visitHistory: ?string[],
    patientDocumentHistory: ?string[]
  }

  constructor(props: any) {
    super(props);
    this.params = this.props.navigation.state.params;
    this.state = {
      patientInfo: undefined,
      appointments: undefined,
      visitHistory: undefined,
      patientDocumentHistory: undefined,
    }
  }

  componentWillReceiveProps(nextProps: any) {
    this.params = nextProps.navigation.state.params;
  }

  async showVisitHistory(patientId: string) : void {
    let visitHistory : ?string[] = getCachedItem('visitHistory-'+patientId);
    if (!visitHistory) {
      visitHistory = await fetchVisitHistory(patientId);
    }
    if (this.state.patientInfo===undefined || patientId!==this.state.patientInfo.id) {
      return;
    }
    LayoutAnimation.easeInEaseOut();
    const patientDocumentHistory : ?string[] = getCachedItem('patientDocumentHistory-'+patientId);
    this.setState({visitHistory, patientDocumentHistory});
    if (this.params.showAppointments) {
      let appointments : ?Appointment[] = await fetchAppointments(undefined, undefined, 1, patientId);
      if (this.state.patientInfo===undefined || patientId!==this.state.patientInfo.id)
        return;
      LayoutAnimation.easeInEaseOut();
      this.setState({appointments});
    }
  }

  async selectPatient(patient: Patient) {
    if (!patient) {
      if (!this.state.patientInfo) return;
      LayoutAnimation.easeInEaseOut();
      this.setState({patientInfo: undefined, appointments: undefined, visitHistory: undefined, patientDocumentHistory: undefined});
      return;
    }
    let patientInfo : ?PatientInfo = getCachedItem(patient.id);
    LayoutAnimation.easeInEaseOut();
    this.setState({patientInfo, appointments: undefined, visitHistory: undefined, patientDocumentHistory: undefined});
    patientInfo = await fetchPatientInfo(patient.id);
    if (this.state.patientInfo===undefined || patient.id!==this.state.patientInfo.id)
      return;
    this.setState({patientInfo}, () => this.showVisitHistory(patient.id));
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
    return <View>
        {this.renderAppointments()}
        <View style={styles.centeredRowLayout}><Button title={strings.startNewVisit} onPress={() => this.startVisit()} /></View>
    </View>
  }

  render() {
    return <ScrollView keyboardShouldPersistTaps="handled">
      <FindPatient onSelectPatient={(patient: Patient) => this.selectPatient(patient)} onNewPatient={()=>this.newPatient()} />
      {this.state.patientInfo && <View style={styles.separator}>
        <PatientCard patientInfo={this.state.patientInfo} navigation={this.props.navigation} style={styles.tabCardS}/>
        {this.renderNextAction()}
        <VisitHistory patientInfo={this.state.patientInfo} visitHistory={this.state.visitHistory} patientDocumentHistory={this.state.patientDocumentHistory}
                      readonly={true} navigation={this.props.navigation} />
      </View>}
    </ScrollView>
  }
}

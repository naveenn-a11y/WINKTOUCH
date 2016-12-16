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
import { Prescription } from './Assessment';

class PatientList extends Component {
  props: {
    isVisible: boolean,
    isPopup: boolean,
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
    const patientList = <View>
      <Button title='Sarah De Bleeckere' onPress={() => this.props.onSelect({ firstName: 'Sarah', lastName: 'De Bleeckere' })} />
      <Button title='Vincent De Bleeckere' onPress={() => this.props.onSelect({ firstName: 'Vincent', lastName: 'De Bleeckere' })} />
      <Button title='Samuel De Bleeckere' onPress={() => this.props.onSelect({ firstName: 'Samuel', lastName: 'De Bleeckere' })} />
      <Button title='Siegfried De Bleeckere' onPress={() => this.props.onSelect({ firstName: 'Siegfried', lastName: 'De Bleeckere' })} />
      <Button title='Dorothea De Bleeckere' onPress={() => this.props.onSelect({ firstName: 'Dorothea', lastName: 'De Bleeckere' })} />
    </View >;
    if (this.props.isPopup) {
      return <Modal visible={this.props.isVisible} transparent={true} animationType={'slide'} onRequestClose={() => { console.log('TODO: onRequestClose patient list popup') } }>
        <View style={styles.centeredRowLayout}>
          <View style={styles.centeredColumnLayout}>
            <View style={styles.popup}>
              {patientList}
              <View style={styles.buttonsRowLayout}>
                <Button title='Cancel' onPress={() => this.props.onDismiss()} />
                <Button title='New Patient' onPress={() => this.props.onNewPatient()} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    }
    return patientList;
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
    showPatientList: boolean
  }
  constructor(props: any) {
    super(props);
    this.state = {
      searchCriterium: '',
      showPatientList: false
    }
  }

  searchPatient() {
    LayoutAnimation.easeInEaseOut();
    this.setState({ showPatientList: true });
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
      <Text>Recent and probably interested patient list:</Text>
      <PatientList isPopup={false} isVisible={true}
        onSelect={(patient: Patient) => this.selectPatient(patient)} />
      <PatientList isPopup={this.props.popupResults} isVisible={this.state.showPatientList}
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
      <Prescription patient={this.state.patient} />
    </ScrollView>
  }
}

/**
 * @flow
 */
'use strict';

import React, {Component} from 'react';
import {
  Image,
  View,
  TouchableHighlight,
  Text,
  ScrollView,
  TextInput,
  Modal,
  LayoutAnimation,
  InteractionManager,
  Platform,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import type {Patient, PatientInfo, Appointment, Visit, Store} from './Types';
import {styles, fontScale} from './Styles';
import {strings} from './Strings';
import {Button} from './Widgets';
import {
  PatientTitle,
  PatientBillingInfo,
  PatientContact,
  PatientCard,
  fetchPatientInfo,
  storePatientInfo,
} from './Patient';
import {PrescriptionCard} from './Assessment';
import {searchItems} from './Rest';
import {cacheItemsById, getCachedItem} from './DataCache';
import {hourDifference, parseDate, now} from './Util';
import {VisitHistoryCard, fetchVisitHistory, VisitHistory} from './Visit';
import {PatientRefractionCard} from './Refraction';
import {getFieldDefinitions} from './Items';
import {getStore} from './DoctorApp';
const isWeb = Platform.OS === 'web';
const maxPatientListSize: number = 50;

export async function searchPatients(searchText: string): Patient[] {
  if (!searchText || searchText.trim().length === 0) {
    return [];
  }
  const searchCriteria = {
    searchData: searchText,
  };
  let restResponse = await searchItems('Patient/list', searchCriteria);
  let patients: Patient[] = restResponse.patientList;
  if (patients && patients.length > maxPatientListSize)
    patients = patients.slice(0, maxPatientListSize);
  cacheItemsById(patients);
  return patients;
}

class PatientList extends Component {
  props: {
    visible: boolean,
    patients: Patient[],
    onSelect: (patient: Patient) => void,
  };

  render() {
    if (!this.props.visible) return null;
    return (
      <View style={styles.flow}>
        {this.props.patients.map((patient: Patient, index: number) => {
          return (
            <View style={styles.centeredRowLayout} key={index}>
              <Button
                title={patient.firstName + ' ' + patient.lastName}
                onPress={() => this.props.onSelect(patient)}
                testID={'patientName' + (index + 1) + 'Button'}
              />
            </View>
          );
        })}
      </View>
    );
  }
}

export class FindPatient extends Component {
  props: {
    onSelectPatient: (patient: Patient) => void,
    onNewPatient: () => void,
  };
  state: {
    searchCriterium: string,
    patients: Patient[],
    showPatientList: boolean,
    showNewPatientButton: boolean,
  };
  constructor(props: any) {
    super(props);
    this.state = {
      searchCriterium: '',
      patients: [],
      showPatientList: false,
      showNewPatientButton: false,
    };
  }

  async searchPatients() {
    this.props.onSelectPatient(undefined);
    this.setState({showPatientList: false, patients: []});
    if (
      !this.state.searchCriterium ||
      this.state.searchCriterium.trim().length === 0
    ) {
      alert(strings.searchCriteriumMissingError);
      return;
    }
    const patients: Patient[] = await searchPatients(
      this.state.searchCriterium,
    );
    if (!patients || patients.length === 0) {
      if (!this.props.onNewPatient) {
        alert(strings.noPatientsFound);
        return;
      }
    }
    !isWeb && LayoutAnimation.spring();
    this.setState({
      showPatientList: patients != undefined && patients.length > 0,
      showNewPatientButton:
        patients === undefined || patients.length < maxPatientListSize,
      patients,
    });
  }

  newPatient() {
    this.setState({
      showPatientList: false,
      showNewPatientButton: false,
      patients: [],
    });
    this.props.onNewPatient();
    !isWeb &&
      InteractionManager.runAfterInteractions(() =>
        LayoutAnimation.easeInEaseOut(),
      );
  }

  render() {
    return (
      <View style={styles.tabCard}>
        <TextInput
          placeholder={strings.findPatient}
          returnKeyType="search"
          autoCorrect={false}
          autoFocus={true}
          style={styles.searchField}
          value={this.state.searchCriterium}
          onChangeText={(text: string) =>
            this.setState({searchCriterium: text})
          }
          onSubmitEditing={() => this.searchPatients()}
          testID="patientSearchCriterium"
        />
        <PatientList
          patients={this.state.patients}
          visible={this.state.showPatientList}
          onSelect={this.props.onSelectPatient}
        />
        {this.props.onNewPatient && this.state.showNewPatientButton ? (
          <View style={styles.centeredRowLayout}>
            <Button
              title={strings.newPatient}
              visible={this.state.showNewPatientButton}
              onPress={() => this.newPatient()}
              testID="newPatientButton"
            />
          </View>
        ) : null}
      </View>
    );
  }
}

export class FindPatientScreen extends Component {
  props: {
    navigation: any,
  };
  state: {
    patientInfo: ?PatientInfo,
    visitHistory: ?(string[]),
    patientDocumentHistory: ?(string[]),
  };

  constructor(props: any) {
    super(props);
    this.state = {
      patientInfo: undefined,
      visitHistory: undefined,
      patientDocumentHistory: undefined,
    };
  }

  async showVisitHistory(patientId: string): void {
    let visitHistory: ?(string[]) = getCachedItem('visitHistory-' + patientId);
    if (!visitHistory) {
      visitHistory = await fetchVisitHistory(patientId);
    }
    if (
      this.state.patientInfo === undefined ||
      patientId !== this.state.patientInfo.id
    ) {
      return;
    }
    !isWeb && LayoutAnimation.easeInEaseOut();
    const patientDocumentHistory: ?(string[]) = getCachedItem(
      'patientDocumentHistory-' + patientId,
    );
    this.setState({visitHistory, patientDocumentHistory});
  }

  async selectPatient(patient: Patient) {
    if (!patient) {
      if (!this.state.patientInfo) return;
      !isWeb && LayoutAnimation.easeInEaseOut();
      this.setState({
        patientInfo: undefined,
        visitHistory: undefined,
        patientDocumentHistory: undefined,
        isNewPatient: false,
      });
      return;
    }
    let patientInfo: ?PatientInfo = getCachedItem(patient.id);
    !isWeb && LayoutAnimation.easeInEaseOut();
    this.setState({
      patientInfo,
      visitHistory: undefined,
      patientDocumentHistory: undefined,
      isNewPatient: false,
    });
    patientInfo = await fetchPatientInfo(patient.id);
    if (
      this.state.patientInfo === undefined ||
      patient.id !== this.state.patientInfo.id
    )
      return;
    this.setState({patientInfo, isNewPatient: false}, () =>
      this.showVisitHistory(patient.id),
    );
  }

  render() {
    return (
      <KeyboardAwareScrollView
        scrollEnable={true}
        keyboardShouldPersistTaps="handled">
        <FindPatient
          onSelectPatient={(patient: Patient) => this.selectPatient(patient)}
        />
        {this.state.patientInfo && (
          <View style={styles.separator}>
            <PatientCard
              patientInfo={this.state.patientInfo}
              navigation={this.props.navigation}
              style={styles.tabCardS}
            />
            <VisitHistory
              patientInfo={this.state.patientInfo}
              visitHistory={this.state.visitHistory}
              patientDocumentHistory={this.state.patientDocumentHistory}
              readonly={true}
              navigation={this.props.navigation}
            />
          </View>
        )}
      </KeyboardAwareScrollView>
    );
  }
}

/**
 * @flow
 */
'use strict';

import React, { Component ,PureComponent} from 'react';
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
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import type { Patient, PatientInfo, Appointment, Visit, Store, User } from './Types';
import { styles, fontScale, isWeb } from './Styles';
import { strings, getUserLanguage } from './Strings';
import { Button, SelectionListRow } from './Widgets';
import {
  PatientTitle,
  PatientBillingInfo,
  PatientContact,
  PatientCard,
  fetchPatientInfo,
  storePatientInfo,
} from './Patient';
import { PrescriptionCard } from './Assessment';
import { searchItems, fetchItemById, storeItem } from './Rest';
import { cacheItemsById, getCachedItem, cacheItemById } from './DataCache';
import { hourDifference, now } from './Util';
import { VisitHistoryCard, fetchVisitHistory, VisitHistory } from './Visit';
import { PatientRefractionCard } from './Refraction';
import { getFieldDefinitions } from './Items';
import { getStore, getAccount } from './DoctorApp';
import { FormRow, FormField, ErrorCard } from './Form';
import { Close } from './Favorites';
import { fetchCodeDefinitions } from './Codes';
import { UserDetails, UserList } from './User';


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
  if (patients && patients.length > maxPatientListSize) {
    patients = patients.slice(0, maxPatientListSize);
  }
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
    if (!this.props.visible) {
      return null;
    }
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
export type FindUserProps = {
  selectedUserId?: ?string,
  onSelectUser?: (user: ?User) => void,
  onNewUser?: () => void,
  placeholder?: string
  
};
type FindUserState = {
  searchCriterium: string,
  users: User[],
  showUserList: boolean,
  showNewUserButton: boolean,
};
export class FindUser extends PureComponent<FindUserProps, FindUserState> {
  constructor(props: FindUserProps) {
    super(props);
    this.state = {
      searchCriterium: '',
      users: [],
      showUserList: false,
      showNewUserButton: false,
    };
  }

  async searchPatients() {
    // this.props.onSelectPatient(undefined);
    this.setState({showUserList: false, showNewUserButton: false, users: []});
    if (
      !this.state.searchCriterium ||
      this.state.searchCriterium.trim().length === 0
    ) {
      alert(strings.searchCriteriumMissingError);
      return;
    }
    let users: User[] = await  searchPatients(
      this.state.searchCriterium,
    );
    if (!users || users.length === 0) {
      if (!this.props.onNewPatient) {
        alert(strings.noPatientsFound);
        return;
      }
    }
    !isWeb && LayoutAnimation.spring();
    this.setState({
      showPatientList: users != undefined && users.length > 0,
      showNewPatientButton:
        users === undefined || users.length < maxPatientListSize,
      users,
    });
    this.setState({
      showUserList: users != undefined && users.length > 0,
      showNewUserButton: users === undefined || users.length < maxPatientListSize,
      users,
    });
  }
  async searchDoctors() {
    this.props.onSelectUser && this.props.onSelectUser(undefined);
    this.setState({showUserList: false, showNewUserButton: false, users: []});
    let users: User[] = await searchUsers(this.state.searchCriterium, true);
    if (!users || users.length === 0) {
      if (!this.props.onNewUser) {
        alert(strings.noDoctorsFound);
        return;
      }
    }
    !isWeb && LayoutAnimation.spring();
    this.setState({
      showUserList: users != undefined && users.length > 0,
      showNewUserButton: users === undefined || users.length < maxUserListSize,
      users,
    });
  }

  newUser(): void {
    this.setState({showUserList: false, showNewUserButton: false, users: []});
    this.props.onNewUser();
    InteractionManager.runAfterInteractions(() =>
      LayoutAnimation.easeInEaseOut(),
    );
  }

  render() {
    return (
      <View style={styles.columnCard}>
        <TextInput
          placeholder={strings.findPatient}
          returnKeyType="search"
          autoCorrect={false}
          autoFocus={true}
          style={styles.searchField}
          value={this.state.searchCriterium}
          onChangeText={(text: string) =>{
            console.log("text :>> ",text)
            this.setState({searchCriterium: text})
          }
          }
          onSubmitEditing={() => this.searchPatients()}
          testID="patientSearchCriterium"
          testID="userSearchCriterium"
        />
        <UserList
          users={this.state.users}
          visible={this.state.showUserList}
          selectedUserId={this.props.selectedUserId}
          onSelectUser={this.props.onSelectUser}
        />
        {this.props.onNewUser && this.state.showNewUserButton ? (
          <View style={styles.centeredRowLayout}>
            <Button
              title={strings.newDoctor}
              visible={this.state.showNewUserButton}
              onPress={() => this.newUser()}
              testID="newDoctorButton"
            />
          </View>
        ) : null}
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
    this.setState({ showPatientList: false, patients: [] });
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

  renderIcons() {
    return (
      <View style={styles.examIcons}>
        {this.props.onClose && (
          <TouchableOpacity
            onPress={this.props.onClose}
            testID="closeManageUser">
            <Close style={styles.screenIcon} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  render() {
    console.log('searchCriterium :>> ');
    return (
      <View style={ {
        height: "100vh",
        padding: "10px",
        backgroundColor:"#fff"
      }}>
        <View style={styles.centeredScreenLayout}>
          <FindUser
          searchPatients={this.searchPatients}
            selectedUserId={this.state.user ? this.state.user.id : undefined}
            onSelectUser={this.selectUser}
            onNewUser={this.newUser}
          />
          <UserDetails
            user={this.state.user}
            onUpdateUser={(user: ?User) => this.updateUser(user)}
          />
        </View>
        {this.renderIcons()}
      </View>
    )
    // return (
    //   <View style={styles.tabCard}>
    //     <TextInput
    //       placeholder={strings.findPatient}
    //       returnKeyType="search"
    //       autoCorrect={false}
    //       autoFocus={true}
    //       style={styles.searchField}
    //       value={this.state.searchCriterium}
    //       onChangeText={(text: string) =>{
    //         console.log("text :>> ",text)
    //         this.setState({searchCriterium: text})
    //       }
    //       }
    //       onSubmitEditing={() => this.searchPatients()}
    //       testID="patientSearchCriterium"
    //     />
    //     <PatientList
    //       patients={this.state.patients}
    //       visible={this.state.showPatientList}
    //       onSelect={this.props.onSelectPatient}
    //     />
    //     {this.props.onNewPatient && this.state.showNewPatientButton ? (
    //       <View style={styles.centeredRowLayout}>
    //         <Button
    //           title={strings.newPatient}
    //           visible={this.state.showNewPatientButton}
    //           onPress={() => this.newPatient()}
    //           testID="newPatientButton"
    //         />
    //       </View>
    //     ) : null}
    //   </View>
    // );
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
    this.setState({ visitHistory, patientDocumentHistory });
  }

  async selectPatient(patient: Patient) {
    if (!patient) {
      if (!this.state.patientInfo) {
        return;
      }
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
    ) {
      return;
    }
    this.setState({ patientInfo, isNewPatient: false }, () =>
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

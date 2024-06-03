/**
 * @flow
 */

'use strict';

import React, {Component, PureComponent} from 'react';
import {
  View,
  TextInput,
  LayoutAnimation,
  InteractionManager,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import type {Patient, PatientInfo} from './Types';
import {styles, isWeb, fontScale, selectionColor} from './Styles';
import {strings} from './Strings';
import {Button, SelectionListRow} from './Widgets';
import {PatientCard, fetchPatientInfo, getPatientFullName} from './Patient';
import {searchItems} from './Rest';
import {cacheItemsById, getCachedItem} from './DataCache';
import {fetchVisitHistory, VisitHistory} from './Visit';
import {ErrorCard} from './Form';
import {Close, BackInTimeIcon} from './Favorites';

const maxPatientListSize: number = 100;

export async function searchPatients(searchText: string, offset:number): Patient[] {
  if (!searchText || searchText.trim().length === 0) {
    return [];
  }
  const searchCriteria = {
    searchData: searchText,
    size: maxPatientListSize,
    offset:offset ? offset : 0,
  };
  let restResponse = await searchItems('Patient/list', searchCriteria);
  let patients: Patient[] = restResponse.patientList;
  cacheItemsById(patients);
  return patients;
}

export type PatientDetailsProps = {
  patient: ?Patient,
  renderPatientInfo: () => React.ReactNode,
  renderNewPatient: () => React.ReactNode,
};
export class PatientDetails extends PureComponent<PatientDetailsProps> {
  render() {
    if (!this.props.patient) {
      return <View style={styles.leftSearchColumn} />;
    }
    if (this.props.patient.id === 'patient') {
      return (
        <View style={styles.leftSearchColumn}>
          {this.props.renderNewPatient()}
        </View>
      );
    }
    return (
      <View style={styles.leftSearchColumn}>
        <ErrorCard errors={this.props.patient?.errors} />
        {this.props.renderPatientInfo()}
      </View>
    );
  }
}
class PatientList extends Component {
  props: {
    visible: boolean,
    patients: Patient[],
    selectedPatientId: ?string,
    onSelect: (patient: Patient) => void,
    exceedLimit: ?boolean,
    onEndReached: () => void,
    loading: boolean,
  };

  renderFooter = () =>{
    return (
      <View>
          {this.props.loading ? (
            <ActivityIndicator size="large" color={selectionColor} />
          ) : <></>}
      </View>
    );
  }

  render() {
    if (!this.props.visible) {
      return null;
    }
    const {patients, selectedPatientId, onSelect, exceedLimit, onEndReached, loadMoreData} = this.props;
    return (
      <FlatList
        style={[
          styles.searchList,
          exceedLimit ? {maxHeight: 300 * fontScale} : {},
        ]}
        initialNumToRender={10}
        data={patients}
        extraData={{selection: selectedPatientId}}
        keyExtractor={(user, index) => user?.id}
        renderItem={({item, index}: {item: Patient, index: number}) => (
          <SelectionListRow
            label={getPatientFullName(item)}
            simpleSelect={true}
            selected={item?.id === selectedPatientId}
            onSelect={(isSelected: boolean | string) => onSelect(item)}
            testID={'patientName' + (index + 1) + 'Button'}
          />
        )}
        ListFooterComponent={this.renderFooter}
        onEndReached={loadMoreData && patients.length >= maxPatientListSize ? onEndReached : null}
        onEndReachedThreshold ={0.1}
        
      />
    );
  }
}
export type PatientProps = {
  onSelectPatient?: (patient: Patient) => void,
  onNewPatient?: () => void,
  openWaitingListDialog: () => void,
  toggleRecentlyViewedLabel: (shouldShow: boolean) => void,
};
type PatientState = {
  searchCriterium: string,
  selectedPatientId: ?string,
  patients: Patient[],
  showPatientList: boolean,
  showNewPatientButton: boolean,
  exceedLimit: ?boolean,
  offset: number,
  loading: boolean,
  loadMoreData: boolean,
  showRecentlyViewed: boolean,
  loadRecentlyViewed: Boolean,
};
export class FindPatient extends PureComponent<PatientProps, PatientState> {
  constructor(props: PatientProps) {
    super(props);
    this.state = {
      searchCriterium: '',
      patients: [],
      showPatientList: false,
      offset: 0,
      loading: false,
      loadMoreData: true,
      showRecentlyViewed: false,
      loadRecentlyViewed: false,
    };
  }
  async searchPatients() {
    this.props.onSelectPatient(undefined);
    this.props.toggleRecentlyViewedLabel(false);
    this.setState({
      showPatientList: false,
      patients: [],
      loadMoreData: true,
      offset: 0,
      loading:true,
      showRecentlyViewed: false,
    });
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
      patients,
      loading:false
    });
  }
  newPatient() {
    this.props.toggleRecentlyViewedLabel(false);
    this.setState({
      showPatientList: false,
      patients: [],
    });
    this.props.onNewPatient();
    !isWeb &&
      InteractionManager.runAfterInteractions(() =>
        LayoutAnimation.easeInEaseOut(),
      );
  }

  onEndReached = async () => {
    if (!this.state.loading) {
      const offset = this.state.offset + maxPatientListSize;
      this.setState({offset ,loading: true});
      if (
        !this.state.searchCriterium ||
        this.state.searchCriterium.trim().length === 0
      ) {
        alert(strings.searchCriteriumMissingError);
        return;
      }
      const patients: Patient[] = await searchPatients(
        this.state.searchCriterium,
        offset,
      );
      if (!patients || patients.length === 0 ) {
        if (!this.props.onNewPatient) {
          alert(strings.noPatientsFound);
          return;
        }
      }
      if(!Array.isArray(patients)){
        this.setState({ loadMoreData: false, loading:false });
        return;
      }

      !isWeb && LayoutAnimation.spring();
      const updatedPatients = this.state.patients.concat(patients);
      if (this.state?.patients?.length < updatedPatients.length) {
        this.setState({patients: updatedPatients,loading: false});
      } else {
        this.setState({ loadMoreData: false, loading:false });
      }
    }
  };

  fetchRecentlyViewed = async () => {
    this.props.onSelectPatient(undefined);
    this.setState({
      showPatientList: false,
      patients: [],
      loadMoreData: false,
      offset: 0,
      loading:false,
      loadRecentlyViewed:true,
      searchCriterium: '',
      showRecentlyViewed: false,
    });

     
    let restResponse = await searchItems('Patient/recent', {});
    const recentlyViewedpatients: Patient[] = restResponse.patientList;

    if (!recentlyViewedpatients || recentlyViewedpatients.length === 0) {
      this.setState({
        showPatientList: false,
        loadRecentlyViewed:false,
        showRecentlyViewed: false,
      });
      alert(strings.noPatientsFound);
      return;
    }
    cacheItemsById(recentlyViewedpatients);
    
    !isWeb && LayoutAnimation.spring();

    this.props.toggleRecentlyViewedLabel(true);
    this.setState({
      showPatientList: recentlyViewedpatients != undefined && recentlyViewedpatients.length > 0,
      patients: recentlyViewedpatients,
      loadRecentlyViewed:false,
      showRecentlyViewed: true,
    });
  }

  render() {
    return (
      <View style={styles.rightSearchColumn}>
        <TextInput
          placeholder={strings.findPatient}
          returnKeyType="search"
          autoCorrect={false}
          autoFocus={true}
          style={styles.searchField}
          value={this.state.searchCriterium}
          onChangeText={(text: string) => {
            this.setState({searchCriterium: text});
          }}
          onSubmitEditing={() => this.searchPatients()}
          testID="patientSearchCriterium"
        />
        <PatientList
          patients={this.state.patients}
          visible={this.state.showPatientList}
          selectedPatientId={this.props.selectedPatientId}
          onSelect={this.props.onSelectPatient}
          exceedLimit={this.props.exceedLimit}
          onEndReached={this.onEndReached}
          loading={this.state.loading}
          loadMoreData={this.state.loadMoreData}
        />

        <View style={styles.centeredRowLayout}>
        {this.props.onNewPatient ? (
          <View>
            <Button
              title={strings.newPatient}
              onPress={() => this.newPatient()}
              testID="newPatientButton"
            />
            
          </View>
        ) : null}
          {!this.state.showRecentlyViewed && 
            <TouchableOpacity
              onPress={this.fetchRecentlyViewed}
              disabled={this.state.loadRecentlyViewed}
              testID='recentlyViewedButton'
            >
              <View style={styles.button}> 
                {!this.state.loadRecentlyViewed && <BackInTimeIcon  size={18} color="#fff" />}
                {this.state.loadRecentlyViewed && <ActivityIndicator color={selectionColor} />}
              </View>
            </TouchableOpacity>}
        </View>
        {this.props.openWaitingListDialog ? (
          <View style={styles.centeredRowLayout}>
            <Button
              title={strings.viewWaitingList}
              onPress={this.props.openWaitingListDialog}
              testID="viewWaitingList"
            />
          </View>
        ) : null}
      </View>
    );
  }
}

export class PatientSearch extends Component {
  props: {
    onSelectPatient: (patient: Patient) => void,
    openWaitingListDialog: () => void,
    onNewPatient: () => void,
    renderPatientInfo: () => React.ReactNode,
    renderNewPatient: () => React.ReactNode,
  };
  state: {
    selectedPatient: Patient,
    showRecentlyViewedLabel: boolean,
  };
  constructor(props: any) {
    super(props);
    this.state = {
      selectedPatient: undefined,
      showRecentlyViewedLabel: false,
    };
  }

  onSelectPatient(patient) {
    this.setState({selectedPatient: patient});
    this.props.onSelectPatient(patient);
  }

  onNewPatient() {
    const NewPatient = this.props.onNewPatient();
    this.setState({selectedPatient: NewPatient});
  }
  isNewPatient(): boolean {
    return (
      this.state.selectedPatient && this.state.selectedPatient.id === 'patient'
    );
  }

  toggleRecentlyViewedLabel = (shouldShow: boolean) => {
    this.setState({ showRecentlyViewedLabel: shouldShow});
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
    return (
      <View style={styles.searchPage}>
        {this.state.showRecentlyViewedLabel && <View>
          <Text style={styles.screenTitle}>{strings.recentlyViewedPatients}</Text>
        </View>}
        <View style={styles.centeredScreenLayout}>
          {!this.isNewPatient() && (
            <FindPatient
              onSelectPatient={(patient) => this.onSelectPatient(patient)}
              openWaitingListDialog={this.props.openWaitingListDialog}
              selectedPatientId={
                this.state?.selectedPatient
                  ? this.state?.selectedPatient.id
                  : undefined
              }
              onNewPatient={() => this.onNewPatient()}
              toggleRecentlyViewedLabel={this.toggleRecentlyViewedLabel}
            />
          )}
          <PatientDetails
            patient={this.state?.selectedPatient}
            renderPatientInfo={this.props.renderPatientInfo}
            renderNewPatient={this.props.renderNewPatient}
          />
        </View>
        {this.renderIcons()}
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
    showRecentlyViewedLabel: boolean,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      patientInfo: undefined,
      visitHistory: undefined,
      patientDocumentHistory: undefined,
      showRecentlyViewedLabel: false,
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
    this.setState({patientInfo, isNewPatient: false}, () =>
      this.showVisitHistory(patient.id),
    );
  }

  toggleRecentlyViewedLabel = (shouldShow: boolean) => {
    this.setState({ showRecentlyViewedLabel: shouldShow});
  }

  render() {
    return (
      <KeyboardAwareScrollView
        scrollEnable={true}
        keyboardShouldPersistTaps="handled">

        {this.state.showRecentlyViewedLabel && <View >
          <Text style={styles.screenTitle}>{strings.recentlyViewedPatients}</Text>
        </View>}

        <FindPatient
          onSelectPatient={(patient: Patient) => this.selectPatient(patient)}
          exceedLimit={true}
          selectedPatientId={
            this.state?.patientInfo ? this.state?.patientInfo.id : undefined
          }
          toggleRecentlyViewedLabel={this.toggleRecentlyViewedLabel}
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
              route={this.props.route}
            />
          </View>
        )}
      </KeyboardAwareScrollView>
    );
  }
}

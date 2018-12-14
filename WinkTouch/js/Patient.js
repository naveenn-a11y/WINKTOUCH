/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Image, View, TouchableHighlight, Text, Button, TouchableOpacity, LayoutAnimation} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import type {Patient, PatientInfo, FieldDefinition, CodeDefinition, PatientTag } from './Types';
import { styles, fontScale} from './Styles';
import { strings } from './Strings';
import { FormRow, FormTextInput, FormInput, FormField } from './Form';
import { ExamCardSpecifics } from './Exam';
import { cacheItemById, getCachedItem, getCachedItems } from './DataCache';
import { fetchItemById, storeItem } from './Rest';
import { getFieldDefinitions, getFieldDefinition } from './Items';
import { deepClone, formatAge } from './Util';
import { formatOption } from './Codes';
import { PatientMedication} from './Medication';
import { getDoctor } from './DoctorApp';

export async function fetchPatientInfo(patientId: string, ignoreCache?: boolean = false) : PatientInfo {
  let patientInfo = await fetchItemById(patientId, ignoreCache);
  return patientInfo;
}

export async function storePatientInfo(patientInfo: PatientInfo) : PatientInfo {
  patientInfo = await storeItem(patientInfo);
  return patientInfo;
}

export class PatientTags extends Component {
  props: {
    patient: Patient
  }
  state: {
    patientTags: ?PatientTag[]
  }
  constructor(props: any) {
    super(props);
    this.state = {
      patientTags: getCachedItems(this.props.patient.patientTags)
    }
  }

  componentWillMount() {
    if (this.state.patientTags===undefined || this.state.patientTags.includes(undefined)) {
      this.refreshPatientTags();
    }
  }

  async refreshPatientTags() {
    let patient = await fetchPatientInfo(this.props.patient.id, true); //TODO Wais PatientTag controller
    this.setState({
      patientTags: getCachedItems(patient.patientTags)
    })
  }

  render() {
      if (!this.state.patientTags || this.state.patientTags.length===0) return null;
      return <View style={styles.rowLayout}>
        <Text style={styles.text}>(</Text>
        {this.state.patientTags && this.state.patientTags.map((patientTag: PatientTag, index: number) => <Text key={index}>{patientTag && patientTag.letter}</Text>)}
        <Text>)</Text>
      </View>
    }
}

export class PatientCard extends Component {
    props: {
        patientInfo?: PatientInfo,
        navigation: any
    }
    genderOptions: CodeDefinition[];
    gender: string;

    constructor(props: any) {
        super(props);
        this.gender = formatOption('patient','gender', this.props.patientInfo.gender);
    }

    componentWillReceiveProps(nextProps: any) {
        this.gender = formatOption('patient','gender', nextProps.patientInfo.gender);
    }

    render() {
        if (!this.props.patientInfo) return null;
        return <TouchableOpacity onPress={() => this.props.navigation.navigate('patient', {patientInfo: this.props.patientInfo})}>
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
                            <View style={styles.columnLayout}>
                                <Text style={styles.text}>{this.gender} {this.props.patientInfo.gender===0?strings.ageM:strings.ageF} {formatAge(this.props.patientInfo.dateOfBirth)}</Text>
                                <PatientTags patient={this.props.patientInfo} />
                                {__DEV__ && <Text style={styles.text}>Patient ocular summary TODO</Text>}
                            </View>
                            <View style={styles.columnLayout}>
                                <Text style={styles.text}>{this.props.patientInfo.cell?(this.props.patientInfo.cell+' '):null}{this.props.patientInfo.city}</Text>
                                <Text style={styles.text}>{this.props.patientInfo.email}</Text>
                                {__DEV__ && <Text style={styles.text}>Insured by TODO</Text>}
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
        patient: PatientInfo
    }
    render() {
        if (!this.props.patient)
            return null;
        return <View style={styles.tabCard}>
            <Text style={styles.cardTitle}>Insurance and Billing</Text>
        </View>
    }
}

export class PatientOcularHistoryCard extends Component {
  props: {
      patient: PatientInfo
  }
  render() {
      if (!this.props.patient)
          return null;
      return <View style={styles.tabCard}>
          <Text style={styles.cardTitle}>Ocular Diagnose History</Text>
      </View>
  }
}

export class PatientContact extends Component {
    props: {
      patientInfo: PatientInfo,
      editable: ?boolean,
      onUpdatePatientInfo?: (patientInfo: PatientInfo) => void
    }
    state: {
      editedPatientInfo: PatientInfo,
    }
    static defaultProps = {
      editable: true
    }
    constructor(props: any) {
        super(props);
        const editedPatientInfo: PatientInfo = deepClone(this.props.patientInfo);
        this.state = {
          editedPatientInfo,
        };
    }

    componentWillReceiveProps(nextProps: any) {
      const editedPatientInfo: PatientInfo = deepClone(nextProps.patientInfo);
      this.setState({editedPatientInfo});
    }

    updatePatientInfo = (editedPatientInfo: PatientInfo) => {
      if (!this.props.editable) return;
      this.setState({editedPatientInfo});
    }

    cancelEdit() {
      const editedPatientInfo: PatientInfo = deepClone(this.props.patientInfo);
      LayoutAnimation.easeInEaseOut();
      this.setState({editedPatientInfo: editedPatientInfo});
    }

    async saveEdit() {
      const editedPatientInfo : PatientInfo = await storePatientInfo(this.state.editedPatientInfo);
      if (this.props.onUpdatePatientInfo) {
        this.props.onUpdatePatientInfo(editedPatientInfo);
      } else {
        this.setState({editedPatientInfo});
      }
    }

    render() {
        return <View style={styles.tabCard}>
            <Text style={styles.cardTitle}>Contact</Text>
            <View style={styles.form}>
              <FormRow>
                <FormField value={this.state.editedPatientInfo} fieldName='firstName' onChangeValue={this.updatePatientInfo} autoCapitalize='words'/>
                <FormField value={this.state.editedPatientInfo} fieldName='lastName' onChangeValue={this.updatePatientInfo} autoCapitalize='words'/>
              </FormRow>
              <FormRow>
                <FormField value={this.state.editedPatientInfo} fieldName='streetName' onChangeValue={this.updatePatientInfo} autoCapitalize='words'/>
                <FormField value={this.state.editedPatientInfo} fieldName='streetNumber' onChangeValue={this.updatePatientInfo} type='numeric' />
              </FormRow>
              <FormRow>
                <FormField value={this.state.editedPatientInfo} fieldName='city' onChangeValue={this.updatePatientInfo} autoCapitalize='words'/>
                <FormField value={this.state.editedPatientInfo} fieldName='postalCode' onChangeValue={this.updatePatientInfo} autoCapitalize='characters'/>
              </FormRow>
              <FormRow>
                <FormTextInput value={this.state.editedPatientInfo.province} label={getFieldDefinition('patient.province').label} autoCapitalize='words' readonly={true}/>
                <FormField value={this.state.editedPatientInfo} fieldName='country' onChangeValue={this.updatePatientInfo} autoCapitalize='characters' readonly={true}/>
              </FormRow>
              <FormRow>
                <FormField value={this.state.editedPatientInfo} fieldName='phone' onChangeValue={this.updatePatientInfo} type='phone-pad'/>
                <FormField value={this.state.editedPatientInfo} fieldName='cell' onChangeValue={this.updatePatientInfo} type='phone-pad'/>
              </FormRow>
              <FormRow>
                <FormField value={this.state.editedPatientInfo} fieldName='dateOfBirth' onChangeValue={this.updatePatientInfo} type='pastDate'/>
                <FormField value={this.state.editedPatientInfo} fieldName='gender' onChangeValue={this.updatePatientInfo}/>
              </FormRow>
              <FormRow>
                <FormField value={this.state.editedPatientInfo} fieldName='email' onChangeValue={this.updatePatientInfo} type='email-address'/>
              </FormRow>
              {this.props.editable && <View style={styles.buttonsRowLayout}>
                <Button title='Cancel' color={'#1db3b3'} onPress={() => this.cancelEdit()} />
                <Button title='Update' color={'#1db3b3'} onPress={() => this.saveEdit()} />
              </View>}
            </View>
        </View>
    }
}

export class PatientScreen extends Component {
    props: {
        navigation: any
    }
    params: {
        patientInfo: PatientInfo,
    }
    state: {
      patientInfo: PatientInfo
    }

    constructor(props: any) {
      super(props);
      this.params = this.props.navigation.state.params;
      this.state = {
        patientInfo: getCachedItem(this.params.patientInfo.id)
      };
      this.refreshPatientInfo()
    }

    componentWillReceiveProps(nextProps: any) {
      this.params = nextProps.navigation.state.params;
    }

    async refreshPatientInfo() {
      const patientInfo : PatientInfo = await fetchPatientInfo(this.params.patientInfo.id, true);
      //if (patientInfo.version!==this.state.patientInfo.version)
        this.setState({patientInfo});
    }

    updatePatientInfo = (patientInfo: PatientInfo) => {
      this.setState({patientInfo: patientInfo});
    }

    render() {
        return <KeyboardAwareScrollView>
            <PatientTitle patientInfo={this.state.patientInfo} />
            <PatientContact patientInfo={this.state.patientInfo} onUpdatePatientInfo={this.updatePatientInfo}/>
            {__DEV__  && <PatientMedication patientInfo={this.state.patientInfo} editable={false}/>}
            {__DEV__ && <PatientOcularHistoryCard patient={this.state.patientInfo} />}
            {__DEV__ && <PatientBillingInfo patient={this.state.patientInfo} />}
        </KeyboardAwareScrollView>
    }
}

/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Image, View, TouchableHighlight, Text, Button, TouchableOpacity, LayoutAnimation} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import type {Patient, PatientInfo, FieldDefinition, CodeDefinition, PatientTag, RestResponse } from './Types';
import { styles, fontScale} from './Styles';
import { strings } from './Strings';
import { FormRow, FormTextInput, FormInput, FormField } from './Form';
import { ExamCardSpecifics } from './Exam';
import { cacheItemById, getCachedItem, getCachedItems } from './DataCache';
import { fetchItemById, storeItem } from './Rest';
import { getFieldDefinitions, getFieldDefinition } from './Items';
import { deepClone, formatAge } from './Util';
import { formatOption, formatCode } from './Codes';
import { PatientMedication} from './Medication';
import { getDoctor } from './DoctorApp';
import { Refresh } from './Favorites';

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
    patient: Patient|PatientInfo,
    showDescription?: boolean
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
    let patient : PatientInfo = await fetchPatientInfo(this.props.patient.id, true);
    this.setState({
      patientTags: getCachedItems(patient.patientTags)
    })
  }

  render() {
      let genderShort : string = this.props.patient.gender?formatCode('genderCode', this.props.patient.gender):'';
      if (genderShort.length>0) genderShort = genderShort.substring(0,1);
      if (!this.state.patientTags || this.state.patientTags.length===0) {
        if (this.props.showDescription) return null;
        return  <View style={styles.rowLayout}>
            <Text style={styles.text}> ({genderShort})</Text>
        </View>
      }
      return this.props.showDescription?<View style={styles.rowLayout}>
        {this.state.patientTags && this.state.patientTags.map((patientTag: PatientTag, index: number) => <Text key={index} style={styles.text}>{patientTag && patientTag.name} </Text>)}
      </View>:<View style={styles.rowLayout}>
        <Text style={styles.text}> ({genderShort}</Text>
        {this.state.patientTags && this.state.patientTags.map((patientTag: PatientTag, index: number) => <Text key={index} style={styles.text}>{patientTag && patientTag.letter}</Text>)}
        <Text>)</Text>
      </View>
    }
}

export class PatientCard extends Component {
    props: {
        patientInfo?: PatientInfo,
        navigation: any
    }

    render() {
        if (!this.props.patientInfo) return null;
        return <TouchableOpacity onPress={() => this.props.navigation.navigate('patient', {patientInfo: this.props.patientInfo})}>
                  <View style={styles.paragraph}>
                      <Text style={styles.cardTitleLeft}>{this.props.patientInfo.firstName + ' ' + this.props.patientInfo.lastName}</Text>
                      <View style={styles.formRow}>
                          <View style={styles.columnLayout}>
                              <Text style={styles.text}>{formatCode('genderCode',this.props.patientInfo.gender)} {this.props.patientInfo.dateOfBirth?this.props.patientInfo.gender===0?strings.ageM:strings.ageF:''} {this.props.patientInfo.dateOfBirth?formatAge(this.props.patientInfo.dateOfBirth):''}</Text>
                              <PatientTags patient={this.props.patientInfo} showDescription={true}/>
                              {__DEV__ && <Text style={styles.text}>Patient ocular summary TODO</Text>}
                          </View>
                          <View style={styles.columnLayout}>
                              <Text style={styles.text}>{this.props.patientInfo.cell?(this.props.patientInfo.cell+' '):null}{this.props.patientInfo.city}</Text>
                              <Text style={styles.text}>{this.props.patientInfo.email}</Text>
                              {__DEV__ && <Text style={styles.text}>Insured by TODO</Text>}
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
      onUpdatePatientInfo: (patientInfo: PatientInfo) => void
    }

    constructor(props: any) {
        super(props);
    }

    render() {
        return <View style={styles.tabCard}>
            <Text style={styles.cardTitle}>Contact</Text>
            <View style={styles.form}>
              <FormRow>
                <FormField value={this.props.patientInfo} fieldName='firstName' onChangeValue={this.props.onUpdatePatientInfo} autoCapitalize='words'/>
                <FormField value={this.props.patientInfo} fieldName='lastName' onChangeValue={this.props.onUpdatePatientInfo} autoCapitalize='words'/>
              </FormRow>
              <FormRow>
                <FormField value={this.props.patientInfo} fieldName='streetName' onChangeValue={this.props.onUpdatePatientInfo} autoCapitalize='words'/>
                <FormField value={this.props.patientInfo} fieldName='streetNumber' onChangeValue={this.props.onUpdatePatientInfo} type='numeric' />
              </FormRow>
              <FormRow>
                <FormField value={this.props.patientInfo} fieldName='city' onChangeValue={this.props.onUpdatePatientInfo} autoCapitalize='words'/>
                <FormField value={this.props.patientInfo} fieldName='postalCode' onChangeValue={this.props.onUpdatePatientInfo} autoCapitalize='characters'/>
              </FormRow>
              <FormRow>
                <FormTextInput value={this.props.patientInfo.province} label={getFieldDefinition('patient.province').label} autoCapitalize='words' readonly={true}/>
                <FormField value={this.props.patientInfo} fieldName='country' onChangeValue={this.props.onUpdatePatientInfo} autoCapitalize='characters' readonly={true}/>
              </FormRow>
              <FormRow>
                <FormField value={this.props.patientInfo} fieldName='phone' onChangeValue={this.props.onUpdatePatientInfo} type='phone-pad'/>
                <FormField value={this.props.patientInfo} fieldName='cell' onChangeValue={this.props.onUpdatePatientInfo} type='phone-pad'/>
              </FormRow>
              <FormRow>
                <FormField value={this.props.patientInfo} fieldName='dateOfBirth' onChangeValue={this.props.onUpdatePatientInfo} type='pastDate'/>
                <FormField value={this.props.patientInfo} fieldName='gender' onChangeValue={this.props.onUpdatePatientInfo}/>
              </FormRow>
              <FormRow>
                <FormField value={this.props.patientInfo} fieldName='email' onChangeValue={this.props.onUpdatePatientInfo} type='email-address'/>
              </FormRow>
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
      patientInfo: PatientInfo,
      isDirty: boolean
    }

    constructor(props: any) {
      super(props);
      this.params = this.props.navigation.state.params;
      const isDirty : boolean = this.params.patientInfo.errors;
      this.state = {
        patientInfo: isDirty?this.params.patientInfo:getCachedItem(this.params.patientInfo.id),
        isDirty
      };
      if (!isDirty) {
        this.refreshPatientInfo();
      }
    }

    componentWillReceiveProps(nextProps: any) {

    }

    componentWillUnmount() {
      if (this.state.isDirty) {
        this.asyncComponentWillUnmount();
      }
    }

    async asyncComponentWillUnmount() {
      let patientInfo: RestResponse = await storePatientInfo(this.state.patientInfo);
      if (patientInfo.errors) {
          this.props.navigation.navigate('patient', {patientInfo: patientInfo});
      }
    }

    async refreshPatientInfo() {
      const patientInfo : PatientInfo = await fetchPatientInfo(this.params.patientInfo.id, this.state.isDirty);
      this.setState({patientInfo, isDirty:false});
    }

    updatePatientInfo = (patientInfo: PatientInfo) => {
        this.setState({patientInfo: patientInfo, isDirty: true});
    }

    renderFavoriteIcon() {
      if (!this.state.isDirty) return null;
      return <TouchableOpacity onPress={() => this.refreshPatientInfo()}><Refresh style={styles.screenIcon}/></TouchableOpacity>
    }

    renderIcons() {
      return <View style={styles.examIcons}>
        {this.renderFavoriteIcon()}
      </View>
    }

    render() {
        return <KeyboardAwareScrollView>
            {this.renderIcons()}
            <PatientTitle patientInfo={this.state.patientInfo} />
            <PatientContact patientInfo={this.state.patientInfo} onUpdatePatientInfo={this.updatePatientInfo}/>
            {__DEV__  && <PatientMedication patientInfo={this.state.patientInfo} editable={false}/>}
            {__DEV__ && <PatientOcularHistoryCard patient={this.state.patientInfo} />}
            {__DEV__ && <PatientBillingInfo patient={this.state.patientInfo} />}
        </KeyboardAwareScrollView>
    }
}

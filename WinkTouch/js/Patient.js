/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Image, View, TouchableHighlight, Text, Button, TouchableOpacity, LayoutAnimation, ScrollView} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { NavigationActions } from 'react-navigation';
import type {Patient, PatientInfo, FieldDefinition, CodeDefinition, PatientTag, RestResponse, PatientDocument, Upload } from './Types';
import { styles, fontScale} from './Styles';
import { strings } from './Strings';
import { FormRow, FormTextInput, FormInput, FormField, ErrorCard } from './Form';
import { ExamCardSpecifics } from './Exam';
import { cacheItemById, getCachedItem, getCachedItems } from './DataCache';
import { fetchItemById, storeItem, searchItems } from './Rest';
import { getFieldDefinitions, getFieldDefinition } from './Items';
import { deepClone, formatAge } from './Util';
import { formatOption, formatCode } from './Codes';
import { PatientMedicationCard} from './Medication';
import { getDoctor } from './DoctorApp';
import { Refresh } from './Favorites';
import { PatientRefractionCard } from './Refraction';
import { Pdf } from './Document';
import { fetchUpload, getMimeType } from './Upload';
import { VisitHistoryCard } from './Visit';
import { FindPatient } from './FindPatient';

export async function fetchPatientInfo(patientId: string, ignoreCache?: boolean = false) : PatientInfo {
  let patientInfo : PatientInfo = await fetchItemById(patientId, ignoreCache);
  return patientInfo;
}

export async function storePatientInfo(patientInfo: PatientInfo) : PatientInfo {
  patientInfo = await storeItem(patientInfo);
  return patientInfo;
}

export async function searchPatientDocuments(patientId: string, category: string) {
  const searchCriteria = { patientId, category };
  let restResponse = await searchItems('PatientDocument/list', searchCriteria);
  return restResponse;
}

export async function storePatientDocument(patientDocument: PatientDocument) {
  patientDocument = await storeItem(patientDocument);
  return patientDocument;
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
      if (!this.props.patient)
        return null;
      let genderShort : string = formatCode('genderCode', this.props.patient.gender);
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
        <Text style={styles.text}>)</Text>
      </View>
    }
}

export class PatientCard extends Component {
    props: {
        patientInfo?: PatientInfo,
        navigation: any,
        navigate?: string,
        refreshStateKey: string,
        style?: any
    }
    static defaultProps = {
      navigate: 'patient'
    }

    componentWillReceiveProps() {
      this.forceUpdate();
    }

    render() {
        if (!this.props.patientInfo) return null;
        return <TouchableOpacity onPress={() => this.props.navigation.navigate(this.props.navigate, {patientInfo: this.props.patientInfo, refreshStateKey: this.props.refreshStateKey})}>
                  <View style={this.props.style?this.props.style:styles.paragraph}>
                      <Text style={styles.cardTitleLeft}>{this.props.patientInfo.firstName + ' ' + this.props.patientInfo.lastName}</Text>
                      <View style={styles.formRow}>
                          <View style={styles.flexColumnLayout}>
                              <Text style={styles.text}>{formatCode('genderCode',this.props.patientInfo.gender)} {this.props.patientInfo.dateOfBirth?this.props.patientInfo.gender===0?strings.ageM:strings.ageF:''} {this.props.patientInfo.dateOfBirth?formatAge(this.props.patientInfo.dateOfBirth):''}</Text>
                              <PatientTags patient={this.props.patientInfo} showDescription={true}/>
                          </View>
                          <View style={styles.flexColumnLayout}>
                              <Text style={styles.text}>{this.props.patientInfo.cell?(this.props.patientInfo.cell+' '):this.props.patientInfo.phone}</Text>
                              <Text style={styles.text}>{this.props.patientInfo.streetNumber} {this.props.patientInfo.streetName?this.props.patientInfo.streetName+',':''} {this.props.patientInfo.province} {this.props.patientInfo.postalCode} {this.props.patientInfo.city}</Text>
                              <Text style={styles.text}>{this.props.patientInfo.email}</Text>
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

export class PatientDocumentPage extends Component {
  props: {
    id: string
  }
  state: {
    upload: ?Upload
  }

  constructor(props: any) {
    super(props);
    const patientDocument: PatientDocument = getCachedItem(props.id);
    const uploadId : ?string = patientDocument.uploadId;
    this.state = {
      upload: getCachedItem(uploadId)
    };
    this.loadUpload(uploadId);
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.id===this.props.id) return;
    const patientDocument: PatientDocument = getCachedItem(nextProps.id);
    const uploadId : ?string = patientDocument.uploadId;
    this.setState({
      upload: getCachedItem(uploadId)
    });
    this.loadUpload(uploadId);
  }

  async loadUpload(uploadId: ?string) {
    if (!uploadId) return;
    let upload : Upload = await fetchUpload(uploadId);
    this.setState({upload});
  }

  render() {
    if (!this.state.upload) return null;
    const mimeType : string = getMimeType(this.state.upload);
    if (mimeType==='application/pdf;base64')
      return <Pdf upload={this.state.upload} style={styles.patientDocument}/>
    if (mimeType==='image/jpeg;base64' || mimeType==='image/png;base64')
      return <ScrollView style={styles.patientDocument} maximumZoomScale={2} minimumZoomScale={.5}>
          <Image source={{ uri: `data:${mimeType},${this.state.upload.data}`}} style={styles.patientDocument}/>
        </ScrollView>
    return <View style={styles.errorCard}><Text style={styles.cardTitle}>{strings.formatString(strings.unsupportedDocumentError, this.state.upload.name)}</Text></View>
  }
}

export class PatientScreen extends Component {
    props: {
        navigation: any,
    }
    params: {
        patientInfo: PatientInfo,
        refreshStateKey?: string
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
      } else if (this.params.refreshStateKey) {
        const setParamsAction = NavigationActions.setParams({
          params: { refresh: true },
          key: this.params.refreshStateKey
        })
        this.props.navigation.dispatch(setParamsAction);
      }
    }

    async refreshPatientInfo() {
      const patientInfo : PatientInfo = await fetchPatientInfo(this.params.patientInfo.id, this.state.isDirty);
      this.setState({patientInfo, isDirty:false});
    }

    updatePatientInfo = (patientInfo: PatientInfo) => {
        this.setState({patientInfo: patientInfo, isDirty: true});
    }

    renderRefreshIcon() {
      if (!this.state.isDirty) return null;
      return <TouchableOpacity onPress={() => this.refreshPatientInfo()}><Refresh style={styles.screenIcon}/></TouchableOpacity>
    }

    renderIcons() {
      return <View style={styles.examIcons}>
        {this.renderRefreshIcon()}
      </View>
    }


    render() {
        return <KeyboardAwareScrollView keyboardShouldPersistTaps="handled">
            {this.renderIcons()}
            <PatientTitle patientInfo={this.state.patientInfo} />
            <ErrorCard errors={this.state.patientInfo.errors} />
            <PatientContact patientInfo={this.state.patientInfo} onUpdatePatientInfo={this.updatePatientInfo}/>
        </KeyboardAwareScrollView>
    }
}

export class CabinetScreen extends Component {
    props: {
        navigation: any,
    }
    state: {
      patientInfo: ?PatientInfo,
    }

    constructor(props: any) {
      super(props);
      this.params = this.props.navigation.state.params;
      this.state = {
        patientInfo: undefined,
      }
    }

    async selectPatient(patient: Patient) {
      if (!patient) {
        if (!this.state.patientInfo) return;
        LayoutAnimation.easeInEaseOut();
        this.setState({patientInfo: undefined});
        return;
      }
      let patientInfo : ?PatientInfo = getCachedItem(patient.id);
      LayoutAnimation.easeInEaseOut();
      this.setState({patientInfo});
      patientInfo = await fetchPatientInfo(patient.id);
      if (this.state.patientInfo===undefined || patient.id!==this.state.patientInfo.id)
        return;
      this.setState({patientInfo});
    }

    render() {
        return <ScrollView keyboardShouldPersistTaps="handled">
          <FindPatient onSelectPatient={(patient: Patient) => this.selectPatient(patient)} />
          {this.state.patientInfo && <View style={styles.separator}>
            <PatientCard patientInfo={this.state.patientInfo} navigate='appointment' navigation={this.props.navigation} style={styles.tabCardS}/>
          </View>}
        </ScrollView>
    }
  }

/**
 * @flow
 */
'use strict';

import React, {Component, PureComponent} from 'react';
import {
  Image,
  View,
  TouchableHighlight,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  ScrollView,
  Platform,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {NavigationActions} from 'react-navigation';
import type {
  Patient,
  PatientInfo,
  FieldDefinition,
  CodeDefinition,
  PatientTag,
  RestResponse,
  PatientDocument,
  Upload,
} from './Types';
import {styles, fontScale, isWeb} from './Styles';
import {strings} from './Strings';
import {FormRow, FormTextInput, FormInput, FormField, ErrorCard} from './Form';
import {ExamCardSpecifics} from './Exam';
import {cacheItemById, getCachedItem, getCachedItems} from './DataCache';
import {fetchItemById, storeItem, searchItems, stripDataType} from './Rest';
import {getFieldDefinitions, getFieldDefinition} from './Items';
import {deepClone, formatAge, prefix, isToday} from './Util';
import {formatOption, formatCode} from './Codes';
import {getDoctor, getStore} from './DoctorApp';
import {Refresh} from './Favorites';
import {PatientRefractionCard} from './Refraction';
import {Pdf} from './Document';
import {fetchUpload, getMimeType} from './Upload';
import {VisitHistoryCard} from './Visit';
import {FindPatient} from './FindPatient';
import {Button} from './Widgets';
import {fetchAppointments, AppointmentSummary} from './Appointment';

export async function fetchPatientInfo(
  patientId: string,
  ignoreCache: ?boolean = false,
): PatientInfo {
  let patientInfo: PatientInfo = await fetchItemById(patientId, ignoreCache);
  return patientInfo;
}

export async function storePatientInfo(patientInfo: PatientInfo): PatientInfo {
  patientInfo = await storeItem(patientInfo);
  return patientInfo;
}

export async function searchPatientDocuments(
  patientId: string,
  category: string,
) {
  const searchCriteria = {patientId, category};
  let restResponse = await searchItems('PatientDocument/list', searchCriteria);
  return restResponse;
}

export async function storePatientDocument(patientDocument: PatientDocument) {
  patientDocument = await storeItem(patientDocument);
  return patientDocument;
}

export class PatientTags extends Component {
  props: {
    locked: boolean,
    patient: Patient | PatientInfo,
    showDescription?: boolean,
  };
  state: {
    patientTags: ?(PatientTag[]),
  };
  constructor(props: any) {
    super(props);
    this.state = {
      patientTags: getCachedItems(this.props.patient.patientTags),
    };
  }

  componentDidMount() {
    if (
      this.state.patientTags === undefined ||
      this.state.patientTags.includes(undefined)
    ) {
      this.refreshPatientTags();
    }
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.patient.id === prevProps.patient.id &&
      this.props.patient.patientTags === prevProps.patient.patientTags
    )
      return;
    this.setState(
      {
        patientTags: getCachedItems(this.props.patient.patientTags),
      },
      this.refreshPatientTags,
    );
  }

  async refreshPatientTags() {
    let patient: PatientInfo = await fetchPatientInfo(
      this.props.patient.id,
      true,
    );
    this.setState({
      patientTags: getCachedItems(patient.patientTags),
    });
  }

  render() {
    if (!this.props.patient) return null;
    let genderShort: string = formatCode(
      'genderCode',
      this.props.patient.gender,
    );
    if (genderShort.length > 0) genderShort = genderShort.substring(0, 1);
    if (!this.state.patientTags || this.state.patientTags.length === 0) {
      if (this.props.showDescription) return null;
      return (
        <View style={styles.rowLayout}>
          <Text style={!!this.props.locked ? styles.grayedText : styles.text}>
            ({genderShort})
          </Text>
        </View>
      );
    }
    return this.props.showDescription ? (
      <View style={styles.rowLayout}>
        {this.state.patientTags &&
          this.state.patientTags.map(
            (patientTag: PatientTag, index: number) => (
              <Text key={index} style={styles.text}>
                {patientTag && patientTag.name}{' '}
              </Text>
            ),
          )}
      </View>
    ) : (
      <View style={styles.rowLayout}>
        <Text style={styles.text}> ({genderShort}</Text>
        {this.state.patientTags &&
          this.state.patientTags.map(
            (patientTag: PatientTag, index: number) => (
              <Text key={index} style={styles.text}>
                {patientTag && patientTag.letter}
              </Text>
            ),
          )}
        <Text style={styles.text}>)</Text>
      </View>
    );
  }
}

export class PatientCard extends Component {
  props: {
    patientInfo?: PatientInfo,
    navigation: any,
    navigate?: string,
    refreshStateKey: string,
    style?: any,
    hasAppointment?: boolean,
  };
  static defaultProps = {
    navigate: 'patient',
  };

  render() {
    if (!this.props.patientInfo) return null;
    return (
      <TouchableOpacity
        onPress={() =>
          this.props.navigation.navigate(this.props.navigate, {
            patientInfo: this.props.patientInfo,
            refreshStateKey: this.props.refreshStateKey,
            hasAppointment: this.props.hasAppointment,
          })
        }
        testID="patientContact">
        <View style={this.props.style ? this.props.style : styles.paragraph}>
          <Text style={styles.cardTitleLeft}>
            {this.props.patientInfo.firstName +
              ' ' +
              this.props.patientInfo.lastName}
          </Text>
          <View style={styles.formRow}>
            <View style={styles.flexColumnLayout}>
              <Text style={styles.text}>
                {formatCode('genderCode', this.props.patientInfo.gender)}{' '}
                {this.props.patientInfo.dateOfBirth
                  ? this.props.patientInfo.gender === 0
                    ? strings.ageM
                    : strings.ageF
                  : ''}{' '}
                {this.props.patientInfo.dateOfBirth
                  ? formatAge(this.props.patientInfo.dateOfBirth) +
                    '  (' +
                    this.props.patientInfo.dateOfBirth +
                    ')'
                  : ''}
              </Text>
              <Text style={styles.text}>
                z{stripDataType(this.props.patientInfo.id)}
                {prefix(this.props.patientInfo.medicalCard, '  ')}
                {prefix(this.props.patientInfo.medicalCardVersion, '-')}
                {prefix(this.props.patientInfo.medicalCardExp, '-')}
              </Text>
              <PatientTags
                patient={this.props.patientInfo}
                showDescription={true}
              />
            </View>
            <View style={styles.flexColumnLayout}>
              <Text style={styles.text}>
                {this.props.patientInfo.cell
                  ? this.props.patientInfo.cell + ' '
                  : this.props.patientInfo.phone}
              </Text>
              <Text style={styles.text}>
                {this.props.patientInfo.streetNumber}{' '}
                {this.props.patientInfo.streetName
                  ? this.props.patientInfo.streetName + ','
                  : ''}{' '}
                {this.props.patientInfo.province}{' '}
                {this.props.patientInfo.postalCode}{' '}
                {this.props.patientInfo.city}
              </Text>
              <Text style={styles.text}>{this.props.patientInfo.email}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}

export class PatientTitle extends Component {
  props: {
    patientInfo: PatientInfo,
  };
  render() {
    if (!this.props.patientInfo) return null;
    return (
      <Text style={styles.screenTitle}>
        {this.props.patientInfo.firstName} {this.props.patientInfo.lastName}
      </Text>
    );
  }
}

export class PatientBillingInfo extends Component {
  props: {
    patient: PatientInfo,
  };
  render() {
    if (!this.props.patient) return null;
    return (
      <View style={styles.tabCard}>
        <Text style={styles.cardTitle}>Insurance and Billing</Text>
      </View>
    );
  }
}

export class PatientContact extends Component {
  props: {
    patientInfo: PatientInfo,
    onUpdatePatientInfo: (patientInfo: PatientInfo) => void,
  };

  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <View style={styles.tabCard}>
        <Text style={styles.cardTitle}>Contact</Text>
        <View style={styles.form}>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="firstName"
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="words"
            />
            <FormField
              value={this.props.patientInfo}
              fieldName="lastName"
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="words"
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="streetName"
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="words"
            />
            <FormField
              value={this.props.patientInfo}
              fieldName="streetNumber"
              onChangeValue={this.props.onUpdatePatientInfo}
              type="numeric"
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="city"
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="words"
            />
            <FormField
              value={this.props.patientInfo}
              fieldName="postalCode"
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="characters"
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="province"
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="characters"
            />
            <FormField
              value={this.props.patientInfo}
              fieldName="countryId"
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="characters"
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="phone"
              onChangeValue={this.props.onUpdatePatientInfo}
              type="phone-pad"
            />
            <FormField
              value={this.props.patientInfo}
              fieldName="cell"
              onChangeValue={this.props.onUpdatePatientInfo}
              type="phone-pad"
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="dateOfBirth"
              onChangeValue={this.props.onUpdatePatientInfo}
              type="pastDate"
            />
            <FormField
              value={this.props.patientInfo}
              fieldName="gender"
              onChangeValue={this.props.onUpdatePatientInfo}
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="medicalCard"
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="characters"
            />
            <FormField
              value={this.props.patientInfo}
              fieldName="medicalCardVersion"
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="characters"
            />
            <FormField
              value={this.props.patientInfo}
              fieldName="medicalCardExp"
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="characters"
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="email"
              onChangeValue={this.props.onUpdatePatientInfo}
              type="email-address"
            />
          </FormRow>
        </View>
      </View>
    );
  }
}

export class PatientDocumentPage extends Component {
  props: {
    id: string,
  };
  state: {
    upload: ?Upload,
  };

  constructor(props: any) {
    super(props);
    const patientDocument: PatientDocument = getCachedItem(props.id);
    const uploadId: ?string = patientDocument.uploadId;
    this.state = {
      upload: getCachedItem(uploadId),
    };
    this.loadUpload(uploadId);
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.id === this.props.id) return;
    const patientDocument: PatientDocument = getCachedItem(this.props.id);
    const uploadId: ?string = patientDocument.uploadId;
    this.state = {
      upload: getCachedItem(uploadId),
    };
    this.loadUpload(uploadId);
  }

  async loadUpload(uploadId: ?string) {
    if (!uploadId) return;
    let upload: Upload = await fetchUpload(uploadId);
    this.setState({upload});
  }

  render() {
    if (!this.state.upload) return null;
    const mimeType: string = getMimeType(this.state.upload);
    if (mimeType === 'application/pdf;base64')
      return <Pdf upload={this.state.upload} style={styles.patientDocument} />;
    if (mimeType === 'image/jpeg;base64' || mimeType === 'image/png;base64')
      return (
        <ScrollView
          style={styles.patientDocument}
          maximumZoomScale={2}
          minimumZoomScale={0.5}>
          <Image
            source={{uri: `data:${mimeType},${this.state.upload.data}`}}
            style={styles.patientDocument}
          />
        </ScrollView>
      );
    return (
      <View style={styles.errorCard}>
        <Text style={styles.cardTitle}>
          {strings.formatString(
            strings.unsupportedDocumentError,
            this.state.upload.name,
          )}
        </Text>
      </View>
    );
  }
}

export class PatientScreen extends Component {
  props: {
    navigation: any,
  };
  params: {
    patientInfo: PatientInfo,
    refreshStateKey?: string,
  };
  state: {
    patientInfo: PatientInfo,
    isDirty: boolean,
  };

  constructor(props: any) {
    super(props);
    let params = this.props.navigation.state.params;
    const isDirty: boolean = params.patientInfo.errors;
    this.state = {
      patientInfo: isDirty
        ? params.patientInfo
        : getCachedItem(params.patientInfo.id),
      isDirty,
    };
    if (!isDirty) {
      this.refreshPatientInfo();
    }
  }

  componentWillUnmount() {
    if (this.state.isDirty) {
      this.asyncComponentWillUnmount();
    }
  }

  async asyncComponentWillUnmount() {
    let patientInfo: RestResponse = await storePatientInfo(
      this.state.patientInfo,
    );
    if (patientInfo.errors) {
      this.props.navigation.navigate('patient', {patientInfo: patientInfo});
    } else if (this.props.navigation.state.params.refreshStateKey) {
      const setParamsAction = NavigationActions.setParams({
        params: {refresh: true},
        key: this.props.navigation.state.params.refreshStateKey,
      });
      this.props.navigation.dispatch(setParamsAction);
    }
  }

  async refreshPatientInfo() {
    const patientInfo: PatientInfo = await fetchPatientInfo(
      this.props.navigation.state.params.patientInfo.id,
      this.state.isDirty,
    );
    this.setState({patientInfo, isDirty: false});
  }

  updatePatientInfo = (patientInfo: PatientInfo) => {
    this.setState({patientInfo: patientInfo, isDirty: true});
  };

  renderRefreshIcon() {
    if (!this.state.isDirty) return null;
    return (
      <TouchableOpacity onPress={() => this.refreshPatientInfo()}>
        <Refresh style={styles.screenIcon} />
      </TouchableOpacity>
    );
  }

  renderIcons() {
    return <View style={styles.examIcons}>{this.renderRefreshIcon()}</View>;
  }

  render() {
    return (
      <KeyboardAwareScrollView keyboardShouldPersistTaps="handled">
        <PatientTitle patientInfo={this.state.patientInfo} />
        <ErrorCard errors={this.state.patientInfo.errors} />
        <PatientContact
          patientInfo={this.state.patientInfo}
          onUpdatePatientInfo={this.updatePatientInfo}
        />
        {this.renderIcons()}
      </KeyboardAwareScrollView>
    );
  }
}

export class CabinetScreen extends Component {
  props: {
    navigation: any,
  };
  state: {
    patientInfo: ?PatientInfo,
    appointments: ?(Appointment[]),
  };

  constructor(props: any) {
    super(props);
    this.state = {
      patientInfo: undefined,
      appointments: undefined,
    };
  }

  async selectPatient(patient: Patient) {
    if (!patient) {
      if (!this.state.patientInfo) return;
      !isWeb && LayoutAnimation.easeInEaseOut();
      this.setState({patientInfo: undefined, appointments: undefined});
      return;
    } else if (
      this.state.patientInfo &&
      this.state.patientInfo.id === patient.id
    ) {
      this.props.navigation.navigate('appointment', {
        patientInfo: this.state.patientInfo,
        hasAppointment: this.hasAppointment(),
      }); //TODO: refreshStateKey: this.props.refreshStateKey?
      return;
    }
    let patientInfo: ?PatientInfo = getCachedItem(patient.id);
    !isWeb && LayoutAnimation.easeInEaseOut();
    this.setState({patientInfo, appointments: undefined});
    patientInfo = await fetchPatientInfo(patient.id);
    if (
      this.state.patientInfo === undefined ||
      patient.id !== this.state.patientInfo.id
    )
      return;
    this.setState({patientInfo});
    let appointments: ?(Appointment[]) = await fetchAppointments(
      undefined,
      undefined,
      1,
      patientInfo.id,
    );
    if (
      this.state.patientInfo === undefined ||
      patient.id !== this.state.patientInfo.id
    )
      return;
    !isWeb && LayoutAnimation.easeInEaseOut();
    this.setState({appointments});
  }

  hasAppointment(): boolean {
    let todaysAppointments: Appointment[] = [];
    if (!this.state.appointments && this.state.patientInfo) {
      const appointments: Appointment[] = getCachedItem(
        'appointmentsHistory-' + this.state.patientInfo.id,
      );
      todaysAppointments = appointments;
    } else if (this.state.appointments && this.state.appointments.length > 0) {
      todaysAppointments = this.state.appointments;
    }
    if (todaysAppointments) {
      todaysAppointments = todaysAppointments.filter(
        (appointment: Appointment) => isToday(appointment.start),
      );
      return todaysAppointments && todaysAppointments.length > 0;
    }

    return false;
  }

  newPatient = () => {
    const store: Store = getStore();
    const newPatient: PatientInfo = {
      firstName: undefined,
      lastName: undefined,
      cell: undefined,
      id: 'patient',
      countryId: store.country,
      province: store.pr,
      gender: 0,
    };
    this.setState({patientInfo: newPatient});
  };

  updatePatientInfo = (patientInfo: PatientInfo): void => {
    this.setState({patientInfo});
  };

  async createPatient() {
    let patientInfo: PatientInfo = this.state.patientInfo;
    patientInfo = await storePatientInfo(this.state.patientInfo);
    if (patientInfo.errors) {
      this.setState({patientInfo});
      return;
    }
    const appointment: Appointment = {id: undefined, patientId: patientInfo.id};
    this.props.navigation.navigate('appointment', {appointment});
  }

  renderAppointments() {
    if (!this.state.appointments || this.state.appointments.length === 0)
      return null;
    return (
      <View style={styles.centeredColumnLayout}>
        <View style={styles.topFlow}>
          {this.state.appointments.map(
            (appointment: Appointment, index: number) => (
              <AppointmentSummary
                key={index}
                appointment={appointment}
                onPress={() =>
                  this.props.navigation.navigate('appointment', {appointment})
                }
              />
            ),
          )}
        </View>
      </View>
    );
  }

  renderPatientInfo() {
    if (!this.state.patientInfo) return;
    if (this.state.patientInfo.id === 'patient') {
      return (
        <View style={styles.separator}>
          <PatientContact
            patientInfo={this.state.patientInfo}
            onUpdatePatientInfo={this.updatePatientInfo}
          />
          <View style={styles.centeredRowLayout}>
            <Button
              title={strings.createPatient}
              onPress={() => this.createPatient()}
              testID="createPatientButton"
            />
          </View>
        </View>
      );
    }
    return (
      <View style={styles.separator}>
        <PatientCard
          patientInfo={this.state.patientInfo}
          navigate="appointment"
          navigation={this.props.navigation}
          style={styles.tabCardS}
          hasAppointment={this.hasAppointment()}
        />
        {this.renderAppointments()}
      </View>
    );
  }

  render() {
    return (
      <KeyboardAwareScrollView
        scrollEnable={true}
        keyboardShouldPersistTaps="handled">
        <FindPatient
          onSelectPatient={(patient: Patient) => this.selectPatient(patient)}
          onNewPatient={this.newPatient}
        />
        {this.renderPatientInfo()}
      </KeyboardAwareScrollView>
    );
  }
}

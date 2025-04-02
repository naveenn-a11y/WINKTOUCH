/**
 * @flow
 */

'use strict';

import { CommonActions } from '@react-navigation/native';
import { Component } from 'react';
import {
  FlatList,
  Image,
  Keyboard,
  LayoutAnimation,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  AppointmentSummary,
  fetchAppointments,
  isAppointmentLocked,
  pushToHarmony,
} from './Appointment';
import { formatCode, getAllCodes } from './Codes';
import { getCachedItem, getCachedItems } from './DataCache';
import { getStore } from './DoctorApp';
import { Pdf } from './Document';
import { PaperClip, Refresh } from './Favorites';
import { PatientSearch } from './FindPatient';
import { ErrorCard, FormField, FormRow } from './Form';
import { loadDocuments } from './ImageField';
import { printBase64Pdf } from './Print';
import { fetchItemById, getPrivileges, searchItems, storeItem, stripDataType } from './Rest';
import { strings } from './Strings';
import { isWeb, styles } from './Styles';
import {
  PRIVILEGE,
  type Appointment,
  type CodeDefinition,
  type Patient,
  type PatientDocument,
  type PatientInfo,
  type PatientTag,
  type RestResponse,
  type Upload,
} from './Types';
import { fetchUpload, getMimeType } from './Upload';
import { ManageUsers } from './User';
import {
  formatAge,
  formatDate,
  isEmpty,
  isToday,
  prefix,
  yearDateTimeFormat,
} from './Util';
import { CustomModal as Modal } from './utilities/Modal';
import { Binoculars, Button, NativeBar } from './Widgets';

type Props = {
  fieldId: string; // Assuming this prop exists for accessibility labels
}

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
  showAllDocuments: boolean = false,
) {
  const searchCriteria = {patientId, category, showAllDocuments};
  let restResponse = await searchItems('PatientDocument/list', searchCriteria);
  return restResponse;
}

export async function storePatientDocument(patientDocument: PatientDocument) {
  patientDocument = await storeItem(patientDocument);
  return patientDocument;
}

export function getPatientFullName(patient: Patient | PatientInfo): string {
  if (patient === undefined || patient === null) {
    return;
  }
  const alias: string = isEmpty(patient.alias)
    ? ' '
    : ' (' + patient.alias.trim() + ') ';
  return patient.firstName.trim() + alias + patient.lastName.trim();
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
    /*
    if (
      this.state.patientTags === undefined ||
      this.state.patientTags.includes(undefined)
    ) {
      this.refreshPatientTags();
    }*/
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.patient.id === prevProps.patient.id &&
      this.props.patient.patientTags === prevProps.patient.patientTags
    ) {
      return;
    }
    this.setState(
      {
        patientTags: getCachedItems(this.props.patient.patientTags),
      },
      //this.refreshPatientTags,
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
    if (!this.props.patient) {
      return null;
    }
    let genderShort: string = formatCode(
      'genderCode',
      this.props.patient.gender,
    );
    if (genderShort.length > 0) {
      genderShort = genderShort.substring(0, 1);
    }
    if (!this.state.patientTags || this.state.patientTags.length === 0) {
      if (this.props.showDescription) {
        return null;
      }
      return (
        <View style={styles.rowLayout}>
          <Text style={this.props.locked ? [styles.grayedText, styles.boldText] : [styles.text, styles.boldText]}>
            {' '}({genderShort})
          </Text>
        </View>
      );
    }
    return this.props.showDescription ? (
      <View style={styles.rowLayout}>
        {this.state.patientTags &&
          this.state.patientTags.map(
            (patientTag: PatientTag, index: number) => (
              <Text
                key={index}
                style={this.props.locked ? styles.grayedText : styles.text}>
                {patientTag && patientTag.name}{' '}
              </Text>
            ),
          )}
      </View>
    ) : (
      <View style={styles.rowLayout}>
        <Text style={this.props.locked ? [styles.grayedText, styles.boldText] : [styles.text, styles.boldText]}>
          {' '}
          ({genderShort})
        </Text>
        {this.state.patientTags &&
          this.state.patientTags.map(
            (patientTag: PatientTag, index: number) => (
              <Text
                key={index}
                style={this.props.locked ? styles.grayedText : styles.text}>
                {' '}({patientTag && patientTag.letter})
              </Text>
            ),
          )}
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
    isBookingAppointment?: boolean,
    onSelectPatient: (patient: Patient | PatientInfo) => void,
  };
  static defaultProps = {
    navigate: 'patient',
    isBookingAppointment: false,
  };

  render() {
    if (!this.props.patientInfo) {
      return null;
    }
    return (
      <TouchableOpacity
        onPress={() =>
          this.props.isBookingAppointment
            ? this.props.onSelectPatient(this.props.patientInfo)
            : this.props.navigation.navigate(this.props.navigate, {
                patientInfo: this.props.patientInfo,
                refreshStateKey: this.props.refreshStateKey,
                hasAppointment: this.props.hasAppointment,
              })
        }
        testID="patientContact">
        <View style={this.props.style ? this.props.style : styles.paragraph}>
          <Text style={styles.cardTitleLeft}>
            {getPatientFullName(this.props.patientInfo)}
          </Text>
          <View style={styles.formRow}>
            <View style={styles.flexColumnLayout}>
              <Text style={styles.text}>
                {formatCode('genderCode', this.props.patientInfo.gender)}
                {this.props.patientInfo.dateOfBirth
                  ? this.props.patientInfo.gender === 0
                    ? ` ${strings.ageM}`
                    : ` ${strings.ageF}`
                  : ''}
                {this.props.patientInfo.dateOfBirth
                  ? ' ' + formatAge(this.props.patientInfo.dateOfBirth) +
                    '  (' +
                    this.props.patientInfo.dateOfBirth +
                    ')'
                  : ''}
                {this.props.patientInfo.occupation && 
                !isEmpty(this.props.patientInfo.occupation) &&
                `, ${this.props.patientInfo.occupation}`}
              </Text>
              <Text style={styles.text}>
                z{stripDataType(this.props.patientInfo.id)}
              </Text>
              <Text style={styles.text}>
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
    if (!this.props.patientInfo) {
      return null;
    }
    return (
      <Text style={styles.screenTitle}>
        {getPatientFullName(this.props.patientInfo)}
      </Text>
    );
  }
}

export class PatientBillingInfo extends Component {
  props: {
    patient: PatientInfo,
  };
  render() {
    if (!this.props.patient) {
      return null;
    }
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
    findDoctor: () => void,
  };

  constructor(props: any) {
    super(props);
  }

  render() {
    const hasPatientFullAccess: boolean = getPrivileges().patientPrivilege === PRIVILEGE.FULLACCESS;

    return (
      <View style={styles.tabCard}>
        <Text style={styles.cardTitle}>Contact</Text>
        <View style={styles.form}>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="firstName"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="words"
            />
            <FormField
              value={this.props.patientInfo}
              fieldName="lastName"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="words"
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="alias"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="words"
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="streetNumber"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              type="numeric"
            />
            <FormField
              value={this.props.patientInfo}
              fieldName="streetName"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="words"
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="unit"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="words"
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="city"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="words"
            />
            <FormField
              value={this.props.patientInfo}
              fieldName="postalCode"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="characters"
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="province"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="characters"
            />
            <FormField
              value={this.props.patientInfo}
              fieldName="countryId"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="characters"
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="phone"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              type="phone-pad"
            />
            <FormField
              value={this.props.patientInfo}
              fieldName="cell"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              type="phone-pad"
            />
          </FormRow>
          {this.props.patientInfo?.phoneOrCellError &&<FormRow><Text style={styles.helperTextError}>{strings.homePhoneOrCellRequired}</Text></FormRow>}
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="dateOfBirth"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              type="pastDate"
            />
            <FormField
              value={this.props.patientInfo}
              fieldName="gender"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="medicalCard"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="characters"
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="medicalCardVersion"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="characters"
            />
            <FormField
              value={this.props.patientInfo}
              fieldName="medicalCardExp"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="characters"
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="familyDoctorId"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="characters"
            />
            <Binoculars
              style={styles.groupIcon}
              onClick={this.props.findDoctor}
              disabled={!hasPatientFullAccess}
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="occupation"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              autoCapitalize="words"
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.patientInfo}
              fieldName="email"
              readonly={!hasPatientFullAccess}
              onChangeValue={this.props.onUpdatePatientInfo}
              type="email-address"
            />
          </FormRow>
        </View>
      </View>
    );
  }
}

export class PatientDocumentAttachments extends Component {
  props: {
    patientInfo: PatientInfo,
  };
  state: {
    patientDocuments: PatientDocument[],
    consentDocuments: PatientDocument[],
    loadedConsentDocuments: PatientDocument[],
    intakeDocuments: PatientDocument[],
    loadedIntakeDocuments: PatientDocument[],
    otherDocuments: PatientDocument[],
    loadedOtherDocuments: PatientDocument[],
    allPatientDocuments: PatientDocument[],
  };

  constructor(props: any) {
    super(props);
    this.state = {
      consentDocuments: [],
      loadedConsentDocuments: [],
      intakeDocuments: [],
      loadedIntakeDocuments: [],
      otherDocuments: [],
      loadedOtherDocuments: [],
      allPatientDocuments: [],
    };
  }
  componentDidMount() {
    this.loadPatientDocument();
  }

  isConsentForm(document: PatientDocument) {
    return document.name === 'Patient Consent Form'
  }

  isIntakeForm(document: PatientDocument) {
    return document.category === 'Intake Form'
  }

  isOtherForm(document: PatientDocument) {
    return !this.isConsentForm(document) && !this.isIntakeForm(document)
  }
  
  async loadPatientDocument() {
    const filterId: string = 'Patient Consent Form';
    let allDocuments = await loadDocuments(
      ' ',
      this.props.patientInfo.id,
      true,
    )

    let allPatientDocuments = allDocuments.sort((a, b) => new Date(b.postedOn).getTime() - new Date(a.postedOn).getTime());

    let consentDocuments = [];
    let intakeDocuments = []
    let otherDocuments = [];

    allPatientDocuments?.forEach(
      (patientDocument: PatientDocument) => {
        if (this.isConsentForm(patientDocument)) {
          consentDocuments.push(patientDocument);
        }

        if (this.isIntakeForm(patientDocument)) {
          intakeDocuments.push(patientDocument)
        }
        
        if (this.isOtherForm(patientDocument)) {
          otherDocuments.push(patientDocument);
        }
      } 
    );

    // initialize only the first 5 documents to loadedContentDocuments and loadedOtherDocuments
    const loadedConsentDocuments = consentDocuments.slice(0, 5);
    const loadedIntakeDocuments = intakeDocuments.slice(0, 5);
    const loadedOtherDocuments = otherDocuments.slice(0, 5);

    this.setState({
      consentDocuments,
      loadedConsentDocuments,
      intakeDocuments,
      loadedIntakeDocuments,
      otherDocuments,
      loadedOtherDocuments,
      allPatientDocuments,
    });
  }

  async getUpload(patientDocument: PatientDocument) {
    let upload: ?Upload = getCachedItem(patientDocument.uploadId);
    if (upload === undefined) {
      upload = await fetchUpload(patientDocument.uploadId);
    }
    if (upload && upload.data) {
      printBase64Pdf(upload.data);
    }
  }

  renderDocumentItem = ({ item }: { item: PatientDocument }) => (
    <View style={styles.attachment} key={item.id}>
      <FormRow>
        {item.uploadId && (
          <TouchableOpacity
            onPress={() => this.getUpload(item)}
            testID={this.props.fieldId + '.paperclipIcon'}>
            <Text style={styles.textLeft}>
              {patientDocument.name}{' '}
            </Text>
            <Text style={styles.textLeft}>
              {strings.lastUpdateOn}:
              {formatDate(
                item.postedOn,
                yearDateTimeFormat,
              )}
            </Text>
            <PaperClip
              style={styles.textIcon}
              color="black"
              key="paperclip"
            />
          </TouchableOpacity>
        )}
      </FormRow>
    </View>
  );

  keyExtractor = (item: PatientDocument) => item.id;

  renderDocumentList = (groupLabel: String, documentList: PatientDocument[], loadedDocumentList: PatientDocument[]) => (
    <View style={styles.tabCard}>
      <Text style={styles.cardTitle}>{groupLabel}</Text>
      <FlatList
        data={loadedDocumentList}
        renderItem={this.renderDocumentItem}
        keyExtractor={this.keyExtractor}
      />
      {this.renderLoadMoreLink(groupLabel, documentList, loadedDocumentList)}
    </View>
  );

  renderDocumentList = (groupLabel: String, documentList: PatientDocument[], loadedDocumentList: PatientDocument[]) => (
    <View style={styles.tabCard}>
      <Text style={styles.cardTitle}>{groupLabel}</Text>
      <FlatList
        data={loadedDocumentList}
        renderItem={this.renderDocumentItem}
        keyExtractor={this.keyExtractor}
      />
      {this.renderLoadMoreLink(groupLabel, documentList, loadedDocumentList)}
    </View>
  );

  renderDocumentItem = ({ item }: { item: PatientDocument }) => (
    <View style={styles.attachment} key={item.id}>
      <FormRow>
        {item.uploadId && (
          <TouchableOpacity
            onPress={() => this.getUpload(item)}
            accessibilityLabel={this.props.fieldId + '.paperclipIcon'}>
            <Text style={styles.textLeft}>
              {item.name}{' '}
            </Text>
            <Text style={styles.textLeft}>
              Last update on:
              {formatDate(item.postedOn, 'YYYY-MM-DD HH:mm')} {/* Assuming you have a specific format */}
            </Text>
            <PaperClip style={styles.textIcon} color="black" />
          </TouchableOpacity>
        )}
      </FormRow>
    </View>
  );

  renderLoadMoreLink = (groupLabel: String, documentList : PatientDocument[], loadedDocumentList: PatientDocument[]) => {
    if (documentList.length <= 5) return null

    if (documentList.length === loadedDocumentList.length) return null

    return (
      <View>
        <Pressable style={styles.loadMoreContainer} onPress={() => this.loadMoreDocuments(groupLabel, documentList, loadedDocumentList)}>
          <Text style={styles.loadMoreText}>{strings.loadMore}</Text>
        </Pressable>
      </View>
    )
  }

  loadMoreDocuments = (groupLabel: String, documentList : PatientDocument[], loadedDocumentList: PatientDocument[]) => {
    const remainingDocuments = documentList.slice(loadedDocumentList.length, loadedDocumentList.length + 5);
    const newLoadedDocumentList = [...loadedDocumentList, ...remainingDocuments];

   if (groupLabel === strings.consentForms) {
      this.setState({ loadedConsentDocuments: newLoadedDocumentList });
   }
   if (groupLabel === strings.intakeForms) {
      this.setState({ loadedIntakeDocuments: newLoadedDocumentList });
   }
   if (groupLabel === strings.otherForms) {
      this.setState({ loadedOtherDocuments: newLoadedDocumentList });
   }
  }

  render() {
    if (
      this.state.allPatientDocuments === undefined ||
      this.state.allPatientDocuments.length < 1
    ) {
      return null;
    }
    return (
      <View style={styles.attachementContainer}>
        {this.renderDocumentList(strings.consentForms, this.state.consentDocuments, this.state.loadedConsentDocuments)}
        {this.renderDocumentList(strings.intakeForms, this.state.intakeDocuments, this.state.loadedIntakeDocuments)}
        {this.renderDocumentList(strings.otherForms, this.state.otherDocuments, this.state.loadedOtherDocuments)}
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
    if (prevProps.id === this.props.id) {
      return;
    }
    const patientDocument: PatientDocument = getCachedItem(this.props.id);
    const uploadId: ?string = patientDocument.uploadId;
    this.state = {
      upload: getCachedItem(uploadId),
    };
    this.loadUpload(uploadId);
  }

  async loadUpload(uploadId: ?string) {
    if (!uploadId) {
      return;
    }
    let upload: Upload = await fetchUpload(uploadId);
    this.setState({upload});
  }

  render() {
    if (!this.state.upload) {
      return null;
    }
    const mimeType: string = getMimeType(this.state.upload);
    if (mimeType === 'application/pdf;base64') {
      return <Pdf upload={this.state.upload} style={styles.patientDocument} />;
    }
    if (mimeType === 'image/jpeg;base64' || mimeType === 'image/png;base64') {
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
    }
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
    isPopupVisibile: boolean,
    pushToHarmonyLoading: boolean,
    showSnackBar: boolean,
    snackBarMessage: string,
  };

  constructor(props: any) {
    super(props);
    let params = this.props.route.params;
    const isDirty: boolean = params.patientInfo.errors;
    this.state = {
      patientInfo: isDirty
        ? params.patientInfo
        : getCachedItem(params.patientInfo.id),
      isDirty,
      isPopupVisibile: false,
      pushToHarmonyLoading: false,
      showSnackBar: false,
      snackBarMessage: undefined,
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
      this.props.navigation.navigate('patient', {patientInfo: patientInfo, refreshStateKey: this.props.route?.params?.refreshStateKey});
    } else if (this.props.route.params.refreshStateKey) {
      const setParamsAction = CommonActions.setParams({
        refresh: true,
        key: this.props.route.params.refreshStateKey,
      });
      this.props.navigation.dispatch({...setParamsAction, source: this.props.route.params.refreshStateKey});
    }
  }

  async refreshPatientInfo() {
    const patientInfo: PatientInfo = await fetchPatientInfo(
      this.props.route.params.patientInfo.id,
      this.state.isDirty,
    );
    this.setState({patientInfo, isDirty: false});
  }

  updatePatientInfo = (patientInfo: PatientInfo) => {
    this.setState({patientInfo: patientInfo, isDirty: true});
  };

  showSnackBar() {
    this.setState({showSnackBar: true});
  }
  hideSnackBar() {
    this.setState({showSnackBar: false});
  }

  setSnackBarMessage(message: string) {
    this.setState({snackBarMessage: message});
  }
  isHarmonyAvailable(): boolean {
    const harmonySetting: CodeDefinition[] = getAllCodes('harmonySettingCode');
    if (harmonySetting && harmonySetting instanceof Array) {
      const harmonySettingCode: CodeDefinition = harmonySetting[0];
      return harmonySettingCode && harmonySettingCode.code;
    }
    return false;
  }

  pushToHarmony = async () => {
    this.setState({pushToHarmonyLoading: true});
    let patientInfo: PatientInfo | RestResponse = this.state.patientInfo;
    if (this.state.isDirty) {
      patientInfo = await storePatientInfo(this.state.patientInfo);
      if (!patientInfo.errors) {
        this.setState({patientInfo: patientInfo, isDirty: false});
      } else {
        this.setState({patientInfo: patientInfo});
      }
    }
    if (!patientInfo.errors) {
      const success: boolean = await pushToHarmony(patientInfo.id);
      if (success) {
        this.setSnackBarMessage(strings.sendToHarmonySuccessMessage);
        this.showSnackBar();
      }
    }
    this.setState({pushToHarmonyLoading: false});
  };

  renderRefreshIcon() {
    if (!this.state.isDirty) {
      return null;
    }
    return (
      <TouchableOpacity onPress={() => this.refreshPatientInfo()}>
        <Refresh style={styles.screenIcon} />
      </TouchableOpacity>
    );
  }

  renderIcons() {
    return <View style={styles.examIcons}>{this.renderRefreshIcon()}</View>;
  }

  cancelEdit = () => {
    this.setState({isPopupVisibile: false});
  };

  renderManageUsersPopup() {
    return (
      <View style={styles.screeen}>
        <ManageUsers onClose={this.cancelEdit} />
      </View>
    );
  }

  renderSearchDoctorModal = () => {
    this.setState({isPopupVisibile: true});
  };

  renderSnackBar() {
    return (
      <NativeBar
        message={this.state.snackBarMessage}
        onDismissAction={() => this.hideSnackBar()}
      />
    );
  }

  render() {
    return (
      <KeyboardAwareScrollView keyboardShouldPersistTaps="handled">
        <PatientTitle patientInfo={this.state.patientInfo} />
        <ErrorCard errors={this.state.patientInfo.errors} />
        <PatientContact
          patientInfo={this.state.patientInfo}
          onUpdatePatientInfo={this.updatePatientInfo}
          findDoctor={this.renderSearchDoctorModal}
          onPushToHarmony={this.pushToHarmony}
        />
        {this.isHarmonyAvailable() && (
          <View style={styles.centeredRowLayout}>
            <Button
              loading={this.state.pushToHarmonyLoading}
              title={strings.sendToHarmony}
              onPress={() => this.pushToHarmony()}
              testID="sendToHarmonyButton"
            />
          </View>
        )}
        <PatientDocumentAttachments patientInfo={this.state.patientInfo} />
        {this.renderIcons()}
        {this.state.isPopupVisibile && (
          <Modal
            visible={this.state.isPopupVisibile}
            transparent={true}
            animationType={'fade'}
            onRequestClose={this.cancelEdit}>
            {this.renderManageUsersPopup()}
          </Modal>
        )}
        {this.state.showSnackBar && this.renderSnackBar()}
      </KeyboardAwareScrollView>
    );
  }
}

export class CabinetScreen extends Component {
  props: {
    navigation: any,
    route: any,
    onSelectPatient: (patient: Patient | PatientInfo) => void,
    openWaitingListDialog: () => void,
    isBookingAppointment?: boolean,
  };
  state: {
    patientInfo: ?PatientInfo,
    appointments: ?(Appointment[]),
    isPopupVisibile: Boolean,
    createPatientloading: Boolean,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      patientInfo: undefined,
      appointments: undefined,
      isPopupVisibile: false,
      createPatientloading: false,
    };
  }
  static defaultProps = {
    isBookingAppointment: false,
  };

  componentDidUpdate(prevProps: any) {
    let params = this.props.route.params;
    if (params && params.refresh === true) {
      if (this.state.patientInfo) {
        this.updateAppointments();
      }
      this.props.navigation.setParams({refresh: false});
    }
  }
  updateAppointments() {
    const appointments: Appointment[] = getCachedItems(
      this.state.appointments.map((app) => app.id),
    );
    this.setState({appointments});
  }

  async selectPatient(patient: Patient) {
    if (!patient) {
      if (!this.state.patientInfo) {
        return;
      }
      !isWeb && LayoutAnimation.easeInEaseOut();
      this.setState({patientInfo: undefined, appointments: undefined});
      return;
    } else if (
      this.state.patientInfo &&
      this.state.patientInfo.id === patient.id
    ) {
      if (this.props.isBookingAppointment) {
        this.props.onSelectPatient(patient);
      } else {
        this.props.navigation.navigate('appointment', {
          patientInfo: this.state.patientInfo,
          hasAppointment: this.hasAppointment(),
        }); //TODO: refreshStateKey: this.props.refreshStateKey?
      }
      return;
    }
    let patientInfo: ?PatientInfo = getCachedItem(patient.id);
    !isWeb && LayoutAnimation.easeInEaseOut();
    this.setState({patientInfo, appointments: undefined});
    patientInfo = await fetchPatientInfo(patient.id);
    if (
      this.state.patientInfo === undefined ||
      patient.id !== this.state.patientInfo.id
    ) {
      return;
    }
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
    ) {
      return;
    }
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
      gender: 2,
    };
    this.setState({patientInfo: newPatient});
    return newPatient;
  };

  updatePatientInfo = (patientInfo: PatientInfo): void => {
    if((patientInfo?.phone && patientInfo?.phone?.trim().length > 0) || (patientInfo?.cell && patientInfo?.cell?.trim().length > 0)) {
      patientInfo.phoneOrCellError = undefined;
    }
    this.setState({patientInfo});
  };

  async createPatient() {
    let patientInfo: PatientInfo = this.state.patientInfo;
    patientInfo = await storePatientInfo(this.state.patientInfo);
    this.setState({createPatientloading: false});
    if (patientInfo.errors) {
      this.setState({patientInfo});
      return;
    }
    const appointment: Appointment = {id: undefined, patientId: patientInfo.id};
    if (this.props.isBookingAppointment) {
      this.props.onSelectPatient(patientInfo);
    } else {
      this.props.navigation.navigate('appointment', {appointment});
    }
  }

  cancelEdit = () => {
    this.setState({isPopupVisibile: false});
  };

  renderManageUsersPopup() {
    return (
      <View style={styles.screeen}>
        <ManageUsers onClose={this.cancelEdit} />
      </View>
    );
  }

  renderSearchDoctorModal = () => {
    this.setState({isPopupVisibile: true});
  };

  renderAppointments() {
    if (!this.state.appointments || this.state.appointments.length === 0) {
      return null;
    }
    return (
      <ScrollView style={styles.appointments}>
        {this.state.appointments.map(
          (appointment: Appointment, index: number) => (
            <AppointmentSummary
              key={index}
              appointment={appointment}
              locked={isAppointmentLocked(appointment)}
              onPress={() =>
                this.props.navigation.navigate('appointment', {appointment})
              }
            />
          ),
        )}
      </ScrollView>
    );
  }

  onCreatePatient = async () => {
    Keyboard.dismiss();
    this.setState({createPatientloading: true});
    setTimeout(() => this.createPatient(), 3000);
  }

  renderNewPatient() {
    const hasPatientFullAccess: boolean = getPrivileges().patientPrivilege === PRIVILEGE.FULLACCESS;
    return (
      <View style={styles.separator}>
        <PatientContact
          patientInfo={this.state.patientInfo}
          onUpdatePatientInfo={this.updatePatientInfo}
          findDoctor={this.renderSearchDoctorModal}
        />
        <View style={styles.centeredRowLayout}>
          <Button
            title={strings.createPatient}
            onPress={this.onCreatePatient}
            loading={this.state.createPatientloading}
            disabled={!hasPatientFullAccess}
            testID="createPatientButton"
          />
        </View>
        {this.state.isPopupVisibile && (
          <Modal
            visible={this.state.isPopupVisibile}
            transparent={true}
            animationType={'fade'}
            onRequestClose={this.cancelEdit}>
            {this.renderManageUsersPopup()}
          </Modal>
        )}
      </View>
    );
  }

  renderPatientInfo() {
    if (!this.state.patientInfo) {
      return;
    }
    return (
      <View style={styles.separator}>
        <PatientCard
          patientInfo={this.state.patientInfo}
          navigate="appointment"
          navigation={this.props.navigation}
          style={styles.tabCardS}
          hasAppointment={this.hasAppointment()}
          isBookingAppointment={this.props.isBookingAppointment}
          onSelectPatient={(patient: Patient | PatientInfo) =>
            this.props.onSelectPatient(patient)
          }
        />
        <View style={styles.checkButtonLayout}>
          <Button
            title={
              this.props.isBookingAppointment ? strings.select : strings.open
            }
            onPress={() => {
              this.props.isBookingAppointment
                ? this.props.onSelectPatient(this.state.patientInfo)
                : this.props.navigation.navigate('appointment', {
                    patientInfo: this.state.patientInfo,
                    refreshStateKey: this.props.refreshStateKey,
                    hasAppointment: this.hasAppointment(),
                  });
            }}
          />
        </View>
        {!this.props.isBookingAppointment && this.renderAppointments()}
      </View>
    );
  }

  render() {
    return (
      <PatientSearch
        onSelectPatient={(patient: Patient) => this.selectPatient(patient)}
        openWaitingListDialog={this.props.openWaitingListDialog}
        onNewPatient={this.newPatient}
        renderPatientInfo={() => this.renderPatientInfo()}
        renderNewPatient={() => this.renderNewPatient()}
      />
    );
  }
}

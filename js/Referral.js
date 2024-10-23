/**
 * @flow
 */
'use strict';

import {Visit} from './Types';

import React, {Component} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {styles, selectionColor, isWeb} from './Styles';
import {
  Button,
  TilesField,
  Label,
  SelectionList,
  Binoculars,
  Alert,
} from './Widgets';
import {FormRow, FormTextInput, FormField, FormCode} from './Form';
import {getAllCodes, getCodeDefinition, formatCodeDefinition} from './Codes';
import {fetchWinkRest} from './WinkRest';
import type {
  HtmlDefinition,
  ReferralDocument,
  ImageBase64Definition,
  ReferralDefinition,
  CodeDefinition,
  EmailDefinition,
  FollowUp,
} from './Types';
import {allExamIds, fetchVisit, getPreviousVisits} from './Visit';
import {getCachedItems, getCachedItem} from './DataCache';
import {renderExamHtml, getExam, UserAction} from './Exam';
import {stripDataType} from './Rest';
import {
  initValues,
  getImageBase64Definition,
  patientHeader,
  patientFooter,
  getSelectedPDFAttachment,
  renderAttachment,
  addEmbeddedAttachment,
} from './PatientFormHtml';
import {
  printHtml,
  generatePDF,
  addPDFAttachment,
} from '../src/components/HtmlToPdf';
import RNBeep from '@dashdoc/react-native-system-sounds';
import {getStore} from './DoctorApp';
import {
  isEmpty,
  sort,
  yearDateFormat,
  yearDateTime24Format,
  formatDate,
  isSameDay,
  parseDate,
} from './Util';
import {strings} from './Strings';
import {FollowUpScreen} from './FollowUp';
import {getVisitHistory} from './Visit';
import {ManageUsers} from './User';
import {FormOptions} from './Form';
import {Microphone} from './Voice';
import {HtmlEditor} from '../src/components/TinyMceEditor/HtmlEditor';
import {CustomModal as Modal} from './utilities/Modal';


export function isReferralsEnabled(): boolean {
  const referralTemplates: string[] = getAllCodes('referralTemplates');
  if (
    referralTemplates === undefined ||
    referralTemplates === null ||
    referralTemplates.length === 0
  ) {
    return false;
  }
  return true;
}

const COMMAND = {
  EMAIL: 0,
  FAX: 1,
  PRINT: 2,
  SIGN: 3,
  SAVE: 4,
};

type ReferralScreenProps = {
  navigation: any,
};

type ReferralScreenState = {
  template: ?string,
  selectedField: string[],
  htmlDefinition: ?(HtmlDefinition[]),
  doctorId: ?number | string,
  doctorReferral: ?ReferralDefinition,
  linkedDoctorReferral: ?ReferralDefinition,
  isActive: ?boolean,
  emailDefinition: ?EmailDefinition,
  command: ?number,
  isPopupVisibile: ?boolean,
  hasSignatureField: ?boolean,
  isDirty: boolean,
  followUpStateKey: string,
  isLoading: boolean,
  isVisitLoading: boolean,
  referralHtml: string,
  selectedVisitId: string,
  referralStarted: boolean,
  builtInTemplates: ?any,
  showBuiltInDialog: ?boolean,
};

export class ReferralScreen extends Component<
  ReferralScreenProps,
  ReferralScreenState,
> {
  editor: ?HtmlEditor;
  unmounted: boolean;

  constructor(props: ReferralScreenProps) {
    super(props);
    this.state = {
      template:
        this.props.route &&
        this.props.route.params &&
        this.props.route.params.referral &&
        this.props.route.params.referral.referralTemplate &&
        !this.props.route.params.followUp
          ? this.props.route.params.referral.referralTemplate
              .template
          : undefined,
      selectedField: [undefined, undefined, undefined, undefined, undefined],
      htmlDefinition: [],
      doctorReferral: {
        id:
          this.props.route &&
          this.props.route.params &&
          this.props.route.params.referral &&
          !this.props.route.params.followUp
            ? stripDataType(this.props.route.params.referral.id)
            : undefined,
      },
      linkedDoctorReferral: {
        id:
          this.props.route &&
          this.props.route.params &&
          this.props.route.params.referral &&
          this.props.route.params.followUp
            ? stripDataType(this.props.route.params.referral.id)
            : undefined,
      },
      isActive: true,
      emailDefinition: {},
      command: undefined,
      isPopupVisibile: false,
      hasSignatureField: false,
      doctorId:
        this.props.route &&
        this.props.route.params &&
        this.props.route.params.referral
          ? stripDataType(this.props.route.params.referral.doctorId)
          : undefined,
      isDirty: false,
      followUpStateKey:
        this.props.route &&
        this.props.route.params
          ? this.props.route.params.followUpStateKey
          : undefined,
      isLoading: false,
      referralHtml: '',
      selectedVisitId: this.props.route.params.visit.id,
      isVisitLoading: false,
      referralStarted: false,
      builtInTemplates: {},
      showBuiltInDialog: false,
    };
    this.selectedFields = [];
    this.unmounted = false;
  }

  componentDidMount(){
    if (this.state.selectedVisitId) {
      this.setState({isVisitLoading: true});
      fetchVisit(this.state.selectedVisitId).then((visit) => this.setState({isVisitLoading: false}));
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  getPreviousVisits(): ?(CodeDefinition[]) {
    const patientInfo: PatientInfo =
      this.props.route.params.patientInfo;
    if (patientInfo === undefined) {
      return undefined;
    }
    return getPreviousVisits(patientInfo.id);
  }

  async componentDidUpdate(prevProps: any) {
    if (!this.props.navigation.isFocused()) {
      const isEditorDirty: boolean =
        this.editor && (await this.editor.isDirty());
      const isReferralDirty: boolean = this.state.isDirty;
      const isDirty: boolean = isEditorDirty || isReferralDirty;
      __DEV__ &&
        console.log(
          'Editor dirty:' + isEditorDirty + ' referral dirty:' + isDirty,
        );
      if (
        this.state.template &&
        (isDirty ||
          !(this.state.doctorReferral && this.state.doctorReferral.id))
      ) {
        this.save();
      }
    }
    if (!this.state.referralStarted) {
      this.shouldStartReferral();
    }
  }

  mapImageWithBase64(template?: string) {
    let referralHtml: string = this.state.referralHtml;
    const imageBase64Definition: ImageBase64Definition[] =
      getImageBase64Definition();
    if (imageBase64Definition) {
      for (const base64Image: ImageBase64Definition of imageBase64Definition) {
        try {
          let regex = new RegExp(base64Image.key, 'g');
          if (template) {
            template = template.replace(regex, base64Image.value);
          } else {
            referralHtml = referralHtml.replace(regex, base64Image.value);
          }
        } catch (e) {}
      }
    }
    if (referralHtml !== this.state.referralHtml) {
      this.setState(referralHtml);
    }
    return template;
  }

  async retrieveHtmlExamDefinition(exams: Exam[]): HtmlDefinition[] {
    this.setState({htmlDefinition: undefined});
    let htmlDefinition: HtmlDefinition[] = [];
    initValues();
    for (const exam: Exam of exams) {
      if (exam.isHidden !== true) {
        await renderExamHtml(exam, htmlDefinition, UserAction.REFERRAL);
      }
    }
    this.setState({htmlDefinition: htmlDefinition});
    return htmlDefinition;
  }

  async startReferral(template?: string) {
    this.setState({isLoading: true});
    const visit: Visit = this.props.route.params.visit;
    const allExams: string[] = allExamIds(visit);
    let exams: Exam[] = getCachedItems(allExams);
    if (exams) {
      const htmlDefinition: HtmlDefinition[] =
        await this.retrieveHtmlExamDefinition(exams);
      let body: {} = {};

      if (this.state.doctorReferral && this.state.doctorReferral.id) {
        body = {
          htmlDefinition: htmlDefinition,
          visitId: stripDataType(visit.id),
          doctorId: this.state.doctorId,
          id: stripDataType(this.state.doctorReferral.id),
        };
      } else {
        body = {
          htmlDefinition: htmlDefinition,
          visitId: stripDataType(visit.id),
          doctorId: stripDataType(this.state.doctorId),
          name: template,
        };
      }
      let parameters: {} = {};
      let response = await fetchWinkRest(
        'webresources/template',
        parameters,
        'POST',
        body,
      );
      if (response) {
        if (response.errors) {
          alert(response.errors);
        } else {
          const htmlContent: ReferralDocument = response;
          let htmlHeader: string = patientHeader(true);
          let htmlEnd: string = patientFooter();
          template =
            this.props.route &&
            this.props.route.params &&
            this.props.route.params.referral &&
            this.props.route.params.referral.referralTemplate &&
            !this.props.route.params.followUp
              ? this.props.route.params.referral.referralTemplate
                  .template
              : template;
          let html = htmlHeader + htmlContent.content + htmlEnd;
          const referralHtml = this.mapImageWithBase64(html);
          const builtInTemplates = htmlContent.builtInTemplates;
          this.updateSignatureState(htmlContent.content);
          this.setState({builtInTemplates, template, referralHtml});
        }
      }
    }
    this.setState({
      isLoading: false,
      isDirty: !(this.state.doctorReferral && this.state.doctorReferral.id),
    });
  }

  async selectVisit(visitId: string) {
    if (visitId === '' || visitId === undefined) {
      return;
    }
    if (this.state.selectedVisitId === visitId) {
      return;
    }
    this.setState({isVisitLoading: true});
    await fetchVisit(visitId);
    this.setState({isVisitLoading: false});
    this.setState({selectedVisitId: visitId});
    const visit: Visit = getCachedItem(visitId);
    const examIds: string[] = allExamIds(visit);
    let exams: Exam[] = getCachedItems(examIds);
    this.retrieveHtmlExamDefinition(exams);
    this.selectField(0, 'Exam');
  }

  selectField(level: number, code: string) {
    let selectedField: CodeDefinition[] = this.state.selectedField;
    selectedField[level] = code;
    while (++level < selectedField.length) {
      selectedField[level] = undefined;
    }
    this.setState({selectedField});
  }

  updateValue(newValue: any) {
    this.setState({doctorId: newValue, isDirty: true});
  }

  updateFieldCc(newValue: any) {
    let emailDefinition: EmailDefinition = this.state.emailDefinition;
    if (!emailDefinition) {
      return;
    }
    emailDefinition.cc = newValue;
    this.setState({emailDefinition: emailDefinition});
  }

  updateFieldTo(newValue: any) {
    let emailDefinition: EmailDefinition = this.state.emailDefinition;
    if (!emailDefinition) {
      return;
    }
    emailDefinition.to = newValue;
    this.setState({emailDefinition: emailDefinition});
  }

  updateFieldSubject(newValue: any) {
    let emailDefinition: EmailDefinition = this.state.emailDefinition;
    if (!emailDefinition) {
      return;
    }
    emailDefinition.subject = newValue;
    this.setState({emailDefinition: emailDefinition});
  }

  updateFieldBody(newValue: any) {
    let emailDefinition: EmailDefinition = this.state.emailDefinition;
    if (!emailDefinition) {
      return;
    }
    emailDefinition.body = newValue;
    this.setState({emailDefinition: emailDefinition});
  }

  updateFieldBuiltInTemplate(newValue: any) {
    let emailDefinition: EmailDefinition = this.state.emailDefinition;
    if (!emailDefinition) {
      return;
    }
    emailDefinition.builtInTemplate = newValue;
    this.setState({emailDefinition: emailDefinition});
  }

  cancelEdit = () => {
    this.setState({isActive: true});
    this.setState({isPopupVisibile: false});
    this.setState({command: undefined});
  };

  getSelectedKey(): ?string {
    let selectedKey: ?string;
    for (let i: number = 0; i < this.state.selectedField.length; i++) {
      let key: ?string = this.state.selectedField[i];
      if (key === null || key === undefined) {
        break;
      }
      selectedKey = key;
    }
    __DEV__ && console.log('selected key: ' + selectedKey);
    this.selectedFields.push(selectedKey);
    return selectedKey;
  }

  async insertField(): void {
    const selectedKey: ?string = this.getSelectedKey();
    if (!selectedKey) {
      return;
    }
    this.setState({isLoading: true});
    let parameters: {} = {};
    const visit: Visit = this.props.route.params.visit;
    let htmlDefinition: HtmlDefinition[] = this.state.htmlDefinition;
    let body: {} = {
      htmlDefinition: htmlDefinition,
      visitId: stripDataType(visit.id),
      doctorId: stripDataType(this.state.doctorId),
      key: '{' + selectedKey + '}',
    };

    let response = await fetchWinkRest(
      'webresources/template/key/',
      parameters,
      'POST',
      body,
    );
    if (response && this.editor) {
      if (response.errors) {
        alert(response.errors);
        this.setState({isLoading: false});
        return;
      }
      const htmlContent: ReferralDocument = response;
      let html = this.mapImageWithBase64(htmlContent.content);
      this.editor.insertContent(html);
      this.updateSignatureState(html);
    }
    this.setState({isLoading: false, isDirty: true});
  }

  async updateSignatureState(html: string) {
    if (!html) {
      if (this.state.hasSignatureField) {
        this.setState({hasSignatureField: false});
      }
    }
    const hasSignatureField: boolean = html?.includes('.DigitalSignature}');
    if (this.state.hasSignatureField != hasSignatureField) {
      this.setState({hasSignatureField});
    }
  }

  async sign(): Promise<void> {
    this.setState({isLoading: true});
    let html = await this.editor.getContent();
    let parameters: {} = {};
    const visit: Visit = this.props.route.params.visit;
    let htmlDefinition: HtmlDefinition[] = this.state.htmlDefinition;
    let body: {} = {
      htmlReferral: html,
      visitId: stripDataType(visit.id),
    };

    let response = await fetchWinkRest(
      'webresources/template/sign',
      parameters,
      'POST',
      body,
    );
    this.setState({isLoading: false});
    if (response && this.editor) {
      if (response.errors) {
        alert(response.errors);
      } else {
        const htmlContent: ReferralDocument = response;
        const referralHtml = htmlContent.content;
        this.editor.setContent(referralHtml);
        this.updateSignatureState(referralHtml);
        this.setState({command: COMMAND.SIGN, referralHtml: referralHtml});
        await this.save();
      }
    }
  }

  async print(): Promise<void> {
    let html = await this.editor.getContent();
    let htmlHeader: string = patientHeader(true);
    let htmlEnd: string = patientFooter();
    html = htmlHeader + html + htmlEnd;
    let HtmlWithAttachment: string = renderAttachment(html);
    let PDFAttachment: Array<any> = getSelectedPDFAttachment();
    const job = await printHtml(HtmlWithAttachment, PDFAttachment);
    if (job) {
      this.setState({command: COMMAND.PRINT, isDirty: true});
      await this.save();
    }
  }

  async save(): Promise<any> {
    let html = await this.editor.getContent();
    let htmlHeader: string = patientHeader(true);
    let htmlEnd: string = patientFooter();
    html = htmlHeader + html;

    let HtmlWithAttachment: string = renderAttachment(html);
    let PDFAttachment: Array<any> = getSelectedPDFAttachment();
    let HtmlEmbeddedAttachment: string = addEmbeddedAttachment(
      HtmlWithAttachment,
      PDFAttachment,
    );
    html = HtmlEmbeddedAttachment + htmlEnd;

    let parameters: {} = {};
    const visit: Visit = this.props.route.params.visit;

    let pdf = await generatePDF(HtmlWithAttachment, true);
    const resultPdf = await addPDFAttachment(pdf, PDFAttachment);
    const resultBase64: string = await resultPdf.saveAsBase64();

    let referralId;
    let linkedReferralId;

    if (this.state.doctorReferral !== undefined) {
      if (stripDataType(this.state.doctorReferral.id) > 0) {
        referralId = stripDataType(this.state.doctorReferral.id);
      }
    }
    if (this.state.linkedDoctorReferral !== undefined) {
      if (stripDataType(this.state.linkedDoctorReferral.id) > 0) {
        linkedReferralId = stripDataType(this.state.linkedDoctorReferral.id);
      }
    }

    let body: {} = {
      htmlReferral: html,
      visitId: stripDataType(visit.id),
      doctorId: stripDataType(this.state.doctorId),
      action: this.state.command,
      id: referralId,
      linkedReferralId: linkedReferralId,
      attachment: resultBase64,
      name: this.state.template,
    };
    let response = await fetchWinkRest(
      'webresources/template/save',
      parameters,
      'POST',
      body,
    );
    if (response) {
      if (response.errors) {
        alert(response.errors);
        return;
      } else {
        this.editor && this.editor.afterSave();
      }

      let referralDefinition: ReferralDefinition = response;
      if (this.state.followUpStateKey) {
        const setParamsAction = CommonActions.setParams({
          refreshFollowUp: true,
          key: this.state.followUpStateKey,
        });
      this.props.navigation.dispatch({...setParamsAction, source: this.state.followUpStateKey});
      }
      if (this.unmounted) {
        return referralDefinition;
      } else {
        this.setState({
          doctorReferral: referralDefinition,
          isDirty: response.errors !== undefined,
        });
      }
    }
  }

  async saveAction(): Promise<void> {
    this.setState({command: COMMAND.SAVE});
    await this.save();
    this.props.navigation.goBack();
  }

  async email(): Promise<void> {
    if (this.state.doctorId === undefined || this.state.doctorId <= 0) {
      alert(strings.doctorReferralMissing);
      return;
    }

    this.setState({command: COMMAND.EMAIL});
    const builtInTemplates: any = this.state.builtInTemplates;
    const referralTemplates: any = builtInTemplates
      ? builtInTemplates.referral
      : undefined;
    if (referralTemplates && referralTemplates.length > 1) {
      this.showBuiltInDialog();
    } else if (referralTemplates && referralTemplates.length == 1) {
      this.importSelectedTemplate(referralTemplates[0]);
    } else {
      this.importSelectedTemplate(undefined);
    }
  }

  async fax(): Promise<void> {
    if (this.state.doctorId === undefined) {
      alert(strings.doctorReferralMissing);
      return;
    }
    this.setState({command: COMMAND.FAX});
    const builtInTemplates: any = this.state.builtInTemplates;
    const referralTemplates: any = builtInTemplates
      ? builtInTemplates.referral_fax
      : undefined;
    if (referralTemplates && referralTemplates.length > 1) {
      this.showBuiltInDialog();
    } else if (referralTemplates && referralTemplates.length == 1) {
      this.importSelectedTemplate(referralTemplates[0]);
    } else {
      this.importSelectedTemplate(undefined);
    }
  }

  async send(): Promise<void> {
    if (
      this.state.command === undefined ||
      this.state.emailDefinition === undefined
    ) {
      return;
    }
    this.setState({isActive: false});
    let html = await this.editor.getContent();
    let htmlHeader: string = patientHeader();
    let htmlEnd: string = patientFooter();
    html = htmlHeader + html + htmlEnd;
    let HtmlWithAttachment: string = renderAttachment(html);
    let PDFAttachment: Array<any> = getSelectedPDFAttachment();
    let parameters: {} = {};
    const visit: Visit = this.props.route.params.visit;
    let pdf = await generatePDF(HtmlWithAttachment, true);
    const resultPdf = await addPDFAttachment(pdf, PDFAttachment);
    const resultBase64: string = await resultPdf.saveAsBase64();
    let body: {} = {};
    if (this.state.command == COMMAND.EMAIL) {
      body = {
        visitId: stripDataType(visit.id),
        doctorId: stripDataType(this.state.doctorId),
        attachment: resultBase64,
        emailDefinition: this.state.emailDefinition,
        doctorReferral: this.state.doctorReferral,
      };
    } else if (this.state.command == COMMAND.FAX) {
      body = {
        visitId: stripDataType(visit.id),
        doctorId: stripDataType(this.state.doctorId),
        attachment: resultBase64,
        isFax: true,
        emailDefinition: this.state.emailDefinition,
        doctorReferral: this.state.doctorReferral,
      };
    }

    let response = await fetchWinkRest(
      'webresources/template/email',
      parameters,
      'POST',
      body,
    );
    if (response) {
      if (response.errors) {
        alert(response.errors);
      } else {
        this.save();
        RNBeep.play(RNBeep.iOSSoundIDs.MailSent);
        this.setState({isPopupVisibile: false});
      }
    }
    this.setState({isActive: true});
  }

  parseExamName(dynamicFieldName: string): string {
    if (!dynamicFieldName.startsWith('Exam.')) {
      return dynamicFieldName;
    }
    let examName = dynamicFieldName.substring('Exam.'.length);
    let firstDotIndex: number = examName.indexOf('.');
    if (firstDotIndex > 0) {
      examName = examName.substring(0, firstDotIndex);
    }
    return examName;
  }

  filterEmptyExams(exams: CodeDefinition[]): CodeDefinition[] {
    const visit: Visit = getCachedItem(this.state.selectedVisitId);
    exams = exams.filter((examCode: CodeDefinition) => {
      let examName = this.parseExamName(examCode.code);
      const exam = getExam(examName, visit);
      if (!exam) {
        return false;
      }
      let examValue = exam[examName];
      return !isEmpty(examValue);
    });
    return exams;
  }

  compareDynamicFieldDescription(a: CodeDefinition, b: CodeDefinition): number {
    if (a.description.toLowerCase() < b.description.toLowerCase()) {
      return -1;
    } else if (a.description.toLowerCase() > b.description.toLowerCase()) {
      return 1;
    }
    return 0;
  }

  appendText(text: string) {
    if (isEmpty(text)) {
      return;
    }
    this.editor.insertContent(text);
  }
  renderFieldSelectionTree() {
    let dropdowns = [];
    let options: ?(CodeDefinition[]) = getAllCodes('dynamicFields');
    
    for (
      let level: number = 0;
      level < this.state.selectedField.length;
      level++
    ) {
      if (!options || (level > 0 && !this.state.selectedField[level - 1])) {
        break;
      } //Don't render empty dropdowns for nothing
      const selectedValue: ?string = this.state.selectedField[level];
      options.sort(this.compareDynamicFieldDescription);
      dropdowns.push(
        <FormRow>
          <FormOptions
            options={options}
            value={selectedValue}
            onChangeValue={(value: string) => this.selectField(level, value)}
          />
        </FormRow>,
      );
      let option: CodeDefinition = options.find(
        (option: CodeDefinition) =>
          (option.code ? option.code : option) === selectedValue,
      );

      // filter out Patiennt.HealthCardExp field from the list
      const filteredFields = option?.fields?.filter(
        (field: CodeDefinition) => option?.code !== 'Patient' || field.code !== 'Patient.HealthCardExp',
      );

      if (!this.state.isVisitLoading) {
        options = option ? filteredFields : undefined;
        if (level === 0 && selectedValue === 'Exam' && options) {
          options = this.filterEmptyExams(options);
          let previousVisits: CodeDefinition[] = this.getPreviousVisits();
          if (previousVisits && previousVisits.length > 0) {
            dropdowns.push(
              <FormRow>
                <FormOptions
                  options={previousVisits}
                  value={this.state.selectedVisitId}
                  onChangeValue={(visitId: string) => this.selectVisit(visitId)}
                />
              </FormRow>,
            );
          }
        }
      }
    }
    return dropdowns;
  }
  importSelectedTemplate(data: any) {
    this.updateFieldBuiltInTemplate(data);
    if (data === undefined || data === null) {
      this.updateFieldSubject(data);
      this.updateFieldBody(data);
    } else if (data && !data.readonly) {
      this.updateFieldSubject(data.subject);
      this.updateFieldBody(data.body);
    }
    this.hideBuiltInDialog();
    this.setState({isPopupVisibile: true});
  }

  hideBuiltInDialog() {
    this.setState({showBuiltInDialog: false});
  }
  showBuiltInDialog() {
    this.setState({showBuiltInDialog: true});
  }
  renderBuiltInTemplateAlert() {
    const builtInTemplates: any = this.state.builtInTemplates;
    const referralTemplates: any =
      this.state.command == COMMAND.FAX
        ? builtInTemplates.referral_fax
        : builtInTemplates.referral;
    if (!builtInTemplates) {
      return null;
    }
    return (
      <Alert
        title={strings.multipleBuiltInTemplate}
        data={referralTemplates}
        dismissable={true}
        onConfirmAction={(selectedData: any) =>
          this.importSelectedTemplate(selectedData)
        }
        onCancelAction={() => this.hideBuiltInDialog()}
        style={styles.alert}
      />
    );
  }

  renderTemplateTool() {
    return (
      <View style={styles.sideBar}>
        <View style={styles.formRow}>
          <View style={styles.formRowHeader}>
            <Label value={strings.referringPatientTo} />
          </View>
        </View>
        <View style={styles.formRow}>
          <FormCode
            code="doctors"
            value={this.state.doctorId <= 0 ? '' : this.state.doctorId}
            showLabel={false}
            label={strings.referringPatientTo}
            onChangeValue={(code: ?string | ?number) => this.updateValue(code)}
          />
        </View>
        <View style={styles.formRow}>
          <View style={styles.formRowHeader}>
            <Label value={strings.dynamicField} />
          </View>
        </View>
        {this.renderFieldSelectionTree()}
        <FormRow>
          <Button
            title={strings.insert}
            disabled={!this.state.htmlDefinition}
            onPress={() => this.insertField()}
          />
          <Microphone
            onSpoke={(text: string) => this.appendText(text)}
            style={styles.voiceIconMulti}
          />
        </FormRow>
      </View>
    );
  }

  filterHtml(html, OpenTag: String, CloseTag: String) {
    let FilteredHtml = html;
    if (FilteredHtml?.split(`${OpenTag}`).length > 1) {
      let restHTML = FilteredHtml?.split(`${OpenTag}`)[1]?.split(`${CloseTag}`);
      FilteredHtml = FilteredHtml.split(`${OpenTag}`)[0];
      FilteredHtml += restHTML[1];
    }
    return FilteredHtml;
  }

  renderEditor() {
    let HTML = this.state.referralHtml || '';
    HTML = this.filterHtml(
      HTML,
      '<div class="breakBefore"></div><section class="wrap-imgs">',
      '</section>',
    );
    HTML = this.filterHtml(HTML, '<section class="wrap-imgs">', '</section>');
    HTML = this.filterHtml(
      HTML,
      '<script type="text/javascript">',
      '</script>',
    );
    return (
      <View style={{flex: 100, flexDirection: 'column'}}>
        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
          <View style={styles.pageEditor}>
            <HtmlEditor
              style={styles.page}
              ref={(ref) => (this.editor = ref)}
              value={HTML}
            />
          </View>
          {this.renderTemplateTool()}

          {(this.state.command === COMMAND.EMAIL ||
            this.state.command === COMMAND.FAX) && (
            <Modal
              visible={this.state.isPopupVisibile}
              transparent={true}
              animationType={'slide'}
              onRequestClose={this.cancelEdit}>
              {this.renderSendPopup()}
            </Modal>
          )}
          {this.state.showBuiltInDialog && this.renderBuiltInTemplateAlert()}
        </View>
        {this.renderButtons()}
      </View>
    );
  }

  renderButtons() {
    return (
      <View style={styles.bottomItems}>
        <Button
          title={strings.sign}
          disabled={this.state.hasSignatureField !== true}
          onPress={() => this.sign()}
        />
        <Button
          title={strings.print}
          onPress={() => this.print()}
          disabled={!this.state.isActive}
        />
        <Button
          title={strings.email}
          onPress={() => this.email()}
          disabled={!this.state.isActive}
        />
        {getStore() !== undefined && getStore().eFaxUsed && (
          <Button
            title={strings.fax}
            onPress={() => this.fax()}
            disabled={!this.state.isActive}
          />
        )}
        <Button
          title={strings.save}
          onPress={() => this.saveAction()}
          disabled={!this.state.isActive}
        />
      </View>
    );
  }

  renderSendPopup() {
    let doctorCode: CodeDefinition = getCodeDefinition(
      'doctors',
      this.state.doctorId,
    );
    let emailDefinition: EmailDefinition = this.state.emailDefinition;
    const command: COMMAND = this.state.command;
    if (command == COMMAND.EMAIL) {
      emailDefinition.to = doctorCode !== undefined ? doctorCode.email : '';
    } else if (command == COMMAND.FAX) {
      emailDefinition.to = doctorCode !== undefined ? doctorCode.fax : '';
    }
    return (
      <TouchableWithoutFeedback onPress={isWeb ? () => {} : this.cancelEdit}>
        <View style={styles.popupBackground}>
          <View style={styles.flexColumnLayout}>
            <View style={styles.form}>
              <FormRow>
                <View style={styles.flexRow}>
                  <FormTextInput
                    label="To"
                    value={emailDefinition.to}
                    readonly={true}
                    onChangeText={(newValue: string) =>
                      this.updateFieldTo(newValue)
                    }
                  />
                </View>
              </FormRow>
              <FormRow>
                <View style={styles.flexRow}>
                  <FormTextInput
                    label="Cc"
                    value={emailDefinition.cc}
                    readonly={command == COMMAND.FAX}
                    onChangeText={(newValue: string) =>
                      this.updateFieldCc(newValue)
                    }
                  />
                </View>
              </FormRow>
              {emailDefinition.builtInTemplate &&
                emailDefinition.builtInTemplate.readonly && (
                  <FormRow>
                    <View style={styles.flexRow}>
                      <FormTextInput
                        label="Template"
                        value={emailDefinition.builtInTemplate.description}
                        readonly={true}
                      />
                    </View>
                  </FormRow>
                )}
              {emailDefinition.builtInTemplate &&
                !emailDefinition.builtInTemplate.readonly && (
                  <View>
                    <FormRow>
                      <View style={styles.flexRow}>
                        <FormTextInput
                          label="Subject"
                          value={emailDefinition.subject}
                          readonly={command == COMMAND.FAX}
                          onChangeText={(newValue: string) =>
                            this.updateFieldSubject(newValue)
                          }
                        />
                      </View>
                    </FormRow>
                    <FormRow>
                      <View style={styles.flexRow}>
                        <FormTextInput
                          multiline={true}
                          label="Body"
                          value={emailDefinition.body}
                          readonly={command == COMMAND.FAX}
                          onChangeText={(newValue: string) =>
                            this.updateFieldBody(newValue)
                          }
                        />
                      </View>
                    </FormRow>
                  </View>
                )}

              {!emailDefinition.builtInTemplate && (
                <View>
                  <FormRow>
                    <View style={styles.flexRow}>
                      <FormTextInput
                        label="Notes"
                        value={emailDefinition.subject}
                        onChangeText={(newValue: string) =>
                          this.updateFieldSubject(newValue)
                        }
                      />
                    </View>
                  </FormRow>
                </View>
              )}
              <View style={styles.flow}>
                <Button
                  title={strings.cancel}
                  onPress={this.cancelEdit}
                  disabled={!this.state.isActive}
                />
                <Button
                  title={strings.send}
                  onPress={() => {
                    Keyboard.dismiss();
                    this.send();
                  }}
                  disabled={!this.state.isActive}
                />
              </View>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  renderManageUsersPopup() {
    return (
      <View style={styles.screeen}>
        <ManageUsers onClose={this.cancelEdit} />
      </View>
    );
  }

  renderTemplates() {
    const templates: string[] = getAllCodes('referralTemplates');

    return (
      <View style={styles.page}>
        {this.renderSavedFollowUp()}
        <View style={styles.separator}>
          <View style={styles.tabCard}>
            <Text style={styles.cardTitle}>New Referral</Text>
            <View style={styles.boardM}>
              <View style={styles.formRow}>
                <FormCode
                  code="doctors"
                  value={this.state.doctorId <= 0 ? '' : this.state.doctorId}
                  label={strings.referringPatientTo}
                  onChangeValue={(code: ?string | ?number) =>
                    this.updateValue(code)
                  }
                />
                <Binoculars
                  style={styles.groupIcon}
                  onClick={() => this.setState({isPopupVisibile: true})}
                />
              </View>
            </View>
            <View style={styles.flow}>
              {templates &&
                templates.map((template: string) => (
                  <Button
                    title={template}
                    onPress={() => this.startReferral(template)}
                  />
                ))}
            </View>
          </View>
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

  renderLoading() {
    if (this.state.isLoading) {
      return (
        <Modal
          visible={this.state.isLoading}
          transparent={true}
          animationType={'none'}
          onRequestClose={this.cancelEdit}>
          <View style={styles.container}>
            {this.state.isLoading && (
              <ActivityIndicator size="large" color={selectionColor} />
            )}
          </View>
        </Modal>
      );
    }
    return null;
  }

  renderSavedFollowUp() {
    const followUp: Boolean = this.props.route.params.followUp;
    return (
      !followUp && (
        <FollowUpScreen
          patientInfo={this.props.route.params.patientInfo}
          navigation={this.props.navigation}
          isDraft={true}
          route={this.props.route}
        />
      )
    );
  }

  shouldStartReferral() {
    let doctorReferral: ReferralDefinition = this.state.doctorReferral;
    let linkedDoctorReferral: ReferralDefinition =
      this.state.linkedDoctorReferral;

    const followUp: Boolean = this.props.route.params.followUp;

    const params =
      this.props.route &&
      this.props.route.params
        ? this.props.route.params
        : undefined;
    if (params) {
      if (
        params.referral &&
        !(doctorReferral && doctorReferral.id) &&
        !followUp
      ) {
        doctorReferral = {id: params.referral.id};
        if (
          isEmpty(this.state.doctorReferral) ||
          this.state.doctorReferral !== doctorReferral
        ) {
          this.setState({doctorReferral: doctorReferral});
        }
      }
      if (
        params.referral &&
        !(linkedDoctorReferral && linkedDoctorReferral.id) &&
        followUp
      ) {
        linkedDoctorReferral = {id: params.referral.id};
        if (
          isEmpty(this.state.linkedDoctorReferral) ||
          this.state.linkedDoctorReferral !== linkedDoctorReferral
        ) {
          this.setState({linkedDoctorReferral: linkedDoctorReferral});
        }
      }
      if (params.referral && isEmpty(this.state.doctorId)) {
        const doctorId = stripDataType(
          this.props.route.params.referral.doctorId,
        );
        if (this.state.doctorId !== doctorId) {
          this.setState({doctorId: doctorId});
        }
      }
    }
    if (
      ((doctorReferral && doctorReferral.id) || this.state.template) &&
      !followUp &&
      !this.state.isDirty &&
      isEmpty(this.state.referralHtml)
    ) {
      this.setState({referralStarted: true});
      this.startReferral();
    }
  }

  render() {
    let doctorReferral: ReferralDefinition = this.state.doctorReferral;
    return (
      <View style={styles.page}>
        {this.renderLoading()}
        {this.state.template || (doctorReferral && doctorReferral.id)
          ? this.renderEditor()
          : this.renderTemplates()}
      </View>
    );
  }
}

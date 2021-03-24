/**
 * @flow
 */
'use strict';

import React, {Component, PureComponent} from 'react';
import {
  View,
  TouchableHighlight,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
  ScrollView,
} from 'react-native';
import CustomDateTimePicker from '../src/components/DateTimePicker/CustomDateTimePicker';
import RNBeep from 'react-native-a-beep';
import type {
  Patient,
  Exam,
  GlassesRx,
  GlassRx,
  Visit,
  Appointment,
  ExamDefinition,
  ExamPredefinedValue,
  Recall,
  PatientDocument,
  PatientInfo,
  Store,
  FollowUp,
  VisitType,
  User,
} from './Types';
import {styles, fontScale, isWeb} from './Styles';
import {strings, getUserLanguage} from './Strings';
import {Button, FloatingButton, Lock, NativeBar, Alert} from './Widgets';
import {
  formatMoment,
  deepClone,
  formatDate,
  now,
  jsonDateTimeFormat,
  isEmpty,
  compareDates,
  isToyear,
  dateFormat,
  farDateFormat,
  tomorrow,
  yearDateFormat,
  officialDateFormat,
  prefix,
  postfix,
} from './Util';
import {
  ExamCard,
  createExam,
  storeExam,
  getExam,
  renderExamHtml,
  UserAction,
} from './Exam';
import {allExamPredefinedValues} from './Favorites';
import {allExamDefinitions} from './ExamDefinition';
import {
  ReferralCard,
  PrescriptionCard,
  AssessmentCard,
  VisitSummaryCard,
} from './Assessment';
import {
  cacheItem,
  getCachedItem,
  getCachedItems,
  cacheItemsById,
  cacheItemById,
} from './DataCache';
import {
  searchItems,
  storeItem,
  performActionOnItem,
  fetchItemById,
  stripDataType,
} from './Rest';
import {fetchAppointment} from './Appointment';
import {printRx, printClRx, printMedicalRx} from './Print';
import {printHtml} from '../src/components/HtmlToPdf';
import {PatientDocumentPage} from './Patient';
import {PatientMedicationCard} from './Medication';
import {PatientRefractionCard} from './Refraction';
import {getDoctor, getStore} from './DoctorApp';
import {
  getVisitHtml,
  printPatientHeader,
  getScannedFiles,
  setScannedFiles,
} from './PatientFormHtml';
import {fetchWinkRest} from './WinkRest';
import {FollowUpScreen} from './FollowUp';
import {isReferralsEnabled} from './Referral';

export const examSections: string[] = [
  'Chief complaint',
  'History',
  'Entrance testing',
  'Vision testing',
  'Anterior exam',
  'Posterior exam',
  'CL',
  'Form',
  'Document',
];
const examSectionsFr: string[] = [
  'Plainte principale',
  'Historique',
  "Test d'entrée",
  'Test de vision',
  'Examen antérieur',
  'Examen postérieur',
  'LC',
  'Form',
  'Document',
];

export function getSectionTitle(section: string): string {
  const language: string = getUserLanguage();
  if (language.startsWith('fr')) {
    if (section === 'Pre tests') {
      return 'Pré-tests';
    }
    const i: number = examSections.indexOf(section, 0);
    if (i >= 0 && i < examSectionsFr.length - 1) {
      return examSectionsFr[i];
    }
  }
  return section;
}

export async function fetchVisit(visitId: string): Visit {
  let visit: Visit = await fetchItemById(visitId);
  return visit;
}

export async function fetchVisitTypes(): VisitType[] {
  const searchCriteria = {};
  let restResponse = await searchItems('VisitType/list', searchCriteria);
  let visitTypes: VisitType[] = restResponse.visitTypeList;
  if (!visitTypes || visitTypes.length == 0) {
    alert(
      strings.formatString(
        strings.doctorWithoutVisitTypeError,
        getDoctor().lastName,
      ),
    );
    visitTypes = [];
  }
  cacheItem('visitTypes', visitTypes);
  return visitTypes;
}

export function getVisitTypes(): VisitType[] {
  let visitTypes: VisitType[] = getCachedItem('visitTypes');
  return visitTypes;
}

export async function saveVisitTypes(visitTypes: VisitType[]) {
  visitTypes = (await performActionOnItem('linkExams', visitTypes))
    .visitTypeList;
  cacheItem('visitTypes', visitTypes);
}

export function visitHasEnded(visit: string | Visit): boolean {
  if (visit instanceof Object === false) {
    visit = getCachedItem(visit);
  }
  if (visit === null || visit === undefined) {
    return false;
  }
  return visit.locked === true;
}

export function visitHasStarted(visit: string | Visit): boolean {
  if (visit instanceof Object === false) {
    visit = getCachedItem(visit);
  }
  return visit.customExamIds !== undefined && visit.customExamIds.length > 0;
}

export function allExamIds(visit: Visit): string[] {
  let allExamIds: string[];
  if (!visit.customExamIds) {
    allExamIds = visit.preCustomExamIds;
  } else if (!visit.preCustomExamIds) {
    allExamIds = visit.customExamIds;
  } else {
    allExamIds = visit.preCustomExamIds.concat(visit.customExamIds);
  }
  if (!allExamIds) {
    allExamIds = [];
  }
  return allExamIds;
}

export async function fetchReferralFollowUpHistory(
  patientId?: string,
): FollowUp[] {
  let parameters: {} = {};
  let body: {} = {
    patientId: !isEmpty(patientId) ? stripDataType(patientId) : undefined,
  };
  let allFollowUp: FollowUp[] = [];
  let response = await fetchWinkRest(
    'webresources/followup/list',
    parameters,
    'POST',
    body,
  );
  if (response) {
    if (response.errors) {
      alert(response.errors);
      return;
    }
    allFollowUp = response.followUp;
  }
  const id: string = isEmpty(patientId) ? '*' : patientId;
  cacheItem('referralFollowUpHistory-' + id, allFollowUp);
}

export async function fetchVisitHistory(patientId: string): string[] {
  const searchCriteria = {patientId: patientId};
  let restResponse = await searchItems('Visit/list', searchCriteria);
  const customExams: Exam[] = restResponse.customExamList;
  const visits: Visit[] = restResponse.visitList ? restResponse.visitList : [];
  const visitIds: string[] = visits.map((visit) => visit.id);
  const stores: Store[] = restResponse.storeList ? restResponse.storeList : [];
  const patientDocuments: PatientDocument[] = restResponse.patientDocumentList
    ? restResponse.patientDocumentList
    : [];
  const patientDocumentIds: string[] = patientDocuments.map(
    (patientDocument) => patientDocument.id,
  );
  const users: User[] = restResponse.userList;
  const referralsFollowUp: FollowUp[] = await fetchReferralFollowUpHistory(
    patientId,
  );

  //    customExams && customExams.forEach((exam: Exam) => overwriteExamDefinition(exam)); //TODO remove after beta
  cacheItemsById(customExams);
  cacheItemsById(visits);
  cacheItemsById(patientDocuments);
  cacheItemsById(users);
  cacheItemsById(stores);
  cacheItem('visitHistory-' + patientId, visitIds);
  cacheItem('patientDocumentHistory-' + patientId, patientDocumentIds);
  return visitIds;
}

export function getVisitHistory(patientId: string): ?(Visit[]) {
  if (patientId === undefined) {
    return undefined;
  }
  let visitHistory: ?(Visit[]) = getCachedItems(
    getCachedItem('visitHistory-' + patientId),
  );
  return visitHistory;
}

export async function createVisit(visit: Visit): Visit {
  visit.id = 'visit';
  visit = await storeItem(visit);
  let visitHistory: ?(Visit[]) = getCachedItem(
    'visitHistory-' + visit.patientId,
  );
  if (visitHistory === undefined) {
    visitHistory = [];
    cacheItem('visitHistory-' + visit.patientId, visitHistory);
  }
  visitHistory.unshift(visit.id);
  fetchVisitHistory(visit.patientId);
  return visit;
}

export async function updateVisit(visit: Visit): Visit {
  visit = await storeItem(visit);
  return visit;
}

function getRecentVisitSummaries(patientId: string): ?(Exam[]) {
  let visitHistory: ?(Visit[]) = getVisitHistory(patientId);
  if (!visitHistory) {
    return undefined;
  }
  let visitSummaries: Exam[] = [];
  visitHistory.forEach((visit: Visit) => {
    if (visit.customExamIds) {
      visit.customExamIds.forEach((examId: string) => {
        const exam: Exam = getCachedItem(examId);
        if (exam.resume) {
          visitSummaries = [...visitSummaries, exam];
        }
      });
      if (visitSummaries.length > 3) {
        return visitSummaries;
      }
    }
  });
  return visitSummaries;
}

async function printPatientFile(visitId: string) {
  let visitHtml: string = '';
  const visit: Visit = getCachedItem(visitId);
  const allExams: string[] = allExamIds(visit);
  let exams: Exam[] = getCachedItems(allExams);
  setScannedFiles(visitHtml);
  let xlExams: Exam[] = [];
  visitHtml += printPatientHeader(visit);
  if (exams) {
    let htmlDefinition: HtmlDefinition[] = [];
    visitHtml += '<table><thead></thead><tbody>';
    for (const section: string of examSections) {
      let filteredExams = exams.filter(
        (exam: Exam) =>
          exam.definition.section &&
          exam.definition.section.startsWith(section),
      );
      filteredExams.sort(compareExams);
      for (const exam: string of filteredExams) {
        let xlGroupDefinition: GroupDefinition[] = exam.definition.fields.filter(
          (groupDefinition: GroupDefinition) => groupDefinition.size === 'XL',
        );
        if (xlGroupDefinition && xlGroupDefinition.length > 0) {
          xlExams.push(exam);
        } else {
          if (exam.isHidden !== true && exam.hasStarted) {
            visitHtml += await renderExamHtml(
              exam,
              htmlDefinition,
              UserAction.PATIENTFILE,
            );
          }
        }
      }
    }
    let assessments: Exam[] = exams.filter(
      (exam: Exam) => exam.definition.isAssessment,
    );
    assessments.sort(compareExams);
    for (const exam: Exam of assessments) {
      let xlGroupDefinition: GroupDefinition[] = exam.definition.fields.filter(
        (groupDefinition: GroupDefinition) => groupDefinition.size === 'XL',
      );
      if (xlGroupDefinition && xlGroupDefinition.length > 0) {
        xlExams.push(exam);
      } else {
        if (exam.isHidden !== true) {
          visitHtml += await renderExamHtml(
            exam,
            htmlDefinition,
            UserAction.PATIENTFILE,
          );
        }
      }
    }
    visitHtml += '</tbody></table>';
    visitHtml += getScannedFiles();
    for (const exam: string of xlExams) {
      if (
        (exam.isHidden !== true && exam.hasStarted) ||
        (exam.isHidden !== true && exam.definition.isAssessment)
      ) {
        visitHtml += await renderExamHtml(
          exam,
          htmlDefinition,
          UserAction.PATIENTFILE,
        );
      }
    }
    visitHtml = getVisitHtml(visitHtml);
    printHtml(visitHtml);
  }
}

export async function transferRx(visitId: string) {
  const store: Store = getStore();
  let parameters: {} = {
    idAccounts: store.winkToWinkId,
    email: store.winkToWinkEmail,
  };
  let response = await fetchWinkRest(
    'webresources/WinkToWinkVisitTransfer/export/' + stripDataType(visitId),
    parameters,
  );
  if (response) {
    RNBeep.PlaySysSound(RNBeep.iOSSoundIDs.MailSent);
  }
}

function compareExams(a: Exam, b: Exam): number {
  if (a.definition.order !== undefined && b.definition.order !== undefined) {
    if (a.definition.order < b.definition.order) {
      return -10;
    }
    if (a.definition.order > b.definition.order) {
      return 10;
    }
  }
  if (a.definition.isAssessment || b.definition.isAssessment) {
    return 0;
  }

  if (
    a.definition.section === undefined ||
    b.definition.section === undefined
  ) {
    return -1;
  }
  if (a.definition.section < b.definition.section) {
    return -1;
  }
  if (a.definition.section > b.definition.section) {
    return 1;
  }
  return 0;
}

class VisitButton extends PureComponent {
  props: {
    id: string,
    isSelected: ?boolean,
    onPress: () => void,
    onLongPress?: () => void,
    testID: string,
  };

  render() {
    const visitOrNote: ?(Visit | PatientDocument) = getCachedItem(
      this.props.id,
    );
    const date: string =
      visitOrNote !== undefined && visitOrNote.date != undefined
        ? visitOrNote.date
        : visitOrNote.postedOn;
    const type: string =
      visitOrNote !== undefined && visitOrNote.typeName != undefined
        ? visitOrNote.typeName
        : visitOrNote.category;
    return (
      <TouchableOpacity
        onPress={this.props.onPress}
        onLongPress={this.props.onLongPress}
        testID={this.props.testID}>
        <View style={this.props.isSelected ? styles.selectedTab : styles.tab}>
          <Text
            style={
              this.props.isSelected ? styles.tabTextSelected : styles.tabText
            }>
            {formatDate(date, yearDateFormat)}
          </Text>
          <Text
            style={
              this.props.isSelected ? styles.tabTextSelected : styles.tabText
            }>
            {type}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
}

class SummaryButton extends PureComponent {
  props: {
    isSelected: ?boolean,
    onPress: () => void,
  };

  render() {
    return (
      <TouchableOpacity onPress={this.props.onPress} testID="summaryTab">
        <View style={this.props.isSelected ? styles.selectedTab : styles.tab}>
          <Text
            style={
              this.props.isSelected ? styles.tabTextSelected : styles.tabText
            }>
            {strings.summaryTitle}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
}

class FollowUpButton extends PureComponent {
  props: {
    isSelected: ?boolean,
    onPress: () => void,
  };

  render() {
    return (
      <TouchableOpacity onPress={this.props.onPress} testID="followUpTab">
        <View style={this.props.isSelected ? styles.selectedTab : styles.tab}>
          <Text
            style={
              this.props.isSelected ? styles.tabTextSelected : styles.tabText
            }>
            {strings.referral}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
}

export type StartVisitButtonsProps = {
  isPreVisit: boolean,
  title?: string,
  onStartVisit: (type: string, isPrevisit: boolean) => void,
  isLoading: ?boolean,
};
type StartVisitButtonstate = {
  visitTypes: VisitType[],
  clicked: boolean,
};
export class StartVisitButtons extends Component<
  StartVisitButtonsProps,
  StartVisitButtonsState,
> {
  constructor(props: StartVisitButtonsProps) {
    super(props);
    this.state = {
      visitTypes: [],
      clicked: false,
    };
  }

  componentDidMount() {
    this.loadVisitTypes();
  }

  async loadVisitTypes() {
    if (this.state.visitTypes && this.state.visitTypes.length > 0) {
      return;
    }
    let visitTypes: VisitType[] = getVisitTypes();
    if (!visitTypes || visitTypes.length === 0) {
      visitTypes = await fetchVisitTypes();
    }
    this.setState({visitTypes});
  }

  startVisit(visitType: string) {
    if (this.state.clicked || this.props.isLoading) {
      return;
    }
    this.setState({clicked: true}, () => {
      this.props.onStartVisit(visitType, this.props.isPreVisit);
      this.setState({clicked: false});
    });
  }

  render() {
    if (this.state.visitTypes.length === 0) {
      return null;
    }
    if (this.state.clicked) {
      return (
        <View style={styles.startVisitCard}>
          {this.props.title && (
            <Text style={styles.sectionTitle}>{this.props.title}</Text>
          )}
        </View>
      );
    }
    return (
      <View style={styles.startVisitCard}>
        {this.props.title && (
          <Text style={styles.sectionTitle}>{this.props.title}</Text>
        )}
        <View style={styles.flow}>
          {this.state.visitTypes.map((visitType: VisitType, index: number) => (
            <Button
              title={visitType.name}
              key={index}
              onPress={() => this.startVisit(visitType.name)}
            />
          ))}
        </View>
      </View>
    );
  }
}

class SectionTitle extends PureComponent {
  props: {
    title: string,
  };

  render() {
    //const title : string = (this.props.title===undefined || this.props.title===null)?'':this.props.title.replace(' ','\n');
    const title: string = this.props.title;
    return <Text style={styles.borderSectionTitle}>{title}</Text>;
  }
}

class VisitWorkFlow extends Component {
  props: {
    patientInfo: PatientInfo,
    visitId: string,
    navigation: any,
    appointmentStateKey: string,
    onStartVisit: (type: string, isPreVisit: boolean) => void,
    readonly: ?boolean,
    enableScroll: () => void,
    disableScroll: () => void,
    isLoading: ?boolean,
  };
  state: {
    visit: Visit,
    appointment: Appointment,
    addableExamTypes: ExamDefinition[],
    addableSections: string[],
    locked: boolean,
    rxToOrder: ?Exam,
    showSnackBar: ?boolean,
    snackBarMessage: ?string,
  };

  constructor(props: any) {
    super(props);
    const visit: Visit = getCachedItem(this.props.visitId);
    const appointment: Appointment = getCachedItem(visit.appointmentId);
    const locked: boolean = visitHasEnded(visit);
    this.state = {
      visit: visit,
      addableExamTypes: [],
      addableSections: [],
      locked: locked,
      rxToOrder: this.findRxToOrder(visit),
      showSnackBar: false,
      snackBarMessage: '',
      appointment: appointment,
    };
    visit && this.loadUnstartedExamTypes(visit);
    this.loadAppointment(visit);
  }

  async componentDidUpdate(prevProps: any) {
    const params = this.props.navigation.state.params;

    if (params && params.refreshFollowUp) {
      const patientInfo: PatientInfo = this.props.patientInfo;
      this.props.navigation.setParams({refreshFollowUp: false});
      await fetchReferralFollowUpHistory(patientInfo.id);
    }
    const visit: Visit = getCachedItem(this.props.visitId);
    const rxToOrder = this.findRxToOrder(visit);
    if (
      this.props.visitId === prevProps.visitId &&
      visit === this.state.visit &&
      rxToOrder === this.state.rxToOrder
    ) {
      return;
    }
    const locked: boolean = visitHasEnded(visit);
    this.setState({
      visit,
      locked,
      rxToOrder,
    });
    visit && this.loadUnstartedExamTypes(visit);
    this.loadAppointment(visit);
  }

  async storeVisit(visit: Visit) {
    if (this.props.readonly) return;
    visit = await storeItem(visit);
    const locked: boolean = visitHasEnded(visit);
    this.setState({
      visit: visit,
      locked: locked,
      rxToOrder: this.findRxToOrder(visit),
    });
    visit && this.loadUnstartedExamTypes(visit);
    this.loadAppointment(visit);
  }

  findRxToOrder(visit: Visit): ?Exam {
    if (!visit) return undefined;
    if (!visit.customExamIds) return undefined;
    let rxToOrderExamId: ?string = visit.customExamIds.find(
      (examId: string) => getCachedItem(examId).definition.name === 'RxToOrder',
    );
    if (rxToOrderExamId) {
      let exam: Exam = getCachedItem(rxToOrderExamId);
      return exam;
    }

    return undefined;
  }

  async loadAppointment(visit: Visit) {
    if (!visit || !visit.appointmentId) return;
    let appointment: Appointment = getCachedItem(visit.appointmentId);
    if (!appointment) {
      appointment = await fetchAppointment(visit.appointmentId);
    }
    this.setState({appointment: appointment});
  }

  async loadUnstartedExamTypes(visit: Visit) {
    if (this.props.readonly) return;
    const locked: boolean = this.state.locked;
    if (locked) {
      if (this.state.addableExamTypes.length !== 0)
        this.setState({addableExamTypes: []});
      return;
    }
    let allExamTypes: ExamDefinition[] = await allExamDefinitions(true);
    allExamTypes = allExamTypes.concat(await allExamDefinitions(false));
    let unstartedExamTypes: ExamDefinition[] = allExamTypes.filter(
      (examType: ExamDefinition) => {
        let existingExamIndex: number = visit.preCustomExamIds
          ? visit.preCustomExamIds.findIndex(
              (examId: string) =>
                getCachedItem(examId).definition.name === examType.name &&
                getCachedItem(examId).isHidden !== true,
            )
          : -1;
        if (existingExamIndex < 0 && visit.customExamIds)
          existingExamIndex = visit.customExamIds.findIndex(
            (examId: string) =>
              getCachedItem(examId).definition.name === examType.name &&
              getCachedItem(examId).isHidden !== true,
          );
        return existingExamIndex < 0;
      },
    );
    let addableSections: string[] = examSections.filter((section: string) =>
      unstartedExamTypes
        .map((examDefinition: ExamDefinition) =>
          examDefinition.section.substring(
            0,
            examDefinition.section.indexOf('.'),
          ),
        )
        .includes(section),
    );
    this.setState({addableExamTypes: unstartedExamTypes, addableSections});
  }

  hasMedicalRx(): boolean {
    const medicationExam: Exam = getExam(
      'Prescription',
      getCachedItem(this.props.visitId),
    );
    if (!medicationExam) return false;
    const value = medicationExam['Prescription'];
    return !isEmpty(value);
  }

  hasFinalClFitting(): boolean {
    const fittingExam: Exam = getExam(
      'Fitting',
      getCachedItem(this.props.visitId),
    );
    if (!fittingExam || !fittingExam.hasStarted || fittingExam.isHidden)
      return false;
    let value = fittingExam['Fitting'];
    if (value instanceof Object) {
      value = value['Contact Lens Trial'];
    }
    if (value instanceof Array) {
      value = value.filter((trial) => trial['Trial type'] == 2);
    }
    return !isEmpty(value);
  }

  canTransfer(): boolean {
    const store: Store = getStore();
    return (
      store != undefined &&
      store != null &&
      store.winkToWinkId != undefined &&
      store.winkToWinkId != null &&
      store.winkToWinkId > 0 &&
      store.winkToWinkEmail !== undefined &&
      store.winkToWinkEmail != null &&
      store.winkToWinkEmail.trim() != ''
    );
  }

  async createExam(examDefinitionId: string, examPredefinedValueId?: string) {
    if (this.props.readonly) {
      return;
    }
    const visit: ?Visit = this.state.visit;
    if (!visit || !visit.id) {
      return;
    }
    let exam: Exam = {
      id: 'customExam',
      visitId: visit.id,
      customExamDefinitionId: examDefinitionId,
      examPredefinedValueId: examPredefinedValueId,
    };
    exam = await createExam(exam);
    if (exam.errors) {
      alert(exam.errors);
      return;
    }
    if (!visit.preCustomExamIds) {
      visit.preCustomExamIds = [];
    }
    if (!visit.customExamIds) {
      visit.customExamIds = [];
    }
    if (exam.definition.isPreExam) {
      visit.preCustomExamIds.push(exam.id);
    } else {
      visit.customExamIds.push(exam.id);
    }
    cacheItemById(visit);
    this.loadUnstartedExamTypes(visit);
    this.setState({visit});
  }

  async addExam(examLabel: string) {
    if (examLabel === undefined) {
      return;
    } //Weird this happens, floating buttons are shitty
    if (this.props.readonly) {
      return;
    }
    let examDefinition: ?ExamDefinition = (
      await allExamDefinitions(false)
    ).find(
      (examDefinition: ExamDefinition) =>
        (examDefinition.label ? examDefinition.label : examDefinition.name) ===
        examLabel,
    );
    if (!examDefinition) {
      examDefinition = (await allExamDefinitions(true)).find(
        (examDefinition: ExamDefinition) =>
          (examDefinition.label
            ? examDefinition.label
            : examDefinition.name) === examLabel,
      );
    }
    if (!examDefinition) {
      return;
    }
    let existingExam: ?Exam = this.state.visit.preCustomExamIds
      ? getCachedItem(
          this.state.visit.preCustomExamIds[
            this.state.visit.preCustomExamIds.findIndex(
              (examId: string) =>
                getCachedItem(examId).definition.name === examDefinition.name,
            )
          ],
        )
      : undefined;
    if (!existingExam && this.state.visit.customExamIds) {
      existingExam = getCachedItem(
        this.state.visit.customExamIds[
          this.state.visit.customExamIds.findIndex(
            (examId: string) =>
              getCachedItem(examId).definition.name === examDefinition.name,
          )
        ],
      );
    }
    if (existingExam) {
      this.unhideExam(existingExam);
    } else {
      this.createExam(examDefinition.id, undefined);
    }
  }

  async lockVisit() {
    if (this.props.readonly) {
      return;
    }
    const visit: Visit = this.state.visit;
    try {
      this.props.navigation.goBack();
      visit.locked = true;
      await updateVisit(visit);
    } catch (error) {
      console.log(error);
      alert(strings.formatString(strings.serverError, error));
    }
  }

  async endVisit() {
    const appointment: Appointment = this.state.appointment;
    if (appointment === undefined || appointment === null) {
      return;
    }
    try {
      const response: Appointment = await performActionOnItem(
        'close',
        appointment,
        'POST',
      );
      this.setState({appointment: response});
    } catch (error) {
      console.log(error);
      alert(strings.formatString(strings.serverError, error));
    }
  }

  async signVisit() {
    if (this.props.readonly) {
      return;
    }
    let visit: Visit = this.state.visit;
    try {
      visit = await performActionOnItem('sign', visit);
      this.setState({visit});
    } catch (error) {
      console.log(error);
      alert(strings.formatString(strings.serverError, error));
    }
  }

  switchLock = () => {
    this.setState({locked: this.state.locked === true ? false : true}, () => {
      this.loadUnstartedExamTypes(this.state.visit);
    });
  };

  hideExam = (exam: Exam) => {
    if (this.props.readonly) {
      return;
    }
    if (!isEmpty(exam[exam.definition.name])) {
      alert(strings.removeExamError);
      return;
    }
    exam.isHidden = true;
    storeExam(exam, this.props.appointmentStateKey, this.props.navigation);
    this.loadUnstartedExamTypes(this.state.visit);
  };

  unhideExam = (exam: Exam) => {
    if (this.props.readonly) {
      return;
    }
    exam.isHidden = false;
    storeExam(exam, this.props.appointmentStateKey, this.props.navigation);
    this.loadUnstartedExamTypes(this.state.visit);
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

  async transferRx(visitId: string) {
    await transferRx(visitId);
    this.setSnackBarMessage(strings.transferRxSuccess);
    this.showSnackBar();
  }

  renderSnackBar() {
    return (
      <NativeBar
        message={this.state.snackBarMessage}
        onDismissAction={() => this.hideSnackBar()}
      />
    );
  }
  renderExams(section: string, exams: ?(Exam[]), isPreExam: boolean) {
    if (exams) {
      if (!isPreExam) {
        exams = exams.filter(
          (exam: Exam) =>
            exam &&
            exam.definition.section &&
            exam.definition.section.startsWith(section),
        );
      }
      exams = exams.filter(
        (exam: Exam) =>
          exam &&
          !exam.definition.isAssessment &&
          exam.isHidden !== true &&
          (exam.hasStarted ||
            (this.state.locked !== true && this.props.readonly !== true)),
      );
      exams.sort(compareExams);
    }
    if (
      (!exams || exams.length === 0) &&
      this.state.visit &&
      this.state.visit.isDigital != true
    ) {
      return null;
    }
    const view = (
      <View style={styles.flow}>
        {exams &&
          exams.map((exam: Exam, index: number) => {
            return (
              <ExamCard
                key={exam.definition.name}
                exam={exam}
                disabled={this.props.readonly}
                onSelect={() =>
                  this.props.navigation.navigate('exam', {
                    exam,
                    appointmentStateKey: this.props.appointmentStateKey,
                  })
                }
                onHide={() => this.hideExam(exam)}
                unlocked={this.state.locked !== true}
                enableScroll={this.props.enableScroll}
                disableScroll={this.props.disableScroll}
              />
            );
          })}
      </View>
    );
    if (section === 'Document') {
      return view;
    }
    const sectionTitle: string = getSectionTitle(section);
    return (
      <View style={styles.examsBoard} key={section}>
        <SectionTitle title={sectionTitle} />
        {view}
        {this.renderAddableExamButton(section)}
      </View>
    );
  }

  renderConsultationDetails() {
    const store: Store = getCachedItem(this.state.visit.storeId);
    const doctor: User = getCachedItem(this.state.visit.userId);
    return (
      <View style={styles.examsBoard}>
        <Text style={styles.cardTitle}>{strings.visit}</Text>
        {doctor && (<Text style={styles.text}>{strings.doctor}:{' '}{postfix(doctor.firstName, ' ') + doctor.lastName}</Text>)}
        {store && store.name && (<Text style={styles.text}>{strings.location}: {store.name}</Text>)}
        {!isEmpty(this.state.visit.prescription.signedDate) && (<Text style={styles.text}>{strings.signedOn}: {formatDate(this.state.visit.prescription.signedDate, yearDateFormat)}</Text>)}
      </View>
    );
  }

  renderAssessments() {
    let assessments: Exam[] = getCachedItems(
      this.state.visit.customExamIds,
    ).filter((exam: Exam) => exam.definition.isAssessment);
    assessments.sort(compareExams);

    return assessments.map((exam: Exam, index: number) => {
      if (exam.definition.name === 'RxToOrder') {
        return (
          <TouchableOpacity
            key={strings.finalRx}
            disabled={this.props.readonly}
            onPress={() =>
              this.state.rxToOrder &&
              this.props.navigation.navigate('exam', {
                exam: this.state.rxToOrder,
                appointmentStateKey: this.props.appointmentStateKey,
              })
            }>
            <PrescriptionCard
              title={strings.finalRx}
              exam={this.state.rxToOrder}
              editable={false}
            />
          </TouchableOpacity>
        );
      } else if (exam.definition.name === 'Consultation summary') {
        return (
          <VisitSummaryCard
            exam={exam}
            editable={!this.state.locked && !this.props.readonly}
            key={strings.summaryTitle}
          />
        );
      } else {
        return (
          <AssessmentCard
            exam={exam}
            disabled={this.props.readonly}
            navigation={this.props.navigation}
            key={exam.definition.name}
            appointmentStateKey={this.props.appointmentStateKey}
          />
        );
      }
    });
  }

  renderActionButtons() {
    const patientInfo: PatientInfo = this.props.patientInfo;
    const visit: Visit = this.state.visit;
    const appointment: Appointment = this.state.appointment;

    return (
      <View
        style={{paddingTop: 30 * fontScale, paddingBottom: 100 * fontScale}}>
        <View style={styles.flow}>
          {this.state.visit.prescription.signedDate && (
            <Button title={strings.signed} disabled={true} />
          )}
          {!this.state.locked && !this.state.visit.prescription.signedDate && (
            <Button title={strings.sign} onPress={() => this.signVisit()} />
          )}
          <Button
            title={strings.printRx}
            onPress={() => {
              printRx(this.props.visitId);
            }}
          />
          {this.hasMedicalRx() && (
            <Button
              title={strings.printMedicalRx}
              onPress={() => {
                printMedicalRx(this.props.visitId);
              }}
            />
          )}
          {this.hasFinalClFitting() && (
            <Button
              title={strings.printClRx}
              onPress={() => {
                printClRx(this.props.visitId);
              }}
            />
          )}
          {this.canTransfer() && (
            <Button
              title={strings.transferRx}
              onPress={() => {
                this.transferRx(this.props.visitId);
              }}
            />
          )}
          <Button
            title={strings.printPatientFile}
            onPress={() => {
              printPatientFile(this.props.visitId);
            }}
          />
          {isReferralsEnabled() && (
            <Button
              title={strings.referral}
              onPress={() => {
                this.props.navigation.navigate('referral', {
                  visit: getCachedItem(this.props.visitId),
                  patientInfo: patientInfo,
                  followUpStateKey: this.props.navigation.state.key,
                });
              }}
            />
          )}
          {!this.state.locked && !this.props.readonly && (
            <Button
              title={strings.lockVisit}
              onPress={() => this.lockVisit()}
            />
          )}
          {visit && visit.appointmentId && !this.props.readonly && (
            <Button
              title={
                appointment && appointment.status === 5
                  ? strings.completed
                  : strings.complete
              }
              disabled={appointment && appointment.status === 5}
              onPress={() => this.endVisit()}
            />
          )}
        </View>
      </View>
    );
  }

  renderAddableExamButton(section?: string) {
    if (this.props.readonly || section === 'Document') {
      return;
    }
    const doingPreExam: boolean = !visitHasStarted(this.state.visit);
    const addableExamDefinitions: ExamDefinition[] = this.state.addableExamTypes.filter(
      (examType: ExamDefinition) =>
        (doingPreExam === true && examType.isPreExam === true) ||
        (doingPreExam === false &&
          examType.section.substring(0, examType.section.indexOf('.')) ===
            section),
    );
    const addableExamLabels: string[] = addableExamDefinitions.map(
      (examType: ExamDefinition) =>
        examType.label ? examType.label : examType.name,
    );
    if (!addableExamLabels || addableExamLabels.length == 0) {
      return null;
    }
    return (
      <FloatingButton
        options={addableExamLabels}
        onPress={(examLabel: string) => this.addExam(examLabel)}
      />
    );
  }

  renderLockIcon() {
    if (this.state.locked !== true) {
      return null;
    }
    return (
      <View style={styles.examIcons}>
        <TouchableOpacity onPress={this.switchLock}>
          <Lock style={styles.screenIcon} locked={this.state.locked === true} />
        </TouchableOpacity>
      </View>
    );
  }

  render() {
    if (this.props.visitId === undefined) {
      return null;
    }
    if (!this.state.visit && !this.props.readonly) {
      return (
        <View>
          {!this.props.readonly && (
            <StartVisitButtons
              isPreVisit={true}
              onStartVisit={this.props.onStartVisit}
              isLoading={this.props.isLoading}
            />
          )}
        </View>
      );
    }
    const preExamDefinitions: ExamDefinition[] = getCachedItems(
      getCachedItem('preExamDefinitions'),
    );
    if (!visitHasStarted(this.state.visit)) {
      const hasPreTests =
        preExamDefinitions == undefined || preExamDefinitions.length > 0;
      return (
        <View>
          {hasPreTests && (
            <View style={styles.flow}>
              {this.renderExams(
                'Pre tests',
                getCachedItems(this.state.visit.preCustomExamIds),
                true,
              )}
            </View>
          )}
          {!this.props.readonly && (
            <StartVisitButtons
              isPreVisit={false}
              onStartVisit={this.props.onStartVisit}
              isLoading={this.props.isLoading}
            />
          )}
        </View>
      );
    }
    let exams: Exam[] = getCachedItems(this.state.visit.preCustomExamIds);
    if (!exams) {
      exams = [];
    }
    exams = exams.concat(getCachedItems(this.state.visit.customExamIds));
    return (
      <View>
        <View style={styles.flow}>
          {this.renderConsultationDetails()}
          {examSections.map((section: string) => {
            return this.renderExams(section, exams, false);
          })}
        </View>
        <View style={styles.flow}>{this.renderAssessments()}</View>
        {this.renderActionButtons()}
        {this.renderLockIcon()}
        {this.state.showSnackBar && this.renderSnackBar()}
      </View>
    );
  }
}

export class VisitHistoryCard extends Component {
  props: {
    patientInfo: PatientInfo,
  };
  state: {
    summaries: ?(Exam[]),
  };

  constructor(props: any) {
    super(props);
    this.state = {
      summaries: getRecentVisitSummaries(props.patientInfo.id),
    };
    this.refreshPatientInfo();
  }

  async refreshPatientInfo() {
    if (this.state.summaries) {
      return;
    }
    const summaries: ?(Exam[]) = getRecentVisitSummaries(
      this.props.patientInfo.id,
    );
    if (summaries === undefined) {
      await fetchVisitHistory(this.props.patientInfo.id);
      summaries = getRecentVisitSummaries(this.props.patientInfo.id);
    }
    this.setState({summaries});
  }

  render() {
    if (!this.state.summaries) {
      return null;
    }
    return (
      <View
        style={isWeb ? [styles.tabCard, {flexShrink: 100}] : styles.tabCard}>
        <Text style={styles.cardTitle}>{strings.summaryTitle}</Text>
        {this.state.summaries.map((visitSummary: Exam, index: number) => (
          <View style={styles.rowLayout}>
            <View
              style={
                isWeb ? [styles.cardColumn, {flex: 1}] : styles.cardColumn
              }>
              <Text style={styles.text}>
                {formatDate(
                  getCachedItem(visitSummary.visitId).date,
                  isToyear(getCachedItem(visitSummary.visitId).date)
                    ? dateFormat
                    : farDateFormat,
                )}
                : {visitSummary.resume}
                {'\n'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  }
}

export class VisitHistory extends Component {
  props: {
    appointment: Appointment,
    patientInfo: PatientInfo,
    visitHistory: string[],
    patientDocumentHistory: string[],
    navigation: any,
    appointmentStateKey: string,
    onRefresh: () => void,
    readonly: ?boolean,
    enableScroll: () => void,
    disableScroll: () => void,
  };
  state: {
    selectedId: ?string,
    history: ?(string[]),
    showingDatePicker: boolean,
    isLoading: boolean,
    showDialog: boolean,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      selectedId:
        this.props.navigation &&
        this.props.navigation.state &&
        this.props.navigation.state.params
          ? this.props.navigation.state.params.selectedVisitId
          : undefined,
      history: this.combineHistory(
        props.patientDocumentHistory,
        props.visitHistory,
      ),
      showingDatePicker: false,
      isLoading: false,
      showDialog: false,
    };
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    if (
      this.props.patientInfo !== undefined &&
      prevProps.patientInfo !== undefined &&
      this.props.patientInfo.id === prevProps.patientInfo.id &&
      this.props.visitHistory === prevProps.visitHistory &&
      this.props.patientDocumentHistory === prevProps.patientDocumentHistory
    ) {
      return;
    }
    this.setState({
      history: this.combineHistory(
        this.props.patientDocumentHistory,
        this.props.visitHistory,
      ),
    });
  }

  showVisit(id: ?string) {
    this.setState({selectedId: id});
  }

  async deleteVisit(visitId: string) {
    if (this.props.readonly) {
      return;
    }
    const visit: Visit = getCachedItem(visitId);
    if (!visit) {
      return;
    }
    try {
      visit.inactive = true;
      await updateVisit(visit);
      let i: number = this.props.visitHistory.indexOf(visitId);
      if (i >= 0) {
        this.props.visitHistory.splice(i, 1);
      }
      if (this.state.selectedId === visitId) {
        this.setState({selectedId: undefined});
      }
      this.props.onRefresh();
    } catch (error) {
      console.log(error);
      alert(strings.formatString(strings.serverError, error));
    }
  }

  confirmDeleteVisit(visitId: ?string) {
    this.deleteVisit(visitId);
    this.hideDialog();
  }

  isNewAppointment(): boolean {
    const appointment: Appointment = this.props.appointment;
    const visitHistory: string[] = this.props.visitHistory;
    if (appointment === undefined) {
      return false;
    }
    if (appointment.id === undefined) {
      return true;
    }
    if (!visitHistory) {
      return false;
    }
    let appointmentsVisitId: ?Visit = visitHistory.find((visitId: string) => {
      const visit: ?Visit = getCachedItem(visitId);
      return visit && visit.appointmentId === appointment.id;
    });
    return appointmentsVisitId === undefined;
  }

  newVisit(
    date: Date,
    appointmentId: string,
    patientId: string,
    userId: string,
  ): Visit {
    let newVisit: Visit = {
      id: 'visit',
      version: -1,
      appointmentId: appointmentId,
      patientId: patientId,
      userId: userId,
      typeName: '',
      date: formatDate(date, jsonDateTimeFormat),
      duration: 15, //TODO userpreference?
      storeId: undefined,
      preExamIds: [],
      examIds: [],
      recall: {},
      prescription: {},
      customExamIds: [],
      preCustomExamIds: [],
    };
    return newVisit;
  }

  async startVisit(visitId: string, visitType: string) {
    if (this.props.readonly) {
      return;
    }
    this.setState({isLoading: true});
    let visit = getCachedItem(visitId);
    visit.typeName = visitType;
    visit = await updateVisit(visit);
    this.props.onRefresh();
    this.setState({
      selectedId: visit.id,
      isLoading: false,
    });
  }

  async startAppointment() {
    if (this.props.readonly) {
      return;
    }
    const appointmentId: string = this.props.appointment.id;
    const patientId: string = this.props.patientInfo.id;
    const userId: string = getDoctor().id;
    const date: Date = now();
    let visit = this.newVisit(date, appointmentId, patientId, userId);
    visit = await createVisit(visit);
    this.props.onRefresh();
    this.setState({
      selectedId: visit.id,
    });
  }

  async addVisit(date: Date) {
    if (this.props.readonly) {
      return;
    }
    const appointmentId: string = null;
    const patientId: string = this.props.patientInfo.id;
    const userId: string = getDoctor().id;
    let visit = this.newVisit(date, appointmentId, patientId, userId);
    visit = await createVisit(visit);
    this.props.onRefresh();
    this.setState({
      selectedId: visit.id,
    });
  }

  combineHistory(
    patientDocumentHistory: ?(string[]),
    visitHistory: ?(string[]),
  ): string[] {
    if (!patientDocumentHistory && !visitHistory) {
      return undefined;
    }
    let history: string[] = [];
    if (!patientDocumentHistory || patientDocumentHistory.length === 0) {
      history = visitHistory;
    } else if (!visitHistory || visitHistory.length === 0) {
      history = patientDocumentHistory;
    } else {
      let visitIndex: number = 0;
      let patientDocumentIndex: number = 0;
      while (
        visitIndex < visitHistory.length ||
        patientDocumentIndex < patientDocumentHistory.length
      ) {
        let visit: ?Visit =
          visitIndex < visitHistory.length
            ? getCachedItem(visitHistory[visitIndex])
            : undefined;
        let patientDocument: ?PatientDocument =
          patientDocumentIndex < patientDocumentHistory.length
            ? getCachedItem(patientDocumentHistory[patientDocumentIndex])
            : undefined;
        if (!visit) {
          history.push(patientDocument.id);
          patientDocumentIndex++;
        } else if (!patientDocument) {
          history.push(visit.id);
          visitIndex++;
        } else {
          let visitDate: ?string = visit.date;
          let patientDocumentDate: ?string = patientDocument.postedOn;
          if (compareDates(visitDate, patientDocumentDate) >= 0) {
            history.push(visit.id);
            visitIndex++;
          } else {
            history.push(patientDocument.id);
            patientDocumentIndex++;
          }
        }
      }
    }
    return history;
  }

  showDatePicker = () => {
    this.setState({showingDatePicker: true});
  };

  hideDatePicker = () => {
    this.setState({showingDatePicker: false});
  };

  selectDate = (date: Date) => {
    if (compareDates(date, tomorrow()) >= 0) {
      alert(strings.futureVisitDateError);
      return;
    }
    this.setState({showingDatePicker: false}, () => this.addVisit(date));
  };

  hideDialog() {
    this.setState({showDialog: false});
  }
  showDialog(visitId: ?string) {
    if (!visitId.startsWith('visit-')) {
      return;
    }
    this.setState({showDialog: true, selectedId: visitId});
  }
  renderAlert() {
    const visit: Visit = getCachedItem(this.state.selectedId);
    if (!visit) {
      return null;
    }
    return (
      <Alert
        title={strings.deleteVisitTitle}
        message={strings.formatString(
          strings.deleteVisitQuestion,
          visit.typeName ? visit.typeName.toLowerCase() : strings.visit,
          formatMoment(visit.date),
        )}
        dismissable={false}
        onConfirmAction={() => this.confirmDeleteVisit(this.state.selectedId)}
        onCancelAction={() => this.hideDialog()}
        confirmActionLabel={strings.confirm}
        cancelActionLabel={strings.cancel}
        style={styles.alert}
      />
    );
  }
  renderActionButtons() {
    let isNewAppointment: boolean = this.isNewAppointment();
    return (
      <View style={styles.startVisitCard}>
        <View style={styles.flow}>
          {isNewAppointment && (
            <Button
              title={strings.startAppointment}
              onPress={() => this.startAppointment()}
            />
          )}
          {!isNewAppointment && (
            <Button title={strings.addVisit} onPress={this.showDatePicker} />
          )}
          {__DEV__ && <Button title={strings.printRx} />}
          {__DEV__ && <Button title="Book appointment" />}
        </View>
      </View>
    );
  }
  renderDateTimePicker() {
    return (
      <CustomDateTimePicker
        isVisible={this.state.showingDatePicker}
        hideTitleContainerIOS={true}
        selected={new Date()}
        mode="date"
        onChange={this.selectDate}
        onCancel={this.hideDatePicker}
        confirmText={strings.confirm}
        confirmTextStyle={styles.pickerLinkButton}
        cancelText={strings.cancel}
        cancelTextStyle={styles.pickerLinkButton}
        style={styles.alert}
        title={strings.consultationDate}
      />
    );
  }
  renderSummary() {
    return (
      <View>
        <View style={styles.flow}>
          <PatientRefractionCard patientInfo={this.props.patientInfo} />
          <PatientMedicationCard
            patientInfo={this.props.patientInfo}
            editable={false}
          />
          <VisitHistoryCard patientInfo={this.props.patientInfo} />
        </View>
        {!this.props.readonly && this.renderActionButtons()}
      </View>
    );
  }

  renderFollowUp() {
    return (
      <View>
        <View style={styles.flow}>
          <FollowUpScreen
            patientInfo={this.props.patientInfo}
            navigation={this.props.navigation}
            onUpdateVisitSelection={(selectedVisit) =>
              this.showVisit(selectedVisit)
            }
          />
        </View>
      </View>
    );
  }

  render() {
    let isNewAppointment: boolean = this.isNewAppointment();
    if (!this.state.history) {
      return null;
    }
    const patientInfo: PatientInfo = this.props.patientInfo;
    const listFollowUp: ?(FollowUp[]) = getCachedItem(
      'referralFollowUpHistory-' + patientInfo.id,
    );
    return (
      <View>
        <View style={styles.tabHeader}>
          <SummaryButton
            isSelected={this.state.selectedId === undefined}
            onPress={() => this.showVisit(undefined)}
          />
          {listFollowUp &&
            Array.isArray(listFollowUp) &&
            listFollowUp.length > 0 && (
              <FollowUpButton
                isSelected={this.state.selectedId === 'followup'}
                onPress={() => this.showVisit('followup')}
              />
            )}
          <FlatList
            horizontal={true}
            extraData={this.state.selectedId}
            data={this.state.history}
            keyExtractor={(visitId: string, index: number) => index.toString()}
            renderItem={(data: ?any) => (
              <VisitButton
                key={data.item}
                isSelected={this.state.selectedId === data.item}
                id={data.item}
                testID={'tab' + (data.index + 1)}
                keyboardShouldPersistTaps="handled"
                onPress={() => this.showVisit(data.item)}
                onLongPress={() => this.showDialog(data.item)}
              />
            )}
          />
        </View>
        {this.state.selectedId === undefined && this.renderSummary()}
        {this.state.selectedId === 'followup' && this.renderFollowUp()}

        {this.state.selectedId && this.state.selectedId.startsWith('visit') && (
          <VisitWorkFlow
            patientInfo={this.props.patientInfo}
            visitId={this.state.selectedId}
            navigation={this.props.navigation}
            appointmentStateKey={this.props.appointmentStateKey}
            onStartVisit={(visitType: string, isPreVisit: boolean) => {
              this.startVisit(this.state.selectedId, visitType);
            }}
            readonly={this.props.readonly}
            enableScroll={this.props.enableScroll}
            disableScroll={this.props.disableScroll}
            isLoading={this.state.isLoading}
          />
        )}
        {this.state.selectedId &&
          this.state.selectedId.startsWith('patientDocument') && (
            <PatientDocumentPage id={this.state.selectedId} />
          )}
        {this.state.selectedId && this.state.showDialog && this.renderAlert()}
        {!isNewAppointment &&
          this.state.showingDatePicker &&
          this.renderDateTimePicker()}
      </View>
    );
  }
}

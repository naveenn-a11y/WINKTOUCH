/**
 * @flow
 */

'use strict';

import RNBeep from '@dashdoc/react-native-system-sounds';
import { Component, PureComponent } from 'react';
import {
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  Modal
} from 'react-native';
import {
  Card,
  Button as NativeBaseButton,
  Paragraph,
  Portal,
  Title,
} from 'react-native-paper';
import CustomDateTimePicker from '../src/components/DateTimePicker/CustomDateTimePicker';
import { printHtml } from '../src/components/HtmlToPdf';
import {
  fetchAppointment,
  hasAppointmentBookAccess,
  invoiceForAppointment,
} from './Appointment';
import {
  AssessmentCard,
  PrescriptionCard,
  VisitSummaryCard,
  VisitSummaryPlanCard,
} from './Assessment';
import { formatCode, getAllCodes, getDefaultUserSetting, getUserSetting } from './Codes';
import {
  cacheItem,
  cacheItemById,
  cacheItemsById,
  getCachedItem,
  getCachedItems,
} from './DataCache';
import { getDoctor, getStore } from './DoctorApp';
import { VisitErrorBoundary } from './ErrorBoundary';
import {
  createExam,
  ExamCard,
  getExam,
  getFieldValue,
  renderExamHtml,
  storeExam,
  UserAction,
  getFieldDefinition as getExamFieldDefinition,
} from './Exam';
import { allExamDefinitions } from './ExamDefinition';
import { FollowUpScreen } from './FollowUp';
import { formatLabel } from './Items';
import { PatientDocumentPage } from './Patient';
import {
  getScannedFiles,
  getVisitHtml,
  initValues,
  printPatientHeader,
  renderAttachment,
  setScannedFiles,
} from './PatientFormHtml';
import { emailClRx, emailRx, printClRx, printMedicalRx, printRx } from './Print';
import { isReferralsEnabled } from './Referral';
import {
  fetchItemById,
  getPrivileges,
  getRestUrl,
  getToken,
  performActionOnItem,
  searchItems,
  storeItem,
  stripDataType,
} from './Rest';
import { getExamRoomCode, updateExamRoom } from './Room';
import { getUserLanguage, strings } from './Strings';
import { fontScale, isWeb, styles } from './Styles';
import type {
  Appointment,
  CodeDefinition,
  Exam,
  ExamDefinition,
  ExamRoom,
  FollowUp,
  PatientDocument,
  PatientInfo,
  PatientInvoice,
  Store,
  User,
  Visit,
  VisitType
} from './Types';
import {
  compareDates,
  dateFormat,
  farDateFormat,
  formatDate,
  formatMoment,
  getDoctorFullName,
  getValue,
  isEmpty,
  isSameDay,
  isToyear,
  jsonDateTimeFormat,
  now,
  parseDate,
  deepClone,
  tomorrow,
  yearDateFormat,
  yearDateTime24Format,
  yearDateTimeFormat,
  titleToCamelCase,
} from './Util';
import Dialog from './utilities/Dialog';
import { VisitSummaryTable } from './VisitSummary';
import {
  Alert,
  Button,
  FloatingButton,
  ListField,
  Lock,
  NativeBar,
  NoAccess,
  SelectionDialog,
} from './Widgets';
import { fetchWinkRest } from './WinkRest';
import { getDefaultValue } from './GroupedForm';
import axios from 'axios';
import { printBase64Pdf } from './Print';
import { Buffer } from 'buffer';

export const examSections: string[] = [
  'Amendments',
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
  'Amendements',
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

export const examSectionsEs: string[] = [
  'Enmiendas',
  'Queja principal',
  'Historia',
  'Pruebas de ingreso',
  'Pruebas de visión',
  'Examen anterior',
  'Examen posterior',
  'LC',
  'Formulario',
  'Documentos',
];

const examSectionsLayout: {} = {
  Consultation: '45%',
  Amendments: '45%',
  'Chief complaint': '95%',
  History: '95%',
  'Entrance testing': '95%',
  'Vision testing': '95%',
  'Anterior exam': '45%',
  'Posterior exam': '45%',
  CL: '95%',
  Form: '95%',
  Document: '95%',
};

function hasExamSectionsAccess(section: string, visit: Visit): boolean {
  if (isEmpty(section)) {
    return false;
  }
  if (section === 'CL') {
    return (
      hasVisitFittingReadAccess(visit) ||
      hasVisitPretestReadAccess(visit) ||
      hasVisitMedicalDataReadAccess(visit)
    );
  } else {
    return (
      hasVisitPretestReadAccess(visit) || hasVisitMedicalDataReadAccess(visit)
    );
  }
}

const PRIVILEGE = {
  FULLACCESS: 'FULLACCESS',
  NOACCESS: 'NOACCESS',
  READONLY: 'READONLY',
};

function getSectionWidth(section: string): string {
  return examSectionsLayout[section] !== undefined
    ? examSectionsLayout[section]
    : '95%';
}
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
  } else if (language.startsWith('es')) {
    const i: number = examSections.indexOf(section, 0);
    if (i >= 0 && i < examSectionsEs.length - 1) {
      return examSectionsEs[i];
    }
  }
  return section;
}

export async function fetchVisit(visitId: string): Visit {
  let visit: Visit = await fetchItemById(visitId, true);
  return visit;
}

export async function fetchVisitTypes(
  showAllVisitTypes: ?boolean,
): VisitType[] {
  const searchCriteria = {showAllVisitTypes: showAllVisitTypes};
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
  if (visitTypes) {
    visitTypes = visitTypes.filter((vt: VisitType) => !vt.inactive);
  }
  return visitTypes;
}
export function getAllVisitTypes(): VisitType[] {
  let visitTypes: VisitType[] = getCachedItem('visitTypes');
  return visitTypes;
}

function hasVisitMedicalDataReadAccess(visit: Visit): boolean {
  if (!visit) {
    return false;
  }
  return (
    visit.medicalDataPrivilege === PRIVILEGE.READONLY ||
    visit.medicalDataPrivilege === PRIVILEGE.FULLACCESS
  );
}
function hasVisitPretestReadAccess(visit: Visit): boolean {
  if (!visit) {
    return false;
  }
  return (
    visit.pretestPrivilege === PRIVILEGE.READONLY ||
    visit.pretestPrivilege === PRIVILEGE.FULLACCESS
  );
}
function hasVisitFinalRxReadAccess(visit: Visit): boolean {
  if (!visit) {
    return false;
  }
  return (
    visit.finalRxPrivilege === PRIVILEGE.READONLY ||
    visit.finalRxPrivilege === PRIVILEGE.FULLACCESS
  );
}
function hasVisitFittingReadAccess(visit: Visit): boolean {
  if (!visit) {
    return false;
  }
  return (
    visit.fittingPrivilege === PRIVILEGE.READONLY ||
    visit.fittingPrivilege === PRIVILEGE.FULLACCESS
  );
}

function hasVisitMedicalDataWriteAccess(visit: Visit): boolean {
  if (!visit) {
    return false;
  }
  return visit.medicalDataPrivilege === PRIVILEGE.FULLACCESS;
}
function hasVisitPretestWriteAccess(visit: Visit): boolean {
  if (!visit) {
    return false;
  }
  return visit.pretestPrivilege === PRIVILEGE.FULLACCESS;
}
function hasVisitFinalRxWriteAccess(visit: Visit): boolean {
  if (!visit) {
    return false;
  }
  return visit.finalRxPrivilege === PRIVILEGE.FULLACCESS;
}
function hasVisitFittingWriteAccess(visit: Visit): boolean {
  if (!visit) {
    return false;
  }
  return visit.fittingPrivilege === PRIVILEGE.FULLACCESS;
}

export function visitHasStarted(visit: string | Visit): boolean {
  if (visit instanceof Object === false) {
    visit = getCachedItem(visit);
  }
  return visit.customExamIds !== undefined && visit.customExamIds.length > 0;
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

export function pretestHasStarted(visit: string | Visit): boolean {
  if (visit instanceof Object === false) {
    visit = getCachedItem(visit);
  }
  return (
    visit.preCustomExamIds !== undefined && visit.preCustomExamIds.length > 0
  );
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
  pageNumber: number = 1,
  pageSize: number = 20,
): FollowUp[] {
  let parameters: {} = {
    pageNumber,
    pageSize,
  };
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

  //only cache here if it is a patient's referral
  if (!isEmpty(patientId)) {
    const id: string = isEmpty(patientId) ? '*' : patientId;
    cacheItem('referralFollowUpHistory-' + id, allFollowUp);
  }
  return response;
}

export async function fetchVisitForAppointment(appointmentId: string): Visit {
  const searchCriteria = {appointmentId: appointmentId};
  let restResponse = await searchItems(
    'Visit/list/appointment',
    searchCriteria,
  );
  const visit: Visit = restResponse.visit;
  cacheItemById(visit);
  return visit;
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
  const patientInvoiceList: PatientInvoice[] = restResponse.patientInvoiceList
    ? restResponse.patientInvoiceList
    : [];
  const users: User[] = restResponse.userList;
  const referralsFollowUp: FollowUp[] = await fetchReferralFollowUpHistory(
    patientId,
  );

  //    customExams && customExams.forEach((exam: Exam) => overwriteExamDefinition(exam)); //TODO remove after beta
  cacheItemsById(customExams);
  visits.forEach(visit => !getCachedItem(visit.id)?.customExamIds && cacheItemById(visit));
  cacheItemsById(patientDocuments);
  cacheItemsById(users);
  cacheItemsById(stores);
  cacheItem('visitHistory-' + patientId, visitIds);
  cacheItem('patientDocumentHistory-' + patientId, patientDocumentIds);
  return visitIds;
}

export function getPreviousVisits(patientId: string): ?(CodeDefinition[]) {
  if (patientId === undefined || patientId === null || patientId === '') {
    return undefined;
  }
  let visitHistory: ?(Visit[]) = getVisitHistory(patientId);
  if (!visitHistory || visitHistory.length === 0) {
    return undefined;
  }
  let codeDescriptions: CodeDefinition[] = [];
  //Check if there is two visits of the same type on the same day
  let hasDoubles: boolean = false;
  for (let i: number = 0; i < visitHistory.length - 1; i++) {
    for (let j: number = i + 1; j < visitHistory.length; j++) {
      if (
        isSameDay(
          parseDate(visitHistory[i].date),
          parseDate(visitHistory[j].date),
        )
      ) {
        if (visitHistory[i].typeName === visitHistory[j].typeName) {
          hasDoubles = true;
          break;
        }
      } else {
        break;
      }
      if (hasDoubles) {
        break;
      }
    }
  }
  const dateFormat: string = hasDoubles ? yearDateTime24Format : yearDateFormat;
  //Format the visits as CodeDefinitions
  visitHistory.forEach((visit: Visit) => {
      let readonly: boolean = visit.pretestPrivilege === 'NOACCESS';
      const code: string = visit.id;
      const description: string =
        formatDate(visit.date, dateFormat) + ' - ' + visit.typeName;
      const codeDescription: CodeDefinition = {code, description, readonly};
      codeDescriptions.push(codeDescription);
  });
  return codeDescriptions;
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
    if (
      visit.medicalDataPrivilege !== 'READONLY' &&
      visit.medicalDataPrivilege !== 'FULLACCESS'
    ) {
      let noAccessExam: Exam[] = [{noaccess: true, visitId: visit.id}];
      visitSummaries = [...visitSummaries, ...noAccessExam];
    } else {
      if (visit.customExamIds) {
        visit.customExamIds.forEach((examId: string) => {
          const exam: Exam = getCachedItem(examId);
          if (exam.resume) {
            visitSummaries = [...visitSummaries, exam];
          }
        });
        if (visitSummaries.length > 5) {
          return visitSummaries;
        }
      }
    }
  });
  return visitSummaries;
}

async function printPatientFile(visitId: string, cb) {
  initValues();
  let visitHtml: string = '';
  const visit: Visit = getCachedItem(visitId);
  const allExams: string[] = allExamIds(visit);
  let exams: Exam[] = getCachedItems(allExams);
  setScannedFiles(visitHtml);
  let xlExams: Exam[] = [];
  visitHtml += printPatientHeader(visit);
  if (exams) {
    let htmlDefinition: HtmlDefinition[] = [];
    for (const section: string of examSections) {
      let filteredExams = exams.filter(
        (exam: Exam) =>
          exam.definition.section &&
          exam.definition.section.startsWith(section),
      );
      filteredExams.sort(compareExams);
      for (const exam: string of filteredExams) {
        let xlGroupDefinition: GroupDefinition[] =
          exam.definition.fields.filter(
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
    let HtmlWithAttachment: string = renderAttachment(visitHtml.html);
    await printHtml(HtmlWithAttachment, visitHtml.PDFAttachment, cb);
  }
}

export async function transferRx(visitId: string): boolean {
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
    RNBeep.play(RNBeep.iOSSoundIDs.MailSent);
    return true;
  }
  return false;
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
  title?: string,
  onStartVisit: (type: string) => void,
  isLoading: ?boolean,
  patientInfo: ?PatientInfo,
  isPretest: boolean,
  currentVisitId: string,
};
type StartVisitButtonsState = {
  visitTypes: VisitType[],
  clicked: boolean,
  isVisitOptionsVisible: boolean,
  isExamRoomOptionsVisible: boolean,
  visitOptions: CodeDefinition[],
  examRoomOptions: CodeDefinition[],
  visitType: string,
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
      isVisitOptionsVisible: false,
      isExamRoomOptionsVisible: false,
      visitOptions: [],
      visitType: '',
      examRoomOptions: [],
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
    this.setState({clicked: true, visitType: visitType}, () => {
      this.showExamRoomOptions();
      this.setState({clicked: false});
    });
  }

  showVisitOptions() {
    if (!this.props.isPreVisit) {
      const blankVisit: CodeDefinition = {
        code: undefined,
        description: strings.startBlank,
      };
      let previousVisits: CodeDefinition[] = getPreviousVisits(
        this.props.patientInfo.id,
      );
      previousVisits = previousVisits.filter((value: CodeDefinition) => {
        return value.code != this.props.currentVisitId;
      });
      const options: CodeDefinition[] = [blankVisit].concat(previousVisits);
      this.setState({
        visitOptions: options,
        isVisitOptionsVisible: true,
      });
    }
  }

  showExamRoomOptions() {
    const blankRoom: CodeDefinition = {
      code: undefined,
      description: strings.noRoom,
    };
    const allRooms: CodeDefinition[] = getAllCodes('examRooms');
    if (!allRooms || allRooms.length <= 0) {
      return this.onSelectVisit();
    }

    const examRooms: CodeDefinition[] = [blankRoom].concat(allRooms);
    this.setState({
      examRoomOptions: examRooms,
      isExamRoomOptionsVisible: true,
    });
  }

  hideVisitOptions = () => {
    this.setState({isVisitOptionsVisible: false});
  };

  hideExamRoomOptions = () => {
    this.setState({isExamRoomOptionsVisible: false});
  };

  selectVisit = (visit: ?CodeDefinition) => {
    this.setState({isVisitOptionsVisible: false});
    this.props.onStartVisit(
      this.state.visitType,
      this.props.isPreVisit,
      visit ? visit.code : undefined,
    );
  };

  selectExamRoom = (examRoom: ?CodeDefinition) => {
    this.setState({isExamRoomOptionsVisible: false});
    let inactive: boolean = false;
    if (!examRoom || !examRoom.code) {
      examRoom = this.getExamRoom();
      inactive = true;
    }
    if (examRoom && examRoom.code) {
      const examRoomPatient: ExamRoom = {
        id: 'room-' + examRoom.code,
        patientId: this.props.patientInfo.id,
        examRoomId: 'room-' + examRoom.code,
        inactive: inactive,
      };
      updateExamRoom(examRoomPatient);
    }

    this.onSelectVisit();
  };

  onSelectVisit() {
    if (this.props.isPretest == false) {
      this.showVisitOptions();
    } else {
      this.props.onStartVisit(this.state.visitType);
    }
  }

  getExamRoom(): CodeDefinition {
    const examRoom: CodeDefinition = getExamRoomCode(this.props.patientInfo.id);
    return examRoom;
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
            <TouchableOpacity
              testID={`visitType.${visitType.name}`}
              onPress={() => this.startVisit(visitType.name)}
              key={index}>
              <View style={styles.button}>
                <Text style={styles.buttonText}>{visitType.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <SelectionDialog
          visible={this.state.isVisitOptionsVisible}
          label={strings.startFromVisit}
          options={this.state.visitOptions}
          onSelect={this.selectVisit}
          onCancel={this.hideVisitOptions}
        />
        <SelectionDialog
          visible={this.state.isExamRoomOptionsVisible}
          label={'Exam Room'}
          options={this.state.examRoomOptions}
          value={this.getExamRoom()}
          onSelect={this.selectExamRoom}
          onCancel={this.hideExamRoomOptions}
        />
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
    onStartVisit: (
      type: string,
      isPreVisit: boolean,
      cVisitId?: string,
    ) => void,
    readonly: ?boolean,
    enableScroll: () => void,
    disableScroll: () => void,
    isLoading: ?boolean,
    onRefresh: () => void,
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
    showRxPopup: boolean,
    printRxCheckBoxes: string[],
    showMedicationRxPopup: boolean,
    printing: boolean,
    showClRxPopup: boolean,
    isPrintingRx: boolean,
    isPrintingCLRx: boolean,
    postInvoiceLoading: boolean,
    showLockDialog: boolean,
    lockDialogTitle: string,
    lockDialogMessage: string,
    lockAlertAction: string,
    showInvoiceAlert: ?boolean,
    showVisitTypeAlert: ?boolean,
    visitType: ?string,
    showInvoiceOptionsAlert: boolean
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
      showRxPopup: false,
      showMedicationRxPopup: false,
      printing: false,
      showClRxPopup: false,
      isPrintingRx: false,
      isPrintingCLRx: false,
      postInvoiceLoading: false,
      showLockDialog: false,
      lockDialogTitle: '',
      lockDialogMessage: '',
      lockAlertAction: 'lock',
      showInvoiceAlert: false,
      showVisitTypeAlert: false,
      visitType: visit.typeName,
      showInvoiceOptionsAlert: false
    };
    visit && this.loadUnstartedExamTypes(visit);
  }

  async componentDidUpdate(prevProps: any) {
    const params = this.props.route.params;

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
    const visitType: string = visit.typeName;
    this.setState(
      {
        visit,
        locked,
        rxToOrder,
        visitType,
      },
      () => {
        visit && this.loadUnstartedExamTypes(visit);
        this.loadAppointment(visit);
      },
    );
  }

  componentDidMount() {
    const visit: Visit = getCachedItem(this.props.visitId);
    this.loadAppointment(visit);
  }

  async storeVisit(visit: Visit) {
    if (this.props.readonly) {
      return;
    }
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
    if (!visit) {
      return undefined;
    }
    if (!visit.customExamIds) {
      return undefined;
    }
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
    if (!visit || !visit.appointmentId) {
      this.setState({appointment: undefined});
      return;
    }
    let appointment: Appointment = getCachedItem(visit.appointmentId);
    if (!appointment) {
      appointment = await fetchAppointment(visit.appointmentId);
    }

    this.setState({appointment: appointment});
  }

  async loadUnstartedExamTypes(visit: Visit) {
    if (this.props.readonly) {
      return;
    }
    const locked: boolean = this.state.locked;

    let allExamTypes: ExamDefinition[] = await allExamDefinitions(true);
    allExamTypes = allExamTypes.concat(await allExamDefinitions(false));
    let unstartedExamTypes: ExamDefinition[] = allExamTypes.filter(
      (examType: ExamDefinition) => {
        let existingExamIndex: number = visit.preCustomExamIds
          ? visit.preCustomExamIds.findIndex(
              (examId: string) =>
                getCachedItem(examId).definition.name === examType.name &&
                getCachedItem(examId).isHidden !== true &&
                getCachedItem(examId).definition.multiValue !== true,
            )
          : -1;
        if (existingExamIndex < 0 && visit.customExamIds) {
          existingExamIndex = visit.customExamIds.findIndex(
            (examId: string) =>
              getCachedItem(examId).definition.name === examType.name &&
              getCachedItem(examId).isHidden !== true &&
              getCachedItem(examId).definition.multiValue !== true,
          );
        }
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

    if (locked) {
      unstartedExamTypes = unstartedExamTypes.filter(
        (examDefinition: ExamDefinition) =>
          examDefinition.addablePostLock === true,
      );
    }
    if (isEmpty(visit.visitTypeId)) {
      unstartedExamTypes = [];
    }

    this.setState({addableExamTypes: unstartedExamTypes, addableSections});
  }

  hasMedicalRx(): boolean {
    const medicationExam: Exam = getExam(
      'Prescription',
      getCachedItem(this.props.visitId),
    );
    if (!medicationExam) {
      return false;
    }
    const value = medicationExam.Prescription;
    return !isEmpty(value);
  }

  hasFinalClFitting(): boolean {
    const fittingExam: Exam = getExam(
      'Fitting',
      getCachedItem(this.props.visitId),
    );
    if (!fittingExam || fittingExam.isHidden) {
      return false;
    }
    let value = fittingExam.Fitting;
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
      !!store &&
      !!store?.winkToWinkId &&
      store?.winkToWinkId > 0 &&
      store?.winkToWinkEmail !== undefined &&
      store?.winkToWinkEmail != null &&
      store?.winkToWinkEmail.trim() != '' &&
      this.state.visit.userId === getDoctor()?.id
    );
  }

  canSign(): boolean {
    return (
      !this.state.locked &&
      !this.state.visit.prescription.signedDate &&
      this.state.visit.userId === getDoctor().id
    );
  }

  canLock(): boolean {
    return (
      !this.state.locked &&
      !this.props.readonly &&
      this.state.visit.userId === getDoctor().id
    );
  }

  canInvoice(): boolean {
    const visit: Visit = this.state.visit;
    const appointment: Appointment = this.state.appointment;
    const canInvoice: boolean =
      visit?.appointmentId &&
      !this.props.readonly &&
      appointment &&
      appointment?.status === 5;

    return canInvoice;
  }
  hasInvoice(): boolean {
    const visit: Visit = this.state.visit;
    return visit.invoices && visit.invoices.length > 0;
  }

  async createExam(examDefinitionId: string): Exam {
    if (this.props.readonly) {
      return undefined;
    }
    const visit: ?Visit = this.state.visit;
    if (!visit?.id) {
      return;
    }
    let exam: Exam = {
      id: 'customExam',
      visitId: visit.id,
      customExamDefinitionId: examDefinitionId,
    };
    exam = await createExam(exam);
    if (exam.errors) {
      alert(exam.errors);
      return undefined;
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
    await this.loadUnstartedExamTypes(visit);
    this.setState({visit});
    return exam;
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
    if (existingExam && examDefinition.multiValue !== true) {
      this.unhideExam(existingExam);
    } else {
      let exam = await this.createExam(examDefinition.id);
      exam != undefined && !exam.isInvalid ? this.selectExam(exam) : () => {};
    }
  }

  validateVisit(): {visitIsValid: boolean, listOfInvalidTiles: string} {
    let visitIsValid: boolean = true;
    let listOfInvalidTiles: string = '';

    const visit: Visit = this.state.visit;
    let exams: Exam[] = getCachedItems(visit.preCustomExamIds);
    if (!exams) {
      exams = [];
    }
    exams = exams.concat(getCachedItems(visit.customExamIds));

    exams?.forEach((exam) => {
      if (exam.isInvalid) {
        visitIsValid = false;
        listOfInvalidTiles += `\t\u{2022} ${formatLabel(exam.definition)} \n`;
      }
    });

    return {visitIsValid, listOfInvalidTiles};
  }

  async lockVisit() {
    if (this.props.readonly) {
      return;
    }
    const {visitIsValid, listOfInvalidTiles} = this.validateVisit();
    if (visitIsValid) {
      await this.confirmLockVisit();
    } else {
      let alertTitle = strings.lockAlertTitle;
      let alertMessage: string = strings.lockAlertMessage;
      alertMessage += listOfInvalidTiles;
      this.showLockDialog(alertTitle, alertMessage, 'lock');
    }
  }

  openReferral = () => {
    const {visitIsValid, listOfInvalidTiles} = this.validateVisit();
    if (visitIsValid) {
      this.confirmOpenReferral();
    } else {
      let alertTitle: string = strings.referralAlertTitle;
      let alertMessage: string = strings.referralAlertMessage;
      alertMessage += listOfInvalidTiles;
      this.showLockDialog(alertTitle, alertMessage, 'referral');
    }
  };

  confirmOpenReferral() {
    this.hideLockDialog();
    this.props.navigation.navigate('referral', {
      visit: getCachedItem(this.props.visitId),
      patientInfo: this.props.patientInfo,
      followUpStateKey: this.props.route.key,
    });
  }

  alertAction = () => {
    if (this.state.lockAlertAction === 'lock') {
      this.confirmLockVisit();
    } else if (this.state.lockAlertAction === 'complete') {
      this.confirmEndVisit();
    } else if (this.state.lockAlertAction === 'referral') {
      this.confirmOpenReferral();
    }
  };

  confirmLockVisit = async (): void => {
    const visit: Visit = this.state.visit;
    try {
      this.hideLockDialog();
      this.props.navigation.goBack();
      visit.locked = true;
      await updateVisit(visit);
    } catch (error) {
      console.log(error);
      alert(strings.formatString(strings.serverError, error));
    }
  };

  hideLockDialog() {
    this.setState({
      lockDialogTitle: '',
      lockDialogMessage: '',
      showLockDialog: false,
    });
  }

  showLockDialog(title: string, message: string, action: string) {
    this.setState({
      lockDialogTitle: title,
      lockDialogMessage: message,
      lockAlertAction: action,
      showLockDialog: true,
    });
  }

  showInvoiceAlert() {
    this.setState({showInvoiceAlert: true});
  }
  hideInvoiceAlert() {
    this.setState({showInvoiceAlert: false});
  }
  renderLockAlert() {
    return (
      <Alert
        title={this.state.lockDialogTitle}
        message={this.state.lockDialogMessage}
        dismissable={false}
        onConfirmAction={this.alertAction}
        onCancelAction={() => this.hideLockDialog()}
        confirmActionLabel={strings.yes}
        cancelActionLabel={strings.no}
      />
    );
  }
  renderInvoiceAlert() {
    return (
      <Alert
        title={strings.InvoiceAgainAlertTitle}
        message={strings.InvoiceAgainAlertMessage}
        dismissable={true}
        onConfirmAction={() => this.invoice()}
        onCancelAction={() => this.hideInvoiceAlert()}
        confirmActionLabel={strings.invoiceAgain}
        cancelActionLabel={strings.cancel}
        style={styles.alert}
      />
    );
  }

  async invoice() {
    this.hideInvoiceAlert();
    this.setState({postInvoiceLoading: true});
    const appointment: Appointment = this.state.appointment;
    const visit: Visit = this.state.visit;
    if (appointment === undefined || appointment === null) {
      return;
    }
    try {
      const patientInvoices: PatientInvoice[] = await invoiceForAppointment(
        appointment.id,
      );
      if (patientInvoices && patientInvoices.length > 0) {
        const piIds: string[] = patientInvoices.map((inv) => inv.id);
        const ids: string = piIds.join();
        this.setSnackBarMessage(
          strings.formatString(strings.invoiceCreatedSuccessMessage, ids),
        );
        visit.invoices = patientInvoices;
        this.getInvoicePdf(ids.replace(/[^0-9]/g,""));
      } else {
        this.setSnackBarMessage(strings.NoinvoiceCreatedMessage);
      }
    } catch (error) {
      __DEV__ && console.log(error);
      alert(strings.formatString(strings.serverError, error));
    }
    this.setState({visit, postInvoiceLoading: false});
    this.showSnackBar();
  }

  async endVisit() {
    const appointment: Appointment = this.state.appointment;
    if (appointment === undefined || appointment === null) {
      return;
    }
    const {visitIsValid, listOfInvalidTiles} = this.validateVisit();
    if (visitIsValid) {
      await this.confirmEndVisit();
      this.hideLockDialog();
    } else {
      let alertTitle: string = strings.completeAlertTitle;
      let alertMessage: string = strings.completeAlertMessage;
      alertMessage += listOfInvalidTiles;
      this.showLockDialog(alertTitle, alertMessage, 'complete');
    }
  }

  confirmEndVisit = async (): void => {
    const appointment: Appointment = this.state.appointment;
    if (appointment === undefined || appointment === null) {
      this.hideLockDialog();
      return;
    }

    try {
      this.hideLockDialog();
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
  };

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
    this.setState(prevState => ({locked: !prevState.locked}), () => {
      this.loadUnstartedExamTypes(this.state.visit);
    });
  };

  isEqualCoerced(value1, value2) {
    return (value1 == value2) || ((value1 == null && (value2 === undefined || value2 === 0 || value2 === '')) || 
           (value2 == null && (value1 === undefined || value1 === 0 || value1 === '')));
  }

  // Helper method to check if an exam only has default values
  examHasOnlyDefaultValues = (exam: Exam): boolean => {
    // Early validation
    if (!exam.definition.fields || !exam[exam.definition.name]) {
      return true;
    }

    // Recursive function to check field values against defaults
    const checkFieldsAgainstDefaults = (fieldDefs: any[], values: any): boolean => {
      // Check for unexpected keys in values that don't correspond to field definitions
      if (values && typeof values === 'object' && !Array.isArray(values)) {
        const definedFieldNames = new Set();

        // Collect all defined field names (including camelCase versions)
        for (const fieldDef of fieldDefs) {
          definedFieldNames.add(fieldDef.name);
          if (typeof fieldDef.name === 'string') {
            definedFieldNames.add(titleToCamelCase(fieldDef.name));
          }
        }

        // Check if there are any keys in values that aren't in the field definitions
        // Exclude system keys like entityId
        const excludedKeys = new Set(['entityId']);

        for (const key in values) {
          if (values.hasOwnProperty(key) && !isEmpty(values[key]) && !definedFieldNames.has(key) && !excludedKeys.has(key)) {
            return false; // Found unexpected data
          }
        }
      }

      for (const fieldDef of fieldDefs) {
        // Handle nested fields recursively
        if (fieldDef.fields && Array.isArray(fieldDef.fields)) {
          // If the field has nested fields
          const nestedValues = values[fieldDef.name];

          // Skip if no values exist for this nested field
          if (!nestedValues) continue;

          // Handle array of objects
          if (Array.isArray(nestedValues)) {
            for (const itemValues of nestedValues) {
              // Check each item's nested fields
              if (!checkFieldsAgainstDefaults(fieldDef.fields, itemValues)) {
                return false;
              }
            }
          }
          // Handle single object
          else if (typeof nestedValues === 'object' && nestedValues !== null) {
            if (!checkFieldsAgainstDefaults(fieldDef.fields, nestedValues)) {
              return false;
            }
          }
          continue;
        }

        // Regular field processing
        const fieldName = fieldDef.name;
        // Try to get the value using both original and camelCase field names
        let actualValue = values?.[fieldName];
        if (actualValue === undefined && typeof fieldName === 'string') {
          // Try camelCase version if not found
          const camelCaseFieldName = titleToCamelCase(fieldName)
          actualValue = values?.[camelCaseFieldName];
        }

        // Skip if field is empty
        if (isEmpty(actualValue)) continue;

        // Skip date fields (If Default)
        if (fieldDef?.type === 'futureDate' || (fieldDef?.defaultValue?.startsWith('[') && fieldDef?.defaultValue?.endsWith(']'))) {
          continue;
        }

        // Skip autoSelect fields with matching selectedIndex
        if (fieldDef.autoSelect && fieldDef.selectedIndex === actualValue) {
          continue;
        }

        if (fieldDef.autoSelect && fieldDef.selectedIndex) {
          if (fieldDef.options && Array.isArray(fieldDef.options)) {
            if (fieldDef.options[fieldDef.selectedIndex - 1] == actualValue) continue;
          } else if (fieldDef.sectionIndex === actualValue) {
            continue;
          }
        }

        // Skip readonly fields
        if (fieldDef.readonly) {
          continue;
        }

        // Get the expected default value for this field
        const defaultValue = getDefaultValue(fieldDef, exam);

        // If a field has a value different from its default, 
        // the exam doesn't have only default values
        if (!this.isEqualCoerced(actualValue, defaultValue)) {
          return false;
        }
      }
      return true;
    };

    // Process each group in the exam definition
    const groupDef = exam.definition;

      if (!groupDef.fields) {
        return false;
      };
      const groupValues = exam[exam.definition.name];

      // Skip if group doesn't exist in the actual exam data
      if (!groupValues) {
        return false;
      };

      // Handle case where groupValues is an array
      if (Array.isArray(groupValues)) {
        // Check each item in the array
        for (const itemValues of groupValues) {
          if (!checkFieldsAgainstDefaults(groupDef.fields, itemValues)) {
            return false;
          }
        }
      }
      // Handle case where groupValues is an object
      else if (!checkFieldsAgainstDefaults(groupDef.fields, groupValues)) {
        return false;
      }

      if (groupDef.import && Array.isArray(groupDef.import) && groupDef?.import?.length > 0) {
        for (const importField of groupDef?.import) {
          const fDef = getExamFieldDefinition(importField, exam);
          if (!checkFieldsAgainstDefaults(fDef ?? [], groupValues)) {
            return false;
          }
        }
      }
    return true;
  };

  hideExam = (exam: Exam) => {
    if (this.props.readonly) {
      return;
    }

    // Check if exam only has default values
    const hasOnlyDefaultValues = this.examHasOnlyDefaultValues(exam);
    
    if (!hasOnlyDefaultValues && !isEmpty(exam[exam.definition.name])) {
      alert(strings.removeItemError);
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
    this.selectExam(exam);
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
    const rxSuccess: boolean = await transferRx(visitId);
    if (rxSuccess) {
      this.setSnackBarMessage(strings.transferRxSuccess);
      this.showSnackBar();
    }
  }

  selectExam = (exam: Exam) => {
    if (exam.isInvalid) {
      exam.isInvalid = false;
      exam.hasStarted = true;
      storeExam(exam, this.props.appointmentStateKey, this.props.navigation);
    } else {
      this.props.navigation.navigate('exam', {
        exam,
        appointmentStateKey: this.props.appointmentStateKey,
      });
    }
  };

  filterExamsBySection(
    section: String,
    exams: ?(Exam[]),
    isPreExam: boolean,
    includeAssessments: ?boolean,
  ): Exam {
    if (exams) {
      if (!isPreExam) {
        exams = exams.filter(
          (exam: Exam) =>
            exam &&
            exam.definition.section &&
            exam.definition.section.startsWith(section),
        );
      }
      if (includeAssessments) {
        exams = exams.filter(
          (exam: Exam) =>
            exam &&
            exam.definition.isAssessment &&
            exam.isHidden !== true &&
            (exam.hasStarted ||
              (this.state.locked !== true && this.props.readonly !== true) ||
              (this.state.locked === true &&
                exam.definition.addablePostLock === true)),
        );
      } else {
        exams = exams.filter(
          (exam: Exam) =>
            exam &&
            !exam.definition.isAssessment &&
            exam.isHidden !== true &&
            (exam.hasStarted ||
              (this.state.locked !== true && this.props.readonly !== true) ||
              (this.state.locked === true &&
                exam.definition.addablePostLock === true)),
        );
      }

      exams.sort(compareExams);
    }
    return exams;
  }

  renderSnackBar() {
    return (
      <NativeBar
        message={this.state.snackBarMessage}
        onDismissAction={() => this.hideSnackBar()}
      />
    );
  }
  renderExams(
    section: string,
    allExams: ?(Exam[]),
    isPreExam: boolean,
    sectionIndex: ?number,
  ) {
    const hasReadAccess: boolean = hasExamSectionsAccess(
      section,
      this.state.visit,
    );
    if (!hasReadAccess) {
      return null;
    }
    let nextSection: string =
      examSections.length > sectionIndex + 1
        ? examSections[sectionIndex + 1]
        : undefined;
    let previousSection: string =
      sectionIndex > 0 ? examSections[sectionIndex - 1] : undefined;

    const exams = this.filterExamsBySection(section, allExams, isPreExam);
    let nextExams: Exam[];
    let previousExams: Exam[];
    if (sectionIndex >= 0) {
      let nextSectionIndex = sectionIndex;
      while (nextExams === undefined || nextExams.length === 0) {
        nextSectionIndex++;
        nextSection =
          examSections.length > nextSectionIndex
            ? examSections[nextSectionIndex]
            : undefined;
        if (nextSection === undefined) {
          break;
        }
        nextExams = this.filterExamsBySection(nextSection, allExams, isPreExam);
      }

      let previousSectionIndex = sectionIndex;
      while (previousExams === undefined || previousExams.length === 0) {
        previousSectionIndex--;
        previousSection =
          sectionIndex > 0 ? examSections[previousSectionIndex] : undefined;
        if (previousSection === undefined) {
          break;
        }
        previousExams = this.filterExamsBySection(
          previousSection,
          allExams,
          isPreExam,
        );
      }
    }

    const assessments: Exam[] = this.filterExamsBySection(
      undefined,
      allExams,
      true,
      true,
    );

    if (
      (!exams || exams.length === 0) &&
      this.state.visit &&
      this.state.visit.isDigital !== true
    ) {
      return null;
    }
    const view = (
      <View style={styles.flow} key={sectionIndex}>
        {exams &&
          exams.map((element: Exam, index: number) => {
            let exam: Exam = element;
            let nextExam: Exam =
              exams.length > index + 1 ? exams[index + 1] : undefined;
            let previousExam: Exam = index > 0 ? exams[index - 1] : undefined;
            nextExam =
              nextExam === undefined && nextExams !== undefined
                ? nextExams[0]
                : nextExam;
            previousExam =
              previousExam === undefined && previousExams !== undefined
                ? previousExams[previousExams.length - 1]
                : previousExam;
            nextExam =
              nextExam === undefined && assessments !== undefined
                ? assessments[0]
                : nextExam;
            exam.next = nextExam !== undefined ? nextExam.id : undefined;
            exam.previous =
              previousExam !== undefined ? previousExam.id : undefined;

            return (
              <ExamCard
                key={exam.definition.name}
                exam={exam}
                disabled={this.props.readonly}
                onSelect={() => this.selectExam(exam)}
                onHide={() =>
                  ((hasVisitPretestWriteAccess(this.state.visit) &&
                    isEmpty(this.state.visit.userId)) ||
                    hasVisitMedicalDataWriteAccess(this.state.visit)) &&
                  this.hideExam(exam)
                }
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
    const sectionWidth: string = getSectionWidth(section);
    return (
      <View style={[styles.examsBoard, {width: sectionWidth}]} key={section}>
        <SectionTitle title={sectionTitle} />
        {view}
        {this.renderAddableExamButton(section)}
      </View>
    );
  }

  setVisitType = (typeName: ?string) => {
    if (
      typeName === undefined ||
      typeName === null ||
      typeName.trim().length === 0
    ) {
      return;
    } else {
      this.setState({visitType: typeName});
    }
  };

  onConfirmVisitType = async () => {
    if (isEmpty(this.state.visitType)) {
      return;
    }
    try {
      this.hideVisitTypeAlert();
      let visit: Visit = this.state.visit;
      visit.typeName = this.state.visitType;
      visit.forceUpdate = true;
      await updateVisit(visit);
      this.props.onRefresh();
    } catch (error) {
      console.log(error);
      alert(strings.formatString(strings.serverError, error));
    }
  };
  canChangeVisitType(): boolean {
    const visit: Visit = this.state.visit;
    const locked: boolean = visitHasEnded(visit);
    const hasMedicalDataWriteAccess: boolean =
      hasVisitMedicalDataWriteAccess(visit);
    return (
      !locked &&
      hasMedicalDataWriteAccess &&
      this.state.visit.userId === getDoctor().id
    );
  }

  showVisitTypeAlert = () => {
    this.setState({showVisitTypeAlert: true});
  };
  hideVisitTypeAlert = () => {
    this.setState({
      visitType: this.state.visit.typeName,
      showVisitTypeAlert: false,
    });
  };

  renderVisitTypeAlert() {
    const visitTypes: VisitType[] = getVisitTypes();
    const visitTypesName: string[] = visitTypes.map((vt: VisitType) => vt.name);
    return (
      <Portal theme={{colors: {backdrop: 'transparent'}}}>
        <Dialog
          visible={this.state.showVisitTypeAlert}
          onDismiss={this.hideVisitTypeAlert}
          dismissable={true}
          style={[styles.VisitTypeDialog, {height: 'auto', maxHeight: 200}]}>
          <Dialog.Title>
            <Text style={{color: 'black'}}> {strings.updateVisitType}</Text>
          </Dialog.Title>

          <Dialog.Content>
            <ListField
              label={strings.visitType}
              freestyle={true}
              value={this.state.visitType}
              style={styles.field400}
              containerStyle={styles.fieldContainer}
              options={visitTypesName}
              onChangeValue={this.setVisitType}
              popupStyle={styles.alignPopup}
              simpleSelect={true}
              renderOptionsOnly={true}
              isValueRequired={true}
              testID="visit.typeName"
            />

            <Dialog.Actions>
              <NativeBaseButton onPress={this.hideVisitTypeAlert}>
                {strings.cancel}
              </NativeBaseButton>
              <NativeBaseButton onPress={this.onConfirmVisitType}>
                {strings.confirm}
              </NativeBaseButton>
            </Dialog.Actions>
          </Dialog.Content>
        </Dialog>
      </Portal>
    );
  }
  renderConsultationDetails() {
    const store: Store = getCachedItem(this.state.visit.storeId);
    const doctor: User = getCachedItem(this.state.visit.userId);
    const enteredBy: User = getCachedItem(this.state.visit.enteredByUserId);
    const sectionWidth: string = getSectionWidth('Consultation');

    return (
      <View style={[styles.examsBoard, {width: sectionWidth}]}>
        {this.state.showVisitTypeAlert && this.renderVisitTypeAlert()}
        <Text style={styles.cardTitle}>{strings.visit}</Text>

        {!isEmpty(this.state.visit.typeName) && (
          <TouchableOpacity
            onPress={this.showVisitTypeAlert}
            disabled={!this.canChangeVisitType()}
            testID="updateVisitType">
            <Text style={styles.linkText}>{this.state.visit.typeName}</Text>
          </TouchableOpacity>
        )}

        {doctor && (
          <Text style={styles.text}>
            {strings.doctor}: {getDoctorFullName(doctor)}
          </Text>
        )}
        {enteredBy && (
          <Text style={styles.text}>
          {strings.preTests}: {getDoctorFullName(enteredBy)}
        </Text>
        )}
        {!isEmpty(store?.name) && (
          <Text style={styles.text}>
            {strings.location}: {store.name}
          </Text>
        )}
        {!isEmpty(this.state.visit.prescription.signedDate) && (
          <Text style={styles.text}>
            {strings.signedOn}:{' '}
            {formatDate(
              this.state.visit.prescription.signedDate,
              yearDateTimeFormat,
            )}
          </Text>
        )}
        {!isEmpty(this.state.visit.consultationDetail.lockedOn) && (
          <Text style={styles.text}>
            {strings.lockedOn}:{' '}
            {formatDate(
              this.state.visit.consultationDetail.lockedOn,
              yearDateTimeFormat,
            )}
          </Text>
        )}
        {!isEmpty(this.state.visit.consultationDetail.lastUpdateOn) && (
          <Text style={styles.text}>
            {strings.lastUpdateOn}:{' '}
            {formatDate(
              this.state.visit.consultationDetail.lastUpdateOn,
              yearDateTimeFormat,
            )}
          </Text>
        )}
        {!isEmpty(this.state.visit.consultationDetail.lastUpdateBy) && (
          <Text style={styles.text}>
            {strings.lastUpdateBy}:{' '}
            {this.state.visit.consultationDetail.lastUpdateBy}
          </Text>
        )}
        {!isEmpty(this.state.visit.appointmentId) && !isEmpty(getValue(this.state, 'appointment.comment')) && (
          <Text style={styles.text}>
            {strings.calendarComments}:{' '}
            {this.state.appointment.comment}
          </Text>
        )}
      </View>
    );
  }

  renderVisitPermission() {
    return (
      <View style={styles.examsBoard}>
        <SafeAreaView style={styles.container}>
          <View style={styles.container}>
            <Card>
              <Card.Content>
                <Title style={styles.paragraph}>
                  {strings.deniedAccessTitle}
                </Title>
                <Paragraph style={styles.paragraph}>
                  {strings.visitDeniedAccessError}
                </Paragraph>
              </Card.Content>
            </Card>
          </View>
        </SafeAreaView>
      </View>
    );
  }
  renderAssessments() {
    let assessments: Exam[] = getCachedItems(
      this.state.visit.customExamIds,
    ).filter((exam: Exam) => exam.definition.isAssessment);
    assessments.sort(compareExams);
    let allExams: Exam[] = getCachedItems(this.state.visit.preCustomExamIds);
    if (!allExams) {
      allExams = [];
    }
    allExams = allExams.concat(getCachedItems(this.state.visit.customExamIds));
    let previousExam: Exam;
    for (let i = examSections.length - 1; i >= 0; i--) {
      const section: string = examSections[i];
      const previousExams: Exam[] =
        section !== undefined
          ? this.filterExamsBySection(section, allExams, false)
          : undefined;
      if (previousExams !== undefined && previousExams.length > 0) {
        previousExam = previousExams[previousExams.length - 1];
        break;
      }
    }

    return assessments.map((element: Exam, index: number) => {
      let exam: Exam = element;
      let nextExamAssessment: Exam =
        assessments.length > index + 1 ? assessments[index + 1] : undefined;
      let previousExamAssessment: Exam =
        index > 0 ? assessments[index - 1] : undefined;
      previousExamAssessment =
        previousExamAssessment === undefined && previousExam !== undefined
          ? previousExam
          : previousExamAssessment;

      exam.next =
        nextExamAssessment !== undefined ? nextExamAssessment.id : undefined;
      exam.previous =
        previousExamAssessment !== undefined
          ? previousExamAssessment.id
          : undefined;
      if (exam.definition.name === 'RxToOrder') {
        return (
          <TouchableOpacity
            key={strings.finalRx}
            disabled={this.props.readonly}
            testID={'FinalRx-Section'}
            onPress={() =>
              this.state.rxToOrder &&
              this.props.navigation.navigate('exam', {
                exam: this.state.rxToOrder,
                appointmentStateKey: this.props.appointmentStateKey,
              })
            }>
            <PrescriptionCard
              testID={'PrescriptionCard-Section'}
              title={strings.finalRx}
              exam={this.state.rxToOrder}
              editable={false}
            />
          </TouchableOpacity>
        );
      } else if (exam.definition.name === 'Consultation summary') {
        if (exam.definition.isSummaryAndPlan) {
          return (
            <VisitSummaryPlanCard
              exam={exam}
              editable={
                !this.state.locked && !this.props.readonly && !exam.readonly
              }
              key={strings.summaryTitle}
              disabled={this.props.readonly}
              navigation={this.props.navigation}
              appointmentStateKey={this.props.appointmentStateKey}
            />
          );
        } else {
          return (
            <VisitSummaryCard
              exam={exam}
              editable={
                !this.state.locked && !this.props.readonly && !exam.readonly
              }
              key={strings.summaryTitle}
            />
          );
        }
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

  hidePrintRxPopup = () => {
    this.setState({showRxPopup: false});
  };

  confirmPrintRxDialog = async (
    data: any,
    shouldSendEmail: boolean = false,
  ) => {
    this.setState({isPrintingRx: true});
    let newPrintingPreference = [];
    let printFinalRx: boolean = false;
    let printVA: boolean = false;
    let printMPDs: boolean = false;
    let printBPDs: boolean = false;
    let binocularPD: string = '';
    let printNotesOnRx: boolean = false;
    let drRecommendationArray: string[] = new Array();
    data.map((importData: any) => {
      let labelRx = importData.label;
      let flagRx = importData.isChecked;
      if (labelRx.toString() === strings.finalRx) {
        printFinalRx = flagRx;
        flagRx && newPrintingPreference.push("finalRx");
      } else if (labelRx.toString() === strings.va) {
        printVA = flagRx;
        flagRx && newPrintingPreference.push("va");
      } else if (labelRx.toString() === strings.monocularPd) {
        printMPDs = flagRx;
        flagRx && newPrintingPreference.push("monocularPd");
      } else if (labelRx.toString() === strings.binocularPd) {
        printBPDs = flagRx;
        flagRx && newPrintingPreference.push("binocularPd");
        if (printBPDs) {
          binocularPD = getFieldValue(
            'exam.RxToOrder.PD.binocular',
            this.state.rxToOrder,
          );
          if (isEmpty(binocularPD)) {
            binocularPD = getFieldValue(
              'exam.Auto refractor.Auto refractor.pd',
              this.state.rxToOrder,
            );
          }
        }
      } else if (labelRx.toString() === strings.notesOnRx) {
        printNotesOnRx = flagRx;
        flagRx && newPrintingPreference.push("notesOnRx");
      } else if ('entityId' in importData && importData.isChecked) {
        drRecommendationArray.push(importData.entityId);
      }
    });

    this.updatePrintingPreference(newPrintingPreference);

    this.hidePrintRxPopup();
    if (shouldSendEmail) {
      let response = await emailRx(
        this.props.visitId,
        printFinalRx,
        printVA,
        printMPDs,
        printBPDs,
        printNotesOnRx,
        drRecommendationArray,
        binocularPD,
      );

      if (response) {
        if (response.errors) {
          this.setState({isPrintingRx: false});
          alert(response.errors);
          return;
        }
        this.setSnackBarMessage(strings.emailRxSuccess);
        this.showSnackBar();
      }
    } else {
      await printRx(
        this.props.visitId,
        printFinalRx,
        printVA,
        printMPDs,
        printBPDs,
        printNotesOnRx,
        drRecommendationArray,
        binocularPD,
      );
    }
    this.setState({isPrintingRx: false});
  };

  async updatePrintingPreference(newPreference : []) {
    const setting = getUserSetting();
    let updatedSetting = !isEmpty(getValue(setting, 'setting.printingPreferences.FinalRx.defaultValues')) ? setting : getDefaultUserSetting();
    updatedSetting.setting.printingPreferences.FinalRx.defaultValues = newPreference;

    try {
      let httpResponse = await axios.put(getRestUrl()+'User/settings', updatedSetting, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          token: getToken(),
        },
      });
    } catch (error) {
      __DEV__ && console.log(error);
    }
  }

  getPrintingPreference() : [] {
    const setting = getUserSetting();
    let printingPreference = [];
    if (!isEmpty(getValue(setting, 'setting.printingPreferences.FinalRx.defaultValues'))) {
      printingPreference = getValue(setting, 'setting.printingPreferences.FinalRx.defaultValues');
    } else {
      const defaultSetting = getDefaultUserSetting();
      printingPreference = getValue(defaultSetting, 'setting.printingPreferences.FinalRx.defaultValues')
    }
    return printingPreference;
  }

  renderPrintRxPopup() {
    let printingPreference = this.getPrintingPreference();
    
    const printRxOptions: any = [
      {label: strings.finalRx, isChecked: printingPreference.includes("finalRx")},
      {label: strings.va, isChecked: printingPreference.includes("va")},
      {label: strings.monocularPd, isChecked: printingPreference.includes("monocularPd")},
      {label: strings.binocularPd, isChecked: printingPreference.includes("binocularPd")},
      {label: strings.notesOnRx, isChecked: printingPreference.includes("notesOnRx")},
    ];
    if (this.state.visit.purchase) {
      this.state.visit?.purchase?.forEach((recomm: any, index: number) => {
        formatCode('purchaseReasonCode', recomm.lensType).trim() !== ''
          ? printRxOptions.push({
              label: formatCode('purchaseReasonCode', recomm.lensType),
              entityId: recomm.entityId,
              isChecked: false,
            })
          : printRxOptions.push({
              label: strings.drRecommendation + (index + 1),
              entityId: recomm.entityId,
              isChecked: false,
            });
      });
    }

    return (
      <Alert
        title={strings.printRxLabel}
        data={printRxOptions}
        dismissable={true}
        onConfirmAction={(options: any) => this.confirmPrintRxDialog(options)}
        onCancelAction={() => this.hidePrintRxPopup()}
        style={styles.alert}
        confirmActionLabel={strings.printRx}
        cancelActionLabel={strings.cancel}
        multiValue={true}
        emailActionLabel={strings.emailRx}
        onEmailAction={(options: any) =>
          this.confirmPrintRxDialog(options, true)
        }
      />
    );
  }

  hidePrintMedicationRxPopup = () => {
    this.setState({showMedicationRxPopup: false});
  };

  confirmPrintMedicationRxDialog = (prescriptionData: any) => {
    let labelsArray: string[] = new Array();
    let isPrintWithoutSignEnabled = false;
    prescriptionData.map((prescriptionLabel: any) => {
      let labelRx = prescriptionLabel.label;
      let flagRx = prescriptionLabel.isChecked;
      if (flagRx) {
        if (labelRx === strings.printWithoutSign) {
          isPrintWithoutSignEnabled = true;
        } else {
          labelsArray.push(labelRx);
        }
      }
    });
    printMedicalRx(this.props.visitId, labelsArray, isPrintWithoutSignEnabled);
    this.hidePrintMedicationRxPopup();
  };

  renderPrintMedicationRxPopup() {
    const printMedicationRxOptions: any = [
      {label: strings.all, isChecked: false},
    ];
    const medicationExam = getExam(
      'Prescription',
      getCachedItem(this.props.visitId),
    );
    let label: string = '';
    let labelAlreadyExist = new Set();
    if (
      (medicationExam !== undefined || medicationExam !== null) &&
      (medicationExam.Prescription !== undefined ||
        medicationExam.Prescription !== null)
    ) {
      medicationExam.Prescription.forEach((prescription, i) => {
        label = prescription.Label;
        if (label && !labelAlreadyExist.has(label)) {
          printMedicationRxOptions.push({label: label, isChecked: false});
          labelAlreadyExist.add(label);
        }
      });

      // Adding 'Print Without Sign' option
      printMedicationRxOptions.push({
        label: strings.printWithoutSign,
        isChecked: false,
      });
    }

    return (
      <Alert
        title={strings.printRxLabel}
        data={printMedicationRxOptions}
        dismissable={true}
        onConfirmAction={(options: any) => {
          this.confirmPrintMedicationRxDialog(options);
        }}
        onCancelAction={() => this.hidePrintMedicationRxPopup()}
        style={styles.alert}
        confirmActionLabel={strings.printMedicalRx}
        cancelActionLabel={strings.cancel}
        multiValue={true}
      />
    );
  }

  showCLRxPopup(): void {
    this.setState({showClRxPopup: true});
  }

  hidePrintCLRxPopup = (): void => {
    this.setState({showClRxPopup: false});
  };

  confirmPrintClRxDialog = async (): void => {
    this.setState({isPrintingCLRx: true});
    this.hidePrintCLRxPopup();
    await printClRx(this.props.visitId);
    this.setState({isPrintingCLRx: false});
  };

  confirmEmailClRxDialog = async (): void => {
    this.setState({isPrintingCLRx: true});
    this.hidePrintCLRxPopup();
    let response = await emailClRx(this.props.visitId);
    if (response) {
      if (response.errors) {
        this.setState({isPrintingCLRx: false});
        alert(response.errors);
        return;
      }
      this.setSnackBarMessage(strings.emailRxSuccess);
      this.showSnackBar();
    }
    this.setState({isPrintingCLRx: false});
  };

  renderPrintCLRxPopup() {
    const printCLRxOptions: any = [];

    return (
      <Alert
        title={strings.printClRx}
        data={printCLRxOptions}
        dismissable={true}
        onConfirmAction={() => this.confirmPrintClRxDialog()}
        onCancelAction={() => this.hidePrintCLRxPopup()}
        style={styles.alert}
        confirmActionLabel={strings.printClRx}
        cancelActionLabel={strings.cancel}
        multiValue={false}
        emailActionLabel={strings.emailClRx}
        onEmailAction={() => this.confirmEmailClRxDialog()}
        isActionVertical={true}
      />
    );
  }

  showInvoiceOptionsAlert = () => {
    this.setState({showInvoiceOptionsAlert: true});
  };

  hideInvoiceOptionsAlert = () => {
    this.setState({showInvoiceOptionsAlert: false});
  };
  
  handleInvoiceOption = (selectedOption: any) => {
    this.hideInvoiceOptionsAlert();
    if (selectedOption.label === strings.invoiceAgain) {
      this.showInvoiceAlert();
      this.renderInvoiceAlert();
    } else if (selectedOption.label === strings.showInvoice) {
      this.showInvoice(this.props.visitId);
    }
  };

  async showInvoice(visitId: string) {
    try {
        const invoiceDetailsResponse = await axios.get(`${getRestUrl()}Invoice/visit/${visitId}`, {
            headers: { token: getToken(), Accept: 'application/json' },
        });
        if (!invoiceDetailsResponse || !invoiceDetailsResponse.data) {
            return null;
        }
        const invoiceId = invoiceDetailsResponse.data[invoiceDetailsResponse.data.length - 1]?.idPatientInvoice;
        if (!invoiceId) {
            return null;
        }
        this.getInvoicePdf(invoiceId);
      } catch (error) {
        __DEV__ && console.log(error);
        alert(strings.formatString(strings.serverError, error));
      }
  }

  async getInvoicePdf(invoiceId: string) {
    try {
        const pdfResponse = await axios.get(`${getRestUrl()}Invoice/print/${invoiceId}`, {
            headers: { token: getToken() },
            responseType: 'arraybuffer'
        });
        if (!pdfResponse || !pdfResponse.data) {
            return null;
        }
        let base64PdfData = Buffer.from(pdfResponse.data, 'binary').toString('base64');
        if (!base64PdfData) {
          return null;
        }
        await printBase64Pdf(base64PdfData);
      } catch (error) {
        __DEV__ && console.log(error);
        alert(strings.formatString(strings.serverError, error));
      }
  }
  
  handleInvoiceButtonPress = () => {
    if (this.hasInvoice()) {
      this.showInvoiceOptionsAlert();
    } else {
      this.invoice();
    }
  };

  renderInvoiceOptionsAlert() {
    const invoiceOptions = [
      { label: strings.showInvoice, singleSelection: true },
      { label: strings.invoiceAgain, singleSelection: true }
    ];

    return (
      <Alert
        visible={this.state.showInvoiceOptionsAlert}
        title={strings.selectInvoiceOptions}
        data={invoiceOptions}
        dismissable={true}
        onConfirmAction={(selectedOptions: any) => {
          const selectedOption = selectedOptions.find((option: any) => option.isChecked);
          if (selectedOption) {
            this.handleInvoiceOption(selectedOption);
          }
        }}
        onCancelAction={this.hideInvoiceOptionsAlert}
        style={styles.alert}
        confirmActionLabel={strings.select}
        cancelActionLabel={strings.cancel}
        multiValue={true}
      />
    );
  }

  renderActionButtons() {
    const visit: Visit = this.state.visit;
    const appointment: Appointment = this.state.appointment;
    const hasMedicalDataReadAccess: boolean =
      hasVisitMedicalDataReadAccess(visit);
    const hasPreTestReadAccess: boolean = hasVisitPretestReadAccess(visit);
    const hasFinalRxReadAccess: boolean = hasVisitFinalRxReadAccess(visit);
    const hasFittingReadAccess: boolean = hasVisitFittingReadAccess(visit);
    const userReferralFullAccess: boolean =
      getPrivileges().referralPrivilege === 'FULLACCESS';
    const doctor: User = getCachedItem(visit.userId);
    const isExternal: boolean = doctor ? doctor.isExternal : false;
    if (isExternal) {
      return null;
    }
    return (
      <View
        style={{paddingTop: 30 * fontScale, paddingBottom: 100 * fontScale}}>
        {this.state.showLockDialog && this.renderLockAlert()}
        {this.state.showRxPopup && this.renderPrintRxPopup()}
        {this.state.showClRxPopup && this.renderPrintCLRxPopup()}
        {this.state.showMedicationRxPopup &&
          this.renderPrintMedicationRxPopup()}
        {this.state.showInvoiceAlert && this.renderInvoiceAlert()}
        {this.state.showInvoiceOptionsAlert && this.renderInvoiceOptionsAlert()}

        <View style={styles.flow}>
          {this.state.visit.prescription.signedDate && (
            <Button title={strings.signed} disabled={true} />
          )}
          {this.canSign() && (
            <Button title={strings.sign} onPress={() => this.signVisit()} />
          )}

          {(hasPreTestReadAccess || hasFinalRxReadAccess) && (
            <Button
              title={strings.printRx}
              onPress={() => this.showRxPopup()}
              loading={this.state.isPrintingRx}
              disabled={this.state.isPrintingRx}
            />
          )}
          {hasMedicalDataReadAccess && this.hasMedicalRx() && (
            <Button
              title={strings.printMedicalRx}
              onPress={() => {
                this.showMedicationRxPopup();
              }}
            />
          )}
          {(hasPreTestReadAccess || hasFittingReadAccess) &&
            this.hasFinalClFitting() && (
              <Button
                title={strings.printClRx}
                onPress={() => {
                  this.showCLRxPopup();
                }}
                loading={this.state.isPrintingCLRx}
                disabled={this.state.isPrintingCLRx}
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
          {hasMedicalDataReadAccess && (
            <Button
              loading={this.state.loading}
              title={strings.printPatientFile}
              onPress={() => {
                this.setState({loading: true});
                printPatientFile(this.props.visitId, () =>
                  this.setState({loading: false}),
                );
              }}
            />
          )}
          {userReferralFullAccess && isReferralsEnabled() && (
            <Button title={strings.referral} onPress={this.openReferral} />
          )}
          {this.canLock() && (
            <Button
              title={strings.lockVisit}
              onPress={() => this.lockVisit()}
            />
          )}
          {visit &&
            visit.appointmentId &&
            !this.props.readonly &&
            (hasAppointmentBookAccess(appointment) ||
              (appointment && appointment.status === 5)) && (
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
          {this.canInvoice() && (
            <Button
              title={this.hasInvoice() ? strings.invoiceOptions : strings.invoice}
              onPress={this.handleInvoiceButtonPress}
              loading={this.state.postInvoiceLoading}
              disabled={this.state.postInvoiceLoading}
            />
          )}
        </View>
      </View>
    );
  }

  isLockedAmendmentsEditable(section): boolean {
    return (this.state.locked && section === 'Amendments' &&
      this.state.visit.medicalDataPrivilege === 'FULLACCESS')
  }

  shouldFabBeVisible(section: string): boolean {
    if (this.isLockedAmendmentsEditable(section)) {
      return true;
    }

    if (this.props.readonly || section === 'Document') {
      return false;
    }

    return true;
  }

  renderAddableExamButton(section?: string) {
    const hasPreTestWriteAccess: boolean = hasVisitPretestWriteAccess(
      this.state.visit,
    );
    const hasMedicalDataWriteAccess: boolean = hasVisitMedicalDataWriteAccess(
      this.state.visit,
    );
    const hasCLFittingWriteAccess: boolean = hasVisitFittingWriteAccess(
      this.state.visit,
    );

    if (!this.shouldFabBeVisible(section)) {
      return null;
    }

    const pretestMode: boolean = isEmpty(this.state.visit.userId);
    let addableExamDefinitions: ExamDefinition[] =
      this.state.addableExamTypes.filter(
        (examType: ExamDefinition) =>
          (pretestMode === true && examType.isPreExam === true) ||
          (pretestMode === false &&
            examType.section.substring(0, examType.section.indexOf('.')) ===
              section),
      );

    addableExamDefinitions = addableExamDefinitions.filter(
      (examType: ExamDefinition) =>
        (examType.isPreExam && hasPreTestWriteAccess) ||
        (!examType.isPreExam && hasMedicalDataWriteAccess) ||
        (examType.name.toLowerCase() === 'fitting' && hasCLFittingWriteAccess),
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

  isLockedButDisabled() {
    const { locked, visit } = this.state;

    if (!locked) return false;

    return !(
      visit.medicalDataPrivilege === 'FULLACCESS' || visit.pretestPrivilege === 'FULLACCESS'
    );
  }

  renderLockIcon() {
    if (this.state.locked !== true) {
      return null;
    }
    return (
      <View style={styles.examIcons}>
        <TouchableOpacity onPress={this.switchLock} disabled={this.isLockedButDisabled()}>
          <Lock testID={'lock-icon'} style={styles.screenIcon} locked={this.state.locked === true} disabled={this.isLockedButDisabled()}/>
        </TouchableOpacity>
      </View>
    )
  }

  render() {
    if (this.props.visitId === undefined) {
      return null;
    }

    if (
      !hasVisitPretestReadAccess(this.state.visit) &&
      !hasVisitFinalRxReadAccess(this.state.visit) &&
      !hasVisitFittingReadAccess(this.state.visit)
    ) {
      return (
        <View>
          <View style={styles.flow}>
            {this.renderConsultationDetails()}
            {this.renderVisitPermission()}
          </View>
        </View>
      );
    }
    const pretestStarted: boolean = pretestHasStarted(this.state.visit);
    const visitStarted: boolean = visitHasStarted(this.state.visit);
    const pretestMode: boolean =
      (isEmpty(this.state.visit.userId) && !visitStarted) ||
      (isEmpty(this.state.visit.userId) && !visitStarted && !pretestStarted) ||
      (!isEmpty(this.state.visit.userId) && !visitStarted);
    if (pretestMode) {
      const showStartVisitButtons: boolean =
        !this.props.readonly &&
        ((hasVisitPretestWriteAccess(this.state.visit) && !pretestStarted) ||
          hasVisitMedicalDataWriteAccess(this.state.visit));
      return (
        <View>
          <View style={styles.flow}>
            {this.renderExams(
              'Pre tests',
              getCachedItems(this.state.visit.preCustomExamIds),
              true,
            )}
          </View>
          {showStartVisitButtons && (
            <StartVisitButtons
              onStartVisit={this.props.onStartVisit}
              isLoading={this.props.isLoading}
              patientInfo={this.props.patientInfo}
              isPretest={pretestStarted === false}
              currentVisitId={this.props.visitId}
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
          {examSections.map((section: string, index: number) => {
            return this.renderExams(section, exams, false, index);
          })}
        </View>
        <View style={styles.flow}>{this.renderAssessments()}</View>
        {this.renderActionButtons()}
        {this.renderLockIcon()}
        {this.state.showSnackBar && this.renderSnackBar()}
      </View>
    );
  }

  showRxPopup() {
    this.setState({showRxPopup: true});
  }
  showMedicationRxPopup() {
    this.setState({showMedicationRxPopup: true});
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
    let summaries: ?(Exam[]) = getRecentVisitSummaries(
      this.props.patientInfo.id,
    );
    if (summaries === undefined) {
      await fetchVisitHistory(this.props.patientInfo.id);
      summaries = getRecentVisitSummaries(this.props.patientInfo.id);
    }
    this.setState({summaries});
  }

  checkUserHasAccess() {
    let hasNoAccesAtAll = true;
    this.state.summaries.map(
      (visitSummary: Exam) =>
        (hasNoAccesAtAll =
          hasNoAccesAtAll && 'noaccess' in visitSummary
            ? visitSummary.noaccess
            : false),
    );
    return hasNoAccesAtAll;
  }

  render() {
    let hasNoAccess = this.checkUserHasAccess();
    if (!this.state.summaries) {
      return null;
    }
    return (
      <View
        style={isWeb ? [styles.tabCard, {flexShrink: 100}] : styles.tabCard}>
        <Text style={styles.cardTitle}>{strings.summaryTitle}</Text>
        {this.state.summaries &&
          this.state.summaries.length !== 0 &&
          (hasNoAccess ? (
            <NoAccess />
          ) : (
            this.state.summaries.map((visitSummary: Exam, index: number) =>
              visitSummary.noaccess ? (
                <NoAccess
                  key={index + 1}
                  prefix={
                    formatDate(
                      getCachedItem(visitSummary.visitId).date,
                      isToyear(getCachedItem(visitSummary.visitId).date)
                        ? dateFormat
                        : farDateFormat,
                    ) + ': '
                  }
                />
              ) : (
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
              ),
            )
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
    hasAppointment: ?boolean,
    route: any,
  };
  state: {
    selectedId: ?string,
    history: ?(string[]),
    showingDatePicker: boolean,
    isLoading: boolean,
    isVisitLoading: boolean, 
    showDialog: boolean,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      selectedId:
        this.props.route &&
        this.props.route.params
          ? this.props.route.params.selectedVisitId
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
    const selectedId: string =
      this.props.patientInfo.id === prevProps.patientInfo.id
        ? this.state.selectedId
        : undefined;
    this.setState({
      history: this.combineHistory(
        this.props.patientDocumentHistory,
        this.props.visitHistory,
      ),
      selectedId,
    });
  }

  async showVisit(id: ?string) {
    if(this.state.selectedId !== id && !this.state.isVisitLoading){
      this.setState({isVisitLoading: true});
      this.setState({selectedId: id});
      if(id?.startsWith('visit')){
        await fetchVisit(id);
      }
      this.setState({isVisitLoading: false});
    }
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
      let i: number = this.state.history.indexOf(visitId);
      if (i >= 0) {
        this.state.history.splice(i, 1);
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

  async startVisit(visitId: string, visitType: string, cVisitId?: string) {
    if (this.props.readonly) {
      return;
    }
    this.setState({isLoading: true});
    let visit = getCachedItem(visitId);
    visit.typeName = visitType;
    visit.previousVisitId = cVisitId === undefined ? 'visit-0' : cVisitId;
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

  canDelete(visit: Visit) {
    return (
      this.state.selectedId &&
      this.state.showDialog &&
      ((hasVisitPretestWriteAccess(visit) && isEmpty(visit.userId)) ||
        hasVisitMedicalDataWriteAccess(visit))
    );
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
        requireDeleteConfirmation={true}
      />
    );
  }
  shouldRenderActionButons(): boolean {
    if (this.props.readonly) {
      return false;
    }

    const isNewAppointment: boolean = this.isNewAppointment();
    const userHasPretestWriteAccess: boolean =
      getPrivileges().pretestPrivilege === 'FULLACCESS';

    if (isNewAppointment && userHasPretestWriteAccess) {
      return true;
    }
    if (
      !isNewAppointment &&
      userHasPretestWriteAccess &&
      !this.props.hasAppointment
    ) {
      return true;
    }

    return false;
  }
  renderActionButtons() {
    let isNewAppointment: boolean = this.isNewAppointment();
    const userHasPretestWriteAccess: boolean =
      getPrivileges().pretestPrivilege === 'FULLACCESS';

    return (
      <View style={styles.startVisitCard}>
        <View style={styles.flow}>
          {isNewAppointment && userHasPretestWriteAccess && (
            <Button
              title={strings.startAppointment}
              onPress={() => this.startAppointment()}
            />
          )}
          {!isNewAppointment &&
            userHasPretestWriteAccess &&
            !this.props.hasAppointment && (
              <Button title={strings.addVisit} onPress={this.showDatePicker} />
            )}
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
        <View>
          <VisitSummaryTable patientInfo={this.props.patientInfo} />
        </View>
        {this.shouldRenderActionButons() && this.renderActionButtons()}
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
            route={this.props.route}
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
    let listFollowUp: ?(FollowUp[]) = getCachedItem(
      'referralFollowUpHistory-' + patientInfo.id,
    );

    const visit: Visit =
      this.state.selectedId && this.state.selectedId.startsWith('visit')
        ? getCachedItem(this.state.selectedId)
        : undefined;
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
            extraData={visit}
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

        {!this.state.isVisitLoading && this.state.selectedId && this.state.selectedId.startsWith('visit') && (
          <VisitErrorBoundary navigation={this.props.navigation}>
            <VisitWorkFlow
              patientInfo={this.props.patientInfo}
              visitId={this.state.selectedId}
              navigation={this.props.navigation}
              route={this.props.route}
              appointmentStateKey={this.props.appointmentStateKey}
              onStartVisit={(
                visitType: string,
                isPreVisit: boolean,
                cVisitId?: string,
              ) => {
                this.startVisit(this.state.selectedId, visitType, cVisitId);
              }}
              readonly={this.props.readonly}
              enableScroll={this.props.enableScroll}
              disableScroll={this.props.disableScroll}
              isLoading={this.state.isLoading}
              onRefresh={this.props.onRefresh}
            />
          </VisitErrorBoundary>
        )}
        {this.state.selectedId &&
          this.state.selectedId.startsWith('patientDocument') && (
            <PatientDocumentPage id={this.state.selectedId} />
          )}
        {this.canDelete(visit) && this.renderAlert()}
        {!isNewAppointment &&
          !this.props.hasAppointment &&
          this.state.showingDatePicker &&
          this.renderDateTimePicker()}
      </View>
    );
  }
}
/**
 * @flow
 */
'use strict';

import React, { Component, PureComponent } from 'react';
import { View, TouchableHighlight, Text, TouchableOpacity, Modal, TouchableWithoutFeedback, FlatList, Alert} from 'react-native';
import DateTimePicker from "react-native-modal-datetime-picker";
import type {Patient, Exam, GlassesRx, GlassRx, Visit, Appointment, ExamDefinition, ExamPredefinedValue, Recall, PatientDocument, PatientInfo } from './Types';
import { styles, fontScale } from './Styles';
import { strings, getUserLanguage } from './Strings';
import {Button, FloatingButton, Lock} from './Widgets';
import { formatMoment, deepClone, formatDate, now, jsonDateTimeFormat, isEmpty, compareDates, isToyear, dateFormat, farDateFormat, tomorrow, yearDateFormat } from './Util';
import { ExamCard, createExam, storeExam, getExam } from './Exam';
import { allExamPredefinedValues } from './Favorites';
import { allExamDefinitions } from './ExamDefinition';
import { ReferralCard, PrescriptionCard, AssessmentCard, VisitSummaryCard } from './Assessment';
import { cacheItem, getCachedItem, getCachedItems, cacheItemsById, cacheItemById } from './DataCache';
import { searchItems, storeItem, performActionOnItem, fetchItemById } from './Rest';
import { fetchAppointment } from './Appointment';
import { printRx, printClRx, printMedicalRx } from './Print';
import { PatientDocumentPage } from './Patient';
import { PatientMedicationCard } from './Medication';
import { PatientRefractionCard } from './Refraction';
import { getDoctor } from './DoctorApp';

const examSections : string[] = ['Chief complaint','History','Entrance testing','Vision testing','Anterior exam','Posterior exam','CL','Form', 'Document'];
const examSectionsFr : string[] = ['Plainte principale','Historique','Test d\'entrée','Test de vision','Examen antérieur','Examen postérieur','LC','Form', 'Document'];

function getSectionTitle(section) : string {
  const language : string = getUserLanguage();
  if (language.startsWith('fr')) {
      if (section==='Pre tests') return 'Pré-tests';
      const i: number = examSections.indexOf(section, 0);
      if (i>=0 && i<examSectionsFr.length-1) return examSectionsFr[i];
  }
  return section;
}

export async function fetchVisit(visitId: string) : Visit {
  let visit : Visit = await fetchItemById(visitId);
  return visit;
}

export async function fetchVisitTypes() : string[] {
    const searchCriteria = {};
    let restResponse = await searchItems('VisitType/list', searchCriteria);
    let visitTypes : string[] = restResponse.visitTypeNameList;
    if (!visitTypes || visitTypes.length==0) {
      alert(strings.formatString(strings.doctorWithoutVisitTypeError, getDoctor().lastName));
      visitTypes = [];
    }
    cacheItem('visitTypes', visitTypes);
    return visitTypes;
}

export function getVisitTypes() : string[] {
  let visitTypes : string[] = getCachedItem('visitTypes');
  return visitTypes;
}

export function visitHasEnded(visit: string|Visit) : boolean {
  if (visit instanceof Object === false) {
     visit = getCachedItem(visit);
  }
  if (visit===null || visit===undefined) return false;
  return visit.locked===true;
}

export function visitHasStarted(visit: string|Visit) : boolean {
  if (visit instanceof Object === false) {
     visit = getCachedItem(visit);
  }
  return visit.customExamIds !== undefined && visit.customExamIds.length > 0;
}

export function allExamIds(visit: Visit) : string[] {
  let allExamIds : string[];
  if (!visit.customExamIds) allExamIds = visit.preCustomExamIds;
  else if (!visit.preCustomExamIds) allExamIds = visit.customExamIds;
  else allExamIds = visit.preCustomExamIds.concat(visit.customExamIds);
  if (!allExamIds) allExamIds = [];
  return allExamIds;
}

export async function fetchVisitHistory(patientId: string) : string[] {
    const searchCriteria = {patientId: patientId};
    let restResponse = await searchItems('Visit/list', searchCriteria);
    const customExams : Exam[] = restResponse.customExamList;
    const visits : Visit[] =  restResponse.visitList?restResponse.visitList:[];
    const visitIds : string[] = visits.map(visit => visit.id);
    const patientDocuments : PatientDocument[] = restResponse.patientDocumentList?restResponse.patientDocumentList:[];
    const patientDocumentIds : string[] = patientDocuments.map(patientDocument => patientDocument.id);
    const users : User[] = restResponse.userList;
//    customExams && customExams.forEach((exam: Exam) => overwriteExamDefinition(exam)); //TODO remove after beta
    cacheItemsById(customExams);
    cacheItemsById(visits);
    cacheItemsById(patientDocuments);
    cacheItemsById(users);
    cacheItem('visitHistory-'+patientId, visitIds);
    cacheItem('patientDocumentHistory-'+patientId, patientDocumentIds);
    return visitIds;
}

export function getVisitHistory(patientId: string) : ?Visit[] {
    if (patientId===undefined ) return undefined;
    let visitHistory : ?Visit[] = getCachedItems(getCachedItem('visitHistory-'+patientId));
    return visitHistory;
}

export async function createVisit(visit: Visit) : Visit {
    visit.id = 'visit';
    visit = await storeItem(visit);
    let visitHistory : ?Visit[] = getCachedItem('visitHistory-'+visit.patientId);
    if (visitHistory===undefined) {
      visitHistory=[];
      cacheItem('visitHistory-'+visit.patientId, visitHistory);
    }
    visitHistory.unshift(visit.id);
    fetchVisitHistory(visit.patientId);
    return visit;
}


export async function updateVisit(visit: Visit) : Visit {
    visit = await storeItem(visit);
    return visit;
}


function getRecentVisitSummaries(patientId: string) : ?Exam[] {
  let visitHistory : ?Visit[] = getVisitHistory(patientId);
  if (!visitHistory) return undefined;
  let visitSummaries : Exam[] = [];
  visitHistory.forEach((visit: Visit) => {
    if (visit.customExamIds) {
      visit.customExamIds.forEach((examId: string) => {
        const exam: Exam = getCachedItem(examId);
        if (exam.resume) {
          visitSummaries = [...visitSummaries, exam];
        }
      });
      if (visitSummaries.length>3)
        return visitSummaries;
    }
  });
  return visitSummaries;
}

class VisitButton extends PureComponent {
    props: {
        id: string,
        isSelected: ?boolean,
        onPress: () => void,
        onLongPress?: () => void
    }

    render() {
        const visitOrNote : ?(Visit|PatientDocument) = getCachedItem(this.props.id);
        const date : string = (visitOrNote!==undefined&&visitOrNote.date!=undefined)?visitOrNote.date:visitOrNote.postedOn;
        const type : string = (visitOrNote!==undefined&&visitOrNote.typeName!=undefined)?visitOrNote.typeName:visitOrNote.category;
        return <TouchableOpacity onPress={this.props.onPress} onLongPress={this.props.onLongPress}>
            <View style={this.props.isSelected ? styles.selectedTab : styles.tab}>
                <Text style={this.props.isSelected ? styles.tabTextSelected : styles.tabText}>{formatDate(date,yearDateFormat)}</Text>
                <Text style={this.props.isSelected ? styles.tabTextSelected : styles.tabText}>{type}</Text>
            </View>
        </TouchableOpacity>
    }
}

class SummaryButton extends PureComponent {
    props: {
        isSelected: ?boolean,
        onPress: () => void
    }

    render() {
        return <TouchableOpacity onPress={this.props.onPress}>
           <View style={this.props.isSelected ? styles.selectedTab : styles.tab}>
               <Text style={this.props.isSelected ? styles.tabTextSelected : styles.tabText}>{strings.summaryTitle}</Text>
           </View>
        </TouchableOpacity>
    }
}

export class StartVisitButtons extends Component {
  props: {
    isPreVisit: boolean,
    title?: string,
    onStartVisit: (type: string, isPrevisit: boolean) => void
  }
  state: {
    visitTypes: string[],
    clicked: boolean
  }
  constructor(props: any) {
    super(props);
    this.state = {
      visitTypes: [],
      clicked: false
    }
  }

  componentDidMount() {
    this.loadVisitTypes();
  }

  async loadVisitTypes() {
    if (this.state.visitTypes && this.state.visitTypes.length>0) return;
    let visitTypes : string[] = getVisitTypes();
    if (!visitTypes || visitTypes.length===0)
      visitTypes = await fetchVisitTypes();
    this.setState({visitTypes});
  }

  startVisit(visitType: string) {
    if (this.state.clicked) return;
    this.setState({clicked: true}, () => {
        this.props.onStartVisit(visitType, this.props.isPreVisit);
        this.setState({clicked:false});
      }
    );
  }

  render() {
    if (this.state.visitTypes.length===0)
      return null;
    if (this.state.clicked) {
        return <View style={styles.startVisitCard}>
          {this.props.title && <Text style={styles.sectionTitle}>{this.props.title}</Text>}
        </View>
    }
    return <View style={styles.startVisitCard}>
        {this.props.title && <Text style={styles.sectionTitle}>{this.props.title}</Text>}
        <View style={styles.flow}>
          {this.state.visitTypes.map((visitType: string, index: number) =>
            <Button title={visitType} key={index} onPress={() => this.startVisit(visitType)} />)}
        </View>
    </View>
  }
}

class SectionTitle extends PureComponent {
  props: {
    title: string
  }

  render() {
    //const title : string = (this.props.title===undefined || this.props.title===null)?'':this.props.title.replace(' ','\n');
    const title: string = this.props.title;
    return <Text style={styles.borderSectionTitle}>{title}</Text>
  }
}

class VisitWorkFlow extends Component {
    props: {
        visitId: string,
        navigation: any,
        appointmentStateKey: string,
        onStartVisit: (type: string, isPreVisit: boolean) => void,
        readonly: ?boolean,
        enableScroll: () => void,
        disableScroll: () => void
    }
    state: {
        visit: Visit,
        addableExamTypes: ExamDefinition[],
        addableSections: string[],
        locked: boolean,
        rxToOrder: ?Exam
    }

    constructor(props: any) {
        super(props);
        const visit :Visit = getCachedItem(this.props.visitId);
        const locked: boolean = visitHasEnded(visit);
        this.state = {
            visit: visit,
            addableExamTypes: [],
            addableSections: [],
            locked: locked,
            rxToOrder: this.findRxToOrder(visit)
        };
        visit && this.loadUnstartedExamTypes(visit);
    }

    componentDidUpdate(prevProps: any) {
        const visit :Visit = getCachedItem(this.props.visitId);
        const rxToOrder = this.findRxToOrder(visit);
        if (this.props.visitId===prevProps.visitId && visit===this.state.visit && rxToOrder===this.state.rxToOrder) {
          return;
        }
        const locked: boolean = visitHasEnded(visit);
        this.setState({
          visit,
          locked,
          rxToOrder
        });
        visit && this.loadUnstartedExamTypes(visit);
    }

    async storeVisit(visit: Visit) {
      if (this.props.readonly) return;
      visit = await storeItem(visit);
      const locked: boolean = visitHasEnded(visit);
      this.setState({
        visit: visit,
        locked: locked,
        rxToOrder: this.findRxToOrder(visit)
      });
      visit && this.loadUnstartedExamTypes(visit);
    }

    findRxToOrder(visit: Visit) : ?Exam {
      if (!visit) return undefined;
      if (!visit.customExamIds) return undefined;
      let rxToOrderExamId : ?string = visit.customExamIds.find((examId: string) => getCachedItem(examId).definition.name==='RxToOrder');
      if (rxToOrderExamId) {
        let exam : Exam = getCachedItem(rxToOrderExamId);
        return exam;
      }

      return undefined;
    }

    async loadAppointment(visit: Visit) {
      if (!visit || !visit.appointmentId) return;
      let appointment : Appointment = getCachedItem(visit.appointmentId);
      if (!appointment) {
        await fetchAppointment(visit.appointmentId);
        const locked: boolean = visitHasEnded(visit);
        this.setState({locked});
      }
      return appointment;
    }

    async loadUnstartedExamTypes(visit: Visit) {
      if (this.props.readonly) return;
      await this.loadAppointment(visit);
      const locked : boolean = this.state.locked;
      if (locked) {
        if (this.state.addableExamTypes.length!==0)
          this.setState({addableExamTypes: []});
        return;
      }
      let allExamTypes : ExamDefinition[] = await allExamDefinitions(true);
      allExamTypes = allExamTypes.concat(await allExamDefinitions(false));
      let unstartedExamTypes : ExamDefinition[] = allExamTypes.filter((examType : ExamDefinition) => {
        let existingExamIndex : number = visit.preCustomExamIds?visit.preCustomExamIds.findIndex((examId : string) => getCachedItem(examId).definition.name === examType.name && getCachedItem(examId).isHidden!==true) :-1;
        if (existingExamIndex<0 && visit.customExamIds) existingExamIndex = visit.customExamIds.findIndex((examId : string) => getCachedItem(examId).definition.name === examType.name && getCachedItem(examId).isHidden!==true);
        return (existingExamIndex<0);
      });
      let addableSections : string[] = examSections.filter((section: string) => unstartedExamTypes.map((examDefinition : ExamDefinition) => examDefinition.section.substring(0, examDefinition.section.indexOf('.'))).includes(section));
      this.setState({addableExamTypes: unstartedExamTypes, addableSections});
    }

    hasMedicalRx() : boolean {
      const medicationExam : Exam = getExam('Prescription', getCachedItem(this.props.visitId));
      if (!medicationExam) return false;
      const value = medicationExam['Prescription'];
      return !isEmpty(value);
    }

    hasClFitting() : boolean {
      this.state.addableExamTypes.forEach((addableType: ExamDefinition) => {
        if (addableType.name==='Fitting') {
          return false;
        }
      });
      return true;
    }

    async createExam(examDefinitionId: string, examPredefinedValueId?: string) {
        if (this.props.readonly) return;
        const visit : ?Visit = this.state.visit;
        if (!visit || !visit.id) return;
        let exam: Exam = {id: 'customExam', visitId: visit.id, customExamDefinitionId: examDefinitionId, examPredefinedValueId: examPredefinedValueId};
        exam = await createExam(exam);
        if (exam.errors) {
          alert(exam.errors);
          return;
        }
        if (!visit.preCustomExamIds) visit.preCustomExamIds = [];
        if (!visit.customExamIds) visit.customExamIds = [];
        if (exam.definition.isPreExam) {
          visit.preCustomExamIds.push(exam.id);
        } else {
          visit.customExamIds.push(exam.id);
        }
        cacheItemById(visit);
        this.loadUnstartedExamTypes(visit, getCachedItem(examDefinitionId).isPreExam);
        this.setState({visit});
    }

    async addExam(examLabel: string) {
      if (examLabel===undefined) return; //Weird this happens, floating buttons are shitty
      if (this.props.readonly) return;
      let examDefinition: ?ExamDefinition = (await allExamDefinitions(false)).find((examDefinition: ExamDefinition) => (examDefinition.label?examDefinition.label:examDefinition.name) === examLabel);
      if (!examDefinition) examDefinition = (await allExamDefinitions(true)).find((examDefinition: ExamDefinition) => (examDefinition.label?examDefinition.label:examDefinition.name) === examLabel);
      if (!examDefinition) return;
      let existingExam : ?Exam = this.state.visit.preCustomExamIds?getCachedItem(this.state.visit.preCustomExamIds[this.state.visit.preCustomExamIds.findIndex((examId : string) => getCachedItem(examId).definition.name === examDefinition.name)]):undefined;
      if (!existingExam && this.state.visit.customExamIds) existingExam = getCachedItem(this.state.visit.customExamIds[this.state.visit.customExamIds.findIndex((examId : string) => getCachedItem(examId).definition.name === examDefinition.name)]);
      if (existingExam) {
        this.unhideExam(existingExam);
      } else {
        this.createExam(examDefinition.id, undefined);
      }
    }

    async endVisit() {
      if (this.props.readonly) return;
      const visit : Visit = this.state.visit;
      try {
        this.props.navigation.goBack();
        visit.locked = true;
        await updateVisit(visit);
      } catch (error) {
        console.log(error);
        alert(strings.serverError);
      }
    }

    async signVisit()  {
      if (this.props.readonly) return;
      let visit : Visit = this.state.visit;
      try {
        visit = await performActionOnItem('sign',visit);
        this.setState({visit});
      } catch (error) {
        console.log(error);
        alert(strings.serverError);
      }
    }

    compareExams = (a: Exam, b: Exam) : number => {
        if (a.definition.order!==undefined && b.definition.order!==undefined) {
          if (a.definition.order < b.definition.order) return -10;
          if (a.definition.order > b.definition.order) return 10;
        }
        if (a.definition.section===undefined || b.definition.section===undefined) return -1;
        if (a.definition.section < b.definition.section) return -1;
        if (a.definition.section > b.definition.section) return 1;
        return 0;
    }

    switchLock = () => {
      this.setState({locked: this.state.locked===true?false:true}, () => {
        this.loadUnstartedExamTypes(this.state.visit);
      });
    }

    hideExam = (exam: Exam) => {
      if (this.props.readonly) return;
      if (!isEmpty(exam[exam.definition.name])) {
        alert(strings.removeExamError);
        return;
      }
      exam.isHidden = true;
      storeExam(exam, this.props.appointmentStateKey, this.props.navigation);
      this.loadUnstartedExamTypes(this.state.visit);
    }

    unhideExam = (exam: Exam) => {
      if (this.props.readonly) return;
      exam.isHidden = false;
      storeExam(exam, this.props.appointmentStateKey, this.props.navigation);
      this.loadUnstartedExamTypes(this.state.visit);
    }


    renderExams(section: string, exams: ?Exam[], isPreExam: boolean) {
        if (exams) {
          if (!isPreExam) {
            exams = exams.filter((exam: Exam) => exam.definition.section && exam.definition.section.startsWith(section));
          }
          exams = exams.filter((exam: Exam) => !exam.definition.isAssessment && exam.isHidden!==true && (exam.hasStarted || (this.state.locked!==true && this.props.readonly!==true)));
          exams.sort(this.compareExams);
        }
        if (!exams || exams.length===0)
          return null;
        const view =  <View style={styles.flow}>
              {exams && exams.map((exam: Exam, index: number) => {
                  return <ExamCard key={exam.definition.name} exam={exam} disabled={this.props.readonly}
                      onSelect={() => this.props.navigation.navigate('exam', {exam, appointmentStateKey: this.props.appointmentStateKey})}
                      onHide={() => this.hideExam(exam)} unlocked={this.state.locked!==true} enableScroll={this.props.enableScroll} disableScroll={this.props.disableScroll}/>
              })}
              {this.renderAddableExamButton(section)}
          </View>
        if ("Document"===section) {
          return view;
        }
        const sectionTitle :string = getSectionTitle(section);
        return <View style={styles.examsBoard} key={section}>
            <SectionTitle title={sectionTitle} />
            {view}
        </View>
    }

    renderAssessments() {
       let assessments : Exam[] = getCachedItems(this.state.visit.customExamIds).filter(
         (exam: Exam) => exam.definition.isAssessment);
       return assessments.map((exam: Exam, index: number) => {

         if (exam.definition.name==='RxToOrder') {
           return  <TouchableOpacity key={strings.finalRx} disabled={this.props.readonly} onPress={() => this.state.rxToOrder && this.props.navigation.navigate('exam', {exam: this.state.rxToOrder, appointmentStateKey: this.props.appointmentStateKey}) }>
                    <PrescriptionCard title={strings.finalRx} exam={this.state.rxToOrder} editable={false} />
                  </TouchableOpacity>
         } else if (exam.definition.name==='Consultation summary') {
            return  <VisitSummaryCard exam={exam} editable={!this.state.locked && !this.props.readonly} key={strings.summaryTitle} />
         } else{
           return <AssessmentCard exam={exam} disabled={this.props.readonly} navigation={this.props.navigation} key={exam.definition.name} appointmentStateKey={this.props.appointmentStateKey}/>
         }
        }
     );
    }

    renderActionButtons() {
      return <View style={{paddingTop: 30*fontScale, paddingBottom:100*fontScale}}>
          <View style={styles.flow}>
            {this.state.visit.prescription.signedDate && <Button title={strings.signed} disabled={true}/>}
            {!this.state.locked && !this.state.visit.prescription.signedDate && <Button title={strings.sign} onPress={() => this.signVisit()}/>}
            <Button title={strings.printRx} onPress={() => {printRx(this.props.visitId)}}/>
            {this.hasMedicalRx() && <Button title={strings.printMedicalRx} onPress={() => {printMedicalRx(this.props.visitId)}}/>}
            {this.hasClFitting() && <Button title={strings.printClRx} onPress={() => {printClRx(this.props.visitId)}}/>}
            {__DEV__ && <Button title={strings.printReferral} onPress={() => {}}/>}
            {!this.state.locked && !this.props.readonly && <Button title={strings.endVisit} onPress={() => this.endVisit()}/>}
        </View>
      </View>
    }

    renderAddableExamButton(section?: string) {
      if (this.props.readonly || "Document"===section) return;
      const doingPreExam : boolean = !visitHasStarted(this.state.visit);
      const addableExamDefinitions : ExamDefinition[] = this.state.addableExamTypes.filter((examType: ExamDefinition) =>  (doingPreExam===true && examType.isPreExam===true) ||
          (doingPreExam===false && examType.section.substring(0, examType.section.indexOf('.'))===section));
      const addableExamLabels : string[] = addableExamDefinitions.map((examType: ExamDefinition) => examType.label?examType.label:examType.name);
      if (!addableExamLabels || addableExamLabels.length==0) return null;
      return <FloatingButton options={addableExamLabels} onPress={(examLabel: string) => this.addExam(examLabel)}/>
    }

    renderLockIcon() {
      if (this.state.locked!==true) return null;
      return <View style={styles.examIcons}>
        <TouchableOpacity onPress={this.switchLock}><Lock style={styles.screenIcon} locked={this.state.locked===true}/></TouchableOpacity>
      </View>
    }

    render() {
        if (this.props.visitId===undefined) {
          return null;
        }
        if (!this.state.visit && !this.props.readonly) {
          return <View>
            {!this.props.readonly && <StartVisitButtons isPreVisit={true} onStartVisit={this.props.onStartVisit} />}
          </View>
        }
        const preExamDefinitions : ExamDefinition[] = getCachedItems(getCachedItem('preExamDefinitions'));
        if (!visitHasStarted(this.state.visit)) {
            const hasPreTests = preExamDefinitions==undefined || preExamDefinitions.length>0;
            return <View>
              {hasPreTests && <View style={styles.flow}>
                {this.renderExams('Pre tests', getCachedItems(this.state.visit.preCustomExamIds), true)}
                </View>}
              {!this.props.readonly && <StartVisitButtons isPreVisit={false} onStartVisit={this.props.onStartVisit} />}
            </View>
        }
        let exams: Exam[] = getCachedItems(this.state.visit.preCustomExamIds);
        if (!exams) exams = [];
        exams = exams.concat(getCachedItems(this.state.visit.customExamIds));
        return <View>
          <View style={styles.flow}>
          {examSections.map((section: string) => {return this.renderExams(section, exams, false)})}
          </View>
          <View style={styles.flow}>
              {this.renderAssessments()}
          </View>
          {this.renderActionButtons()}
          {this.renderLockIcon()}
        </View>
    }
}

export class VisitHistoryCard extends Component {
  props: {
    patientInfo: PatientInfo,
  }
  state: {
    summaries : ?Exam[];
  }


  constructor(props: any) {
      super(props);
      this.state = {
        summaries: getRecentVisitSummaries(props.patientInfo.id)
      }
      this.refreshPatientInfo();
  }

  async refreshPatientInfo() {
    if (this.state.summaries) return;
    const summaries : ?Exam[] = getRecentVisitSummaries(this.props.patientInfo.id);
    if (summaries===undefined) {
      await fetchVisitHistory(this.props.patientInfo.id);
      summaries = getRecentVisitSummaries(this.props.patientInfo.id);
    }
    this.setState({summaries});
  }


  render() {
    if (!this.state.summaries) return null;
    return <View style={styles.tabCard}>
      <Text style={styles.cardTitle}>{strings.summaryTitle}</Text>
      {this.state.summaries.map((visitSummary: Exam, index: number) =>
          <View style={styles.rowLayout}>
            <Text style={styles.text}>{formatDate(getCachedItem(visitSummary.visitId).date, isToyear(getCachedItem(visitSummary.visitId).date)?dateFormat:farDateFormat)}: </Text>
            <View style={styles.cardColumn}>
              <Text style={styles.text}>{visitSummary.resume}</Text>
            </View>
          </View>
      )}
    </View>
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
        disableScroll: () => void
    }
    state: {
        selectedId: ?string,
        history: ?string[],
        showingDatePicker: boolean
    }

    constructor(props: any) {
        super(props);
        this.state = {
          selectedId: undefined,
          history: this.combineHistory(props.patientDocumentHistory, props.visitHistory),
          showingDatePicker: false
        };
    }

    componentDidUpdate(prevProps: any, prevState: any) {
      if (this.props.patientInfo.id===prevProps.patientInfo.id && this.props.visitHistory===prevProps.visitHistory && this.props.patientDocumentHistory===prevProps.patientDocumentHistory) return;
      this.setState({history: this.combineHistory(this.props.patientDocumentHistory, this.props.visitHistory)});
    }

    showVisit(id: ?string) {
      this.setState({ selectedId: id });
    }

    async deleteVisit(visitId: string) {
      if (this.props.readonly) return;
      const visit : Visit = getCachedItem(visitId);
      if (!visit) return;
      try {
        visit.inactive = true;
        await updateVisit(visit);
        let i : number = this.props.visitHistory.indexOf(visitId);
        if (i>=0) {
          this.props.visitHistory.splice(i,1);
        }
        if (this.state.selectedId===visitId) {
          this.setState({selectedId: undefined});
        }
        this.props.onRefresh();
      } catch (error) {
        console.log(error);
        alert(strings.serverError);
      }
    }

    confirmDeleteVisit(visitId: ?string) {
      if (!visitId.startsWith('visit-')) return; //TODO: We don't support deleting notes yet
      const visit : Visit = getCachedItem(visitId);
      Alert.alert(
        strings.deleteVisitTitle,
        strings.formatString(strings.deleteVisitQuestion, visit.typeName?visit.typeName.toLowerCase():strings.visit, formatMoment(visit.date)),
        [
          {
            text: strings.cancel,
            style: 'cancel',
          },
          {text: strings.confirm, onPress: () => this.deleteVisit(visitId)},
        ],
        {cancelable: false},
      );
    }

    isNewAppointment() : boolean {
      const appointment : Appointment = this.props.appointment;
      const visitHistory : string[] = this.props.visitHistory;
      if (appointment===undefined) return false;
      if (appointment.id === undefined) return true;
      if (!visitHistory) return false;
      let appointmentsVisitId :?Visit = visitHistory.find((visitId: string) => {
        const visit : ?Visit = getCachedItem(visitId);
        return visit && (visit.appointmentId === appointment.id);
      });
      return appointmentsVisitId===undefined;
    }

    newVisit(date: Date, appointmentId : string, patientId: string, userId: string) : Visit {
      let newVisit: Visit = {
          id: 'visit',
          version: -1,
          appointmentId: appointmentId,
          patientId: patientId,
          userId: userId,
          typeName: '',
          date: formatDate(date, jsonDateTimeFormat),
          duration: 15, //TODO userpreference?
          location: undefined,
          preExamIds: [],
          examIds: [],
          recall: {},
          prescription: {},
          customExamIds: [],
          preCustomExamIds: []
      };
      return newVisit;
    }

    async startVisit(visitId: string, visitType: string) {
      if (this.props.readonly) return;
      let visit = getCachedItem(visitId);
      visit.typeName = visitType;
      visit = await updateVisit(visit);
      this.props.onRefresh();
      this.setState({
        selectedId: visit.id
      });
    }

    async startAppointment() {
      if (this.props.readonly) return;
      const appointmentId : string = this.props.appointment.id;
      const patientId: string = this.props.patientInfo.id;
      const userId: string = getDoctor().id;
      const date: Date = now();
      let visit = this.newVisit(date, appointmentId, patientId, userId);
      visit = await createVisit(visit);
      this.props.onRefresh();
      this.setState({
        selectedId: visit.id
      });
    }

    async addVisit(date: Date) {
      if (this.props.readonly) return;
      const appointmentId : string = null;
      const patientId: string = this.props.patientInfo.id;
      const userId: string = getDoctor().id;
      let visit = this.newVisit(date, appointmentId, patientId, userId);
      visit = await createVisit(visit);
      this.props.onRefresh();
      this.setState({
        selectedId: visit.id
      });
    }

    combineHistory(patientDocumentHistory: ?string[], visitHistory: ?string[]) : string[] {
        if (!patientDocumentHistory && !visitHistory) {
          return undefined;
        }
        let history: string[] = [];
        if (!patientDocumentHistory || patientDocumentHistory.length===0) {
          history = visitHistory;
        } else if (!visitHistory || visitHistory.length===0) {
          history = patientDocumentHistory;
        } else {
          let visitIndex: number = 0;
          let patientDocumentIndex: number = 0;
          while (visitIndex<visitHistory.length || patientDocumentIndex<patientDocumentHistory.length) {
            let visit : ?Visit = visitIndex<visitHistory.length?getCachedItem(visitHistory[visitIndex]):undefined;
            let patientDocument : ?PatientDocument = patientDocumentIndex<patientDocumentHistory.length?getCachedItem(patientDocumentHistory[patientDocumentIndex]):undefined;
            if (!visit) {
              history.push(patientDocument.id);
              patientDocumentIndex++;
            } else if (!patientDocument) {
              history.push(visit.id);
              visitIndex++;
            } else {
              let visitDate : ?string = visit.date;
              let patientDocumentDate : ?string = patientDocument.postedOn;
              if (compareDates(visitDate, patientDocumentDate)>=0) {
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
    }

    hideDatePicker = () => {
      this.setState({showingDatePicker: false});
    }

    selectDate = (date : Date) => {
      if (compareDates(date, tomorrow())>=0) {
        alert(strings.futureVisitDateError);
        return;
      }
      this.setState({showingDatePicker: false}, () => this.addVisit(date));
    }

    renderSummary() {
      let isNewAppointment : boolean = this.isNewAppointment();
      return <View style={styles.topFlow}>
        <PatientRefractionCard patientInfo={this.props.patientInfo} />
        <PatientMedicationCard patientInfo={this.props.patientInfo} editable={false}/>
        <VisitHistoryCard patientInfo={this.props.patientInfo} />
        {!this.props.readonly && <View style={styles.startVisitCard}>
            <View style={styles.flow}>
                {isNewAppointment && <Button title={strings.startAppointment} onPress={() => this.startAppointment()} />}
                {!isNewAppointment && <Button title={strings.addVisit} onPress={this.showDatePicker} />}
                {__DEV__ && <Button title={strings.printRx} />}
                {__DEV__ && <Button title='Book appointment' />}
                {!isNewAppointment && this.state.showingDatePicker && <DateTimePicker
                  isVisible={this.state.showingDatePicker}
                  hideTitleContainerIOS={true}
                  date={new Date()}
                  mode="date"
                  onConfirm={this.selectDate}
                  onCancel={this.hideDatePicker}
                  confirmTextIOS={strings.confirm}
                  confirmTextStyle={styles.pickerLinkButton}
                  cancelTextIOS={strings.cancel}
                  cancelTextStyle={styles.pickerLinkButton}/>
                }
            </View>
        </View>}

      </View>
    }

    render() {
        if (!this.state.history) return null;
        return <View>
            <View style={styles.tabHeader}>
              <SummaryButton isSelected={this.state.selectedId === undefined} onPress={() => this.showVisit(undefined)} />
              <FlatList
                horizontal={true}
                extraData={this.state.selectedId}
                data={this.state.history}
                keyExtractor={(visitId: string, index :number) => index.toString()}
                renderItem={(data: ?any) => <VisitButton key={data.item} isSelected={this.state.selectedId === data.item} id={data.item}
                  keyboardShouldPersistTaps="handled" onPress={() => this.showVisit(data.item)} onLongPress={() => this.confirmDeleteVisit(data.item)}
                />}
              />
            </View>
            {this.state.selectedId===undefined && this.renderSummary()}
            {this.state.selectedId && this.state.selectedId.startsWith('visit') && <VisitWorkFlow patientId={this.props.patientInfo.id}
                visitId={this.state.selectedId}
                navigation={this.props.navigation}
                appointmentStateKey={this.props.appointmentStateKey}
                onStartVisit={(visitType: string, isPreVisit: boolean) => {this.startVisit(this.state.selectedId, visitType)}}
                readonly={this.props.readonly}
                enableScroll={this.props.enableScroll}
                disableScroll={this.props.disableScroll}
              />}
            {this.state.selectedId && this.state.selectedId.startsWith('patientDocument') && <PatientDocumentPage id={this.state.selectedId}/>}
        </View>
    }
}

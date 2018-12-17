/**
 * @flow
 */
'use strict';

import React, { Component, PureComponent } from 'react';
import { View, TouchableHighlight, Text, TouchableOpacity, ListView, LayoutAnimation, Modal, TouchableWithoutFeedback, FlatList } from 'react-native';
import type {Patient, Exam, GlassesRx, GlassRx, Visit, Appointment, ExamDefinition, ExamPredefinedValue, Recall } from './Types';
import { styles, fontScale } from './Styles';
import { strings } from './Strings';
import {Button, FloatingButton, Lock} from './Widgets';
import { formatMoment, deepClone, formatDate, now, jsonDateTimeFormat } from './Util';
import { ExamCard, createExam } from './Exam';
import { allExamPredefinedValues } from './Favorites';
import { allExamDefinitions, overwriteExamDefinition } from './ExamDefinition';
import { ReferralCard, RecallCard, PrescriptionCard, AssessmentCard } from './Assessment';
import { cacheItem, getCachedItem, getCachedItems, cacheItemsById, cacheItemById } from './DataCache';
import { searchItems, storeItem, performActionOnItem, fetchItemById } from './Rest';
import { fetchAppointment } from './Appointment';
import { printRx } from './Print';

const examSections : string[] = ['Chief complaint','History','Entrance testing','Vision testing','Anterior exam','Posterior exam','CL','Form'];

export async function fetchVisit(visitId: string) : Visit {
  let visit : Visit = await fetchItemById(visitId);
  return visit;
}

async function fetchVisitTypes() : string[] {
    const searchCriteria = {};
    let restResponse = await searchItems('VisitType/list', searchCriteria);
    let visitTypes : string[] = restResponse.visitTypeNameList;
    cacheItem('visitTypes', visitTypes);
    return visitTypes;
}

export function getVisitTypes() : string[] {
  return getCachedItem('visitTypes');
}

export function visitHasEnded(visit: string|Visit) : boolean {
  if (visit instanceof Object === false) {
     visit = getCachedItem(visit);
  }
  if (visit===null || visit===undefined) return false;
  if (visit.appointmentId===null || visit.appointmentId===undefined) return false;
  const appointment = getCachedItem(visit.appointmentId);
  if (appointment===null || appointment===undefined) return false;
  return appointment.status===2 || appointment.status===3 || appointment.status===5;
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
    customExams && customExams.forEach((exam: Exam) => overwriteExamDefinition(exam)); //TODO remove after beta
    cacheItemsById(customExams);
    cacheItemsById(visits);
    cacheItem('visitHistory-'+patientId, visitIds);
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
    await fetchVisitHistory(visit.patientId);
    return visit;
}

export async function updateVisit(visit: Visit) : Visit {
    visit = await storeItem(visit);
    return visit;
}

class VisitButton extends PureComponent {
    props: {
        visitId: string,
        isSelected: ?boolean,
        onPress: () => void
    }

    render() {
        const visit : ?Visit = getCachedItem(this.props.visitId);
        if (!visit) return <TouchableOpacity onPress={this.props.onPress}>
               <View style={this.props.isSelected ? styles.selectedTab : styles.tab}>
                   <Text style={this.props.isSelected ? styles.tabTextSelected : styles.tabText}>{formatMoment(now())}</Text>
                   <Text style={this.props.isSelected ? styles.tabTextSelected : styles.tabText}>{strings.notStarted}</Text>
               </View>
             </TouchableOpacity>
        return <TouchableOpacity onPress={this.props.onPress}>
            <View style={this.props.isSelected ? styles.selectedTab : styles.tab}>
                <Text style={this.props.isSelected ? styles.tabTextSelected : styles.tabText}>{formatMoment(visit.date)}</Text>
                <Text style={this.props.isSelected ? styles.tabTextSelected : styles.tabText}>{visit.typeName}</Text>
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
    visitTypes: string[]
  }
  constructor(props: any) {
    super(props);
    this.state = {
      visitTypes: []
    }
  }

  componentWillMount() {
    this.loadVisitTypes();
  }

  async loadVisitTypes() {
    if (this.state.visitTypes && this.state.visitTypes.length>0) return;
    let visitTypes : string[] = getVisitTypes();
    if (!visitTypes || visitTypes.length===0)
      visitTypes = await fetchVisitTypes();
    this.setState({visitTypes});
  }

  render() {
    if (this.state.visitTypes.length===0) return null;
    return <View style={styles.startVisitCard}>
        {this.props.title && <Text style={styles.sectionTitle}>{this.props.title}</Text>}
        <View style={styles.flow}>
          {this.state.visitTypes.map((visitType: string, index: number) =>
            <Button title={visitType} key={index} onPress={() => this.props.onStartVisit(visitType, this.props.isPreVisit)} />)}
        </View>
    </View>
  }
}

class SectionTitle extends Component {
  props: {
    title: string
  }
  layout: any;

  onLayout = (layout: any) => {
      this.layout = layout.nativeEvent.layout;
      this.forceUpdate();
  }

  render() {
      const title : string = this.layout?this.props.title.replace(' ','\n'):'';
      return <View style={{flex: 1, transform : [{rotate : '-90deg'}, {translate: [this.layout?-this.layout.width/2:0, this.layout?-this.layout.width/2+this.layout.height/2:0]}], position: 'absolute'}} onLayout={this.onLayout}>
        <Text style={styles.sectionTitle}>{title}</Text></View>
  }
}

class VisitWorkFlow extends Component {
    props: {
        visitId: string,
        navigation: any,
        appointmentStateKey: string,
        onStartVisit: (type: string, isPreVisit: boolean) => void,
    }
    state: {
        visit: Visit,
        expandedExamTypes: string[],
        addableExamTypes: ExamDefinition[],
        addableSections: string[],
        selectedExamSection: ?string,
        visitHasEnded: boolean,
        locked: boolean,
        rxToOrder: ?Exam
    }

    constructor(props: any) {
        super(props);
        const visit :Visit = getCachedItem(this.props.visitId);
        const visitEnded: boolean = visitHasEnded(visit);
        this.state = {
            visit: visit,
            expandedExamTypes: [],
            addableExamTypes: [],
            addableSections: [],
            selectedExamSection: undefined,
            visitHasEnded: visitEnded,
            locked: visitEnded,
            rxToOrder: this.findRxToOrder(visit)
        };
        visit && this.loadUnstartedExamTypes(visit, true);
    }

    componentWillReceiveProps(nextProps: any) {
        //TODO: optimize performance, might want to use componentShouldUpdate
        const visit :Visit = getCachedItem(nextProps.visitId);
        const visitEnded: boolean = visitHasEnded(visit);
        this.setState({
          visit: visit,
          visitHasEnded: visitEnded,
          locked: visitEnded,
          rxToOrder: this.findRxToOrder(visit),
          selectedExamSection: undefined
        });
        visit && this.loadUnstartedExamTypes(visit);
    }

    async storeVisit(visit: Visit) {
      visit = await storeItem(visit);
      const visitEnded: boolean = visitHasEnded(visit);
      this.setState({
        visit: visit,
        visitHasEnded: visitEnded,
        locked: visitEnded,
        rxToOrder: this.findRxToOrder(visit)
      });
      visit && this.loadUnstartedExamTypes(visit);
    }

    findRxToOrder(visit: Visit) : ?Exam {
      if (!visit) return undefined;
      if (!visit.customExamIds) return undefined;
      let rxToOrderExamId : ?string = visit.customExamIds.find((examId: string) => getCachedItem(examId).definition.name==='RxToOrder');
      if (rxToOrderExamId)
        return getCachedItem(rxToOrderExamId);
      return undefined;
    }

    toggleExpand(exam: Exam) {
        let expandedExamTypes: string[] = this.state.expandedExamTypes;
        const index: number = expandedExamTypes.indexOf(exam.definition.name);
        if (index === -1) {
            expandedExamTypes.push(exam.definition.name);
        } else {
            expandedExamTypes.splice(index, 1);
        }
        LayoutAnimation.easeInEaseOut();
        this.setState({ expandedExamTypes });
    }

    isExpanded(exam: Exam) {
        const index: number = this.state.expandedExamTypes.indexOf(exam.definition.name);
        return (index !== -1);
    }

    async loadAppointment(visit: Visit) {
      if (!visit || !visit.appointmentId) return;
      let appointment : Appointment = getCachedItem(visit.appointmentId);
      if (!appointment) {
        await fetchAppointment(visit.appointmentId);
        const visitEnded: boolean = visitHasEnded(visit);
        this.setState({
          visitHasEnded: visitEnded,
          locked: visitEnded
        });
      }
      return appointment;
    }

    async loadUnstartedExamTypes(visit: Visit) {
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
        let existingExamIndex : number = visit.preCustomExamIds?visit.preCustomExamIds.findIndex((examId : string) => getCachedItem(examId).definition.name === examType.name):-1;
        if (existingExamIndex<0 && visit.customExamIds) existingExamIndex = visit.customExamIds.findIndex((examId : string) => getCachedItem(examId).definition.name === examType.name);
        return (existingExamIndex<0);
      });
      let addableSections : string[] = examSections.filter((section: string) => unstartedExamTypes.map((examDefinition : ExamDefinition) => examDefinition.section.substring(0, examDefinition.section.indexOf('.'))).includes(section));
      this.setState({addableExamTypes: unstartedExamTypes, addableSections});
    }

    async createExam(examDefinitionId: string, examPredefinedValueId?: string) {
        const visit : ?Visit = this.state.visit;
        if (!visit || !visit.id) return;
        let exam: Exam = {id: 'customExam', visitId: visit.id, customExamDefinitionId: examDefinitionId, examPredefinedValueId: examPredefinedValueId};
        exam = await createExam(exam);
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

    async addExam(examName: string) {
      let examDefinition: ?ExamDefinition = (await allExamDefinitions(false)).find((examDefinition: ExamDefinition) => examDefinition.name === examName);
      if (!examDefinition) examDefinition = (await allExamDefinitions(true)).find((examDefinition: ExamDefinition) => examDefinition.name === examName);
      this.setState({selectedExamSection: undefined});
      if (!examDefinition) return;
      this.createExam(examDefinition.id, undefined);
    }

    async closeAppointment(appointmentId: string) : void {
      await performActionOnItem('close', getCachedItem(appointmentId));
    }

    async endVisit() {
      const visit : Visit = this.state.visit;
      try {
        await this.closeAppointment(visit.appointmentId);
        this.props.navigation.goBack();
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

    selectAddableExamSection = (selectedExamSection: string) => {
      this.setState({selectedExamSection});
    }

    renderExams(title: string, exams: ?Exam[], isPreExam: boolean) {
        if (exams) {
          if (!isPreExam)
            exams = exams.filter((exam: Exam) => exam.definition.section && exam.definition.section.startsWith(title));
          exams = exams.filter((exam: Exam) => !exam.definition.isAssessment && (exam.hasStarted || this.state.locked!==true));
          exams.sort(this.compareExams);
        }
        if (isPreExam===false && (!exams || exams.length===0))
          return null;
        return <View style={styles.examsBoard} key={title}>
            <SectionTitle title={title} />
            <View style={styles.flow}>
                {exams && exams.map((exam: Exam, index: number) => {
                    return <ExamCard key={index} exam={exam} isExpanded={this.isExpanded(exam)}
                        onSelect={() => this.props.navigation.navigate('exam', {exam, appointmentStateKey: this.props.appointmentStateKey})}
                        onToggleExpand={() => this.toggleExpand(exam)} />
                })}
            </View>
        </View>
    }

    renderAssessments() {
       let assessments : Exam[] = getCachedItems(this.state.visit.customExamIds).filter(
         (exam: Exam) => exam.definition.isAssessment);
       return assessments.map((exam: Exam, index: number) => {
         if (exam.definition.name==='RxToOrder') {
           return  <TouchableOpacity key={index} onPress={() => this.state.rxToOrder && this.props.navigation.navigate('exam', {exam: this.state.rxToOrder, appointmentStateKey: this.props.appointmentStateKey}) }>
                    <PrescriptionCard title={strings.finalRx} visit={this.state.visit} editable={false} />
                  </TouchableOpacity>
         } else {
           return <AssessmentCard exam={exam} navigation={this.props.navigation} key={index} appointmentStateKey={this.props.appointmentStateKey}/>
         }
        }
     );
    }

    renderActionButtons() {
      return <View style={{paddingTop: 30*fontScale, paddingBottom:100*fontScale}}>
          <View style={styles.flow}>
            {!this.state.visitHasEnded && <Button title={strings.sign} onPress={() => {}}/>}
            <Button title={strings.printRx} onPress={() => {printRx(this.props.visitId)}}/>
            <Button title={strings.printReferral} onPress={() => {}}/>
            {!this.state.visitHasEnded && <Button title={strings.endVisit} onPress={() => this.endVisit()}/>}
        </View>
      </View>
    }

    renderAddableExamButton() {
      const doingPreExam : boolean = !visitHasStarted(this.state.visit);
      const selectedSection : string = this.state.selectedExamSection;
      const addableExamDefinitions : ExamDefinition[] = this.state.addableExamTypes.filter((examType: ExamDefinition) =>  (doingPreExam===false || examType.isPreExam===true) &&
          (selectedSection===undefined || examType.section.substring(0, examType.section.indexOf('.'))===selectedSection));
      const addableExamTypes : String[] = addableExamDefinitions.map((examType: ExamDefinition) => examType.name);
      if (!addableExamTypes || addableExamTypes.length==0) return null;
      return <FloatingButton options={addableExamTypes} onPress={(examType: string) => {this.addExam(examType); return true;}}/>
    }

    renderAddableExamSectionButton() {
      const addableSections : string[] = this.state.addableSections;
      if (!addableSections || addableSections.length==0) return null;
      return <FloatingButton options={addableSections} onPress={(examSection: string) => {this.selectAddableExamSection(examSection);return false;}}/>
    }

    renderLockIcon() {
      if (this.state.visitHasEnded!==true) return null;
      return <View style={styles.examIcons}>
        <TouchableOpacity onPress={this.switchLock}><Lock style={styles.screenIcon} locked={this.state.locked===true}/></TouchableOpacity>
      </View>
    }

    render() {
        if (!this.state.visit) {
          return <View>
            <StartVisitButtons isPreVisit={true} onStartVisit={this.props.onStartVisit} />
          </View>
        }
        if (!visitHasStarted(this.state.visit)) {
            return <View>
              <View style={styles.flow}>
                {this.renderExams('Pre tests', getCachedItems(this.state.visit.preCustomExamIds), true)}
                {this.renderAddableExamButton()}
              </View>
              <StartVisitButtons isPreVisit={false} onStartVisit={this.props.onStartVisit} />
            </View>
        }
        let exams: Exam[] = getCachedItems(this.state.visit.preCustomExamIds);
        if (!exams) exams = [];
        exams = exams.concat(getCachedItems(this.state.visit.customExamIds));
        return <View>
          <View style={styles.flow}>
          {examSections.map((section: string) => {return this.renderExams(section, exams, false)})}
          {this.state.selectedExamSection?this.renderAddableExamButton():this.renderAddableExamSectionButton()}
          </View>
          <View style={styles.flow}>
              {this.renderAssessments()}
          </View>
          <View style={styles.flow}>
              <RecallCard visit={this.state.visit} onUpdateVisit={(visit: Visit) => this.storeVisit(visit)}/>
              <ReferralCard />
          </View>
          {this.renderActionButtons()}
          {this.renderLockIcon()}
        </View>
    }
}

export class VisitHistory extends Component {
    props: {
        appointment: Appointment,
        visitHistory: string[],
        navigation: any,
        appointmentStateKey: string,
        onAddVisit: (visit: Visit) => void
    }
    state: {
        appointmentsVisitId: ?string,
        selectedVisitId: ?string
    }

    constructor(props: any) {
        super(props);
        const appointmentsVisitId : ?string = this.findAppointmentsVisitId(this.props.visitHistory);
        this.state = {
          appointmentsVisitId,
          selectedVisitId: appointmentsVisitId
        };
    }

    componentWillReceiveProps(nextProps: any) {
      if ('visit'===this.state.appointmentsVisitId) {
        const appointmentsVisitId : ?string = this.findAppointmentsVisitId(nextProps.visitHistory);
        if (this.state.selectedVisitId==='visit') this.setState({appointmentsVisitId, selectedVisitId: appointmentsVisitId});
        else this.setState({appointmentsVisitId});
      }
    }

    showVisit(visitId: ?string) {
        this.setState({ selectedVisitId: visitId });
    }

    newVisit() : Visit {
      let newVisit: Visit = {
          id: 'visit',
          version: -1,
          appointmentId: this.props.appointment.id,
          patientId: this.props.appointment.patientId,
          userId: this.props.appointment.userId,
          typeName: '',
          date: formatDate(now(), jsonDateTimeFormat),
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

    async startVisit(visitId: ?string, visitType: string, isPrevisit: boolean) {
      let visit : ?Visit = getCachedItem(visitId);
      if (!visit || !visit.id) {
        visit = this.newVisit();
        visit.typeName = visitType;
        visit = await createVisit(visit);
        this.props.onAddVisit(visit);
      } else {
        visit.typeName = visitType;
        visit = await updateVisit(visit);
      }
      this.setState({appointmentsVisitId: visit.Id, selectedVisitId: visit.id});
    }

    findAppointmentsVisitId(visitHistory: Visit[]) : ?string {
        if (!visitHistory || visitHistory.length===0) return 'visit';
        let appointmentsVisitId :?Visit = visitHistory.find((visitId: string) => {
          const visit : ?Visit = getCachedItem(visitId);
          return visit && visit.appointmentId == this.props.appointment.id
        });
        if (!appointmentsVisitId) return 'visit';
        return appointmentsVisitId;
    }

    render() {
        if (!this.props.visitHistory) return null;
        const data = this.state.appointmentsVisitId!='visit'?this.props.visitHistory:['visit'].concat(this.props.visitHistory);
        return <View>
            <View style={styles.tabHeader}>
              <FlatList
                horizontal={true}
                extraData={this.state.selectedVisitId}
                data={data}
                keyExtractor={(visitId: string, index :number) => index.toString()}
                renderItem={(data: ?any) => <VisitButton key={data.item} isSelected={this.state.selectedVisitId === data.item} visitId={data.item} onPress={() => this.showVisit(data.item)} />}
              />
              </View>
              <VisitWorkFlow patientId={this.props.appointment.patientId}
                  visitId={this.state.selectedVisitId}
                  navigation={this.props.navigation}
                  appointmentStateKey={this.props.appointmentStateKey}
                  onStartVisit={(visitType: string, isPreVisit: boolean) => {this.startVisit(this.state.selectedVisitId, visitType, isPreVisit)}}
                />
        </View>
    }
}

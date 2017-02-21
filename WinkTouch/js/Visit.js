/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, TouchableHighlight, Text, ScrollView, TouchableOpacity, ListView, LayoutAnimation } from 'react-native';
import { styles, fontScale } from './Styles';
import type {Patient, Exam, GlassesRx, Visit, Appointment, Assessment } from './Types';
import {Button, FloatingButton, AddButton} from './Widgets';
import { formatMoment } from './Util';
import { ExamCard, createPreExams, createExams, allExamTypes } from './Exam';
import { AssessmentCard, PrescriptionCard } from './Assessment';
import { storeDocument, fetchViewDocuments } from './CouchDb';
import { cacheItem, getCachedItem, getCachedItems } from './DataCache';

export async function fetchVisitHistory(patientId: string) : Visit[] {
  const startKey: string[] = [patientId];
  const endKey: string[] = [patientId+'0'];
  let visits : Visit[] = await fetchViewDocuments('visits', startKey, endKey);
  let visitIds : string[] = visits.map((visit: Visit, index: number) => visit._id);
  cacheItem('visitHistory'+patientId, visitIds);
  return visits;
}


export async function createVisit(visit: Visit) : Visit {
  try {
      visit.dataType = 'Visit';
      visit = await storeDocument(visit);
      let visitIds :string[] = getCachedItem('visitHistory'+visit.patientId);
      if (!visitIds) visitIds = [];
      visitIds.unshift(visit._id);
      cacheItem('visitHistory'+visit.patientId, visitIds);
      return visit;
  } catch (error) {
    console.log(error);
    alert('Something went wrong trying to store the patient\'s visit on the server. You can try again anytime.');
  }
}

class VisitButton extends Component {
    props: {
        visit: ?Visit,
        isSelected: ?boolean,
        onPress: () => void
    }

    render() {
        if (!this.props.visit) return null;
        return <TouchableOpacity onPress={this.props.onPress}>
            <View style={this.props.isSelected ? styles.selectedTab : styles.tab}>
                <Text style={this.props.isSelected ? styles.tabTextSelected : styles.tabText}>{formatMoment(this.props.visit.start)}</Text>
                <Text style={this.props.isSelected ? styles.tabTextSelected : styles.tabText}>{this.props.visit.type}</Text>
            </View>
        </TouchableOpacity>
    }
}

class ExamWorkFlow extends Component {
    props: {
        workflow: Exam[]
    }

}
export class VisitWorkFlow extends Component {
    props: {
        patientId: string,
        visit: Visit,
        onNavigationChange: (action: string, data: any) => void,
        onStartVisit: (type: string) => void,
        onAddExam: (type: string) => void,
        onUpdatePrescription: (prescription: GlassesRx) => void
    }
    state: {
        expandedExamTypes: string[],
        addableExamTypes: string[]
    }
    constructor(props: any) {
        super(props);
        this.state = {
            expandedExamTypes: [],
            addableExamTypes: this.unstartedExamTypes(this.props.visit.type)
        }
    }

    toggleExpand(exam: Exam) {
        let expandedExamTypes: string[] = this.state.expandedExamTypes;
        const index: number = expandedExamTypes.indexOf(exam.type);
        if (index === -1) {
            expandedExamTypes.push(exam.type);
        } else {
            expandedExamTypes.splice(index, 1);
        }
        LayoutAnimation.easeInEaseOut();
        this.setState({ expandedExamTypes });
    }

    isExpanded(exam: Exam) {
        const index: number = this.state.expandedExamTypes.indexOf(exam.type);
        return (index !== -1);
    }

    unstartedExamTypes(visitType: string) : string[] {
      const allTypes : string[] = allExamTypes(undefined);
      if (!this.props.visit.examIds || this.props.visit.examIds.length===0)
        return allTypes;
      let unstartedExamTypes : string[] = [];
      for (let i=0;i<allTypes.length;i++) {
        const examType: string = allTypes[i];
        let existingExamIndex = this.props.visit.examIds.findIndex((examId : string) => getCachedItem(examId).type === examType);
        if (existingExamIndex<0) unstartedExamTypes.push(examType);
      }
      return unstartedExamTypes;
    }

    renderStartVisitButtons() {
        return <View style={styles.tabCard}>
            <View style={styles.flow}>
                <Button title='Comprehensive exam' onPress={() => this.props.onStartVisit('comprehensive')} />
                <Button title='Follow up' onPress={() => this.props.onStartVisit('followUp')} />
                <Button title='Contacts Fitting' onPress={() => this.props.onStartVisit('fitting')} />
            </View>
        </View>
    }

    renderExams(exams: ?Exam[], addableExamOptions: ?string[]) {
        return <View style={styles.tabCard}>
            <View style={styles.flow}>
                {exams && exams.map((exam: Exam, index: number) => {
                    return <ExamCard key={index} exam={exam} isExpanded={this.isExpanded(exam)}
                        onSelect={() => this.props.onNavigationChange('showExam', exam)}
                        onToggleExpand={() => this.toggleExpand(exam)} />
                })}
            </View>
            {addableExamOptions && addableExamOptions.length>0?<FloatingButton options={addableExamOptions} onPress={this.props.onAddExam}/>:null}
         </View>
    }

    render() {
        if (this.props.visit.examIds === undefined || this.props.visit.examIds.length === 0) {
            return <View>
                {this.renderExams(getCachedItems(this.props.visit.preExamIds))}
                {this.renderStartVisitButtons()}
            </View>
        }
        let unstartedExamTypes : string[] = this.unstartedExamTypes(this.props.visit.type);
        return <View>
            {this.renderExams(getCachedItems(this.props.visit.preExamIds))}
            {this.renderExams(getCachedItems(this.props.visit.examIds), unstartedExamTypes)}
            <AssessmentCard />
        </View>
    }
}

export class VisitHistory extends Component {
    props: {
        appointment: Appointment,
        visitHistory: Visit[],
        onNavigationChange: (action: string, data: any) => void,
        onUpdate: (itemType: string, item: any) => void
    }
    state: {
        appointmentsVisit: ?Visit,
        selectedVisit: ?Visit
    }

    constructor(props: any) {
        super(props);
        const appointmentsVisit : ?Visit = this.findAppointmentsVisit(this.props.visitHistory);
        let selectedVisit: ?Visit = appointmentsVisit;
        if (!selectedVisit && this.props.visitHistory && this.props.visitHistory.length>0) {
          selectedVisit = this.props.visitHistory[0];
        }
        this.state = {
          appointmentsVisit,
          selectedVisit
        };
    }

    componentWillReceiveProps(nextProps: any) {
      if (this.state.selectedVisit)
        return;
      const appointmentsVisit: ?Visit = this.findAppointmentsVisit(nextProps.visitHistory);
      let selectedVisit: ?Visit = appointmentsVisit;
      if (!selectedVisit && nextProps.visitHistory && nextProps.visitHistory.length>0) {
        selectedVisit = nextProps.visitHistory[0];
      }
      this.setState({  appointmentsVisit, selectedVisit });
    }

    showVisit(visit: Visit) {
        LayoutAnimation.easeInEaseOut();
        this.setState({ selectedVisit: visit });
    }

    newVisit() : Visit {
      let newVisit: Visit = {
          appointmentId: this.props.appointment._id,
          patientId: this.props.appointment.patientId,
          doctorId: this.props.appointment.doctorId,
          type: this.props.appointment.type,
          start: new Date(),
          end: undefined,
          location: undefined,
          preExamIds: [],
          examIds: [],
          assessment: {}
      };
      return newVisit;
    }

    async startPreVisit() {
      let appointmentsVisit : ?Visit = this.state.appointmentsVisit;
      if (!appointmentsVisit) {
        appointmentsVisit = await createVisit(this.newVisit(this.props.appointment));
        this.props.visitHistory.unshift(appointmentsVisit);
      }
      appointmentsVisit = await createPreExams(appointmentsVisit);
      const selectedVisit : ?Visit = appointmentsVisit;
      this.setState({ selectedVisit, appointmentsVisit});
      LayoutAnimation.easeInEaseOut();
      this.props.onUpdate('Visit', selectedVisit);
    }

    async startVisit(visitType: string) {
        let selectedVisit : ?Visit = this.state.selectedVisit;
        if (!selectedVisit) return;
        selectedVisit = await createExams(selectedVisit);
        //TODO: udpate appointmentsVisit ?
        LayoutAnimation.easeInEaseOut();
        this.setState({ selectedVisit });
    }

    async addExam(examType: string) {
        let selectedVisit : ?Visit = this.state.selectedVisit;
        if (!selectedVisit) return;
        selectedVisit = await createExams(selectedVisit, [examType]);
        this.setState({selectedVisit});
        //TODO check if exams in visit history got also updated
    }

    updatePrescription(prescription: GlassesRx) {
        const selectedVisit : ?Visit = this.state.selectedVisit;
        if (!selectedVisit) return;
        selectedVisit.assessment.prescription = prescription;
        this.setState({selectedVisit});
        //TODO: onUpdate visit
    }

    findAppointmentsVisit(visitHistory: Visit[]) : ?Visit {
        if (!visitHistory || visitHistory.length===0) return undefined;
        let appointmentsVisit :?Visit = visitHistory.find(visit => visit.appointmentId && visit.appointmentId == this.props.appointment._id);
        return appointmentsVisit;
    }

    render() {
        return <View>
            <View style={styles.tabHeader}>
              <ScrollView horizontal={true}>
                <VisitButton isSelected={this.state.appointmentsVisit && this.state.selectedVisit._id === this.state.appointmentsVisit._id}
                  visit={this.state.appointmentsVisit} onPress={() => this.showVisit(this.state.appointmentsVisit)} />
                {this.props.visitHistory && this.props.visitHistory.map((visit: Visit, index: number) => {
                    if (this.state.appointmentsVisit && visit._id === this.state.appointmentsVisit._id) return null;
                    return <VisitButton isSelected={this.state.selectedVisit._id === visit._id}
                      key={index} visit={visit} onPress={() => this.showVisit(visit)} />
                })}
              </ScrollView>
              <AddButton onPress={() => this.startPreVisit()} />
            </View>
            {this.state.selectedVisit?
              <VisitWorkFlow patientId={this.props.appointment.patientId}
                visit={this.state.selectedVisit}
                onNavigationChange={this.props.onNavigationChange}
                onUpdatePrescription={(prescription: GlassesRx) => this.updatePrescription(prescription)}
                onStartVisit={(visitType: string) => this.startVisit(visitType)}
                onAddExam={(examType: string) => this.addExam(examType)} />:null}
        </View>
    }
}

/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, TouchableHighlight, Text, ScrollView, TouchableOpacity, ListView, LayoutAnimation } from 'react-native';
import { styles, fontScale } from './Styles';
import type {Patient, Exam, GlassesRx, Visit, Appointment, Assessment } from './Types';
import {Button, FloatingButton} from './Widgets';
import { formatMoment } from './Util';
import { ExamCard, createExams, allExamTypes, allPreExams, fetchExams, createExam } from './Exam';
import { AssessmentCard, PrescriptionCard } from './Assessment';

export function fetchVisitHistory(patient: Patient): Visit[] {
    let visit1: Visit = {
      id: 4,
      appointmentId: patient.patientId===2?1:undefined,
      type: 'Patient Complaint',
      start: patient.patientId===2?new Date():new Date(2017, 0, 18, 10, 30),
      end:  patient.patientId===2?undefined:new Date(2017, 0, 18, 10, 45),
      location: 'the oval office',
      patient: patient,
      doctor: 'Conrad Murray',
      preExams: patient.patientId===2?allPreExams(patient):[],
      exams: [],
      assessment: {prescription: {id: 1, od: {sphere: 2}, os: {sphere: 2}}}
    };
    let visit2: Visit = {
        id: 3,
        type: 'Pickup new glasses',
        start: new Date(2016, 10, 14, 10, 30),
        end: new Date(2016, 10, 15, 10, 50),
        location: 'the oval office',
        patient: patient,
        doctor: 'Conrad Murray',
        preExams: allPreExams(patient),
        exams: fetchExams(patient),
        assessment: {prescription: {id: 1, od: {sphere: 2}, os: {sphere: 2}}}
    };
    let visit3: Visit = {
        id: 2,
        type: 'Control visit',
        start: new Date(2016, 10, 2, 10, 30),
        end: new Date(2016, 10, 10, 10, 50),
        location: 'the oval office',
        patient: patient,
        doctor: 'Conrad Murray',
        preExams: allPreExams(patient),
        exams: fetchExams(patient),
        assessment: {prescription: {id:2, od: {sphere: 1.5}, os: {sphere: 1.5}}}
    };
    let visit4: Visit = {
        id: 1,
        type: 'New patient',
        start: new Date(2014, 9, 26, 10, 30),
        end: new Date(2014, 9, 2, 10, 50),
        location: 'the oval office',
        patient: patient,
        preExams: allPreExams(patient),
        doctor: 'Conrad Murray',
        assessment: {prescription: {id: 3, od: {sphere: 1}, os: {sphere: 1}}}
    };
    return [visit1, visit2, visit3];
}

function createVisit(appointment: Appointment) : Visit {
  let newVisit: Visit = {
      id: 10,
      type: appointment.type,
      start: new Date(),
      end: undefined,
      location: undefined,
      patient: appointment.patient,
      doctor: appointment.doctor,
      preExams: allPreExams(appointment.patient),
      exams: [],
      assessment: undefined
  };
  return newVisit;
}

class VisitButton extends Component {
    props: {
        visit: ?Visit,
        isSelected: ?boolean,
        onPress: () => void
    }

    render() {
        if (!this.props.visit) {
          return <TouchableOpacity onPress={this.props.onPress}>
              <View style={styles.tab}>
                  <Text style={styles.tabText}>Start</Text>
                  <Text style={styles.tabText}>Pre Visit</Text>
              </View>
          </TouchableOpacity>
        }
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
        patient: Patient,
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
      const allTypes : string[] = allExamTypes(visitType);
      if (!this.props.visit.exams || this.props.visit.exams.length===0)
        return allTypes;
      let unstartedExamTypes : string[] = [];
      for (let i=0;i<allTypes.length;i++) {
        const examType: string = allTypes[i];
        let existingExamInex = this.props.visit.exams.findIndex((exam : Exam) => exam.type === examType);
        if (existingExamInex<0) unstartedExamTypes.push(examType);
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
        if (!exams) return null;
        return <View style={styles.tabCard}>
            <View style={styles.flow}>
                {exams.map((exam: Exam, index: number) => {
                    return <ExamCard key={index} exam={exam} isExpanded={this.isExpanded(exam)}
                        onSelect={() => this.props.onNavigationChange('showExam', exam)}
                        onToggleExpand={() => this.toggleExpand(exam)} />
                })}
            </View>
            {addableExamOptions && addableExamOptions.length>0?<FloatingButton options={addableExamOptions} onPress={this.props.onAddExam}/>:null}
         </View>
    }

    render() {
        if (this.props.visit.exams === undefined || this.props.visit.exams.length === 0) {
            return <View>
                {this.renderExams(this.props.visit.preExams)}
                {this.renderStartVisitButtons()}
            </View>
        }
        const unstartedExamTypes : string[] = this.unstartedExamTypes(this.props.visit.type);
        return <View>
            {this.renderExams(this.props.visit.preExams)}
            {this.renderExams(this.props.visit.exams, unstartedExamTypes)}
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

    startPreVisit() {
      let appointmentsVisit : ?Visit = this.state.appointmentsVisit;
      if (!appointmentsVisit) {
         appointmentsVisit = createVisit(this.props.appointment);
      }
      appointmentsVisit.preExams = allPreExams(this.props.appointment.patient);
      const selectedVisit : ?Visit = appointmentsVisit;
      LayoutAnimation.easeInEaseOut();
      this.setState({ selectedVisit, appointmentsVisit});
      this.props.onUpdate('Visit', selectedVisit);
    }

    startVisit(visitType: string) {
        const selectedVisit : ?Visit = this.state.selectedVisit;
        if (!selectedVisit) return;
        selectedVisit.exams = createExams(this.props.appointment.patient, visitType);
        LayoutAnimation.easeInEaseOut();
        this.setState({ selectedVisit });
    }

    addExam = (examType: string) : void => {
        const selectedVisit : ?Visit = this.state.selectedVisit;
        if (!selectedVisit) return;
        const newExam : Exam = createExam(selectedVisit.id, examType);
        selectedVisit.exams.push(newExam);
        this.setState({selectedVisit});
        //TODO check if exams in visit history got also updated
        this.props.onUpdate('Appointment', this.props.appointment);
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
        return visitHistory.find(visit => visit.appointmentId && visit.appointmentId === this.props.appointment.id);
    }

    render() {
        return <View>
            <View style={styles.tabHeader}>
              <ScrollView horizontal={true}>
              <VisitButton isSelected={this.state.selectedVisit === this.state.appointmentsVisit}
                visit={this.state.appointmentsVisit} onPress={() => this.state.appointmentsVisit?this.showVisit(this.state.appointmentsVisit):this.startPreVisit()} />
                    {this.props.visitHistory && this.props.visitHistory.map((visit: Visit, index: number) => {
                        if (visit === this.state.appointmentsVisit) return null;
                        return <VisitButton isSelected={this.state.selectedVisit === visit}
                            key={index} visit={visit} onPress={() => this.showVisit(visit)} />
                    })}
                </ScrollView>
            </View>
            {this.state.selectedVisit?
              <VisitWorkFlow patient={this.props.appointment.patient}
                visit={this.state.selectedVisit}
                onNavigationChange={this.props.onNavigationChange}
                onUpdatePrescription={(prescription: GlassesRx) => this.updatePrescription(prescription)}
                onStartVisit={(visitType: string) => this.startVisit(visitType)}
                onAddExam={this.addExam} />:null}
        </View>
    }
}

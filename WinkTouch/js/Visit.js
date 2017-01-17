/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, TouchableHighlight, Text, Button, ScrollView, TouchableOpacity, ListView, LayoutAnimation } from 'react-native';
import { styles, fontScale } from './Styles';
import type {Patient } from './Patient';
import type {Appointment } from './Appointment';
import { formatMoment } from './Util';
import { ExamCard, allExams, allPreExams, fetchExams } from './Exam';
import type {Exam } from './Exam';
import { AssessmentCard, PrescriptionCard } from './Assessment';
import type {Assessment } from './Assessment';
import type {GlassesRx} from './Refraction';

export type Visit = {
    id?: number,
    type: string,
    start: Date,
    end?: Date,
    location: string,
    patientId: number,
    doctor: string,
    preExams?: Exam[],
    exams?: Exam[],
    assessment: Assessment
};

export function fetchVisitHistory(): Visit[] {
    let visit1: Visit = {
        id: 1,
        type: 'Pickup new glasses',
        start: new Date(2016, 10, 14, 10, 30),
        end: new Date(2016, 10, 15, 10, 50),
        location: 'the oval office',
        patientId: 1,
        doctor: 'Conrad Murray',
        preExams: allPreExams(),
        exams: fetchExams(),
        assessment: {prescription: {id: 1, od: {sphere: 2}, os: {sphere: 2}}}
    };
    let visit2: Visit = {
        id: 1,
        type: 'Control visit',
        start: new Date(2016, 10, 2, 10, 30),
        end: new Date(2016, 10, 10, 10, 50),
        location: 'the oval office',
        patientId: 2,
        doctor: 'Conrad Murray',
        preExams: allPreExams(),
        exams: fetchExams(),
        assessment: {prescription: {id:2, od: {sphere: 1.5}, os: {sphere: 1.5}}}
    };
    let visit3: Visit = {
        id: 1,
        type: 'New patient',
        start: new Date(2014, 9, 26, 10, 30),
        end: new Date(2014, 9, 2, 10, 50),
        location: 'the oval office',
        patientId: 2,
        preExams: allPreExams(),
        doctor: 'Conrad Murray',
        assessment: {prescription: {id: 3, od: {sphere: 1}, os: {sphere: 1}}}
    };
    return [visit1, visit2, visit3];
}

class VisitButton extends Component {
    props: {
        visit: Visit,
        isSelected?: boolean,
        onPress: () => void
    }

    render() {
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
        onUpdatePrescription: (prescription: GlassesRx) => void
    }
    state: {
        expandedExamTypes: string[]
    }
    constructor(props: any) {
        super(props);
        this.state = {
            expandedExamTypes: []
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

    renderStartButtons() {
        return <View style={styles.tabCard}>
            <View style={styles.flow}>
                <Button title='Comprehensive exam' onPress={() => this.props.onStartVisit('comprehensive')} />
                <Button title='Follow up' onPress={() => this.props.onStartVisit('followUp')} />
                <Button title='Contacts Fitting' onPress={() => this.props.onStartVisit('fitting')} />
            </View>
        </View>
    }

    renderExams(exams?: Exam[]) {
        if (!exams) return null;
        return <View style={styles.tabCard}>
            <View style={styles.flow}>
                {exams.map((exam: Exam, index: number) => {
                    return <ExamCard key={index} exam={exam} isExpanded={this.isExpanded(exam)}
                        onSelect={() => this.props.onNavigationChange('showExam', exam)}
                        onToggleExpand={() => this.toggleExpand(exam)} />
                })}
            </View>
            <View style={styles.hover}><Text style={styles.h2}>+</Text></View>
        </View>
    }

    render() {
        if (this.props.visit.exams === undefined || this.props.visit.exams.length === 0) {
            return <View>
                {this.renderExams(this.props.visit.preExams)}
                {this.renderStartButtons()}
            </View>
        }
        return <View>
            {this.renderExams(this.props.visit.preExams)}
            {this.renderExams(this.props.visit.exams)}
            <AssessmentCard />
            <PrescriptionCard patient={this.props.patient}
              prescription={this.props.visit.assessment.prescription}
              onUpdatePrescription={this.props.onUpdatePrescription} />
        </View>
    }
}

export class VisitHistory extends Component {
    props: {
        appointment: Appointment,
        onNavigationChange: (action: string, data: any) => void
    }
    state: {
        history?: Visit[],
        selectedVisit: Visit,
        todaysVisit: Visit
    }
    constructor(props: any) {
        super(props);
        const todaysVisit: Visit = {
            type: this.props.appointment.type,
            start: new Date(),
            location: this.props.appointment.location,
            patientId: this.props.appointment.patient.id,
            doctor: 'me',
            preExams: allPreExams(),
            exams: [],
            assessment: {prescription: {id: 3, od: {sphere: 1}, os: {sphere: 1}}}
        }
        this.state = {
            todaysVisit: todaysVisit,
            selectedVisit: todaysVisit
        }
    }

    showVisit(visit: Visit) {
        LayoutAnimation.easeInEaseOut();
        this.setState({ selectedVisit: visit });
    }

    startVisit(visitType: string) {
        let todaysVisit = this.state.todaysVisit;
        todaysVisit.exams = allExams(visitType);
        LayoutAnimation.easeInEaseOut();
        this.setState({ todaysVisit });
    }

    updatePrescription(prescription: GlassesRx) {
      let selectedVisit : Visit = this.state.selectedVisit;
      selectedVisit.assessment.prescription = prescription;
      //this.setState({selectedVisit});
    }

    render() {
        return <View>
            <View style={styles.tabHeader}>
                <ScrollView horizontal={true}>
                    <VisitButton visit={this.state.todaysVisit}
                        isSelected={this.state.selectedVisit === this.state.todaysVisit}
                        onPress={() => this.showVisit(this.state.todaysVisit)} />
                    {this.state.history && this.state.history.map((visit: Visit, index: number) => {
                        return <VisitButton isSelected={this.state.selectedVisit === visit}
                            key={index} visit={visit} onPress={() => this.showVisit(visit)} />
                    })}
                </ScrollView>
            </View>
            <VisitWorkFlow patient={this.props.appointment.patient}
                visit={this.state.selectedVisit}
                onNavigationChange={this.props.onNavigationChange}
                onUpdatePrescription={(prescription: GlassesRx) => this.updatePrescription(prescription)}
                onStartVisit={(visitType: string) => this.startVisit(visitType)} />
        </View>
    }

    componentDidMount() {
        const history = fetchVisitHistory();
        this.setState({ history });
    }
}

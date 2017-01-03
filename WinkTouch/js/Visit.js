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
import { Assessment, Prescription } from './Assessment';

export type Visit = {
    id?: number,
    type: string,
    start: Date,
    end?: Date,
    location: string,
    patientId: number,
    doctor: string,
    preExams?: Exam[],
    exams?: Exam[]
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
        exams: fetchExams()
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
        exams: fetchExams()
    };
    let visit3: Visit = {
        id: 1,
        type: 'New patient',
        start: new Date(2014, 9, 26, 10, 30),
        end: new Date(2014, 9, 2, 10, 50),
        location: 'the oval office',
        patientId: 2,
        preExams: allPreExams(),        
        doctor: 'Conrad Murray'
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
        preWorkflow: Exam[],
        workflow: Exam[],
        onNavigationChange: (action: string, data: any) => void,
        onStartVisit: (type: string) => void
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

    startVisit(type: string) {
        this.props.onStartVisit(type);
    }

    renderStartButtons() {
        return <View style={styles.tabCard}>
            <View style={styles.flow}>
                <Button title='Comprehensive exam' onPress={() => this.startVisit('comprehensive')} />
                <Button title='Follow up' onPress={() => this.startVisit('followUp')} />
                <Button title='Contacts Fitting' onPress={() => this.startVisit('fitting')} />
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
        if (this.props.workflow === undefined || this.props.workflow.length === 0) {
            return <View>
                {this.renderExams(this.props.preWorkflow)}
                {this.renderStartButtons()}
            </View>
        }
        return <View>
            {this.renderExams(this.props.preWorkflow)}
            {this.renderExams(this.props.workflow)}
            <Assessment />
            <Prescription patient={this.props.patient} />
        </View>
    }
}

export class VisitHistory extends Component {
    props: {
        appointment: Appointment,
        onNavigationChange: (action: string, data: any) => void
    }
    state: {
        selectedVisit: Visit,
        todaysVisit: Visit,
        history?: Visit[]
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
            exams: []
        }
        this.state = {
            todaysVisit: todaysVisit,
            selectedVisit: todaysVisit
        }
    }

    showVisit(visit: Visit) {
        this.setState({ selectedVisit: visit });
    }

    startVisit(visitType: string) {
        let todaysVisit = this.state.todaysVisit;
        todaysVisit.exams = allExams(visitType);
        this.setState({ todaysVisit });
    }

    render() {
        LayoutAnimation.easeInEaseOut();
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
                preWorkflow={this.state.selectedVisit.preExams}
                workflow={this.state.selectedVisit.exams}
                onNavigationChange={this.props.onNavigationChange}
                onStartVisit={(visitType: string) => this.startVisit(visitType)} />
        </View>
    }

    componentDidMount() {
        const history = fetchVisitHistory();
        this.setState({ history });
    }
}
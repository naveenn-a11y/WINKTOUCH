/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, TouchableHighlight, Text, TouchableOpacity, ScrollView, Button } from 'react-native';
import { styles, fontScale } from './Styles';
import { strings} from './Strings';
import type {Exam, Patient, GlassesRx, RefractionExam, Refractions, Visit} from './Types';
import { VisualAcuityTest } from './VisualAcuityTest';
import { CoverTestScreen, VisualFieldTestScreen } from './EntranceTest';
import { ComplaintScreen } from './Complaint';
import type {Complaint } from './Complaint';
import { ReviewOfSystemsScreen } from './ReviewOfSystems';
import { PatientMedicationsCard, PatientMedicalHistoryCard, PatientAllergiesCard, PatientFamilyHistoryCard, PatientSocialHistoryCard } from './Patient';
import { MedicationsScreen } from './Medication';
import { AllergiesScreen } from './Allergies';
import { SocialHistoryScreen } from './SocialHistory';
import { FamilyHistoryScreen } from './FamilyHistory';
import { MedicalHistoryScreen } from './MedicalHistory';
import { WearingRxScreen, RefractionScreen, GlassesSummary } from './Refraction';
import { GlaucomaScreen } from './Glaucoma';
import { SlitLampScreen } from './SlitLamp';
import { fetchRefractions} from './Refraction';

let id = 0;

function constructExam(patient: Patient, type: string, hasStarted?: boolean = false, hasEnded?: boolean = false): Exam {
  if (type==='wearingRx' || type==='refractionTest') {
    return {
      _id: 'Exam'+String(++id),
      type: type,
      visitId: 1,
      patient: patient,
      hasStarted: hasStarted,
      hasEnded: hasEnded,
      refractions: {
        previousRx: {
          od: {sphere: 0.5},
          os: {sphere: 0.25, add: 0.75}
        },
        wearingRx: {
          od: {sphere: 0.25},
          os: {sphere: 0.25, add: 0.75}
        },
        phoropter: {
          od: {sphere: 0.25},
          os: {sphere: 0.25, add: 0.75}
        },
        autoRefractor: {
          od: {sphere: 0.25},
          os: {sphere: 0.25, add: 0.75}
        },
        retinoscope: {
          od: {sphere: 0.25},
          os: {sphere: 0.25, add: 0.75}
        },
        cyclopegic: {
          od: {sphere: 0.25},
          os: {sphere: 0.25, add: 0.75}
        },
        finalRx: {
          od: {sphere: 0.25},
          os: {sphere: 0.25, add: 0.75}
        }
      }
    }
  }
  return {
    _id: 'Exam'+String(++id),
    type: type,
    patient: patient,
    visitId: 2,
    hasStarted: hasStarted,
    hasEnded: hasEnded
  }
}

export function allExamTypes(visitType: string) : string[] {
    return ['complaint', 'visualAcuityTest', 'visualFieldTest','coverTest', 'reviewOfSystems', 'refractionTest','glaucomaExam',  'slitLampExam'];
}

export function createExam(visit: Visit, examType: string) {
    return  constructExam(visit.patient, examType, false, false);
}

export function createExams(patient: Patient, visitType: string): Exam[] {
  if (visitType && visitType === 'followUp') {
    return [constructExam(patient, 'complaint', true, true), constructExam(patient, 'visualAcuityTest', true, true),
    constructExam(patient, 'refractionTest', true, true)]
  }
  if (visitType && visitType === 'fitting') {
    return [
      constructExam(patient, 'complaint', true, true), constructExam(patient, 'visualAcuityTest', true, true),
      constructExam(patient, 'refractionTest', true, true), constructExam(patient, 'slitLampExam', true),
    ]
  }
  return [
    constructExam(patient,'complaint', true, true), constructExam(patient,'visualAcuityTest', true, true),
    constructExam(patient,'visualFieldTest', true, true), constructExam(patient,'coverTest', true, true),
    constructExam(patient,'reviewOfSystems', true, true),
    constructExam(patient,'refractionTest', true, true),
  ]
}

export function allPreExams(patient: Patient): Exam[] {
  return [
    constructExam(patient,'wearingRx', false, false), constructExam(patient,'medications', true, false),
    constructExam(patient,'allergies', false, false), constructExam(patient,'medicalHistory', true, true),
    constructExam(patient,'familyHistory', true, false), constructExam(patient,'socialHistory', true)
  ]
}

export function fetchExams(patient: Patient): Exam[] {
  return [
    constructExam(patient,'complaint', true, true), constructExam(patient,'coverTest', true, true),
    constructExam(patient,'reviewOfSystems', true, true), constructExam(patient,'visualAcuityTest', true, false),
    constructExam(patient,'refractionTest'),  constructExam(patient,'visualFieldTest', true, true)
  ]
}

export class ExamCardSpecifics extends Component {
  props: {
    isExpanded: boolean,
    exam: Exam
  }
}

export class ExamCard extends Component {
  props: {
    exam: Exam,
    isExpanded: boolean,
    onSelect: () => void,
    onToggleExpand: () => void
  }
  constructor(props: any) {
    super(props);
  }

  renderExamCardSpecifics() {
    switch (this.props.exam.type) {
      case 'complaint':
        return <ComplaintCard isExpanded={this.props.isExpanded} />
      case 'visualAcuityTest':
        return <VisualAcuityTestCard isExpanded={this.props.isExpanded} />
      case 'coverTest':
        return <CoverTestCard isExpanded={this.props.isExpanded} />
      case 'reviewOfSystems':
        return <ReviewOfSystemsCard isExpanded={this.props.isExpanded} />
      case 'retinoscopyTest':
        return <RetinoscopyTestCard isExpanded={this.props.isExpanded} />
      case 'refractionTest':
        return <RefractionTestCard isExpanded={this.props.isExpanded} />
      case 'slitLampExam':
        return <SlitLampExamCard isExpanded={this.props.isExpanded} />
      case 'visualFieldTest':
        return <VisualFieldTestCard isExpanded={this.props.isExpanded} />
      case 'glaucomaExam':
        return <GlaucomaExamCard isExpanded={this.props.isExpanded} />
      case 'wearingRx':
        return <WearingRxCard isExpanded={this.props.isExpanded} exam={this.props.exam}/>
      case 'medications':
        return <PatientMedicationsCard isExpanded={this.props.isExpanded} />
      case 'medicalHistory':
        return <PatientMedicalHistoryCard isExpanded={this.props.isExpanded} />
      case 'allergies':
        return <PatientAllergiesCard isExpanded={this.props.isExpanded} />
      case 'familyHistory':
        return <PatientFamilyHistoryCard isExpanded={this.props.isExpanded} />
      case 'socialHistory':
        return <PatientSocialHistoryCard isExpanded={this.props.isExpanded} />
    }
    return null;
  }

  render() {
    let style: string = styles.todoExamCard;
    if (this.props.isExpanded) {
      style = styles.todoExamCardExpanded;
      if (this.props.exam.hasEnded) {
        style = styles.finishedExamCardExpanded;
      } else if (this.props.exam.hasStarted) {
        style = styles.startedExamCardExpanded;
      }
    } else {
      if (this.props.exam.hasEnded) {
        style = styles.finishedExamCard;
      } else if (this.props.exam.hasStarted) {
        style = styles.startedExamCard;
      }
    }
    return <TouchableOpacity
      onLongPress={() => this.props.onToggleExpand()}
      onPress={() => this.props.onSelect()}
      delayLongPress={300}>
      <View style={style}>
        {this.renderExamCardSpecifics()}
      </View>
    </TouchableOpacity>
  }
}

class WearingRxCard extends ExamCardSpecifics {
  props: {
    isExpanded: boolean,
    exam: RefractionExam
  }
  render() {
    if (!this.props.isExpanded)
      return <View>
        <GlassesSummary title={strings.wearingRx} glassesRx={this.props.exam.refractions.wearingRx} />
      </View>
    return <View>
      <Text style={styles.text}>{strings.wearingRx}</Text>
    </View>
  }
}

class ComplaintCard extends ExamCardSpecifics {
  render() {
    if (!this.props.isExpanded)
      return <Text style={styles.text}>Blurred{'\n'}Vision</Text>
    return <View>
      <Text style={styles.text}>Blurry vision in both eyes.</Text>
    </View>
  }
}

class VisualAcuityTestCard extends ExamCardSpecifics {
  render() {
    if (!this.props.isExpanded)
      return <View>
        <Text style={styles.text}>DscOD 20/40</Text>
        <Text style={styles.text}>DscSD 20/35</Text>
        <Text style={styles.text}>NscOD 20/25</Text>
        <Text style={styles.text}>NscSD 20/20</Text>
      </View>
    return <View>
      <Text style={styles.text}>DscOD 20/40 DccOD 20/20</Text>
      <Text style={styles.text}>DscOS 20/35 DccOS 20/20</Text>
      <Text style={styles.text}>NscOD 20/25 NccOD 20/20</Text>
      <Text style={styles.text}>NscOS 20/20 NccOS 20/20</Text>
    </View>
  }
}

class CoverTestCard extends ExamCardSpecifics {
  render() {
    return <Text style={styles.text}>{strings.coverTest}</Text>
  }
}

class ReviewOfSystemsCard extends ExamCardSpecifics {
  render() {
    return <Text style={styles.text}>{strings.reviewOfSystems}</Text>
  }
}

class RetinoscopyTestCard extends ExamCardSpecifics {
  render() {
    return <Text style={styles.text}>{strings.retinoscopyTest}</Text>
  }
}

class RefractionTestCard extends ExamCardSpecifics {
  render() {
    return <Text style={styles.text}>{strings.refractionTest}</Text>
  }
}

class SlitLampExamCard extends ExamCardSpecifics {
  render() {
    return <Text style={styles.text}>{strings.slitLampExam}</Text>
  }
}

class VisualFieldTestCard extends ExamCardSpecifics {
  render() {
    return <Text style={styles.text}>{strings.visualFieldTest}</Text>
  }
}

class GlaucomaExamCard extends ExamCardSpecifics {
  render() {
    return <Text style={styles.text}>{strings.glaucomaExam}</Text>
  }
}


export class ExamScreen extends Component {
  props: {
    exam: Exam,
    onNavigationChange: (action: string, data: any) => void,
    onUpdateExam: (exam: Exam) => void
  }
  state: {
    exam: Exam
  }

  constructor(props: any) {
    super(props);
    this.state = {
      exam: this.props.exam
    }
  }

  updateExam = (exam: Exam) : void => {
    this.setState({exam});
    this.props.onUpdateExam(exam);
  }

  renderExam() {
    switch (this.props.exam.type) {
      case 'complaint':
        return <ComplaintScreen exam={this.state.exam} />;
      case 'visualAcuityTest':
        return <VisualAcuityTest exam={this.state.exam} />;
      case 'coverTest':
        return <CoverTestScreen exam={this.state.exam} />
      case 'reviewOfSystems':
        return <ReviewOfSystemsScreen exam={this.state.exam} />
      case 'wearingRx':
        return <WearingRxScreen exam={this.state.exam} onUpdateExam={this.updateExam} />
      case 'refractionTest':
        return <RefractionScreen exam={this.state.exam} onUpdateExam={this.updateExam} />
      case 'slitLampExam':
        return <SlitLampScreen exam={this.state.exam} />
      case 'visualFieldTest':
        return <VisualFieldTestScreen exam={this.state.exam} />
      case 'glaucomaExam':
        return <GlaucomaScreen exam={this.state.exam} />
      case 'medications':
        return <MedicationsScreen exam={this.state.exam} onNavigationChange={this.props.onNavigationChange} />
      case 'allergies':
        return <AllergiesScreen exam={this.state.exam} />
      case 'socialHistory':
        return <SocialHistoryScreen exam={this.state.exam} />
      case 'familyHistory':
        return <FamilyHistoryScreen exam={this.state.exam} />
      case 'medicalHistory':
        return <MedicalHistoryScreen exam={this.state.exam} />
    }
    return <Text style={styles.screenTitle}>{this.props.exam.type}</Text>
  }


  render() {
    return <View style={styles.centeredScreenLayout}>
      <View style={styles.centeredColumnLayout}>
        {this.renderExam()}
      </View>
    </View >
  }
}

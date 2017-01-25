/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, TouchableHighlight, Text, TouchableOpacity, ScrollView, Button } from 'react-native';
import { styles, fontScale } from './Styles';
import type {Exam, Patient, GlassesRx, RefractionExam, Refractions} from './Types';
import { VisualAcuityTest } from './VisualAcuityTest';
import { CoverTestScreen, VisualFieldTestScreen } from './EntranceTest';
import { ComplaintScreen } from './Complaint';
import type {Complaint } from './Complaint';
import { ReviewOfSystemsScreen } from './ReviewOfSystems';
import { PatientMedicationsCard, PatientMedicalHistoryCard, PatientAllergiesCard, PatientFamilyHistoryCard, PatientSocialHistoryCard } from './Patient';
import { MedicationsScreen } from './Medications';
import { AllergiesScreen } from './Allergies';
import { SocialHistoryScreen } from './SocialHistory';
import { FamilyHistoryScreen } from './FamilyHistory';
import { MedicalHistoryScreen } from './MedicalHistory';
import { WearingRxScreen, RefractionScreen, GlassesSummary } from './Refraction';
import { GlaucomaScreen } from './Glaucoma';
import { SlitLampScreen } from './SlitLamp';
import { fetchRefractions} from './Refraction';

function constructExam(patient: Patient, type: string, hasStarted?: boolean = false, hasEnded?: boolean = false): Exam {
  if (type==='WearingRx' || type==='RefractionTest') {
    return {
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
    type: type,
    patient: patient,
    visitId: 2,
    hasStarted: hasStarted,
    hasEnded: hasEnded
  }
}

export function allExams(patient: Patient, visitType: string): Exam[] {
  if (visitType && visitType === 'followUp') {
    return [constructExam(patient, 'Complaint', true, true), constructExam(patient, 'VisualAcuityTest', true, true),
    constructExam(patient, 'RefractionTest', true, true)]
  }
  if (visitType && visitType === 'fitting') {
    return [
      constructExam(patient, 'Complaint', true, true), constructExam(patient, 'VisualAcuityTest', true, true),
      constructExam(patient, 'RefractionTest', true, true), constructExam(patient, 'SlitLampExam', true),
    ]
  }
  return [
    constructExam(patient,'Complaint', true, true), constructExam(patient,'VisualAcuityTest', true, true),
    constructExam(patient,'VisualFieldTest', true, true), constructExam(patient,'CoverTest', true, true),
    constructExam(patient,'ReviewOfSystems', true, true),
    constructExam(patient,'RefractionTest', true, true), constructExam(patient,'GlaucomaExam', true),
    constructExam(patient,'SlitLampExam', true),
  ]
}

export function allPreExams(patient: Patient): Exam[] {
  return [
    constructExam(patient,'WearingRx', true, true), constructExam(patient,'Medications', true, true),
    constructExam(patient,'Allergies', true, true), constructExam(patient,'MedicalHistory', true, true),
    constructExam(patient,'FamilyHistory', true, true), constructExam(patient,'SocialHistory', true)
  ]
}

export function fetchExams(patient: Patient): Exam[] {
  return [
    constructExam(patient,'Complaint', true, true), constructExam(patient,'CoverTest', true, true), constructExam(patient,'ReviewOfSystems', true, true),
    constructExam(patient,'VisualAcuityTest', true, false), constructExam(patient,'AutorefractorTest'),
    constructExam(patient,'VisualFieldTest', true, true)
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
      case 'Complaint':
        return <ComplaintCard isExpanded={this.props.isExpanded} />
      case 'VisualAcuityTest':
        return <VisualAcuityTestCard isExpanded={this.props.isExpanded} />
      case 'CoverTest':
        return <CoverTestCard isExpanded={this.props.isExpanded} />
      case 'ReviewOfSystems':
        return <ReviewOfSystemsCard isExpanded={this.props.isExpanded} />
      case 'RetinoscopyTest':
        return <RetinoscopyTestCard isExpanded={this.props.isExpanded} />
      case 'RefractionTest':
        return <RefractionTestCard isExpanded={this.props.isExpanded} />
      case 'SlitLampExam':
        return <SlitLampExamCard isExpanded={this.props.isExpanded} />
      case 'VisualFieldTest':
        return <VisualFieldTestCard isExpanded={this.props.isExpanded} />
      case 'GlaucomaExam':
        return <GlaucomaExamCard isExpanded={this.props.isExpanded} />
      case 'WearingRx':
        return <WearingRxCard isExpanded={this.props.isExpanded} exam={this.props.exam}/>
      case 'Medications':
        return <PatientMedicationsCard isExpanded={this.props.isExpanded} />
      case 'MedicalHistory':
        return <PatientMedicalHistoryCard isExpanded={this.props.isExpanded} />
      case 'Allergies':
        return <PatientAllergiesCard isExpanded={this.props.isExpanded} />
      case 'FamilyHistory':
        return <PatientFamilyHistoryCard isExpanded={this.props.isExpanded} />
      case 'SocialHistory':
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
        <GlassesSummary title="Wearing Rx" glassesRx={this.props.exam.refractions.wearingRx} />
      </View>
    return <View>
      <Text style={styles.text}>Wearing Rx</Text>
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
    return <Text style={styles.text}>Cover</Text>
  }
}

class ReviewOfSystemsCard extends ExamCardSpecifics {
  render() {
    return <Text style={styles.text}>ROS</Text>
  }
}

class RetinoscopyTestCard extends ExamCardSpecifics {
  render() {
    return <Text style={styles.text}>Retinoscopy</Text>
  }
}

class RefractionTestCard extends ExamCardSpecifics {
  render() {
    return <Text style={styles.text}>Refraction</Text>
  }
}

class SlitLampExamCard extends ExamCardSpecifics {
  render() {
    return <Text style={styles.text}>Slit Lamp</Text>
  }
}

class PupilDilationExamCard extends ExamCardSpecifics {
  render() {
    return <Text style={styles.text}>Pupil Dilation</Text>
  }
}

class VisualFieldTestCard extends ExamCardSpecifics {
  render() {
    return <Text style={styles.text}>Visual Field</Text>
  }
}

class GlaucomaExamCard extends ExamCardSpecifics {
  render() {
    return <Text style={styles.text}>Glaucoma</Text>
  }
}


export class ExamScreen extends Component {
  props: {
    exam: Exam,
    onNavigationChange: (action: string, data: any) => void,
    onUpdateExam: (exam: Exam) => void
  }

  constructor(props: any) {
    super(props);
  }

  renderExam() {
    switch (this.props.exam.type) {
      case 'Complaint':
        return <ComplaintScreen exam={this.props.exam} />;
      case 'VisualAcuityTest':
        return <VisualAcuityTest exam={this.props.exam} />;
      case 'CoverTest':
        return <CoverTestScreen exam={this.props.exam} />
      case 'ReviewOfSystems':
        return <ReviewOfSystemsScreen exam={this.props.exam} />
      case 'WearingRx':
        return <WearingRxScreen exam={this.props.exam} onUpdateExam={this.props.onUpdateExam} />
      case 'RefractionTest':
        return <RefractionScreen exam={this.props.exam} onUpdateExam={this.props.onUpdateExam} />
      case 'SlitLampExam':
        return <SlitLampScreen exam={this.props.exam} />
      case 'VisualFieldTest':
        return <VisualFieldTestScreen exam={this.props.exam} />
      case 'GlaucomaExam':
        return <GlaucomaScreen exam={this.props.exam} />
      case 'Medications':
        return <MedicationsScreen exam={this.props.exam} />
      case 'Allergies':
        return <AllergiesScreen exam={this.props.exam} />
      case 'SocialHistory':
        return <SocialHistoryScreen exam={this.props.exam} />
      case 'FamilyHistory':
        return <FamilyHistoryScreen exam={this.props.exam} />
      case 'MedicalHistory':
        return <MedicalHistoryScreen exam={this.props.exam} />
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

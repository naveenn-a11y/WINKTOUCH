/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, TouchableHighlight, Text, TouchableOpacity, ScrollView, Button } from 'react-native';
import { styles, fontScale } from './Styles';
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
import { WearingRxScreen, RefractionScreen } from './Refraction';
import { GlaucomaScreen } from './Glaucoma';
import { SlitLampScreen } from './SlitLamp';

export type Exam = {
  id?: number,
  type: string,
  hasStarted: boolean,
  hasEnded: boolean,
};

function constructExam(type: string, hasStarted?: boolean = false, hasEnded?: boolean = false): Exam {
  return {
    type: type,
    hasStarted: hasStarted,
    hasEnded: hasEnded
  }
}

export function allExams(visitType: string): Exam[] {
  if (visitType && visitType === 'followUp') {
    return [constructExam('Complaint', true, true), constructExam('VisualAcuityTest', true, true),
    constructExam('RefractionTest', true, true)]
  }
  if (visitType && visitType === 'fitting') {
    return [
      constructExam('Complaint', true, true), constructExam('VisualAcuityTest', true, true),
      constructExam('RefractionTest', true, true), constructExam('SlitLampExam', true),
    ]
  }
  return [
    constructExam('Complaint', true, true), constructExam('VisualAcuityTest', true, true),
    constructExam('VisualFieldTest', true, true), constructExam('CoverTest', true, true),
    constructExam('ReviewOfSystems', true, true),
    constructExam('RefractionTest', true, true), constructExam('GlaucomaExam', true),
    constructExam('SlitLampExam', true),
  ]
}

export function allPreExams(): Exam[] {
  return [
    constructExam('WearingRx', true, true), constructExam('Medications', true, true),
    constructExam('Allergies', true, true), constructExam('MedicalHistory', true, true),
    constructExam('FamilyHistory', true, true), constructExam('SocialHistory', true)
  ]
}

export function fetchExams(): Exam[] {
  return [
    constructExam('Complaint', true, true), constructExam('CoverTest', true, true), constructExam('ReviewOfSystems', true, true),
    constructExam('VisualAcuityTest', true, false), constructExam('AutorefractorTest'),
    constructExam('VisualFieldTest', true, true)
  ]
}

export class ExamCardSpecifics extends Component {
  props: {
    isExpanded: boolean
  }
}

function newExamCardSpecifics(examType: string, isExpanded: boolean) {
  switch (examType) {
    case 'Complaint':
      return <ComplaintCard isExpanded={isExpanded} />
    case 'VisualAcuityTest':
      return <VisualAcuityTestCard isExpanded={isExpanded} />
    case 'CoverTest':
      return <CoverTestCard isExpanded={isExpanded} />
    case 'ReviewOfSystems':
      return <ReviewOfSystemsCard isExpanded={isExpanded} />
    case 'RetinoscopyTest':
      return <RetinoscopyTestCard isExpanded={isExpanded} />
    case 'RefractionTest':
      return <RefractionTestCard isExpanded={isExpanded} />
    case 'SlitLampExam':
      return <SlitLampExamCard isExpanded={isExpanded} />
    case 'VisualFieldTest':
      return <VisualFieldTestCard isExpanded={isExpanded} />
    case 'GlaucomaExam':
      return <GlaucomaExamCard isExpanded={isExpanded} />
    case 'WearingRx':
      return <WearingRxCard isExpanded={isExpanded} />
    case 'Medications':
      return <PatientMedicationsCard isExpanded={isExpanded} />
    case 'MedicalHistory':
      return <PatientMedicalHistoryCard isExpanded={isExpanded} />
    case 'Allergies':
      return <PatientAllergiesCard isExpanded={isExpanded} />
    case 'FamilyHistory':
      return <PatientFamilyHistoryCard isExpanded={isExpanded} />
    case 'SocialHistory':
      return <PatientSocialHistoryCard isExpanded={isExpanded} />
  }
  return null;
}

function newExamScreenSpecifics(examType: string, exam: Exam) {
  switch (examType) {
    case 'Complaint':
      return <ComplaintScreen exam={exam} />;
    case 'VisualAcuityTest':
      return <VisualAcuityTest exam={exam} />;
    case 'CoverTest':
      return <CoverTestScreen exam={exam} />
    case 'ReviewOfSystems':
      return <ReviewOfSystemsScreen exam={exam} />
    case 'WearingRx':
      return <WearingRxScreen exam={exam} />
    case 'RefractionTest':
      return <RefractionScreen exam={exam} />
    case 'SlitLampExam':
      return <SlitLampScreen exam={exam} />
    case 'VisualFieldTest':
      return <VisualFieldTestScreen exam={exam} />
    case 'GlaucomaExam':
      return <GlaucomaScreen exam={exam} />
    case 'Medications':
      return <MedicationsScreen />
    case 'Allergies':
      return <AllergiesScreen />
    case 'SocialHistory':
      return <SocialHistoryScreen />
    case 'FamilyHistory':
      return <FamilyHistoryScreen />
    case 'MedicalHistory':
      return <MedicalHistoryScreen />
  }
  return <Text style={styles.screenTitle}>{examType}</Text>
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

  render() {
    const specificCard = newExamCardSpecifics(this.props.exam.type, this.props.isExpanded);
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
        {specificCard}
      </View>
    </TouchableOpacity>
  }
}

export class GlassesRx extends Component {
  props: {
    hidden?: boolean
  }
  render() {
    if (this.props.hidden)
      return null;
    return <View style={styles.centeredColumnLayout}>
      <Text style={styles.text}>   Sphere  Cyl  Axis   Add  Prism</Text>
      <Text style={styles.text}>OD    -2.5    DS  173  +.50  1/2 BU</Text>
      <Text style={styles.text}>OS    -2.5    DS  173  +.50             </Text>
    </View>
  }
}

export class ContactsRx extends Component {
  props: {
    hidden?: boolean
  }
  render() {
    if (this.props.hidden)
      return null;
    return <View style={styles.centeredColumnLayout}>
      <Text style={styles.text}>   PWR   BC  DIA  CYL   AXIS ADD</Text>
      <Text style={styles.text}>OD -2.75 8.7 14.0 -2.25 160  +1.75</Text>
      <Text style={styles.text}>OS -2.75 8.7 14.0 -2.25 160  +1.75</Text>
    </View>
  }
}

class WearingRxCard extends ExamCardSpecifics {
  render() {
    if (!this.props.isExpanded)
      return <Text style={styles.text}>Wearing Rx</Text>
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
      <Text style={styles.text}>DscSD 20/35 DccSD 20/20</Text>
      <Text style={styles.text}>NscOD 20/25 NccOD 20/20</Text>
      <Text style={styles.text}>NscSD 20/20 NccSD 20/20</Text>
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
    onNavigationChange: (action: string, data: any) => void
  }
  constructor(props: any) {
    super(props);
  }

  render() {
    let specificExam = newExamScreenSpecifics(this.props.exam.type, this.props.exam);
    return <View style={styles.centeredScreenLayout}>
      <View style={styles.centeredColumnLayout}>
        {specificExam}
      </View>
      {/**<View>
        <Text>H</Text>
        <Text>i</Text>
        <Text>s</Text>
        <Text>t</Text>
        <Text>o</Text>
        <Text>r</Text>
        <Text>y</Text>        
      </View>
      */}
    </View >
  }
}

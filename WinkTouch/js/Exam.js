/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, TouchableHighlight, Text, TouchableOpacity, ScrollView, Button } from 'react-native';
import { styles, fontScale } from './Styles';
import { strings} from './Strings';
import type {Exam, Patient, GlassesRx, RefractionTest, Visit, Complaint} from './Types';
import { VisualAcuityTest } from './VisualAcuityTest';
import { CoverTestScreen, VisualFieldTestScreen } from './EntranceTest';
import { ComplaintScreen, ComplaintCard } from './Complaint';
import { ReviewOfSystemsScreen, ReviewOfSystemsCard } from './ReviewOfSystems';
import { MedicationsScreen, MedicationsCard } from './Medications';
import { AllergiesScreen, AllegiesCard } from './Allergies';
import { SocialHistoryScreen, SocialHistoryCard } from './SocialHistory';
import { FamilyHistoryScreen, FamilyHistoryCard } from './FamilyHistory';
import { MedicalHistoryScreen, MedicalHistoryCard } from './MedicalHistory';
import { WearingRxScreen, RefractionScreen, GlassesSummary, WearingRxCard, RefractionTestCard } from './Refraction';
import { GlaucomaScreen } from './Glaucoma';
import { SlitLampScreen } from './SlitLamp';
import { fetchDocument, storeDocument, getRevision } from './CouchDb';

export async function fetchExam(examId: string) : Exam {
  const exam: Exam = await fetchDocument(examId);
  return exam;
}

async function createExam(exam: Exam) : Exam {
  exam.dataType = 'Exam';
  exam = await storeDocument(exam);
  return exam;
}

function newExam(type: string) {
  let exam : Exam = {type, hasStarted: false, hasEnded: false, [type]: []};
  if (type === 'socialHistory' || type === 'wearingRx' || type === 'reviewOfSystems' || type === 'refractionTest') {
    exam[type] = {}
  }
  return exam;
}

export async function createPreExams(visit: Visit): Visit {
  try {
    if (!visit || !visit._id) return [];
    if (visit.preExamIds && visit.preExamIds.length>0) {
      throw new Error('I can not start the pre examination twice.');
    }
    if (!visit.preExamIds) visit.preExamIds = [];
    let examTypes: string[] = allPreExamTypes(visit.type);
    let exams = examTypes.map((type: string) => newExam(type));
    //TODO: bulk insert
    for (let i=0; i<exams.length;i++) {
      let exam: Exam = await createExam(exams[i]);
      visit.preExamIds.push(exam._id);
    }
    visit = await storeDocument(visit);
    return visit;
  } catch (error) {
    console.log(error);
    alert(error);
  }
}

export async function createExams(visit: Visit, examTypes?: string[]): Visit {
  try {
    if (!visit.examIds) visit.examIds = [];
    if (!examTypes) examTypes = allExamTypes(visit.type);
    let exams = examTypes.map((type: string) => newExam(type));
    //TODO: bulk insert
    for (let i=0; i<exams.length;i++) {
      let exam: Exam = await createExam(exams[i]);
      visit.examIds.push(exam._id);
    }
    visit = await storeDocument(visit);
    return visit;
  } catch (error) {
    console.log(error);
    alert(error);
  }
}


export function allExamTypes(visitType?: string) : string[] {
    if (!visitType)
      return ['complaints', 'visualAcuityTest', 'visualFieldTest','coverTest', 'reviewOfSystems', 'refractionTest','glaucomaExam',  'slitLampExam'];
    return ['complaints', 'visualAcuityTest', 'visualFieldTest','coverTest', 'reviewOfSystems', 'refractionTest'];
}

export function allPreExamTypes(visitType: string) : string[] {
    return ['wearingRx', 'medications',  'allergies', 'medicalProcedures',  'familyHistory', 'socialHistory'];
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

  renderExamCardSpecifics() {
    switch (this.props.exam.type) {
      case 'complaints':
        return <ComplaintCard isExpanded={this.props.isExpanded} exam={this.props.exam}/>
      case 'visualAcuityTest':
        return <VisualAcuityTestCard isExpanded={this.props.isExpanded} exam={this.props.exam}/>
      case 'coverTest':
        return <CoverTestCard isExpanded={this.props.isExpanded} exam={this.props.exam}/>
      case 'reviewOfSystems':
        return <ReviewOfSystemsCard isExpanded={this.props.isExpanded} exam={this.props.exam}/>
      case 'retinoscopyTest':
        return <RetinoscopyTestCard isExpanded={this.props.isExpanded} exam={this.props.exam}/>
      case 'refractionTest':
        return <RefractionTestCard isExpanded={this.props.isExpanded} exam={this.props.exam}/>
      case 'slitLampExam':
        return <SlitLampExamCard isExpanded={this.props.isExpanded} exam={this.props.exam}/>
      case 'visualFieldTest':
        return <VisualFieldTestCard isExpanded={this.props.isExpanded} exam={this.props.exam}/>
      case 'glaucomaExam':
        return <GlaucomaExamCard isExpanded={this.props.isExpanded} exam={this.props.exam}/>
      case 'wearingRx':
        return <WearingRxCard isExpanded={this.props.isExpanded} exam={this.props.exam}/>
      case 'medications':
        return <MedicationsCard isExpanded={this.props.isExpanded} exam={this.props.exam}/>
      case 'medicalProcedures':
        return <MedicalHistoryCard isExpanded={this.props.isExpanded} exam={this.props.exam}/>
      case 'allergies':
        return <AllegiesCard isExpanded={this.props.isExpanded} exam={this.props.exam}/>
      case 'familyHistory':
        return <FamilyHistoryCard isExpanded={this.props.isExpanded} exam={this.props.exam}/>
      case 'socialHistory':
        return <SocialHistoryCard isExpanded={this.props.isExpanded} exam={this.props.exam}/>
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

class RetinoscopyTestCard extends ExamCardSpecifics {
  render() {
    return <Text style={styles.text}>{strings.retinoscopyTest}</Text>
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
  unmounted: boolean

  constructor(props: any) {
    super(props);
    this.props.exam.hasStarted = true;
    this.state = {
      exam: this.props.exam
    }
    this.refreshExam();
  }

  async refreshExam() {
    let latestRevision :string = await getRevision(this.state.exam._id);
    const upToDate : boolean = this.props.exam._rev === latestRevision;
    if (!upToDate) {
      const exam: Exam = await fetchExam(this.props.exam._id);
      exam.hasStarted = true;
      this.setState({exam});
    }
  }

  async storeExam(exam: Exam) {
    try {
      exam = await storeDocument(exam);
      this.props.onUpdateExam(exam);
      if (!this.unmounted)
        this.setState({exam});
    } catch (error) {
      alert(error);
      if (this.unmounted) {
        this.props.onNavigationChange('showExam', this.props.exam);
      } else {
        this.refreshExam();
      }
    }
  }

  updateExam = (exam: Exam) : void => {
    this.storeExam(exam);
  }

  componentWillUnmount() {
    this.unmounted = true;
  }


  renderExam() {
    switch (this.props.exam.type) {
      case 'complaints':
        return <ComplaintScreen exam={this.state.exam} onUpdateExam={this.updateExam} />
      case 'visualAcuityTest':
        return <VisualAcuityTest exam={this.state.exam} onUpdateExam={this.updateExam} />
      case 'coverTest':
        return <CoverTestScreen exam={this.state.exam} onUpdateExam={this.updateExam}  />
      case 'reviewOfSystems':
        return <ReviewOfSystemsScreen exam={this.state.exam} onUpdateExam={this.updateExam} />
      case 'wearingRx':
        return <WearingRxScreen exam={this.state.exam} onUpdateExam={this.updateExam} />
      case 'refractionTest':
        return <RefractionScreen exam={this.state.exam} onUpdateExam={this.updateExam} />
      case 'slitLampExam':
        return <SlitLampScreen exam={this.state.exam} onUpdateExam={this.updateExam} />
      case 'visualFieldTest':
        return <VisualFieldTestScreen exam={this.state.exam} onUpdateExam={this.updateExam} />
      case 'glaucomaExam':
        return <GlaucomaScreen exam={this.state.exam} onUpdateExam={this.updateExam} />
      case 'medications':
        return <MedicationsScreen exam={this.state.exam} onUpdateExam={this.updateExam} />
      case 'allergies':
        return <AllergiesScreen exam={this.state.exam} onUpdateExam={this.updateExam} />
      case 'socialHistory':
        return <SocialHistoryScreen exam={this.state.exam} onUpdateExam={this.updateExam} />
      case 'familyHistory':
        return <FamilyHistoryScreen exam={this.state.exam} onUpdateExam={this.updateExam} />
      case 'medicalProcedures':
        return <MedicalHistoryScreen exam={this.state.exam} onUpdateExam={this.updateExam} />
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

/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView, LayoutAnimation, TouchableHighlight } from 'react-native';
import { styles, fontScale } from './Styles';
import { Button, TilesField, SelectionList, ItemsEditor } from './Widgets';
import type {ItemDefinition, MedicalHistory, MedicalProcedure } from './Types';
import { createExamItem, fetchExamItems, newExamItems, ExamItemsCard} from './ExamItem';
import { restUrl, storeDocument } from './CouchDb';

export async function fetchMedicalHistory(examId: string) : MedicalHistory {
  let medicalHistory : MedicalHistory = await fetchExamItems(examId, 'MedicalHistory');
  return medicalHistory;
}

export async function storeMedicalHistory(medicalHistory: MedicalHistory) :MedicalHistory {
  return await storeDocument(medicalHistory);
}

const medicalProcedureDefinition: ItemDefinition = {
  procedure: {
    label: 'Procedure',
    options: ['laser eye surgery', 'Cataract surgery', 'Glaucoma surgery',
      'Canaloplasty', 'Refractive surgery', 'Corneal surgery', 'Vitreo-retinal surgery',
      'Eye muscle surgery', 'Oculoplastic surgery', 'Eyelid surgery', 'Orbital surgery'
      , 'Eye removal'],
    required: true
  },
  date: {
    label: 'Date of procedure',
    options: ['TODO']
  },
  route: {
    label: 'Route',
    options: ['OD','OS','OU']
  }
};

export class MedicalHistoryCard extends Component {
  props: {
    isExpanded: boolean,
    exam: Exam
  }

  render() {
    return <ExamItemsCard  itemType='medicalProcedures' itemProperties={['route','procedure']}{...this.props}/>
  }
}

export class MedicalHistoryScreen extends Component {
  props: {
    exam: Exam,
    onNavigationChange: (action: string, data: any) => void,
    onUpdateExam: (exam: Exam) => void
  }
  state: {
    medicalHistory: MedicalHistory
  }
  unmounted: boolean

  constructor(props: any) {
    super(props);
    this.unmounted = false;
    let medicalHistory: MedicalHistory = this.props.exam.medicalHistory;
    if (medicalHistory===undefined) medicalHistory = this.newMedicalHistory();
    this.state = {medicalHistory};
    this.refreshMedicalHistory();
  }

  async refreshMedicalHistory() {
      let exam : Exam = this.props.exam;
      let medicalHistory: MedicalHistory = await fetchMedicalHistory(exam._id);
      if (medicalHistory===undefined) {
        medicalHistory = await createExamItem('MedicalHistory', this.newMedicalHistory())
      }
      this.setState({medicalHistory});
      exam.medicalProcedures = medicalHistory;
      this.props.onUpdateExam(exam);
  }

  async storeMedicalHistory() {
    try {
      let medicalHistory = await storeDocument(this.state.medicalHistory);
      if (!this.unmounted)
        this.setState({medicalHistory});
    } catch (error) {
      alert(error);
      if (this.unmounted) {
        this.props.onNavigationChange('showExam', this.props.exam);
      } else {
        this.refreshMedicalHistory();
      }
    }
  }

  newMedicalHistory = ()  => {
    const newMedicalHistory : MedicalHistory = newExamItems(this.props.exam._id, 'MedicalHistory');
    newMedicalHistory.medicalProcedures = [];
    return newMedicalHistory;
  }

  newMedicalProcedure(): MedicalProcedure {
    return {
      procedure: '',
      date: new Date(),
      route: ''
    };
  }

  isMedicalProcedureEmpty = (medicalProcedure: MedicalProcedure)  => {
    if (medicalProcedure === undefined || medicalProcedure===null) return true;
    if (medicalProcedure.procedure === undefined || medicalProcedure.procedure==null || medicalProcedure.procedure.trim()==='') return true;
    return false;
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  render() {
    return <ItemsEditor
      items={this.state.medicalHistory.medicalProcedures}
      newItem={this.newMedicalProcedure}
      isEmpty={this.isMedicalProcedureEmpty}
      itemDefinition={medicalProcedureDefinition}
      onUpdate = {() => this.storeMedicalHistory()}
      />
  }
}

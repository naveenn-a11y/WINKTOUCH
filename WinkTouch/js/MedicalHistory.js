/**
 * @flow
 */
'use strict';

import type {Exam, ItemDefinition, MedicalProcedure } from './Types';
import React, { Component } from 'react';
import { ItemsEditor} from './Widgets';
import { ExamItemsCard } from './ExamItem';

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
    return <ExamItemsCard  itemType='medicalProcedures' itemProperties={['route','procedure']} {...this.props}/>
  }
}

export class MedicalHistoryScreen extends Component {
  props: {
    exam: Exam,
    onUpdateExam: (exam: Exam) => void
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

  render() {
    return <ItemsEditor
      items={this.props.exam.medicalProcedures}
      newItem={this.newMedicalProcedure}
      isEmpty={this.isMedicalProcedureEmpty}
      itemDefinition={medicalProcedureDefinition}
      onUpdate = {() => this.props.onUpdateExam(this.props.exam)}
      />
  }
}

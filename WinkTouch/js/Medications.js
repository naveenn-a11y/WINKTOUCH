/**
 * @flow
 */
'use strict';

import type {Exam, ItemDefinition, Medication } from './Types';
import React, { Component } from 'react';
import { ItemsEditor} from './Widgets';
import { ExamItemsCard } from './ExamItem';

const medicationDefinition: ItemDefinition = {
  label: {
    label: 'Label',
    options: ['Xalatan', 'Abilify', 'Roxicodone', 'Calcarb'],
    required: true
  },
  strength: {
    label: 'Strength',
    options: ['10 mg', '20 mg', '30 mg', '50 mg', '100 mg', '200 mg']
  },
  dosage: {
    label: 'Dosage',
    options: ['1 drop','2 drops','3 drops','1 capsule','2 capsules','1 tablet','2 tablets','1 tablespoon']
  },
  frequency: {
    label: 'Frequency',
    options: ['1 x Daily', '2 x Daily', '3 x Daily', '4 x Daily', '5 x Daily', '8 x Daily', 'Q15M', 'Q30M', 'Q1H', 'Q2H', 'Q3H', 'Q4H', 'Every other day', 'in AM', 'Nightly', 'Once a month']
  },
  duration: {
    label: 'Duration',
    options: ['1 day', '2 days', '3 days', '4 days', '1 week', '2 weeks', '1 month', '2 months', '1 year']
  },
  route: {
    label: 'Route',
    options: ['OD', 'OS', 'OU']
  },
  instructions: {
    label: 'Instructions',
    options: ['Shake well before using', 'Take with food', 'Avoid taking with diary'],
    multiValue: true
  }
};

export class MedicationsCard extends Component {
  props: {
    isExpanded: boolean,
    exam: Exam
  }

  render() {
    return <ExamItemsCard  itemType='medications' itemProperties={['route','label','strength']}{...this.props}/>
  }
}

export class MedicationsScreen extends Component {
  props: {
    exam: Exam,
    onUpdateExam: (exam: Exam) => void
  }

  newMedication = ()  => {
    let medication : Medication = {
      label: '',
      rxDate: new Date(),
      strength: '',
      dosage: '',
      route: '',
      frequency: '',
      duration: '',
      instructions: []
    };
    return medication;
  }

  isMedicationEmpty = (medication: Medication)  => {
    if (medication === undefined || medication===null) return true;
    if (medication.label === undefined || medication.label==null || medication.label.trim()==='') return true;
    return false;
  }

  render() {
    return <ItemsEditor
      items={this.props.exam.medications}
      newItem={this.newMedication}
      isEmpty={this.isMedicationEmpty}
      itemDefinition={medicationDefinition}
      onUpdate = {() => this.props.onUpdateExam(this.props.exam)}
      />
  }
}

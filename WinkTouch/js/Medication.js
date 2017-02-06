/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView, LayoutAnimation, TouchableHighlight } from 'react-native';
import { styles, fontScale } from './Styles';
import { Button, TilesField, SelectionList, ItemsEditor } from './Widgets';
import type {Exam, ItemDefinition, Medication } from './Types';
import { FormRow, FormTextInput } from './Form';
import { createExamItem, fetchExamItems, newExamItems} from './ExamItem';
import { restUrl, storeDocument } from './CouchDb';

export async function fetchMedications(examId: string) : Medications {
  let medications : Medications = await fetchExamItems(examId, 'Medications');
  return medications;
}

export async function storeMedications(medications: Medications) :Medications {
  return await storeDocument(medications);
}

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

export class MedicationsScreen extends Component {
  props: {
    exam: Exam,
    onNavigationChange: (action: string, data: any) => void,
  }
  state: {
    medications: Medications
  }
  unmounted: boolean

  constructor(props: any) {
    super(props);
    this.unmounted = false;
    this.state = {
      medications: this.newMedications()
    }
    this.refreshMedications();
  }

  async refreshMedications() {
      let medications: Medications = await fetchMedications(this.props.exam._id);
      if (medications.medications===undefined) {
        medications = await createExamItem('Medications', this.newMedications())
      }
      this.setState({medications});
  }

  async storeMedications() {
    try {
      let medications = await storeDocument(this.state.medications);
      if (!this.unmounted)
        this.setState({medications});
    } catch (error) {
      alert(error);
      if (this.unmounted) {
        this.props.onNavigationChange('showExam', this.props.exam);
      } else {
        this.refreshMedications();
      }
    }
  }

  newMedications = ()  => {
    const newMedications : Medications = newExamItems(this.props.exam._id, 'Medications');
    newMedications.medications = [];
    return newMedications;
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

  componentWillUnmount() {
    this.unmounted = true;
  }

  render() {
    return <ItemsEditor
      items={this.state.medications.medications}
      newItem={this.newMedication}
      isEmpty={this.isMedicationEmpty}
      itemDefinition={medicationDefinition}
      onUpdate = {() => this.storeMedications()}
      />
  }
}

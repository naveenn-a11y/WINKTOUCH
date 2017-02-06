/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView, LayoutAnimation, TouchableHighlight } from 'react-native';
import { styles, fontScale } from './Styles';
import { Button, TilesField, SelectionList, ItemsEditor } from './Widgets';
import type {ItemDefinition, Medication } from './Types';
import { FormRow, FormTextInput } from './Form';
import { createExamItem } from './ExamItem';
import { restUrl, storeDocument } from './CouchDb';


export async function fetchMedications(examId: number) : Medications {
  try {
    let response = await fetch(restUrl+'/_design/views/_view/examitems?startkey='+encodeURIComponent('["medication"]'), {
        method: 'get'
    });
    let json = await response.json();
    const medications = json.rows[0].value;
    return medications;
  } catch (error) {
    console.error(error);
    alert('Something went wrong trying to get the medication list from the server. You can try again anytime.');
  }
}

export function createMedications(medications: Medications) {
  return createExamItem('Medications', medications);
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
      medications: {
        examId: this.props.exam.id,
        medications: []
      }
    }
    this.refreshMedications();
  }

  async refreshMedications() {
      const medications: Medications = await fetchMedications(this.props.exam.examId);
      if (medications.medications===undefined || medications.medications===null) {
        medications.medications=[];
      }
      this.setState({medications});
  }

  newMedication(): Medication {
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

  isMedicationEmpty = (medication: Medication) : boolean => {
    console.log('isempty ?:'+JSON.stringify(medication));
    if (medication === undefined || medication===null) return true;
    if (medication.label === undefined || medication.label==null || medication.label.trim()==='') {
      console.log(medication.label+' is empty');
      return true;
    }
    console.log(medication.label+' is not empty');
    return false;
  }

  async storeMedications() {
    try {
      let medications = await storeDocument(this.state.medications);
      if (!this.unmounted)
        this.setState({medications});
    } catch (error) {
      alert(error);
      if (this.unmounted)
        this.props.onNavigationChange('showExam', this.props.exam);
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  render() {
    return <ItemsEditor
      items={this.state.medications.medications}
      newItem={() => this.newMedication()}
      isEmpty={this.isMedicationEmpty}
      itemDefinition={medicationDefinition}
      onUpdate = {() => this.storeMedications()}
      />
  }
}

/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView, LayoutAnimation, TouchableHighlight } from 'react-native';
import { styles, fontScale } from './Styles';
import { WinkButton, TilesField, SelectionList, ItemsEditor } from './Widgets';
import type {ItemDefinition } from './Widgets';
import { FormRow, FormTextInput } from './Form';

export type Medication = {
  label: string,
  rxDate: Date,
  strength: string,
  dosage: string,
  route: string,
  frequency: string,
  duration: string,
  instructions: string[]
}

function fetchMedications(): Medication[] {
  const medications: Medication[] = [
    {
      label: 'Xalatan',
      rxDate: new Date(),
      strength: '20 mg',
      dosage: '1 drop',
      route: 'OS',
      frequency: '5 x daily',
      duration: '2 weeks',
      instructions: ['Shake well before using', 'Take with food', 'Avoid taking with diary']
    }
  ];
  return medications;
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
  newMedication(): Medication {
    return {
      label: '',
      rxDate: new Date(),
      strength: '',
      dosage: '',
      route: '',
      frequency: '',
      duration: '',
      instructions: []
    };
  }

  render() {
    return <ItemsEditor
      items={fetchMedications()}
      newItem={() => this.newMedication()}
      itemDefinition={medicationDefinition}
      />
  }
}

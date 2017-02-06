/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView, LayoutAnimation, TouchableHighlight } from 'react-native';
import { styles, fontScale } from './Styles';
import { Button, TilesField, SelectionList, ItemsEditor } from './Widgets';
import type {ItemDefinition } from './Types';
import { FormRow, FormTextInput } from './Form';

export type MedicalHistory = {
  procedure: string,
  date: Date,
  route: string
}

function fetchMedicalHistory(): MedicalHistory[] {
  const medicalHistory: MedicalHistory[] = [
    {
      procedure: 'Eyeball removal',
      date: 'TODO',
      route: 'OD'
    }
  ];
  return medicalHistory;
}


const medicalHstoryDefinition: ItemDefinition = {
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

export class MedicalHistoryScreen extends Component {
  newMedicalHistory(): MedicalHistory {
    return {
      procedure: '',
      date: new Date(),
      route: ''
    };
  }

  render() {
    return <ItemsEditor
      items={fetchMedicalHistory()}
      newItem={() => this.newMedicalHistory()}
      itemDefinition={medicalHstoryDefinition}
      />
  }
}

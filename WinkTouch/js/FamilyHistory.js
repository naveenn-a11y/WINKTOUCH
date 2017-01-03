/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView, LayoutAnimation, TouchableHighlight } from 'react-native';
import { styles, fontScale } from './Styles';
import { WinkButton, OptionWheel, SelectionList, ItemsEditor } from './Widgets';
import type {ItemDefinition } from './Widgets';
import { FormRow, FormTextInput } from './Form';

export type FamilyHistory = {
  disease: string, 
  since: string,
  relation: string[]
}

function fetchFamilyHistory(): FamilyHistory[] {
  const familyHistory: FamilyHistory[] = [
    {
      disease: 'Corneal reflex reduced',
      since: 'Adult onset',
      relation: ['Father','Brother']
    }
  ];
  return familyHistory;
}


const familyHstoryDefinition: ItemDefinition = {
  disease: {
    label: 'Disease / Problem',
    options: ['Blindness','Cataract','Crossd eye','Glaucoma','Macular degeneratino','Retinal detachment','Arthritis','Cancer','Diabetis','Heart disease','High blood presure','High cholesterol','Heart disease','Kidney disease','Lupus','Thyroid disease'],
    required: true
  },
  since: {
    label: 'Since',
    options: ['Unknown', 'Since childhood', 'Adult onset']
  },
  relation: {
    label: 'Relation',
    options: ['Mother', 'Father', 'Sister', 'Brother', 'Maternal grandmother', 'Maternal grandfather', 'Paternal grandmother', 'Paternal grandfather'],
    required: true,
    multiValue: true
 }
};

export class FamilyHistoryScreen extends Component {
  newFamilyHistory(): FamilyHistory {
    return {
      disease: '',
      since: '',
      relation: []
    };
  }

  render() {
    return <ItemsEditor
      items={fetchFamilyHistory()}
      newItem={() => this.newFamilyHistory()}
      itemDefinition={familyHstoryDefinition}
      />
  }
}
/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView, LayoutAnimation, TouchableHighlight } from 'react-native';
import { styles, fontScale } from './Styles';
import type {ItemDefinition, Allergy } from './Types';
import { WinkButton, TilesField, SelectionList, ItemsEditor } from './Widgets';
import { FormRow, FormTextInput } from './Form';

function fetchAllergies(): Allergy[] {
  const allergies: Allergy[] = [
  ];
  return allergies;
}

const allergyDefinition: ItemDefinition = {
  allergy: {
    label: 'Allergy',
    options: ['Aciclovir','Apraclonidine','Nortriptyline'],
    required: true
  },
  reaction: {
    label: 'Reaction',
    options: ['Abdominal Cramps', 'Abdominal Pain', 'Anaphylaxis', 'Anxiety', 'Chest Discomfort', 'Chest Tightness', 'Diarhea', 'Difficulty Breathing', 'Difficulty Swallowing', 'Dizziness', 'Eye Swelling', 'Facial Swelling', 'Fear', 'Feeling of Apprehension', 'Headache', 'Hives', 'Itching', 'Light-Headedness', 'Nasal Congestion', 'Nausea', 'Palpitations', 'Photosensitivity', 'Stomach Cramps', 'Tongue Swelling', 'Unconsciousness', 'Vomiting', 'Watery Eye', 'Weakness', 'Wheezing'],
    required: true,
    multiValue: true
  },
  status: {
    label: 'Status',
    options: ['Active','Inactive']
  },
};

export class AllergiesScreen extends Component {
  newAllergy(): Allergy {
    return {
      type: '',
      allergy: '',
      reaction: [],
      status: 'Active'
    };
  }

  render() {
    return <ItemsEditor
      items={fetchAllergies()}
      newItem={() => this.newAllergy()}
      itemDefinition={allergyDefinition}
    />
  }
}

/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView, LayoutAnimation, TouchableHighlight } from 'react-native';
import { styles, fontScale } from './Styles';
import type {ItemDefinition, Allergy } from './Types';
import { Button, TilesField, SelectionList, ItemsEditor } from './Widgets';
import { FormRow, FormTextInput } from './Form';
import { restUrl, storeDocument } from './CouchDb';

export function createAllergies(examId: string) : Allergies {
  const newAllergies : Allergies = {
    examId,
    allergies: []
  };
  return createExamItem('Allergies', newAllergies);
}

export async function fetchAllergies(): Allergies {
  try {
    let response = await fetch(restUrl+'/_design/views/_view/examitems?startkey='+encodeURIComponent('["Allergies"]')+'&endkey='+encodeURIComponent('["Allergies"]'), {
        method: 'get'
    });
    let json = await response.json();
    const allergies = json.total_rows===0?[]:json.rows[0].value;
    return allergies;
  } catch (error) {
    console.error(error);
    alert('Something went wrong trying to get the medication list from the server. You can try again anytime.');
    return [];
  }
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

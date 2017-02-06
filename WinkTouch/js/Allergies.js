/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView, LayoutAnimation, TouchableHighlight } from 'react-native';
import { styles, fontScale } from './Styles';
import type {Exam, ItemDefinition, Allergy, Allergies } from './Types';
import { Button, TilesField, SelectionList, ItemsEditor } from './Widgets';
import { FormRow, FormTextInput } from './Form';
import { createExamItem, fetchExamItems, newExamItems} from './ExamItem';
import { restUrl, storeDocument } from './CouchDb';


export async function fetchAllergies(examId: string): Allergies {
  let allergies : Allergies = await fetchExamItems(examId, 'Allergies');
  return allergies;
}

export async function storeAllergies(allergies: Allergies) :Allergies {
  return await storeDocument(allergies);
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
  props: {
    exam: Exam,
    onNavigationChange: (action: string, data: any) => void,
  }
  state: {
    allergies: Allergies
  }
  unmounted: boolean

  constructor(props: any) {
    super(props);
    this.unmounted = false;
    this.state = {
      allergies: this.newAllergies()
    }
    this.refreshAllergies();
  }

  async refreshAllergies() {
      let allergies: Allergies = await fetchAllergies(this.props.exam._id);
      if (allergies===undefined) {
        allergies = await createExamItem('Allergies', this.newAllergies());
      }
      this.setState({allergies});
  }

  async storeAllergies() {
    try {
      let allergies : Allergies = await storeDocument(this.state.allergies);
      if (!this.unmounted)
        this.setState({allergies});
    } catch (error) {
      alert(error);
      if (this.unmounted) {
        this.props.onNavigationChange('showExam', this.props.exam);
      } else {
        this.refreshAllergies();
      }
    }
  }

  newAllergies = () => {
    const newAllergies : Allergies = newExamItems(this.props.exam._id, 'Allergies');
    newAllergies.allergies = [];
    return newAllergies;
  }

  newAllergy = () => {
    return {
      allergy: '',
      reaction: [],
      status: ''
    };
  }

  isAllergyEmpty = (allergy: Allergy) => {
    if (allergy === undefined || allergy===null) return true;
    if (allergy.allergy === undefined || allergy.allergy==null || allergy.allergy.trim()==='') return true;
    return false;
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  render() {
    return <ItemsEditor
    items={this.state.allergies.allergies}
    newItem={this.newAllergy}
    isEmpty={this.isAllergyEmpty}
    itemDefinition={allergyDefinition}
    onUpdate = {() => this.storeAllergies()}
    />
  }
}

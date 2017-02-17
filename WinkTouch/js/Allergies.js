/**
 * @flow
 */
'use strict';


import type {Exam, ItemDefinition, Allergy} from './Types';
import React, { Component } from 'react';
import { ItemsEditor} from './Widgets';
import { ExamItemsCard } from './ExamItem';

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

export class AllegiesCard extends Component {
  props: {
    isExpanded: boolean,
    exam: Exam
  }

  render() {
    return <ExamItemsCard itemType='allergies' itemProperties={['allergy']} {...this.props}/>
  }
}

export class AllergiesScreen extends Component {
  props: {
    exam: Exam,
    onUpdateExam: (exam: Exam) => void
  }

  newAllergy = ()  => {
    return {
      allergy: undefined,
      reaction: [],
      status: undefined
    };
  }

  isAllergyEmpty = (allergy: Allergy) => {
    if (allergy === undefined || allergy===null) return true;
    if (allergy.allergy === undefined || allergy.allergy==null || allergy.allergy.trim()==='') return true;
    return false;
  }

  render() {
    return <ItemsEditor
      items={this.props.exam.allergies}
      newItem={this.newAllergy}
      isEmpty={this.isAllergyEmpty}
      itemDefinition={allergyDefinition}
      onUpdate = {() => this.props.onUpdateExam(this.props.exam)}
    />
  }
}

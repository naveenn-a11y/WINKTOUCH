/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView, LayoutAnimation } from 'react-native';
import { styles, fontScale } from './Styles';
import { ItemsEditor } from './Widgets';
import type {ItemDefinition } from './Widgets';

export type ReviewOfSystems = {
    general: string[],
    earsNoseMouth: string[],
    cardiovascular: string[],
    respiratory: string[],
    gastrointestinal: string[],
    genitourinary: string[],
    musculosketletal: string[],
    integumentary: string[],
    neurological: string[],
    pshychiatric: string[],
    endocrine: string[],
    myphaticHematological: string[],
    allergicImmunologic: string[]
}

function fetchReviewOfSystems(): ReviewOfSystems {
    const reviewOfSystems: ReviewOfSystems = {
      general: ['Fever','Insomnia'],
      respiratory: ['Difficulty breathing']
    }
    return reviewOfSystems;
}

  const reviewOfSystemsDefinition: ItemDefinition = {
    general: {
      label: 'General/Constitutional',
      options: ['Normal', 'Weight loss', 'Weight gain', 'Fever', 'Chills', 'Insomnia', 'Fatigue', 'Weakness'],
      multiValue: true,
      normalValue: 'Normal'
    },
    earsNoseMouth: {
      label: 'Ears/Nose/Mouth/Throat',
      options: ['Normal', 'Cough', 'Stuffy nose', 'Hay fever', 'Nosebleeds', 'Sinus congestion', 'Dry mouth', 'Sore throat', 'Hoarseness', 'Thrush', 'Mouth sores', 'Dentures', 'Decreased hearing', 'Earache', 'Ear drainage'],
      multiValue: true,
      normalValue: 'Normal'
    },
    cardiovascular: {
      label: 'Cardiovascular',
      options: ['Normal', 'Arrhythmia', 'Chest pain or discmfort (Angina)', 'Difficulty breathing lying down (orthopnea)', 'History of Heart disease', 'High cholesterol', 'Murmur', 'Pacemaker', 'Shortness of breath with activity (dyspnea)', 'Stint', 'Szelling', 'Valve defect'],
      multiValue: true,
      normalValue: 'Normal'
    },
    respiratory: {
      label: 'Respiratory',
      options: ['Normal', 'Bronchitis', 'Emphysema', 'COPD', 'Hemoptosis', 'Lung cancer', 'Pneumonia', 'Tuberculosis'],
      multiValue: true,
      normalValue: 'Normal'
    },
    gastrointestinal: {
      label: 'Gastrointestinal',
      options: ['Normal'],
      multiValue: true,
      normalValue: 'Normal'
    },
    genitourinary: {
      label: 'Genitourinary',
      options: ['Normal'],
      multiValue: true,
      normalValue: 'Normal'
    },
    musculosketletal: {
      label: 'Musculosketletal',
      options: ['Normal'],
      multiValue: true,
      normalValue: 'Normal'
    },
    integumentary: {
      label: 'Integumentary',
      options: ['Normal'],
      multiValue: true,
      normalValue: 'Normal'
    },
    neurological: {
      label: 'Neurological',
      options: ['Normal'],
      multiValue: true,
      normalValue: 'Normal'
    },
    pshychiatric: {
      label: 'Pshychiatric',
      options: ['Normal'],
      multiValue: true,
      normalValue: 'Normal'
    },
    endocrine: {
      label: 'Endocrine',
      options: ['Normal'],
      multiValue: true,
      normalValue: 'Normal'
    },
    myphaticHematological: {
      label: 'Myphatic/Hematological',
      options: ['Normal'],
      multiValue: true,
      normalValue: 'Normal'
    },
    allergicImmunologic: {
      label: 'Allergic/Immunologic',
      options: ['Normal'],
      multiValue: true,
      normalValue: 'Normal'
    }
}

export class ReviewOfSystemsScreen extends Component {
  state: {
    reviewOfSystems: ReviewOfSystems
  }
  constructor(props: any) {
    super(props);
    this.state = {
      reviewOfSystems: {}
    }
  }

  componentDidMount() {
    const reviewOfSystems: ReviewOfSystem[] = fetchReviewOfSystems();
    this.setState({ reviewOfSystems });
  }

  render() {
    return <ItemsEditor
          items={[this.state.reviewOfSystems]}
          itemDefinition={reviewOfSystemsDefinition}
          itemView='EditableItem'
          />
  }
}

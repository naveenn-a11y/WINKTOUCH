/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView, LayoutAnimation, TouchableHighlight } from 'react-native';
import { styles, fontScale } from './Styles';
import { Button, TilesField, SelectionList, ItemsEditor } from './Widgets';
import type {ItemDefinition, FamilyHistory, SiblingsDisease } from './Types';
import { createExamItem, fetchExamItems, newExamItems} from './ExamItem';
import { restUrl, storeDocument } from './CouchDb';

export async function fetchFamilyHistory(examId: string) : FamilyHistory {
  let familyHistory : FamilyHistory = await fetchExamItems(examId, 'FamilyHistory');
  return familyHistory;
}

export async function storeFamilyHistory(familyHistory: FamilyHistory) :FamilyHistory {
  return await storeDocument(familyHistory);
}

const siblingsDiseaseDefinition: ItemDefinition = {
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
  props: {
    exam: Exam,
    onNavigationChange: (action: string, data: any) => void,
  }
  state: {
    familyHistory: FamilyHistory
  }
  unmounted: boolean

  constructor(props: any) {
    super(props);
    this.unmounted = false;
    this.state = {
      familyHistory: this.newFamilyHistory()
    }
    this.refreshFamilyHistory();
  }

  async refreshFamilyHistory() {
      let familyHistory: FamilyHistory = await fetchFamilyHistory(this.props.exam._id);
      if (familyHistory===undefined) {
        familyHistory = await createExamItem('FamilyHistory', this.newFamilyHistory())
      }
      this.setState({familyHistory});
  }

  async storeFamilyHistory() {
    try {
      let familyHistory = await storeDocument(this.state.familyHistory);
      if (!this.unmounted)
        this.setState({familyHistory});
    } catch (error) {
      alert(error);
      if (this.unmounted) {
        this.props.onNavigationChange('showExam', this.props.exam);
      } else {
        this.refreshFamilyHistory();
      }
    }
  }

  newFamilyHistory = ()  => {
    const newFamilyHistory : FamilyHistory = newExamItems(this.props.exam._id, 'FamilyHistory');
    newFamilyHistory.siblingsDiseases = [];
    return newFamilyHistory;
  }

  newSiblingsDisease(): SiblingsDisease {
    return {
      disease: '',
      since: '',
      relation: []
    };
  }

  isSiblingsDiseaseEmpty = (siblingsDisease: SiblingsDisease)  => {
    if (siblingsDisease === undefined || siblingsDisease===null) return true;
    if (siblingsDisease.disease === undefined || siblingsDisease.disease==null || siblingsDisease.disease.trim()==='') return true;
    return false;
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  render() {
    return <ItemsEditor
      items={this.state.familyHistory.siblingsDiseases}
      newItem={this.newSiblingsDisease}
      isEmpty={this.isSiblingsDiseaseEmpty}
      itemDefinition={siblingsDiseaseDefinition}
      onUpdate = {() => this.storeFamilyHistory()}
      />
  }
}

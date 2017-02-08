/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView, LayoutAnimation, TouchableHighlight } from 'react-native';
import { styles, fontScale } from './Styles';
import { Button, TilesField, SelectionList, ItemsEditor } from './Widgets';
import type {ItemDefinition, FamilyHistory, RelationDisease } from './Types';
import { createExamItem, fetchExamItems, newExamItems, ExamItemsCard} from './ExamItem';
import { restUrl, storeDocument } from './CouchDb';

export async function fetchFamilyHistory(examId: string) : FamilyHistory {
  let familyHistory : FamilyHistory = await fetchExamItems(examId, 'FamilyHistory');
  return familyHistory;
}

export async function storeFamilyHistory(familyHistory: FamilyHistory) :FamilyHistory {
  return await storeDocument(familyHistory);
}

const relationDiseaseDefinition: ItemDefinition = {
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

export class FamilyHistoryCard extends Component {
  props: {
    isExpanded: boolean,
    exam: Exam
  }

  render() {
    return <ExamItemsCard  itemType='relationDiseases' itemProperties={['relation','disease']}{...this.props}/>
  }
}


export class FamilyHistoryScreen extends Component {
  props: {
    exam: Exam,
    onNavigationChange: (action: string, data: any) => void,
    onUpdateExam: (exam: Exam) => void
  }
  state: {
    familyHistory: FamilyHistory
  }
  unmounted: boolean

  constructor(props: any) {
    super(props);
    this.unmounted = false;
    let familyHistory: FamilyHistory = this.props.exam.FamilyHistory;
    if (familyHistory===undefined) familyHistory = this.newFamilyHistory();
    this.state = {familyHistory};
    this.refreshFamilyHistory();
  }

  async refreshFamilyHistory() {
      let exam : Exam = this.props.exam;
      let familyHistory: FamilyHistory = await fetchFamilyHistory(exam._id);
      if (familyHistory===undefined) {
        familyHistory = await createExamItem('FamilyHistory', this.newFamilyHistory())
      }
      this.setState({familyHistory});
      exam.relationDiseases = familyHistory;
      this.props.onUpdateExam(exam);
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
    newFamilyHistory.relationDiseases = [];
    return newFamilyHistory;
  }

  newRelationDisease(): RelationDisease {
    return {
      disease: '',
      since: '',
      relation: []
    };
  }

  isRelationDiseaseEmpty = (relationDisease: RelationDisease)  => {
    if (relationDisease === undefined || relationDisease===null) return true;
    if (relationDisease.disease === undefined || relationDisease.disease==null || relationDisease.disease.trim()==='') return true;
    return false;
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  render() {
    return <ItemsEditor
      items={this.state.familyHistory.relationDiseases}
      newItem={this.newRelationDisease}
      isEmpty={this.isRelationDiseaseEmpty}
      itemDefinition={relationDiseaseDefinition}
      onUpdate = {() => this.storeFamilyHistory()}
      />
  }
}

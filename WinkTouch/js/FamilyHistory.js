/**
 * @flow
 */
'use strict';

import type {ItemDefinition, FamilyDisease } from './Types';
import React, { Component } from 'react';
import { ItemsEditor} from './Widgets';
import { ExamItemsCard } from './ExamItem';

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
    return <ExamItemsCard itemType='familyHistory' itemProperties={['relation','disease']} {...this.props}/>
  }
}


export class FamilyHistoryScreen extends Component {
  props: {
    exam: Exam,
    onUpdateExam: (exam: Exam) => void
  }

  newRelationDisease = () => {
    let familyDisease : FamilyDisease ={
      disease: '',
      since: '',
      relation: []
    };
    return familyDisease;
  }

  isRelationDiseaseEmpty = (familyDisease: FamilyDisease)  => {
    if (familyDisease === undefined || familyDisease===null) return true;
    if (familyDisease.disease === undefined || familyDisease.disease==null || familyDisease.disease.trim()==='') return true;
    return false;
  }

  render() {
    return <ItemsEditor
      items={this.props.exam.familyHistory}
      newItem={this.newRelationDisease}
      isEmpty={this.isRelationDiseaseEmpty}
      itemDefinition={relationDiseaseDefinition}
      onUpdate = {() => this.props.onUpdateExam(this.props.exam)}
    />
  }
}

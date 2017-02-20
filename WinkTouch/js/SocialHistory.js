/**
 * @flow
 */
'use strict';

import type {ItemDefinition, SocialHistory, MedicalProcedure } from './Types';
import React, { Component } from 'react';
import { ItemsEditor} from './Widgets';
import { ExamItemCard } from './ExamItem';

const socialHistoryDefinition: ItemDefinition = {
  smokerType: {
    label: 'Smoking',
    options: ['Never smoker', 'Prefers not to answer', 'Current every day smoker', 'Current some day smoker', 'Former smoker', 'Heavy tobacco smoker', 'Light tobacca smoker'],
    normalValue: 'Never smoker',
    required: true,
  },
  smokedLastMonth: {
    label: 'Used tobacco in last 30 days',
    options: ['No', 'Prefers not to answer', 'Yes'],
    normalValue: 'No',
    required: false
  },
  smokelessUsedLastMonth: {
    label: 'Used smokeless tobacco product in last 30 days',
    options: ['No', 'Prefers not to answer', 'Yes'],
    normalValue: 'No',
    required: false
  },
  alcoholUse: {
    label: 'Alcohol',
    options: ['Denies', 'Prefers not to answer', 'Admits', 'Previous', 'Moderate', 'Excessive', 'Social'],
    normalValue: 'Denies',
    multiValue: true,
    required: true
  },
  drugUse: {
    label: 'Drugs',
    options: ['Denies', 'Prefers not to answer', 'Admits', 'Cocaine', 'Ecstacy', 'Marijuana', 'Methamphetamine'],
    normalValue: 'Denies',
    multiValue: true,
    required: true
  },
  other: {
    label: 'Other',
    options: ['None', 'Prefers not to answer', 'Sexually active', 'History of child abuse', 'History of domestic violence'],
    normalValue: 'None',
    multiValue: true,
    required: false
  },
  tobaccoCounseling: {
    label: 'Tobacco Cessation Counselling',
    options: ['None', 'Prefers not to answer', 'Pregnancy smoking education', 'Referral to stop-smoking clinic', 'Smoking cessation assistance'],
    normalValue: 'None',
    required: false
  },
  physicalActivityCounseling: {
    label: 'Physical Activity Counseling',
    options: ['None', 'Determination of physical activity tolerance', 'Exercise eduction', 'Exercise on prescription', 'Exercie promotion: strength training', 'Exercise promotion: stretching', 'Patient advised about exercise', 'Patient given written advise on benefits of physical activity', 'Physical activity assessment', 'Prescribed activity', 'Recommendation to exercise', 'Recommendation to mobilize part', 'Recommendation to undertake activitiy', 'Referral to exercise therapy', 'Referral to physical activity program', 'Referral to weight maintenance regimen service'],
    normalValue: 'None',
    required: false
  },
  nutritionCounseling: {
    label: 'Nutrition Counseling',
    options: ['None', 'Prefers not to answer', 'Counseling for eating disorder', 'Diet education', 'Diet leaflet given', 'Dietary education for weight gain', 'Dietary management education, guidance, and counseling', 'Eating disorder management', 'Food education, guidance and counseling', 'High fiber diet education', 'High protein diet education', 'Lifestyle education', 'Low carbohydrate diet education', 'low cholesterol diet education', 'Medical utrition therapy', 'Obesity diet education', 'Patient referral to dietition', 'Recommendation to carer regarding child\'s diet', 'Recommendation to change diet'],
    normalValue: 'None',
    required: false
  }
};

export class SocialHistoryCard extends Component {
  props: {
    isExpanded: boolean,
    exam: Exam
  }

  render() {
    return <ExamItemCard itemType='socialHistory' itemProperties={['smokerType','alcoholUse']} itemDefinition={socialHistoryDefinition} {...this.props}/>
  }
}

export class SocialHistoryScreen extends Component {
  props: {
    exam: Exam,
    onUpdateExam: (exam: Exam) => void
  }

  render() {
    return <ItemsEditor
      items={[this.props.exam.socialHistory]}
      itemDefinition={socialHistoryDefinition}
      onUpdate = {() => this.props.onUpdateExam(this.props.exam)}
      itemView='EditableItem'
      orientation='horizontal'
      />
  }
}

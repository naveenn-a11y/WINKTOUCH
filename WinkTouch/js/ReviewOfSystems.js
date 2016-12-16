/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView, LayoutAnimation } from 'react-native';
import { styles, fontScale } from './Styles';
import { WinkButton, OptionWheel, SelectionList } from './Widgets';
import { FormRow, FormTextInput } from './Form';

export type ReviewOfSystem = {
  category: string,
  description: string[],
  options: string[]
}

function fetchReviewOfSystems(): ReviewOfSystem[] {
  const reviewOfSystems: ReviewOfSystem[] = [
    {
      category: 'General/Constitutional',
      description: ['Weight gain'],
      options: ['Weight loss', 'Weight gain', 'Fever', 'Chills', 'Insomnia', 'Fatigue', 'Weakness']
    }, {
      category: 'Ears/Nose/Mouth/Throat',
      description: ['Negative'],
      options: ['Cough', 'Stuffy nose', 'Hay fever', 'Nosebleeds', 'Sinus congestion', 'Dry mouth', 'Sore throat', 'Hoarseness', 'Thrush', 'Mouth sores', 'Dentures', 'Decreased hearing', 'Earache', 'Ear drainage']
    }, {
      category: 'Cardiovascular',
      description: ['Something not on the list'],
      options: ['Arrhythmia', 'Chest pain or discmfort (Angina)', 'Difficulty breathing lying down (orthopnea)', 'History of Heart disease', 'High cholesterol', 'Murmur', 'Pacemaker', 'Shortness of breath with activity (dyspnea)', 'Stint', 'Szelling', 'Valve defect'],
    }, {
      category: 'Respiratory',
      description: [],
      options: ['Bronchitis', 'Emphysema', 'COPD', 'Hemoptosis', 'Lung cancer', 'Pneumonia', 'Tuberculosis']
    }, {
      category: 'Gatrointestinal',
      description: [],
      options: []
    }, {
      category: 'Genitourinary',
      description: [],
      options: []
    }, {
      category: 'Musculosketletal',
      description: [],
      options: []
    }, {
      category: 'Integumentary',
      description: [],
      options: []
    }, {
      category: 'Neurological',
      description: [],
      options: []
    }, {
      category: 'Pshychiatric',
      description: [],
      options: []
    }, {
      category: 'Endocrine',
      description: [],
      options: []
    }, {
      category: 'Myphatic/Hematological',
      description: [],
      options: []
    }, {
      category: 'Allergic/Immunologic',
      description: [],
      options: []
    }
  ];
  return reviewOfSystems;
}

class ReviewOfSystemsSummary extends Component {
  props: {
    reviewOfSystems: ReviewOfSystem[],
    onUpdateReview: (category: string, description: string[]) => void
  }

  format(description: string[]): string {
    if (!description || description.length === 0)
      return '';
    let formattedText: string = description[0];
    for (var i = 1; i < description.length; i++) {
      formattedText = formattedText + ', ' + description[i];
    }
    return formattedText;
  }

  renderReviewOfSystem(reviewOfSystem: ReviewOfSystem, index: number) {
    if (!reviewOfSystem.description || reviewOfSystem.description.length === 0 || reviewOfSystem.description[0].toLowerCase() === 'negative')
      return null;
    let description: string = this.format(reviewOfSystem.description);
    return <FormRow key={index}>
      <FormTextInput label={reviewOfSystem.category} value={description}
        onChangeText={(text: string) => this.props.onUpdateReview(reviewOfSystem.category, text.split(', '))} />
    </FormRow>
  }

  isAllNegative(): boolean {
    for (let i: number = 0; i < this.props.reviewOfSystems.length; i++) {
      if (this.props.reviewOfSystems[i].description === null ||
        this.props.reviewOfSystems[i].description.length !== 1 ||
        this.props.reviewOfSystems[i].description[0].toLowerCase() != 'negative')
        return false;
    }
    return true;
  }

  render() {
    let allNegative: boolean = this.isAllNegative();
    if (allNegative)
      return <View style={styles.form}>
        <Text style={styles.textfield}>No issues reported, all negative</Text>
      </View>
    return <View style={styles.form}>
      {this.props.reviewOfSystems.map((reviewOfSystem: ReviewOfSystem, index: number) => {
        return this.renderReviewOfSystem(reviewOfSystem, index);
      })}
    </View >
  }
}

class ReviewOfSystems extends Component {
  props: {
    reviewOfSystems: ReviewOfSystem[],
    onUpdateReview: (category: string, description: string[]) => void
  }

  render() {
    return <ScrollView horizontal={true}>
      {this.props.reviewOfSystems.map((reviewOfSystem: ReviewOfSystem, index: number) => {
        return <SelectionList required={true} key={index} label={reviewOfSystem.category}
          items={['Negative', ...reviewOfSystem.options]}
          selection={reviewOfSystem.description}
          onUpdateSelection={(selectedOptions: string[]) => this.props.onUpdateReview(reviewOfSystem.category, selectedOptions)}
          />
      })}
    </ScrollView>
  }
}

export class ReviewOfSystemsScreen extends Component {
  state: {
    reviewOfSystems: ReviewOfSystem[]
  }
  constructor(props: any) {
    super(props);
    this.state = {
      reviewOfSystems: []
    }
  }

  componentDidMount() {
    const reviewOfSystems: ReviewOfSystem[] = fetchReviewOfSystems();
    this.setState({ reviewOfSystems });
  }

  updateReview(category: string, description: string[]): void {
    const reviewOfSystem: any = this.state.reviewOfSystems.find((reviewOfSystem: ReviewOfSystem): boolean => {
      return category === reviewOfSystem.category;
    });
    if (description.length > 1 && description[0].toLowerCase() === 'negative') {
      description = description.splice(1);
    }
    if (description.length > 1 && description[description.length - 1].toLowerCase() === 'negative') {
      description = ['Negative'];
    }
    reviewOfSystem.description = description;
    this.setState({ reviewOfSystems: this.state.reviewOfSystems });
  }

  allNegative() {
    const reviewOfSystems = this.state.reviewOfSystems.map((reviewOfSystem: ReviewOfSystem) => {
      reviewOfSystem.description = ['Negative'];
      return reviewOfSystem;
    });
    this.setState({ reviewOfSystems });
  }

  othersNegative() {
    const reviewOfSystems = this.state.reviewOfSystems.map((reviewOfSystem: ReviewOfSystem) => {
      if (reviewOfSystem.description.length === 0)
        reviewOfSystem.description = ['Negative'];
      return reviewOfSystem;
    });
    this.setState({ reviewOfSystems });
  }

  clear() {
    const reviewOfSystems = this.state.reviewOfSystems.map((reviewOfSystem: ReviewOfSystem) => {
      reviewOfSystem.description = [];
      return reviewOfSystem;
    });
    this.setState({ reviewOfSystems });
  }

  renderButtons() {
    return <View style={styles.buttonsRowLayout}>
      <View style={styles.buttonsRowStartLayout}>
        <WinkButton title='All Negative' onPress={() => { this.allNegative() } } />
        <WinkButton title='Others Negative' onPress={() => { this.othersNegative() } } />
      </View>
      <WinkButton title='Clear' onPress={() => { this.clear() } } />
    </View>
  }

  render() {
    return <View>
      <ReviewOfSystemsSummary reviewOfSystems={this.state.reviewOfSystems}
        onUpdateReview={(category: string, description: string[]) => this.updateReview(category, description)} />
      {this.renderButtons()}
      <ReviewOfSystems reviewOfSystems={this.state.reviewOfSystems}
        onUpdateReview={(category: string, description: string[]) => this.updateReview(category, description)} />
    </View>
  }
}
/**
 * @flow
 */
'use strict';

import React, { Component, PureComponent } from 'react';
import { View, TouchableHighlight, Text, ScrollView, TouchableOpacity, ListView, LayoutAnimation } from 'react-native';
import type { Recall, GlassesRx, Visit, Exam } from './Types';
import { strings } from './Strings';
import { styles, fontScale } from './Styles';
import {GlassesDetail} from './Refraction';
import { FormRow, FormField, FormTextInput } from './Form';
import { getCachedItem } from './DataCache';
import { ItemsCard, GroupedCard, formatLabel } from './Items';
import { deepClone} from './Util';

export class AssessmentCard extends PureComponent {
  props: {
    exam: Exam,
    navigation: any,
    appointmentStateKey: string
  }

  render() {
    if (!this.props.exam) return null;
    return <TouchableOpacity onPress={() => this.props.navigation.navigate('exam', {exam: this.props.exam, appointmentStateKey: this.props.appointmentStateKey})}>
      <View style={styles.card}>
        <View style={styles.centeredRowLayout}>
            <Text style={styles.sectionTitle}>{formatLabel(this.props.exam.definition)}</Text>
        </View>
        <View style={styles.formRow500}>
            {this.props.exam.definition.type==='groupedForm' && <GroupedCard isExpanded={true} exam={this.props.exam} showTitle={false} />}
            {this.props.exam.definition.type==='selectionLists' && <ItemsCard isExpanded={true} exam={this.props.exam} showTitle={false} />}
        </View>
      </View>
    </TouchableOpacity>
  }
}


export class PrescriptionCard extends Component {
  props: {
    visit: Visit,
    title?: string
  }

  render() {
    if (this.props.visit===undefined) return null;
    return <View style={styles.card}>
        {this.props.title && <View style={styles.centeredRowLayout}>
          <Text style={styles.sectionTitle}>{this.props.title}</Text>
        </View>}
        <View style={styles.formRow500}>
          <GlassesDetail title={strings.RxToOrder} titleStyle={styles.sectionTitle} glassesRx={this.props.visit.prescription}
            style={styles.columnLayout} editable={false}/>
        </View>
      </View>
  }
}

export class RecallCard extends Component {
  props: {
    visit: Visit,
    editable?: boolean,
    onUpdateVisit : (visit: Visit) => void
  }
  static defaultProps = {
    editable: true
  }

  render() {
    return <View><View style={styles.card}>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.sectionTitle}>{strings.recall}</Text>
        </View>
        <View style={styles.columnLayout}>
            <View style={styles.formRow500}>
              <FormField value={this.props.visit} fieldName='recall.amount' onChangeValue={this.props.onUpdateVisit} />
              <FormField value={this.props.visit} fieldName='recall.unit' onChangeValue={this.props.onUpdateVisit} />
            </View>
            <View style={styles.formRow500}>
              <FormField value={this.props.visit} fieldName='recall.notes' onChangeValue={this.props.onUpdateVisit} multiline={true} />
            </View>
        </View>
    </View></View>
  }
}

export class ReferralCard extends Component {
  render() {
    return <View><View style={styles.card}>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.sectionTitle}>{strings.referral}</Text>
        </View>
        <View style={styles.columnLayout}>
            <View style={styles.formRow500}>
              <FormTextInput label='Specialist' />
            </View>
            <View style={styles.formRow500}>
              <FormTextInput label='Summary' multiline={true} />
            </View>
        </View>
    </View></View>
  }
}

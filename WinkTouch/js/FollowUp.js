/**
 * @flow
 */
'use strict';

import type { Visit } from './Types';

import React, { Component } from 'react';
import { View, Text, ScrollView, Modal, TouchableWithoutFeedback } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { styles, fontScale } from './Styles';
import { Button,TilesField, Label, SelectionList, TableList } from './Widgets';
import { FormRow, FormTextInput, FormField, FormCode } from './Form';
import { getAllCodes, getCodeDefinition } from './Codes';
import { fetchWinkRest } from './WinkRest';
import type { HtmlDefinition, ReferralDocument, ImageBase64Definition, ReferralDefinition, CodeDefinition, EmailDefinition} from './Types';
import {allExamIds} from './Visit';
import { getCachedItems } from './DataCache';
import { stripDataType } from './Rest';
import RNBeep from 'react-native-a-beep';
import { getStore } from './DoctorApp';
import { strings } from './Strings';



type FollowUpScreenProps = {
  navigation: any
};

type FollowUpScreenState = {

};



export class FollowUpScreen extends Component<FollowUpScreenProps, FollowUpScreenState> {
  editor;

  constructor(props: FollowUpScreenProps) {
    super(props);

    this.state = {
      template: undefined,
      selectedField: [undefined, undefined, undefined, undefined, undefined],
      htmlDefinition : [],
      doctorReferral: {},
      isActive: true,
      emailDefinition: {},
      command: undefined,
      isPopupVisibile: false,
      isSignVisible: false
      }
  }



  renderFollowUp() {
    const templates : string[] = getAllCodes("referralTemplates");
    return <View style={styles.page}>
      <View style={styles.topFlow}>
        <View style={styles.tabCard}>
          <Text style={styles.cardTitle}>Follow Up</Text>
          <View style={styles.boardM}>
            <View style={styles.formRow}>
              <TableList />
            </View>
          </View>
         
      </View>
    </View>
        {this.renderButtons()}
</View>
  }

    renderButtons() {
      return <View style={{paddingTop: 30*fontScale, paddingBottom:100*fontScale}}>
          <View style={styles.flow}>
            <Button title={'New'}/>
            <Button title={'Reply'}/>
            <Button title={'Follow Up'}/>
            <Button title={'ReSend'}/>
            <Button title={'Forward'}/>
        </View>
      </View>
    }

  render() {
    return <View style={styles.page}>
      {this.renderFollowUp()}
    </View>
  }
}

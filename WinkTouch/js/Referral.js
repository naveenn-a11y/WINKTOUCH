/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Editor, Provider, Tools } from 'react-native-tinymce';
import { styles } from './Styles';
import { Button,TilesField } from './Widgets';
import { FormRow } from './Form';
import { getAllCodes } from './Codes';

const dynamicFields : Object = {
  "patient": {
    "firstName": {},
    "lastName": {}
  },
  "exam": {
    "Reason for visit": {
      "Reason for visit": {
        "Main Reason":{},
        "Secondary Reason":{}
      }
    },
    "Allergies": {
      "Allergy": {},
      "Reaction": {}
    }
  }
};

type ReferralScreenProps = {
  navigation: any
};

type ReferralScreenState = {
  template: ?string,
  selectedField: ?string
};

export class ReferralScreen extends Component<ReferralScreenProps, ReferralScreenState> {
  constructor(props: ReferralScreenProps) {
    super(props);
    this.state = {
      template: undefined,
      selectedField: undefined
    }
  }

  startReferral(template: string) {
    this.setState({template});
  }

  renderEditor() {
    return <View style={styles.topFlow}>
      <View style={styles.pageEditor}>
        <Provider>
          <Editor
            ref={ ref => this.editor = ref }
            value="<H2>Hello world!</H2>"
          />
          <Tools />
          </Provider>
      </View>
        <View style={styles.form}>
          <FormRow>
            <TilesField options={Object.keys(dynamicFields)} label='Field'/>
          </FormRow>
          <FormRow>
            <TilesField options={Object.keys(dynamicFields)}/>
          </FormRow>
          <FormRow>
            <Button title='Insert'/>
          </FormRow>
      </View>
    </View>
  }

  renderTemplates() {
    const templates : string[] = getAllCodes("referralTemplates");
    return <View style={styles.buttonsRowLayout}>
        {templates && templates.map((template: string) => <Button title={template} onPress={() => this.startReferral(template)}/>)}
        <Button title='Blank' onPress={() => {this.startReferral('')}} />

    </View>
  }

  render() {
    return <View style={styles.centeredColumnLayout}>
      {this.state.template?this.renderEditor():this.renderTemplates()}
    </View>
  }

}

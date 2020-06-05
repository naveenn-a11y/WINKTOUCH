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
  "Patient": {
    "firstName": {},
    "lastName": {}
  },
  "Exam": {
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

let refferalHtml : string = "<H2>Hello world!</H2>";

export function setReferralHtml(html: string) {
  refferalHtml = html;
}

type ReferralScreenProps = {
  navigation: any
};

type ReferralScreenState = {
  template: ?string,
  selectedField: ?string[]
};

export class ReferralScreen extends Component<ReferralScreenProps, ReferralScreenState> {
  constructor(props: ReferralScreenProps) {
    super(props);
    this.state = {
      template: undefined,
      selectedField: [undefined, undefined, undefined, undefined, undefined]
    }
  }

  startReferral(template: string) {
    //TODO: fetch merged template from backend
    this.setState({template});
  }

  selectField(level: number, filter: string) {
    let selectedField : string[] = this.state.selectedField;
    selectedField[level] = filter;
    while(++level<selectedField.length) {
      selectedField[level]=undefined;
    }
    this.setState({selectedField});

  }

  renderTemplateTool() {
    return <View style={styles.form}>
        {this.state.selectedField.map((fieldName: string, index: number) => {
          const prevValue : ?string = index>0?this.state.selectedField[index-1]:'';
          if (prevValue===undefined || prevValue===null) return undefined;
          let options = dynamicFields;
          for (let i:number =1; i<=index; i++) {
            if (options) {
              options = options[this.state.selectedField[i-1]];
            }
          }
          options = Object.keys(options);
          if (options===undefined || options===null || options.length===0) return undefined;
          return <FormRow>
              <TilesField label='Filter'
                options={options}
                value={this.state.selectedField[index]}
                onChangeValue={(value: string) => this.selectField(index, value)}
              />
            </FormRow>
          })
        }
        <FormRow>
          <Button title='Insert'/>
        </FormRow>
      </View>
  }

  renderEditor() {
    return <View style={styles.topFlow}>
      <View style={styles.pageEditor}>
        <Provider>
          <Editor
            ref={ ref => this.editor = ref }
            value={referralHtml}
          />
          <Tools />
          </Provider>
      </View>
      {this.renderTemplateTool()}
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

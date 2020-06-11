/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Editor, Provider, Tools } from 'react-native-tinymce';
import { styles } from './Styles';
import { Button,TilesField } from './Widgets';
import { FormRow } from './Form';
import { getAllCodes } from './Codes';
import { fetchWinkRest } from './WinkRest';
import type { HtmlDefinition, Referral } from './Types';
import {allExamIds} from './Visit';
import { getCachedItems } from './DataCache';
import { renderExamHtml } from './Exam';
import { stripDataType } from './Rest';



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

let referralHtml : string = "<H2>Hello world!</H2>";

export function setReferralHtml(html: string) {
  referralHtml = html;
}

type ReferralScreenProps = {
  navigation: any
};

type ReferralScreenState = {
  template: ?string,
  selectedField: ?string[]
};

export class ReferralScreen extends Component<ReferralScreenProps, ReferralScreenState> {
  editor;

  constructor(props: ReferralScreenProps) {
    super(props);

    this.state = {
      template: undefined,
      selectedField: [undefined, undefined, undefined, undefined, undefined]
    }
  }

  async startReferral(template: string) {
    console.log("Current Template: " + template);
    let parameters : {} = {};
    const visit: Visit = this.props.navigation.state.params.visit;
    console.log("Current Visit: " + JSON.stringify(visit));
    const allExams : string[] = allExamIds(visit);
    let exams: Exam[] = getCachedItems(allExams);
    if(exams) {
      let htmlDefinition : HtmlDefinition[] = [];
      for(const exam : Exam of exams) {
          if(exam.isHidden!==true && exam.hasStarted) {
              await renderExamHtml(exam,htmlDefinition);
            }
        }

      console.log("KEYMAP: " + JSON.stringify(htmlDefinition));
      let body : {} = {
        'htmlDefinition': htmlDefinition,
        'visitId': stripDataType(visit.id)
      };

      let response = await fetchWinkRest('webresources/template/'+template, parameters, 'POST', body);
      if (response) {
        const htmlContent : Referral = response;
        referralHtml = htmlContent.content;
        console.log("Response: " + JSON.stringify(htmlContent.content));
        this.setState({template});
      }
   
     this.setState({template});
    }

  }

  selectField(level: number, filter: string) {
    let selectedField : string[] = this.state.selectedField;
    selectedField[level] = filter;
    while(++level<selectedField.length) {
      selectedField[level]=undefined;
    }
    this.setState({selectedField});
  }

  insertField() : void {
    this.editor.setContent('lala');
  }

  async print() : Promise<void> {
    let html = await this.editor.getContent();
    alert(html);
  }

  renderTemplateTool() {
    return <View>
      <View style={styles.sideBar}>
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
          <Button title='Insert' onPress={() => this.insertField()}/>
        </FormRow>
      </View>
    </View>
  }

  renderEditor() {
    return <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
      <View style={styles.pageEditor}>
        <Provider>
          <Editor
            ref={ ref => this.editor = ref }
            value={referralHtml}
          />
        </Provider>
      </View>
      {this.renderTemplateTool()}
      <View style={styles.flow}>
          <Button title='Print' onPress={() => this.print()}/>
          <Button title='Email'/>
          <Button title='Fax'/>
      </View>
    </View>
  }

  renderTemplates() {
    const templates : string[] = getAllCodes("referralTemplates");
    return <View style={styles.topFlow}>
      <View>
        <View style={styles.buttonsRowLayout}>
          {templates && templates.map((template: string) => <Button title={template} onPress={() => this.startReferral(template)}/>)}
          <Button title='Blank' onPress={() => {this.startReferral('')}} />
        </View>
      </View>
    </View>
  }

  render() {
    return <View style={styles.page}>
      {this.state.template?this.renderEditor():this.renderTemplates()}
    </View>
  }

}

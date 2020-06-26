/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Editor, Provider, Tools } from 'react-native-tinymce';
import { styles } from './Styles';
import { Button,TilesField, Label } from './Widgets';
import { FormRow, FormField, FormCode } from './Form';
import { getAllCodes } from './Codes';
import { fetchWinkRest } from './WinkRest';
import type { HtmlDefinition, Referral, ImageBase64Definition } from './Types';
import {allExamIds} from './Visit';
import { getCachedItems } from './DataCache';
import { renderExamHtml } from './Exam';
import { stripDataType } from './Rest';
import { initValues, getImageBase64Definition, patientHeader, patientFooter } from './PatientFormHtml';
import { printHtml, generatePDF } from './Print';
import RNBeep from 'react-native-a-beep';
import { getStore } from './DoctorApp';


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

let referralHtml : string = "Wink";

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
      selectedField: [undefined, undefined, undefined, undefined, undefined],
      htmlDefinition : []
    }
  }
  mapImageWithBase64() {
      const imageBase64Definition : ImageBase64Definition[] = getImageBase64Definition();
      if(imageBase64Definition) {
          for(const base64Image : ImageBase64Definition of imageBase64Definition) {
            let regex = new RegExp(base64Image.key, 'g');
            referralHtml = referralHtml.replace(regex, base64Image.value);
          }
        }
  }
  async startReferral(template: string) {
    let parameters : {} = {};
    const visit: Visit = this.props.navigation.state.params.visit;
    const allExams : string[] = allExamIds(visit);
    let exams: Exam[] = getCachedItems(allExams);
    if(exams) {
      let htmlDefinition : HtmlDefinition[] = [];
      initValues();
      for(const exam : Exam of exams) {
          if(exam.isHidden!==true) {
              await renderExamHtml(exam,htmlDefinition);
            }
        }

      let body : {} = {
        'htmlDefinition': htmlDefinition,
        'visitId': stripDataType(visit.id)
      };

      let response = await fetchWinkRest('webresources/template/'+template, parameters, 'POST', body);
      if (response) {
        const htmlContent : Referral = response;
        let htmlHeader: string = patientHeader();
        let htmlEnd: string = patientFooter();

        referralHtml = htmlHeader + htmlContent.content + htmlEnd;
        this.mapImageWithBase64();

        this.setState({template, htmlDefinition});
      }
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

  async insertField() : void {

    const testKey : string = '{exam.RxToOrder.Final Rx}'; // THIS IS ONLY FOR TESTING, SHOULD BE REMOVED AFTER THE KEY SELECTION IS DYNAMIC
    let parameters : {} = {};
    const visit: Visit = this.props.navigation.state.params.visit;
    let htmlDefinition : HtmlDefinition[] = this.state.htmlDefinition;

      let body : {} = {
        'htmlDefinition': htmlDefinition,
        'visitId': stripDataType(visit.id)
      };

    let response = await fetchWinkRest('webresources/template/key/'+testKey, parameters, 'POST', body);
    if (response) {
        const htmlContent : Referral = response;
        let htmlHeader: string = patientHeader();
        let htmlEnd: string = patientFooter();
        this.editor.setContent(htmlHeader + htmlContent.content + htmlEnd);
      }
  }

  async print() : Promise<void> {
    let html = await this.editor.getContent();
    let htmlHeader: string = patientHeader();
    let htmlEnd: string = patientFooter();
    html = htmlHeader + html + htmlEnd;
    await printHtml(html);
  }

  async save() : Promise<void> {
    let html = await this.editor.getContent();
    let htmlHeader: string = patientHeader();
    let htmlEnd: string = patientFooter();
    let parameters : {} = {};
    const visit: Visit = this.props.navigation.state.params.visit;
    let file = await generatePDF(htmlHeader + html + htmlEnd, true);
    let body : {} = {
        'htmlReferral': html,
        'visitId': stripDataType(visit.id),
        'doctorId': 1, // To be replaced with the current selected doctor
        'attachment': file.base64
      };

      let response = await fetchWinkRest('webresources/template/save/'+this.state.template, parameters, 'POST', body);
  }

  async email() : Promise<void> {

       let html = await this.editor.getContent();
       let htmlHeader: string = patientHeader();
       let htmlEnd: string = patientFooter();
       html = htmlHeader + html + htmlEnd;
       let parameters : {} = {};
       const visit: Visit = this.props.navigation.state.params.visit;
       let file = await generatePDF(html, true);
       let body : {} = {
            'visitId': stripDataType(visit.id),
            'doctorId': 1, // To be replaced with the current selected doctor
            'attachment': file.base64
          };

      let response = await fetchWinkRest('webresources/template/email/'+this.state.template, parameters, 'POST', body);    
      if (response) {
        RNBeep.PlaySysSound(RNBeep.iOSSoundIDs.MailSent);
      }   
  }

    async fax() : Promise<void> {

       let html = await this.editor.getContent();
       let htmlHeader: string = patientHeader();
       let htmlEnd: string = patientFooter();
       html = htmlHeader + html + htmlEnd;
       let parameters : {} = {};
       const visit: Visit = this.props.navigation.state.params.visit;
       let file = await generatePDF(html, true);
       let body : {} = {
            'visitId': stripDataType(visit.id),
            'doctorId': 1, // To be replaced with the current selected doctor
            'attachment': file.base64,
            'isFax': true
          };

      let response = await fetchWinkRest('webresources/template/email/'+this.state.template, parameters, 'POST', body);    
      if (response) {
        RNBeep.PlaySysSound(RNBeep.iOSSoundIDs.MailSent);
      }   
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
          <Button title='Email' onPress={() => this.email()} />
          {getStore().eFaxUsed && <Button title='Fax' onPress={() => this.fax()}/>}
          <Button title='Save' onPress={() => {this.save()}}/>
      </View>
    </View>
  }

  renderTemplates() {
    const templates : string[] = getAllCodes("referralTemplates");
    return <View style={styles.page}>
      <View>
        <View style={styles.tabCard}>
          <Text style={styles.cardTitle}>New Referral</Text>
          <View style={styles.boardM}>
            <View style={styles.formRow}>
              <View style={styles.formRowHeader}><Label value={'Referring patient to '}/></View>
              <FormCode code="doctors" />
            </View>
          </View>
          <View style={styles.buttonsRowStartLayout}>
          {templates && templates.map((template: string) => <Button title={template} onPress={() => this.startReferral(template)}/>)}
          <Button title='Blank' onPress={() => {this.startReferral('')}} />
        </View>
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

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
import type { HtmlDefinition, ReferralDocument, ImageBase64Definition, ReferralDefinition } from './Types';
import {allExamIds} from './Visit';
import { getCachedItems } from './DataCache';
import { renderExamHtml } from './Exam';
import { stripDataType } from './Rest';
import { initValues, getImageBase64Definition, patientHeader, patientFooter } from './PatientFormHtml';
import { printHtml, generatePDF } from './Print';
import RNBeep from 'react-native-a-beep';
import { getStore } from './DoctorApp';
import { isEmpty } from './Util';
import { strings } from './Strings';

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
  selectedField: ?string[],
  key: ? string,
  doctorId: ? number | string,
  id: ? number | string,
  isActive: ? boolean
};



export class ReferralScreen extends Component<ReferralScreenProps, ReferralScreenState> {
  editor;

  constructor(props: ReferralScreenProps) {
    super(props);

    this.state = {
      template: undefined,
      selectedField: [undefined, undefined, undefined, undefined, undefined],
      htmlDefinition : [],
      isActive: true
    }
  }
  mapImageWithBase64(template?:string) {
      const imageBase64Definition : ImageBase64Definition[] = getImageBase64Definition();
      if(imageBase64Definition) {
          for(const base64Image : ImageBase64Definition of imageBase64Definition) {
            let regex = new RegExp(base64Image.key, 'g');
            if(template) {
              template = template.replace(regex, base64Image.value);
            }else{
              referralHtml = referralHtml.replace(regex, base64Image.value);
            }
          }
        }
       return template;
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
        'visitId': stripDataType(visit.id),
        'doctorId': this.state.doctorId
      };

      let response = await fetchWinkRest('webresources/template/'+template, parameters, 'POST', body);
      if (response) {
        const htmlContent : ReferralDocument = response;
        let htmlHeader: string = patientHeader();
        let htmlEnd: string = patientFooter();

        referralHtml = htmlHeader + htmlContent.content + htmlEnd;
        this.mapImageWithBase64();

        this.setState({template, htmlDefinition});
      }
    }

  }

  selectField(level: number, filter: string, options: any) {
    let selectedField : string[] = this.state.selectedField;
    selectedField[level] = filter;
    while(++level<selectedField.length) {
      selectedField[level]=undefined;
    }
    let cleanSelectedField: string[] = selectedField.filter((field : string) => isEmpty(field) === false);
    let keyArray : string[] = [];
    for(const field : string of cleanSelectedField) {
      const formatted = options[field] === undefined ? options['keySpec'] : options[field]['keySpec'];

    if(formatted)
       keyArray.push(formatted);
    else 
        keyArray.push(field);
    }
    let key = keyArray.join('.');
    this.setState({selectedField});
    this.setState({key});

  }

    updateValue(newValue: any) {
      this.setState({doctorId: newValue});
    }

  async insertField() : void {
    const key  : string =this.state.key;
    let parameters : {} = {};
    const visit: Visit = this.props.navigation.state.params.visit;
    let htmlDefinition : HtmlDefinition[] = this.state.htmlDefinition;

      let body : {} = {
        'htmlDefinition': htmlDefinition,
        'visitId': stripDataType(visit.id),
        'doctorId': this.state.doctorId
      };

    let response = await fetchWinkRest('webresources/template/key/'+'{'+key+'}', parameters, 'POST', body);
    if (response) {
        const htmlContent : ReferralDocument = response;
        let htmlHeader: string = patientHeader();
        let htmlEnd: string = patientFooter();
        let html = this.mapImageWithBase64(htmlContent.content);
        this.editor.setContent(htmlHeader + html + htmlEnd);
      }
  }

  async print() : Promise<void> {
    let html = await this.editor.getContent();
    let htmlHeader: string = patientHeader();
    let htmlEnd: string = patientFooter();
    html = htmlHeader + html + htmlEnd;
    await printHtml(html);
    await this.save(2);   

  }

  async save(action?: Number) : Promise<void> {
    let html = await this.editor.getContent();
    let htmlHeader: string = patientHeader();
    let htmlEnd: string = patientFooter();
    let parameters : {} = {};
    const visit: Visit = this.props.navigation.state.params.visit;
    let file = await generatePDF(htmlHeader + html + htmlEnd, true);
    let body : {} = {
        'htmlReferral': html,
        'visitId': stripDataType(visit.id),
        'doctorId': this.state.doctorId,
        'action': action,
        'id': this.state.id,
        'attachment': file.base64
      };

      let response = await fetchWinkRest('webresources/template/save/'+this.state.template, parameters, 'POST', body);
      if(response) {
        let referralDefinition: ReferralDefinition = response;
        let referralId = stripDataType(referralDefinition.id);
        this.setState({id: referralId});
      }
  }

  async email() : Promise<void> {
       this.setState({isActive: false});
       let html = await this.editor.getContent();
       let htmlHeader: string = patientHeader();
       let htmlEnd: string = patientFooter();
       html = htmlHeader + html + htmlEnd;
       let parameters : {} = {};
       const visit: Visit = this.props.navigation.state.params.visit;
       let file = await generatePDF(html, true);
       let body : {} = {
            'visitId': stripDataType(visit.id),
            'doctorId': this.state.doctorId,
            'attachment': file.base64
          };

      let response = await fetchWinkRest('webresources/template/email/'+this.state.template, parameters, 'POST', body);    
      if (response) {
        await this.save(0);  
        RNBeep.PlaySysSound(RNBeep.iOSSoundIDs.MailSent);
        alert(strings.formatString(strings.emailSuccess, response.recipients));
      }
      this.setState({isActive: true});
  }

    async fax() : Promise<void> {
       this.setState({isActive: false});
       let html = await this.editor.getContent();
       let htmlHeader: string = patientHeader();
       let htmlEnd: string = patientFooter();
       html = htmlHeader + html + htmlEnd;
       let parameters : {} = {};
       const visit: Visit = this.props.navigation.state.params.visit;
       let file = await generatePDF(html, true);
       let body : {} = {
            'visitId': stripDataType(visit.id),
            'doctorId': this.state.doctorId,
            'attachment': file.base64,
            'isFax': true
          };

      let response = await fetchWinkRest('webresources/template/email/'+this.state.template, parameters, 'POST', body);    
      if (response) {
        await this.save(1);
        RNBeep.PlaySysSound(RNBeep.iOSSoundIDs.MailSent);
        alert(strings.formatString(strings.faxSuccess, response.recipients));
      }
      this.setState({isActive: true});   
  }

  renderTemplateTool() {
    return <View>
      <View style={styles.sideBar}>
        {this.state.selectedField.map((fieldName: string, index: number) => {
          const prevValue : ?string = index>0?this.state.selectedField[index-1]:'';
          if (prevValue===undefined || prevValue===null) return undefined;
          
          let options  = getAllCodes("dynamicFields");
          for (let i:number =1; i<=index; i++) {
            if (options) {
              options = options[this.state.selectedField[i-1]];
            }
          }
          let optionsKeys = Object.keys(options);
          optionsKeys = optionsKeys.filter((oKey: string) => oKey !== 'keySpec');
          if (optionsKeys===undefined || optionsKeys===null || optionsKeys.length===0) return undefined;
          return <FormRow>
              <TilesField label='Filter'
                options={optionsKeys}
                value={this.state.selectedField[index]}
                onChangeValue={(value: string) => this.selectField(index, value, options)}
              />
            </FormRow>
          })
        }
        <FormRow>
          <Button title='Insert' onPress={() => this.insertField()}/>
        </FormRow>
      </View>
      <View style={styles.sideBar}>
          <View style={styles.formRow}>
            <View style={styles.formRowHeader}><Label value={strings.referringPatientTo}/></View>
          </View>
           <View style={styles.formRow}>
              <FormCode code="doctors" value={this.state.doctorId}  onChangeValue={(code: ?string|?number) => this.updateValue(code)} />
            </View>
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
          <Button title='Print' onPress={() => this.print()} disabled={!this.state.isActive}/>
          <Button title='Email' onPress={() => this.email()} disabled={!this.state.isActive} />
          {getStore().eFaxUsed && <Button title='Fax' onPress={() => this.fax()} disabled={!this.state.isActive}/>}
          <Button title='Save' onPress={() => {this.save()}} disabled={!this.state.isActive}/>
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
              <View style={styles.formRowHeader}><Label value={strings.referringPatientTo}/></View>
              <FormCode code="doctors" value={this.state.doctorId}  onChangeValue={(code: ?string|?number) => this.updateValue(code)} />
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

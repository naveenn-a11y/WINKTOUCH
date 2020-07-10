/**
 * @flow
 */
'use strict';

import type { Visit } from './Types';

import React, { Component } from 'react';
import { View, Text, ScrollView, Modal, TouchableWithoutFeedback } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { styles } from './Styles';
import { Button,TilesField, Label, SelectionList } from './Widgets';
import { FormRow, FormTextInput, FormField, FormCode } from './Form';
import { getAllCodes, getCodeDefinition } from './Codes';
import { fetchWinkRest } from './WinkRest';
import type { HtmlDefinition, ReferralDocument, ImageBase64Definition, ReferralDefinition, CodeDefinition, EmailDefinition} from './Types';
import {allExamIds} from './Visit';
import { getCachedItems } from './DataCache';
import { renderExamHtml, getExam } from './Exam';
import { stripDataType } from './Rest';
import { initValues, getImageBase64Definition, patientHeader, patientFooter } from './PatientFormHtml';
import { printHtml, generatePDF } from './Print';
import RNBeep from 'react-native-a-beep';
import { getStore } from './DoctorApp';
import { isEmpty } from './Util';
import { strings } from './Strings';
import { HtmlEditor } from './HtmlEditor';

let referralHtml : string = "";

export function setReferralHtml(html: string) {
  referralHtml = html;
}

const COMMAND = {
  EMAIL: 0,
  FAX: 1,
  PRINT: 2
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
  isActive: ? boolean,
  emailDefinition : ? EmailDefinition,
  command: COMMAND,
  isPopupVisibile: ? boolean,
};



export class ReferralScreen extends Component<ReferralScreenProps, ReferralScreenState> {
  editor;

  constructor(props: ReferralScreenProps) {
    super(props);

    this.state = {
      template: undefined,
      selectedField: [undefined, undefined, undefined, undefined, undefined],
      htmlDefinition : [],
      isActive: true,
      emailDefinition: {},
      command: undefined,
      isPopupVisibile: false
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
        this.updateFieldSubject(htmlContent.subject);
        this.updateFieldBody(htmlContent.body);


      }
    }

  }

  selectField(level: number, value: string, options: any) {
    let selectedField : string[] = this.state.selectedField;
    selectedField[level] = value;
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

  updateFieldCc(newValue: any) {
    let emailDefinition : EmailDefinition =  this.state.emailDefinition;
    if (!emailDefinition) return;
    emailDefinition.cc = newValue;
    this.setState({emailDefinition: emailDefinition});
  }

  updateFieldTo(newValue: any) {
     let emailDefinition : EmailDefinition =  this.state.emailDefinition;
     if (!emailDefinition) return;
     emailDefinition.to = newValue;
     this.setState({emailDefinition: emailDefinition});
  }

  updateFieldSubject(newValue: any) {
    let emailDefinition : EmailDefinition =  this.state.emailDefinition;
    if (!emailDefinition) return;
    emailDefinition.subject = newValue;
    this.setState({emailDefinition: emailDefinition});
  }

  updateFieldBody(newValue: any) {
    let emailDefinition : EmailDefinition =  this.state.emailDefinition;
    if (!emailDefinition) return;
    emailDefinition.body = newValue;
    this.setState({emailDefinition: emailDefinition});
  }

  cancelEdit = () => {
    this.setState({ isActive: true });
    this.setState({ isPopupVisibile: false });
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
    if (response && this.editor) {
        const htmlContent : ReferralDocument = response;
        let htmlHeader: string = patientHeader();
        let htmlEnd: string = patientFooter();
        let html = this.mapImageWithBase64(htmlContent.content);
        this.editor.insertContent(html);
      }
  }

  async print() : Promise<void> {
    this.setState({command: COMMAND.PRINT});
    let html = await this.editor.getContent();
    let htmlHeader: string = patientHeader();
    let htmlEnd: string = patientFooter();
    html = htmlHeader + html + htmlEnd;
    const job = await printHtml(html);
    if(job) {
       await this.save();
    }
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
      'doctorId': this.state.doctorId,
      'action': this.state.command,
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
      if(this.state.doctorId === undefined) {
          alert(strings.doctorReferralMissing);
          return;
      }
       this.setState({isPopupVisibile: true});
       this.setState({command: COMMAND.EMAIL});

  }

  async fax() : Promise<void> {
      if(this.state.doctorId === undefined) {
          alert(strings.doctorReferralMissing);
          return;
      }
       this.setState({isPopupVisibile: true});
       this.setState({command: COMMAND.FAX});

  }

  async send() : Promise<void> {
    if(this.state.command === undefined || this.state.emailDefinition === undefined) {
      return;
    }

    this.setState({isActive: false});
    let html = await this.editor.getContent();
    let htmlHeader: string = patientHeader();
    let htmlEnd: string = patientFooter();
    html = htmlHeader + html + htmlEnd;
    let parameters : {} = {};
    const visit: Visit = this.props.navigation.state.params.visit;
    let file = await generatePDF(html, true);
    let body : {} = {};
    if(this.state.command == COMMAND.EMAIL) {
         body = {
            'visitId': stripDataType(visit.id),
            'doctorId': this.state.doctorId,
            'attachment': file.base64,
            'emailDefinition': this.state.emailDefinition
          };
    }
    else if(this.state.command == COMMAND.FAX) {
          body  = {
            'visitId': stripDataType(visit.id),
            'doctorId': this.state.doctorId,
            'attachment': file.base64,
            'isFax': true,
            'emailDefinition': this.state.emailDefinition
          };
    }

      let response = await fetchWinkRest('webresources/template/email/'+this.state.template, parameters, 'POST', body);
      if (response) {
        await this.save();
        RNBeep.PlaySysSound(RNBeep.iOSSoundIDs.MailSent);
        alert(strings.formatString(strings.referralSuccess, response.recipients));
      }
    this.setState({isActive: true});
    this.setState({isPopupVisibile: false});

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
          if (this.state.selectedField[0]==='Exam' && index===1) {
            const visit: Visit = this.props.navigation.state.params.visit;
            optionsKeys = optionsKeys.filter((examName: string) => {
              const exam = getExam(examName, visit);
              if (!exam) return false;
              let examValue = exam[examName];
              return !isEmpty(examValue);
            });
          }
          optionsKeys = optionsKeys.sort();
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
          <HtmlEditor
            style={styles.page}
            ref={ref => this.editor = ref}
            value={referralHtml}
          />
      </View>
      {this.renderTemplateTool()}

      <View style={styles.flow}>
          <Button title='Print' onPress={() => this.print()} disabled={!this.state.isActive}/>
          <Button title='Email' onPress={() => this.email()} disabled={!this.state.isActive} />
          {getStore() !== undefined && getStore().eFaxUsed && <Button title='Fax' onPress={() => this.fax()} disabled={!this.state.isActive}/>}
      </View>
        {(this.state.command===COMMAND.EMAIL || this.state.command===COMMAND.FAX)
            && <Modal visible={this.state.isPopupVisibile} transparent={true} animationType={'slide'} onRequestClose={this.cancelEdit}>
        {this.renderPopup()}
      </Modal>}
    </View>
  }


  renderPopup() {
        let doctorCode : CodeDefinition = getCodeDefinition('doctors',this.state.doctorId);
        let emailDefinition : EmailDefinition = this.state.emailDefinition;
        const command : COMMAND = this.state.command;
        if(command == COMMAND.EMAIL) {
           emailDefinition.to = doctorCode.email;
        }
        else if(command == COMMAND.FAX) {
           emailDefinition.to = doctorCode.fax;
        }

    return <TouchableWithoutFeedback onPress={this.cancelEdit}>
        <View style={styles.popupBackground}>
          <View style={styles.flowLeft}>
              <Button title={strings.cancel} onPress={this.cancelEdit} disabled={!this.state.isActive} />
              <Button title={strings.send} onPress={() => this.send()} disabled={!this.state.isActive} />
          </View>

          <View style={styles.flexColumnLayout}>
          <View style={styles.form}>
              <FormRow>
              <View style={styles.rowLayout}>
                <FormTextInput label='To' value={emailDefinition.to} readonly={command == COMMAND.FAX} onChangeText={(newValue: string) => this.updateFieldTo(newValue)}/>
              </View>
            </FormRow>
               <FormRow>
              <View style={styles.rowLayout}>
                <FormTextInput label='Cc' value={emailDefinition.cc}  readonly={command == COMMAND.FAX} onChangeText={(newValue: string) => this.updateFieldCc(newValue)}/>
              </View>
            </FormRow>
            <FormRow>
              <View style={styles.rowLayout}>
                <FormTextInput label='Subject' value={emailDefinition.subject} readonly={command == COMMAND.FAX} onChangeText={(newValue: string) => this.updateFieldSubject(newValue)}/>
              </View>
            </FormRow>
            <FormRow>
            <View style={styles.rowLayout}>
              <FormTextInput multiline={true} label='Body' value={emailDefinition.body} readonly={command == COMMAND.FAX} onChangeText={(newValue: string) => this.updateFieldBody(newValue)} />
            </View>
            </FormRow>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
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
          <View style={styles.flow}>
          {templates && templates.map((template: string) => <Button title={template} onPress={() => this.startReferral(template)}/>)}
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

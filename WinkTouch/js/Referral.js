/**
 * @flow
 */
'use strict';

import type { Visit } from './Types';

import React, { Component } from 'react';
import { View, Text, ScrollView, Modal, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { styles, selectionColor } from './Styles';
import { Button,TilesField, Label, SelectionList } from './Widgets';
import { FormRow, FormTextInput, FormField, FormCode } from './Form';
import { getAllCodes, getCodeDefinition } from './Codes';
import { fetchWinkRest } from './WinkRest';
import type { HtmlDefinition, ReferralDocument, ImageBase64Definition, ReferralDefinition, CodeDefinition, EmailDefinition, FollowUp} from './Types';
import {allExamIds} from './Visit';
import { getCachedItems } from './DataCache';
import { renderExamHtml, getExam, UserAction } from './Exam';
import { stripDataType } from './Rest';
import { initValues, getImageBase64Definition, patientHeader, patientFooter } from './PatientFormHtml';
import { printHtml, generatePDF } from './Print';
import RNBeep from 'react-native-a-beep';
import { getStore } from './DoctorApp';
import { isEmpty, sort } from './Util';
import { strings } from './Strings';
import { HtmlEditor } from './HtmlEditor';
import {FollowUpScreen} from './FollowUp';
import { NavigationActions } from 'react-navigation';
import { useFocusEffect } from '@react-navigation/native';
import { getVisitHistory } from './Visit';


export function isReferralsEnabled() : boolean {
  const referralTemplates: string[] = getAllCodes("referralTemplates");
  if (referralTemplates===undefined || referralTemplates===null || referralTemplates.length===0) return false;
  return true;
}


const COMMAND = {
  EMAIL: 0,
  FAX: 1,
  PRINT: 2,
  SIGN: 3,
  SAVE: 4
}

type ReferralScreenProps = {
  navigation: any
};

type ReferralScreenState = {
  template: ?string,
  selectedField: ?string[],
  key: ? string,
  doctorId: ? number | string,
  doctorReferral: ? ReferralDefinition,
  linkedDoctorReferral: ? ReferralDefinition,
  isActive: ? boolean,
  emailDefinition : ? EmailDefinition,
  command: COMMAND,
  isPopupVisibile: ? boolean,
  hasSignatureField: ? boolean,
  isDirty: boolean,
  followUpStateKey: string,
  isLoading: boolean,
  referralHtml: string
};



export class ReferralScreen extends Component<ReferralScreenProps, ReferralScreenState> {
  editor;
  unmounted: boolean;

  constructor(props: ReferralScreenProps) {
    super(props);
    this.state = {
      template: (this.props.navigation && this.props.navigation.state && this.props.navigation.state.params && this.props.navigation.state.params.referral && this.props.navigation.state.params.referral.referralTemplate && !this.props.navigation.state.params.followUp)?this.props.navigation.state.params.referral.referralTemplate.template : undefined,
      selectedField: [undefined, undefined, undefined, undefined, undefined],
      htmlDefinition : [],
      doctorReferral: {id: (this.props.navigation && this.props.navigation.state && this.props.navigation.state.params && this.props.navigation.state.params.referral && !this.props.navigation.state.params.followUp)?stripDataType(this.props.navigation.state.params.referral.id):undefined},
      linkedDoctorReferral: {id: (this.props.navigation && this.props.navigation.state && this.props.navigation.state.params && this.props.navigation.state.params.referral &&  this.props.navigation.state.params.followUp)?stripDataType(this.props.navigation.state.params.referral.id):undefined},
      isActive: true,
      emailDefinition: {},
      command: undefined,
      isPopupVisibile: false,
      hasSignatureField: false,
      doctorId: (this.props.navigation && this.props.navigation.state && this.props.navigation.state.params && this.props.navigation.state.params.referral)?stripDataType(this.props.navigation.state.params.referral.doctorId):undefined,
      isDirty: false,
      followUpStateKey: (this.props.navigation && this.props.navigation.state && this.props.navigation.state.params)?this.props.navigation.state.params.followUpStateKey:undefined,
      isLoading: false,
      referralHtml: ''
      }
    this.unmounted = false;

  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  getPreviousVisits() {

  const patientInfo: PatientInfo  = this.props.navigation.state.params.patientInfo;
  if(patientInfo === undefined) return;

  let visitHistory : ?Visit[] = getVisitHistory(patientInfo.id);
  console.log("VISIT HISTORY: " + JSON.stringify(visitHistory));

  }
  // We need to upgrade react-navigation to have this code working
/*
  componentDidMount() {
  this.focusListener = this.props.navigation.addListener('didFocus', () => {
        this.shouldStartReferral();
  });
  }
*/
  async componentDidUpdate(prevProps: any) {
          if(!this.props.navigation.isFocused()) {
            const isDirty = this.editor !== undefined ? await this.editor.isDirty() : false;
            if(this.state.template && (isDirty || !(this.state.doctorReferral && this.state.doctorReferral.id))) {
                 await this.save();
            }
          }

    }

  mapImageWithBase64(template?:string) {
      let referralHtml : string = this.state.referralHtml;
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
        if(referralHtml !== this.state.referralHtml) {
          this.setState(referralHtml);
        }
       return template;
  }
  async startReferral(template?: string) {
    this.setState({ isLoading: true });
    let parameters : {} = {};
    const visit: Visit = this.props.navigation.state.params.visit;
    const allExams : string[] = allExamIds(visit);
    let exams: Exam[] = getCachedItems(allExams);
    this.updateReferral();
    if(exams) {
      let htmlDefinition : HtmlDefinition[] = [];
      initValues();
      for(const exam : Exam of exams) {
          if(exam.isHidden!==true) {
              await renderExamHtml(exam,htmlDefinition, UserAction.REFERRAL);
            }
        }

     let body : {} = {};

     if(this.state.doctorReferral && this.state.doctorReferral.id) {
        body = {
        'htmlDefinition': htmlDefinition,
        'visitId': stripDataType(visit.id),
        'doctorId': this.state.doctorId,
        'id': stripDataType(this.state.doctorReferral.id)
      };
      }
      else {
        body = {
        'htmlDefinition': htmlDefinition,
        'visitId': stripDataType(visit.id),
        'doctorId': stripDataType(this.state.doctorId),
        'name': template,
        
      };
      }

      let response = await fetchWinkRest('webresources/template', parameters, 'POST', body);
      if (response) {
        if (response.errors) {
              alert(response.errors);
              return;
        }
        const htmlContent : ReferralDocument = response;
        let htmlHeader: string = patientHeader();
        let htmlEnd: string = patientFooter();
        template = (this.props.navigation && this.props.navigation.state && this.props.navigation.state.params && this.props.navigation.state.params.referral &&
                   this.props.navigation.state.params.referral.referralTemplate &&!this.props.navigation.state.params.followUp)?this.props.navigation.state.params.referral.referralTemplate.template : template;
        const referralHtml = htmlHeader + htmlContent.content + htmlEnd;
        this.mapImageWithBase64();
        this.updateFieldSubject(htmlContent.subject);
        this.updateFieldBody(htmlContent.body);
        this.updateSignatureState(htmlContent.content);
        this.setState({template, htmlDefinition, referralHtml});
      }
    }
    this.setState({ isLoading: false });

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
    this.getPreviousVisits();
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
    if(isEmpty(key)) {
      return;
    }
    this.setState({ isLoading: true });
    let parameters : {} = {};
    const visit: Visit = this.props.navigation.state.params.visit;
    let htmlDefinition : HtmlDefinition[] = this.state.htmlDefinition;

      let body : {} = {
        'htmlDefinition': htmlDefinition,
        'visitId': stripDataType(visit.id),
        'doctorId': stripDataType(this.state.doctorId)
      };

    let response = await fetchWinkRest('webresources/template/key/'+'{'+key+'}', parameters, 'POST', body);
    if (response && this.editor) {
        if (response.errors) {
              alert(response.errors);
              this.setState({ isLoading: false });
              return;
        }
        const htmlContent : ReferralDocument = response;
        let htmlHeader: string = patientHeader();
        let htmlEnd: string = patientFooter();
        let html = this.mapImageWithBase64(htmlContent.content);
        this.editor.insertContent(html);
        this.updateSignatureState(html);
        this.updateReferral();
      }
    this.setState({ isLoading: false });

  }

  async updateSignatureState(html: string) {
    if (!html) {
      if (this.state.hasSignatureField) {
        this.setState({hasSignatureField: false});
      }
    }
    const hasSignatureField : boolean = html.includes(".DigitalSignature}");
    if (this.state.hasSignatureField!=hasSignatureField) {
      this.setState({hasSignatureField});
    }
  }

  async sign() : Promise<void> {
    this.setState({ isLoading: true });
    let html = await this.editor.getContent();
    let parameters : {} = {};
    const visit: Visit = this.props.navigation.state.params.visit;
    let htmlDefinition : HtmlDefinition[] = this.state.htmlDefinition;
      let body : {} = {
        'htmlReferral': html,
        'visitId': stripDataType(visit.id)
     };

    let response = await fetchWinkRest('webresources/template/sign', parameters, 'POST', body);
    this.setState({ isLoading: false });
    if (response && this.editor) {
        if (response.errors) {
              alert(response.errors);
        } else {
            const htmlContent : ReferralDocument = response;
            const referralHtml = htmlContent.content;
            this.editor.setContent(referralHtml);
            this.updateSignatureState(referralHtml);
            this.setState({command: COMMAND.SIGN, referralHtml: referralHtml});
            await this.save();
          }
      }
  }

  async print() : Promise<void> {
    this.updateReferral();
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

  async save() : Promise<any> {
    let html = await this.editor.getContent();
    let htmlHeader: string = patientHeader();
    let htmlEnd: string = patientFooter();
    let parameters : {} = {};
    const visit: Visit = this.props.navigation.state.params.visit;

    let file = await generatePDF(htmlHeader + html + htmlEnd, true);
    let referralId = undefined;
    let linkedReferralId = undefined;

    if(this.state.doctorReferral !== undefined) {
      if(stripDataType(this.state.doctorReferral.id) > 0) {
        referralId = stripDataType(this.state.doctorReferral.id);
      }
    }
    if(this.state.linkedDoctorReferral !== undefined) {
      if(stripDataType(this.state.linkedDoctorReferral.id) > 0) {
        linkedReferralId = stripDataType(this.state.linkedDoctorReferral.id);
      }
    }

    let body : {} = {
      'htmlReferral': html,
      'visitId': stripDataType(visit.id),
      'doctorId': stripDataType(this.state.doctorId),
      'action': this.state.command,
      'id': referralId,
      'linkedReferralId': linkedReferralId,
      'attachment': file.base64,
      'name': this.state.template
     };
    let response = await fetchWinkRest('webresources/template/save', parameters, 'POST', body);
    if(response) {
      if (response.errors) {
              alert(response.errors);
              return;
       } else {
         if(this.editor) {
           this.editor.setDirty(false);
         }
       }

      let referralDefinition: ReferralDefinition = response;
      if (this.state.followUpStateKey) { 
      const setParamsAction = NavigationActions.setParams({
                   params: { refreshFollowUp: true },
                    key: this.state.followUpStateKey
                  })
      this.props.navigation.dispatch(setParamsAction);
        }
      if(this.unmounted) {
        return  referralDefinition;  
      }
      else {
      this.setState({doctorReferral: referralDefinition});
      this.setState({isDirty: response.errors!==undefined});
      }
    }

  }

   updateReferral ()  {
    this.setState({isDirty:true});
  }


  async saveAction() : Promise<void> {
       this.setState({command: COMMAND.SAVE});
       await this.save();
       this.props.navigation.goBack();
  }

  async email() : Promise<void> {
      if(this.state.doctorId === undefined || this.state.doctorId <= 0) {
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
    this.updateReferral();
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
            'doctorId': stripDataType(this.state.doctorId),
            'attachment': file.base64,
            'emailDefinition': this.state.emailDefinition,
            'doctorReferral': this.state.doctorReferral
          };
    }
    else if(this.state.command == COMMAND.FAX) {
          body  = {
            'visitId': stripDataType(visit.id),
            'doctorId': stripDataType(this.state.doctorId),
            'attachment': file.base64,
            'isFax': true,
            'emailDefinition': this.state.emailDefinition,
            'doctorReferral': this.state.doctorReferral
          };
    }

      let response = await fetchWinkRest('webresources/template/email', parameters, 'POST', body);
      if (response) {
          if (response.errors) {
              alert(response.errors);
          }
          else {
              RNBeep.PlaySysSound(RNBeep.iOSSoundIDs.MailSent);
              this.setState({isPopupVisibile: false});
              await this.save();
          }
      }
    this.setState({isActive: true});

  }


  renderTemplateTool() {
    return <View style={styles.sideBar}>
        <View style={styles.formRow}>
          <View style={styles.formRowHeader}><Label value={strings.referringPatientTo}/></View>
        </View>
         <View style={styles.formRow}>
            <FormCode code="doctors" value={this.state.doctorId<=0?"" : this.state.doctorId} showLabel={false} label={strings.referringPatientTo} onChangeValue={(code: ?string|?number) => this.updateValue(code)} />
        </View>
        <View style={styles.formRow}>
          <View style={styles.formRowHeader}><Label value={strings.dynamicField}/></View>
        </View>
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
          if (optionsKeys===undefined || optionsKeys===null || optionsKeys.length===0) return undefined;
          sort(optionsKeys);
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
  }

  renderEditor() {
    return <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
      <View style={styles.pageEditor}>
          <HtmlEditor
            style={styles.page}
            ref={ref => this.editor = ref}
            value={this.state.referralHtml}
          />
      </View>
      {this.renderTemplateTool()}

      <View style={styles.flow}>
          <Button title={strings.sign} disabled={this.state.hasSignatureField!==true} onPress={() => this.sign()}/>
          <Button title='Print' onPress={() => this.print()} disabled={!this.state.isActive}/>
          <Button title='Email' onPress={() => this.email()} disabled={!this.state.isActive} />
          {getStore() !== undefined && getStore().eFaxUsed && <Button title='Fax' onPress={() => this.fax()} disabled={!this.state.isActive}/>}
          <Button title='Save' onPress={() => this.saveAction()} disabled={!this.state.isActive} />
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
           emailDefinition.to = doctorCode !== undefined ? doctorCode.email : "";
        }
        else if(command == COMMAND.FAX) {
           emailDefinition.to = doctorCode !== undefined ?doctorCode.fax : "";
        }

    return <TouchableWithoutFeedback onPress={this.cancelEdit}>
        <View style={styles.popupBackground}>

          <View style={styles.flexColumnLayout}>
          <View style={styles.form}>
              <FormRow>
              <View style={styles.rowLayout}>
                <FormTextInput label='To' value={emailDefinition.to} readonly={true} onChangeText={(newValue: string) => this.updateFieldTo(newValue)}/>
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
            <View style={styles.flow}>
                <Button title={strings.cancel} onPress={this.cancelEdit} disabled={!this.state.isActive} />
                <Button title={strings.send} onPress={() => this.send()} disabled={!this.state.isActive} />
            </View>
          </View>

        </View>

      </View>
    </TouchableWithoutFeedback>
  }

  renderTemplates() {
    const templates : string[] = getAllCodes("referralTemplates");

    return (
    <View style={styles.page}>
        {this.renderSavedFollowUp()}
      <View style={styles.separator}>
        <View style={styles.tabCard}>
          <Text style={styles.cardTitle}>New Referral</Text>
          <View style={styles.boardM}>
            <View style={styles.formRow}>
              <FormCode code="doctors" value={this.state.doctorId<=0?"" : this.state.doctorId} label={strings.referringPatientTo} onChangeValue={(code: ?string|?number) => this.updateValue(code)} />
            </View>
          </View>
          <View style={styles.flow}>
          {templates && templates.map((template: string) => <Button title={template} onPress={() => this.startReferral(template)}/>)}
        </View>
      </View>
    </View>
    </View>
    )
  }

  renderLoading() {
    if(this.state.isLoading) {
    return(
      <Modal visible={this.state.isLoading} transparent={true} animationType={'none'} onRequestClose={this.cancelEdit}>
             <View style={[styles.popupBackground,{justifyContent: 'center', alignItems: 'center'}]}>
          {this.state.isLoading && <ActivityIndicator size="large" color={selectionColor} />}
            </View>
      </Modal>

    )
    }
    return null;
  }

  renderSavedFollowUp() {
    const followUp: Boolean = this.props.navigation.state.params.followUp;
    return (
        !followUp && <FollowUpScreen patientInfo = {this.props.navigation.state.params.patientInfo} navigation = {this.props.navigation} isDraft = {true}  />
    )
  }

  shouldStartReferral()  {
    let doctorReferral : ReferralDefinition = this.state.doctorReferral;
    let linkedDoctorReferral : ReferralDefinition = this.state.linkedDoctorReferral;

    const followUp: Boolean = this.props.navigation.state.params.followUp;

     const params = (this.props.navigation && this.props.navigation.state && this.props.navigation.state.params) ? this.props.navigation.state.params : undefined;
     if(params) {
       if(params.referral && !(doctorReferral && doctorReferral.id) && !followUp) {
           doctorReferral  = {id: params.referral.id};
           this.setState({doctorReferral: doctorReferral});
       }
        if(params.referral && !(linkedDoctorReferral && linkedDoctorReferral.id) && followUp) {
           linkedDoctorReferral  = {id: params.referral.id};
           this.setState({linkedDoctorReferral: linkedDoctorReferral});
       }
        if(params.referral && isEmpty(this.state.doctorId)) {
           linkedDoctorReferral  = {id: params.referral.id};
           this.setState({doctorId: stripDataType(this.props.navigation.state.params.referral.doctorId)});
       }
     }
     if(((doctorReferral && doctorReferral.id) || this.state.template) && !followUp && !this.state.isDirty && isEmpty(this.state.referralHtml)) {
          this.startReferral();
      }
  } 

   render() {
    let doctorReferral : ReferralDefinition = this.state.doctorReferral;
    this.shouldStartReferral();
    return <View style={styles.page}>
      {this.renderLoading()}
      {(this.state.template || (doctorReferral && doctorReferral.id)) ?this.renderEditor():this.renderTemplates()}
    </View>
  }
}

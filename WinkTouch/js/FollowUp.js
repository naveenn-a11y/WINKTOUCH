/**
 * @flow
 */
'use strict';

import type { Visit } from './Types';

import React, { Component } from 'react';
import ReactNative, { View, Text, Image, LayoutAnimation, TouchableHighlight, ScrollView, Modal, Dimensions,
  TouchableOpacity, TouchableWithoutFeedback, InteractionManager, TextInput, Keyboard, FlatList, NativeModules, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { styles, fontScale, selectionColor, selectionFontColor, fieldBorderColor } from './Styles';
import { Button,TilesField, Label, SelectionList } from './Widgets';
import { FormRow, FormTextInput, FormField, FormCode } from './Form';
import { getAllCodes, getCodeDefinition, formatCode } from './Codes';
import { fetchWinkRest } from './WinkRest';
import type { PatientInfo, HtmlDefinition, ReferralDocument, ImageBase64Definition, ReferralDefinition, CodeDefinition, EmailDefinition, FollowUp, ReferralStatusCode, Upload} from './Types';
import {allExamIds, fetchReferralFollowUpHistory} from './Visit';
import { getCachedItems, getCachedItem, cacheItem } from './DataCache';

import { stripDataType } from './Rest';
import RNBeep from 'react-native-a-beep';
import { getStore, getDoctor } from './DoctorApp';
import { strings } from './Strings';
import {  getMimeType } from './Upload';
import { printHtml, generatePDF } from './Print';
import { deAccent, isEmpty, formatDate, jsonDateFormat} from './Util';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { fetchPatientInfo } from './Patient';


const COMMAND = {
  RESEND: 0,
  REPLY: 1,
  FORWARD: 2
  }

type FollowUpScreenProps = {
  navigation: any,
  patientInfo: PatientInfo,
  isDraft: boolean,
  onUpdateVisitSelection: (selectedVisitId: string) => void
};

type FollowUpScreenState = {
    doctorReferral: ReferralDefinition,
    allFollowUp: FollowUp[],
    selectedItem: FollowUp,
    allRefStatusCode: ReferralStatusCode[],
    isActive: ? boolean,
    isPopupVisibile: ? boolean,
    emailDefinition : ? EmailDefinition,
    command: COMMAND,
    isDirty: boolean
};


export class FollowUpScreen extends Component<FollowUpScreenProps, FollowUpScreenState> {
  editor;

  constructor(props: FollowUpScreenProps) {
    super(props);

    this.state = {
      doctorReferral: {},
      isActive: true,
      isPopupVisibile: false,
      allFollowUp: [],
      selectedItem: undefined,
      allRefStatusCode: [],
      emailDefinition: {},
      command: undefined,
      isDirty: false
      }

  }

  async send() : Promise<void> {
    if(this.state.emailDefinition === undefined) {
      return;
    }
    this.setState({isActive: false});
    let parameters : {} = {};
    const referral: FollowUp = this.state.selectedItem;
    let isFax: Boolean = false;
    if(this.state.command == COMMAND.RESEND && !isEmpty(referral.faxedOn)&& isEmpty(referral.emailOn)) {
        isFax = true;
    }

    let body = {
            'visitId': stripDataType(this.state.selectedItem.visitId),
            'doctorId': stripDataType(referral.doctorId),
            'emailDefinition': this.state.emailDefinition,
            'doctorReferral': this.state.doctorReferral,
            'action': this.state.command,
            'isFax': isFax
          };


      let response = await fetchWinkRest('webresources/template/email', parameters, 'POST', body);
      if (response) {
          if (response.errors) {
              alert(response.errors);
          }
          else {
              RNBeep.PlaySysSound(RNBeep.iOSSoundIDs.MailSent);
              this.setState({isPopupVisibile: false,  emailDefinition: {}});
          }
      }
    this.setState({isActive: true});
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

  reply() : Promise<void> {
      if(this.state.selectedItem === undefined) {
          alert('item not selected');
          return;
      }
      let emailDefinition : EmailDefinition =  this.state.emailDefinition;
      const selectedItem : FollowUp = this.state.selectedItem;
      if(selectedItem.doctorId === undefined || selectedItem.doctorId <= 0 || isEmpty(selectedItem.doctorId)) {
          alert(strings.doctorReferralMissing);
          return;
      }
      emailDefinition.to = selectedItem.from.email;
       this.setState({emailDefinition: emailDefinition, isPopupVisibile: true, command: COMMAND.REPLY});

  }

 resend() : Promise<void> {
      if(this.state.selectedItem === undefined) {
          alert('item not selected');
          return;
      }
      let emailDefinition : EmailDefinition =  this.state.emailDefinition;
      const selectedItem : FollowUp = this.state.selectedItem;
      if(selectedItem.doctorId === undefined || selectedItem.doctorId <= 0 || isEmpty(selectedItem.doctorId)) {
          alert(strings.doctorReferralMissing);
          return;
      }
      if(!isEmpty(selectedItem.faxedOn) && isEmpty(selectedItem.emailOn)) {
              emailDefinition.to = selectedItem.to.fax;
        } else {
              emailDefinition.to = selectedItem.to.email;
        }
       this.setState({emailDefinition: emailDefinition, isPopupVisibile: true, command: COMMAND.RESEND});
  }

  forward() : Promise<void> {
      let emailDefinition : EmailDefinition =  this.state.emailDefinition;
      const selectedItem : FollowUp = this.state.selectedItem;
      const patientInfo: PatientInfo = this.props.patientInfo ? this.props.patientInfo :
      (this.props.navigation.state.params.patientInfo ? this.props.navigation.state.params.patientInfo : selectedItem.patientInfo);
      emailDefinition.to = patientInfo ? patientInfo.email : undefined;
       this.setState({emailDefinition: emailDefinition, isPopupVisibile: true, command: COMMAND.FORWARD});
  }

  async deleteItem(selectedItem: FollowUp) : Promise<void> {

    let allFollowUp : FollowUp[] = this.state.allFollowUp;

    const index  = allFollowUp.indexOf(selectedItem);
    allFollowUp.splice(index, 1);
    this.setState({allFollowUp});

    let body : {} = {
      'referral': selectedItem
     };
    let parameters : {} = {};

    let response =  fetchWinkRest('webresources/followup/delete', parameters, 'POST', body);
    if(response)  {
      if (response.errors) {
              alert(response.errors);
              return;
       }
    }
    const visit: Visit = this.props.navigation.state.params.visit;
    const isDraft: Boolean = this.props.isDraft;
    const patientInfo: PatientInfo = this.props.patientInfo ? this.props.patientInfo : this.props.navigation.state.params.patientInfo;
    const patientId : string = isEmpty(patientInfo) ? '*' : patientInfo.id;
    if(isDraft && visit) {
      allFollowUp = getCachedItem('referralFollowUpHistory-'+patientId);
      const cachedIndex  = allFollowUp.indexOf(selectedItem);
       allFollowUp.splice(cachedIndex, 1);
    }
    cacheItem('referralFollowUpHistory-'+patientId, allFollowUp);
    this.setState({selectedItem: undefined});
  }

  confirmDeleteReferral(selectedItem: FollowUp) {
      if(selectedItem === undefined) {
          alert('item not selected');
          return;
      }
      Alert.alert(
        strings.deleteReferralTitle,
        strings.formatString(strings.deleteReferralQuestion, selectedItem.ref, formatDate(selectedItem.date, jsonDateFormat)),
        [
          {
            text: strings.cancel,
            style: 'cancel',
          },
          {text: strings.confirm, onPress: () => this.deleteItem(selectedItem)},
        ],
        {cancelable: false},
      );
    }

  componentDidMount() {
       this.loadFollowUp();
  }
  onRefresh(refresh: boolean)  {
  };

  async componentDidUpdate(prevProps: any) {
      let params = this.props.navigation.state.params;
      if(params && params.refreshFollowUp) {
        this.props.navigation.setParams({refreshFollowUp: false});
        await this.refreshList();
      }
    }

 async refreshList() {
    const selectedItem : FollowUp = this.state.selectedItem;
    const patientInfo: PatientInfo = this.props.patientInfo ? this.props.patientInfo :
   (this.props.navigation.state.params.patientInfo !== undefined ? this.props.navigation.state.params.patientInfo :
    (selectedItem !==undefined ? getCachedItem(selectedItem.patientInfo.id) : undefined)) ;

    if(patientInfo) {
      await fetchReferralFollowUpHistory(patientInfo.id);
    } else {
     await fetchReferralFollowUpHistory();
    }
    this.loadFollowUp();
 }

  async loadReferralStatusCode() {
    let parameters : {} = {};
    let body : {} = {};

    let response = await fetchWinkRest('webresources/followup/statusCode', parameters, 'GET', body);
    if (response) {
        if (response.errors) {
              alert(response.errors);
              return;
        }
            const allRefStatusCode : ReferralStatusCode[] = response.referralStatus;
            this.setState({allRefStatusCode});

      }
  }

   loadFollowUp(id?: string | number) {
    const patientInfo: PatientInfo = this.props.patientInfo ? this.props.patientInfo : this.props.navigation.state.params.patientInfo;
    const visit: Visit = this.props.navigation.state.params.visit;
    const isDraft: Boolean = this.props.isDraft;
    const patientId : string = isEmpty(patientInfo) ? '*' : patientInfo.id;
    let allFollowUp : ?FollowUp[] = getCachedItem('referralFollowUpHistory-'+patientId);
    if(isDraft && visit) {
      allFollowUp = allFollowUp.filter((followUp: FollowUp) => isEmpty(followUp.emailOn) && isEmpty(followUp.faxedOn) && followUp.visitId === visit.id);
    }
    this.setState({allFollowUp});
  }
  async updateItem(item: any) : Promise<void> {
    let allFollowUp : FollowUp[] = this.state.allFollowUp;
      const index  = allFollowUp.indexOf(item);
      allFollowUp[index] = item;
      this.setState({allFollowUp});
      this.setState({isActive: false});

    let body : {} = {
      'referral': item
     };
    let parameters : {} = {};

    let response = await fetchWinkRest('webresources/followup/update', parameters, 'POST', body);
    this.setState({isActive: true});
    if(response) {
      if (response.errors) {
              alert(response.errors);
              return;
       }
  }
}

async openAttachment() {

    let body : {} = {
      'referral': this.state.selectedItem
     };
    let parameters : {} = {};
    this.setState({isActive: false});

    let response = await fetchWinkRest('webresources/followup/attachment', parameters, 'POST', body);
    this.setState({isActive: true});

    if(response) {
      if (response.errors) {
              alert(response.errors);
              return;
       }
       const upload : Upload = response;
       let html: string = '';
       if(getMimeType(upload).toLowerCase() === 'html') {
         html += upload.data;
       } else {
           const data =  {uri: `data:${getMimeType(upload)};base64,${upload.data}`};
            html  = `<iframe src=${data.uri} height="100%" width="100%" frameBorder="0"></iframe>`;
       }

       await printHtml(html);
  }

}

async openFollowUp() {

    let body : {} = {
      'referral': this.state.selectedItem
     };
    let parameters : {} = {};
    this.setState({isActive: false});

    let response = await fetchWinkRest('webresources/followup/attachment', parameters, 'POST', body);
    this.setState({isActive: true});

    if(response) {
      if (response.errors) {
              alert(response.errors);
              return;
       }
       const upload : Upload = response;
       let html: string = '';
       if(getMimeType(upload).toLowerCase() === 'html') {
         html += upload.data;
       } else {
           const data =  {uri: `data:${getMimeType(upload)};base64,${upload.data}`};
            html  = `<iframe src=${data.uri} height="100%" width="100%" frameBorder="0"></iframe>`;
       }

       await printHtml(html);
  }

}

async openPatientFile() {
  const selectedItem : FollowUp = this.state.selectedItem;
  if (!selectedItem) return;
  let patientInfo: PatientInfo = this.props.patientInfo ? this.props.patientInfo :
   (this.props.navigation.state.params.patientInfo !== undefined ? this.props.navigation.state.params.patientInfo : getCachedItem(selectedItem.patientInfo.id)) ;
    patientInfo = patientInfo === undefined  ? await fetchPatientInfo(selectedItem.patientInfo.id) : patientInfo ;
  const params = this.props.navigation.state.params;
  if(params && params.overview) {
      this.props.navigation.navigate('appointment', {patientInfo: patientInfo, selectedVisitId: selectedItem.visitId, refreshStateKey: this.props.navigation.state.key});
  } else {
      this.props.onUpdateVisitSelection(selectedItem.visitId);
  }
}

  async selectItem(value: any) : void {
    if (this.state.selectedItem===value && this.state.isActive == true) {
      await this.openAttachment();
      return;
    }

    let doctorReferral : ReferralDefinition =  {id: value.id};
    let emailDefinition : EmailDefinition  = {};
    emailDefinition.subject = value.referralTemplate.subject;
    this.setState({
      selectedItem: value,
      doctorReferral: doctorReferral,
      emailDefinition: emailDefinition
    });
   this.shouldUpdateStatus();
  }

  shouldUpdateStatus(): void {
      let selectedItem : FollowUp = this.state.selectedItem;
      if(!selectedItem) return ;
      const statusCode : CodeDefinition = getCodeDefinition('referralStatus',this.state.selectedItem.status) ;
      if(statusCode && statusCode.status ==3) {
        let allStatusCode : CodeDefinition[] = getAllCodes('referralStatus');
        allStatusCode = allStatusCode !== undefined ? allStatusCode.filter((code: CodeDefinition) => code.status == 4) : undefined;
        const openedStatusCode : CodeDefinition = allStatusCode !== undefined && allStatusCode.length >0 ? allStatusCode[0] : undefined;
        const currentUser : User = getDoctor();
        const userTo : User = selectedItem.to;
        if((currentUser && userTo && stripDataType(currentUser.id) == stripDataType(userTo.id)) && openedStatusCode !== undefined) {
          selectedItem.status = openedStatusCode.code;
          this.updateItem(selectedItem);
        }


      }
  }

  shouldActivateEdit() : boolean {
      const selectedItem : FollowUp = this.state.selectedItem;
      if(!selectedItem) return false ;

      const statusCode : CodeDefinition = getCodeDefinition('referralStatus',this.state.selectedItem.status) ;

      if((statusCode && statusCode.status ==1) || (isEmpty(selectedItem.emailOn) && isEmpty(selectedItem.faxedOn))) {
        return true;
      }
      return false;
  }

  shouldActivateResend() {
      const selectedItem : FollowUp = this.state.selectedItem;
      if(!selectedItem) return false ;

      const statusCode : CodeDefinition = getCodeDefinition('referralStatus',this.state.selectedItem.status) ;

      if(selectedItem.isOutgoing && (statusCode && statusCode.status ==2 || statusCode.status ==0)) {
        return true;
      }
      return false;
  }

  shouldActivateReply() {
      const selectedItem : FollowUp = this.state.selectedItem;
      if(!selectedItem) return false ;

      const statusCode : CodeDefinition = getCodeDefinition('referralStatus',this.state.selectedItem.status) ;

      if(!selectedItem.isOutgoing && (statusCode && (statusCode.status ==3 || statusCode.status ==0))) {
        return true;
      }
      return false;
  }

    shouldActivateForward() {
      const selectedItem : FollowUp = this.state.selectedItem;
      if(!selectedItem) return false ;

      const statusCode : CodeDefinition = getCodeDefinition('referralStatus',this.state.selectedItem.status) ;

      if(statusCode && statusCode.status ==1) {
        return false;
      }
      return true;
  }

    shouldActivateFollowUp() {
      const selectedItem : FollowUp = this.state.selectedItem;
      if(!selectedItem) return false ;

      const statusCode : CodeDefinition = getCodeDefinition('referralStatus',this.state.selectedItem.status) ;

      if(statusCode && statusCode.status ==1) {
        return false;
      }
      return true;
  }
  shouldActivateDelete() {
      const selectedItem : FollowUp = this.state.selectedItem;
      if(!selectedItem) return false ;
      if(isEmpty(selectedItem.emailOn) && isEmpty(selectedItem.faxedOn)) return true;
      return false;
  }

  renderFollowUp() {
    const listFollowUp : FollowUp[] = this.state.allFollowUp;
    let style = this.props.isDraft ? styles.tabCardFollowUp2 : styles.tabCardFollowUp1;
    const patientInfo: PatientInfo = this.props.patientInfo ? this.props.patientInfo : this.props.navigation.state.params.patientInfo;
    style = isEmpty(patientInfo) ? [style, {maxHeight: style.maxHeight + 100}] : style;
    return (
    <View>
          {this.props.isDraft && <Text style={styles.cardTitle}>Existing Referrals</Text> }
        <View style={style}>
               <TableList items = {listFollowUp} onUpdate={(item) => this.updateItem(item)} selection={this.state.selectedItem}
               onUpdateSelection= {(value) => this.selectItem(value)}
               onDeleteSelection= {(value) => this.confirmDeleteReferral(value)} isForPatient = {isEmpty(patientInfo)} isDraft = {this.props.isDraft} onRefreshList={() => this.refreshList()}
               navigation = {this.props.navigation}
               />
        </View>
        {this.renderButtons()}
       <Modal visible={this.state.isPopupVisibile} transparent={true} animationType={'slide'} onRequestClose={this.cancelEdit}>
        {this.renderPopup()}
      </Modal>
  </View>
    )}

    renderButtons() {
      let statusCode : CodeDefinition = this.state.selectedItem !== undefined ? getCodeDefinition('referralStatus',this.state.selectedItem.status) : undefined;
      const visit : Visit = this.state.selectedItem !== undefined ? getCachedItem(this.state.selectedItem.visitId) : undefined;
      const isDraft : boolean = this.props.isDraft;
      const patientInfo: PatientInfo = this.props.patientInfo ? this.props.patientInfo :
      (this.props.navigation.state.params.patientInfo ? this.props.navigation.state.params.patientInfo :
      (this.state.selectedItem !== undefined ? this.state.selectedItem.patientInfo : undefined));
      return <View style={{paddingBottom:100*fontScale}}>
          <View style={styles.flow}>
           {this.state.selectedItem && <Button title={strings.view} onPress={() => this.openAttachment()} disabled={!this.state.isActive}/>}
           {this.state.selectedItem && !isDraft && this.shouldActivateReply() && <Button title={strings.quickReply} onPress={() => this.reply()} disabled={!this.state.isActive}/>}
           {this.state.selectedItem && !isDraft && visit && this.shouldActivateFollowUp() && <Button title={strings.followUpTitle} disabled={!this.state.isActive} onPress={() => {this.props.navigation.navigate('referral', {visit:  visit, referral: this.state.selectedItem, followUp: true, followUpStateKey: this.props.navigation.state.key, patientInfo: patientInfo})}}/>}
           {this.state.selectedItem && visit && this.shouldActivateEdit() && <Button title={strings.edit} disabled={!this.state.isActive} onPress={() => {this.props.navigation.navigate('referral', {visit:  visit, referral: this.state.selectedItem, followUp: false, followUpStateKey: this.props.navigation.state.key, patientInfo: patientInfo})}}/>}
           {this.state.selectedItem && !isDraft && this.shouldActivateResend() && <Button title={strings.resend} onPress={() => this.resend()} disabled={!this.state.isActive}/>}
           {this.state.selectedItem && !isDraft && this.shouldActivateForward()  && <Button title={strings.forward} onPress={() => this.forward()} disabled={!this.state.isActive}/>}
           {this.state.selectedItem && this.shouldActivateDelete() && <Button title={strings.deleteTitle} onPress={() => this.confirmDeleteReferral(this.state.selectedItem)} disabled={!this.state.isActive}/>}
           {this.state.selectedItem && !isDraft  && <Button title={strings.openFile} onPress={() => this.openPatientFile()} disabled={!this.state.isActive}/>}

        </View>
      </View>
    }


    renderPopup() {
        let emailDefinition : EmailDefinition = this.state.emailDefinition;

    return <TouchableWithoutFeedback onPress={this.cancelEdit}>
        <View style={styles.popupBackground}>
          <View style={styles.flexColumnLayout}>
          <View style={styles.form}>
              <FormRow>
              <View style={styles.rowLayout}>
                <FormTextInput label='To' value={emailDefinition.to} readonly={this.state.command !== COMMAND.FORWARD} onChangeText={(newValue: string) => this.updateFieldTo(newValue)}/>
              </View>
            </FormRow>
               <FormRow>
              <View style={styles.rowLayout}>
                <FormTextInput label='Cc' value={emailDefinition.cc}  readonly={false} onChangeText={(newValue: string) => this.updateFieldCc(newValue)}/>
              </View>
            </FormRow>
            <FormRow>
              <View style={styles.rowLayout}>
                <FormTextInput label='Subject' value={emailDefinition.subject} readonly={false} onChangeText={(newValue: string) => this.updateFieldSubject(newValue)}/>
              </View>
            </FormRow>
            <FormRow>
            <View style={styles.rowLayout}>
              <FormTextInput multiline={true} label='Body' value={emailDefinition.body} readonly={false} onChangeText={(newValue: string) => this.updateFieldBody(newValue)} />
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

  render() {
    const listFollowUp : FollowUp[] = this.state.allFollowUp;
    if(Array.isArray(listFollowUp) && listFollowUp.length > 0) {
    return <View style={styles.page}>
           {this.renderFollowUp()}
         </View>
    }
    else if(!this.props.isDraft)
    return <Text>{strings.noDataFound}</Text>;

    return null;
  }
}


export class TableListRow extends React.PureComponent {
  props: {
    rowValue: {},
    selected: boolean|string,
    onSelect: (select: boolean|string) => void,
    onChangeValue: (value: ?string|?number) => void,
    maxLength?: number,
    simpleSelect?: boolean,
    testID: string,
    backgroundColor: string,
    readonly: boolean,
    onLongPress?: () => void,
    isVisible: boolean
  }
  state: {
    commentValue: string
  }
  static defaultProps = {
    maxLength: 60,
    simpleSelect: false
  }
 constructor(props: any) {
    super(props);
    this.state = {
      commentValue: this.props.rowValue.comment
    }
  }

async loadReferralStatusCode() {
    let parameters : {} = {};
    let body : {} = {};

    let response = await fetchWinkRest('webresources/followup/statusCode', parameters, 'GET', body);
    if (response) {
        if (response.errors) {
              alert(response.errors);
              return;
        }
            const allRefStatusCode : ReferralStatusCode[] = response.referralStatus;
            this.setState({allRefStatusCode});

      }
  }

  toggleSelect() {
    this.props.onSelect(true);
  }
  toggleLongPress() {
      this.toggleSelect();
      if(isEmpty(this.props.rowValue.emailOn) && isEmpty(this.props.rowValue.faxedOn)){
          this.props.onLongPress();
      }
  }

    toggleSelectStatus() {
  }

  formatLabel() : string {
      return this.props.rowValue.item;

  }

updateValue(value: any) {
  if (this.props.onChangeValue && value!==this.props.rowValue.status) {
      this.props.rowValue.status = value;
      this.props.onChangeValue();

    }
  }

  commitEdit(value: string) {
    if (this.props.onChangeValue && value!==this.props.rowValue.comment) {
      this.props.rowValue.comment = value;
      this.props.onChangeValue();
    }
  }
  changeText(value: string) {
     this.setState({commentValue: value});
  }

  render() {
    const style = this.props.selected ? styles.tableListTextSelected : styles.tableListText;
    const textStyle = this.props.rowValue.isParent ? [style, {fontWeight: 'bold'}] : style ;
    const prefix : string = this.props.selected ? (this.props.selected===true?undefined:'(' + this.props.selected+') '):undefined;
    const commentStyle = [styles.formField, {minWidth:150 * fontScale}];

    return <TouchableOpacity underlayColor={selectionColor} onPress={() => this.toggleSelect()} onLongPress={() => this.toggleLongPress()} testID={this.props.testID}>
      <View style={[styles.listRow, {backgroundColor: this.props.backgroundColor}]}>
        <Icon name={this.props.rowValue.isOutgoing ? 'call-made' : 'call-received'} color={selectionFontColor}/>
        <Text style={textStyle}>{this.props.rowValue.ref}</Text>
        {this.props.isVisible && <Text style={textStyle}>{this.props.rowValue.patientInfo.firstName + " " + this.props.rowValue.patientInfo.lastName}</Text>}
        <Text style={textStyle}>{this.props.rowValue.from.name}</Text>
        <Text style={textStyle}>{this.props.rowValue.to.name}</Text>
        <Text style={textStyle}>{formatDate(this.props.rowValue.date,jsonDateFormat)}</Text>
        <FormCode code="referralStatus" value={this.props.rowValue.status} showLabel={false} label={'Status'}
           onChangeValue={(code: ?string|?number) => this.updateValue(code)} readonly = {this.props.readonly} />
        <TextInput returnKeyType='done' editable={!this.props.readonly} autoCorrect={false} autoCapitalize='none' style={commentStyle}
      value={this.state.commentValue} onEndEditing={(event) => this.commitEdit(event.nativeEvent.text)}
      onChangeText={(text: string) => this.changeText(text)} testID={this.props.fieldId+'.filter'}
     />
      </View>
    </TouchableOpacity>
  }
}
export class TableList extends React.PureComponent {

  props: {
    label: string,
    items: any[],
    selection?: string | string[],
    required?: boolean,
    multiValue?: boolean,
    freestyle?: boolean,
    simpleSelect?: boolean,
    onUpdateSelection: (selection: ?(string[] | string)) => void,
    onUpdate: (item: ?any) => void,
    isDraft?: boolean,
    isForPatient?: boolean,
    fieldId: string,
    onRefreshList: () => void,
    navigation: any
  }

  state: {
    searchable: boolean,
    filter: string,
    item: any,
    options: string[],
    groupBy: ?string,
    groupedData: any[],
    refHeaderSelected: boolean,
    fromHeaderSelected: boolean,
    toHeaderSelected: boolean,
    dateHeaderSelected: boolean,
    statusHeaderSelected: boolean,
    commentHeaderSelected: boolean,
    patientHeaderSelected: boolean,
    refreshing: boolean,
    orderDesc: boolean
  }

  static defaultProps = {
    selection: undefined,
    required: false,
    multiValue: false,
    freestyle: false,
    simpleSelect: false,
    isForPatient: true
  }
  constructor(props: any) {
    super(props);
    this.state = {
      searchable: this.isSearchable(this.props.items),
      filter: '',
      item: {},
      options: ['Date', 'Referral', 'From', 'To', 'Status', 'Comment', 'Patient'],
      groupBy: undefined,
      groupedData: [],
      refHeaderSelected: false,
      fromHeaderSelected: false,
      toHeaderSelected: false,
      dateHeaderSelected: false,
      statusHeaderSelected: false,
      commentHeaderSelected: false,
      patientHeaderSelected: false,
      refreshing: false,
      orderDesc: false
    }
  }

  componentDidMount() {
    if(this.state.groupBy === undefined) {
      this.orderByDate();
      this.setState({groupBy: this.state.options[0]});
    }
  }

  isSearchable(items: string[]) : boolean {
    return (this.props.freestyle===true || (items!=undefined && items.length>20));
  }

isSelected(item: any): boolean|string {
    const selection : any = this.props.selection;
    if (!selection)
      return false;
    if (selection === item) return true;

    return false;
}

select(item: any, select: boolean|string) {
   this.props.onUpdateSelection(item);
}
onDelete(item: any) {
  this.props.onDeleteSelection(item);
}

  getItems(): any[] {
    let data : any[] = [...this.props.items];
    if(this.state.groupBy === 'Referral') {
      data = this.groupByReferral();
    } else if(this.state.groupBy === 'Date') {
      data = this.groupByDate();
    } else if(this.state.groupBy === 'From') {
      data = this.groupByFrom();
    } else if(this.state.groupBy === 'To') {
      data = this.groupByTo();
    } else if(this.state.groupBy === 'Status') {
      data = this.groupByStatus();
    } else if(this.state.groupBy === 'Comment') {
      data = this.groupByComment();
     }else if(this.state.groupBy === 'Patient') {
      data = this.groupByPatient();
    }
    if(!this.state.orderDesc) {
      data.reverse();
    }

    const filter : ?string = this.state.filter!==undefined&&this.state.filter!==""?deAccent(this.state.filter.trim().toLowerCase()):undefined;
    if (filter) {
      if (!data) data = [...this.props.items];
      data = data.filter((item: any) => item!=null && item!==undefined && JSON.stringify(item).trim().length>0 && ((deAccent(JSON.stringify(item).toLowerCase()).indexOf(filter))>=0
      || (deAccent(JSON.stringify(formatCode("referralStatus",item.status)).toLowerCase()).indexOf(filter))>=0));
    }
    return data;
  }

  updateValue(item: any, value: string|number) {
      this.setState({item: item});
      this.props.onUpdate(item);
  }

    selectField(value: string, options: any) {
      this.setState({groupBy: value});
  }

  getParent(item: FollowUp) {
    let parentReferral : FollowUp = item;
    let isFound: boolean = false;
    let data : any[] = [...this.props.items];
    for(const element : FollowUp of data) {
      if(item.linkedReferralId === element.id) {
        isFound = true;
        parentReferral = element;
        break;
      }
     }
     if(isFound && parentReferral && parentReferral.linkedReferralId) {
        return this.getParent(parentReferral);
     }
     return parentReferral;
  }

  resetItems() : any {
    if(!this.props.items) return ;
    let data : any[] = [...this.props.items];
    data.map((followUp: FollowUp, index: number) => {
      followUp.ref = followUp.ref.trim();
      followUp.isParent = false;
    });
    return data;
  }
  groupByDate() : any{
    let data : any[] = this.resetItems();
    data.sort(this.compareDateFollowUp);
    return data;
  }

  groupByFrom() {
    let data : any[] = this.resetItems();
    data.sort(this.compareFromFollowUp);
    return data;
  }

  groupByTo() {
    let data : any[] = this.resetItems();
    data.sort(this.compareToFollowUp);
    return data;
  }

  groupByStatus() {
    let data : any[] = this.resetItems();
    data.sort(this.compareStatusFollowUp);
    return data;
  }

  groupByComment() {
    let data : any[] = this.resetItems();
    data.sort(this.compareCommentFollowUp);
    return data;
  }

  groupByPatient() {
    let data : any[] = this.resetItems();
    data.sort(this.comparePatientFollowUp);
    return data;
  }

  groupByReferral() : any {
    if(!this.props.items) return ;
    let groupedData : any = new Map();
    let data : any[] = [...this.props.items];
    for(const element : FollowUp of data) {
      let parentReferral : FollowUp = element;
      if(element.linkedReferralId) {
        parentReferral = this.getParent(element);
      }
      if(!groupedData.get(parentReferral)) {
        let followUpList: FollowUp[] = [];
        followUpList.push(element);
        groupedData.set(parentReferral, followUpList);
      } else {
        groupedData.get(parentReferral).push(element);
      }
    }

    groupedData = new Map([...groupedData.entries()].sort(this.compareFollowUp));

    let finalResult : any = [];
    for (const [key, value] : any of groupedData.entries()) {
      const parent : FollowUp = key;
      const childs : FollowUp[] = value;
      const parentId : string = parent.id;
      parent.isParent = true;
      finalResult.push(parent);
      const finalChilds : FollowUp[] = childs.filter((v,i) => stripDataType(v.id) !== stripDataType(parentId));
      for(const childElement : FollowUp of finalChilds) {
        if(stripDataType(childElement.id) !== stripDataType(parentId)) {
          childElement.ref = "        " + childElement.ref.trim();
          childElement.isParent = false;
          finalResult.push(childElement);
        }
      }
    }
    return finalResult;
  }

compareFollowUp(a: FollowUp, b: FollowUp) : number {
  if(a.id < b.id) return -1;
  else if(a.id > b.id) return 1;
  return 0;
}

compareFromFollowUp(a: FollowUp, b: FollowUp) : number {
  if(b.from.name.toLowerCase() < a.from.name.toLowerCase()) return -1;
  else if(b.from.name.toLowerCase() > a.from.name.toLowerCase()) return 1;
  return 0;
}
compareToFollowUp(a: FollowUp, b: FollowUp) : number {
  if(b.to.name.toLowerCase() < a.to.name.toLowerCase()) return -1;
  else if(b.to.name.toLowerCase() > a.to.name.toLowerCase()) return 1;
  return 0;
}
compareDateFollowUp(a: FollowUp, b: FollowUp) : number {
  if(b.date < a.date) return -1;
  else if(b.date > a.date) return 1;
  return 0;
}
compareStatusFollowUp(a: FollowUp, b: FollowUp) : number {
  const aStatusCode : CodeDefinition = getCodeDefinition('referralStatus',a.status) ;
  const bStatusCode : CodeDefinition = getCodeDefinition('referralStatus',b.status) ;
  if(aStatusCode === undefined || bStatusCode === undefined) return 0;
  if(bStatusCode.description.toLowerCase() <aStatusCode.description.toLowerCase()) return -1;
  else if(bStatusCode.description.toLowerCase() > aStatusCode.description.toLowerCase()) return 1;
  return 0;
}

compareCommentFollowUp(a: FollowUp, b: FollowUp) : number {
  if(isEmpty(b.comment) && !isEmpty(a.comment))   return -10;
  if(isEmpty(a.comment) && !isEmpty(b.comment))   return 10;
  if(isEmpty(a.comment) && isEmpty(b.comment))   return 0;

  if(b.comment.toLowerCase() < a.comment.toLowerCase()) return -1;
  else if(b.comment.toLowerCase() > a.comment.toLowerCase()) return 1;
  return 0;
}


comparePatientFollowUp(a: FollowUp, b: FollowUp) : number {
  if(b.patientInfo.firstName.toLowerCase() < a.patientInfo.firstName.toLowerCase()) return -1;
  else if(b.patientInfo.firstName.toLowerCase() > a.patientInfo.firstName.toLowerCase()) return 1;
  return 0;
}
updateOrder() {
    const order : boolean = this.state.orderDesc;
    this.setState({orderDesc: !order});
}

orderByRef() {
   if(!this.state.refHeaderSelected) {
    this.setState({groupBy: 'Referral', refHeaderSelected: true, fromHeaderSelected: false, toHeaderSelected: false, dateHeaderSelected: false,
                   statusHeaderSelected: false, commentHeaderSelected: false, patientHeaderSelected: false, orderDesc: true })
   }

}
orderByDate() {
    if(!this.state.dateHeaderSelected) {
    this.setState({groupBy: 'Date', refHeaderSelected: false, fromHeaderSelected: false, toHeaderSelected: false, dateHeaderSelected: true,
                  statusHeaderSelected: false, commentHeaderSelected: false,patientHeaderSelected: false, orderDesc: true })
  } else {
     this.updateOrder();
   }
}
orderByPatient() {
   if(!this.state.patientHeaderSelected) {
    this.setState({groupBy: 'Patient', refHeaderSelected: false, fromHeaderSelected: false, toHeaderSelected: false, dateHeaderSelected: false,
                   statusHeaderSelected: false, commentHeaderSelected: false, patientHeaderSelected: true, orderDesc: true})
   } else {
     this.updateOrder();
   }
}
orderByFrom() {
   if(!this.state.fromHeaderSelected) {
    this.setState({groupBy: 'From', refHeaderSelected: false, fromHeaderSelected: true, toHeaderSelected: false, dateHeaderSelected: false,
                   statusHeaderSelected: false, commentHeaderSelected: false,patientHeaderSelected: false, orderDesc: true})
   } else {
     this.updateOrder();
   }
}
orderByTo() {
   if(!this.state.toHeaderSelected) {
    this.setState({groupBy: 'To', refHeaderSelected: false, fromHeaderSelected: false, toHeaderSelected: true, dateHeaderSelected: false,
                   statusHeaderSelected: false, commentHeaderSelected: false,patientHeaderSelected: false, orderDesc: true})
   } else {
      this.updateOrder();
   }

}
orderByStatus() {
  if(!this.state.statusHeaderSelected) {
    this.setState({groupBy: 'Status', refHeaderSelected: false, fromHeaderSelected: false, toHeaderSelected: false, dateHeaderSelected: false,
                   statusHeaderSelected: true, commentHeaderSelected: false,patientHeaderSelected: false, orderDesc: true})
  } else {
      this.updateOrder();
   }
}
orderByComment() {
  if(!this.state.commentHeaderSelected) {
    this.setState({groupBy: 'Comment', refHeaderSelected: false, fromHeaderSelected: false, toHeaderSelected: false, dateHeaderSelected: false,
                   statusHeaderSelected: false, commentHeaderSelected: true,patientHeaderSelected: false, orderDesc: true})
  } else {
    this.updateOrder();
  }
}

async handleRefresh() {
  this.setState({refreshing: true});
  await this.props.onRefreshList();
  this.setState({refreshing: false});

}
  renderItem = ({item, index}) => {
    return (
      <View style={styles.fieldFlexContainer}>
      <Text>{item.key}</Text>
      </View>
    );
  }
  renderFilterField() {
    const style = [styles.searchField, {minWidth: 350 * fontScale}];

    return(
         <TextInput returnKeyType='search' placeholder={strings.findRow} autoCorrect={false} autoCapitalize='none' style={style}
      value={this.state.filter} onChangeText={(filter: string) => this.setState({filter})} testID={this.props.fieldId+'.filter'}
     />
    )}

  renderGroupField() {
    const options: string[] =  this.state.options;
    const style = [styles.searchField, {marginLeft: 10}];
    return(
              <TilesField label='Group By'
                options={options}
                value={this.state.groupBy}
                style={style}
                onChangeValue={(value: string) => this.selectField(value, options)}
              />

    )}
  renderHeader() {
    const style = [styles.formTableColumnHeader, {textAlign: 'left'}];
    const styleText = [styles.text, {fontSize: 26 * fontScale}];
    const styleSelected = [styles.text, {color: selectionFontColor, fontSize: 26 * fontScale, textAlign: "left"}];
    const commentStyle = [style, {minWidth:150 * fontScale}];
    const isPatientVisible : boolean = (this.props.navigation && this.props.navigation.state && this.props.navigation.state.params && this.props.navigation.state.params.overview) ? true : false;
    return (
     <View style={styles.listRow}>
      <View><Text style={this.state.refHeaderSelected ? styleSelected : styles.text}>{' '}</Text></View>
      <TouchableOpacity underlayColor={selectionColor} onPress={() => this.orderByRef()} style={style} ><View>
      <Text style={this.state.refHeaderSelected ? styleSelected : styleText}>{'Ref'}</Text></View></TouchableOpacity>
      {isPatientVisible && <TouchableOpacity underlayColor={selectionColor} onPress={() => this.orderByPatient()} style={style}>
      <View style = {styles.formRow}>
        {this.state.patientHeaderSelected && <Icon name={this.state.orderDesc ? 'arrow-downward' : 'arrow-upward'} color={selectionFontColor}/>}
        <Text style={this.state.patientHeaderSelected ? styleSelected : styleText}>{'Patient'}</Text>
      </View>
      </TouchableOpacity>}
      <TouchableOpacity underlayColor={selectionColor} onPress={() => this.orderByFrom()} style={style}>
      <View style = {styles.formRow}>
        {this.state.fromHeaderSelected &&  <Icon name={this.state.orderDesc ? 'arrow-downward' : 'arrow-upward'} color={selectionFontColor}/>}
        <Text style={this.state.fromHeaderSelected ? styleSelected : styleText}>{'From'}</Text>
      </View>
      </TouchableOpacity>
      <TouchableOpacity underlayColor={selectionColor} onPress={() => this.orderByTo()} style={style}>
      <View style = {styles.formRow}>
        {this.state.toHeaderSelected && <Icon name={this.state.orderDesc ? 'arrow-downward' : 'arrow-upward'} color={selectionFontColor}/>}
        <Text style={this.state.toHeaderSelected ? styleSelected : styleText}>{'To'}</Text>
      </View>
      </TouchableOpacity>
      <TouchableOpacity underlayColor={selectionColor} onPress={() => this.orderByDate()} style={style}>
      <View style = {styles.formRow}>
      {this.state.dateHeaderSelected && <Icon name={this.state.orderDesc ? 'arrow-downward' : 'arrow-upward'} color={selectionFontColor}/>}
      <Text style={this.state.dateHeaderSelected ? styleSelected : styleText}>{'Date'}</Text>
      </View>
      </TouchableOpacity>
      <TouchableOpacity underlayColor={selectionColor} onPress={() => this.orderByStatus()} style={style}>
      <View style = {styles.formRow}>
      {this.state.statusHeaderSelected && <Icon name={this.state.orderDesc ? 'arrow-downward' : 'arrow-upward'} color={selectionFontColor}/>}
      <Text style={this.state.statusHeaderSelected ? styleSelected : styleText}>{'Status'}</Text>
      </View>
      </TouchableOpacity>
      <TouchableOpacity underlayColor={selectionColor} onPress={() => this.orderByComment()} style={commentStyle}>
      <View style = {styles.formRow}>
       {this.state.commentHeaderSelected && <Icon name={this.state.orderDesc ? 'arrow-downward' : 'arrow-upward'} color={selectionFontColor}/>}
       <Text style={this.state.commentHeaderSelected ? styleSelected : styleText}>{'Comment'}</Text>
       </View>
       </TouchableOpacity>
       </View>

    );
  }

  renderItemSeparator() {
    return (
    <View
      style={styles.listSeparator}/>
  );
  }
  render() {
  let data : any[] = this.getItems();
  const sideBarCustomStyle = [styles.sideBarHorizontal, {minWidth: 200 * fontScale, maxWidth:600 * fontScale}];
  const tabCardCustomStyle = [styles.tabCardFollowUp1, {maxHeight: 400, borderWidth: 0}];
  let style = this.props.isDraft ? styles.followUpList2 : styles.followUpList1;
  style = this.props.isForPatient ? [style, {maxHeight: style.maxHeight + 100}] : style;
  const isVisible : boolean = (this.props.navigation && this.props.navigation.state && this.props.navigation.state.params && this.props.navigation.state.params.overview) ? true : false;

    return (
 <View >
  <View style={styles.formRow}>
    {this.renderFilterField()}
   </View>
     <View style={style}>
      <FlatList
        initialNumToRender={5}
        data={data}
        extraData={{filter: this.state.filter, selection: this.state.item}}
        renderItem={(item, index) => <TableListRow rowValue={item.item} simpleSelect={this.props.simpleSelect} selected={this.isSelected(item.item)} backgroundColor ={item.index%2===0 ? '#F9F9F9' :'#FFFFFF'}
                                onChangeValue={(value : string|number) => this.updateValue(item.item, value)}
                                onSelect={(isSelected : boolean|string) => this.select(item.item, isSelected)}
                                onLongPress={() => this.onDelete(item.item)}
                                testID={this.props.label+'.option'+(item.index+1)} readonly = {this.props.isDraft ? true : false}
                                isVisible = {isVisible}
                                />}
                                ListHeaderComponent = {this.renderHeader()}
                                stickyHeaderIndices={[0]}
                                refreshing = {this.state.refreshing}
                                onRefresh = {() => this.handleRefresh()}

      />
   </View>


    </View>

    );
  }

}

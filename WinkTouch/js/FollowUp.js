/**
 * @flow
 */
'use strict';

import type { Visit } from './Types';

import React, { Component } from 'react';
import ReactNative, { View, Text, Image, LayoutAnimation, TouchableHighlight, ScrollView, Modal, Dimensions,
  TouchableOpacity, TouchableWithoutFeedback, InteractionManager, TextInput, Keyboard, FlatList, NativeModules } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { styles, fontScale, selectionColor } from './Styles';
import { Button,TilesField, Label, SelectionList } from './Widgets';
import { FormRow, FormTextInput, FormField, FormCode } from './Form';
import { getAllCodes, getCodeDefinition } from './Codes';
import { fetchWinkRest } from './WinkRest';
import type { PatientInfo, HtmlDefinition, ReferralDocument, ImageBase64Definition, ReferralDefinition, CodeDefinition, EmailDefinition, FollowUp, ReferralStatusCode, Upload} from './Types';
import {allExamIds} from './Visit';
import { getCachedItems, getCachedItem } from './DataCache';

import { stripDataType } from './Rest';
import RNBeep from 'react-native-a-beep';
import { getStore } from './DoctorApp';
import { strings } from './Strings';
import {  getMimeType } from './Upload';
import { printHtml, generatePDF } from './Print';
import { deAccent, isEmpty, formatDate, jsonDateFormat} from './Util';

const COMMAND = {
  RESEND: 0,
  REPLY: 1
}

type FollowUpScreenProps = {
  navigation: any,
  patientInfo: PatientInfo,
  isDraft: boolean
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
    let body = {
            'visitId': stripDataType(this.state.selectedItem.visitId),
            'doctorId': stripDataType(referral.doctorId),
            'emailDefinition': this.state.emailDefinition,
            'doctorReferral': this.state.doctorReferral,
            'action': this.state.command
          };


      let response = await fetchWinkRest('webresources/template/email', parameters, 'POST', body);
      if (response) {
          if (response.errors) {
              alert(response.errors);
          }
          else {
              RNBeep.PlaySysSound(RNBeep.iOSSoundIDs.MailSent);
              this.setState({isPopupVisibile: false});
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

  async reply() : Promise<void> {
      if(this.state.selectedItem === undefined) {
          alert('item not selected');
          return;
      }
      let emailDefinition : EmailDefinition =  this.state.emailDefinition;
      const selectedItem : Follow = this.state.selectedItem;
      emailDefinition.to = selectedItem.from.email;
       this.setState({emailDefinition: emailDefinition, isPopupVisibile: true, command: COMMAND.REPLY});

  }

    async resend() : Promise<void> {
      if(this.state.selectedItem === undefined) {
          alert('item not selected');
          return;
      }
      let emailDefinition : EmailDefinition =  this.state.emailDefinition;
      const selectedItem : Follow = this.state.selectedItem;
      emailDefinition.to = selectedItem.to.email;
       this.setState({emailDefinition: emailDefinition, isPopupVisibile: true, command: COMMAND.RESEND});


  }

  async componentDidMount() {
      await this.loadFollowUp();
  }
  onRefresh(refresh: boolean)  {
  };                               

  async componentDidUpdate(prevProps: any) {
      let params = this.props.navigation.state.params; 
      if(params && params.refreshFollowUp) {
        await this.loadFollowUp();
        InteractionManager.runAfterInteractions(() => this.props.navigation.setParams({refreshFollowUp: false}));
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

  async loadFollowUp(id?: string | number) {
    let parameters : {} = {};
    const patientInfo: PatientInfo = this.props.patientInfo ? this.props.patientInfo : this.props.navigation.state.params.patientInfo;
    const visit: Visit = this.props.navigation.state.params.visit;
      let body : {} = {
        'patientId': stripDataType(patientInfo.id),
        'id': id ? stripDataType(id) : undefined,
        'isDraft': this.props.isDraft,
        'visitId': visit ? stripDataType(visit.id) : undefined,
     };

    let response = await fetchWinkRest('webresources/followup/list', parameters, 'POST', body);
    if (response) {
        if (response.errors) {
              alert(response.errors);
              return;
        }
        if(id) {
          const allFollowUp :  FollowUp[] = this.state.allFollowUp;
          if(allFollowUp){
              allFollowUp.unshift(response.followUp);
                          this.setState({allFollowUp});

          }
        } else {
            const allFollowUp : FollowUp[] = response.followUp;
                  this.setState({allFollowUp});

        }
      }
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

  async selectItem(value: any) : void {
    if (this.state.selectedItem===value && this.state.isActive == true) {
      await this.openAttachment();
      return;
    }

    let doctorReferral : ReferralDefinition =  {id: value.id};
    this.setState({
      selectedItem: value,
      doctorReferral: doctorReferral
    });
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

      if((selectedItem.isOutgoing || (statusCode && statusCode.status ==2))) {
        return true;
      }
      return false;
  }

  shouldActivateReply() {
      const selectedItem : FollowUp = this.state.selectedItem;
      if(!selectedItem) return false ;
  
      const statusCode : CodeDefinition = getCodeDefinition('referralStatus',this.state.selectedItem.status) ;

      if((!selectedItem.isOutgoing || (statusCode && statusCode.status ==3))) {
        return true;
      }
      return false;
  }

  renderFollowUp() {
    const listFollowUp : FollowUp[] = this.state.allFollowUp;
    const style = this.props.isDraft ? styles.tabCardFollowUp2 : styles.tabCardFollowUp1;
    return (
    <View>
      <View style={styles.flow}>
    <View style={styles.centeredColumnLayout}>
              {this.props.isDraft && <Text style={styles.cardTitle}>Existing Referrals</Text> }

        <View style={style}>
            <View style={styles.flow}>
               <TableList items = {listFollowUp} onUpdate={(item) => this.updateItem(item)} selection={this.state.selectedItem}  
               onUpdateSelection={(value) => this.selectItem(value)}/>
            </View>
    </View>
        {this.renderButtons()}
        
       <Modal visible={this.state.isPopupVisibile} transparent={true} animationType={'slide'} onRequestClose={this.cancelEdit}>
        {this.renderPopup()}
      </Modal>
    </View>

  </View>
  </View>
    )}

    renderButtons() {
      let statusCode : CodeDefinition = this.state.selectedItem !== undefined ? getCodeDefinition('referralStatus',this.state.selectedItem.status) : undefined;
      const visit : Visit = this.state.selectedItem !== undefined ? getCachedItem(this.state.selectedItem.visitId) : undefined;
      return <View style={{paddingTop: 30*fontScale, paddingBottom:100*fontScale}}>
          <View style={styles.flow}>
           {this.state.selectedItem && this.shouldActivateReply() && <Button title={'Quick Reply'} onPress={() => this.reply()} disabled={!this.state.isActive}/>} 
           {this.state.selectedItem && visit && <Button title={'Follow Up'} disabled={!this.state.isActive} onPress={() => {this.props.navigation.navigate('referral', {visit:  visit, referral: this.state.selectedItem, followUp: true, followUpStateKey: this.props.navigation.state.key})}}/>}
           {this.state.selectedItem && visit && this.shouldActivateEdit() && <Button title={'Edit'} disabled={!this.state.isActive} onPress={() => {this.props.navigation.navigate('referral', {visit:  visit, referral: this.state.selectedItem, followUp: false, followUpStateKey: this.props.navigation.state.key})}}/>}
           {this.state.selectedItem && this.shouldActivateResend() && <Button title={'Resend'} onPress={() => this.resend()} disabled={!this.state.isActive}/>} 
        </View>
      </View>
    }


    renderPopup() {
        let emailDefinition : EmailDefinition = this.state.emailDefinition;

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
                <FormTextInput label='To' value={emailDefinition.to} readonly={true} onChangeText={(newValue: string) => this.updateFieldTo(newValue)}/>
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
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  }

  render() {
    const listFollowUp : FollowUp[] = this.state.allFollowUp;

    return <View style={styles.page}>
      { Array.isArray(listFollowUp) && listFollowUp.length > 0 && this.renderFollowUp()}
    </View>
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
    backgroundColor: string
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
    return <TouchableOpacity underlayColor={selectionColor} onPress={() => this.toggleSelect()} testID={this.props.testID}>
      <View style={[styles.listRow, {backgroundColor: this.props.backgroundColor}]}>
        <Text style={textStyle}>{this.props.rowValue.ref}</Text>
        <Text style={textStyle}>{this.props.rowValue.from.name}</Text>
        <Text style={textStyle}>{this.props.rowValue.to.name}</Text>
        <Text style={textStyle}>{formatDate(this.props.rowValue.date,jsonDateFormat)}</Text>
        <FormCode code="referralStatus" value={this.props.rowValue.status} showLabel={false} label={'Status'} 
           onChangeValue={(code: ?string|?number) => this.updateValue(code)} />
        <TextInput returnKeyType='done' placeholder={'comment:'} autoCorrect={false} autoCapitalize='none' style={textStyle}
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

    fieldId: string
  }

  state: {
    searchable: boolean,
    filter: string,
    item: any,
    options: string[],
    groupBy: ?string,
    groupedData: any[]

  }

  static defaultProps = {
    selection: undefined,
    required: false,
    multiValue: false,
    freestyle: false,
    simpleSelect: false
  }
  constructor(props: any) {
    super(props);
    this.state = {
      searchable: this.isSearchable(this.props.items),
      filter: '',
      item: {},
      options: ['Date', 'Referral'],
      groupBy: undefined,
      groupedData: []
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

  getItems(): any[] {
    let data : any[] = [...this.props.items];
    if(this.state.groupBy === 'Referral') {
      data = this.groupByReferral();
    } else {
      data = this.groupByDate();
    }

    const filter : ?string = this.state.filter!==undefined&&this.state.filter!==""?deAccent(this.state.filter.trim().toLowerCase()):undefined;
    if (filter) {
      if (!data) data = [...this.props.items];
      data = data.filter((item: any) => item!=null && item!==undefined && JSON.stringify(item).trim().length>0 && (deAccent(JSON.stringify(item).toLowerCase()).indexOf(filter))>=0);
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

  groupByDate() {
    if(!this.props.items) return ;
    let data : any[] = [...this.props.items];
    data.map((followUp: FollowUp, index: number) => {
      followUp.ref = followUp.id;
      followUp.isParent = false;
    });
    return data;
  }

  groupByReferral() {
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
    let finalResult : any = [];
    for (const [key, value] : any of groupedData.entries()) {
      const parent : FollowUp = key;
      const childs : FollowUp[] = value;
      const parentId : string = parent.id;
      parent.ref = "+ " + parent.id;
      parent.isParent = true;
      finalResult.push(parent);
      const finalChilds : FollowUp[] = childs.filter((v,i) => stripDataType(v.id) !== stripDataType(parentId));
      for(const childElement : FollowUp of finalChilds) {
        if(stripDataType(childElement.id) !== stripDataType(parentId)) {
          childElement.ref = "   -     " + childElement.id;
          childElement.isParent = false;
          finalResult.push(childElement);
        }
      }
    }
    return finalResult;
  }

  renderItem = ({item, index}) => {
    return (
      <View style={styles.fieldFlexContainer}>
      <Text>{item.key}</Text>
      </View>
    );
  }
  renderFilterField() {
    return(
         <TextInput returnKeyType='search' placeholder={strings.findRow} autoCorrect={false} autoCapitalize='none' style={styles.searchField}
      value={this.state.filter} onChangeText={(filter: string) => this.setState({filter})} testID={this.props.fieldId+'.filter'}
     />
    )} 

  renderGroupField() {
    const options: string[] =  this.state.options;
    if(this.state.groupBy === undefined) {
      this.setState({groupBy: options[0]});
    }
    const style = [styles.searchField, {marginTop: 10}];
    return(
              <TilesField label='Group By'
                options={options}
                value={this.state.groupBy}
                style={style}
                onChangeValue={(value: string) => this.selectField(value, options)}
              />

    )}
  renderHeader() {
    return (
    
    <View style={styles.centeredColumnLayout}>
     <View style={styles.listRow}>
      <Text style={styles.formTableColumnHeader}>{'Ref'}</Text>
      <Text style={styles.formTableColumnHeader}>{'From'}</Text>
      <Text style={styles.formTableColumnHeader}>{'To'}</Text>
      <Text style={styles.formTableColumnHeader}>{'Date'}</Text>
      <Text style={styles.formTableColumnHeader}>{'Status'}</Text>
      <Text style={styles.formTableColumnHeader}>{'Comment'}</Text>
       </View>
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
  const sideBarCustomStyle = [styles.sideBar, {minWidth: 200 * fontScale, maxWidth:300 * fontScale}];

    return (
 <View style={styles.flow}>
      <FlatList
        initialNumToRender={5}
        data={data}
        extraData={{filter: this.state.filter, selection: this.state.item}}
        renderItem={(item, index) => <TableListRow rowValue={item.item} simpleSelect={this.props.simpleSelect} selected={this.isSelected(item.item)} backgroundColor ={item.index%2===0 ? '#F9F9F9' :'#FFFFFF'}
                                onChangeValue={(value : string|number) => this.updateValue(item.item, value)}
                                onSelect={(isSelected : boolean|string) => this.select(item.item, isSelected)}  testID={this.props.label+'.option'+(item.index+1)}/>}
                                ListHeaderComponent = {this.renderHeader()}
      />

    <View style={sideBarCustomStyle}>
    {this.renderFilterField()}
    {this.renderGroupField(
      
    )}
    </View>
    </View>

    );
  }

}
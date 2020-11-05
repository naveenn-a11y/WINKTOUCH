/**
 * @flow
 */
'use strict';

import React, { Component, PureComponent } from 'react';
import { View, TouchableHighlight, Text, TouchableOpacity, ScrollView, Button, Animated, Easing} from 'react-native';
import { NavigationActions } from 'react-navigation';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import type {Exam, Patient, GlassesRx, Visit, ExamPredefinedValue, ExamDefinition, FieldDefinition, GroupDefinition } from './Types';
import { styles, fontScale, selectionFontColor, isWeb } from './Styles';
import { strings} from './Strings';
import { SelectionListsScreen, ItemsCard, formatLabel, ItemsList, getFieldDefinition as getItemFieldDefinition} from './Items';
import { GroupedFormScreen, GroupedForm, GroupedCard, CheckList } from './GroupedForm';
import { PaperFormScreen} from './PaperForm';
import { fetchItemById, storeItem, searchItems } from './Rest';
import { cacheItemById, getCachedItem, cacheItem, getCachedItems } from './DataCache';
import { deepClone, formatMoment, getValue, stripIndex, setValue } from './Util';
import { allExamIds, fetchVisit, visitHasEnded } from './Visit';
import { GlassesDetail } from './Refraction';
import { getFavorites, removeFavorite, Star, Refresh, storeFavorite } from './Favorites';
import { getExamDefinition } from './ExamDefinition';
import { Lock } from './Widgets';
import { ErrorCard } from './Form';
import {renderParentGroupHtml, renderItemsHtml} from './PatientFormHtml';

export async function fetchExam(examId: string, ignoreCache?: boolean) : Promise<Exam> {
  let exam : Exam = await fetchItemById(examId, ignoreCache);
  //overwriteExamDefinition(exam);
  return exam;
}

export async function createExam(exam: Exam) : Promise<Exam> {
  exam = await storeItem(exam);
  return exam;
}

export async function storeExam(exam: Exam, refreshStateKey: ?string, navigation: ?any) : Exam {
  exam = deepClone(exam);
  exam = await storeItem(exam);
  if (exam.errors) {
    return exam;
  }
  if (refreshStateKey && navigation) {//TODO check if exam has mapped visit fields
    const setParamsAction = NavigationActions.setParams({
      params: { refresh: true },
      key: refreshStateKey
    })
    navigation.dispatch(setParamsAction);
  }
  return exam;
}

function updateMappedExamFields(fieldDefinitions : (FieldDefinition|GroupDefinition)[], value, visitId: string) {
    if (!fieldDefinitions) return;
    fieldDefinitions.forEach((fieldDefinition: FieldDefinition|GroupDefinition) => {
        const fieldValue = (value===undefined||value===null)?undefined:value[fieldDefinition.name];
        if (fieldDefinition.fields) {
          updateMappedExamFields(fieldDefinition.fields, fieldValue, visitId);
        } else {
          if (fieldDefinition.mappedField && fieldDefinition.mappedField.startsWith('exam.')) {
            let fieldIdentifier : string = fieldDefinition.mappedField.substring('exam.'.length);
            let examName : string = fieldIdentifier.substring(0, fieldIdentifier.indexOf('.'));
            let referredExam = getExam(examName, getCachedItem(visitId));
            setValue(referredExam, fieldIdentifier, fieldValue);
            //__DEV__ && console.log('Updated mapped exam field '+fieldIdentifier+' to '+fieldValue+': '+JSON.stringify(referredExam));
            updateMappedExams(referredExam);

          } else if (fieldDefinition.mappedField!=undefined){
            //__DEV__ && console.log('TODO: update non exam mapped field '+fieldDefinition.mappedField);
          }
        }
    });
}

export function updateMappedExams(exam: Exam) {
  if (!exam) return;
  let fieldDefinitions : GroupDefinition[] = exam.definition.fields;
  let examValue = exam[exam.definition.name];
  updateMappedExamFields(fieldDefinitions, examValue, exam.visitId);
}


export function getVisit(exam: Exam) : Visit {
  if (!exam) return;
  return getCachedItem(exam.visitId);
}

export function getPatient(exam: Exam) : Patient {
  const visit : Visit = getVisit(exam);
  return getCachedItem(visit.patientId);
}

export function getExam(examName: string, visit: Visit) : Exam {
  if (!visit) return;
  let examId = visit.customExamIds.find((examId: string) => getCachedItem(examId).definition.name===examName);
  if (!examId) examId = visit.preCustomExamIds.find((examId: string) => getCachedItem(examId).definition.name===examName);
  const exam : Exam = getCachedItem(examId);
  return exam;
}

export function getFieldValue(fieldIdentifier: string, exam: Exam) : any {
  const fieldSrc : string[] = fieldIdentifier.split('.');
  if (fieldSrc[0]==='exam') {//A field of another exam
    let examIdentifier = fieldIdentifier.substring(5);
    const examName = examIdentifier.substring(0,examIdentifier.indexOf('.'));
    exam = getExam(examName, getVisit(exam));
    if (!exam) return undefined;
    let examValue = exam[examName];
    const identifier : string = examIdentifier.substring(examName.length+1);
    let value = getValue(examValue, identifier);
    return value;
  } else if (fieldSrc[0]==='patient') {
    let patient = getPatient(exam);
    if (!patient) return undefined;
    return patient[fieldSrc[1]];
  } else if (fieldSrc[0]==='visit') {
    const visit : Visit = getVisit(exam);
    if (!visit) return undefined;
    let fieldName : string = fieldSrc[1];
    for (let i:number=2; i<fieldSrc.length; i++) {
      fieldName=fieldName+'.'+fieldSrc[i];
    }
    if (fieldName==='examDate') {
      fieldName='date'
    }
    return getValue(visit, fieldName);
  } else if (fieldSrc[0]==='clFitting') {
      __DEV__ && console.error('unsupported clFitting field: '+fieldSrc);
      return undefined;
  } else {//A regular exam field
    let value = getValue(exam[exam.definition.name], fieldIdentifier);
    return value;
  }
}

export function setMappedFieldValue(fieldIdentifier: string, value: any, exam: Exam) {
  const fieldSrc : string[] = fieldIdentifier.split('.');
  if (fieldSrc[0]==='exam') {
    __DEV__ && console.log('Setting '+fieldIdentifier+' to '+value);
    let examIdentifier = fieldIdentifier.substring(5);
    const examName = examIdentifier.substring(0,examIdentifier.indexOf('.'));
    exam = getExam(examName, getVisit(exam));
    if (!exam) return undefined;
    let examValue = exam[examName];
    const identifier : string = examIdentifier.substring(examName.length+1);
    setValue(examValue, identifier, value);
    //getFieldDefinition(fieldIdentifier, exam);  TODO: recursive set mapped fields
  } else if (fieldSrc[0]==='clFitting') {
    //TODO: we can ignore clFitting for now
    return;
  } else {
    __DEV__ && console.error('setting mapped field \''+fieldIdentifier+'\' not yet implemented.');
  }
}

export function getFieldDefinition(fieldIdentifier: string, exam: Exam) : any {
  const fieldSrc : string[] = fieldIdentifier.split('.');
  if (fieldSrc[0]==='exam') {//A field of another exam
    let examIdentifier = fieldIdentifier.substring(5);
    const examName = examIdentifier.substring(0,examIdentifier.indexOf('.'));
    const otherExam : Exam = getExam(examName, getVisit(exam));
    const examDefinition : ExamDefinition = otherExam?otherExam.definition:getExamDefinition(examName);
    if (!examDefinition) return undefined;
    const identifiers : string[] = examIdentifier.substring(examName.length+1).split('.');
    let fields : (FieldDefinition|GroupDefinition)[] = examDefinition.fields;
    let fieldDefinition;
    for (let i=0; i<identifiers.length;i++) {
      fieldDefinition = fields.find((definition: FieldDefinition|GroupDefinition) => definition.name === stripIndex(identifiers[i]));
      if (fieldDefinition===undefined) break;
      fields = fieldDefinition.fields;
    }
    if (fieldDefinition===undefined) {
      __DEV__ && console.error('No fieldDefinition \''+fieldIdentifier+'\' exists.');
      return undefined;
    }
    if (fieldDefinition.mappedField) {
      const firstMappedFieldName : string = fieldDefinition.mappedField;
      let mappedFieldDefinition : FieldDefinition = getFieldDefinition(fieldDefinition.mappedField, otherExam);
      fieldDefinition = fieldDefinition=Object.assign({}, mappedFieldDefinition, fieldDefinition);
      let endNode: boolean = mappedFieldDefinition.mappedField===undefined || !mappedFieldDefinition.mappedField.startsWith('exam.');
      while (mappedFieldDefinition.mappedField!==undefined && !endNode) {
        mappedFieldDefinition = getFieldDefinition(mappedFieldDefinition.mappedField, otherExam);
        fieldDefinition = fieldDefinition=Object.assign({}, mappedFieldDefinition, fieldDefinition);
        endNode = mappedFieldDefinition.mappedField===undefined || !mappedFieldDefinition.mappedField.startsWith('exam.');
      }
      fieldDefinition.mappedField = firstMappedFieldName;
    }
    return fieldDefinition;
  } else if (fieldSrc[0]==='visit' || fieldSrc[0]==='patient' || fieldSrc[0]==='clFitting' || fieldSrc[0]==='store') {//A non exam field
    return getItemFieldDefinition(fieldIdentifier);
  } else {//A regular exam field
    let fieldDefinition : FieldDefinition;
    let fields = exam.definition.fields;
    for (const fieldName : string of fieldSrc) {
        if (fields === undefined) {
          fieldDefinition = undefined;
          break;
        }
        fieldDefinition = fields.find((definition:  FieldDefinition|GroupDefinition) => definition.name === stripIndex(fieldName));
        if (fieldDefinition===undefined)
          break;
        fields = fieldDefinition.fields;
    }
    if (fieldDefinition===undefined) {
      __DEV__ && console.error('No fieldDefinition \''+fieldIdentifier+'\' exists.');
      return undefined;
    }
    if (fieldDefinition.mappedField) {
      const firstMappedFieldName : string = fieldDefinition.mappedField;
      let mappedFieldDefinition : FieldDefinition = getFieldDefinition(fieldDefinition.mappedField, exam);
      if (mappedFieldDefinition) {
        fieldDefinition = fieldDefinition=Object.assign({}, mappedFieldDefinition, fieldDefinition);
        let endNode: boolean = mappedFieldDefinition.mappedField===undefined || !mappedFieldDefinition.mappedField.startsWith('exam.');
        while (mappedFieldDefinition.mappedField!==undefined && !endNode) {
          mappedFieldDefinition = getFieldDefinition(mappedFieldDefinition.mappedField, exam);
          fieldDefinition = fieldDefinition=Object.assign({}, mappedFieldDefinition, fieldDefinition);
          endNode = mappedFieldDefinition.mappedField===undefined || !mappedFieldDefinition.mappedField.startsWith('exam.');
        }
        fieldDefinition.mappedField = firstMappedFieldName;
      }
    }
    return fieldDefinition;
  }
}


  export const UserAction = {
  REFERRAL: 0,
  PATIENTFILE: 1
  }
  let currentAction : UserAction ;
  export function getCurrentAction() {
    return currentAction;
  }

  export async function renderExamHtml(exam : Exam, htmlDefinition?: HtmlDefinition[], userAction: UserAction) : any {
    let html : string = '';
    currentAction = userAction;
    if (exam.definition.card===false) {return html;}
    switch (exam.definition.type) {
      case 'selectionLists':
        html = renderItemsHtml(exam, htmlDefinition);
        return html;
      case 'groupedForm':
        html = await renderParentGroupHtml(exam, htmlDefinition);
        return html;
    }
    return html;
  }



export class ExamCardSpecifics extends Component {
  props: {
    exam: Exam
  }
}

export class ExamCard extends Component {
  props: {
    exam: Exam,
    unlocked?: boolean,
    onSelect?: () => void,
    onHide?: () => void,
    disabled?: boolean,
    enableScroll: () => void,
    disableScroll: () => void
  }


  renderExamCardSpecifics() {
    let exam : Exam = this.props.exam;
    if (exam.definition.card===false) {
      return <ExamScreen exam={exam} enableScroll={this.props.enableScroll} disableScroll={this.props.disableScroll} unlocked={this.props.unlocked}/>
    }
    switch (exam.definition.type) {
      case 'selectionLists':
        return <ItemsCard exam={exam} key={exam.definition.name}/>
      case 'groupedForm':
        return <GroupedCard exam={exam} key={exam.definition.name}/>
    }
    return  <View style={styles.flexColumnLayout} key={this.props.exam.definition.name}>
      <Text style={styles.cardTitle}>{exam.definition.name}</Text>
    </View>
  }


  getStyle() : any {
    let style: string = this.props.style;
    if (style) return style;
    style = this.props.exam.definition.card===false?styles.page:this.props.exam.hasStarted?styles.finishedExamCard:styles.todoExamCard;
    return style;
  }

  render() {
    return <TouchableOpacity disabled={this.props.disabled || this.props.onSelect===undefined || this.props.exam.definition.card===false}
      onLongPress={this.props.onHide}
      onPress={this.props.onSelect}
      delayLongPress={300}
      testID={this.props.exam.definition.name+' Tile'}>
      <View style={this.getStyle()}>
        {this.renderExamCardSpecifics()}
      </View>
    </TouchableOpacity>
  }
}

export function getExamHistory(exam: Exam) : Exam[] {
  const visit = getCachedItem(exam.visitId);
  if (!visit) return [];
  const visitHistory : Visit[] = getCachedItems(getCachedItem('visitHistory-'+visit.patientId));
  const examDefinitionName : string = exam.definition.name;
  let examLists : Exam[][] = visitHistory.map((visit: Visit) => allExamIds(visit).map((examId: string) => getCachedItem(examId)).filter((exam: Exam) => exam.definition.name === examDefinitionName));
  let exams : Exam[] = examLists.map((examList : Exam[], index: number) => examList.length===0?undefined:examList[0]).filter(exam => exam!==undefined);
  return exams;
}

export class ExamHistoryScreen extends Component {
  props: {
    navigation: any
  }
  params: {
    exam: Exam
  }
  state : {
    examHistory : Exam[],
    patient: ?Patient,
    zoomScale : number,
  }

  constructor(props: any) {
    super(props);
    const params = this.props.navigation.state.params;
    let examHistory : Exam[] = getExamHistory(params.exam);
    let patient : Patient = getPatient(params.exam);
    this.state = {
      examHistory,
      patient,
      zoomScale: new Animated.Value(1)
    };
  }

  componentDidMount() {
    Animated.timing(this.state.zoomScale, {toValue: 0.70, duration: 1000, easing: Easing.ease}).start();
  }

  addItem(item: any) {
    //TODO: check if visit is editable and show a confirmation ?
    let exam : Exam = this.props.navigation.state.params.exam;
    if (exam.definition.addable) {
      let items : any[] = exam[exam.definition.name];
      if (!items.includes(item))
        items.push(deepClone(item));
    } else {
      let examItem : {} = exam[exam.definition.name];
      if (examItem instanceof Array) {
         if (examItem.length!==1) return;
         examItem = examItem[0];
      }
      Object.assign(examItem, deepClone(item));
    }
    exam.isDirty = true;
    this.forceUpdate(); //TODO update exam
  }

  renderGroup(groupDefinition: GroupDefinition, value: any, index: number) {
    if (groupDefinition.mappedField) {
      groupDefinition = Object.assign({}, getItemFieldDefinition(groupDefinition.mappedField), groupDefinition);
    }
    if (groupDefinition.options!=undefined) {
      return <CheckList definition={groupDefinition} editable={this.props.editable} value={value} editable={false} />
    }
    if (groupDefinition.multiValue===true) {
      if (value instanceof Array === false || value.length===0) return null;
        if(groupDefinition.options == undefined) {
          groupDefinition = deepClone(groupDefinition);
          groupDefinition.multiValue = false;
          return value.map((childValue: any, index: number)=> <GroupedForm definition={groupDefinition} editable={false} key={index} form={childValue} patientId={this.state.patient?this.state.patient.id:undefined} />);
      }
    } else if (groupDefinition.type==='SRx') {
      let exam : Exam = this.props.navigation.state.params.exam;
      return <GlassesDetail title={formatLabel(groupDefinition)} editable={false} glassesRx={value} key={groupDefinition.name} definition={groupDefinition}
       hasVA={groupDefinition.hasVA} hasAdd={groupDefinition.hasAdd} examId={exam.id}/>
    }
    return  <GroupedForm definition={groupDefinition} editable={false} form={value} key={index} patientId={this.state.patient?this.state.patient.id:undefined}  examId={this.props.navigation.state.params.exam.id}
 />
  }

  renderExam(exam: Exam) {
    if (exam===undefined || exam.definition===undefined || exam[exam.definition.name]===undefined) return null;
    const visitDate :string = exam.visitId?formatMoment(getCachedItem(exam.visitId).date):'Today';
    switch (exam.definition.type) {
      case 'selectionLists':
          return <ItemsList
                  editable = {false}
                  //onSelectItem = {(item) => this.addItem(item)}
                  title={visitDate}
                  items={exam[exam.definition.name]}
                  fieldDefinitions={exam.definition.fields}
                  titleFields = {exam.definition.titleFields}
                  itemView={exam.definition.editable?'EditableItem':'ItemSummary'}
                  key={exam.id}
                  style={exam.id===this.props.navigation.state.params.exam.id?styles.historyBoardSelected:styles.historyBoard}
                  //orientation =
          />
      case 'groupedForm':
        return <View style={exam.id===this.props.navigation.state.params.exam.id?styles.historyBoardSelected:styles.historyBoard} key={exam.id}>
          <Text style={styles.cardTitle}>{visitDate}</Text>
          <View style={styles.flow}>
          {exam.definition.fields && exam.definition.fields.map((groupDefinition: FieldDefinition|GroupDefinition, index: number) =>
            this.renderGroup(groupDefinition, exam[exam.definition.name][groupDefinition.name], index)
          )}
          </View>
      </View>
      case 'paperForm':
        return <PaperFormScreen exam={exam} editable={false} key={exam.id} />
    }
    return null;
  }

  render() {
    //TODO flatlist
    return <Animated.ScrollView minimumZoomScale={0.5} maximumZoomScale={1} zoomScale={this.state.zoomScale}>
        {this.state.examHistory.map((exam: Exam) => this.renderExam(exam))}
      </Animated.ScrollView>
    }
}


function examIsLocked(exam: Exam) : boolean {
  if (exam===null || exam===undefined) return false;
  return visitHasEnded(exam.visitId);
}

export class ExamScreen extends Component {
  props: {
    exam: ?Exam,
    navigation: any,
    unlocked?: boolean,
    enableScroll: () => void,
    disableScroll: () => void
  }
  state: {
    exam: Exam,
    appointmentStateKey: string,
    isDirty: boolean,
    locked: boolean,
    scrollable: boolean,
    favorites: ExamPredefinedValue[]
  }

  constructor(props: any) {
    super(props);
    let exam: Exam =  (this.props.navigation && this.props.navigation.state && this.props.navigation.state.params)?this.props.navigation.state.params.exam:this.props.exam;
    this.state = {
      exam,
      appointmentStateKey: (this.props.navigation && this.props.navigation.state && this.props.navigation.state.params)?this.props.navigation.state.params.appointmentStateKey:undefined,
      isDirty: exam.errors!==undefined,
      locked: this.props.unlocked!==true && examIsLocked(exam),
      scrollable: true,
      favorites: exam.definition.starable?getFavorites(exam):undefined //TODO don't get favourirtes for locked exam. exam.definition.id
    }
  }

  componentDidMount() {
    if (this.state.exam.id!=undefined && this.state.exam.errors===undefined) this.fetchExam();
  }

  componentDidUpdate(prevProps: any) {
    let exam: Exam =  (this.props.navigation && this.props.navigation.state && this.props.navigation.state.params)?this.props.navigation.state.params.exam:this.props.exam;
    if (this.state.exam.id===exam.id) {
      //__DEV__ && console.log('ExamScreen did update with same exam id '+exam.id);
      return;
    }
    //__DEV__ && console.log('ExamScreen did update after receiving new exam with id '+exam.id);
    if (this.state.isDirty) {
      this.storeExam(this.state.exam);
    }
    this.setState({
      exam,
      appointmentStateKey: (this.props.navigation && this.props.navigation.state && this.props.navigation.state.params)?this.props.navigation.state.params.appointmentStateKey:undefined,
      isDirty: exam.errors!==undefined,
      locked: !this.props.unlocked && examIsLocked(exam),
      scrollable: true,
      favorites: exam.definition.starable?getFavorites(exam):undefined //TODO don't get favourirtes for locked exam. exam.definition.id
    });
  }

  componentWillUnmount() {
    //__DEV__ && console.log('Exam will unmount dirty='+this.state.isDirty);
    if (this.state.isDirty) {
      //__DEV__ && console.log('Saving previous exam that was still dirty.'+this.props.navigation);
      this.storeExam(this.state.exam);
    }
  }

  async fetchExam() {
    const exam: Exam = await fetchExam(this.state.exam.id);
    if (this.state.exam!==exam) {
      this.setState({exam, isDirty: false});
    }
  }

  async refreshExam() {
    let exam: Exam = await fetchExam(this.state.exam.id, true);
    if (exam===undefined) return;
    this.setState({exam, isDirty: false});
  }

  async storePreviousExam(exam: Exam) {
    exam.hasStarted = true;
    exam = await storeExam(exam, this.state.appointmentStateKey, this.props.navigation);
    if (exam.errors===undefined) {
      updateMappedExams(exam);
    } else {
      __DEV__ && console.log('//TODO pass navigation prop to examscreen card');
      //this.props.navigation.navigate('exam', {exam: exam});
    }
  }

  async storeExam(exam: Exam) {
    exam.hasStarted = true;
    exam = await storeExam(exam, this.state.appointmentStateKey, this.props.navigation);
    if (exam.errors===undefined) updateMappedExams(exam);
    if (this.props.exam) {
      if (this.state.exam.id===exam.id) {
        this.setState({exam, isDirty: exam.errors!==undefined});
      }
    } else {
      if (exam.errors) {
        this.props.navigation.navigate('exam', {exam: exam});
      }
    }
  }

  updateExam = (exam: Exam) : void => {
    //__DEV__ && console.log('Examscreen updateExam called');
    this.setState({exam, isDirty:true});
  }

  async removeFavorite(favorite: ExamPredefinedValue) {
    let favorites : ExamPredefinedValue[] = this.state.favorites;
    favorites = favorites.filter((aFavorite: ExamPredefinedValue) => aFavorite!==favorite);
    this.setState({favorites});
    await removeFavorite(favorite);
    this.setState({favorites: getFavorites(this.state.exam)});
  }

  addFavorite = async (favorite: any, name: string) => {
    const exam: ?Exam = this.state.exam;
    if (exam===undefined) return;
    await storeFavorite(favorite, exam.definition.id, name);
    this.setState({favorites: getFavorites(this.state.exam)});
  }

  addExamFavorite = (name: string) => {
    let exam = this.state.exam[this.state.exam.definition.name];
    this.addFavorite(exam, name);
  }

  switchLock = () => {
    this.setState({locked: this.state.locked===true?false:true})
  }

  getVisit() : Visit {
    return getVisit(this.state.exam);
  }

  getRelatedExam(examName: string) : Exam {
    const visit : Visit = this.getVisit();
    let examId = visit.customExamIds.find((examId: string) => getCachedItem(examId)!==null && getCachedItem(examId)!==undefined && getCachedItem(examId).definition.name===examName);
    if (!examId) examId = visit.preCustomExamIds.find((examId: string) => getCachedItem(examId).definition.name===examName);
    const exam : Exam = getCachedItem(examId);
    return exam;
  }

  enableScroll = () => {
    if (this.props.enableScroll) {
       this.props.enableScroll();
    } else {
      this.setState({scrollable: true});
    }
  }

  disableScroll = () => {
    if (this.props.disableScroll) {
      this.props.disableScroll();
    } else {
      this.setState({scrollable: false});
    }
  }

  renderExam() {
    if (!this.state.exam) return null;
    switch (this.state.exam.definition.type) {
      case 'selectionLists':
          return <SelectionListsScreen exam={this.state.exam} onUpdateExam={this.updateExam} editable={this.state.locked!==true}
            favorites={this.state.favorites} onAddFavorite={this.state.exam.definition.starable?this.addFavorite:undefined} onRemoveFavorite={(favorite: ExamPredefinedValue) => this.removeFavorite(favorite)}/>
      case 'groupedForm':
          return <GroupedFormScreen exam={this.state.exam} onUpdateExam={this.updateExam} editable={this.state.locked!==true} favorites={this.state.favorites} onAddFavorite={this.state.exam.definition.starable?this.addFavorite:undefined} onRemoveFavorite={(favorite: ExamPredefinedValue) => this.removeFavorite(favorite)} enableScroll={this.enableScroll} disableScroll={this.disableScroll}/>
      case 'paperForm':
        return <PaperFormScreen exam={this.state.exam} onUpdateExam={this.updateExam} editable={this.state.locked!==true} appointmentStateKey={this.state.appointmentStateKey} navigation={this.props.navigation} enableScroll={this.enableScroll} disableScroll={this.disableScroll}/>
    }
    return <Text style={styles.screenTitle}>{this.state.exam.definition.type} {this.state.exam.definition.name} Exam</Text>
  }

  renderLockIcon() {
    if (!this.state.locked) return null;
    return <TouchableOpacity onPress={this.switchLock}><Lock style={styles.screenIcon} locked={this.state.locked===true} testID={this.state.locked===true?'unlockExam':'lockExam'}/></TouchableOpacity>
  }

  renderFavoriteIcon() {
    if (!this.state.exam) return null;
    if (this.state.locked || this.state.exam.definition.starable!==true || this.state.exam.definition.starable!==true || (this.state.exam.definition.type!=='selectionLists' && this.state.exam.definition.type!=='groupedForm')) return null;
    return <Star onAddFavorite={this.addExamFavorite}  style={styles.screenIcon} testID='favoriteExam'/>
  }

  renderRefreshIcon() {
    if (this.state.locked) return null;
    return <TouchableOpacity onPress={() => this.refreshExam()} testID='refreshExam'><Refresh style={styles.screenIcon}/></TouchableOpacity>
  }

  renderExamIcons() {
    if (this.state.exam.definition.card===false) return;
    return <View style={styles.examIcons}>
      {this.renderRefreshIcon()}
      {this.renderFavoriteIcon()}
      {this.renderLockIcon()}
    </View>
  }

  renderRelatedExams() {
    if (this.state.exam.definition.relatedExams===undefined || this.state.exam.definition.relatedExams===null || this.state.exam.definition.relatedExams.length===0) return null;
    return <View style={styles.flow}>
      {this.state.exam.definition.relatedExams.map((relatedExamName: string, index: number) => {
        const relatedExam : Exam = this.getRelatedExam(relatedExamName);
        return relatedExam && <ExamCard exam={relatedExam} style={styles.examCard} key={index} />
      })}
    </View>
  }

  render() {
    if (this.state.exam.definition.scrollable===true) return <KeyboardAwareScrollView  style={styles.page} minimumZoomScale={1.0} maximumZoomScale={2.0} bounces={false} bouncesZoom={false}
      scrollEnabled={this.props.disableScroll===undefined && this.state.scrollable} pinchGestureEnabled={this.state.scrollable}>
                <ErrorCard errors={this.state.exam.errors} />
                {this.renderRelatedExams()}
                {this.renderExam()}
                {this.renderExamIcons()}
                </KeyboardAwareScrollView>
    if (this.props.disableScroll) return <View style={styles.centeredColumnLayout}>
        <ErrorCard errors={this.state.exam.errors} />
        {this.renderRelatedExams()}
        {this.renderExam()}
        {this.renderExamIcons()}
        </View>
    return <KeyboardAwareScrollView contentContainerStyle={isWeb ? {} : styles.centeredScreenLayout} scrollEnabled={isWeb}>
        <View style={styles.centeredColumnLayout}>
          <ErrorCard errors={this.state.exam.errors} />
          {this.renderRelatedExams()}
          {this.renderExam()}
        </View>
        {this.renderExamIcons()}
      </KeyboardAwareScrollView>
  }
}

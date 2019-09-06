/**
 * @flow
 */
'use strict';

import React, { Component, PureComponent } from 'react';
import { View, TouchableHighlight, Text, TouchableOpacity, ScrollView, Button, Animated, Easing} from 'react-native';
import { NavigationActions } from 'react-navigation';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import type {Exam, Patient, GlassesRx, Visit, ExamPredefinedValue, ExamDefinition, FieldDefinition, GroupDefinition } from './Types';
import { styles, fontScale, selectionFontColor } from './Styles';
import { strings} from './Strings';
import { SelectionListsScreen, ItemsCard, GroupedFormScreen, ItemsList, GroupedForm, GroupedCard, formatLabel, getFieldDefinition as getItemFieldDefinition} from './Items';
import { PaperFormScreen} from './PaperForm';
import { fetchItemById, storeItem, searchItems } from './Rest';
import { cacheItemById, getCachedItem, cacheItem, getCachedItems } from './DataCache';
import { deepClone, formatMoment, getValue, stripIndex, setValue } from './Util';
import { allExamIds, fetchVisit, visitHasEnded } from './Visit';
import { GlassesDetail } from './Refraction';
import { getFavorites, addFavorite, removeFavorite, Star, Refresh } from './Favorites';
import { getExamDefinition } from './ExamDefinition';
import { Lock } from './Widgets';
import { ErrorCard } from './Form';

export async function fetchExam(examId: string, ignoreCache?: boolean) : Exam {
  let exam = await fetchItemById(examId, ignoreCache);
  //overwriteExamDefinition(exam);
  return exam;
}

export async function createExam(exam: Exam) : Exam {
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
  return getCachedItem(exam.visitId);
}

export function getPatient(exam: Exam) : Patient {
  const visit : Visit = getVisit(exam);
  return getCachedItem(visit.patientId);
}

export function getExam(examName: string, visit: Visit) : Exam {
  let examId = visit.customExamIds.find((examId: string) => getCachedItem(examId).definition.name===examName);
  if (!examId) examId = visit.preCustomExamIds.find((examId: string) => getCachedItem(examId).definition.name===examName);
  const exam : Exam = getCachedItem(examId);
  return exam;
}

export function getFieldValue(fieldIdentifier: string, exam: Exam) : any {
  const fieldSrc : string = fieldIdentifier.split('.');
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
  } else if (fieldSrc[0]==='visit' || fieldSrc[0]==='clFitting') {//A non exam field
    __DEV__ && console.error('unsupported value field src: '+fieldSrc);
  } else {//A regular exam field
    let value = getValue(exam[exam.definition.name], fieldIdentifier);
    return value;
  }
}

export function getFieldDefinition(fieldIdentifier: string, exam: Exam) : any {
  const fieldSrc : string[] = fieldIdentifier.split('.');
  if (fieldSrc[0]==='exam') {//A field of another exam
    let examIdentifier = fieldIdentifier.substring(5);
    const examName = examIdentifier.substring(0,examIdentifier.indexOf('.'));
    const otherExam = getExam(examName, getVisit(exam));
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
      fieldDefinition = fieldDefinition=Object.assign({}, getFieldDefinition(fieldDefinition.mappedField, getVisit(exam)), fieldDefinition);
    }
    return fieldDefinition;
  } else if (fieldSrc[0]==='visit' || fieldSrc[0]==='patient' || fieldSrc[0]==='clFitting') {//A non exam field
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
      fieldDefinition = Object.assign({}, getFieldDefinition(fieldDefinition.mappedField, getVisit(exam)), fieldDefinition);
    }
    return fieldDefinition;
  }
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
    style = this.props.exam.definition.card===false?styles.page:this.props.exam.hasEnded?styles.finishedExamCard:styles.todoExamCard;
    return style;
  }

  render() {
    return <TouchableOpacity disabled={this.props.disabled || this.props.onSelect===undefined || this.props.exam.definition.card===false}
      onLongPress={this.props.onHide}
      onPress={this.props.onSelect}
      delayLongPress={300}>
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
    zoomScale : number,
  }

  constructor(props: any) {
    super(props);
    this.params = this.props.navigation.state.params;
    let examHistory : Exam[] = getExamHistory(this.params.exam);
    this.state = {
      examHistory,
      zoomScale: new Animated.Value(1)
    };
  }

  componentWillReceiveProps(nextProps: any) {
    this.params = nextProps.navigation.state.params;
  }

  componentDidMount() {
    Animated.timing(this.state.zoomScale, {toValue: 0.70, duration: 1000, easing: Easing.ease}).start();
  }

  addItem(item: any) {
    //TODO: check if visit is editable and show a confirmation ?
    if (this.params.exam.definition.addable) {
      let items : any[] = this.params.exam[this.params.exam.definition.name];
      if (!items.includes(item))
        items.push(deepClone(item));
    } else {
      let examItem : {} = this.params.exam[this.params.exam.definition.name];
      if (examItem instanceof Array) {
         if (examItem.length!==1) return;
         examItem = examItem[0];
      }
      Object.assign(examItem, deepClone(item));
    }
    this.params.exam.isDirty = true;
    this.forceUpdate(); //TODO update exam
  }

  renderGroup(groupDefinition: GroupDefinition, value: any, index: number) {
    if (groupDefinition.mappedField) {
      groupDefinition = Object.assign({}, getItemFieldDefinition(groupDefinition.mappedField), groupDefinition);
    }
    if (groupDefinition.multiValue===true) {
      groupDefinition = deepClone(groupDefinition);
      groupDefinition.multiValue = false;
      if (value instanceof Array === false || value.length===0) return null;
      return value.map((childValue: any, index: number)=> <GroupedForm definition={groupDefinition} editable={false} key={index} form={childValue} />);
    } else if (groupDefinition.type==='SRx') {
      return <GlassesDetail title={formatLabel(groupDefinition)} editable={false} glassesRx={value} key={groupDefinition.name} definition={groupDefinition}/>
    } else if (groupDefinition.type==='CRx') {
      return <ContactsDetail title={formatLabel(groupDefinition)} editable={false} glassesRx={value} key={groupDefinition.name}/>
    }
    return  <GroupedForm definition={groupDefinition} editable={false} form={value} key={index} />
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
                  style={exam.id===this.params.exam.id?styles.historyBoardSelected:styles.historyBoard}
                  //orientation =
          />
      case 'groupedForm':
        return <View style={exam.id===this.params.exam.id?styles.historyBoardSelected:styles.historyBoard} key={exam.id}>
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
  params: {
    exam: Exam,
    appointmentStateKey: string
  }
  state: {
    exam: Exam,
    isDirty: boolean,
    locked: boolean,
    scrollable: boolean,
    favorites: ExamPredefinedValue[]
  }

  constructor(props: any) {
    super(props);
    //__DEV__ && console.log('Examscreen constructed');
    if (this.props.navigation && this.props.navigation.state && this.props.navigation.state.params) {
        this.params = this.props.navigation.state.params;
    } else {
      this.params = {
        exam: this.props.exam,
      }
    }
    this.params.exam.hasStarted=true;
    this.state = {
      exam: this.params.exam,
      isDirty: this.params.exam.errors!==undefined,
      locked: !this.props.unlocked && examIsLocked(this.params.exam),
      scrollable: true,
      favorites: this.params.exam.definition.starable?getFavorites(this.params.exam):undefined //TODO don't get favourirtes for locked exam. exam.definition.id
    }
  }

  componentWillReceiveProps(nextProps: any) {
    //__DEV__ && console.log('Examscreen receives props');
    if (nextProps.navigation && nextProps.navigation.state && nextProps.navigation.state.params) {
        this.params = nextProps.navigation.state.params;
    } else {
      this.params = {
        exam: nextProps.exam,
      };
    }
    if (this.state.exam.id===this.params.exam.id) {//We ignore the same exam as sliding back overwrites with old data !
      //__DEV__ && console.log('Examscreen ignoring receiving same exam id');
      this.setState({locked: !this.props.unlocked && examIsLocked(this.params.exam)});
      return;
    }
    if (this.state.isDirty) {
      //__DEV__ && console.log('Saving previous exam that was still dirty.'+this.props.navigation);
      this.storePreviousExam(this.state.exam);
    }
    this.params.exam.hasStarted=true;
    this.setState({
      exam: this.params.exam,
      isDirty: this.params.exam.errros!==undefined,
      locked: !this.props.unlocked && examIsLocked(this.params.exam),
      favorites: this.params.exam.definition.starable?getFavorites(this.params.exam):undefined //TODO don't get favourirtes for locked exam. exam.definition.id
    });
  }

  componentDidMount() {
    //__DEV__ && console.log('Examscreen did mount');
    if (this.params.exam.id && this.params.exam.errors===undefined) this.fetchExam();
  }

  async fetchExam() {
    const exam: Exam = await fetchExam(this.params.exam.id);
    if (this.params.exam!==exam) {
      if (exam!=undefined) exam.hasStarted = true;
      this.setState({exam, isDirty: false});
    }
  }

  async refreshExam() {
    let exam: Exam = await fetchExam(this.params.exam.id, true);
    //__DEV__ && console.log('Refreshed '+JSON.stringify(exam));
    this.state.exam[exam.definition.name]=undefined;
    exam = Object.assign(this.state.exam, exam);
    exam.hasStarted = true;
    this.setState({exam, isDirty: false});
  }

  async storePreviousExam(exam: Exam) {
    exam.hasEnded = true;
    exam = await storeExam(exam, this.params.appointmentStateKey, this.props.navigation);
    if (exam.errors===undefined) {
      updateMappedExams(exam);
    } else {
      __DEV__ && console.log('//TODO pass navigation prop to examscreen card');
      //this.props.navigation.navigate('exam', {exam: exam});
    }
  }

  async storeExam(exam: Exam) {
    //__DEV__ && console.log('Saving exam !');
    exam.hasEnded = true;
    exam = await storeExam(exam, this.params.appointmentStateKey, this.props.navigation);
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

  /**
  cleanExam() {
    let exam = this.state.exam;
    exam.definition.fields.forEach((groupDefinition: GroupDefinition|FieldDefinition) => {
      if (groupDefinition.multiValue) {
        let values : any[] = exam[exam.definition.name][groupDefinition.name];
        let cleanedValues = values.filter(value => value!==undefined && Object.keys(value).length!==0);
        if (values.length!==cleanedValues.length) {
           exam[exam.definition.name][groupDefinition.name] = cleanedValues;
        }
      }
    });
  }
  */

  updateExam = (exam: Exam) : void => {
    //__DEV__ && console.log('Examscreen updateExam called');
    if (this.props.exam) {
      this.setState({exam, isDirty:true});
      //this.storeExam(exam);
    } else {
      if (!this.state.isDirty) this.setState({exam, isDirty:true})
      else (this.setState({exam}));
    }
  }

  componentWillUnmount() {
    //__DEV__ && console.log('Examscreen will unmount');
    if (this.state.isDirty) {
      this.storeExam(this.state.exam);
    }
  }

  addFavorite = (favorite: any) => {
    addFavorite(favorite, this.state.exam.definition.id,
      () => this.setState({favorites: getFavorites(this.params.exam)}));
  }

  async removeFavorite(favorite: ExamPredefinedValue) {
    await removeFavorite(favorite);
    this.setState({favorites: getFavorites(this.params.exam)});
  }

  addExamAsFavorite = () => {
    let exam = this.state.exam[this.state.exam.definition.name];
    this.addFavorite(exam);
  }

  switchLock = () => {
    this.setState({locked: this.state.locked===true?false:true})
  }

  getVisit() : Visit {
    return getVisit(this.params.exam);
  }

  getRelatedExam(examName: string) : Exam {
    const visit : Visit = this.getVisit();
    let examId = visit.customExamIds.find((examId: string) => getCachedItem(examId).definition.name===examName);
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
    switch (this.state.exam.definition.type) {
      case 'selectionLists':
          return <SelectionListsScreen exam={this.state.exam} onUpdateExam={this.updateExam} editable={this.state.locked!==true}
            favorites={this.state.favorites} onAddFavorite={this.params.exam.definition.starable?this.addFavorite:undefined} onRemoveFavorite={(favorite: ExamPredefinedValue) => this.removeFavorite(favorite)}/>
      case 'groupedForm':
          return <GroupedFormScreen exam={this.state.exam} onUpdateExam={this.updateExam} editable={this.state.locked!==true} favorites={this.state.favorites} onAddFavorite={this.params.exam.definition.starable?this.addFavorite:undefined} onRemoveFavorite={(favorite: ExamPredefinedValue) => this.removeFavorite(favorite)} enableScroll={this.enableScroll} disableScroll={this.disableScroll}/>
      case 'paperForm':
        return <PaperFormScreen exam={this.state.exam} onUpdateExam={this.updateExam} editable={this.state.locked!==true} appointmentStateKey={this.params.appointmentStateKey} navigation={this.props.navigation} enableScroll={this.enableScroll} disableScroll={this.disableScroll}/>
    }
    return <Text style={styles.screenTitle}>{this.params.exam.definition.type} {this.params.exam.definition.name} Exam</Text>
  }

  renderLockIcon() {
    if (!this.state.locked) return null;
    return <TouchableOpacity onPress={this.switchLock}><Lock style={styles.screenIcon} locked={this.state.locked===true}/></TouchableOpacity>
  }

  renderFavoriteIcon() {
    if (this.state.locked || this.state.exam.definition.starable!==true || this.state.exam.definition.starable!==true || (this.state.exam.definition.type!=='selectionLists' && this.state.exam.definition.type!=='groupedForm')) return null;
    return <TouchableOpacity onPress={this.addExamAsFavorite}><Star style={styles.screenIcon}/></TouchableOpacity>
  }

  renderRefreshIcon() {
    if (this.state.locked) return null;
    return <TouchableOpacity onPress={() => this.refreshExam()}><Refresh style={styles.screenIcon}/></TouchableOpacity>
  }

  renderExamIcons() {
    if (this.params.exam.definition.card===false) return;
    return <View style={styles.examIcons}>
      {this.renderRefreshIcon()}
      {this.renderFavoriteIcon()}
      {this.renderLockIcon()}
    </View>
  }

  renderRelatedExams() {
    if (this.params.exam.definition.relatedExams===undefined || this.params.exam.definition.relatedExams===null || this.params.exam.definition.relatedExams.length===0) return null;
    return <View style={styles.flow}>
      {this.params.exam.definition.relatedExams.map((relatedExamName: string, index: number) => {
        const relatedExam : Exam = this.getRelatedExam(relatedExamName);
        return relatedExam && <ExamCard exam={relatedExam} style={styles.examCard} key={index} />
      })}
    </View>
  }

  render() {
    if (this.params.exam.definition.scrollable===true) return <KeyboardAwareScrollView  style={styles.page} minimumZoomScale={1.0} maximumZoomScale={2.0} bounces={false} bouncesZoom={false} scrollEnabled={this.props.disableScroll===undefined && this.state.scrollable} pinchGestureEnabled={this.state.scrollable}>
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
    return <KeyboardAwareScrollView contentContainerStyle={styles.centeredScreenLayout} scrollEnabled={false}>
        <View style={styles.centeredColumnLayout}>
          <ErrorCard errors={this.state.exam.errors} />
          {this.renderRelatedExams()}
          {this.renderExam()}
        </View>
        {this.renderExamIcons()}
      </KeyboardAwareScrollView >
  }
}

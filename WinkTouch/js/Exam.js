/**
 * @flow
 */
'use strict';

import React, { Component, PureComponent } from 'react';
import { View, TouchableHighlight, Text, TouchableOpacity, ScrollView, Button, Animated, Easing} from 'react-native';
import { NavigationActions } from 'react-navigation';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import type {Exam, Patient, GlassesRx, Visit, ExamPredefinedValue, ExamDefinition, FieldDefinition, GroupDefinition, VisitProcedure, Diagnose } from './Types';
import { styles, fontScale, selectionFontColor } from './Styles';
import { strings} from './Strings';
import { SelectionListsScreen, ItemsCard, GroupedFormScreen, ItemsList, GroupedForm, GroupedCard, formatLabel, getFieldDefinition as getItemFieldDefinition} from './Items';
import { PaperFormScreen} from './PaperForm';
import { fetchItemById, storeItem, searchItems } from './Rest';
import { cacheItemById, getCachedItem, cacheItem, getCachedItems } from './DataCache';
import { deepClone, formatMoment } from './Util';
import { allExamIds, fetchVisit, visitHasEnded } from './Visit';
import { GlassesDetail } from './Refraction';
import { getFavorites, addFavorite, removeFavorite, Star } from './Favorites';
import { overwriteExamDefinition } from './ExamDefinition';
import { Lock } from './Widgets';

export async function fetchExam(examId: string) : Exam {
  let exam = await fetchItemById(examId);
  overwriteExamDefinition(exam);
  return exam;
}

export async function createExam(exam: Exam) : Exam {
  exam = await storeItem(exam);
  return exam;
}

export async function storeExam(exam: Exam, appointmentStateKey: string, navigation: any) : Exam {
  exam = deepClone(exam);
  exam.definition = undefined;
  exam = await storeItem(exam);
  if (exam.errors) {
    return exam;
  }
  overwriteExamDefinition(exam);
  if (exam.definition.name==='RxToOrder' || exam.definition.name==='Refraction' || exam.definition.name==='Diagnose') {//TODO check if exam has mapped visit fields
    let visit = await fetchVisit(exam.visitId);
    const setParamsAction = NavigationActions.setParams({
      params: { refresh: true },
      key: appointmentStateKey
    })
    navigation.dispatch(setParamsAction);
  }
  return exam;
}

export function getVisit(exam: Exam) : Visit {
  return getCachedItem(exam.visitId);
}

export function getExam(examName: string, visit: Visit) : Exam {
  let examId = visit.customExamIds.find((examId: string) => getCachedItem(examId).definition.name===examName);
  if (!examId) examId = visit.preCustomExamIds.find((examId: string) => getCachedItem(examId).definition.name===examName);
  const exam : Exam = getCachedItem(examId);
  return exam;
}

function stripIndex(identifier: string) : string {
  if (identifier.endsWith(']')) {
    identifier = identifier.substring(0,identifier.indexOf('['));
  }
  return identifier;
}

function getIndex(identifier: string) : ?number {
  if (identifier.endsWith(']')) {
    let index = identifier.substring(identifier.indexOf('[')+1, identifier.indexOf(']'));
    return parseInt(index);
  }
  return undefined;
}

function subValue(value, identifier: string) {
  if (value===undefined || value===null) return value;
  let subValue = value[stripIndex(identifier)];
  const index : ?number = getIndex(identifier);
  if (index!==undefined) {
    subValue = subValue[index];
  }
  return subValue;
}

export function getFieldValue(fieldIdentifier: string, exam: Exam) : any {
  const fieldSrc : string = fieldIdentifier.split('.');
  if (fieldSrc[0]==='exam') {//A field of another exam
    let examIdentifier = fieldIdentifier.substring(5);
    const examName = examIdentifier.substring(0,examIdentifier.indexOf('.'));
    exam = getExam(examName, getVisit(exam))[examName];
    const identifiers : string[] = examIdentifier.substring(examName.length+1).split('.');
    let value : any = exam;
    for (const identifier: string of identifiers) {
      value = subValue(value, identifier);
    }
    return value;
  } else if (fieldSrc[0]==='visit' || fieldSrc[0]==='patient') {//A non exam field
    console.error('unsupported value field src: '+fieldSrc);
  } else {//A regular exam field
    let value : any = exam[exam.definition.name];
    for (const identifier: string of fieldSrc) {
      value = subValue(value, identifier);
    }
    return value;
  }
}

export function getFieldDefinition(fieldIdentifier: string, exam: Exam) : any {
  const fieldSrc : string[] = fieldIdentifier.split('.');
  if (fieldSrc[0]==='exam') {//A field of another exam
    let examIdentifier = fieldIdentifier.substring(5);
    const examName = examIdentifier.substring(0,examIdentifier.indexOf('.'));
    const examDefinition : ExamDefinition = getExam(examName, getVisit(exam)).definition;
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
      fieldDefinition = getFieldDefinition(fieldDefinition.mappedField, getVisit(exam));
    }
    return fieldDefinition;
  } else if (fieldSrc[0]==='visit' || fieldSrc[0]==='patient') {//A non exam field
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
      fieldDefinition = getFieldDefinition(fieldDefinition.mappedField, getVisit(exam));
    }
    return fieldDefinition;
  }
}

export class ExamCardSpecifics extends Component {
  props: {
    isExpanded: boolean,
    exam: Exam
  }
}

export class ExamCard extends Component {
  props: {
    exam: Exam,
    isExpanded?: boolean,
    onSelect?: () => void,
    onToggleExpand?: () => void
  }

  renderExamCardSpecifics() {
    let exam : Exam = this.props.exam;
    switch (this.props.exam.definition.type) {
      case 'selectionLists':
        return <ItemsCard isExpanded={this.props.isExpanded} exam={exam} />
      case 'groupedForm':
        return <GroupedCard isExpanded={this.props.isExpanded} exam={exam} />
    }
    return  <View style={styles.columnLayout} key={this.props.exam.definition.name}>
      <Text style={styles.cardTitle}>{exam.definition.name}</Text>
    </View>
  }

  getStyle() : any {
    let style: string = this.props.style;
    if (style) return style;
    style = styles.todoExamCard;
    if (this.props.isExpanded) {
      style = styles.todoExamCardExpanded;
      if (this.props.exam.hasEnded) {
        style = styles.finishedExamCardExpanded;
      } else if (this.props.exam.hasStarted) {
        style = styles.startedExamCardExpanded;
      }
    } else {
      if (this.props.exam.hasEnded) {
        style = styles.finishedExamCard;
      } else if (this.props.exam.hasStarted) {
        style = styles.startedExamCard;
      }
    }
    return style;
  }

  render() {
    return <TouchableOpacity disabled={this.props.onSelect===undefined}
      onLongPress={this.props.onToggleExpand}
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
      return <GlassesDetail title={formatLabel(groupDefinition)} editable={false} glassesRx={value} key={groupDefinition.name}/>
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
    navigation: any
  }
  params: {
    exam: Exam,
    appointmentStateKey: string
  }
  state: {
    exam: Exam,
    locked: boolean,
    favorites: ExamPredefinedValue[]
  }
  unmounted: boolean

  constructor(props: any) {
    super(props);
    this.params = this.props.navigation.state.params;
    this.unmounted = false;
    this.params.exam.hasStarted = true;
    this.state = {
      exam: this.params.exam,
      locked: examIsLocked(this.params.exam),
      favorites: this.params.exam.definition.starable?getFavorites(this.params.exam):undefined //TODO don't get favourirtes for locked exam. exam.definition.id
    }
  }

  componentDidMount() {
    if (this.params.exam.id) this.refreshExam();
  }

  componentWillReceiveProps(nextProps: any) {
    this.params = nextProps.navigation.state.params;
  }

  async refreshExam() {
    const exam: Exam = await fetchExam(this.params.exam.id);
    exam.hasStarted = true;
    this.setState({exam});
  }

  async storeExam(exam: Exam) {
    try {
      exam = await storeExam(exam, this.params.appointmentStateKey, this.props.navigation);
      if (!this.unmounted)
        this.setState({exam});
    } catch (error) {
      if (this.unmounted) {
        this.props.navigation.navigate('exam', {exam: this.params.exam});
      } else {
        await this.refreshExam();
      }
    }
  }

  updateExam = (exam: Exam) : void => {
    exam.hasEnded = true;
    this.storeExam(exam);
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  addFavorite = (favorite: any) => {
    addFavorite(favorite, this.state.exam.customExamDefinitionId,
      () => this.setState({favorites: getFavorites(this.params.exam)})); //TODO customExamDefinitionId should be added as exam.definition.id by backend on get or at create exam time?
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

  renderExam() {
    switch (this.state.exam.definition.type) {
      case 'selectionLists':
          return <SelectionListsScreen exam={this.state.exam} onUpdateExam={this.updateExam} editable={this.state.locked!==true}
            favorites={this.state.favorites} onAddFavorite={this.params.exam.definition.starable?this.addFavorite:undefined} onRemoveFavorite={(favorite: ExamPredefinedValue) => this.removeFavorite(favorite)}/>
      case 'groupedForm':
          return <GroupedFormScreen exam={this.state.exam} onUpdateExam={this.updateExam} editable={this.state.locked!==true} favorites={this.state.favorites} onAddFavorite={this.params.exam.definition.starable?this.addFavorite:undefined} onRemoveFavorite={(favorite: ExamPredefinedValue) => this.removeFavorite(favorite)}/>
      case 'paperForm':
        return <PaperFormScreen exam={this.state.exam} onUpdateExam={this.updateExam} editable={this.state.locked!==true} appointmentStateKey={this.params.appointmentStateKey} navigation={this.props.navigation}/>
    }
    return <Text style={styles.screenTitle}>{this.params.exam.definition.type} {this.params.exam.definition.name} Exam</Text>;
  }

  renderLockIcon() {
    if (!this.state.locked) return null;
    return <TouchableOpacity onPress={this.switchLock}><Lock style={styles.screenIcon} locked={this.state.locked===true}/></TouchableOpacity>
  }

  renderFavoriteIcon() {
    if (this.state.locked || this.state.exam.definition.starable!==true || this.state.exam.definition.starable!==true || (this.state.exam.definition.type!=='selectionLists' && this.state.exam.definition.type!=='groupedForm')) return null;
    return <TouchableOpacity onPress={this.addExamAsFavorite}><Star style={styles.screenIcon}/></TouchableOpacity>
  }

  renderExamIcons() {
    return <View style={styles.examIcons}>
      {this.renderFavoriteIcon()}
      {this.renderLockIcon()}
    </View>
  }

  renderRelatedExams() {
    if (this.params.exam.definition.relatedExams===undefined || this.params.exam.definition.relatedExams===null || this.params.exam.definition.relatedExams.length===0) return null;
    return <View style={styles.flow}>
      {this.params.exam.definition.relatedExams.map((relatedExamName: string, index: number) => {
        const relatedExam : Exam = this.getRelatedExam(relatedExamName);
        return relatedExam && <ExamCard exam={relatedExam} style={styles.examCard} key={index}/>
      })}
    </View>
  }

  render() {
    if (this.params.exam.definition.scrollable===true) return <KeyboardAwareScrollView style={styles.page} scrollable={true}>
                {this.renderRelatedExams()}
                {this.renderExam()}
                {this.renderExamIcons()}
    </KeyboardAwareScrollView>
    return<View style={styles.centeredScreenLayout}>
        <View style={styles.centeredColumnLayout}>
          {this.renderRelatedExams()}
          {this.renderExam()}
        </View>
        {this.renderExamIcons()}
      </View >
  }
}

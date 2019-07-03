/**
 * @flow
 */
'use strict';

import React , {PureComponent} from 'react';
import {AlertIOS, View, Text, Button, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import RNBeep from 'react-native-a-beep';
import type { ExamDefinition, ExamPredefinedValue, Exam, Visit} from './Types';
import { styles, selectionFontColor } from './Styles';
import { strings } from './Strings';
import { storeItem, searchItems, deleteItem } from './Rest';
import { cacheItem, getCachedItem } from './DataCache';
import { deepClone, compareDates } from './Util';
import { getVisitTypes } from './Visit';

const examPredefinedValuesCacheKey : string = 'examPredefinedValues';

async function fetchExamPredefinedValues() : ExamPredefinedValue[] {
    const searchCriteria = {};
    let restResponse = await searchItems('ExamPredefinedValue/list', searchCriteria);
    let examPredefinedValues : ExamPredefinedValue[] = restResponse.examPredefinedValueList;
    cacheItem(examPredefinedValuesCacheKey, examPredefinedValues);
    return examPredefinedValues;
}

export async function allExamPredefinedValues() :  ExamPredefinedValue[] {
  let examPredefinedValues : ExamPredefinedValue[] = getCachedItem(examPredefinedValuesCacheKey);
  if (examPredefinedValues===undefined || examPredefinedValues===null || examPredefinedValues.length===0) {
    examPredefinedValues = await fetchExamPredefinedValues();
  }
  return examPredefinedValues;
}

function visitHasStartedExamOfType(visitId: string, examDefinitionId: string) {
  const visit = getCachedItem(visitId);
  let examIds : string[] = [];
  if (visit.customExamIds) examIds = examIds.concat(visit.customExamIds);
  if (visit.preCustomExamIds) examIds = examIds.concat(visit.preCustomExamIds);
  for (let examId: string of examIds) {
    let exam: Exam = getCachedItem(examId);
    if (exam.definition.id === examDefinitionId && exam.hasStarted) {
      return true;
    }
  }
  return false;
}

function getPreviousExamId(patientId: string, currentVisitId: string, examDefinitionId: string) : ?string {
  let visitHistory : String[] = getCachedItem('visitHistory-'+patientId);
  visitHistory = visitHistory.filter((visitId: string) => visitId!==currentVisitId && visitHasStartedExamOfType(visitId, examDefinitionId));
  visitHistory.sort((visitAId: string, visitBId: string) => compareDates(getCachedItem(visitAId).date, getCachedItem(visitBId).date));
  if (visitHistory.length>0) {
    const visit : Visit = getCachedItem(visitHistory[visitHistory.length-1]);
    let examIds : string[] = [];
    if (visit.customExamIds) examIds = examIds.concat(visit.customExamIds);
    if (visit.preCustomExamIds) examIds = examIds.concat(visit.preCustomExamIds);
    const examId : ?string = examIds.find((examId: string) => getCachedItem(examId).definition.id === examDefinitionId);
    return examId;
  }
  return undefined;
}

function getPatientId(exam: Exam) : string {
  const visit: Visit = getCachedItem(exam.visitId);
  return visit.patientId;
}

function getPreviousExamAsFavorite(exam: Exam, favorite: ExamPredefinedValue) : ExamPredefinedValue {
  const patientId : string = getPatientId(exam);
  const currentVisitId : string = exam.visitId;
  const lastExamId :?string = getPreviousExamId(patientId, currentVisitId, favorite.customExamDefinitionId);
  if (lastExamId) {
    favorite = deepClone(favorite);
    const lastExam : Exam = getCachedItem(lastExamId);
    favorite.predefinedValue = lastExam[lastExam.definition.name];
  }
  return favorite;
}

export function getFavorites(exam: Exam) : ExamPredefinedValue[] {
  let examPredefinedValues : ExamPredefinedValue[] = getCachedItem(examPredefinedValuesCacheKey);
  if (!examPredefinedValues) {
    //alert('no predefiend values loaded yet');
    return [];
  }
  let examDefinitionId: string = exam.definition.id;
  let visitTypes : string[] = getVisitTypes();
  if (visitTypes===null || visitTypes===undefined) visitTypes = [];
  let favorites : ExamPredefinedValue[] = examPredefinedValues.filter((examPredefinedValue : ExamPredefinedValue) => examPredefinedValue.customExamDefinitionId === examDefinitionId && visitTypes.includes(examPredefinedValue.name)===false);
  favorites = favorites.map((examPredefinedValue: ExamPredefinedValue) => examPredefinedValue.predefinedValue===undefined?getPreviousExamAsFavorite(exam, examPredefinedValue):examPredefinedValue);
  return favorites;
}

async function storeFavorite(favorite: any, examDefinitionId: string, name: string, callback: () => void) {
  let predefinedValue : ExamPredefinedValue = {id: 'examPredefinedValue', version:-1, customExamDefinitionId: examDefinitionId, predefinedValue: favorite, name};
  favorite = await storeItem(predefinedValue);
  await fetchExamPredefinedValues();
  if (callback) callback();
}

export function addFavorite(favorite: any, examDefinitionId: string, callback: () => void) {
  AlertIOS.prompt('Please give the star a name.',null, name => storeFavorite(favorite, examDefinitionId, name, callback)); //TODO: android
}

export async function removeFavorite(favorite: ExamPredefinedValue) {
  await deleteItem(favorite);
  await fetchExamPredefinedValues();
}

export class Star extends PureComponent {
  props: {
    style: any
  }
  render() {
    return <Icon name='staro' style={this.props.style} color={selectionFontColor}/>
  }
}

export class Cross extends PureComponent {
  props: {
    style: any
  }
  render() {
    return <Icon name='clear' style={this.props.style} color={selectionFontColor}/>
  }
}

export class Garbage extends PureComponent {
  props: {
    style: any
  }
  render() {
    return <Icon name='delete' style={this.props.style} color={selectionFontColor}/>
  }
}

export class Plus extends PureComponent {
  props: {
    style: any
  }
  render() {
    return <Icon name='plus' style={this.props.style} color={selectionFontColor}/>
  }
}

export class Refresh extends PureComponent {
  props: {
    style: any
  }
  render() {
    return <Icon name='reload1' style={this.props.style} color={selectionFontColor}/>
  }
}

export class Undo extends PureComponent {
  props: {
    style: any
  }
  render() {
    return <Icon name='back' style={this.props.style} color={selectionFontColor}/>
  }
}

export class Camera extends PureComponent {
  props: {
    style: any
  }
  render() {
    return <Icon name='camerao' style={this.props.style} color={selectionFontColor}/>
  }
}

export class DrawingIcon extends PureComponent {
  props: {
    style: any,
    color: string
  }
  static defaultProps = {
    color: selectionFontColor
  }

  render() {
    //return <Icon name='show-chart' style={this.props.style} color={this.props.color}/>
    return <Icon name='picture' style={this.props.style} color={this.props.color}/>
  }
}

export class PaperClip extends PureComponent {
  props: {
    style: any,
    color: string
  }
  static defaultProps = {
    color: selectionFontColor
  }
  render() {
    return <Icon name='paperclip' style={this.props.style} color={this.props.color}/>
  }
}

export class CopyRow extends PureComponent {
  props: {
    onPress: () => void,
    style: any,
    color: string
  }
  static defaultProps = {
    color: selectionFontColor
  }

  render() {
    return  <TouchableOpacity onPress={this.props.onPress} style={styles.bottomEndOfRow}><Icon name='doubleright' style={styles.copyRow} color={this.props.color}/></TouchableOpacity>
  }
}

export class CopyColumn extends PureComponent {
  props: {
    onPress: () => void,
    style: any,
    color: string
  }
  static defaultProps = {
    color: selectionFontColor
  }

  render() {
    return  <TouchableOpacity onPress={this.props.onPress}><Icon name='doubleright' style={styles.copyColumn} color={this.props.color}/></TouchableOpacity>
  }
}


export class Favorites extends PureComponent {
  props: {
    favorites?: ExamPredefinedValue[],
    onSelectFavorite: (predefinedValue: ExamPredefinedValue) => void,
    onRemoveFavorite: (predefinedValue: ExamPredefinedValue) => void,
    style?: any
  }
  render() {
    const style = this.props.style?this.props.style:styles.boardStretch;
    return <View style={style}>
        <View style={styles.verticalFlow}>
          {this.props.favorites && this.props.favorites.map((favorite: ExamPredefinedValue, index: number) =>
            <TouchableOpacity key={index}
              onPress={() => {this.props.onSelectFavorite(favorite)}}
              onLongPress={() => this.props.onRemoveFavorite(favorite)}>
              <Text key={index} style={styles.linkButton}>{favorite.name}</Text>
            </TouchableOpacity>
          )}
        </View>
    </View>
  }
}

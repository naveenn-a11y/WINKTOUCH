/**
 * @flow
 */
'use strict';

import React , {PureComponent} from 'react';
import {AlertIOS, View, Text, Button, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
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
  if (examDefinitionId===undefined) examDefinitionId = exam.customExamDefinitionId; //TODO Wais. this should not be the case. only happens after the start of a visit. backend should give back id in definition.
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
    return <Icon name="star-border" style={this.props.style} color={selectionFontColor}/>
  }
}

export class Cross extends PureComponent {
  props: {
    style: any
  }
  render() {
    return <Icon name="clear" style={this.props.style} color={selectionFontColor}/>
  }
}

export class Plus extends PureComponent {
  props: {
    style: any
  }
  render() {
    return <Icon name="add" style={this.props.style} color={selectionFontColor}/>
  }
}

export class Refresh extends PureComponent {
  props: {
    style: any
  }
  render() {
    return <Icon name="refresh" style={this.props.style} color={selectionFontColor}/>
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
              <Text color={selectionFontColor} key={index} style={styles.linkButton}>{favorite.name}</Text>
            </TouchableOpacity>
          )}
        </View>
    </View>
  }
}

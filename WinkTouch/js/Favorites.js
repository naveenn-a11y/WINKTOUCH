/**
 * @flow
 */
'use strict';

import React , {PureComponent} from 'react';
import {View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNBeep from 'react-native-a-beep';
import type { ExamDefinition, ExamPredefinedValue, Exam, Visit} from './Types';
import { styles, selectionFontColor, disabledFontColor } from './Styles';
import { strings } from './Strings';
import { storeItem, searchItems, deleteItem } from './Rest';
import { cacheItem, getCachedItem } from './DataCache';
import { deepClone, compareDates } from './Util';
import { getVisitTypes } from './Visit';
import { FormRow, FormTextInput } from './Form';
import { Button } from './Widgets';

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

export async function storeFavorite(favorite: any, examDefinitionId: string, name: string) {
  let predefinedValue : ExamPredefinedValue = {id: 'examPredefinedValue', version:-1, customExamDefinitionId: examDefinitionId, predefinedValue: favorite, name};
  favorite = await storeItem(predefinedValue);
  await fetchExamPredefinedValues();
}

export async function removeFavorite(favorite: ExamPredefinedValue) {
  await deleteItem(favorite);
  await fetchExamPredefinedValues();
}

export class Star extends PureComponent {
  props: {
    style: any,
    onAddFavorite: (starName: string) => void,
    testID?: string
  }
  state: {
    popupActif: boolean,
    starName?: string
  }

  constructor(props: any) {
    super(props);
    this.state = {
      popupActif: false,
      starName: undefined
    }
  }

  activatePopup = () => {
    this.setState({popupActif: true});
  }

  cancelPopup = () => {
    this.setState({popupActif:false, starName: undefined});
  }

  changeStarName = (starName: string) => {
    this.setState({starName});
  }

  addFavorite = () => {
    if (this.props.onAddFavorite===undefined) return;
    let starName : ?string = this.state.starName;
    if (starName!==undefined && starName!==null && starName.trim().length>0) {
      starName = starName.trim();
      this.props.onAddFavorite(starName);
    }
    this.cancelPopup();
  }

  renderPopup() {
    return <TouchableWithoutFeedback onPress={this.cancelPopup} accessible={false} testID='popupBackground'>
        <View style={styles.popupBackground}>
          <View style={styles.flexColumnLayout}>
            <Text style={styles.modalTitle}>{strings.nameStar}</Text>
            <View style={styles.centeredRowLayout}>
              <View style={styles.modalColumnLayout}>
                <View style={styles.form}>
                  <FormRow>
                    <FormTextInput value={this.state.starName} onChangeText={this.changeStarName} autoCapitalize="sentences" autoFocus={true} testID='star.name'/>
                  </FormRow>
                  <FormRow >
                    <Button title={strings.cancel} onPress={this.cancelPopup} testID='cancelButton' />
                    <Button title={strings.addFavorite} onPress={this.addFavorite} testID='addFavoriteButton'/>
                  </FormRow>
                </View>
              </View>
            </View>
          </View>
      </View>
    </TouchableWithoutFeedback>
  }

  render() {
    return [
      <TouchableOpacity disabled={this.props.onAddFavorite===undefined} onPress={this.activatePopup} key="icon" testID={this.props.testID?this.props.testID:'starIcon'}>
        <Icon name='staro' style={this.props.style} color={selectionFontColor}/>
      </TouchableOpacity>,
      <Modal visible={this.state.popupActif} transparent={true} animationType={'slide'} onRequestClose={this.cancelPopup} key="popup">
        {this.renderPopup()}
      </Modal>
    ]
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

export class Pencil extends PureComponent {
  props: {
    style: any,
    disabled?: boolean
  }
  render() {
    return <Icon name='edit' style={this.props.style} color={this.props.disabled?disabledFontColor:selectionFontColor}/>
  }
}

export class Keyboard extends PureComponent {
  props: {
    style: any,
    disabled?: boolean
  }
  render() {
    return <MaterialIcon name='keyboard' style={this.props.style} color={this.props.disabled?disabledFontColor:selectionFontColor}/>
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

export class Copy extends PureComponent {
  props: {
    style: any
  }
  render() {
    return <Icon name='copy1' style={this.props.style} color={selectionFontColor}/>
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


export class Printer extends PureComponent {
  props: {
    style: any
  }
  render() {
    return <Icon name='printer' style={this.props.style} color={selectionFontColor}/>
  }
}

export class Mail extends PureComponent {
  props: {
    style: any
  }
  render() {
    return <Icon name='mail' style={this.props.style} color={selectionFontColor}/>
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

export class ImportIcon extends PureComponent {
  props: {
    type: string,
    style: any,
    color: string
  }
  static defaultProps = {
    color: selectionFontColor,
  }

  render() {
    //return <Icon name='show-chart' style={this.props.style} color={this.props.color}/>
    return <Icon name='download' style={this.props.style} color={this.props.color}/>
  }
}

export class ExportIcon extends PureComponent {
  props: {
    type: string,
    style: any,
    color: string
  }
  static defaultProps = {
    color: selectionFontColor,
  }

  render() {
    //return <Icon name='show-chart' style={this.props.style} color={this.props.color}/>
    return <Icon name='upload' style={this.props.style} color={this.props.color}/>
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
            <TouchableOpacity key={favorite.name}
              onPress={() => {this.props.onSelectFavorite(favorite)}}
              onLongPress={() => {if (favorite.userId!==undefined) this.props.onRemoveFavorite(favorite)}}
              testID={'favorite'+(index+1)}>
              <Text key={index} style={styles.linkButton}>{favorite.name}{favorite.userId===undefined?' [W]':''}</Text>
            </TouchableOpacity>
          )}
        </View>
    </View>
  }
}

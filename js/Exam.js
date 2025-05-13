/**
 * @flow
 */
'use strict';

import { CommonActions } from '@react-navigation/native';
import { Component } from 'react';
import { ActivityIndicator, Animated, Easing, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { CheckList } from './CheckList';
import { cacheItemById, getCachedItem, getCachedItems } from './DataCache';
import { allExamDefinitions, getExamDefinition } from './ExamDefinition';
import { ExportIcon, getFavorites, Refresh, removeFavorite, Star, storeFavorite } from './Favorites';
import { GlassesDetail } from './GlassesDetail';
import { GroupedCard } from './GroupedCard';
import { GroupedForm } from './GroupedForm';
import { addGroupItem, GroupedFormScreen } from './GroupedFormScreen';
import {
  formatLabel,
  getFieldDefinition as getItemFieldDefinition,
  ItemsCard,
  ItemsList,
  SelectionListsScreen,
} from './Items';
import { PaperFormScreen } from './PaperForm';
import { getAutoRefractor, getKeratometry, getLensometries } from './Refraction';
import { fetchItemById, getRestUrl, getToken, storeItem, isValidJson } from './Rest';
import { strings } from './Strings';
import { fontScale, isWeb, styles } from './Styles';
import type {
  Exam,
  ExamDefinition,
  ExamPredefinedValue,
  FieldDefinition,
  GlassesRx,
  GroupDefinition,
  Measurement,
  Patient,
  Visit,
} from './Types';
import {
  deepClone,
  formatDate,
  formatMoment,
  getValue,
  isEmpty,
  jsonDateTimeFormat,
  now,
  setValue,
  stripIndex,
} from './Util';
import { visitHasEnded } from './Visit';
import { Alert, CollapsibleMessage, Lock, NativeBar, NoAccess, Pencil } from './Widgets';

import { getConfiguration } from './Configuration';
import { ErrorCard } from './Form';
import { exportData, Machine } from './Machine';
import { PatientCard } from './Patient';
import { renderItemsHtml, renderParentGroupHtml } from './PatientFormHtml';
import axios from 'axios';

export async function fetchExam(
  examId: string,
  ignoreCache?: boolean,
): Promise<Exam> {
  let exam: Exam = await fetchItemById(examId, ignoreCache);
  //overwriteExamDefinition(exam);
  return exam;
}

export async function createExam(exam: Exam): Promise<Exam> {
  exam = await storeItem(exam);
  return exam;
}

export async function storeExam(
  exam: Exam,
  refreshStateKey: ?string,
  navigation: ?any,
): Exam {
  exam.hasStarted = true;
  if (isEmpty(exam[exam.definition.name])) {
    exam.hasStarted = false;
  }
  exam = deepClone(exam);
  exam = await storeItem(exam);
  if (exam.errors) {
    return exam;
  }

  if (refreshStateKey && navigation) {
    //TODO check if exam has mapped visit fields
    const setParamsAction = CommonActions.setParams({
      refresh: true,
      key: refreshStateKey,
    });
    navigation?.dispatch({...setParamsAction, source: refreshStateKey});
  }
  return exam;
}

function updateMappedExamFields(
  fieldDefinitions: (FieldDefinition | GroupDefinition)[],
  value,
  visitId: string,
) {
  if (!fieldDefinitions) {
    return;
  }
  fieldDefinitions.forEach(
    (fieldDefinition: FieldDefinition | GroupDefinition) => {
      const fieldValue =
        value === undefined || value === null
          ? undefined
          : value[fieldDefinition.name];
      if (fieldDefinition.fields) {
        updateMappedExamFields(fieldDefinition.fields, fieldValue, visitId);
      } else {
        if (
          fieldDefinition.mappedField &&
          fieldDefinition.mappedField.startsWith('exam.')
        ) {
          let fieldIdentifier: string = fieldDefinition.mappedField.substring(
            'exam.'.length,
          );
          let examName: string = fieldIdentifier.substring(
            0,
            fieldIdentifier.indexOf('.'),
          );
          let referredExam = getExam(examName, getCachedItem(visitId));
          setValue(referredExam, fieldIdentifier, fieldValue);
          //__DEV__ && console.log('Updated mapped exam field '+fieldIdentifier+' to '+fieldValue+': '+JSON.stringify(referredExam));
          updateMappedExams(referredExam);
        } else if (fieldDefinition.mappedField != undefined) {
          //__DEV__ && console.log('TODO: update non exam mapped field '+fieldDefinition.mappedField);
        }
      }
    },
  );
}

export function updateMappedExams(exam: Exam) {
  if (!exam) {
    return;
  }
  let fieldDefinitions: GroupDefinition[] = exam.definition.fields;
  let examValue = exam[exam.definition.name];
  updateMappedExamFields(fieldDefinitions, examValue, exam.visitId);
}

export function getVisit(exam: Exam): Visit {
  if (!exam) {
    return;
  }
  return getCachedItem(exam.visitId);
}

export function getPatient(exam: Exam): Patient {
  const visit: Visit = getVisit(exam);
  return getCachedItem(visit.patientId);
}

export function getExam(examName: string, visit: Visit): Exam {
  if (!visit) {
    return;
  }
  let examId = visit.customExamIds.find(
    (examId: string) => getCachedItem(examId).definition.name === examName,
  );
  if (!examId) {
    examId = visit.preCustomExamIds.find(
      (examId: string) => getCachedItem(examId).definition.name === examName,
    );
  }
  const exam: Exam = getCachedItem(examId);
  return exam;
}

async function fetchVisitExam(visit: Visit, examName: string): Exam | undefined {
  if (!visit) {
    return undefined;
  }
  try {
    const response = await axios.get(`${getRestUrl()}Visit/${visit.id}/customExams/name/${examName}`, {
      headers: { token: getToken(), Accept: 'application/json' },
    });
    const respData = response?.data;
    // Check For Valid Json
    if (!isValidJson(respData)) {
      throw new Error('Invalid Json');
    }
    return respData;
  } catch (error) {
    console.error(error);
    alert(strings.formatString(strings.fetchItemError, `exam ${examName}`));
    return undefined;
  }
};

export function getFieldValue(fieldIdentifier: string, exam: Exam): any {
  const fieldSrc: string[] = fieldIdentifier.split('.');
  if (fieldSrc[0] === 'exam') {
    //A field of another exam
    let examIdentifier = fieldIdentifier.substring(5);
    const examName = examIdentifier.substring(0, examIdentifier.indexOf('.'));
    exam = getExam(examName, getVisit(exam));
    if (!exam) {
      return undefined;
    }
    let examValue = exam[examName];
    const identifier: string = examIdentifier.substring(examName.length + 1);
    let value = getValue(examValue, identifier);
    return value;
  } else if (fieldSrc[0] === 'patient') {
    let patient = getPatient(exam);
    if (!patient) {
      return undefined;
    }
    return patient[fieldSrc[1]];
  } else if (fieldSrc[0] === 'visit') {
    const visit: Visit = getVisit(exam);
    if (!visit) {
      return undefined;
    }
    let fieldName: string = fieldSrc[1];
    for (let i: number = 2; i < fieldSrc.length; i++) {
      fieldName = fieldName + '.' + fieldSrc[i];
    }
    if (fieldName === 'examDate') {
      fieldName = 'date';
    }
    return getValue(visit, fieldName);
  } else if (fieldSrc[0] === 'clFitting') {
    __DEV__ && console.error('unsupported clFitting field: ' + fieldSrc);
    return undefined;
  } else {
    //A regular exam field
    let value = getValue(exam[exam.definition.name], fieldIdentifier);
    return value;
  }
}

export function setMappedFieldValue(
  fieldIdentifier: string,
  value: any,
  exam: Exam,
) {
  const fieldSrc: string[] = fieldIdentifier.split('.');
  if (fieldSrc[0] === 'exam') {
    __DEV__ && console.log('Setting ' + fieldIdentifier + ' to ' + value);
    let examIdentifier = fieldIdentifier.substring(5);
    const examName = examIdentifier.substring(0, examIdentifier.indexOf('.'));
    exam = getExam(examName, getVisit(exam));
    if (!exam) {
      return undefined;
    }
    let examValue = exam[examName];
    const identifier: string = examIdentifier.substring(examName.length + 1);
    setValue(examValue, identifier, value);
    //getFieldDefinition(fieldIdentifier, exam);  TODO: recursive set mapped fields
  } else if (fieldSrc[0] === 'clFitting') {
    //TODO: we can ignore clFitting for now
    return;
  } else if (fieldSrc[0] === 'patient') {
    //TODO: Support other patient Mapped Fields
    __DEV__ && console.log('Setting ' + fieldIdentifier + ' to ' + value);
    let patientIdentifier = fieldIdentifier.substring(8);
    let patient = getPatient(exam);
    patient = deepClone(patient);
    if (!patient) {
      return undefined;
    }
    if (patientIdentifier.includes('patientTag')) {
      if (!patient.patientTags) {
        Object.assign(patient, {
          patientTags: [],
        });
      }
    }
    cacheItemById(patient);
  } else if (fieldSrc[0] === 'visit') {
    //TODO: we can ignore visit for now
    return;
  } else {
    __DEV__ &&
      console.error(
        "setting mapped field '" + fieldIdentifier + "' not yet implemented.",
      );
  }
}
export function getFieldDefinitionFromVisit(fieldIdentifier: string, visit): FieldDefinition | GroupDefinition | undefined {
    let examIdentifier = fieldIdentifier.substring(5);
    const examName = examIdentifier.substring(0, examIdentifier.indexOf('.'));
    const otherExam: Exam = getExam(examName, visit);
    const examDefinition: ExamDefinition = otherExam
      ? otherExam.definition
      : getExamDefinition(examName);
    if (!examDefinition) {
      return undefined;
    }
    const identifiers: string[] = examIdentifier
      .substring(examName.length + 1)
      .split('.');
    let fields: (FieldDefinition | GroupDefinition)[] = examDefinition.fields;
    let fieldDefinition;
    for (let i = 0; i < identifiers.length; i++) {
      fieldDefinition = fields.find(
        (definition: FieldDefinition | GroupDefinition) =>
          definition.name === stripIndex(identifiers[i]),
      );
      if (fieldDefinition === undefined) {
        break;
      }
      fields = fieldDefinition.fields;
    }
    if (fieldDefinition === undefined) {
      __DEV__ &&
        console.error("No fieldDefinition '" + fieldIdentifier + "' exists.");
      return undefined;
    }
    if (fieldDefinition.mappedField) {
      const firstMappedFieldName: string = fieldDefinition.mappedField;
      let mappedFieldDefinition: FieldDefinition = getFieldDefinition(
        fieldDefinition.mappedField,
        otherExam,
      );
      fieldDefinition = fieldDefinition = Object.assign(
        {},
        mappedFieldDefinition,
        fieldDefinition,
      );
      let endNode: boolean =
        mappedFieldDefinition.mappedField === undefined ||
        !mappedFieldDefinition.mappedField.startsWith('exam.');
      while (mappedFieldDefinition.mappedField !== undefined && !endNode) {
        mappedFieldDefinition = getFieldDefinition(
          mappedFieldDefinition.mappedField,
          otherExam,
        );
        fieldDefinition = fieldDefinition = Object.assign(
          {},
          mappedFieldDefinition,
          fieldDefinition,
        );
        endNode =
          mappedFieldDefinition.mappedField === undefined ||
          !mappedFieldDefinition.mappedField.startsWith('exam.');
      }
      fieldDefinition.mappedField = firstMappedFieldName;
    }
    return fieldDefinition;
}

export function getFieldDefinition(fieldIdentifier: string, exam: Exam): any {
  const fieldSrc: string[] = fieldIdentifier.split('.');
  if (fieldSrc[0] === 'exam') {
    //A field of another exam
    return getFieldDefinitionFromVisit(fieldIdentifier, getVisit(exam));
  } else if (
    fieldSrc[0] === 'visit' ||
    fieldSrc[0] === 'patient' ||
    fieldSrc[0] === 'clFitting' ||
    fieldSrc[0] === 'store'
  ) {
    //A non exam field
    return getItemFieldDefinition(fieldIdentifier);
  } else {
    //A regular exam field
    let fieldDefinition: FieldDefinition;
    let fields = exam.definition.fields;
    for (const fieldName: string of fieldSrc) {
      if (fields === undefined) {
        fieldDefinition = undefined;
        break;
      }
      fieldDefinition = fields.find(
        (definition: FieldDefinition | GroupDefinition) =>
          definition.name === stripIndex(fieldName),
      );
      if (fieldDefinition === undefined) {
        break;
      }
      fields = fieldDefinition.fields;
    }
    if (fieldDefinition === undefined) {
      __DEV__ &&
        console.error("No fieldDefinition '" + fieldIdentifier + "' exists.");
      return undefined;
    }
    if (fieldDefinition.mappedField) {
      const firstMappedFieldName: string = fieldDefinition.mappedField;
      let mappedFieldDefinition: FieldDefinition = getFieldDefinition(
        fieldDefinition.mappedField,
        exam,
      );
      if (mappedFieldDefinition) {
        fieldDefinition = fieldDefinition = Object.assign(
          {},
          mappedFieldDefinition,
          fieldDefinition,
        );
        let endNode: boolean =
          mappedFieldDefinition.mappedField === undefined ||
          !mappedFieldDefinition.mappedField.startsWith('exam.');
        while (mappedFieldDefinition.mappedField !== undefined && !endNode) {
          mappedFieldDefinition = getFieldDefinition(
            mappedFieldDefinition.mappedField,
            exam,
          );
          fieldDefinition = fieldDefinition = Object.assign(
            {},
            mappedFieldDefinition,
            fieldDefinition,
          );
          endNode =
            mappedFieldDefinition.mappedField === undefined ||
            !mappedFieldDefinition.mappedField.startsWith('exam.');
        }
        fieldDefinition.mappedField = firstMappedFieldName;
      }
    }
    return fieldDefinition;
  }
}

export const UserAction = {
  REFERRAL: 0,
  PATIENTFILE: 1,
};
let currentAction: UserAction;
export function getCurrentAction() {
  return currentAction;
}

export async function renderExamHtml(
  exam: Exam,
  htmlDefinition?: HtmlDefinition[],
  userAction: UserAction,
): any {
  let html: string = '';
  currentAction = userAction;
  if (exam.definition.card === false) {
    return html;
  }
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
    exam: Exam,
  };
}

export class ExamCard extends Component {
  props: {
    exam: Exam,
    unlocked?: boolean,
    onSelect?: () => void,
    onHide?: () => void,
    disabled?: boolean,
    enableScroll: () => void,
    disableScroll: () => void,
  };

  renderExamCardSpecifics() {
    let exam: Exam = this.props.exam;
    if (exam.definition.card === false) {
      return (
        <ExamScreen
          exam={exam}
          enableScroll={this.props.enableScroll}
          disableScroll={this.props.disableScroll}
          unlocked={this.props.unlocked}
        />
      );
    }
    switch (exam.definition.type) {
      case 'selectionLists':
        return <ItemsCard exam={exam} key={exam.definition.name} />;
      case 'groupedForm':
        return <GroupedCard exam={exam} key={exam.definition.name} />;
    }
    return (
      <View
        style={styles.flexColumnLayout}
        key={this.props.exam.definition.name}>
        <Text style={styles.cardTitle}>{exam.definition.name}</Text>
      </View>
    );
  }

  getStyle(): any {
    let style: string = this.props.style;
    const isEmptyExam: boolean = isEmpty(
      this.props.exam[this.props.exam.definition.name],
    );
    if (style) {
      return style;
    }
    style =
      this.props.exam.definition.card === false
        ? styles.page
        : this.props.exam.isInvalid
        ? styles.unverifiedExamCard
        : this.props.exam.hasStarted && !isEmptyExam
        ? styles.finishedExamCard
        : styles.todoExamCard;
    return style;
  }

  render() {
    return (
      <TouchableOpacity
        style={{flexShrink: 100}}
        disabled={
          this.props.disabled ||
          this.props.onSelect === undefined ||
          this.props.exam.definition.card === false
        }
        onLongPress={this.props.onHide}
        onPress={this.props.onSelect}
        delayLongPress={300}
        testID={this.props.exam.definition.name + ' Tile'}>
        <View style={this.getStyle()}>{this.renderExamCardSpecifics()}</View>
      </TouchableOpacity>
    );
  }
}

export async function getExamHistory(exam: Exam, startIndex=0, endIndex=null, setStateHandler=()=>{}): Exam[] {
  const visit = getCachedItem(exam.visitId);
  if (!visit) {
    return [];
  }
  const visitHistory: Visit[] = getCachedItems(
    getCachedItem('visitHistory-' + visit.patientId),
  );
  const examDefinitionName: string = exam.definition.name;
  let examArray: Exam[] = [];

  let updatedEndIndex = endIndex

  // Checking whether visitHistory array is not out of range
  if (visitHistory.length < endIndex) {
    updatedEndIndex = visitHistory.length
    setStateHandler?.({ isMoreDataAvailable: false })
  }

  // Slicing VisitHistory Data Array
  let limitedVisitHistory = visitHistory?.slice(startIndex, updatedEndIndex)

  // Paralle API Calls to Get Exam History
  await Promise.all(
    limitedVisitHistory?.map(async (visit: Visit) => {
      if (visit.medicalDataPrivilege === 'NOACCESS') {
        let noAccessExam: Exam = {
          noaccess: true,
          visitId: visit.id,
        };
        examArray.push(noAccessExam);
      } else {
        try {
          const exam = await fetchVisitExam(visit, examDefinitionName);
          const newExamDetails = {...exam, visitDate: visit?.date};
          examArray.push(newExamDetails);
        } catch (error) {
          console.error('Error fetching exam', error);
        }
      } // end-else
    }),
  );

  examArray = examArray.filter((exam: Exam) => !isEmpty(exam));

  examArray.sort(
    (exam1, exam2) => {
      return new Date(exam2?.visitDate || 0) - new Date(exam1?.visitDate || 0)
    }
  );

  return [...examArray];
}

export class ExamHistoryScreen extends Component {
  pageSize = 10;
  props: {
    navigation: any,
  };
  params: {
    exam: Exam,
  };
  state: {
    examHistory: Exam[],
    patient: ?Patient,
    zoomScale: number,
    isExamHistoryLoading: boolean,
    examHistoryPagination: {currentIndex: number},
    isMoreDataAvailable: boolean,
  };

  constructor(props: any) {
    super(props);
    const params = this.props.route.params;
    let patient: Patient = getPatient(params.exam);
    let examHistory: Exam[] = [];
    this.state = {
      examHistory,
      patient,
      zoomScale: new Animated.Value(1),
      isExamHistoryLoading: true,
      examHistoryPagination: {
        currentIndex: 0,
      },
      isMoreDataAvailable: true,
    };
  }

  componentDidMount() {
    Animated.timing(this.state.zoomScale, {
      toValue: 0.7,
      duration: 1000,
      easing: Easing.ease,
    }).start();

    this.loadMoreExamHistoryData();
  }

  loadExamHistoryData = (
    referenceExam: Exam,
    loadedExams: Exam[],
    startIndex: number,
    stateUpdaterCallBack: (index: number, examHistory: Exam[]) => void,
    pageSize: number,
    totalHistorySize: number,
  ) => {
    if (loadedExams.length < pageSize && startIndex < totalHistorySize) {
      getExamHistory(referenceExam, startIndex, startIndex + pageSize, (obj) => this.setState({...obj})).then(
        (examHistory) => {
          let ind = 0;
          while (loadedExams.length < pageSize && ind < (examHistory?.length || 0)) {
            const exam = examHistory[ind];
            if (!isEmpty(exam) && exam.visitId) {
              loadedExams.push(exam);
            }
            ind++;
          }
          this.loadExamHistoryData(
            referenceExam,
            loadedExams,
            startIndex + ind,
            stateUpdaterCallBack,
            pageSize,
            totalHistorySize,
          );
        },
      );
    } else {
      stateUpdaterCallBack(startIndex, loadedExams);
    }
  };

  loadMoreExamHistoryData = () => {
    // Setting Loading State
    this.setState({isExamHistoryLoading: true});
    const params = this.props.route?.params;

    // Getting current state startIndex and endIndex
    const newStartIndex = this.state?.examHistoryPagination?.currentIndex;
    const visit = getCachedItem(params.exam.visitId);
    const visitHistory: Visit[] = getCachedItems(getCachedItem('visitHistory-' + visit.patientId));

    this.loadExamHistoryData(
      params.exam,
      [],
      newStartIndex,
      (index, examHistory) => {
        this.setState((ps) => ({
          examHistory: [...ps?.examHistory, ...examHistory],
          isExamHistoryLoading: false,
          examHistoryPagination: {
            currentIndex: index,
          },
        }));
      },
      this.pageSize,
      visitHistory.length,
    );
  };

  addItem(item: any) {
    //TODO: check if visit is editable and show a confirmation ?
    let exam: Exam = this.props.route.params.exam;
    if (exam.definition.addable) {
      let items: any[] = exam[exam.definition.name];
      if (!items.includes(item)) {
        items.push(deepClone(item));
      }
    } else {
      let examItem: {} = exam[exam.definition.name];
      if (examItem instanceof Array) {
        if (examItem.length !== 1) {
          return;
        }
        examItem = examItem[0];
      }
      Object.assign(examItem, deepClone(item));
    }
    exam.isDirty = true;
    this.forceUpdate(); //TODO update exam
  }

  addHistoryGroupItem = (groupDefinition: GroupDefinition, groupValue: ?{}, childValue: ?{}) => {
    let exam: Exam = this.props.route.params.exam;
    addGroupItem(exam, groupDefinition, groupValue, false, childValue);
    exam.isDirty = true;
    this.props.navigation.navigate('exam', {
      exam
    });
    // this.props.navigation.goBack();
  };

  copyFinalRx = (glassesRx: GlassesRx): void => {
    const examStateKey = this.props.route && this.props.route.params ? this.props.route.params.stateKey : undefined;
    const setParamsAction = CommonActions.setParams({
      copiedData: glassesRx,
      key: examStateKey,
    });

    this.props.navigation.dispatch({...setParamsAction, source: examStateKey});
    this.props.navigation.goBack();
  };

  renderGroup(groupDefinition: GroupDefinition, value: any, index: number) {
    if (groupDefinition.mappedField) {
      groupDefinition = Object.assign({}, getItemFieldDefinition(groupDefinition.mappedField), groupDefinition);
    }
    if (groupDefinition.options != undefined) {
      return <CheckList definition={groupDefinition} editable={this.props.editable} value={value} />;
    }
    if (groupDefinition.multiValue === true) {
      if (value instanceof Array === false || value.length === 0) {
        return null;
      }
      if (groupDefinition.options == undefined) {
        groupDefinition = deepClone(groupDefinition);
        groupDefinition.multiValue = false;
        return value.map((childValue: any, index: number) => {
          const exam: Exam = this.props.route.params.exam;
          if (groupDefinition.type === 'SRx') {
            return (
              <GlassesDetail
                title={formatLabel(groupDefinition)}
                editable={false}
                glassesRx={childValue}
                key={groupDefinition.name}
                definition={groupDefinition}
                hasVA={groupDefinition.hasVA}
                hasAdd={groupDefinition.hasAdd}
                hasBVD={groupDefinition.hasBVD}
                examId={exam.id}
                onCopy={groupDefinition.name == 'Final Rx' ? this.copyFinalRx : undefined}
              />
            );
          } else {
            return (
              <GroupedForm
                definition={groupDefinition}
                editable={false}
                cloneable={true}
                key={index}
                form={childValue}
                patientId={this.state.patient ? this.state.patient.id : undefined}
                examId={exam.id}
                onCopy={(groupValue: ?{}) => this.addHistoryGroupItem(groupDefinition, groupValue, childValue)}
              />
            );
          }
        });
      }
    } else if (groupDefinition.type === 'SRx') {
      let exam: Exam = this.props.route.params.exam;
      return (
        <GlassesDetail
          title={formatLabel(groupDefinition)}
          editable={false}
          glassesRx={value}
          key={groupDefinition.name}
          definition={groupDefinition}
          hasVA={groupDefinition.hasVA}
          hasAdd={groupDefinition.hasAdd}
          hasBVD={groupDefinition.hasBVD}
          examId={exam.id}
          onCopy={groupDefinition.name === 'Final Rx' ? this.copyFinalRx : undefined}
        />
      );
    }
    return (
      <GroupedForm
        definition={groupDefinition}
        editable={false}
        form={value}
        key={index}
        patientId={this.state.patient ? this.state.patient.id : undefined}
        examId={this.props.route.params.exam.id}
      />
    );
  }

  renderExam(exam: Exam) {
    const visitDate: string = !isEmpty(exam?.visitDate) ? formatMoment(exam?.visitDate) : strings.today;

    // If Exam or exam definition is undefined
    if (isEmpty(exam) || isEmpty(exam?.definition) || isEmpty(exam?.[exam?.definition?.name])) {
      return null;
    }
    if (exam?.noaccess === true) {
      return (
        <View style={styles.historyBoard}>
          <Text style={styles.cardTitle}>{visitDate}</Text>
          <NoAccess />
        </View>
      );
    }

    switch (exam.definition.type) {
      case 'selectionLists':
        return (
          <ItemsList
            editable={false}
            //onSelectItem = {(item) => this.addItem(item)}
            title={visitDate}
            items={exam[exam.definition.name]}
            fieldDefinitions={exam.definition.fields}
            titleFields={exam.definition.titleFields}
            itemView={exam.definition.editable ? 'EditableItem' : 'ItemSummary'}
            key={exam.id}
            style={exam.id === this.props.route.params.exam.id ? styles.historyBoardSelected : styles.historyBoard}
            //orientation =
          />
        );
      case 'groupedForm':
        return (
          <View
            style={[
              exam.id === this.props.route.params.exam.id ? styles.historyBoardSelected : styles.historyBoard,
              {width: '100%'},
            ]}
            key={exam.id}>
            <Text style={styles.cardTitle}>{visitDate}</Text>
            <View style={styles.flow}>
              {exam.definition.fields &&
                exam.definition.fields.map((groupDefinition: FieldDefinition | GroupDefinition, index: number) =>
                  this.renderGroup(groupDefinition, exam[exam.definition.name][groupDefinition.name], index),
                )}
            </View>
          </View>
        );
      case 'paperForm':
        return <PaperFormScreen exam={exam} editable={false} key={exam.id} />;
    }
    return null;
  }

  renderFooter = () => {
    return this.state.isExamHistoryLoading && (
      <View style={styles.examHistoryScreenLoadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={{textAlign: 'center'}}>Loading..</Text>
      </View>
    )
  }

  render() {
    return (
      <FlatList
          initialNumToRender={10}
          data={this.state.examHistory}
          renderItem={(exam, index) => this.renderExam(exam.item)}
          showsVerticalScrollIndicator={false}
          refreshing={this.state.isExamHistoryLoading}
          ListFooterComponent={this.renderFooter}
          onEndReached={this.loadMoreExamHistoryData}
          onEndReachedThreshold={0.3}
        />
    )
  }
}

function examIsLocked(exam: Exam): boolean {
  if (exam === null || exam === undefined) {
    return false;
  }
  return visitHasEnded(exam.visitId);
}

export class ExamScreen extends Component {
  props: {
    exam: ?Exam,
    navigation: any,
    unlocked?: boolean,
    enableScroll: () => void,
    disableScroll: () => void,
  };
  state: {
    exam: Exam,
    appointmentStateKey: string,
    isDirty: boolean,
    locked: boolean,
    scrollable: boolean,
    favorites: ExamPredefinedValue[],
    showExportDataPopup: boolean,
    showSnackBar: ?boolean,
    snackBarMessage: ?string,
    copiedData?: GlassesRx,
    patientInfo: PatientInfo,
    relatedExams: JSX.Element,
  };

  constructor(props: any) {
    super(props);
    let exam: Exam =
      this.props.route &&
      this.props.route.params
        ? this.props.route.params.exam
        : this.props.exam;
    let visit = getVisit(exam);
    this.state = {
      exam,
      appointmentStateKey:
        this.props.route &&
        this.props.route.params
          ? this.props.route.params.appointmentStateKey
          : undefined,
      isDirty: exam.errors !== undefined,
      locked: this.props.unlocked !== true && examIsLocked(exam),
      scrollable: true,
      favorites: this.isStarable(exam) ? getFavorites(exam) : undefined, //TODO don't get favourirtes for locked exam. exam.definition.id,
      showExportDataPopup: false,
      showSnackBar: false,
      snackBarMessage: '',
      copiedData: null,
      patientInfo: getCachedItem(visit.patientId),
      relatedExams: null
    };
  }

  componentDidMount() {
    if (
      this.state.exam.id !== undefined &&
      this.state.exam.errors === undefined
    ) {
      this.fetchExam();
      this.renderRelatedExams(this.state.exam.definition);
    }
  }

  componentDidUpdate(prevProps: any) {
    const copiedData = this?.props?.route?.params?.copiedData ?? undefined;

    if (copiedData && this.state.copiedData !== copiedData) {
      this.copyData(copiedData);
      this.props.navigation.setParams({copiedData: undefined});
    }

    let exam: Exam =
      this.props.route &&
      this.props.route.params
        ? this.props.route.params.exam
        : this.props.exam;

    if (this.state.exam && this.state.exam.id === exam.id) {
      //__DEV__ && console.log('ExamScreen did update with same exam id '+exam.id);
      return;
    }

    const currentExamDefinition = exam.definition;
    this.renderRelatedExams(currentExamDefinition);

    //__DEV__ && console.log('ExamScreen did update after receiving new exam with id '+exam.id);
    if (this.state.isDirty) {
      this.storeExam(this.state.exam);
    } else if (exam.isInvalid) {
      exam.isInvalid = false;
      exam.hasStarted = true;
      this.storeExam(exam);
    }
    this.setState({
      exam,
      appointmentStateKey:
        this.props.route &&
        this.props.route.params
          ? this.props.route.params.appointmentStateKey
          : undefined,
      isDirty: exam.errors !== undefined,
      locked: !this.props.unlocked && examIsLocked(exam),
      scrollable: true,
      favorites: this.isStarable(exam) ? getFavorites(exam) : undefined, //TODO don't get favourirtes for locked exam. exam.definition.id
    });
  }

  componentWillUnmount() {
    this.deleteCopiedData();

    if (this.focusSubscription !== undefined) {
      this.focusSubscription();
    }
    
    //__DEV__ && console.log('Exam will unmount dirty='+this.state.isDirty);
    if (this.state.isDirty || this.state.exam.isDirty) {
      //__DEV__ && console.log('Saving previous exam that was still dirty.'+this.props.navigation);
      this.storeExam(this.state.exam);
    } else if (this.state.exam.isInvalid) {
      let exam: Exam = this.state.exam;
      exam.isInvalid = false;
      exam.hasStarted = true;
      this.storeExam(exam);
    }
  }

  isStarable(exam: Exam): boolean {
    if (exam === undefined) {
      return false;
    }
    if (exam.definition.starable) {
      return true;
    }
    if (exam.definition.fields) {
      const fieldDefinition: ?FieldDefinition | GroupDefinition =
        exam.definition.fields.find(
          (field: FieldDefinition | GroupDefinition) => field.starable === true,
        );
      return !isEmpty(fieldDefinition);
    }
    return false;
  }

  async fetchExam() {
    const exam: Exam = await fetchExam(this.state.exam.id);
    if (this.state.exam !== exam) {
      this.setState({exam, isDirty: false});
    }
  }

  async refreshExam() {
    let exam: Exam = await fetchExam(this.state.exam.id, true);
    if (exam === undefined) {
      return;
    }
    this.setState({exam, isDirty: false});
    this.deleteCopiedData();
  }

  async storePreviousExam(exam: Exam) {
    exam.hasStarted = true;
    exam = await storeExam(
      exam,
      this.state.appointmentStateKey,
      this.props.navigation,
    );
    if (exam.errors === undefined) {
      updateMappedExams(exam);
    } else {
      __DEV__ && console.log('//TODO pass navigation prop to examscreen card');
      //this.props.navigation.navigate('exam', {exam: exam});
    }
  }

  async storeExam(exam: Exam) {
    exam.isInvalid = false;
    exam = await storeExam(
      exam,
      this.state.appointmentStateKey,
      this.props.navigation,
    );
    if (exam.errors === undefined) {
      updateMappedExams(exam);
    }
    if (this.props.exam) {
      if (this.state.exam.id === exam.id) {
        this.setState({exam, isDirty: exam.errors !== undefined});
      }
    } else {
      if (exam.errors) {
        this.props.navigation.navigate('exam', {
          exam: exam,
          appointmentStateKey: this.state.appointmentStateKey,
        });
      }
    }
  }

  updateExam = (exam: Exam): void => {
    //__DEV__ && console.log('Examscreen updateExam called');
    if (!this.state.exam.readonly) {
      this.setState({exam, isDirty: true});
    }
  };

  async removeFavorite(favorite: ExamPredefinedValue) {
    let favorites: ExamPredefinedValue[] = this.state.favorites;
    favorites = favorites.filter(
      (aFavorite: ExamPredefinedValue) => aFavorite !== favorite,
    );
    this.setState({favorites});
    await removeFavorite(favorite);
    this.setState({favorites: getFavorites(this.state.exam)});
  }

  addFavorite = async (favorite: any, name: string) => {
    const exam: ?Exam = this.state.exam;
    if (exam === undefined) {
      return;
    }
    await storeFavorite(favorite, exam.definition.id, name);
    this.setState({favorites: getFavorites(this.state.exam)});
  };

  addExamFavorite = (name: string) => {
    let exam = this.state.exam[this.state.exam.definition.name];
    this.addFavorite(exam, name);
  };

  switchLock = () => {
    this.setState({locked: this.state.locked === true ? false : true});
  };

  getVisit(): Visit {
    return getVisit(this.state.exam);
  }

  showSnackBar() {
    this.setState({showSnackBar: true});
  }
  hideSnackBar() {
    this.setState({showSnackBar: false});
  }

  setSnackBarMessage(message: string) {
    this.setState({snackBarMessage: message});
  }

  showSnackBarMessage = (message: string): void => {
    if (!this.state.showSnackBar) {
      this.setState({snackBarMessage: message});
      this.setState({showSnackBar: true});
    }
  };

  async confirmExportData(items: any) {
    let data: any = {};
    const patient: Patient = getPatient(this.state.exam);

    items.map((rxData: any) => {
      const isChecked: boolean = rxData.isChecked;
      const entityId: string = rxData.entityId;
      if (isChecked) {
        if (entityId === strings.autoRefractor) {
          data = deepClone(rxData.data);
        } else if (entityId === strings.lensometry) {
          data.lensometry = deepClone(rxData.data);
        } else if (entityId === strings.keratometry) {
          data.keratometry = deepClone(rxData.data);
        }
      }
    });
    let measurement: Measurement = {
      label: formatLabel(this.state.exam.definition),
      date: formatDate(now(), jsonDateTimeFormat),
      patientId: patient.id,
      data,
    };
    let machineIdentifier = this.state.exam.definition.export;
    if (machineIdentifier instanceof Array && machineIdentifier.length > 0) {
      machineIdentifier = machineIdentifier[0]; //TODO: send to all destinations
    }
    data = await exportData(
      machineIdentifier,
      measurement,
      this.state.exam.examId,
    );
    if (data && !data.errors) {
      const machine: Machine = new Machine(machineIdentifier);
      machine.bind = (type, data) => {
        switch (type) {
          case 'message':
            this.setSnackBarMessage(data);
            this.showSnackBar();
            break;
          case 'closed':
            this.setSnackBarMessage(data);
            this.showSnackBar();
            break;
          case 'connected':
            machine.push();
            this.setSnackBarMessage(data);
            this.showSnackBar();
            break;
        }
      };
      machine.connect(() => {});
    }
    this.hideExportDataPopup();
  }

  hideExportDataPopup() {
    this.setState({showExportDataPopup: false});
  }

  showExportDataPopup() {
    this.setState({showExportDataPopup: true});
  }

  buildExportData(): any {
    const exportRxOptions: any = [];
    const lensometry: GlassesRx[] = getLensometries(this.state.exam.visitId);
    const keratometry: GlassesRx = getKeratometry(this.state.exam.visitId);
    const autoRefractor = getAutoRefractor(this.state.exam.visitId);

    if (autoRefractor !== undefined && autoRefractor.length > 0) {
      autoRefractor.forEach((prescription: GlassesRx, index: number) => {
        exportRxOptions.push({
          label: strings.autoRefractor + ' ' + (index + 1),
          isChecked: index === 0,
          entityId: strings.autoRefractor,
          data: prescription,
          divider: index === autoRefractor.length - 1,
          singleSelection: true,
        });
      });
    }
    if (lensometry !== undefined && lensometry.length > 0) {
      lensometry.forEach((prescription: GlassesRx, index: number) => {
        if (!isEmpty(prescription.lensType)) {
          exportRxOptions.push({
            label: strings.lensometry + ': ' + prescription.lensType,
            isChecked: index === 0,
            entityId: strings.lensometry,
            data: prescription,
            divider: index === lensometry.length - 1,
            singleSelection: true,
          });
        } else {
          exportRxOptions.push({
            label: strings.lensometry + ' ' + (index + 1),
            isChecked: index === 0,
            entityId: strings.lensometry,
            data: prescription,
            divider: index === lensometry.length - 1,
            singleSelection: true,
          });
        }
      });
    }
    if (keratometry !== undefined) {
      exportRxOptions.push({
        label: strings.keratometry,
        isChecked: true,
        entityId: strings.keratometry,
        data: keratometry,
        singleSelection: true,
      });
    }

    return exportRxOptions;
  }

  async addExam(examLabel: string) : Exam {
    
    if (examLabel === undefined) {
      return undefined;
    } 
    
    let examDefinition: ?ExamDefinition = (
      await allExamDefinitions(false)
    ).find(
      (examDefinition: ExamDefinition) =>
        (examDefinition.label ? examDefinition.label : examDefinition.name) ===
        examLabel,
    );
    if (!examDefinition) {
      examDefinition = (await allExamDefinitions(true)).find(
        (examDefinition: ExamDefinition) =>
          (examDefinition.label
            ? examDefinition.label
            : examDefinition.name) === examLabel,
      );
    }
    if (!examDefinition) {
      return undefined;
    }
    let visit = this.getVisit();

    let existingExam: ?Exam = visit.preCustomExamIds
      ? getCachedItem(
          visit.preCustomExamIds[
            visit.preCustomExamIds.findIndex(
              (examId: string) =>
                getCachedItem(examId).definition.name === examDefinition.name,
            )
          ],
        )
      : undefined;

    if (!existingExam && visit.customExamIds) {
      existingExam = getCachedItem(
        visit.customExamIds[
          visit.customExamIds.findIndex(
            (examId: string) =>
              getCachedItem(examId).definition.name === examDefinition.name,
          )
        ],
      );
    } 

    //create exam
    let exam: Exam = {
      id: 'customExam',
      visitId: visit.id,
      customExamDefinitionId: examDefinition.id,
      isHidden: true,
    };
    exam = await createExam(exam);
    if (exam.errors) {
      return undefined;
    }

    exam.isHidden = true;
    storeExam(exam);

    if (!visit.preCustomExamIds) {
      visit.preCustomExamIds = [];
    }
    if (!visit.customExamIds) {
      visit.customExamIds = [];
    }
    if (exam.definition.isPreExam) {
      visit.preCustomExamIds.push(exam.id);
    } else {
      visit.customExamIds.push(exam.id);
    }
    cacheItemById(visit);
    return exam
  }

  async getRelatedExam(examName: string): Exam {
    const visit: Visit = this.getVisit();
    let examId = visit.customExamIds.find(
      (examId: string) =>
        getCachedItem(examId) !== null &&
        getCachedItem(examId) !== undefined &&
        getCachedItem(examId).definition.name === examName,
    );
    if (!examId) {
      examId = visit.preCustomExamIds.find(
        (examId: string) => getCachedItem(examId).definition.name === examName,
      );
    }
    let exam: Exam = getCachedItem(examId);

    if(!exam) {
      //check if exam is in list of permanentRelatedExams
      let permanentRelatedExam = this.state.exam && 
      this.state.exam.definition && 
      this.state.exam.definition.permanentRelatedExams &&
      this.state.exam.definition.permanentRelatedExams.find((examLabel) => examLabel === examName);

      if (permanentRelatedExam) {
        exam = await this.addExam(examName);
      }
    }
    return exam;
  }

  enableScroll = () => {
    if (this.props.enableScroll) {
      this.props.enableScroll();
    } else {
      this.setState({scrollable: true});
    }
  };

  disableScroll = () => {
    if (this.props.disableScroll) {
      this.props.disableScroll();
    } else {
      this.setState({scrollable: false});
    }
  };

  deleteCopiedData = (): void => {
    this.setState({copiedData: null}); //refresh copied data
  };

  copyData = (glassesRx: GlassesRx): void => {
    let clonedGlassesRx = deepClone(glassesRx);
    this.setState({copiedData: clonedGlassesRx});
    this.showSnackBarMessage(strings.copyMessage);
  };

  renderExam() {
    if (!this.state.exam) {
      return null;
    }
    const canEdit: boolean = !(this.state.exam.readonly || this.state.locked);
    switch (this.state.exam.definition.type) {
      case 'selectionLists':
        return (
          <SelectionListsScreen
            exam={this.state.exam}
            onUpdateExam={this.updateExam}
            editable={canEdit}
            favorites={this.state.favorites}
            onAddFavorite={
              this.isStarable(this.state.exam) ? this.addFavorite : undefined
            }
            onRemoveFavorite={(favorite: ExamPredefinedValue) =>
              this.removeFavorite(favorite)
            }
          />
        );
      case 'groupedForm':
        return (
          <GroupedFormScreen
            exam={this.state.exam}
            onUpdateExam={this.updateExam}
            editable={canEdit}
            favorites={this.state.favorites}
            onAddFavorite={
              this.isStarable(this.state.exam) ? this.addFavorite : undefined
            }
            onRemoveFavorite={(favorite: ExamPredefinedValue) =>
              this.removeFavorite(favorite)
            }
            enableScroll={this.enableScroll}
            disableScroll={this.disableScroll}
            copiedData={this.state.copiedData}
            copyData={this.copyData}
            deleteCopiedData={this.deleteCopiedData}
          />
        );
      case 'paperForm':
        return (
          <PaperFormScreen
            exam={this.state.exam}
            onUpdateExam={this.updateExam}
            editable={canEdit}
            appointmentStateKey={this.state.appointmentStateKey}
            navigation={this.props.navigation}
            enableScroll={this.enableScroll}
            disableScroll={this.disableScroll}
          />
        );
    }
    return (
      <Text style={styles.screenTitle}>
        {this.state.exam.definition.type} {this.state.exam.definition.name} Exam
      </Text>
    );
  }

  isLockedButDisabled() {
    const { locked, exam } = this.state;
    const visit = this.getVisit();

    if (!locked) return false;

    return !(
      visit.medicalDataPrivilege === 'FULLACCESS' ||
      (exam.definition.isPreExam && visit.pretestPrivilege === 'FULLACCESS')
    );
  }

  renderLockIcon() {
    if (!this.state.locked || this.state.exam.readonly) {
      return null;
    }
    return (
      <TouchableOpacity onPress={this.switchLock} disabled={this.isLockedButDisabled()}>
        <Lock
          style={styles.screenIcon}
          locked={this.state.locked === true}
          testID={this.state.locked === true ? 'unlockExam' : 'lockExam'}
          disabled={this.isLockedButDisabled()}
        />
      </TouchableOpacity>
    );
  }

  renderPencilIcon() {
    if (this.state.exam.readonly) {
      return (
        <TouchableOpacity>
          <Pencil style={styles.screenIcon} />
        </TouchableOpacity>
      );
    } else {
      return null;
    }
  }

  renderFavoriteIcon() {
    if (!this.state.exam) {
      return null;
    }
    if (
      this.state.locked ||
      this.state.exam.readonly ||
      this.state.exam.definition.starable !== true ||
      this.state.exam.definition.starable !== true ||
      (this.state.exam.definition.type !== 'selectionLists' &&
        this.state.exam.definition.type !== 'groupedForm')
    ) {
      return null;
    }
    return (
      <Star
        onAddFavorite={this.addExamFavorite}
        style={styles.screenIcon}
        testID="favoriteExam"
      />
    );
  }

  renderRefreshIcon() {
    if (this.state.locked) {
      return null;
    }
    return (
      <TouchableOpacity onPress={() => this.refreshExam()} testID="refreshExam">
        <Refresh style={styles.screenIcon} />
      </TouchableOpacity>
    );
  }

  /*
  Temporary Warning message for Billing, should be removed after invoicing module is implemented in EMR
   */
  renderExamWarnings() {
    if (this.state.exam.definition.name.toLowerCase() === 'diagnosis') {
      return (
        <CollapsibleMessage
          shortMessage={strings.billingUpdateShortWarning}
          longMessage={strings.billingUpdateWarning}
        />
      );
    }
    return null;
  }
  renderExamIcons(style: any) {
    if (this.state.exam.definition.card === false) {
      return;
    }
    return (
      <View style={style}>
        {this.renderExamTitle()}
        {this.renderExportSection()}
        {this.renderRefreshIcon()}
        {this.renderFavoriteIcon()}
        {this.renderPencilIcon()}
        {this.renderLockIcon()}
      </View>
    );
  }

  renderExamTitle() {
    return (
      <View style={styles.examLabel}>
        <Text style={styles.sectionTitle} testID={'exam-tile-title'}>
          {formatLabel(this.state.exam.definition)}
        </Text>
      </View>
    );
  }

  renderExportSection() {
    if (
      this.state.exam.definition.export === undefined ||
      this.state.exam.definition.export === null ||
      this.state.exam.definition.export.length === 0 ||
      getConfiguration().machine.phoropter === undefined
    ) {
      return null;
    }
    return (
      <View style={styles.flow}>
        <TouchableOpacity
          onPress={() => this.showExportDataPopup()}
          testID={this.props.fieldId + '.exportButton'}>
          <ExportIcon style={styles.screenIcon} />
        </TouchableOpacity>
        {this.state.showExportDataPopup && this.renderExportPopup()}
      </View>
    );
  }

  renderExportPopup() {
    const exportRxOptions: any = this.buildExportData();

    return (
      <Alert
        title={strings.printExportLabel}
        data={exportRxOptions}
        dismissable={true}
        onConfirmAction={(options: any) => this.confirmExportData(options)}
        onCancelAction={() => this.hideExportDataPopup()}
        style={styles.alert}
        confirmActionLabel={strings.exportAction}
        cancelActionLabel={strings.cancel}
        multiValue={true}
      />
    );
  }

  renderSnackBar() {
    if (this.state.showSnackBar) {
      return (
        <NativeBar
          message={this.state.snackBarMessage}
          onDismissAction={() => this.hideSnackBar()}
        />
      );
    }
    return null;
  }

  selectExam = (exam: Exam) => {
    if (exam.isInvalid) {
      exam.isInvalid = false;
      exam.hasStarted = true;
      this.storeExam(exam);
    } else {
      if(exam.isHidden) {
        exam.isHidden = false;
        this.storeExam(exam);
      }

      this.props.navigation.push('exam', {
        exam,
        appointmentStateKey: this.state.appointmentStateKey,
      });
    }
  };

  async renderRelatedExams(currentDefinition: ExamDefinition) {
    if (
      currentDefinition.relatedExams === undefined ||
      currentDefinition.relatedExams === null ||
      currentDefinition.relatedExams.length === 0
    ) {
      this.setState({relatedExams: null});
      return;
    }

    let relatedExams =  await Promise.all(currentDefinition.relatedExams.map(
      async (relatedExamName: string, index: number) => {
        const relatedExam: Exam = await this.getRelatedExam(relatedExamName);
        return (
          relatedExam && (
            <ExamCard
              exam={relatedExam}
              style={styles.examCard}
              onSelect={() => this.selectExam(relatedExam)}
              key={`${index}_${relatedExam.id}`}
            />
          )
        );
      },
    ));

    const relatedExamsView =  (
      <View style={styles.flow}>
        {relatedExams}
      </View>
    );
    this.setState({relatedExams: relatedExamsView});
  }

  renderPatientDetails() {
    return (
      <PatientCard
        patientInfo={this.state.patientInfo}
        navigation={this.props.navigation}
        refreshStateKey={this.props.route.key}
        style={{
          flexDirection: 'column',
          justifyContent: 'flex-start',
          marginHorizontal: 10 * fontScale,
        }}
      />
    );
  }

  render() {
    if (!this.state.exam) {
      return null;
    }
    if (
      this.state.exam.definition.scrollable === true ||
      this.state.exam.definition.type === 'groupedForm'
    ) {
      return (
        <View style={styles.scrollviewContainer}>
          {this.renderSnackBar()}
          <KeyboardAwareScrollView
            contentContainerStyle={styles.scrollviewFixed}
            minimumZoomScale={1.0}
            maximumZoomScale={2.0}
            bounces={false}
            bouncesZoom={false}
            scrollEnabled={
              this.props.disableScroll === undefined && this.state.scrollable
            }
            pinchGestureEnabled={this.state.scrollable}>
            {this.renderPatientDetails()}
            <ErrorCard errors={this.state.exam.errors} />
            {this.renderExamWarnings()}
            {this.renderExamIcons(styles.examIconsFlex)}
            {this.state.relatedExams}
            {this.renderExam()}
          </KeyboardAwareScrollView>
        </View>
      );
    }
    if (this.props.disableScroll) {
      return (
        <View style={styles.centeredColumnLayout}>
          {this.renderPatientDetails()}
          <ErrorCard errors={this.state.exam.errors} />
          {this.renderExamIcons(styles.examIconsFlex)}
          {this.renderSnackBar()}
          {this.state.relatedExams}
          {this.renderExam()}
        </View>
      );
    }
    return (
      <KeyboardAwareScrollView
        style={styles.page}
        contentContainerStyle={isWeb ? {} : styles.centeredScreenLayout}
        scrollEnabled={isWeb}>
        <View style={[styles.centeredColumnLayout, {alignItems: 'stretch'}]}>
          {this.renderPatientDetails()}
          <ErrorCard errors={this.state.exam.errors} />
          {this.renderExamIcons(styles.examIconsFlex)}
          {this.renderSnackBar()}
          {this.state.relatedExams}
          {this.renderExam()}
        </View>
      </KeyboardAwareScrollView>
    );
  }
}

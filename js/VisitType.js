import React, {Component, PureComponent} from 'react';
import {FlatList, Text, View, ScrollView, TouchableOpacity} from 'react-native';
import type {RestResponse, User, VisitType} from './Types';
import {deepClone, isEmpty} from './Util';
import {performActionOnItem, storeItem} from './Rest';
import {ExamCard} from './Exam';
import {SelectionListsScreen} from './Items';
import {GroupedFormScreen} from './GroupedForm';
import {PaperFormScreen} from './PaperForm';
import {fontScale, styles} from './Styles';
import {
  ErrorCard,
  FormField,
  FormInput,
  FormRow,
  FormSwitch,
  FormTextInput,
} from './Form';
import {fetchVisitTypes, getAllVisitTypes, getVisitTypes} from './Visit';
import {getUserLanguageShort, strings} from './Strings';
import {cacheItem} from './DataCache';
import {Button, SelectionListRow} from './Widgets';
import {convertUserToJson, getUsers, searchUsers, UserListProps} from './User';
import { CommonActions } from '@react-navigation/native';
import {storePatientInfo} from './Patient';
import {Button as NativeBaseButton, Portal} from 'react-native-paper';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import Dialog from './utilities/Dialog';

export async function saveVisitTypeExams(visitTypes: VisitType[]) {
  visitTypes = (await performActionOnItem('linkExams', visitTypes))
    .visitTypeList;
  cacheItem('visitTypes', visitTypes);
}

export async function saveVisitTypeDoctors(visitType: VisitType) {
  const visitTypes: VisitType[] = (
    await performActionOnItem('linkDoctors', [visitType])
  ).visitTypeList;
  cacheItem('visitTypes', visitTypes);
}

class VisitTypeHeader extends Component {
  props: {
    visitType: VisitType,
    isNewVisitType: boolean,
    onUpdate: (fieldName: string, value: any) => void,
  };
  state: {
    doctors: Array,
    selectedDoctors: Array,
    defaultDoctors: Array,
    isDirty: boolean,
    doctorsModal: boolean,
    isLoading: ?boolean,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      doctors: [],
      selectedDoctors: [],
      defaultDoctors: [],
      isDirty: false,
      doctorsModal: false,
      isLoading: false,
    };
  }
  componentDidMount(): * {
    this.getDoctors();
  }
  async getDoctors() {
    let users: User[] = getUsers();
    if (users === undefined || users === null) {
      return;
    }
    let doctors = users.map((u) => convertUserToJson(u));
    doctors = doctors.filter((u) => !isEmpty(u.label));
    this.setSelectedDoctors();
    this.setState({doctors});
  }

  setSelectedDoctors() {
    const visitType: VisitType = this.props.visitType;
    if (visitType.doctorIds !== undefined) {
      this.setState({
        defaultDoctors: visitType.doctorIds,
        selectedDoctors: visitType.doctorIds,
      });
    }
  }
  openDoctorsOptions = () => {
    this.setState({doctorsModal: true});
  };
  closeDoctorsOptions = () => {
    this.setState({doctorsModal: false, isLoading: false});
  };
  cancelDoctorsOptions = () => {
    this.setState({
      selectedDoctors: this.state.defaultDoctors,
      doctorsModal: false,
    });
  };

  sync = async () => {
    this.setState({isLoading: true});
    let visitType: VisitType = this.props.visitType;
    visitType.doctorIds = this.state.selectedDoctors;
    await saveVisitTypeDoctors(visitType);
    this.closeDoctorsOptions();
  };
  onChangeSelectedDoctors = async (selectedDoctors) => {
    this.setState({selectedDoctors});
  };

  renderDoctorsOptions() {
    return (
      <Portal theme={{colors: {backdrop: 'transparent'}}}>
        <Dialog
          style={{
            width: '50%',
            height: '70%',
            alignSelf: 'center',
            backgroundColor: '#fff',
          }}
          visible={this.state.doctorsModal}
          onDismiss={this.cancelDoctorsOptions}
          dismissable={true}>
          <Dialog.Title>
            <Text style={{color: 'black'}}> {strings.chooseDoctor}</Text>
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={{padding: 10}}>
              <FormInput
                multiOptions={true}
                value={this.state.selectedDoctors}
                showLabel={false}
                readonly={false}
                definition={{options: this.state.doctors}}
                onChangeValue={this.onChangeSelectedDoctors}
                errorMessage={'error'}
                isTyping={false}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <NativeBaseButton onPress={this.cancelDoctorsOptions}>
              {strings.close}
            </NativeBaseButton>
            <NativeBaseButton
              loading={this.state.isLoading}
              disabled={this.props.isNewVisitType}
              onPress={this.sync}>
              {'Sync'}
            </NativeBaseButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }

  render() {
    return (
      <View style={styles.columnCard}>
        <FormRow>
          <FormTextInput
            label="Name"
            readonly={false}
            value={this.props.visitType.nameEn}
            onChangeText={(newName: string) =>
              this.props.onUpdate('nameEn', newName)
            }
          />
          <FormTextInput
            label="Name Fr"
            readonly={false}
            value={this.props.visitType.nameFr}
            onChangeText={(newName: string) =>
              this.props.onUpdate('nameFr', newName)
            }
          />
          <FormTextInput
            label="Name Es"
            readonly={false}
            value={this.props.visitType.nameEs}
            onChangeText={(newName: string) =>
              this.props.onUpdate('nameEs', newName)
            }
          />
        </FormRow>
        <FormRow>
          <FormSwitch
            label={'Digital'}
            readonly={false}
            value={this.props.visitType.digital}
            onChangeValue={(newValue?: boolean) =>
              this.props.onUpdate('digital', newValue)
            }
          />
          <FormSwitch
            label="Active"
            readonly={false}
            value={!this.props.visitType.inactive}
            onChangeValue={(newValue: boolean) =>
              this.props.onUpdate('inactive', !newValue)
            }
          />
          <TouchableOpacity
            style={styles.chooseButton}
            onPress={this.openDoctorsOptions}>
            <Text>{strings.chooseDoctor}</Text>
          </TouchableOpacity>
        </FormRow>
        {this.state.doctorsModal && this.renderDoctorsOptions()}
      </View>
    );
  }
}
export class VisitTypeTemplateScreen extends Component {
  props: {
    navigation: any,
  };
  params: {
    visitType: VisitType,
  };
  state: {
    visitType: VisitType,
    isDirty: boolean,
    isNewVisitType: ?boolean,
    isLoading: ?boolean,
  };
  unmounted: boolean;

  constructor(props: any) {
    super(props);
    let visitType: VisitType = this.props.route.params.visitType;
    this.state = {
      visitType,
      isDirty: false,
      isNewVisitType: visitType.id === 'visitType',
      isLoading: false,
    };
  }

  componentWillUnmount() {
    this.unmounted = true;
    if (this.state.isDirty && !this.state.isNewVisitType) {
      this.asyncComponentWillUnmount();
    }
  }

  async asyncComponentWillUnmount() {
    const visitType: VisitType = await this.storeVisitType();
    if (visitType.errors) {
      this.props.navigation.navigate('visitTypeTemplate', {
        visitType: visitType,
        refreshStateKey: this.props.route.params.refreshStateKey,
      });
    } else {
      let visitTypes: VisitType[] = getAllVisitTypes();
      const index: number = visitTypes.findIndex(
        (vt: VisitType) => vt.id === visitType.id,
      );
      if (index >= 0) {
        visitTypes[index] = visitType;
        cacheItem('visitTypes', visitTypes);
      }

      if (this.props.route.params.refreshStateKey) {
        const setParamsAction = CommonActions.setParams({
          refresh: true,
          key: this.props.route.params.refreshStateKey,
        });
        this.props.navigation.dispatch({...setParamsAction, source: this.props.route.params.refreshStateKey});
      }
    }
  }

  async storeVisitType(): VisitType {
    this.setState({isLoading: true});
    let visitType: VisitType = this.state.visitType;
    visitType = deepClone(visitType);
    try {
      visitType = await storeItem(visitType);
      if (!this.unmounted) {
        this.setState({visitType, isDirty: false, isLoading: false});
      }
    } catch (error) {
      if (this.unmounted) {
        this.props.navigation.navigate(
          'visitTypeTemplate',
          this.props.route.params.visitType,
        );
      } else {
        this.setState({isLoading: false});
      }
    }
    return visitType;
  }

  update = (fieldName: string, value: any) => {
    let visitType: VisitType = this.state.visitType;
    visitType[fieldName] = value;
    //Temporary until we support locales for visitType in Json structure
    const language: string = getUserLanguageShort();
    if (fieldName === 'nameEn' && language.toLowerCase() === 'en') {
      visitType.name = value;
    } else if (fieldName === 'nameFr' && language.toLowerCase() === 'fr') {
      visitType.nameFr = value;
    } else if (fieldName === 'nameEs' && language.toLowerCase() === 'es') {
      visitType.nameEs = value;
    }
    this.setState({visitType, isDirty: true});
  };

  async createVisitType() {
    const visitType: VisitType = await this.storeVisitType();
    if (
      !visitType.errors &&
      this.props.route.params.refreshStateKey
    ) {
      let visitTypes: VisitType[] = getAllVisitTypes();
      if (visitTypes) {
        visitTypes.push(visitType);
        cacheItem('visitTypes', visitTypes);
      }
      this.props.navigation.navigate('visitTypeCustomisation');
    }
  }

  render() {
    if (!this.state.visitType) {
      return null;
    }
    return (
      <View style={styles.screeen}>
        <View style={styles.scrollviewContainer}>
          <Text style={styles.screenTitle}>{strings.visitType}</Text>
          <ErrorCard errors={this.state.visitType.errors} />

          <View style={styles.centeredRowLayout}>
            <VisitTypeHeader
              visitType={this.state.visitType}
              isNewVisitType={this.state.isNewVisitType}
              onUpdate={this.update}
            />
          </View>
          <View style={styles.centeredRowLayout}>
            {this.state.isNewVisitType && (
              <Button
                title={strings.createVisitType}
                onPress={() => this.createVisitType()}
                testID="createVisitTypeButton"
                loading={this.state.isLoading}
                disabled={isEmpty(this.state.visitType.nameEn)}
              />
            )}
          </View>
        </View>
      </View>
    );
  }
}
export type VisitTypeListProps = {
  visible: boolean,
  visitTypes: VisitType[],
  selectedVisitTypeId: ?string,
  onSelectVisitType?: (visitType: ?VisitType) => void,
};
export class VisitTypeList extends PureComponent<VisitTypeListProps> {
  render() {
    if (!this.props.visible) {
      return null;
    }
    return (
      <View style={[styles.flexColumnLayout, {minWidth: 520 * fontScale}]}>
        <FlatList
          style={styles.columnCard}
          initialNumToRender={10}
          data={this.props.visitTypes}
          extraData={{selection: this.props.selectedVisitTypeId}}
          keyExtractor={(visitType, index) => visitType.id}
          renderItem={({item, index}: {item: VisitType, index: number}) => (
            <SelectionListRow
              label={
                item.inactive
                  ? item.name + ' (' + strings.inactive + ')'
                  : item.name
              }
              simpleSelect={true}
              onSelect={(isSelected: boolean | string) =>
                this.props.onSelectVisitType(item)
              }
              testID={'visitTypeList.option' + (index + 1)}
              textStyle={item.inactive ? styles.listTextGrey : styles.listText}
            />
          )}
        />
      </View>
    );
  }
}

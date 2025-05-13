/**
 * @flow
 */
'use strict';

import React, {PureComponent} from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  TextInput,
  LayoutAnimation,
  InteractionManager,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type {User} from './Types';
import {styles, isWeb} from './Styles';
import {strings, getUserLanguage} from './Strings';
import {searchItems, fetchItemById, storeItem, getToken, getRestUrl, isValidJson} from './Rest';
import {Button, SelectionListRow} from './Widgets';
import {FormRow, FormField, ErrorCard} from './Form';
import {getCachedItem, cacheItemById, cacheItem} from './DataCache';
import {Close} from './Favorites';
import {fetchCodeDefinitions, fetchProvincesCode} from './Codes';
import {getAccount, getStore} from './DoctorApp';
import {deepClone, isEmpty} from './Util';
import axios from 'axios';

const maxUserListSize: number = 200;

export async function fetchUser(userId: string): Promise<User> {
  let user: User = await fetchItemById(userId);
  return user;
}

export async function searchUsers(
  searchText: string,
  external: boolean,
  store?: string,
  allType?: boolean,
): Promise<User[]> {
  if (!searchText || searchText.trim().length === 0) {
    searchText = undefined;
  }
  const searchCriteria = {
    searchData: searchText,
    external: external,
    store: store,
    allType: allType,
  };
  let restResponse = await searchItems('User/list', searchCriteria);
  let users: User[] = restResponse.doctors;
  if (users && users.length > maxUserListSize) {
    users = users.slice(0, maxUserListSize);
  }
  return users;
}

export async function fetchUserSettings() {
  try {
    const httpResponse = await axios.get(getRestUrl() + 'User/settings', {
      headers: {
        token: getToken(),
        Accept: 'application/json',
        'Accept-language': getUserLanguage(),
      },
    });
    const restResponse = httpResponse?.data;
    // Check For Valid Json
    if (!isValidJson(restResponse)) {
      throw new Error('Invalid Json');
    }

    if (restResponse.setting) {
      cacheItem('user-setting', restResponse);
    }
  } catch (error) {
    console.log('Error fetching user settings: ' + error);
  }
}

function formatDoctorName(user: User): string {
  let name = '';
  if (!user) {
    return name;
  }
  if (user.firstName) {
    name += user.firstName.trim() + ' ';
  }
  if (user.lastName) {
    name += user.lastName.trim() + ' ';
  }
  if (user.instituteName) {
    name += user.instituteName.trim();
  }
  name = name.trim();
  return name;
}

export function convertUserToJson(user: User): any {
  const userJson: any = {
    label: formatDoctorName(user),
    value: user.id,
  };
  return userJson;
}

export function getUsers(): User {
  const users: User[] = getCachedItem('users');
  return users;
}

export type UserDetailsProps = {
  user: ?User,
  onUpdateUser: (user: User) => void,
  onButtonPress: () => void,
  buttonTitle: string,
  showButton: boolean,
  provinces: CodeDefinition[],
};
export class UserDetails extends PureComponent<UserDetailsProps> {
  constructor(props: UserDetailsProps) {
    super(props);
  }

  render() {
    if (!this.props.user) {
      return <View style={styles.tabCard} />;
    }
    return (
      <View style={styles.tabCard}>
        <ErrorCard errors={this.props.user.errors} />
        <View style={styles.form}>
          <FormRow>
            <FormField
              value={this.props.user}
              fieldName="providerType"
              onChangeValue={this.props.onUpdateUser}
              autoCapitalize="characters"
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.user}
              fieldName="firstName"
              onChangeValue={this.props.onUpdateUser}
              autoCapitalize="words"
            />
            <FormField
              value={this.props.user}
              fieldName="lastName"
              onChangeValue={this.props.onUpdateUser}
              autoCapitalize="words"
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.user}
              fieldName="instituteName"
              onChangeValue={this.props.onUpdateUser}
              autoCapitalize="words"
            />
            <FormField
              value={this.props.user}
              fieldName="license"
              onChangeValue={this.props.onUpdateUser}
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.user}
              fieldName="email"
              onChangeValue={this.props.onUpdateUser}
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.user}
              fieldName="fax"
              onChangeValue={this.props.onUpdateUser}
            />
            <FormField
              value={this.props.user}
              fieldName="tel1"
              onChangeValue={this.props.onUpdateUser}
            />
            <FormField
              value={this.props.user}
              fieldName="tel2"
              onChangeValue={this.props.onUpdateUser}
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.user}
              fieldName="address1"
              onChangeValue={this.props.onUpdateUser}
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.user}
              fieldName="address2"
              onChangeValue={this.props.onUpdateUser}
            />
          </FormRow>
          <FormRow>
            <FormField
              value={this.props.user}
              fieldName="countryId"
              onChangeValue={this.props.onUpdateUser}
            />
            <FormField
              customOptions={
                this.props.provinces && this.props.provinces.length > 0
                  ? this.props.provinces
                  : undefined
              }
              value={this.props.user}
              fieldName="province"
              onChangeValue={this.props.onUpdateUser}
            />
            <FormField
              value={this.props.user}
              fieldName="postalCode"
              onChangeValue={this.props.onUpdateUser}
            />
            <FormField
              value={this.props.user}
              fieldName="city"
              onChangeValue={this.props.onUpdateUser}
            />
          </FormRow>
        </View>
        {this.props.showButton && (
          <View style={styles.centeredRowLayout}>
            <Button
              title={this.props.buttonTitle ? this.props.buttonTitle : ''}
              onPress={this.props.onButtonPress}
              loading={this.props.buttonLoading}
              disabled={this.props.buttonLoading}
            />
          </View>
        )}
      </View>
    );
  }
}

export type UserListProps = {
  visible: boolean,
  users: User[],
  selectedUserId: ?string,
  onSelectUser?: (user: ?User) => void,
};
export class UserList extends PureComponent<UserListProps> {
  render() {
    if (!this.props.visible) {
      return null;
    }
    return (
      <FlatList
        style={styles.columnCard}
        initialNumToRender={10}
        data={this.props.users}
        extraData={{selection: this.props.selectedUserId}}
        keyExtractor={(user, index) => user.id}
        renderItem={({item, index}: {item: User, index: number}) => (
          <SelectionListRow
            label={formatDoctorName(item)}
            simpleSelect={true}
            selected={item.id === this.props.selectedUserId}
            onSelect={(isSelected: boolean | string) =>
              this.props.onSelectUser(item)
            }
            testID={'userList.option' + (index + 1)}
          />
        )}
      />
    );
  }
}

export type FindUserProps = {
  selectedUserId?: ?string,
  onSelectUser?: (user: ?User) => void,
  onNewUser?: () => void,
};
type FindUserState = {
  searchCriterium: string,
  users: User[],
  showUserList: boolean,
  searchLoading: boolean,
};
export class FindUser extends PureComponent<FindUserProps, FindUserState> {
  constructor(props: FindUserProps) {
    super(props);
    this.state = {
      searchCriterium: '',
      users: [],
      showUserList: false,
      searchLoading: false,
    };
  }

  async searchDoctors() {
    this.props.onSelectUser && this.props.onSelectUser(undefined);
    this.setState({showUserList: false, users: [], searchLoading: true});
    let users: User[] = await searchUsers(this.state.searchCriterium, true);
    this.setState({searchLoading: false});

    if (!users || users.length === 0) {
      if (!this.props.onNewUser) {
        alert(strings.noDoctorsFound);
        return;
      }
    }
    !isWeb && LayoutAnimation.spring();
    this.setState({
      showUserList: users != undefined && users.length > 0,
      users,
    });
  }

  newUser(): void {
    this.setState({showUserList: false, users: []});
    this.props.onNewUser();
    InteractionManager.runAfterInteractions(() =>
      LayoutAnimation.easeInEaseOut(),
    );
  }

  render() {
    return (
      <View style={styles.columnCard}>
        <TextInput
          placeholder={strings.findDoctor}
          returnKeyType="search"
          autoCorrect={false}
          autoFocus={true}
          style={styles.searchField}
          value={this.state.searchCriterium}
          onChangeText={(text: string) =>
            this.setState({searchCriterium: text})
          }
          onSubmitEditing={() => this.searchDoctors()}
          testID="userSearchCriterium"
        />
        <UserList
          users={this.state.users}
          visible={this.state.showUserList}
          selectedUserId={this.props.selectedUserId}
          onSelectUser={this.props.onSelectUser}
        />
        {this.props.onNewUser ? (
          <View style={styles.centeredRowLayout}>
            <Button
              title={strings.newDoctor}
              onPress={() => this.newUser()}
              testID="newDoctorButton"
            />
          </View>
        ) : null}
        {this.state.searchLoading && (
          <View>
            <ActivityIndicator color="#1db3b3" />
          </View>
        )}
      </View>
    );
  }
}

export type ManageUsersProps = {
  createdUser: (user: User) => void,
  label?: string,
  readonly?: boolean,
  onClose?: () => void,
  style?: any,
  testID?: string,
};
type ManageUsersState = {
  isActive: boolean,
  isTyping: boolean,
  user: ?User,
  isLoading: Boolean,
};
export class ManageUsers extends PureComponent<
  ManageUsersProps,
  ManageUsersState,
> {
  constructor(props: any) {
    super(props);
    this.state = {
      isActive: false,
      isTyping: false,
      user: undefined,
      isLoading: false,
    };
  }

  selectUser = (user: ?User) => {
    let cachedUser: ?User = user ? getCachedItem(user.id) : undefined;
    if (cachedUser) {
      user = cachedUser;
    }
    this.setState({user}, () => this.fetchUser(user));
  };

  async fetchUser(user: ?User) {
    if (!user || user.id === 'user') {
      return;
    }
    user = await fetchUser(user.id);
    if (user.id === this.state.user.id) {
      this.setState({user});
    }
  }

  newUser = () => {
    const store: Store = getStore();
    let newUser = {id: 'user', isExternal: true, countryId: store.country};
    this.updateUserProvince(newUser);
    this.setState({user: newUser});
  };

  isNewUser(): boolean {
    return this.state.user && this.state.user.id === 'user';
  }

  updateUserInfo = (user: User): void => {
    this.updateUserProvince(user);
    this.setState({user: deepClone(user)});
    if (user && user.id !== 'user') {
      this.updateUser(); //update existing user
    }
  };

  updateUserProvince(user: User) {
    let selectedCountry: number = !isEmpty(user.countryId)
      ? user.countryId
      : undefined;
    let selectedProvince: string = !isEmpty(user.province)
      ? user.province
      : undefined;

    if (selectedCountry === undefined) {
      return;
    }

    let countryProvinces: CodeDefinition[] =
      fetchProvincesCode(selectedCountry);
    let firstProvinceInCountry: string =
      countryProvinces.length > 0 ? countryProvinces[0].code : '';

    if (isEmpty(selectedProvince)) {
      user.province = firstProvinceInCountry;
    } else {
      //check if the province exist
      let province = countryProvinces.find(
        (province: CodeDefinition) => province.code === user.province,
      );
      user.province =
        province === undefined ? firstProvinceInCountry : province.code;
    }
  }

  updateUser = async (): Promise<void> => {
    this.setState({isLoading: true});
    let user: User = this.state.user;
    const isNewUser: boolean = user && user.id === 'user';
    user = await storeItem(user);

    !user.errors &&
      fetchCodeDefinitions(getUserLanguage(), getAccount().id, 'doctors');
    !user.errors &&
      (await fetchCodeDefinitions(
        getUserLanguage(),
        getAccount().id,
        'familyDoctors',
      ));

    if (
      (this.state.user && this.state.user.id === user.id) ||
      user.errors ||
      isNewUser
    ) {
      this.setState({user});
    }

    this.setState({isLoading: false});
    isNewUser & (user.errors === undefined)
      ? this.props.onClose()
      : () => undefined; //close modal when you create a new user
  };

  renderIcons() {
    return (
      <View style={styles.examIcons}>
        {this.props.onClose && (
          <TouchableOpacity
            onPress={this.props.onClose}
            testID="closeManageUser">
            <Close style={styles.screenIcon} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  render() {
    return (
      <View style={styles.page}>
        <Text style={styles.screenTitle}>
          {this.props.label ? this.props.label : strings.manageUsers}
        </Text>
        <View style={styles.centeredScreenLayout}>
          {!this.isNewUser() && (
            <FindUser
              selectedUserId={this.state.user ? this.state.user.id : undefined}
              onSelectUser={this.selectUser}
              onNewUser={this.newUser}
            />
          )}
          <UserDetails
            user={this.state.user}
            onUpdateUser={this.updateUserInfo}
            onButtonPress={this.updateUser}
            buttonTitle={this.isNewUser() ? strings.createUser : strings.update}
            buttonLoading={this.state.isLoading}
            showButton={this.isNewUser()}
            provinces={fetchProvincesCode(
              this.state.user && this.state.user.countryId
                ? this.state.user.countryId
                : undefined,
            )}
          />
        </View>
        {this.renderIcons()}
      </View>
    );
  }
}

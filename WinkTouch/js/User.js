/**
 * @flow
 */
'use strict';

import React, {PureComponent} from 'react';
import {View, Text, TouchableWithoutFeedback, TextInput, LayoutAnimation, InteractionManager, FlatList, TouchableOpacity } from 'react-native';
import type {User} from "./Types";
import {styles} from './Styles';
import { strings, getUserLanguage } from './Strings';
import { searchItems, fetchItemById, storeItem } from './Rest';
import { Button, SelectionListRow } from './Widgets';
import { FormRow, FormField, ErrorCard} from './Form';
import { getCachedItem, cacheItemById } from './DataCache';
import { Close } from './Favorites';
import { fetchCodeDefinitions } from './Codes';
import { getAccount } from './DoctorApp';

const maxUserListSize : number = 200;

export async function fetchUser(userId: string) : Promise<User> {
  let user : User = await fetchItemById(userId);
  return user;
}

export async function searchUsers(searchText: string, external: boolean) : Promise<User[]> {
    if (!searchText || searchText.trim().length===0) {
      searchText = undefined;
    }
    const searchCriteria = {
      searchData: searchText,
      external: external,
    };
    let restResponse = await searchItems('User/list', searchCriteria);
    let users: User[] = restResponse.doctors;
    if (users && users.length>maxUserListSize) users=users.slice(0, maxUserListSize);
    return users;
}

function formatDoctorName(user: User) : string {
  let name = '';
  if (!user) return name;
  if (user.firstName) name+=user.firstName.trim()+' ';
  if (user.lastName) name+=user.lastName.trim()+' ';
  if (user.instituteName) name+=user.instituteName.trim();
  name = name.trim();
  return name;
}

export type UserDetailsProps = {
  user: ?User,
  onUpdateUser: (user: User) => void
}
export class UserDetails extends PureComponent<UserDetailsProps> {
    constructor(props: UserDetailsProps) {
        super(props);
    }

    render() {
      if (!this.props.user) return <View style={styles.tabCard}/>;
      return <View style={styles.tabCard}>
          <ErrorCard errors={this.props.user.errors} />
          <View style={styles.form}>
            <FormRow>
              <FormField value={this.props.user} fieldName='firstName' onChangeValue={this.props.onUpdateUser} autoCapitalize='words'/>
              <FormField value={this.props.user} fieldName='lastName' onChangeValue={this.props.onUpdateUser} autoCapitalize='words'/>
            </FormRow>
            <FormRow>
              <FormField value={this.props.user} fieldName='instituteName' onChangeValue={this.props.onUpdateUser} autoCapitalize='words'/>
              <FormField value={this.props.user} fieldName='license' onChangeValue={this.props.onUpdateUser} />
            </FormRow>
            <FormRow>
              <FormField value={this.props.user} fieldName='email' onChangeValue={this.props.onUpdateUser}/>
            </FormRow>
            <FormRow>
              <FormField value={this.props.user} fieldName='fax' onChangeValue={this.props.onUpdateUser} />
              <FormField value={this.props.user} fieldName='tel1' onChangeValue={this.props.onUpdateUser} />
              <FormField value={this.props.user} fieldName='tel2' onChangeValue={this.props.onUpdateUser} />
            </FormRow>
            <FormRow>
              <FormField value={this.props.user} fieldName='address1' onChangeValue={this.props.onUpdateUser}/>
            </FormRow>
            <FormRow>
              <FormField value={this.props.user} fieldName='address2' onChangeValue={this.props.onUpdateUser}/>
            </FormRow>
            <FormRow>
              <FormField value={this.props.user} fieldName='province' onChangeValue={this.props.onUpdateUser}/>
              <FormField value={this.props.user} fieldName='postalCode' onChangeValue={this.props.onUpdateUser}/>
              <FormField value={this.props.user} fieldName='city' onChangeValue={this.props.onUpdateUser}/>
            </FormRow>
          </View>
      </View>
    }
}

export type UserListProps = {
  visible: boolean,
  users: User[],
  selectedUserId: ?string,
  onSelectUser?: (user: ?User) => void,
}
class UserList extends PureComponent<UserListProps> {
  render() {
    if (!this.props.visible)
      return null;
    return <FlatList
        style={styles.columnCard}
        initialNumToRender={10}
        data={this.props.users}
        extraData={{selection: this.props.selectedUserId}}
        keyExtractor = {(user, index) => user.id}
        renderItem={({item, index} : {item: User, index: number}) => <SelectionListRow
            label={formatDoctorName(item)}
            simpleSelect={true}
            selected={item.id===this.props.selectedUserId}
            onSelect={(isSelected : boolean|string) => this.props.onSelectUser(item)}
            testID={'userList.option'+(index+1)}
          />
        }
      />
  }
}

export type FindUserProps = {
  selectedUserId?: ?string,
  onSelectUser?: (user: ?User) => void,
  onNewUser?: () => void
};
type FindUserState = {
  searchCriterium: string,
  users: User[],
  showUserList: boolean,
  showNewUserButton: boolean
};
export class FindUser extends PureComponent<FindUserProps, FindUserState> {
  constructor(props: FindUserProps) {
    super(props);
    this.state = {
      searchCriterium: '',
      users: [],
      showUserList: false,
      showNewUserButton: false
    }
  }

  async searchDoctors() {
      this.props.onSelectUser && this.props.onSelectUser(undefined);
      this.setState({showUserList: false, showNewUserButton: false, users: []});
      let users : User[] = await searchUsers(this.state.searchCriterium, true);
      if (!users || users.length===0) {
        if (!this.props.onNewUser) {
          alert(strings.noDoctorsFound);
          return;
        }
      }
      LayoutAnimation.spring();
      this.setState({
        showUserList: users!=undefined && users.length>0,
        showNewUserButton: users===undefined || users.length<maxUserListSize,
        users
      });
  }

  newUser() : void {
    this.setState({ showUserList: false, showNewUserButton:false, users: []});
    this.props.onNewUser();
    InteractionManager.runAfterInteractions(() => LayoutAnimation.easeInEaseOut());
  }

  render() {
    return <View style={styles.columnCard}>
      <TextInput placeholder={strings.findDoctor} returnKeyType='search' autoCorrect={false} autoFocus={true}
        style={styles.searchField} value={this.state.searchCriterium}
        onChangeText={(text: string) => this.setState({ searchCriterium: text })}
        onSubmitEditing={() => this.searchDoctors()}
        testID='userSearchCriterium'
      />
      <UserList
        users={this.state.users}
        visible={this.state.showUserList}
        selectedUserId={this.props.selectedUserId}
        onSelectUser={this.props.onSelectUser}
      />
      {this.props.onNewUser && this.state.showNewUserButton?<View style={styles.centeredRowLayout}>
        <Button title={strings.newDoctor} visible={this.state.showNewUserButton} onPress={() => this.newUser()} testID='newDoctorButton'/>
      </View>:null}
    </View>
  }
}

export type ManageUsersProps = {
  createdUser: (user: User) => void,
  label?: string,
  readonly?: boolean,
  onClose?: () => void,
  style?: any,
  testID?: string
}
type ManageUsersState = {
  isActive: boolean,
  isTyping: boolean,
  user: ?User
}
export class ManageUsers extends PureComponent<ManageUsersProps, ManageUsersState> {
  constructor(props: any) {
    super(props);
    this.state = {
      isActive: false,
      isTyping: false,
      user: undefined
    };
  }

  selectUser = (user: ?User) => {
    let cachedUser: ?User = user?getCachedItem(user.id):undefined;
    if (cachedUser) user = cachedUser;
    this.setState({user}, () => this.fetchUser(user));
  }

  async fetchUser(user: ?User) {
    if (!user || user.id==='user') return;
    user = await fetchUser(user.id);
    if (user.id===this.state.user.id) {
      this.setState({user});
    }
  }

  newUser = () => {
    this.setState({user: {id:'user', isExternal:true}});
  }

  async updateUser(user: User) : Promise<void> {
    const isNewUser : boolean = user && user.id==='user';
    user = await storeItem(user);
    if ((this.state.user && this.state.user.id===user.id ) || user.errors || isNewUser) {
      this.setState({user});
    }
    fetchCodeDefinitions(getUserLanguage(), getAccount().id, 'doctors');
  }

  renderIcons() {
    return <View style={styles.examIcons}>
      {this.props.onClose && <TouchableOpacity onPress={this.props.onClose} testID='closeManageUser'><Close style={styles.screenIcon}/></TouchableOpacity>}
    </View>
  }

  render() {
    return <View style={styles.page}>
      <Text style={styles.screenTitle}>{this.props.label?this.props.label:strings.manageUsers}</Text>
      <View style={styles.centeredScreenLayout}>
        <FindUser selectedUserId={this.state.user?this.state.user.id:undefined} onSelectUser={this.selectUser} onNewUser={this.newUser}/>
        <UserDetails user={this.state.user} onUpdateUser={(user: ?User) => this.updateUser(user)}/>
      </View>
      {this.renderIcons()}
    </View>
  }
}

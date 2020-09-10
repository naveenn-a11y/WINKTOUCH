/**
 * @flow
 */
'use strict';

import React, {PureComponent} from 'react';
import {View, Text, TouchableWithoutFeedback, TextInput, LayoutAnimation, InteractionManager, FlatList } from 'react-native';
import type {User} from "./Types";
import {styles} from './Styles';
import { strings } from './Strings';
import { searchItems, fetchItemById, storeItem } from './Rest';
import { Button, SelectionListRow } from './Widgets';
import { FormRow, FormField} from './Form';
import { getCachedItem, cacheItemById } from './DataCache';

const maxUserListSize : number = 200;

export async function fetchUser(userId: string) : Promise<User> {
  let user : User = await fetchItemById(userId);
  return user;
}

export async function searchUsers(searchText: string, external: boolean) : Promise<User[]> {
    if (!searchText || searchText.trim().length===0) {
      return [];
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

export type UserDetailsProps = {
  userId: ?string,
  onUpdateUser: (user: User) => void
}
type UserDetailsState = {
  user: ?User
}
export class UserDetails extends PureComponent<UserDetailsProps, UserDetailsState> {
    constructor(props: UserDetailsProps) {
        super(props);
        this.state = {
          user: getCachedItem(props.userId)
        }
    }

    componentDidUpdate(prevProps: UserDetailsProps, prevState: UserDetailsState) {
      if (this.props.userId===prevProps.userId) return;
      let user: ?User = getCachedItem(this.props.userId);
      this.setState({user}, () => this.refreshUser(this.props.userId));
    }

    async refreshUser(userId: string) {
      if (!userId || userId==='user') return;
      let user : ?User = await fetchUser(userId);
      if (userId!==this.props.userId) return;
      this.setState({user});
    }

    render() {
      if (!this.state.user) return <View style={styles.tabCard}/>;
      return <View style={styles.tabCard}>
          <View style={styles.form}>
            <FormRow>
              <FormField value={this.state.user} fieldName='firstName' onChangeValue={this.props.onUpdateUser} autoCapitalize='words'/>
              <FormField value={this.state.user} fieldName='lastName' onChangeValue={this.props.onUpdateUser} autoCapitalize='words'/>
            </FormRow>
            <FormRow>
              <FormField value={this.state.user} fieldName='instituteName' onChangeValue={this.props.onUpdateUser} autoCapitalize='words'/>
              <FormField value={this.state.user} fieldName='license' onChangeValue={this.props.onUpdateUser} />
            </FormRow>
            <FormRow>
              <FormField value={this.state.user} fieldName='email' onChangeValue={this.props.onUpdateUser}/>
            </FormRow>
            <FormRow>
              <FormField value={this.state.user} fieldName='fax' onChangeValue={this.props.onUpdateUser} />
              <FormField value={this.state.user} fieldName='tel1' onChangeValue={this.props.onUpdateUser} />
              <FormField value={this.state.user} fieldName='tel2' onChangeValue={this.props.onUpdateUser} />
            </FormRow>
            <FormRow>
              <FormField value={this.state.user} fieldName='address1' onChangeValue={this.props.onUpdateUser}/>
            </FormRow>
            <FormRow>
              <FormField value={this.state.user} fieldName='address2' onChangeValue={this.props.onUpdateUser}/>
            </FormRow>
            <FormRow>
              <FormField value={this.state.user} fieldName='province' onChangeValue={this.props.onUpdateUser}/>
              <FormField value={this.state.user} fieldName='postalCode' onChangeValue={this.props.onUpdateUser}/>
              <FormField value={this.state.user} fieldName='city' onChangeValue={this.props.onUpdateUser}/>
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
            label={item.firstName+' '+item.lastName}
            simpleSelect={true}
            selected={item.id===this.props.selectedUserId}
            onSelect={(isSelected : boolean|string) => isSelected && this.props.onSelectUser(item)}
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
      this.setState({showUserList: false, users: []});
      if (!this.state.searchCriterium || this.state.searchCriterium.trim().length===0) {
        alert(strings.searchCriteriumMissingError);
        return;
      }
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
  style?: any,
  testID?: string
}
type ManageUsersState = {
  isActive: boolean,
  isTyping: boolean,
  userId: ?string
}
export class ManageUsers extends PureComponent<ManageUsersProps, ManageUsersState> {
  constructor(props: any) {
    super(props);
    this.state = {
      isActive: false,
      isTyping: false,
      userId: undefined
    };
  }

  selectUser = (user: ?User) => {
    cacheItemById(user);
    this.setState({userId: user?user.id:undefined});
  }

  newUser = () => {
    this.setState({userId: 'user'});
  }

  async updateUser(user: User) : void {
    user = await storeItem(user);
    __DEV__ && console.log('Stored user: '+JSON.stringify(user));
  }

  render() {
    return <View style={styles.page}>
      <Text style={styles.screenTitle}>{this.props.label?this.props.label:strings.manageUsers}</Text>
      <View style={styles.centeredScreenLayout}>
        <FindUser selectedUserId={this.state.userId} onSelectUser={this.selectUser} onNewUser={this.newUser}/>
        <UserDetails userId={this.state.userId} onUpdateUser={(user: User) => this.updateUser(user)}/>
      </View>
    </View>
  }
}

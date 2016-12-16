/**
 * @flow
 */
'use strict';
import React, {Component} from 'react';
import {View, TextInput, StatusBar, AsyncStorage} from 'react-native';
import LoginScreen from './LoginScreen';
import OverviewScreen from './OverviewScreen';
import RegisterScreen from './RegisterScreen';

type Account = {
    id: string,
    companyName: string
};

type User = {
    firstName: string,
    lastName: string,
    language: string
};

type Store = {
    id: string,
    storeName: string
};

export default class EhrApp extends Component {
    state : {
        isRegistered: boolean,
        isLoggedOn: boolean,
        isLocked: boolean,
        account: Account,
        user: User,
        store: Store
    };

    constructor() {
        super();
        this.state = {
            isRegistered: false,
            isLoggedOn: false,
            isLocked: false
        };
    }

    async reset() {
        const companyName = await AsyncStorage.getItem('companyName');
        AsyncStorage.removeItem("companyName");
        this.setState({
            isRegistered: false,
            isLoggedOn: false,
            account: {
                id: null,
                companyName: companyName
            },
            user: null,
            store: null
        });
    }

    async setAccount(account) {
        AsyncStorage.setItem('companyName', account.companyName);
        this.setState({isRegistered: true, account: account});
    }

    userLoggedOn(user) {
        this.setState({isLoggedOn: true, user: user});
    }

    startDemo() {
        this.setState({
            isRegistered: true,
            isLoggedOn: true,
            account: {
                id: '',
                companyName: 'Test Optical Store'
            },
            user: {
                firstName: 'Roger',
                lastName: 'Bacon',
                language: 'en'
            },
            store: {
                storeName: 'test store'
            }
        });
    }

    async loadAccount() {
        const companyName = await AsyncStorage.getItem('companyName');
        console.log('companyName on device is: ' + companyName);
        if (companyName !== null) {
            let account = {
                companyName: companyName
            };
            this.setAccount(account);
        }
    }

    startLockingDog() {
        //TODO
    }

    componentDidMount() {
        this.loadAccount();
        this.startLockingDog();
    }

    render() {
        if (!this.state.isRegistered) {
            return <RegisterScreen account={this.state.account} onSuccess={(account) => this.setAccount(account)}/>
        }
        if (!this.state.isLoggedOn) {
            return <LoginScreen account={this.state.account} onSuccess={(user) => this.userLoggedOn(user)} onReset={() => this.reset()}/>
        }
        return <OverviewScreen account={this.state.account} user={this.state.user}/>
    }

}

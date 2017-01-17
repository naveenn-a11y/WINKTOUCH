/**
 * @flow
 */
'use strict';

import React, {Component} from 'react';
import {
    Image,
    Text,
    TextInput,
    View,
    TouchableHighlight,
    ScrollView,
    AsyncStorage,
    Picker,
    Platform,
    ActionSheetIOS,
    Button,
    PanResponder
} from 'react-native';
import base64 from 'base-64';
import {styles, fontScale} from './Styles';

type State = {
    userName: string,
    password: string,
    store: string
};

type Props = {
    account: {
        id: string,
        companyName: string
    },
    onSuccess: (user)
};

class WinkPicker extends Component {
    constructor(props) {
        super(props);
    }

    showActionSheetIos() {
        ActionSheetIOS.showActionSheetWithOptions({
            options: ['store 1', 'store 2', 'store 3']
        }, (index) => console.log('button choosen: ' + index))
    }

    render() {
        if (Platform.OS === 'ios') {
            return <Text style={styles.dropdownButtonIos} onPress={() => this.showActionSheetIos()}>Store</Text>;
        }
        return <Picker style={styles.picker}>
            <Picker.Item label="Store 1" value="Store 1"/>
            <Picker.Item label="Store 2" value="Store 2"/>
            <Picker.Item label="Store 3" value="Store 3"/>
        </Picker>
    }
}

export default class LoginScreen extends Component {
    constructor(props : Props) {
        super(props);
        this.state = {
            userName: '',
            password: ''
        };
    }

    async login() {
        console.log('login attemp for ' + this.state.userName);
        try {
            let response = await fetch('https://dev1.downloadwink.com/Wink/testLogin', {
                method: 'POST',                
                headers: {
                    'Accept': 'applicatoin/json',
                    'Authorization': 'Basic ' + base64.encode(this.state.userName + ':' + this.state.password)
                }
            });
            let json = await response.json();
            console.log('response:' + json.loggedIn + ' ' + json.username);
            const user = {
                firstName: 'Foo',
                lastName: 'Bar',
                language: 'en'
            };
            AsyncStorage.setItem("userName", this.state.userName);
            this.props.onSuccess(user);
        } catch (error) {
            console.error(error);
            alert("Login failed: " + error);
        }
    }

    reset() {
        AsyncStorage.removeItem("userName");
        this.props.onReset();
    }

    componentDidMount() {
        AsyncStorage.getItem("userName", (Error, userName) => this.setState({userName: userName}));
    }


    render() {
        return <View style={styles.centeredRowLayout}>
            <ScrollView>
                <View style={styles.centeredColumnLayout}>
                    <Text style={styles.h1}>Welcome to Wink</Text>
                    <Image source={require('./image/winklogo-big.png')} style={{
                        width: 250 *fontScale,
                        height: 250 *fontScale
                    }}/>
                    <View>
                        <TextInput placeholder='User name' style={[
                            styles.textfield, {
                                width: 250 *fontScale
                            }
                        ]} value={this.state.userName} onChangeText={(text) => this.setState({userName: text})}/>
                        <TextInput secureTextEntry={true} placeholder='Password' style={[
                            styles.textfield, {
                                width: 250 *fontScale
                            }
                        ]} value={this.state.password} onChangeText={(text) => this.setState({password: text})}/>
                        <WinkPicker selectedValue={this.state.store} onValueChange={(value) => this.setState({store: value})} style={styles.comboBox}/>
                    </View>
                    <View style={styles.buttonsRowLayout}>
                        <Button title='Login' onPress={() => this.login()} style={styles.button}/>
                        <Button title='Reset' onPress={() => this.reset()} style={styles.button}/>
                    </View>
                </View>
            </ScrollView>
        </View>
    }
}

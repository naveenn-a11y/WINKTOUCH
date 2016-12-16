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
    KeyboardAvoidingView
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {styles, fontScale} from './Styles';

export default class RegisterScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            companyName: (props.account !== undefined)
                ? props.account.companyName
                : undefined
        }
    }

    register() {
        if (this.state.companyName === undefined || this.state.companyName === null || this.state.companyName.length < 3) {
            alert("Please provide the company name you will be using with Wink.");
            return;
        }
        const account = {
            companyName: this.state.companyName
        };
        this.props.onSuccess(account);
    }

    render() {
        return <View style={styles.centeredRowLayout}>
            <View style={styles.centeredColumnLayout}>
                <Text style={styles.h1}>Welcome to Wink EHR</Text>
                <Image source={require('./winklogo-big.png')} style={{
                    width: 250 *fontScale,
                    height: 250 *fontScale
                }}/>
                <Text style={styles.label}>Please enter your registered company name to get started</Text>
                <View>
                    <TextInput placeholder='Company name' style={[
                        styles.textfield, {
                            width: 425
                        }
                    ]} value={this.state.companyName} onChangeText={(companyName) => this.setState({companyName: companyName})}/></View>
                <View style={styles.buttonsRowLayout}>
                    <TouchableHighlight onPress={() => this.register()}>
                        <Text style={styles.button}>Start</Text>
                    </TouchableHighlight>
                </View>
            </View>
        </View>
    }
}

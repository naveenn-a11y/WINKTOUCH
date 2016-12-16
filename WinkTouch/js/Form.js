/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, TouchableHighlight, Text, TextInput, Button, TouchableWithoutFeedback } from 'react-native';
import dateFormat from 'dateformat';
import { styles, fontScale } from './Styles';

export class FormLabel extends Component {
    render() {
        return <Text style={[styles.formLabel, { width: this.props.width }]}>{this.props.value}:</Text>
    }
}

export class FormRow extends Component {
    render() {
        return <View style={styles.formRow}>
            {this.props.children}
        </View>
    }
}

export class FormTextInput extends Component {
    props: {
        value?: string,
        label: string,
        labelWidth?: number,
        onChangeText?: (text: string) => void,
        keyboardType?: string,
    }
    state: {
        value?: string,
        validation: string,
        errorMessage?: string
    }
    validator: (value: string) => any;
    constructor(props: any) {
        super(props);
        this.state = {
            value: this.props.value,
            validation: 'if (value.length<=4) return "Not long enough dude \u274c"',
            errorMessage: undefined
        }
        this.validator = new Function('value', this.state.validation);
    }

    componentWillReceiveProps(nextProps: any) {
        if (nextProps.value !== this.state.value)
            this.setState({ value: nextProps.value });
    }

    validate(input: string) {
        if (!input)
            return;
        let validationError: string = this.validator(input);
        this.setState({ errorMessage: validationError });
    }

    commit(input: string) {
        this.validate(input);
        if (this.props.onChangeText)
            this.props.onChangeText(input);
    }

    dismissError() {
        this.setState({ errorMessage: undefined });
    }

    render() {
        return <View style={styles.formElement}>
            <FormLabel width={this.props.labelWidth} value={this.props.label} />
            <TextInput
                value={this.state.value}
                autoCapitalize='none' autoCorrect={false} placeholder={this.props.label}
                keyboardType={this.props.keyboardType}
                style={styles.formField}
                onChangeText={(text: string) => this.setState({ value: text })}
                onEndEditing={(event) => this.commit(event.nativeEvent.text)}
                />
            <Text style={styles.formValidationError}>{this.state.errorMessage}</Text>
        </View>
    }
}

export class FormEmailInput extends Component {
    props: {
        value?: string,
        label: string,
        labelWidth?: number
    }
    render() {
        return <FormTextInput keyboardType='email-address' {...this.props} />
    }
}


export class FormDateInput extends Component {
    props: {
        value?: Date,
        label: string,
        labelWidth?: number
    }
    constructor(props: any) {
        super(props);
    }
    render() {
        return <View style={styles.formElement}>
            <FormLabel width={this.props.labelWidth} value={this.props.label} />
            <TextInput placeholder={this.props.label} value={dateFormat(this.props.value, 'm/d/yy h:m')} style={styles.formField} />
        </View>
    }
}
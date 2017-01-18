/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, TouchableHighlight, Text, TextInput, Button, TouchableWithoutFeedback } from 'react-native';
import dateFormat from 'dateformat';
import { styles, fontScale } from './Styles';
import { strings } from './Strings';

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
        validation?: string,
        label: string,
        labelWidth?: number,
        onChangeText?: (text: string) => void,
        keyboardType?: string,
        editable?: boolean,
    }
    static defaultProps = {
      editable: true,
      validation: 'if (value.length<=5) validationError = errors.formatString(errors.minLengthError, 5);'+
        'if (value.length>20) validationError = errors.formatString(errors.maxLengthError, 20);',
    }

    state: {
        value?: string,
        errorMessage?: string
    }
    constructor(props: any) {
        super(props);
        this.state = {
            value: this.props.value,
            errorMessage: undefined
        }
    }

    componentWillReceiveProps(nextProps: any) {
        if (nextProps.value !== this.state.value)
            this.setState({ value: nextProps.value });
    }

    validate(value: string) {
        if (!this.props.validation)
            return;
        let validationError: string = undefined;
        let errors = strings;
        eval(this.props.validation);
        if (validationError)
          validationError = validationError + ' \u274c';
        this.setState({ errorMessage: validationError });
    }

    commit(input: string) {
        this.validate(input);
        if (this.props.onChangeText)
            this.props.onChangeText(input);
    }

    dismissError = () => {
        this.setState({ errorMessage: undefined });
    }

    render() {
        return <TouchableWithoutFeedback onPress={this.dismissError}>
          <View style={styles.formElement}>
            <FormLabel width={this.props.labelWidth} value={this.props.label} />
            <TextInput
                value={this.state.value}
                autoCapitalize='none' autoCorrect={false} placeholder={'Not asked'}
                keyboardType={this.props.keyboardType}
                style={styles.formField}
                onChangeText={(text: string) => this.setState({ value: text })}
                onEndEditing={(event) => this.commit(event.nativeEvent.text)}
                editable={this.props.editable}
                />
            <Text style={styles.formValidationError}>{this.state.errorMessage}</Text>
          </View>
        </TouchableWithoutFeedback>
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

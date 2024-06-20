/**
 * @flow
 */

'use strict';

import {Component, PureComponent} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {formatAllCodes} from './Codes';
import {Garbage, Star} from './Favorites';
import {FormTextInput} from './Form';
import {formatLabel} from './Items';
import {strings} from './Strings';
import {fontScale, isWeb, styles} from './Styles';
import type {CodeDefinition, FieldDefinition} from './Types';
import {CheckButton, Label} from './Widgets';

export class CheckList extends PureComponent {
  props: {
    value: string | string[],
    definition: FieldDefinition,
    editable?: boolean,
    style?: any,
    onChangeField?: (newValue: string | string[]) => void,
    onClear?: () => void,
    onAddFavorite?: () => void,
    onAdd?: () => void,
    patientId: string,
    examId: string,
    fieldId: string,
  };
  state: {
    formattedOptions: string[],
  };
  static defaultProps = {
    editable: true,
  };

  constructor(props: any) {
    super(props);
    let formattedOptions: string[] = this.formatOptions(
      props.definition.options,
    );
    this.addValueAsOption(formattedOptions, props.value);
    this.state = {
      formattedOptions,
    };
  }

  componentDidUpdate(prevProps: any) {
    if (
      this.props.value === prevProps.value &&
      this.props.definition.options === prevProps.definition.options
    ) {
      return;
    }
    let formattedOptions = this.formatOptions(this.props.definition.options);
    this.addValueAsOption(formattedOptions, this.props.value);
    this.setState({
      formattedOptions,
    });
  }

  formatOptions(
    options: CodeDefinition[][] | CodeDefinition[] | string,
  ): string[] {
    let formattedOptions: string[] = [];
    if (!(options instanceof Array)) {
      formattedOptions = formatAllCodes(options, undefined);
    } else {
      formattedOptions = [...options];
    }
    if (formattedOptions === undefined || formattedOptions === null) {
      formattedOptions = [];
    }
    return formattedOptions;
  }

  addValueAsOption(formattedOptions: string[], value: string | string[]): void {
    if (value === undefined) {
      return;
    }
    if (value instanceof Array) {
      value.forEach((subValue: string) => {
        if (!formattedOptions.includes(subValue)) {
          formattedOptions.push(subValue);
        }
      });
    } else {
      if (!formattedOptions.includes(value)) {
        formattedOptions.push(value);
      }
    }
  }

  isSelected(option: string): boolean | string {
    let value: string | string[] = this.props.value;
    if (value === undefined) {
      return false;
    }
    if (value instanceof Array) {
      for (let i: number = 0; i < value.length; i++) {
        if (this.props.definition.prefix instanceof Array) {
          let selection: string = value[i];
          let prefix: string | boolean = true;
          if (selection.startsWith('(')) {
            prefix = selection.substring(1, 2);
            selection = selection.substring(4);
          }
          if (selection === option) {
            return prefix;
          }
        } else {
          let selection: string = value[i];
          if (selection === option) {
            return true;
          }
        }
      }
      return false;
    }
    if (typeof value === 'string' && value.startsWith('(')) {
      value = value.substring(4);
    }
    return value === option;
  }

  select = (option: string) => {
    console.log('Optionss: ' + option);
    let value: string | string[] = this.props.value;
    if (value instanceof Array) {
      if (this.props.definition.prefix instanceof Array) {
        let prefix;
        if (option.startsWith('(')) {
          prefix = option.substring(1, 2);
          option = option.substring(4);
        }
        let index = -1;
        for (let i: number = 0; i < value.length; i++) {
          let selection: string = value[i];
          if (selection.startsWith('(')) {
            selection = selection.substring(4);
          }
          if (selection === option) {
            index = i;
            break;
          }
        }
        if (index < 0) {
          if (this.props.definition.multiValue) {
            value.push(option);
          } else {
            value = [option];
          }
        } else {
          if (prefix === undefined) {
            prefix = '-';
          } else if (prefix === '-') {
            prefix = '?';
          } else if (prefix === '?') {
            prefix = '+';
          } else if (prefix === '+') {
            prefix = undefined;
          }
          if (prefix === undefined) {
            value.splice(index, 1);
          } else {
            value[index] = '(' + prefix + ') ' + option;
          }
        }
      } else {
        //No -?+ prefix
        const index: number = value.indexOf(option);
        if (this.props.definition.multiValue) {
          if (index < 0) {
            value.push(option);
          } else {
            value.splice(index, 1);
          }
        } else {
          if (index < 0) {
            value = [option];
          } else {
            value.splice(index, 1);
          }
        }
      }
    } else {
      let isSelected: boolean = value === option;
      if (value === option) {
        //Deselect
        if (this.props.definition.multiValue) {
          value = [];
        } else {
          value = undefined;
        }
      } else {
        //Select
        if (this.props.definition.multiValue) {
          value = [option];
        } else {
          value = option;
        }
      }
    }
    this.props.onChangeField && this.props.onChangeField(value);
  };

  addValue = (option: string) => {
    if (option === undefined || option === null || option === '') {
      return;
    }
    let value: string | string[] = this.props.value;
    if (value instanceof Array) {
      if (this.props.definition.multiValue) {
        if (!value.includes(option)) {
          value = [...value];
          value.push(option);
        }
      } else {
        value = option;
      }
    } else {
      if (this.props.definition.multiValue) {
        value = [option];
      } else {
        value = option;
      }
    }
    this.props.onChangeField && this.props.onChangeField(value);
  };

  render() {
    const style = this.props.style
      ? this.props.style
      : this.props.definition.size
        ? styles['board' + this.props.definition.size]
        : styles.board;
    return (
      <View style={style}>
        <Label
          style={styles.sectionTitle}
          suffix=""
          value={formatLabel(this.props.definition)}
          fieldId={this.props.fieldId}
        />
        <View
          style={
            this.props.style
              ? undefined
              : isWeb
                ? {maxHeight: 500 * fontScale}
                : styles.wrapBoard
          }>
          <ScrollView scrollEnabled={true}>
            {this.state.formattedOptions.map(
              (option: string, index: number) => {
                const isSelected: boolean | string = this.isSelected(option);
                const prefix: string =
                  isSelected === true || isSelected === false
                    ? ''
                    : '(' + isSelected + ') ';
                return (
                  <View style={[styles.formRow]} key={option}>
                    <CheckButton
                      isChecked={isSelected !== false}
                      suffix={prefix + option}
                      onSelect={() => this.select(prefix + option)}
                      onDeselect={() => this.select(prefix + option)}
                      readonly={this.props.editable != true}
                      testID={this.props.fieldId + '.option' + (index + 1)}
                    />
                  </View>
                );
              },
            )}
          </ScrollView>
        </View>
        {this.props.definition.freestyle && this.props.editable && (
          <View style={styles.formRow} key="freestyle">
            <FormTextInput
              speakable={true}
              onChangeText={this.addValue}
              testID={this.props.fieldId + '.speachField'}
            />
          </View>
        )}
        {this.props.editable && this.props.onClear && (
          <View style={styles.groupIcons}>
            <TouchableOpacity
              onPress={this.props.onClear}
              testID={this.props.fieldId + '.garbageIcon'}>
              <Garbage style={styles.groupIcon} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
}

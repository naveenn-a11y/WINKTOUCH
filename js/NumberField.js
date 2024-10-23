import React, { Component } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { TextField, ClearTile, KeyboardTile, UpdateTile, RefreshTile, ListField } from './Widgets';
import { styles } from './Styles';
import { CustomModal as Modal } from './utilities/Modal';
import { generateFractions, splitValue, calculateCombinedValue } from './NumberFieldHelpers';

export class NumberField extends Component {
  props: {
    value: number,
    options: CodeDefinition[] | string,
    label?: string,
    prefix?: string,
    suffix?: string | string[],
    range: number[],
    width?: number,
    stepSize?: number | number[],
    groupSize?: number,
    decimals?: number,
    readonly?: boolean,
    freestyle?: boolean,
    isTyping?: boolean,
    autoFocus?: boolean,
    style?: any,
    onChangeValue?: (newvalue: ?number) => void,
    transferFocus?: {
      previousField: string,
      nextField: string,
      onTransferFocus: (field: string) => void,
    },
    listField?: number,
    testID: string,
    unit?: string,
    onBlur?: () => void,
  };
  state: {
    isActive: boolean,
    isDirty: boolean,
    isTyping: boolean,
    editedValue: (?string)[] | ?string,
    fractions: ?(string[][]),
  };
  static defaultProps = {
    stepSize: 1,
    groupSize: 10,
    autoFocus: false,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      editedValue: props.isTyping
        ? props.value
        : [undefined, undefined, undefined, undefined, undefined],
      isActive: false,
      isDirty: false,
      isTyping: props.isTyping,
      fractions: undefined,
    };
  }

  componentDidUpdate(prevProps: any) {
    if (
      this.props.value === prevProps.value &&
      this.props.isTyping === prevProps.isTyping
    ) {
      return;
    }
    this.setState({
      editedValue: this.props.isTyping
        ? this.props.value
        : [undefined, undefined, undefined, undefined, undefined],
      isActive: false,
      isDirty: false,
      isTyping: this.props.isTyping,
      fractions: undefined,
    });
  }

  componentWillUnmount() {
    if (this.state.isActive) {
      this.cancelEdit();
    }
  }

  startEditing = () => {
    if (this.props.readonly) {
      return;
    }
    const fractions = this.generateFractions(this.props);
    //KeyEvent.onKeyUpListener((keyEvent) => {
    //  console.log(`onKeyUp keyCode: ${keyEvent.keyCode}`);
    //  console.log(`Action: ${keyEvent.action}`);
    //  console.log(`Key: ${keyEvent.pressedKey}`);
    //});
    this.setState({
      editedValue: fractions
        ? this.splitValue(this.props.value, fractions)
        : undefined,
      isActive: true,
      isDirty: false,
      fractions,
    });
  };

  openModal = () => {
    if (!this.state.isTyping) {
      return;
    }

    this.setState({isTyping: false});
    this.startEditing();
  };
  startTyping = () => {
    if (this.props.readonly) {
      return;
    }
    //KeyEvent.removeKeyUpListener();
    this.setState({isActive: false, isTyping: true});
  };

  commitTyping = (newValue: string): void => {
    if (this.state.isActive) {
      this.setState({isActive: false}, this.props.onChangeValue(newValue));
    } else {
      this.props.onChangeValue(newValue);
    }
  };

  commitEdit = (nextFocusField?: string) => {
    if (
      this.props.onChangeValue != undefined &&
      (nextFocusField === undefined || this.state.isDirty)
    ) {
      const combinedValue: ?number = this.combinedValue();
      this.props.onChangeValue(combinedValue);
    }
    //KeyEvent.removeKeyUpListener();
    this.setState({isActive: false, isTyping: this.props.isTyping});
    if (nextFocusField != undefined && this.props.transferFocus) {
      this.props.transferFocus.onTransferFocus(nextFocusField);
    }
  };

  cancelEdit = () => {
    //KeyEvent.removeKeyUpListener();
    this.setState({isActive: false});
  };

  combinedValue(): ?number {
    if (this.state.fractions === undefined) {
      //keypad
      const value = Number.parseFloat(this.state.editedValue);
      if (isFinite(value)) {
        return value;
      }
      return this.state.editedValue;
    }
    if (
      this.state.editedValue[0] === undefined &&
      this.state.editedValue[1] === undefined &&
      this.state.editedValue[2] === undefined &&
      this.state.editedValue[3] === undefined &&
      this.state.editedValue[4] === undefined
    ) {
      return undefined;
    }
    let combinedValue: ?number;
    if (
      this.state.editedValue[0] !== undefined ||
      this.state.editedValue[1] !== undefined ||
      this.state.editedValue[2] !== undefined ||
      this.state.editedValue[3] !== undefined
    ) {
      combinedValue = 0;
      let suffix: ?string;
      if (this.state.editedValue[1] !== undefined) {
        combinedValue += Number(this.state.editedValue[1]);
      }
      if (this.state.editedValue[2] !== undefined) {
        combinedValue += Number(this.state.editedValue[2]);
      }
      if (this.state.editedValue[3] !== undefined) {
        combinedValue += Number(this.state.editedValue[3]);
      }
      if (
        this.state.editedValue[0] === '-' ||
        (combinedValue !== 0 && this.props.range[1] <= 0)
      ) {
        combinedValue = -combinedValue;
      }
      if (combinedValue < this.props.range[0]) {
        combinedValue = this.props.range[0];
      } else if (combinedValue > this.props.range[1]) {
        combinedValue = this.props.range[1];
      }
    }
    let suffix: ?string;
    if (this.state.editedValue[4] !== undefined) {
      if (this.props.options) {
        const option: string = this.state.editedValue[4];
        if (this.props.options instanceof Array) {
          if (this.props.options.includes(option)) {
            return option;
          }
        } else {
          if (formatAllCodes(this.props.options).includes(option)) {
            return option;
          }
        }
      }
      if (
        this.props.suffix instanceof Array ||
        this.props.suffix.includes('Code')
      ) {
        suffix = this.state.editedValue[4];
        if (
          suffix === '\u2714' ||
          suffix === '\u2715' ||
          suffix === '\u2328' ||
          suffix === '\u27f3'
        ) {
          suffix = undefined;
        }
      }
    }
    const unit = (this.props.unit !== undefined) ? this.props.unit : '';
    if (suffix) {
      let formattedValue: string =
        combinedValue === undefined
          ? ''
          : this.props.decimals && this.props.decimals > 0
          ? Number(combinedValue).toFixed(this.props.decimals)
          : String(combinedValue);
      return formattedValue + unit + suffix;
    }
    return combinedValue + unit;
  }

  hasDecimalSteps(): boolean {
    if (this.props.stepSize instanceof Array) {
      return (
        this.props.stepSize.length > 0 &&
        this.props.stepSize[0] &&
        this.props.stepSize[0] < 1
      );
    }
    return this.props.stepSize && this.props.stepSize < 1;
  }

  splitValue(value: number | string, fractions: string[]): (?string)[] {
    const originalValue: number | string = value;
    if (value === undefined || value === null) {
      return [undefined, undefined, undefined, undefined, undefined];
    }
    //TODO check if value is an option
    //remove prefix
    if (this.props.prefix && this.props.prefix != '+') {
      if (value.startsWith && value.startsWith(this.props.prefix)) {
        value = value.substring(this.props.prefix.length);
      }
    }
    //parse suffix
    let suffix: ?string;
    if (
      this.props.suffix !== undefined &&
      value.toLowerCase &&
      fractions[4] !== undefined
    ) {
      for (let i: number = 0; i < fractions[4].length; i++) {
        if (value.toLowerCase().endsWith(fractions[4][i].toLowerCase())) {
          suffix = fractions[4][i];
          value = value.substring(0, value.length - suffix.length);
          if (value === '') {
            return [undefined, undefined, undefined, undefined, suffix];
          }
          value = parseFloat(value);
          if (isNaN(value)) {
            return [undefined, undefined, undefined, undefined, originalValue];
          }
          break;
        }
      }
    }
    if (value.toLowerCase) {
      value = parseFloat(value);
      if (isNaN(value)) {
        return [undefined, undefined, undefined, undefined, undefined];
      }
    }
    let sign: ?string =
      value < 0
        ? '-'
        : this.props.prefix != undefined && this.props.prefix.endsWith('+')
        ? '+'
        : undefined;
    value = Math.abs(value);
    let groupPart: number =
      this.props.groupSize != undefined && this.props.groupSize > 0
        ? this.props.groupSize * Math.floor(value / this.props.groupSize)
        : 0;
    let intPart: number = Math.floor(value - groupPart);
    let decimals: ?string =
      this.hasDecimalSteps() && suffix === undefined
        ? formatDecimals(value - groupPart - intPart, this.props.decimals)
        : undefined;
    const splittedValue: (?string)[] = [
      sign,
      this.props.groupSize != undefined &&
      this.props.groupSize > 0 &&
      groupPart > 0
        ? groupPart.toString()
        : undefined,
      intPart.toString(),
      decimals,
      suffix,
    ];
    return splittedValue;
  }

  clearValue = () => {
    const editedValue = this.state.fractions
      ? [undefined, undefined, undefined, undefined, undefined]
      : undefined;
    this.setState({editedValue, isDirty: true}, () => {
      this.commitEdit();
    });
  };

  updateValue(column: number, newColumnValue: string): void {
    if (this.state.fractions === undefined) {
      //keypad
      let editedValue = this.state.editedValue;
      if (editedValue === undefined || editedValue === null) {
        editedValue = newColumnValue.toString();
      } else {
        if (newColumnValue === '.') {
          if (!editedValue.includes('.')) {
            editedValue += '.';
          }
        } else if (newColumnValue === '-') {
          if (editedValue.startsWith('-')) {
            editedValue = editedValue.substring(1);
          } else {
            editedValue = newColumnValue + editedValue;
          }
        } else {
          editedValue += newColumnValue.toString();
        }
      }
      this.setState({editedValue, isDirty: true});
    } else {
      let editedValue: string[] = this.state.editedValue;
      let isSubmitColumn: boolean = false;
      //alert(this.props.decimals);
      if (
        this.props.suffix != undefined &&
        this.props.suffix instanceof String &&
        this.props.suffix.indexOf('code') == -1
      ) {
        // submit is the last column with extra options
        isSubmitColumn = column === 4;
      } else {
        let submitColumn: number;
        if (
          this.state.fractions[4].length >
          (this.props.freestyle === true ? 4 : 3)
        ) {
          submitColumn = 4;
        } else {
          if (this.props.decimals !== undefined && this.props.decimals > 0) {
            submitColumn = 3;
          } else {
            submitColumn = 2;
          }
        }
        isSubmitColumn = column >= submitColumn;
      }

      //((this.state.fractions[4].length>(this.props.freestyle===true?3:2)?3:2) + (this.props.decimals > 0 ? (this.state.fractions[4].length> 2? 0 : 1) : 0)) <= column;

      if (column >= 1 && newColumnValue === this.state.editedValue[column]) {
        newColumnValue = undefined;
      }
      editedValue[column] = newColumnValue;
      if (!isSubmitColumn) {
        //Clear following columns
        for (let i = column + 1; i < 5; i++) {
          editedValue[i] = undefined;
        }
      }
      this.setState({editedValue, isDirty: true}, () => {
        if (isSubmitColumn) {
          this.commitEdit();
        }
      });
    }
  }

  format(value: ?number | string): string {
    if (value === undefined || value === null) {
      return '';
    }
    if (value.toString().trim() === '') {
      return '';
    }

    if (value instanceof Array) {
      let formattedValue: string = '';
      value.forEach((subValue: number | string) => {
        formattedValue += subValue + ' / ';
      });
      if (!isEmpty(formattedValue)) {
        value = formattedValue.replace(/\/\s*$/, '');
      }
    }
    if (
      this.props.options instanceof Array &&
      this.props.options.includes(value)
    ) {
      return value;
    }
    if (isNaN(value)) {
      let formattedValue: string = value.toString();
      if (this.props.prefix && this.props.prefix != '+') {
        let freeType: boolean = false;
        for (let i = 0; i < formattedValue.length; i++) {
          const character: char = formattedValue.charAt(i);
          if ('0123456789.-+'.includes(character) === false) {
            freeType = true;
            break;
          }
        }
        if (!freeType) {
          formattedValue = this.props.prefix + formattedValue;
        }
      }
      return formattedValue;
    }

    let formattedValue: string =
      this.props.decimals != undefined && this.props.decimals > 0
        ? Number(value).toFixed(this.props.decimals)
        : String(value);
    if (formattedValue == '') {
      return '';
    }
    if (this.props.prefix) {
      if (this.props.prefix.endsWith('+')) {
        if (formattedValue.length > 0 && formattedValue[0] != '-') {
          formattedValue = this.props.prefix + formattedValue;
        } else {
          formattedValue =
            this.props.prefix.substring(0, this.props.prefix.length - 1) +
            formattedValue;
        }
      } else {
        formattedValue = this.props.prefix + formattedValue;
      }
    }
    if (
      this.props.suffix != undefined &&
      this.props.suffix instanceof Array === false &&
      this.props.suffix.includes('Code') === false
    ) {
      formattedValue = formattedValue + this.props.suffix;
    }
    return formattedValue;
  }

  generateFractions(props: any): string[][] {
    if (
      props.groupSize !== undefined &&
      props.groupSize !== 0 &&
      props.range[1] / props.groupSize > 40
    ) {
      return undefined;
    }
    let fractions: string[][] = [[], [], [], [], []];
    if (!props.range) {
      return fractions;
    }
    //sign + -
    if (props.range[0] < 0) {
      if (props.range[1] <= 0) {
        fractions[0].push('-');
      } else {
        fractions[0].push('+', '-');
      }
    }
    //integer group
    if (
      props.groupSize != undefined &&
      props.groupSize > 1 &&
      (props.range[0] < -props.groupSize || props.range[1] > props.groupSize)
    ) {
      let minGroup: number = Math.abs(props.range[0]);
      let maxGroup: number = Math.abs(props.range[1]);
      if (minGroup > maxGroup) {
        let c = maxGroup;
        maxGroup = minGroup;
        minGroup = c;
      }
      if (props.range[0] < 0 && props.range[1] > 0) {
        minGroup = 0;
      }
      minGroup = minGroup - (minGroup % props.groupSize);
      if (minGroup < props.groupSize) {
        minGroup = props.groupSize;
      }

      for (let i = minGroup; i <= maxGroup; i += props.groupSize) {
        fractions[1].push(String(i));
      }
    }
    //integer
    let minInt: number = 0;
    if (props.range[0] < 0 && props.range[1] > 0) {
      //Range includes 0
      minInt = 0;
    } else {
      //All positive or All negative range
      if (props.groupSize > 1) {
        //Grouped range
        if (props.range[0] >= 0) {
          //Only positive range
          if (props.groupSize > props.range[1]) {
            //Unused group size
            minInt = props.range[0];
          }
        } else {
          //Only negative range
          if (props.groupSize > -props.range[0]) {
            //Unused group size
            minInt = -props.range[1];
          }
        }
      } else {
        //All positive or negative with no group
        if (props.range[0] >= 0) {
          //Only positive range
          minInt = props.range[0];
        } else {
          //Only negative range
          minInt = -props.range[1];
        }
      }
    }
    let maxInt: number =
      props.groupSize > 1
        ? Math.min(
            Math.max(Math.abs(props.range[0]), Math.abs(props.range[1])),
            props.groupSize - 1,
          )
        : props.range[1];
    if (this.props.stepSize instanceof Array) {
      let c = 0;
      for (let i = minInt; i <= maxInt; c++) {
        fractions[2].push(String(i));
        let stepSize =
          this.props.stepSize[Math.min(this.props.stepSize.length - 1, c)];
        i = i + Math.max(1, stepSize);
      }
    } else {
      for (let i = minInt; i <= maxInt; ) {
        fractions[2].push(String(i));
        i = i + Math.max(1, this.props.stepSize);
      }
    }
    //decimals .25
    if (
      props.decimals != undefined &&
      props.decimals > 0 &&
      this.hasDecimalSteps()
    ) {
      for (let i = 0; i < 1; i += props.stepSize) {
        let formattedDecimals =
          props.decimals && props.decimals > 1
            ? Number(i).toFixed(props.decimals)
            : String(i);
        formattedDecimals = Number(
          Math.round(formattedDecimals + 'e' + props.decimals) +
            'e-' +
            props.decimals,
        );
        if (formattedDecimals >= 1) {
          continue;
        }
        formattedDecimals = formattedDecimals
          .toFixed(props.decimals)
          .toString();

        fractions[3].push(
          formattedDecimals.length > 1
            ? formattedDecimals.substring(1)
            : formattedDecimals,
        );
      }
    }
    
    //Update Button
    //fractions[4].push('\u2714');
    //Clear Button
    fractions[4].push('\u2715');
    //Refresh Button
    fractions[4].push('\u27f3');
    //Keyboard Button
    if (this.props.freestyle === true) {
      fractions[4].push('\u2328');
    }
    //Options
    if (props.options) {
      if (props.options instanceof Array) {
        for (var i = 0; i < props.options.length; i++) {
          fractions[4].push(formatCodeDefinition(props.options[i]));
        }
      } else {
        fractions[4].push(...formatAllCodes(props.options));
      }
    }
    //Suffix
    if (props.suffix != undefined) {
      if (props.suffix instanceof Array) {
        fractions[4].push(...props.suffix);
      } else if (props.suffix.includes('Code')) {
        fractions[4].push(...formatAllCodes(props.suffix));
      }
    }
    return fractions;
  }

  renderPopup() {
    const formattedValue = this.format(
      this.state.isDirty ? this.combinedValue() : this.props.value,
    );
    const isKeypad: boolean = this.state.fractions === undefined;
    const fractions: any[][] = !isKeypad
      ? this.state.fractions
      : [
          [7, 4, 1, '-'],
          [8, 5, 2, 0],
          [9, 6, 3, '.'],
          this.props.freestyle === true
            ? ['\u2715', '\u27f3', '\u2328']
            : ['\u2715', '\u27f3'],
        ]; //TODO: localize
    const columnStyle = this.state.fractions
      ? styles.modalColumn
      : styles.modalKeypadColumn;
    return (
      <TouchableWithoutFeedback
        onPress={this.commitEdit}
        accessible={false}
        testID={'popupBackground'}>
        <View style={styles.popupBackground}>
          <ScrollView scrollEnabled={true}>
            <Text style={styles.modalTitle}>
              {this.props.label}: {formattedValue}
            </Text>
            <View style={styles.flexColumnLayout}>
              <View style={styles.centeredRowLayout}>
                {fractions.map((options: string[], column: number) => {
                  return (
                    <View style={columnStyle} key={column}>
                      {options.map((option: string, row: number) => {
                        let isSelected: boolean =
                          isKeypad === false &&
                          this.state.editedValue[column] === option;
                        if (option === '\u2328') {
                          return (
                            <KeyboardTile
                              commitEdit={this.startTyping}
                              key={row}
                            />
                          );
                        }
                        if (option === '\u2714') {
                          return (
                            <UpdateTile
                              commitEdit={this.commitEdit}
                              key={row}
                            />
                          );
                        }
                        if (option === '\u2715') {
                          return (
                            <ClearTile commitEdit={this.clearValue} key={row} />
                          );
                        }
                        if (option === '\u27f3') {
                          return (
                            <RefreshTile
                              commitEdit={this.cancelEdit}
                              key={row}
                            />
                          );
                        }
                        return (
                          <TouchableOpacity
                            key={row}
                            onPress={() => this.updateValue(column, option)}
                            testID={'option' + (column + 1) + '-' + (row + 1)}>
                            <View
                              style={
                                isSelected
                                  ? styles.popupTileSelected
                                  : styles.popupTile
                              }>
                              <Text
                                style={
                                  isSelected
                                    ? styles.modalTileLabelSelected
                                    : styles.modalTileLabel
                                }>
                                {option}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  render() {
    let style = this.props.style
      ? this.props.style
      : this.state.isActive
      ? styles.inputFieldActive
      : styles.inputField;
    if (this.props.width) {
      style = [{width: this.props.width}, style];
    }
    const formattedValue: string = this.format(this.props.value);
    if (this.props.readonly) {
      return (
        <View style={styles.fieldFlexContainer} testID={this.props?.testID + '.ReadOnly'}>
          <Text style={style}>{formattedValue}</Text>
        </View>
      );
    }
    if (this.state.isTyping) {
      // const formattedValue: string = this.props.value? this.props.value.toString() : '';
      return (
        <TextField
          value={formattedValue}
          ref="field"
          testID={this.props?.testID}
          autoFocus={this.props.autoFocus || this.props.isTyping !== true}
          style={style}
          selectTextOnFocus={true} //TODO why is this not working?
          onChangeValue={(newValue) => this.commitTyping(newValue)}
          onOpenModal={this.openModal}
          title={this.props.label}
          onBlur={this.props.onBlur}
        />
      );
    } else if (this.props.listField) {
      return (
        <ListField
          label={this.props.label}
          style={this.props.style}
          readonly={this.props.readonly}
          freestyle={this.props.freestyle}
          options={this.props.options}
          value={formattedValue}
          onChangeValue={this.commitTyping}
          prefix={this.props.prefix}
          suffix={this.props.suffix}
          simpleSelect={true}
          popupStyle={styles.alignPopup}
          testID={this.props.testID}
        />
      );
    }
    return (
      <View style={styles.fieldFlexContainer}>
        <TouchableOpacity
          style={styles.fieldFlexContainer}
          onPress={this.startEditing}
          disabled={this.props.readonly}
          testID={this.props.testID}>
          <Text style={style}>{formattedValue}</Text>
        </TouchableOpacity>
        {this.state.isActive === true && (
          <Modal
            visible={this.state.isActive === true}
            transparent={true}
            animationType={'slide'}
            onRequestClose={this.cancelEdit}>
            {this.renderPopup()}
          </Modal>
        )}
      </View>
    );
  }
}
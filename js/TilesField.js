import React, { Component } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { TextField, ClearTile, KeyboardTile, UpdateTile, RefreshTile, FocusTile } from './Widgets';
import { styles } from './Styles';
import { postfix, split } from './Util';
import { CustomModal as Modal } from './utilities/Modal';

export class TilesField extends Component {
  props: {
    value?: ?(string[]) | ?string,
    label?: string,
    prefix?: ?(string[]) | ?string,
    suffix?: ?(string[]) | ?string,
    options: (string[] | string)[],
    combineOptions?: boolean,
    freestyle?: boolean,
    multiline?: boolean,
    width?: number,
    readonly?: boolean,
    style?: any,
    multiValue?: boolean, //TODO
    containerStyle?: any,
    onChangeValue?: (newvalue: ?(string[] | string)) => void,
    transferFocus?: {
      previousField: string,
      nextField: string,
      onTransferFocus: (field: string) => void,
    },
    testID?: string,
    isTyping?: boolean,
    isPrism?: Boolean,
  };
  state: {
    isActive: boolean,
    isTyping: boolean,
    editedValue?: string[] | string,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      isActive: false,
      isTyping: props.isTyping,
      editedValue: undefined,
    };
  }
  componentDidUpdate(prevProps: any) {
    if (this.props.isTyping === prevProps.isTyping) {
      return;
    }
    this.setState({
      isTyping: this.props.isTyping,
    });
  }
  startTyping = () => {
    if (this.props.readonly) {
      return;
    }
    this.setState({isActive: false, isTyping: true});
  };

  commitTyping = (newValue: string) => {
    this.setState({editedValue: newValue}, this.commitEdit);
  };

  startEditing = () => {
    if (this.props.readonly) {
      return;
    }
    this.setState({
      isActive: true,
      editedValue: this.props.combineOptions
        ? split(this.props.value, this.props.options)
        : this.props.value,
    });
  };

  isMultiColumn(): boolean {
    return (
      this.props.options != undefined && this.props.options[0] instanceof Array
    );
  }

  getEditedColumnValue(columnIndex: number): ?string {
    if (this.isMultiColumn()) {
      if (
        this.state.editedValue === undefined ||
        this.state.editedValue.length <= columnIndex
      ) {
        return undefined;
      }
      return this.state.editedValue[columnIndex];
    }
    return this.state.editedValue;
  }

  updateValue(newValue?: string, columnIndex: number): void {
    let editedColumnValue: ?string = this.getEditedColumnValue(columnIndex);
    if (newValue === editedColumnValue) {
      newValue = undefined;
    }
    if (this.isMultiColumn()) {
      let editedValue: (?string)[] = this.state.editedValue;
      if (editedValue instanceof Array === false) {
        editedValue = this.props.options.map((option) => undefined);
      }
      while (editedValue.length <= columnIndex) {
        editedValue.push(undefined);
      }
      editedValue[columnIndex] = newValue;
      if (this.updateConfirm()) {
        this.setState({editedValue});
      } else {
        this.setState({editedValue}, this.commitEdit);
      }
    } else {
      if (this.updateConfirm()) {
        this.setState({editedValue: newValue});
      } else {
        this.setState({editedValue: newValue}, this.commitEdit);
      }
    }
  }

  commitEdit = (nextFocusField?: string) => {
    let combinedValue =
      this.props.combineOptions != undefined &&
      this.state.editedValue instanceof Array
        ? this.format(this.state.editedValue)
        : this.state.editedValue;
    if (this.props.onChangeValue) {
      this.props.onChangeValue(combinedValue);
    }
    this.setState({isActive: false, isTyping: this.props.isTyping});
    if (nextFocusField != undefined && this.props.transferFocus) {
      this.props.transferFocus.onTransferFocus(nextFocusField);
    }
  };

  cancelEdit = () => {
    this.setState({isActive: false, editedValue: undefined, isTyping: this.props.isTyping});
  };

  clear = () => {
    let clearedValue;
    if (this.state.editedValue instanceof Array) {
      clearedValue = this.state.editedValue.map((columnValue) => undefined);
    }
    this.setState({editedValue: clearedValue}, () => this.commitEdit());
  };

  sumArray(arr: any[]) : number {
    return arr.reduce((a, b) => {
      let rightIndex = (a === undefined) ? 0 : Number(a);
      let leftIndex = (b === undefined) ? 0 : Number(b);
      return rightIndex + leftIndex;
    });
  }

  format(value: ?string | ?(string[])): string {
    if (value === undefined || value === null || value === '') {
      return '';
    }
    let formattedValue: string = '';
    if (this.props.isPrism && value instanceof Array && value.length === 8) {
      let prismSumA : number= this.sumArray([value[0], value[1], value[2]]);
      let suffixA : string= value[3] !== undefined ? `${value[3]} ` : '';
      let prismSumB : number = this.sumArray([value[4], value[5], value[6]]);
      let suffixB : string= value[7] !== undefined ? value[7] : '';

      formattedValue = `${(prismSumA === 0) ? '' : prismSumA} ${suffixA}${(prismSumB === 0) ? '' : prismSumB} ${suffixB}`;
    } else if (value instanceof Array) {
      value.forEach((columnValue: ?string, columnIndex: number) => {
        if (columnValue !== undefined) {
          if (
            this.props.prefix !== undefined &&
            this.props.prefix !== null &&
            this.props.prefix.length > columnIndex &&
            this.props.prefix[columnIndex] !== undefined
          ) {
            formattedValue += this.props.prefix[columnIndex];
          }
          if (columnValue !== undefined && columnValue !== null) {
            formattedValue += columnValue;
          }
          if (
            this.props.suffix !== undefined &&
            this.props.suffix !== null &&
            this.props.suffix.length > columnIndex &&
            this.props.suffix[columnIndex] !== undefined
          ) {
            formattedValue += this.props.suffix[columnIndex];
          }
        }
      });
    } else {
      if (this.props.prefix != undefined && !this.isMultiColumn()) {
        formattedValue += this.props.prefix;
      }
      if (value !== undefined && value !== null) {
        formattedValue += value.toString();
      }
      if (this.props.suffix != undefined && !this.isMultiColumn()) {
        formattedValue += this.props.suffix;
      }
    }
    return formattedValue;
  }

  updateConfirm(): boolean {
    return this.props.transferFocus !== undefined || this.isMultiColumn();
  }

  renderPopup() {
    let allOptions: string[][] = this.isMultiColumn()
      ? this.props.options
      : [this.props.options];
    return (
      <TouchableWithoutFeedback
        onPress={this.commitEdit}
        accessible={false}
        testID="popupBackground">
        <View style={styles.popupBackground}>
          <ScrollView horizontal={false}>
            <Text style={styles.modalTitle}>
              {postfix(this.props.label, ': ')}
              {this.format(this.state.editedValue)}
            </Text>
            <FocusTile
              type="previous"
              commitEdit={this.commitEdit}
              transferFocus={this.props.transferFocus}
            />
            <FocusTile
              type="next"
              commitEdit={this.commitEdit}
              transferFocus={this.props.transferFocus}
            />
            <ScrollView horizontal={allOptions.length > 3}>
              <Pressable onPress={this.commitEdit} >
              <View style={styles.flexColumnLayout}>
                <View style={styles.centeredRowLayout}>
                  {allOptions.map((options: string[], columnIndex: number) => (
                    <View style={styles.modalColumn} key={columnIndex}>
                      {options.map((option: string, rowIndex: number) => {
                        let isSelected: boolean = this.isMultiColumn()
                          ? this.state.editedValue[columnIndex] === option
                          : this.state.editedValue === option;
                        return (
                          <TouchableOpacity
                            key={rowIndex}
                            onPress={() => this.updateValue(option, columnIndex)}
                            testID={
                              'option' +
                              (this.isMultiColumn()
                                ? columnIndex + 1 + ',' + (rowIndex + 1)
                                : rowIndex + 1)
                            }>
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
                      {allOptions.length === 1 && !this.props.hideClear && (
                        <ClearTile commitEdit={this.clear} />
                      )}
                      {allOptions.length === 1 &&
                        this.props.freestyle === true && (
                          <KeyboardTile commitEdit={this.startTyping} />
                        )}
                    </View>
                  ))}
                  {allOptions.length > 1 && !this.props.hideClear && (
                    <View style={styles.modalColumn}>
                      <UpdateTile commitEdit={this.commitEdit} />
                      <ClearTile commitEdit={this.clear} />
                      <RefreshTile commitEdit={this.cancelEdit} />
                      {this.props.freestyle === true && (
                        <KeyboardTile commitEdit={this.startTyping} />
                      )}
                    </View>
                  )}
                </View>
              </View>
              </Pressable>
            </ScrollView>
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
    if (this.state.isTyping) {
      return (
        <TextField
          value={this.props.value}
          autoFocus={false}
          style={style}
          multiline={this.props.multiline}
          onChangeValue={(newValue) => this.commitTyping(newValue)}
          testID={
            this.props.testID ? this.props.testID + 'ActiveField' : undefined
          }
          title={this.props.label}
        />
      );
    }
    return (
      <View
        style={
          this.props.containerStyle
            ? this.props.containerStyle
            : styles.fieldFlexContainer
        }>
        <TouchableOpacity
          style={
            this.props.containerStyle
              ? this.props.containerStyle
              : styles.fieldFlexContainer
          }
          onPress={this.startEditing}
          disabled={this.props.readonly}
          testID={this.props.testID ? this.props.testID + 'Field' : undefined}>
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
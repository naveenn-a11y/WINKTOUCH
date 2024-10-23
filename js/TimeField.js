import React, {Component} from 'react';
import {ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';
import {TextField, ClearTile, KeyboardTile, UpdateTile, RefreshTile} from './Widgets';
import {strings} from './Strings';
import {styles} from './Styles';
import {formatDate, formatHour, formatTime, now, time24Format} from './Util';
import {CustomModal as Modal} from './utilities/Modal';
import {
  generateFractions,
  combinedValue,
  splitValue,
  convertTime,
  convertTo24HourTime,
  convertToAMPMTime,
  processTimeString,
} from './TimeFieldHelpers';

export class TimeField extends Component {
  props: {
    value: string, //Time should always be in 24h format 23:05
    label: string,
    readonly?: boolean,
    past?: boolean,
    future?: boolean,
    isTyping?: boolean,
    onBlur?: () => void,
  };
  state: {
    isActive: boolean,
    isDirty: boolean,
    fractions: string[][],
    editedValue: (?string)[],
    isTyping: boolean,
  };
  static defaultProps = {
    readonly: false,
    past: false,
    future: false,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      editedValue: [],
      isActive: false,
      fractions: this.generateFractions(),
      isDirty: false,
      isTyping: props.isTyping,
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

  commitTyping = (newValue: string) => {
    const formattedTime = parseTime24Format(newValue);
    this.setState({
      editedValue: (formattedTime === 'Invalid date') ? [] : this.splitValue(formattedTime) 
    }, 
      this.commitEdit
    );
  };

  startTyping = () => {
    if (this.props.readonly) {
      return;
    }
    this.setState({isActive: false, isTyping: true});
  };

  startEditing = () => {
    if (this.props.readonly) {
      return;
    }
    this.setState({
      editedValue: this.splitValue(this.props.value),
      isActive: true,
      isDirty: false,
    });
  };

  commitEdit = () => {
    const editedValue: ?Date = this.combinedValue();
    if (this.props.onChangeValue) {
      this.props.onChangeValue(editedValue);
    }
    this.setState({isActive: false, isTyping: this.props.isTyping});
  };

  commitNow = (offset?: ?string) => {
    let time: Date = now();
    if (
      offset !== undefined &&
      offset != null &&
      offset != 0 &&
      offset != '0'
    ) {
      let minutes: number = parseInt(offset.substring(0, offset.indexOf(' ')));
      time.setMinutes(time.getMinutes() + minutes);
    }
    const editedValue: string = formatDate(time, time24Format);
    if (this.props.onChangeValue) {
      this.props.onChangeValue(editedValue);
    }
    this.setState({isActive: false});
  };

  cancelEdit = () => {
    this.setState({isActive: false, isTyping: this.props.isTyping});
  };

  clear = () => {
    if (this.props.onChangeValue) {
      this.props.onChangeValue(undefined);
    }
    this.setState({isActive: false});
  };

  format(time24: ?string): string {
    return formatTime(time24);
  }

  generateFractions(): string[][] {
    return [
      ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00'],
      ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
      [':00', ':10', ':20', ':30', ':40', ':50'],
      [':05', ':15', ':25', ':35', ':45', ':55'],
      this.props.past
        ? this.props.future
          ? [
              '+15 min',
              '+10 min',
              '+5 min',
              '+1 min',
              '-1 min',
              '-5 min',
              '-10 min',
              '-15 min',
            ]
          : ['-1 min', '-5 min', '-10 min', '-15 min', '-30 min']
        : ['+1 min', '+5 min', '+10 min', '+15 min', '+30 min'],
    ];
  }

  splitValue(value: string): (?string)[] {
    if (!value || value.length < 5) {
      return [];
    }
    const time24: string = value;
    const hour: string = time24.substring(0, 2) + ':00';
    let hour1, hour2, minute1, minute2: ?string;
    if (this.state.fractions[0].indexOf(hour) >= 0) {
      hour1 = hour;
      hour2 = undefined;
    } else {
      hour1 = undefined;
      hour2 = hour;
    }
    const minute: string = ':' + time24.substring(3, 5);
    if (this.state.fractions[2].indexOf(minute) >= 0) {
      minute1 = minute;
      minute2 = undefined;
    } else {
      minute1 = undefined;
      minute2 = minute;
    }
    return [hour1, hour2, minute1, minute2, undefined];
  }

  combinedValue(): string {
    const editedValue = this.state.editedValue;
    //validate for freetyping
    if (typeof editedValue === 'string') {
      const formattedTime = parseTime24Format(editedValue);
      return formattedTime === 'Invalid date' ? undefined : `${formattedTime.substring(0,2)}${formattedTime.substring(3,5)}`;
    }

    let hour: ?string =
      this.state.editedValue[0] === undefined
        ? this.state.editedValue[1]
        : this.state.editedValue[0];
    if (hour === undefined) {
      return undefined;
    }
    hour = hour.substring(0, 2);
    const minute: ?string =
      this.state.editedValue[2] === undefined
        ? this.state.editedValue[3]
        : this.state.editedValue[2];
    return hour + minute;
  }

  updateValue(column: number, newColumnValue: ?string): void {
    let editedValue: (?string)[] = this.state.editedValue;
    if (newColumnValue === this.state.editedValue[column]) {
      newColumnValue = undefined;
    }
    editedValue[column] = newColumnValue;
    if (column === 0) {
      editedValue[1] = undefined;
    }
    if (column === 1) {
      editedValue[0] = undefined;
    }
    if (column === 2) {
      editedValue[3] = undefined;
    }
    if (column === 3) {
      editedValue[2] = undefined;
    }
    if (column === 4) {
      this.commitNow(newColumnValue);
    } else {
      this.setState({editedValue, isDirty: true});
    }
  }

  renderPopup(): Component {
    const fractions: string[][] = this.state.fractions;
    let formattedValue = this.format(
      this.state.isDirty ? this.combinedValue() : this.props.value,
    );
    return (
      <TouchableWithoutFeedback onPress={this.commitEdit}>
        <View style={styles.popupBackground}>
          <ScrollView horizontal={false}>
            <Text style={styles.modalTitle}>
              {this.props.label}: {formattedValue}
            </Text>
            <ScrollView horizontal={true} scrollEnabled={true}>
              <View style={styles.centeredRowLayout}>
                {fractions.map((options: string[], column: number) => {
                  return (
                    <View style={styles.modalColumn} key={column}>
                      {options.map((option: string, row: number) => {
                        const formattedOption: string =
                          column < 2 ? formatHour(option) : option;
                        let isSelected: boolean =
                          this.state.editedValue[column] === option;
                        return (
                          <TouchableOpacity
                            key={row}
                            onPress={() => this.updateValue(column, option)}>
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
                                {formattedOption}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
                <View style={styles.modalColumn}>
                  {this.props.future !== true && (
                    <TouchableOpacity onPress={() => this.commitNow(0)}>
                      <View style={styles.popupTile}>
                        <Text style={styles.modalTileLabel}>{strings.now}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  <UpdateTile commitEdit={this.commitEdit} />
                  <ClearTile commitEdit={this.clear} />
                  <RefreshTile commitEdit={this.cancelEdit} />
                  <KeyboardTile commitEdit={this.startTyping} />
                </View>
              </View>
            </ScrollView>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  render() {
    const style = this.props.style ? this.props.style : styles.formField;
    const formattedValue: string = this.format(this.props.value);
    if (this.props.readonly) {
      return (
        <View style={styles.fieldFlexContainer}>
          <Text style={style}>
            {this.props.prefix}
            {formattedValue}
            {this.props.suffix}
          </Text>
        </View>
      );
    }
    if (this.state.isTyping) {
      return (
        <TextField
          testID={this.props?.testID}
          prefix={this.props.prefix}
          value={formattedValue}
          suffix={this.props.suffix}
          autoFocus={false}
          style={style}
          onChangeValue={(newValue) => this.commitTyping(newValue)}
          title={this.props.label}
          onBlur={this.props.onBlur}
        />
      );
    }
    return (
      <View style={styles.fieldFlexContainer}>
        <TouchableOpacity
          style={styles.fieldFlexContainer}
          onPress={this.startEditing}
          disabled={this.props.readonly}>
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
/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, Image, LayoutAnimation, Button, TouchableHighlight, ScrollView } from 'react-native';
import { styles, fontScale } from './Styles';

class ScrollField<T> extends Component {
  props: {
    value: T,
    prefix?: string,
    scrollMethod?: string,
    width?: number,
    onChangeValue: (newvalue: T) => void
  }
  state: {
    centerXOffset: number,
    isActive: boolean,
    value: any
  }
  constructor(props: any) {
    super(props);
    this.state = {
      value: props.value,
      isActive: false,
      centerXOffset: 0
    }
  }

  calculateOffsetSteps(event: any): number {
    let offsetPixels: number = event.nativeEvent.locationX - this.state.centerXOffset;
    if (Math.abs(offsetPixels) < this.state.centerXOffset)
      return 0;
    if (offsetPixels > 0)
      offsetPixels = offsetPixels - this.state.centerXOffset;
    else
      offsetPixels = offsetPixels + this.state.centerXOffset;
    let scale = 1 / (60 * fontScale);
    if (this.props.scrollMethod === 'quadratic') {
      scale = scale * Math.abs(offsetPixels) / 100;
      if (scale > 0.08) scale = 0.08;
    }
    let offsetSteps: number = Math.round(offsetPixels * scale);
    offsetSteps += (offsetPixels > 0) ? 1 : -1;
    return offsetSteps;
  }

  onLayout(event: any) {
    this.setState({ centerXOffset: event.nativeEvent.layout.width / 2 });
  }

  startEditing() {
    LayoutAnimation.easeInEaseOut();
    this.setState({ isActive: true })
  }

  commitValue() {
    LayoutAnimation.easeInEaseOut();
    this.setState({ isActive: false });
    if (this.props.onChangeValue)
      this.props.onChangeValue(this.state.value);
  }

  updateValue(event: any) { }

  format(value: any): string {
    if (value === null || value === undefined) return ' ';
    return String(value);
  }

  render() {
    let style = this.state.isActive ? (this.state.value !== this.props.value ? styles.scrollFieldActiveChanged : styles.scrollFieldActive) : styles.scrollField;
    if (this.props.width) {
      style = [{ width: 300 }, style];
    }
    const formattedValue = this.format(this.state.value);
    return <Text onStartShouldSetResponder={(event) => true}
      onResponderGrant={(event) => this.startEditing()}
      onResponderReject={(event) => this.setState({ isActive: false })}
      onMoveShouldSetResponder={(event) => false}
      onResponderTerminationRequest={(event) => false}
      onResponderMove={(event) => this.updateValue(event)}
      onResponderRelease={(event) => this.commitValue()}
      onResponderTerminate={(event) => this.setState({ isActive: false })}
      onLayout={(event) => this.onLayout(event)}
      style={style}
      >{this.state.isActive ? '' : this.props.prefix}{formattedValue}</Text>
  }
}

export class NumberScrollField extends ScrollField<number> {
  props: {
    value: number,
    minValue: number,
    maxValue: number,
    stepSize: number,
    prefix?: string,
    decimals?: number,
    onChangeValue: (newvalue: number) => void
  }
  state: {
    centerOffset: number,
    isActive: boolean,
    value: number
  }
  constructor(props: any) {
    super(props);
  }

  format(value: number): string {
    return this.props.decimals ? value.toFixed(this.props.decimals) : String(value);
  }

  updateValue(event: any) {
    const offsetSteps: number = this.calculateOffsetSteps(event);
    const offset: number = offsetSteps * this.props.stepSize;
    let newValue: number = this.props.value + offset;
    newValue = Math.min(newValue, this.props.maxValue);
    newValue = Math.max(newValue, this.props.minValue);
    this.setState({ value: newValue });
  }
}

export class OptionWheel extends ScrollField<string> {
  props: {
    value: string,
    options: string[],
    prefix?: string,
    width?: number,
    onChangeValue: (newvalue: number) => void
  }
  state: {
    value: string,
    centerOffset: number,
    isActive: boolean,
  }
  optionIndex: number;
  constructor(props: any) {
    super(props);
    this.optionIndex = this.props.options.indexOf(this.props.value);
  }

  updateValue(event: any) {
    const offsetSteps: number = this.calculateOffsetSteps(event);
    let newIndex: number = this.optionIndex + offsetSteps;
    newIndex = newIndex % (this.props.options.length);
    if (newIndex < 0) newIndex = newIndex + this.props.options.length;
    this.setState({
      optionIndex: newIndex,
      value: this.props.options[newIndex]
    });
  }
}

export class Clock extends Component {
  props: {
    hidden?: boolean
  }
  render() {
    if (this.props.hidden)
      return null;
    return <Image source={require('./clock.png')} style={{
      width: 140 * fontScale,
      height: 140 * fontScale,
      resizeMode: 'contain',
    }} />
  }
}

export class WinkButton extends Component {
  props: {
    title: string,
    onPress?: () => void
  }
  render() {
    return <Button {...this.props} />
  }
}

export class SelectionListRow extends Component {
  props: {
    label: string,
    selected: boolean,
    onSelect: (select: boolean) => void
  }

  toggleSelect() {
    this.props.onSelect(!this.props.selected);
  }

  render() {
    const textStyle = this.props.selected ? styles.tabTextSelected : styles.tabText;
    return <TouchableHighlight underlayColor='#bbbbffbb' onPress={() => this.toggleSelect()}>
      <View style={styles.listRow}>
        <Text style={textStyle}>{this.props.label}</Text>
      </View>
    </TouchableHighlight>
  }
}


export class SelectionList extends Component {
  props: {
    label: string,
    items: string[],
    selection?: string | string[],
    required?: boolean,
    multiValue?: boolean,
    onUpdateSelection: (selection: string[] | string) => void
  }
  defaultProps: {
    selection: undefined,
    required: false,
    multiValue: false
  }
  constructor(props: any) {
    super(props);
  }

  select(item: string, select: boolean) {
    if (this.props.multiValue) {
      let selection: ?string[] = this.props.selection ? this.props.selection : [];
      const index = selection.indexOf(item);
      if (index === -1) {
        if (select) {
          selection.push(item);
        }
      } else {
        if (!select) {
          selection.splice(index, 1);
        }
      }
      this.props.onUpdateSelection(selection);
    } else {
      let selection: ?string = undefined;
      if (select) {
        selection = item;
      }
      this.props.onUpdateSelection(selection);
    }

  }

  isSelected(item: string): boolean {
    if (!this.props.selection)
      return false;
    const index = this.props.selection.indexOf(item);
    return (index > -1);
  }

  hasSelection(): boolean {
    if (this.props.multiValue) {
      return this.props.selection && this.props.selection.length > 0;
    }
    return this.props.selection !== undefined;
  }

  render() {
    let style: string = this.props.required && !this.hasSelection() ? styles.boardTodo : styles.board;
    return <View style={style}>
      <Text style={styles.screenTitle}>{this.props.label}</Text>
      <ScrollView>
        {this.props.items.map((item: string, index: number) => {
          let isSelected = this.isSelected(item);
          return <SelectionListRow key={index} label={item}
            selected={isSelected} onSelect={(select: boolean) => this.select(item, select)} />
        })}
      </ScrollView>
    </View >
  }
}

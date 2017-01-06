/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, Image, LayoutAnimation, Button, TouchableHighlight, ScrollView } from 'react-native';
import { styles, fontScale, selectionColor } from './Styles';
import { FormRow, FormTextInput } from './Form';
import { ComplaintDetails } from './Complaint'

export type ItemDefinition = {
  [id: string]: {
    label: string,
    options?: string[],
    normalValue?: string,
    required?: boolean
  }
};

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
    return <TouchableHighlight underlayColor={selectionColor} onPress={() => this.toggleSelect()}>
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
    if (this.props.selection instanceof Array) {
      const index = this.props.selection.indexOf(item);
      return (index > -1);
    }
    return (this.props.selection === item);
  }

  hasSelection(): boolean {
    if (this.props.multiValue) {
      return (this.props.selection instanceof Array) && this.props.selection.length > 0;
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

function constructItemView(itemView: string, item: any, itemDefinition: ItemDefinition, isSelected: boolean, onUpdateItem?: (propertyName: string, value: any) => void, orientation: string) {
  switch (itemView) {
    case 'ComplaintDetails':
      return <ComplaintDetails complaint={item} />
    case 'EditableItem':
      return <View style={{flex: 10}}>
        <EditableItem item={item} itemDefinition={itemDefinition} isSelected={isSelected} onUpdateItem={onUpdateItem} orientation={orientation}/>
      </View>
  }
  return <View style={isSelected?styles.listRowSelected:styles.listRow}>
    <ItemSummary item={item} orientation={orientation} itemDefinition={itemDefinition} />
  </View>

}

class ItemSummary<ItemType> extends Component {
  props: {
    item: ItemType,
    itemDefinition: ItemDefinition,
    orientation?: string
  }
  constructor(props: any) {
    super(props);
  }

  render() {
    const propertyNames: string[] = Object.keys(this.props.itemDefinition);
    if (this.props.orientation !== 'horizontal') {
      let description = '';
      let isFirstField = true;
      for (let i: number = 0; i < propertyNames.length; i++) {
        const value = this.props.item[propertyNames[i]];
        if (value && value.length > 0) {
          let formattedValue: string = String(value);
          if (formattedValue && formattedValue !== '') {
            if (!isFirstField)
              description += ', ';
            description += formattedValue;
            isFirstField = false;
          }
        }
      }
      return <Text>{description}</Text>
    }
    return <View>
      <Text>{this.props.item[propertyNames[0]]}</Text>
      <Text>{this.props.item[propertyNames[1]]}</Text>
      <Text>TODO</Text>
    </View>
  }
}

class EditableItem<ItemType> extends Component {
  props: {
    item: ItemType,
    itemDefinition: ItemDefinition,
    isSelected: boolean,
    orientation?: string,
    onUpdateItem: (propertyName: string, value: any) => void
  }

  format(value: string[] | string): string {
    if (!value)
      return '';
    if (value instanceof Array) {
      const values: string[] = value;
      if (values.length === 0)
        return '';
      let formattedText: string = values[0];
      for (var i = 1; i < values.length; i++) {
        formattedText = formattedText + ', ' + values[i];
      }
      return formattedText;
    }
    return value;
  }

  render() {
    const propertyNames: string[] = Object.keys(this.props.itemDefinition);
    let isAllNormal: boolean = true;
    let haveToAskLabels: string[] = [];
    let style = 'horizontal'===this.props.orientation ? styles.flow : styles.form;
    if (this.props.isSelected)
      style = [style, {backgroundColor: selectionColor}];
    return <View style={style}>
      {(this.props.item.label) ? <Text style={styles.screenTitle}>{this.props.item.label}</Text> : null}
      {propertyNames.map((propertyName: string, index: number) => {
        const propertyDefinition = this.props.itemDefinition[propertyName];
        let description: string = this.format(this.props.item[propertyName]);
        if (!description && propertyDefinition.required) {
          haveToAskLabels.push(propertyDefinition.label);
          isAllNormal = false;
        }
        if (!description || (propertyDefinition.normalValue && propertyDefinition.normalValue === description))
          return null;
        isAllNormal = false;
        const propertyField = <FormTextInput key={index} label={propertyDefinition.label} value={description}
          onChangeText={(text: string) => this.props.onUpdateItem(propertyName, text.split(', '))} />
        if ('horizontal'===this.props.orientation )
          return propertyField;
        return <FormRow key={index}>
          {propertyField}
        </FormRow>
      })
      }
      {isAllNormal?
          <Text style={styles.textfield}>All normal</Text>:null
      }
      {haveToAskLabels.length > 0 ?
        <FormRow>
          <FormTextInput label={'Should ask'} value={this.format(haveToAskLabels)} readOnly={true} />
        </FormRow> : null
      }
    </View>
  }
}

class ItemsList<ItemType> extends Component {
  props: {
    items: ItemType[],
    itemDefinition: Defintion,
    selectedItem: ?ItemType,
    onAddItem: () => void,
    onUpdateItem: (propertyName: string, value: any) => void,
    onSelectItem: (item: ItemType) => void,
    onRemoveSelectedItem: () => void,
    orientation: string,
    itemView: string
  }

  allNormal(): void {
    const propertyNames: string[] = Object.keys(this.props.itemDefinition);
    propertyNames.map((propertyName: string, index: number) => {
      const propertyDefinition = this.props.itemDefinition[propertyName];
      if (propertyDefinition.normalValue) {
        if (propertyDefinition.multiValue)
          this.props.onUpdateItem(propertyName, [propertyDefinition.normalValue]);
        else {
            this.props.onUpdateItem(propertyName, propertyDefinition.normalValue);
        }
      }
    });
  }

  othersNormal(): void {
    const propertyNames: string[] = Object.keys(this.props.itemDefinition);
    propertyNames.map((propertyName: string, index: number) => {
      const propertyDefinition = this.props.itemDefinition[propertyName];
      if ((this.props.selectedItem[propertyName]===undefined || this.props.selectedItem[propertyName].length===0)
        && propertyDefinition.normalValue) {
        if (propertyDefinition.multiValue)
          this.props.onUpdateItem(propertyName, [propertyDefinition.normalValue]);
        else {
          this.props.onUpdateItem(propertyName, propertyDefinition.normalValue);
        }
      }
    });
  }

  clear(): void {
    const propertyNames: string[] = Object.keys(this.props.itemDefinition);
    propertyNames.map((propertyName: string, index: number) => {
      const propertyDefinition = this.props.itemDefinition[propertyName];
      if (propertyDefinition.multiValue)
        this.props.onUpdateItem(propertyName, []);
      else {
        this.props.onUpdateItem(propertyName, undefined);
      }
    });
  }

  renderButtons() {
    if (this.props.onAddItem) {
      return <View style={styles.buttonsRowLayout}>
        <WinkButton title='Add' onPress={() => this.props.onAddItem()} />
        <WinkButton title='Remove' onPress={() => this.props.onRemoveSelectedItem()} />
      </View>
    }
    return <View style={styles.buttonsRowLayout}>
      <View style={styles.buttonsRowStartLayout}>
        <WinkButton title='All normal' onPress={() => { this.allNormal() } } />
        <WinkButton title='Others normal' onPress={() => { this.othersNormal() } } />
      </View>
      <WinkButton title='Clear' onPress={() => { this.clear() } } />
    </View>
  }

  render() {
    //const listStyle = this.props.orientation === 'horizontal' ? styles.listRow : styles.centeredColumnLayout;
    const itemOrientation : string = this.props.orientation === 'vertical' ? 'horizontal' : 'vertical';
    return <View style={styles.board}>
      <View>
        {this.props.items.map((item: ItemType, index: number) => {
          const isSelected: boolean = this.props.selectedItem === item && this.props.items.length>1;
          const itemView = constructItemView(this.props.itemView, item, this.props.itemDefinition, isSelected, this.props.onUpdateItem, itemOrientation)
          return <TouchableHighlight key={index} underlayColor='#bbbbffbb'
            onPress={() => this.props.onSelectItem(item)} >
            <View style={{flexDirection: 'row'}}>
              {itemView}
            </View>
          </TouchableHighlight>
        })}
      </View>
      {this.renderButtons()}
    </View >
  }
}


export class ItemsEditor<ItemType> extends Component {
  props: {
    items?: ItemType[],
    newItem?: () => ItemType,
    itemDefinition: ItemDefinition,
    itemView?: string,
    orientation?: string
  }
  state: {
    items: ItemType[],
    selectedItem: ItemType
  }

  constructor(props: any) {
    super(props);
    let items: ItemType[] = this.props.items ? this.props.items : [];
    if (items.length === 0 && this.props.newItem!==undefined)
      items = [this.props.newItem()];
    this.state = {
      items: items,
      selectedItem: items[0]
    };
  }

  componentWillReceiveProps(nextProps: any) {
    let items: ItemType[] = nextProps.items ? nextProps.items : [];
    if (items.length === 0 && this.props.newItem!==undefined)
      items = [this.props.newItem()];
    this.setState({
      items: items,
      selectedItem: items[0]
    });
  }

  updateItem(propertyName: string, value: any) {
    if (!this.state.selectedItem) return;
    let item: ItemType = this.state.selectedItem;
    const propertyDefinition = this.props.itemDefinition[propertyName];
    if (propertyDefinition.normalValue) {
      if (value && value.length == 2 && value[0].toLowerCase() === propertyDefinition.normalValue.toLowerCase()) {
        value = value.splice(1);
      }
      if (value && value.length > 1 && value[value.length - 1].toLowerCase() === propertyDefinition.normalValue.toLowerCase()) {
        value = [propertyDefinition.normalValue];
      }
    }
    item[propertyName] = value;
    this.setState({
      selectedItem: item
    });
  }

  addItem() {
    const newItem: ItemType = this.props.newItem();
    this.state.items.push(newItem);
    this.setState({
      items: this.state.items,
      selectedItem: newItem
    });
  }

  selectItem(item: ItemType) {
    this.setState({
      selectedItem: item
    });
  }

  removeSelectedItem() {
    let index: number = this.state.items.indexOf(this.state.selectedItem);
    if (index < 0) {
      return;
    }
    let items: ItemType[] = this.state.items;
    items.splice(index, 1);
    if (items.length === 0)
      items = [this.props.newItem()];
    if (index >= items.length) index = items.length - 1;
    this.setState({
      items: items,
      selectedItem: items[index]
    })
  }

  render() {
    const propertyNames: string[] = Object.keys(this.props.itemDefinition);
    return <View>
      <ItemsList
        items={this.state.items}
        itemDefinition={this.props.itemDefinition}
        onAddItem={this.props.newItem?() => this.addItem():undefined}
        onUpdateItem={(propertyName: string, value: any) => this.updateItem(propertyName, value)}
        selectedItem={this.state.selectedItem}
        onSelectItem={(item: ItemType) => this.selectItem(item)}
        onRemoveSelectedItem={() => this.removeSelectedItem()}
        itemView={this.props.itemView}
        orientation = {this.props.orientation}
        />
      <ScrollView horizontal={true}>
        {propertyNames.map((propertyName: string, index: number) => {
          const propertyDefinition = this.props.itemDefinition[propertyName];
          const selection = this.state.selectedItem?this.state.selectedItem[propertyName]:undefined;
          return <SelectionList key={index}
            label={propertyDefinition.label}
            items={propertyDefinition.options}
            multiValue={propertyDefinition.multiValue}
            required={propertyDefinition.required}
            selection={selection}
            onUpdateSelection={(value) => this.updateItem(propertyName, value)} />
        }
        )}
      </ScrollView>
    </View>
  }
}

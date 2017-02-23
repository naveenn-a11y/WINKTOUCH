/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import ReactNative, { View, Text, Image, LayoutAnimation, TouchableHighlight, ScrollView, Modal, Dimensions,
  TouchableOpacity, TouchableWithoutFeedback, InteractionManager} from 'react-native';
import NativeBase from 'native-base';
import { styles, fontScale, selectionColor, windowWidth, windowHeight, selectionFontColor } from './Styles';
import { strings} from './Strings';
import { FormRow, FormTextInput } from './Form';
import { ComplaintDetails } from './Complaint'

const margin : number = 40;

export class NumberField extends Component {
    props: {
      value: number,
      label?: string,
      prefix?: string,
      range: number[],
      width?: number,
      stepSize: number,
      groupSize: number,
      decimals?: number,
      editable?: boolean,
      onChangeValue?: (newvalue: ?number) => void
    }
    state: {
      isActive: boolean,
      editedValue: string[],
    }
    static defaultProps = {
      editable: true,
      stepSize: 1,
      groupSize: 10
    }

    constructor(props: any) {
      super(props);
      this.state = {
        editedValue: [undefined,undefined,undefined,undefined],
        isActive: false,
      }
    }

    startEditing = () => {
      if (!this.props.editable) return;
      this.setState({
          editedValue: [undefined,undefined,undefined,undefined],
          isActive: true
      });
    }

    commitEdit = () => {
      const editedValue : ?number = this.combinedValue();
      if (this.props.onChangeValue)
        this.props.onChangeValue(editedValue);
      this.setState({ isActive: false });
    }

    cancelEdit = () => {
      this.setState({ isActive: false });
    }

    combinedValue() : ?number {
      if (this.state.editedValue[0]===undefined && this.state.editedValue[1]===undefined && this.state.editedValue[2]===undefined && this.state.editedValue[3]===undefined)
        return undefined;
      let combinedValue : number = 0;
      if (this.state.editedValue[1]!==undefined)
        combinedValue += Number(this.state.editedValue[1]);
      if (this.state.editedValue[2]!==undefined)
        combinedValue+=Number(this.state.editedValue[2]);
      if (this.state.editedValue[3]!==undefined)
        combinedValue+=Number(this.state.editedValue[3]);
      if (this.state.editedValue[0]==='-')
        combinedValue = -combinedValue;
      if (combinedValue<this.props.range[0]) combinedValue = this.props.range[0];
      else if (combinedValue>this.props.range[1]) combinedValue = this.props.range[1];
      return combinedValue;
    }

    updateValue(column: number, newColumnValue: string) : void {
      let editedValue: string[] = this.state.editedValue;
      if (newColumnValue===this.state.editedValue[column]) newColumnValue = undefined;
      editedValue[column] = newColumnValue;
      this.setState({editedValue});
    }

    format(value: ?number): string {
      if (isNaN(value) || value===undefined) return '';
      return (this.props.decimals && this.props.decimals>1) ? Number(value).toFixed(this.props.decimals) : String(value);
    }

    generateFractions() : string[][] {
      let fractions : string[][] = [[],[],[],[]];
      //sign + -
      if (this.props.range[0]<0) {
        if (this.props.range[1]<=0)
          fractions[0].push('-')
        else
          fractions[0].push('+','-');
      }
      //integer group
      if (this.props.groupSize && this.props.groupSize>1) {
        const minGroup : number = Math.abs(Math.max(this.props.range[0],this.props.groupSize));
        const maxGroup : number = this.props.range[1];
        for (let i = minGroup; i<=maxGroup; i+=this.props.groupSize) {
          fractions[1].push(String(i));
        }
      }
      //integer
      let minInt : number = this.props.groupSize>1?0:Math.abs(Math.max(this.props.range[0],0));
      let maxInt : number = this.props.groupSize>1?Math.min(this.props.range[1], this.props.groupSize-1):this.props.range[1];
      for (let i = minInt; i<=maxInt; i++) {
        fractions[2].push(String(i));
      }
      //decimals .25
      if (this.props.decimals && this.props.decimals>0) {
        for (let i = 0; i<1; i+=this.props.stepSize) {
          fractions[3].push(this.format(i).substring(1));
        }
      }
      return fractions;
    }

    renderPopup() {
      const fractions : string[][] = this.generateFractions();
      let formattedValue = this.format(this.combinedValue());
      return <TouchableWithoutFeedback onPress={this.cancelEdit}>
          <View style={{flex: 100, backgroundColor: '#00000099', padding:30 * fontScale}}>
            <Text style={styles.modalTitle}>{this.props.label}: {formattedValue}</Text>
            <View>
              <View style={styles.centeredRowLayout}>
                {fractions.map((options: string[], column: number) => {
                  return <View style={styles.modalColumn} key={column}>
                    {options.map((option: string, row: number) => {
                      let isSelected : boolean = this.state.editedValue[column]===option;
                      return <TouchableOpacity key={row} onPress={() => this.updateValue(column, option)}>
                        <View style={styles.popupNumberTile}>
                          <Text style={isSelected?styles.modalTileLabelSelected:styles.modalTileLabel}>{option}</Text>
                        </View>
                      </TouchableOpacity>
                    })}
                  </View>
              })}
              <View style={styles.modalColumn}>
                <TouchableOpacity onPress={this.commitEdit}>
                  <View style={styles.popupNumberTile}>
                    <Text style={styles.screenTitle}>Update</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    }

    render() {
      let style = this.state.isActive ? styles.inputFieldActive : styles.inputField;
      if (this.props.width) {
        style = [{ width: this.props.width }, style];
      }
      const formattedValue : string = this.format(this.props.value);
      if (!this.props.editable) {
        return <View style={{flex:100}}>
          <Text style={style}>{formattedValue}</Text>
        </View>
      }
      return <View style={{flex:100}}>
        <TouchableOpacity style={{flex: 100}} onPress={this.startEditing}>
          <Text style={style}>{formattedValue}</Text>
        </TouchableOpacity>
        {this.state.isActive?<Modal visible={this.state.isActive} transparent={true} animationType={'fade'} onRequestClose={this.cancelEdit}>
          {this.renderPopup()}
        </Modal>:null}
      </View>
    }
  }



export class RulerField extends Component {
  props: {
    value: number,
    prefix?: string,
    range: number[],
    width?: number,
    stepSize?: number,
    decimals?: number,
    editable?: boolean,
    onChangeValue?: (newvalue: number) => void,
    onEnableScroll?: (enableScroll: boolean) => void
  }
  state: {
    pageX: number,
    oldPageX: number,
    isActive: boolean,
    value: number
  }
  static defaultProps = {
    editable: true,
    decimals: 0
  }


  constructor(props: any) {
    super(props);
    const pageX : number = this.toPageX(this.toPercentage(this.props.value));
    this.state = {
      value: this.props.value,
      oldPageX: pageX,
      pageX: pageX,
      isActive: false,
    }
  }

  componentWillReceiveProps(nextProps: any) {
    const pageX: number = this.toPageX(this.toPercentage(nextProps.value));
    this.setState({
      value: nextProps.value,
      oldPageX: pageX,
      pageX: pageX
    });
  }

  startEditing = () => {
    if (!this.props.editable)
      return;
    if (this.props.onEnableScroll) {
      this.props.onEnableScroll(false);
    }
    this.setState({ isActive: true })
  }

  commitEdit() : void {
    this.setState({ isActive: false });
    if (this.props.onChangeValue)
      this.props.onChangeValue(this.state.value);
    if (this.props.onEnableScroll) {
        this.props.onEnableScroll(true);
    }
  }

  cancelEdit = () : void => {
    this.setState({ isActive: false });
    if (this.props.onEnableScroll) {
        this.props.onEnableScroll(true);
    }
  }

  toPageX(percentageValue: number) : number {
    const pageX: number = percentageValue * (windowWidth-2*margin) + margin;
    return pageX;
  }

  format(value: number): string {
    if (isNaN(value)) return '';
    return this.props.decimals ? Number(value).toFixed(this.props.decimals) : String(value);
  }

  toPercentage(value: number) : number {
    if (value==undefined || value==null) return 0.5;
    const x1: number = this.props.range.findIndex(x => x >= value)-1;
    if (x1<0) return 0;
    const x2: number = x1+1;
    const dx: number = (value-this.props.range[x1])/(this.props.range[x2]-this.props.range[x1]);
    const percentage = (x1+dx) / (this.props.range.length-1);
    return percentage;
  }

  toValue(percentage: number) : number {
    if (percentage==0)
      return this.props.range[0];
    if (percentage==1)
      return this.props.range[this.props.range.length-1];
    const x: number = percentage * (this.props.range.length-1)
    const x1 : number = Math.floor(x);
    const x2 : number = x1 + 1;
    const v1: number = this.props.range[x1];
    const v2: number = this.props.range[x2];
    const value : number = v1 + (x-x1) * (v2 - v1);
    return value;
  }

  updateValue(event: any) : void {
    const pageX: number = event.nativeEvent.pageX;
    const percentage: number = Math.max(0, Math.min(1, (pageX-margin)/(windowWidth-2*margin)));
    let newValue: number = this.toValue(percentage);
    if (this.props.stepSize && this.props.stepSize>0) {
      newValue = Math.round(newValue/this.props.stepSize)*this.props.stepSize;
    }
    this.setState({
      value: newValue,
      pageX
    });
  }

  renderPopup(formattedValue: string) {
    let pageX: number = this.state.pageX;
    pageX = Math.max(pageX, margin);
    pageX = Math.min(pageX, windowWidth-margin);
    return <TouchableWithoutFeedback onPress={this.cancelEdit}>
        <View style={{flex: 100, backgroundColor: '#00000055'}}>
          <View style={styles.scrollPopup} onStartShouldSetResponder={(event) => true}
            onResponderGrant={(event) => this.updateValue(event)}
            onResponderReject={(event) => this.setState({ isActive: false })}
            onMoveShouldSetResponder={(event) => false}
            onResponderTerminationRequest={(event) => false}
            onResponderMove={(event) => this.updateValue(event)}
            onResponderRelease={(event) => this.commitEdit()}
            onResponderTerminate={(event) => this.cancelEdit()}>
          <View style={{position: 'absolute', left:pageX-margin, width:3*fontScale, height:30*fontScale, backgroundColor: selectionFontColor}} />
          <Text style={{position: 'absolute', left:pageX-margin-20*fontScale, top: 24*fontScale, fontSize: 32*fontScale, color: selectionFontColor}}>{formattedValue}</Text>
          <View style={{position: 'absolute', left:this.state.oldPageX-margin, width:2*fontScale, height:50*fontScale, backgroundColor: 'green'}} />
          <Text style={{position: 'absolute', left:this.state.oldPageX-margin-20*fontScale, top: 50*fontScale, fontSize: 24*fontScale, color: 'green'}}>{this.format(this.props.value)}</Text>
          {this.props.range.map((pillar: number, index: number) => {
            const percentagePillar : number = index/(this.props.range.length-1);
            const pageX: number = this.toPageX(percentagePillar);
            const labelOffset: number = (pillar<0?14:8)*fontScale;
            return <View key={index}>
              <Text style={{position: 'absolute', left:pageX-margin-labelOffset, top: 80*fontScale, fontSize: 24*fontScale}}>{pillar}</Text>
              <View style={{position: 'absolute', left:pageX-margin, top: 2*fontScale, width:1*fontScale, height: 12*fontScale, backgroundColor: 'black'}} />
            </View>
          })}
        </View>
      </View>
    </TouchableWithoutFeedback>
  }

  render() {
    let style = this.state.isActive ? styles.inputFieldActive : styles.inputField;
    if (this.props.width) {
      style = [{ width: this.props.width }, style];
    }
    const formattedValue = this.format(this.state.value);
    if (!this.props.editable) {
      return <View style={{flex:100}}>
        <Text style={style}>{this.props.prefix}{formattedValue}</Text>
      </View>
    }
    return <View style={{flex: 100}}>
        <TouchableOpacity style={{flex: 100}} onPress={this.startEditing}>
          <Text style={style}>{this.state.isActive ? '' : this.props.prefix}{formattedValue}</Text>
        </TouchableOpacity>
        {this.state.isActive?<Modal transparent={true} animationType={'fade'} onRequestClose={this.cancelEdit}>
            {this.renderPopup(formattedValue)}
        </Modal>:null}
      </View>
  }
}

export class TilesField extends Component {
  props: {
    value: string,
    label?: string,
    options: string[],
    width?: number,
    editable?: boolean,
    onChangeValue?: (newvalue: string) => void
  }
  state: {
    isActive: boolean
  }
  static defaultProps = {
    editable: true
  }

  constructor(props: any) {
    super(props);
    this.state = {
      isActive: false,
    }
  }

  componentWillReceiveProps(nextProps: any) {
    this.setState({
      editedValue: nextProps.value
    });
  }

  startEditing = () => {
    if (!this.props.editable) return;
    this.setState({isActive: true});
  }

  commitEdit = (newValue: string) => {
    if (newValue===this.props.value) {
      newValue = undefined;
    }
    if (this.props.onChangeValue)
      this.props.onChangeValue(newValue);
    this.setState({ isActive: false });
  }

  cancelEdit = () => {
    this.setState({ isActive: false });
  }

  format(value: ?string) : string {
    if (value===undefined) return '';
    return value;
  }

  renderPopup() {
    return <TouchableWithoutFeedback onPress={this.cancelEdit}>
        <View style={{flex: 100, backgroundColor: '#00000099', padding:30 * fontScale}}>
          <Text style={styles.modalTitle}>{this.props.label}</Text>
          <View>
            <View style={styles.centeredRowLayout}>
                <View style={styles.modalColumn}>
                  {this.props.options.map((option: string, row: number) => {
                    let isSelected : boolean = this.props.value===option;
                    return <TouchableOpacity key={row} onPress={() => this.commitEdit(option)}>
                      <View style={styles.popupNumberTile}>
                        <Text style={isSelected?styles.modalTileLabelSelected:styles.modalTileLabel}>{option}</Text>
                      </View>
                    </TouchableOpacity>
                  })}
                </View>
            </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  }

  render() {
    let style = this.state.isActive ? styles.inputFieldActive : styles.inputField;
    if (this.props.width) {
      style = [{ width: this.props.width }, style];
    }
    const formattedValue : string = this.format(this.props.value);
    if (!this.props.editable) {
      return <View style={{flex:100}}>
        <Text style={style}>{formattedValue}</Text>
      </View>
    }
    return <View style={{flex:100}}>
      <TouchableOpacity style={{flex: 100}} onPress={this.startEditing}>
        <Text style={style}>{formattedValue}</Text>
      </TouchableOpacity>
      {this.state.isActive?<Modal visible={this.state.isActive} transparent={true} animationType={'fade'} onRequestClose={this.cancelEdit}>
        {this.renderPopup()}
      </Modal>:null}
    </View>
  }
}

export class Clock extends Component {
  props: {
    hidden?: boolean
  }
  render() {
    if (this.props.hidden)
      return null;
    return <Image source={require('./image/clock.png')} style={{
      width: 140 * fontScale,
      height: 140 * fontScale,
      alignSelf: 'center',
      resizeMode: 'contain'
    }} />
  }
}

export class Button extends Component {
  props: {
    title: string,
    visible?: boolean,
    onPress?: () => void
  }
  static defaultProps = {
    visible: true
  }
  render() {
    if (!this.props.visible) return null;
    return <NativeBase.Button block style={styles.button} {...this.props}>{this.props.title}</NativeBase.Button>
  }
}

export class BackButton extends Component {
  props: {
    onNavigationChange: (action: string, data: any) => void,
    visible? :boolean
  }
  static defaultProps = {
    visible: true
  }
  render() {
    if (!this.props.visible) return null;
    return <NativeBase.Button block large style={styles.backButton} onPress={() => this.props.onNavigationChange('back')}><NativeBase.Icon name='md-arrow-back'/></NativeBase.Button>
  }
}

export class AddButton extends Component {
  props: {
    onPress: () => void,
    visible?: boolean
  }
  static defaultProps = {
    visible: true
  }

  render() {
    if (!this.props.visible) return null;
    return <NativeBase.Button block style={styles.addButton} onPress={this.props.onPress}><NativeBase.Icon name='md-add'/></NativeBase.Button>
  }
}

export class FloatingButton extends Component {
  props: {
    options: string[],
    onPress: (option: string) => void
  }
  state: {
    active: boolean,
  }
  constructor(props: any) {
    super(props);
    this.state = {
      active: false
    }
  }

  toggleActive = () => {
    this.setState({active: !this.state.active});
  }

  render() {
    return <NativeBase.Fab active={this.state.active} onPress={this.toggleActive} direction='up'
       position='bottomRight' style={{backgroundColor: 'orange'}} containerStyle={{width:140*fontScale}}>
      <NativeBase.Icon name='md-add'/>
      {this.props.options.map((option: string, index: number) => {
         return <NativeBase.Button style={{flex:1,width:null,minHeight: 45* fontScale,backgroundColor: '#f0ad4e'}}
            onPress={() => {this.setState({active: false}); this.props.onPress(option)}} key={index}>{strings[option]}</NativeBase.Button>
      })}
    </NativeBase.Fab>
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
    const textStyle = this.props.selected ? styles.listTextSelected : styles.listText;
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
  static defaultProps = {
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
      return <ComplaintDetails complaint={item} isSelected={isSelected}/>
    case 'EditableItem':
      return <View style={{flex: 10}}>
        <EditableItem item={item} itemDefinition={itemDefinition} isSelected={isSelected} onUpdateItem={onUpdateItem} orientation={orientation}/>
      </View>
  }
  return <View style={isSelected?styles.listRowSelected:styles.listRow}>
    <ItemSummary item={item} orientation={orientation} itemDefinition={itemDefinition} />
  </View>

}

class ItemSummary<T> extends Component {
  props: {
    item: T,
    itemDefinition: ItemDefinition,
    orientation?: string
  }

  render() {
    if (!this.props.item) return null;
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

class EditableItem<T> extends Component {
  props: {
    item: Text,
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

class ItemsList<T> extends Component {
  props: {
    items: T[],
    itemDefinition: Defintion,
    selectedItem?: T,
    onAddItem: () => void,
    onUpdateItem: (propertyName: string, value: any) => void,
    onSelectItem: (item: T) => void,
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
        <Button title='Add' onPress={() => this.props.onAddItem()} />
        <Button title='Remove' onPress={() => this.props.onRemoveSelectedItem()} />
      </View>
    }
    return <View style={styles.buttonsRowLayout}>
      <View style={styles.buttonsRowStartLayout}>
        <Button title='All normal' onPress={() => { this.allNormal() } } />
        <Button title='Others normal' onPress={() => { this.othersNormal() } } />
      </View>
      <Button title='Clear' onPress={() => { this.clear() } } />
    </View>
  }

  render() {
    //const listStyle = this.props.orientation === 'horizontal' ? styles.listRow : styles.centeredColumnLayout;
    const itemOrientation : string = this.props.orientation === 'vertical' ? 'horizontal' : 'vertical';
    return <View style={styles.board}>
      <View>
        {this.props.items.map((item: T, index: number) => {
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


export class ItemsEditor<T> extends Component {
  props: {
    items: T[],
    newItem?: () => T,
    isEmpty?: (item: T) => boolean,
    itemDefinition: ItemDefinition,
    itemView?: string,
    orientation?: string,
    onUpdate?: () => void
  }
  state: {
    selectedItem: T,
    isDirty: boolean
  }

  constructor(props: any) {
    super(props);
    let items: T[] = this.props.items;
    if (items.length === 0 && this.props.newItem!==undefined)
      items.push(this.props.newItem());
    this.state = {
      selectedItem: items[0],
      isDirty : false
    };
  }

  componentWillReceiveProps(nextProps: any) {
    let items: T[] = nextProps.items;
    if (items.length === 0 && this.props.newItem!==undefined)
      items.push(this.props.newItem());
    this.setState({
      selectedItem: items[0],
    });
  }

  updateItem(propertyName: string, value: any) {
    if (!this.state.selectedItem) return;
    let item: T = this.state.selectedItem;
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
      selectedItem: item,
      isDirty: true
    });

  }

  addItem() {
    const newItem: T = this.props.newItem();
    this.props.items.push(newItem);
    this.setState({
      selectedItem: newItem,
      isDirty: true
    });
  }

  selectItem(item: T) {
    this.setState({
      selectedItem: item
    });
  }

  removeSelectedItem() {
    let index: number = this.props.items.indexOf(this.state.selectedItem);
    if (index < 0) {
      return;
    }
    let items: T[] = this.props.items;
    items.splice(index, 1);
    if (items.length === 0)
      items.push(this.props.newItem());
    if (index >= items.length) index = items.length - 1;
    this.setState({
      selectedItem: items[index],
      isDirty: true
    })
  }

  removeEmptyItems() {
    if (!this.props.isEmpty) return;
    let items: T[] = this.props.items;
    let i: number = 0;
    while (i<items.length) {
      if (this.props.isEmpty(items[i]))
        items.splice(i,1);
      else
        i++
    }
  }

  componentWillUnmount() {
    if (this.state.isDirty && this.props.onUpdate) {
      this.removeEmptyItems();
      this.props.onUpdate();
    }
  }

  render() {
    const propertyNames: string[] = Object.keys(this.props.itemDefinition);
    return <View>
      <ItemsList
        items={this.props.items}
        itemDefinition={this.props.itemDefinition}
        onAddItem={this.props.newItem?() => this.addItem():undefined}
        onUpdateItem={(propertyName: string, value: any) => this.updateItem(propertyName, value)}
        selectedItem={this.state.selectedItem}
        onSelectItem={(item: T) => this.selectItem(item)}
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

/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView, LayoutAnimation, TouchableHighlight } from 'react-native';
import { styles, fontScale } from './Styles';
import { WinkButton, OptionWheel, SelectionList } from './Widgets';
import { FormRow, FormTextInput } from './Form';

export type Medication = {
  label: string,
  rxDate: Date,
  strength: string,
  dosage: string,
  route: string,
  frequency: string,
  duration: string,
  instructions: string[]
}

export type Definition = any;

function fetchMedications(): Medication[] {
  const medications: Medication[] = [
    {
      label: 'Xalatan',
      rxDate: new Date(),
      strength: '0.05 mg/ml',
      dosage: '1 drop',
      route: 'OS',
      frequency: '5 x daily',
      duration: '2 weeks',
      instructions: ['Shake well before using', 'Take with food', 'Avoid taking with diary']
    }
  ];
  return medications;
}

const medicationDefinition: Definition = {
  label: {
    label: 'Label',
    options: ['Xalatan', 'Abilify', 'Roxicodone', 'Calcarb']
  },
  duration: {
    label: 'Duration',
    options: ['1 day', '2 days', '3 days', '4 days', '1 week', '2 weeks', '1 month', '2 months', '1 year']
  },
  strength: {
    label: 'Strength',
    options: ['10 mg', '20 mg', '30 mg', '50 mg', '100 mg', '200 mg']
  },
  instructions: {
    label: 'Instructions',
    options: ['Shake well before using', 'Take with food', 'Avoid taking with diary'],
    multiValue: true
  }
};

export class Item extends Component {
  props: {
    item: Medication,
    orientation?: string
  }
  render() {
    return <Text>{this.props.item.label} {this.props.item.strength} </Text>
  }
}

class ItemsList extends Component {
  props: {
    items: Medication[],
    selectedItem: ?Medication,
    onAddItem: () => void,
    onSelectItem: (complaint: Medication) => void,
    onRemoveSelectedItem: () => void
  }
  render() {
    return <View style={styles.board}>
      {this.props.items.map((item: Medication, index: number) => {
        const isSelected: boolean = this.props.selectedItem === item;
        return <TouchableHighlight key={index} underlayColor='#bbbbffbb'
          onPress={() => this.props.onSelectItem(item)} >
          <View style={isSelected ? styles.listRowSelected : styles.listRow}>
            <Item item={item} />
          </View>
        </TouchableHighlight>
      })}
      <View style={styles.buttonsRowLayout}>
        <WinkButton title='Add' onPress={() => this.props.onAddItem()} />
        <WinkButton title='Remove' onPress={() => this.props.onRemoveSelectedItem()} />
      </View>
    </View >
  }
}

export class ItemsScreen extends Component {
  props: {
    items?: Medication[],
    newItem: () => Medication,
    itemDefinition: Definition
  }
  state: {
    items: Medication[],
    selectedItem: Medication
  }

  constructor(props: any) {
    super(props);
    const items: Medication[] = this.props.items ? this.props.items : [this.props.newItem()];
    this.state = {
      items: items,
      selectedItem: items[0]
    }
  }

  updateItem(field: string, value: any) {
    if (!this.state.selectedItem) return;
    let item: Medication = this.state.selectedItem;
    if (this.props.itemDefinition[field].multiValue) {
      item[field] = value;
    } else {
      item[field] = value[0];
    }
    alert(JSON.stringify(value));
    this.setState({
      selectedItem: item
    });
  }

  addItem() {
    const newItem: Medication = this.props.newItem();
    this.state.items.push(newItem);
    this.setState({
      items: this.state.items,
      selectedItem: newItem
    });
  }

  selectItem(item: Medication) {
    this.setState({
      selectedItem: item
    });
  }

  removeSelectedItem() {
    let index: number = this.state.items.indexOf(this.state.selectedItem);
    if (index < 0) {
      return;
    }
    let items: Medication[] = this.state.items;
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
      <ItemsList items={this.state.items}
        onAddItem={() => this.addItem()}
        selectedItem={this.state.selectedItem}
        onSelectItem={(item: Medication) => this.selectItem(item)}
        onRemoveSelectedItem={() => this.removeSelectedItem()}
        />
      <ScrollView horizontal={true}>
        {propertyNames.map((propertyName: string, index: number) =>
          <SelectionList key={index}
            label={this.props.itemDefinition[propertyName].label}
            items={this.props.itemDefinition[propertyName].options}
            selection={this.state.selectedItem[propertyName]}
            onUpdateSelection={(value) => this.updateItem('label', value)} />
        )}
      </ScrollView>
    </View>
  }
}

export class MedicationsScreen extends Component {
  newMedication(): Medication {
    return {
      label: '',
      rxDate: new Date(),
      strength: '',
      dosage: '',
      route: '',
      frequency: '',
      duration: '',
      instructions: []
    };
  }

  render() {
    return <ItemsScreen newItem={() => this.newMedication()}
      itemDefinition={medicationDefinition} />
  }
}
/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView, LayoutAnimation, TouchableHighlight } from 'react-native';
import { styles, fontScale } from './Styles';
import { strings } from './Strings';
import type {Exam, ItemDefinition} from './Types';
import { restUrl, storeDocument } from './CouchDb';

export function newExamItems(examId: string, itemType: string) : Exam {
  return {
    dataType: 'ExamItem',
    itemType,
    examId
  };
}

export async function createExamItem(itemType: string, item: any) {
  try {
      item.dataType = 'ExamItem';
      item.itemType = itemType;
      item = storeDocument(item);
      return item;
  } catch (error) {
    console.log(error);
    alert('Something went wrong trying to create an exam item of type '+itemType+' on the server. You can try again anytime.');
  }
}

export async function fetchExamItems(examId: string, itemType: string) :?ExamItems {
  try {
    let response = await fetch(restUrl+'/_design/views/_view/examitems?startkey='+
    encodeURIComponent('["'+itemType+'","'+examId+'"]')+'&endkey='+
    encodeURIComponent('["'+itemType+'","'+examId+'"]'), {
        method: 'get'
    });
    let json = await response.json();
    const examItems : ?ExamItems = json.rows.length===0?undefined:json.rows[0].value;
    return examItems;
  } catch (error) {
    console.error(error);
    alert('Something went wrong trying to get the '+itemType+' list from the server. You can try again anytime.');
    return [];
  }
}

export class ExamItemsCard extends Component {
  props: {
    isExpanded: boolean,
    exam: Exam,
    itemType: string,
    itemProperties: string[]
  }

  render() {
    if (!this.props.exam[this.props.itemType] || this.props.exam[this.props.itemType].length===0)
      return <View style={styles.centeredColumnLayout}>
          <Text style={styles.cardTitle}>{strings[this.props.itemType]}</Text>
        </View>
    return <View style={styles.centeredColumnLayout}>
          <Text style={styles.cardTitle}>{strings[this.props.itemType]}</Text>
          {this.props.exam[this.props.itemType].map((examItem: any, index: number) => {
            return <View style={styles.centeredRowLayout} key={index}>
              {this.props.itemProperties.map((property: string, index: number) => {
                return <Text style={styles.text} key={index}>{examItem[property]} </Text>
                })
              }
            </View>
          })}
        </View>
  }
}

export class ExamItemCard extends Component {
  props: {
    isExpanded: boolean,
    exam: Exam,
    itemType: string,
    itemProperties: string[],
    itemDefinition: ItemDefinition
  }

  render() {
    if (!this.props.exam[this.props.itemType])
      return <View style={styles.centeredColumnLayout}>
          <Text style={styles.cardTitle}>{strings[this.props.itemType]}</Text>
        </View>
    return <View style={styles.centeredColumnLayout}>
          <Text style={styles.cardTitle}>{strings[this.props.itemType]}</Text>
            {this.props.itemProperties.map((property: string, index: number) => {
              let value = this.props.exam[this.props.itemType][property];
              let itemDefinition = this.props.itemDefinition[property];
              if (itemDefinition.normalValue==value || !value || value.length===0) return null;
              return <Text style={styles.text} key={index}>{itemDefinition.label}: {value}</Text>
            })}
      </View>
  }
}

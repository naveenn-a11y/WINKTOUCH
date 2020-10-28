/**
 * @flow
 */
'use strict';

import React, {PureComponent} from 'react';
import {
  View,
  TouchableHighlight,
  Image,
  LayoutAnimation,
  InteractionManager,
} from 'react-native';
//import codePush from 'react-native-code-push';
import {strings} from './Strings';
import {styles, fontScale} from './Styles';
import type {Exam, ExamDefinition, Scene} from './Types';
import {Button, BackButton, Clock} from './Widgets';
import {UpcomingAppointments} from './Appointment';
import {getAllCodes} from './Codes';

export class Notifications extends PureComponent {
  render() {
    return (
      <View
        style={{
          flex: 100,
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
        }}>
        <UpcomingAppointments />
        <Clock />
      </View>
    );
  }
}

export class MenuBar extends PureComponent {
  props: {
    navigation: any,
  };

  extractExamDefinition(exam: Exam): ExamDefinition {
    let examDefinition = exam.definition;
    examDefinition.id = exam.id;
    return examDefinition;
  }

  render() {
    //if (this.props.scene.menuHidden) return null;
    const exam: ?Exam =
      this.props.navigation.state &&
      this.props.navigation.state.params &&
      this.props.navigation.state.params.exam;
    const scene: ?string =
      this.props.navigation.state && this.props.navigation.state.routeName;
    const hasConfig: boolean =
      getAllCodes('machines') !== undefined &&
      getAllCodes('machines').length > 0;
    return (
      <View style={styles.sideMenu}>
        <Image source={require('./image/menulogo.png')} />
        <Button
          title={strings.agenda}
          onPress={() => this.props.navigation.navigate('agenda')}
        />
        {(scene === 'appointment' || exam) && (
          <Button
            title={strings.patient}
            onPress={() =>
              this.props.navigation.navigate('findPatient', {
                showAppointments: false,
                showBilling: true,
              })
            }
          />
        )}
        {exam != undefined && exam.definition.graph && (
          <Button
            title={strings.graph}
            onPress={() =>
              this.props.navigation.navigate('examGraph', {exam: exam})
            }
          />
        )}
        {exam != undefined && (
          <Button
            title={strings.history}
            onPress={() =>
              this.props.navigation.navigate('examHistory', {exam: exam})
            }
          />
        )}
        {__DEV__ && false && exam && (
          <Button
            title={strings.template}
            onPress={() =>
              this.props.navigation.navigate('examTemplate', {
                examDefinition: this.extractExamDefinition(exam),
              })
            }
          />
        )}
        {__DEV__ && (
          <Button
            title={strings.templates}
            onPress={() => this.props.navigation.navigate('templates')}
          />
        )}
        {scene === 'overview' && hasConfig === true && (
          <Button
            title={strings.configuration}
            onPress={() => this.props.navigation.navigate('configuration')}
          />
        )}
        <BackButton navigation={this.props.navigation} />
        {__DEV__ && <Button title={strings.restart} />}
        {__DEV__ && <Notifications />}
      </View>
    );
  }
}

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
  TouchableWithoutFeedback,
} from 'react-native';
import codePush from 'react-native-code-push';
import {strings, getUserLanguage} from './Strings';
import {styles, fontScale, backgroundColor, isWeb} from './Styles';
import type {Exam, ExamDefinition, Scene} from './Types';
import {Button, BackButton, Clock, KeyboardMode} from './Widgets';
import {UpcomingAppointments} from './Appointment';
import {getAllCodes} from './Codes';
import {isAtWink} from './Registration';
import {getPhoropters} from './DoctorApp';
import {ModeContext} from '../src/components/Context/ModeContextProvider';
import {REACT_APP_HOST} from '../env.json';

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
    screenProps: {
      onLogout: () => void,
    },
  };

  componentDidMount() {
    if (isWeb) {
      document.addEventListener('keydown', this.handleKeyDown);
      window.onpopstate = () => {
        this.props.screenProps.onLogout();
      };
    }
  }

  componentWillUnmount() {
    if (isWeb) {
      document.removeEventListener('keydown', this.handleKeyDown);
    }
  }

  handleKeyDown = (event) => {
    if (event && event.keyCode === 37) {
      this.props.navigation && this.props.navigation.navigate('back');
    }
  };

  extractExamDefinition(exam: Exam): ExamDefinition {
    let examDefinition = exam.definition;
    examDefinition.id = exam.id;
    return examDefinition;
  }
  static contextType = ModeContext;

  render() {
    //if (this.props.scene.menuHidden) return null;
    const exam: ?Exam =
      this.props.navigation.state &&
      this.props.navigation.state.params &&
      this.props.navigation.state.params.exam;
    const scene: ?string =
      this.props.navigation.state && this.props.navigation.state.routeName;
    const hasConfig: boolean = getPhoropters().length > 1;
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
        {(isAtWink || __DEV__) &&
          scene === 'overview' &&
          'en-CA' === getUserLanguage() && (
            <Button
              title={strings.customisation}
              onPress={() => this.props.navigation.navigate('customisation')}
            />
          )}
        {scene === 'overview' && hasConfig === true && (
          <Button
            title={strings.configuration}
            onPress={() => this.props.navigation.navigate('configuration')}
          />
        )}
        {scene !== 'overview' && (
          <BackButton navigation={this.props.navigation} />
        )}
        {__DEV__ && (
          <Button
            title={strings.restart}
            onPress={() =>
              !isWeb
                ? codePush.restartApp()
                : window.location.replace(REACT_APP_HOST)
            }
          />
        )}
        <Button
          title={strings.logout}
          onPress={this.props.screenProps.onLogout}
        />
        {__DEV__ && <Notifications />}

        <KeyboardMode
          mode={this.context.keyboardMode}
          onPress={this.context.toggleMode}
        />
      </View>
    );
  }
}

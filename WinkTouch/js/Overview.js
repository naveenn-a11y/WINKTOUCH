/**
 * @flow
 */
'use strict';

import React, {Component, PureComponent} from 'react';
import {
  Image,
  Text,
  TextInput,
  View,
  Dimensions,
  ScrollView,
  InteractionManager,
} from 'react-native';
import {styles} from './Styles';
import type {Appointment, User} from './Types';
import {AppointmentsSummary, fetchAppointments} from './Appointment';
import {Button} from './Widgets';
import {StartVisitButtons, fetchReferralFollowUpHistory} from './Visit';
import {getStore, getDoctor} from './DoctorApp';
import {now, isToday} from './Util';
import {strings} from './Strings';
import {isAtWink} from './Registration';
import {toggleTranslateMode, isInTranslateMode} from './ExamDefinition';
import {getCachedItem} from './DataCache';
import {isReferralsEnabled} from './Referral';

class MainActivities extends Component {
  props: {
    navigation: any,
    onLogout: () => void,
  };

  state: {
    translating: boolean,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      translating: isInTranslateMode(),
    };
  }

  componentDidUpdate(prevProps: any) {
    if (this.state.translating != isInTranslateMode()) {
      this.setState({translating: isIntranslateMode()});
    }
  }

  openPatientFile = (visitType: string, isPrevisit: boolean) => {
    this.props.navigation.navigate('cabinet');
  };

  async openReferral() {
    this.props.navigation.navigate('followup', {overview: true});
  }

  switchTranslate = () => {
    toggleTranslateMode();
    this.setState({translating: isInTranslateMode()});
  };

  render() {
    return (
      <View style={styles.startVisitCard}>
        <View style={styles.flow}>
          <Button title={strings.openFile} onPress={this.openPatientFile} />
          <Button title={strings.logout} onPress={this.props.onLogout} />
          {__DEV__ && false && (
            <Button
              title={
                this.state.translating
                  ? strings.stopTranslating
                  : strings.translate
              }
              onPress={this.switchTranslate}
            />
          )}
          {isReferralsEnabled() && (
            <Button
              title={strings.referral}
              onPress={() => this.openReferral()}
            />
          )}
        </View>
      </View>
    );
  }
}

function compareByStart(
  startableA: {start: string},
  startableB: {start: string},
): number {
  if (startableB.start > startableA.start) {
    return -1;
  }
  if (startableB.start < startableA.start) {
    return 1;
  }
  return 0;
}

export class OverviewScreen extends PureComponent {
  props: {
    navigation: any,
    screenProps: {
      onLogout: () => void,
    },
  };
  state: {
    appointments: Appointment[],
  };
  lastRefresh: number;

  constructor(props: any) {
    super(props);
    this.state = {
      appointments: [],
    };
    this.lastRefresh = 0;
  }

  componentDidMount() {
    this.refreshAppointments();
  }

  componentDidUpdate(prevProps: any) {
    if (
      this.props.navigation.state.params &&
      this.props.navigation.state.params.refreshAppointments === true
    ) {
      this.refreshAppointments();
    }
  }

  async refreshAppointments() {
    if (now().getTime() - this.lastRefresh < 5 * 1000) {
      //Just to be safe and nice
      this.setState(this.state.appointments);
      return;
    }
    this.lastRefresh = now().getTime();
    InteractionManager.runAfterInteractions(() =>
      this.props.navigation.setParams({refreshAppointments: false}),
    );
    let appointments = await fetchAppointments(
      'store-' + getStore().storeId,
      getDoctor().id,
      1,
    );
    appointments = appointments.filter((appointment: Appointment) =>
      isToday(appointment.start),
    );

    //appointments && appointments.sort(compareByStart);
    this.setState({appointments});
  }

  render() {
    return (
      <View style={styles.page}>
        <AppointmentsSummary
          appointments={this.state.appointments}
          navigation={this.props.navigation}
          onRefreshAppointments={() => this.refreshAppointments()}
        />
        <View>
          <MainActivities
            navigation={this.props.navigation}
            onLogout={this.props.screenProps.onLogout}
          />
        </View>
      </View>
    );
  }
}

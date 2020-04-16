/**
 * @flow
 */
'use strict';
import React, { Component } from 'react';
import {  StatusBar, ScrollView, View} from 'react-native';
import { createAppContainer, createStackNavigator, NavigationActions, StackActions } from 'react-navigation';
import type {Appointment, PatientInfo, Exam, Visit, User, Store, ExamDefinition, Scene} from './Types';
import {styles} from './Styles';
import {OverviewScreen} from './Overview';
import { AppointmentScreen, AppointmentsSummary } from './Appointment';
import { Reminders } from './Reminders';
import { AgendaScreen } from './Agenda';
import { PatientScreen, CabinetScreen} from './Patient';
import { ExamScreen, ExamHistoryScreen } from './Exam';
import { MenuBar, Notifications } from './MenuBar';
import { FindPatient } from './FindPatient';
import { FindPatientScreen } from './FindPatient';
import { ExamDefinitionScreen, TemplatesScreen, allExamDefinitions } from './ExamDefinition';
import { ExamChartScreen } from './Chart';
import { setToken } from './Rest';
import { allExamPredefinedValues } from './Favorites';

let doctor: User;
let store : Store;

export function getDoctor() : User {
  return doctor;
}

function setDoctor(user: User) : void {
  doctor = user;
}

export function getStore() : Store {
  return store;
}

function setStore(selectedStore: Store) : void {
  store = selectedStore;
}

const DoctorNavigator = createStackNavigator({
    overview: {screen: OverviewScreen},
    agenda: {screen: AgendaScreen},
    findPatient: {screen: FindPatientScreen},
    appointment: {screen: AppointmentScreen},
    exam: {screen: ExamScreen},
    patient: {screen: PatientScreen},
    cabinet: {screen: CabinetScreen},
    examGraph: {screen: ExamChartScreen},
    examHistory: {screen: ExamHistoryScreen},
    examTemplate: {screen: ExamDefinitionScreen},
    templates: {screen: TemplatesScreen}
  }, {
    headerMode: 'none'
  }
);

const DocatorAppContainer = createAppContainer(DoctorNavigator);

const defaultGetStateForAction = DoctorNavigator.router.getStateForAction;
const replaceRoutes: string[] = ['agenda','findPatient','templates','examHistory','examGraph'];

DoctorNavigator.router.getStateForAction = (action, state) => {
  if (state && action.type === NavigationActions.NAVIGATE) {
    if (replaceRoutes.includes(state.routes[state.index].routeName)) {
        action.type = StackActions.REPLACE;
    }
  }
  let newState = defaultGetStateForAction(action, state);
  if (state && action.type === NavigationActions.BACK) {
      if (state.index===1) {
        newState.routes[0].params={refreshAppointments: true};
      }
  }
  return newState;
}


function getCurrentRoute(navigationState) {
  if (!navigationState) {
    return null;
  }
  const route = navigationState.routes[navigationState.index];
  // dive into nested navigators
  if (route.routes) {
    return getCurrentRoute(route);
  }
  return route;
}

export class DoctorApp extends Component {
    props: {
      user: User,
      store: Store,
      token: string,
      onLogout: () => void
    }
    state: {
        statusMessage: string,
        currentRoute: any,
    }
    navigator: any;
    constructor(props: any) {
        super(props);
        this.state = {
            statusMessage: '',
            currentRoute: {routeName: 'overview'}
        }
        setToken(this.props.token);
        setDoctor(this.props.user);
        setStore(this.props.store);
    }

    componentWillReceiveProps(nextProps: any) {
      this.setState({
          statusMessage: '',
      });
      setDoctor(nextProps.user);
      setToken(nextProps.token);
      setStore(nextProps.store);
    }

    async initialseAppForDoctor() {
      await allExamDefinitions(true, false);
      await allExamDefinitions(false, false);
      await allExamDefinitions(false, true);
      await allExamPredefinedValues();
    }

    componentDidMount() {
      this.initialseAppForDoctor();
    }

    logout = () : void => {
      __DEV__ && console.log('Logging out');
      setDoctor(undefined);
      setToken(undefined);
      setStore(undefined);
      this.props.onLogout();
    }

    navigate = (routeName: string, params: any) : void => {
      if (routeName==='logout') {
        this.logout();
        return;
      }
      if (!this.navigator) return;
      if (routeName==='back')
        this.navigator.dispatch({type: NavigationActions.BACK});
      else
        this.navigator.dispatch({type: NavigationActions.NAVIGATE, routeName, params})
    }

    navigationStateChanged = (prevState: any, currentState: any) : void => {
        const currentRoute = getCurrentRoute(currentState);
        this.setState({currentRoute});
    }

    render() {
        return <View style={styles.screeen}>
            <StatusBar hidden={true} />
            <DocatorAppContainer ref={navigator => this.navigator = navigator} screenProps={{doctorId: this.props.user.id, storeId: this.props.store.storeId, onLogout: this.logout}} onNavigationStateChange={this.navigationStateChanged}/>
            <MenuBar scene={{}} navigation={{state: this.state.currentRoute, navigate: this.navigate}} />
        </View>
    }
}

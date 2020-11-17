/**
 * @flow
 */
'use strict';
import React, {Component} from 'react';
import {StatusBar, ScrollView, View, AsyncStorage} from 'react-native';
import {
  createAppContainer,
  NavigationActions,
  StackActions,
} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
import type {
  Appointment,
  PatientInfo,
  Exam,
  Visit,
  Account,
  User,
  Store,
  ExamDefinition,
  Scene,
  CodeDefinition,
  Configuration,
} from './Types';
import {styles} from './Styles';
import {OverviewScreen} from './Overview';
import {AppointmentScreen, AppointmentsSummary} from './Appointment';
import {Reminders} from './Reminders';
import {AgendaScreen} from './Agenda';
import {PatientScreen, CabinetScreen} from './Patient';
import {ExamScreen, ExamHistoryScreen} from './Exam';
import {MenuBar, Notifications} from './MenuBar';
import {FindPatient} from './FindPatient';
import {FindPatientScreen} from './FindPatient';
import {
  ExamDefinitionScreen,
  TemplatesScreen,
  allExamDefinitions,
} from './ExamDefinition';
import {ExamChartScreen} from './Chart';
import {setToken} from './Rest';
import {allExamPredefinedValues} from './Favorites';
import {ConfigurationScreen, getConfiguration} from './Configuration';
import {deleteLocalFiles} from './Print';
import {ReferralScreen} from './Referral';
import {FollowUpScreen} from './FollowUp';
import {CustomisationScreen} from './Customisation';
import {fetchVisitTypes} from './Visit';
import {fetchUserDefinedCodes, getAllCodes} from './Codes';

let account: Account;
let doctor: User;
let store: Store;

export function getAccount(): Account {
  return account;
}

async function setAccount(selectedAccount: Account) {
  account = selectedAccount;
  let accountChanged: boolean = true;
  if (selectedAccount && selectedAccount.id) {
    const selectedAccountId: number = selectedAccount.id;
    const accountId: number = await AsyncStorage.getItem('accountId');
    accountChanged = accountId != selectedAccountId;
    if (accountChanged) {
      await AsyncStorage.setItem('accountId', selectedAccountId.toString());
    }
  }
  if (accountChanged) {
    console.log(
      'Account changed to: ' + selectedAccount.id + ' ' + selectedAccount.name,
    );
    await deleteLocalFiles();
  } else {
    __DEV__ &&
      console.log(
        'Account did not change: ' +
          selectedAccount.id +
          ' ' +
          selectedAccount.name,
      );
  }
}

export function getDoctor(): User {
  return doctor;
}

function setDoctor(user: User): void {
  doctor = user;
}

export function getStore(): Store {
  return store;
}

function setStore(selectedStore: Store): void {
  store = selectedStore;
}

const DoctorNavigator = createStackNavigator(
  {
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
    templates: {screen: TemplatesScreen},
    configuration: {screen: ConfigurationScreen},
    referral: {screen: ReferralScreen},
    followup: {screen: FollowUpScreen},
    customisation: {screen: CustomisationScreen},
  },
  {
    headerMode: 'none',
  },
);

const DocatorAppContainer = createAppContainer(DoctorNavigator);

const defaultGetStateForAction = DoctorNavigator.router.getStateForAction;
const replaceRoutes: string[] = [
  'agenda',
  'findPatient',
  'templates',
  'examHistory',
  'examGraph',
];

DoctorNavigator.router.getStateForAction = (action, state) => {
  if (state && action.type === NavigationActions.NAVIGATE) {
    if (replaceRoutes.includes(state.routes[state.index].routeName)) {
      action.type = StackActions.REPLACE;
    }
  }
  let newState = defaultGetStateForAction(action, state);
  if (state && action.type === NavigationActions.BACK) {
    if (state.index === 1) {
      newState.routes[0].params = {refreshAppointments: true};
    }
  }
  return newState;
};

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

export function getPhoropters(): CodeDefinition[] {
  const machines: CodeDefinition[] = getAllCodes('machines');
  let phoropters: CodeDefinition[] = machines.filter(
    (machine: CodeDefinition) => machine.machineType === 'PHOROPTER',
  );
  return phoropters;
}

export class DoctorApp extends Component {
  props: {
    account: Account,
    user: User,
    store: Store,
    token: string,
    onLogout: () => void,
  };
  state: {
    statusMessage: string,
    currentRoute: any,
  };
  navigator: any;
  constructor(props: any) {
    super(props);
    this.state = {
      statusMessage: '',
      currentRoute: {routeName: 'overview'},
    };
    setToken(this.props.token);
    setAccount(this.props.account);
    setDoctor(this.props.user);
    setStore(this.props.store);
  }

  componentDidUpdate(prevProps: any) {
    if (
      this.props.account === prevProps.account &&
      this.props.user === prevProps.user &&
      this.props.store === prevProps.store &&
      this.props.token === prevProps.token
    ) {
      return;
    }
    this.setState({
      statusMessage: '',
      currentRoute: {routeName: 'overview'},
    });
    setAccount(this.props.account);
    setToken(this.props.token);
    setDoctor(this.props.user);
    setStore(this.props.store);
  }

  componentDidMount() {
    this.initialseAppForDoctor();
  }

  async initialseAppForDoctor() {
    await fetchVisitTypes();
    await fetchUserDefinedCodes();
    this.initConfiguration();
    this.forceUpdate();
    await allExamDefinitions(true, false);
    await allExamDefinitions(false, false);
    await allExamDefinitions(false, true);
    await allExamPredefinedValues();
    this.forceUpdate();
  }

  initConfiguration(): void {
    this.initPhoropter();
  }

  initPhoropter(): void {
    const phoropters: CodeDefintion[] = getPhoropters();
    if (phoropters && phoropters.length === 1) {
      let configuration: Configuration = getConfiguration();
      configuration.machine.phoropter = phoropters[0].code;
      //We don't want to save the configuration as the user did not choose this phoropter himself.
      //So If he switches to a store with more then one phoropter he will get his selected phoropter from before.
    }
  }

  logout = (): void => {
    __DEV__ && console.log('Logging out');
    setDoctor(undefined);
    setToken(undefined);
    setStore(undefined);
    this.props.onLogout();
  };

  navigate = (routeName: string, params: any): void => {
    if (routeName === 'logout') {
      this.logout();
      return;
    }
    if (!this.navigator) {
      return;
    }
    if (routeName === 'back')
      this.navigator.dispatch({type: NavigationActions.BACK});
    else
      this.navigator.dispatch({
        type: NavigationActions.NAVIGATE,
        routeName,
        params,
      });
  };

  navigationStateChanged = (prevState: any, currentState: any): void => {
    const currentRoute = getCurrentRoute(currentState);
    this.setState({currentRoute});
  };

  render() {
    return (
      <View style={styles.screeen}>
        <StatusBar hidden={true} />
        <DocatorAppContainer
          ref={navigator => (this.navigator = navigator)}
          screenProps={{
            doctorId: this.props.user.id,
            storeId: this.props.store.storeId,
            onLogout: this.logout,
          }}
          onNavigationStateChange={this.navigationStateChanged}
        />
        <MenuBar
          scene={{}}
          navigation={{state: this.state.currentRoute, navigate: this.navigate}}
        />
      </View>
    );
  }
}

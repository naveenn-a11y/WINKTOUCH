/**
 * @flow
 */
'use strict';
import React, {Component} from 'react';
import {StatusBar, ScrollView, View} from 'react-native';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
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
import {styles, isWeb} from './Styles';
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
import {allExamPredefinedValues, fetchExamPredefinedValues} from './Favorites';
import {ConfigurationScreen, getConfiguration} from './Configuration';
import {deleteLocalFiles} from './Print';
import {ReferralScreen} from './Referral';
import {FollowUpScreen} from './FollowUp';
import {
  DefaultExamCustomisationScreen,
  CustomisationScreen,
  VisitTypeCustomisationScreen,
} from './Customisation';
import {fetchVisitTypes} from './Visit';
import {fetchUserDefinedCodes, getAllCodes} from './Codes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ErrorBoundary} from './ErrorBoundary';
import {ModeContextProvider} from '../src/components/Context/ModeContextProvider';
import {Provider, DefaultTheme} from 'react-native-paper';
import {clearDataCache} from './DataCache';
import {cacheDefinitions} from './Items';
import {getUserLanguage} from './Strings';
import {RoomScreen} from './Room';
import {LockScreen} from './LockScreen';
import NavigationService from './utilities/NavigationService';
import InactivityTracker from './utilities/InactivityTracker';
import {VisitTypeTemplateScreen} from './VisitType';
import { fetchUserSettings } from './User';
import { getCurrentRoute } from './Util';
import createDoctorAppNavigator from './utilities/CustomStack'

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

export function getPhoropters(): CodeDefinition[] {
  const machines: CodeDefinition[] = getAllCodes('machines');
  let phoropters: CodeDefinition[] = machines.filter(
    (machine: CodeDefinition) => machine.machineType === 'PHOROPTER',
  );
  return phoropters;
}

const theme = {
  ...DefaultTheme,
  dark: false,
};

export class DoctorApp extends Component {
  props: {
    account: Account,
    user: User,
    store: Store,
    token: string,
    onLogout: () => void,
    onStartLockingDog: (ttlInMins: number) => void,
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
    await fetchUserSettings();
    this.initConfiguration();
    this.startLockingDog();
    this.forceUpdate();
    await allExamDefinitions(true, false);
    await allExamDefinitions(false, false);
    await allExamDefinitions(false, true);
    await fetchExamPredefinedValues();
    this.forceUpdate();
  }

  initConfiguration(): void {
    this.initPhoropter();
  }

  startLockingDog() {
    const inactivitiesTimer: CodeDefinition[] = getAllCodes('inactivityTimer');
    if (inactivitiesTimer && inactivitiesTimer instanceof Array) {
      const inactivityTimer: CodeDefinition = inactivitiesTimer[0];
      if (inactivityTimer && inactivityTimer.code) {
        this.props.onStartLockingDog(inactivityTimer.code);
      }
    }
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
    clearDataCache();
    !isWeb && cacheDefinitions(getUserLanguage());
    this.props.onLogout();
  };

  setNavigator = (navigatorRef) => {
    this.navigator = navigatorRef;
    NavigationService.setTopLevelNavigator(navigatorRef);
  };

  navigate = (routeName: string, params: any): void => {
    if (routeName === 'logout') {
      this.logout();
      return;
    }
    if (!this.navigator) {
      return;
    }
    if (routeName === 'back') {
      this.navigator.dispatch(CommonActions.goBack());
    } else {
      this.navigator.dispatch(
        CommonActions.navigate({
          name: routeName,
          params: params,
        })
      );
    }
  };

  navigationStateChanged = (state: any): void => {
    NavigationService.setNavigationState(state);
    const currentRoute = getCurrentRoute(state);
    this.setState({currentRoute});
  };

  renderNavigationContainer = () => {
    const StackNavigator = createDoctorAppNavigator();
    const refreshKey = Math.round(Math.random() * 1236878991214)
    return (
      <NavigationContainer 
        ref={(navigator) => this.setNavigator(navigator)}
        onStateChange={this.navigationStateChanged}
      >
        <StackNavigator.Navigator initialRouteName="overview" screenOptions={{ headerShown: false }} >
            <StackNavigator.Screen name="overview">
              {(props) => <OverviewScreen {...props} onLogout={this.logout} refreshKey={refreshKey} />}
            </StackNavigator.Screen>
            <StackNavigator.Screen name="agenda" component={AgendaScreen} />
            <StackNavigator.Screen name="findPatient" component={FindPatientScreen} />
            <StackNavigator.Screen name="appointment" component={AppointmentScreen} />
            <StackNavigator.Screen name="exam" component={ExamScreen} />
            <StackNavigator.Screen name="patient" component={PatientScreen} />
            <StackNavigator.Screen name="cabinet" component={CabinetScreen} />
            <StackNavigator.Screen name="examGraph" component={ExamChartScreen} />
            <StackNavigator.Screen name="examHistory" component={ExamHistoryScreen} />
            <StackNavigator.Screen name="examTemplate" component={ExamDefinitionScreen} />
            <StackNavigator.Screen name="templates" component={TemplatesScreen} />
            <StackNavigator.Screen name="configuration" component={ConfigurationScreen} />
            <StackNavigator.Screen name="referral" component={ReferralScreen} />
            <StackNavigator.Screen name="followup" component={FollowUpScreen} />
            <StackNavigator.Screen name="customisation" component={CustomisationScreen} />
            <StackNavigator.Screen name="defaultTileCustomisation" component={DefaultExamCustomisationScreen} />
            <StackNavigator.Screen name="visitTypeCustomisation" component={VisitTypeCustomisationScreen} />
            <StackNavigator.Screen name="visitTypeTemplate" component={VisitTypeTemplateScreen} />
            <StackNavigator.Screen name="room" component={RoomScreen} />
            <StackNavigator.Screen name="lock" component={LockScreen} />
        </StackNavigator.Navigator>
      </NavigationContainer>
    );
  }

  render() {
    return (
      <ModeContextProvider>
        <Provider theme={theme}>
          <View style={styles.screeen}>
            <StatusBar hidden={true} />
            <ErrorBoundary
              navigator={{
                state: this.state.currentRoute,
                navigate: this.navigate,
              }}>
                {this.renderNavigationContainer()}
            </ErrorBoundary>
            <MenuBar
              scene={{}}
              navigation={{
                state: this.state.currentRoute,
                navigate: this.navigate,
              }}
              screenProps={{
                onLogout: this.logout,
              }}
            />
          </View>
        </Provider>
      </ModeContextProvider>
    );
  }
}

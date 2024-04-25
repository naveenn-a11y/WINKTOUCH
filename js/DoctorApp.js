/**
 * @flow
 */
'use strict';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, NavigationContainer } from '@react-navigation/native';
import { Component } from 'react';
import { StatusBar, View } from 'react-native';
import { DefaultTheme, Provider } from 'react-native-paper';
import { ModeContextProvider } from '../src/components/Context/ModeContextProvider';
import { AgendaScreen } from './Agenda';
import { AppointmentScreen } from './Appointment';
import { ExamChartScreen } from './Chart';
import { fetchUserDefinedCodes, getAllCodes } from './Codes';
import { ConfigurationScreen, getConfiguration } from './Configuration';
import {
  CustomisationScreen,
  DefaultExamCustomisationScreen,
  VisitTypeCustomisationScreen,
} from './Customisation';
import { clearDataCache } from './DataCache';
import { ErrorBoundary } from './ErrorBoundary';
import { ExamHistoryScreen, ExamScreen } from './Exam';
import {
  ExamDefinitionScreen,
  TemplatesScreen,
  allExamDefinitions,
} from './ExamDefinition';
import { fetchExamPredefinedValues } from './Favorites';
import { FindPatientScreen } from './FindPatient';
import { FollowUpScreen } from './FollowUp';
import { cacheDefinitions } from './Items';
import { LockScreen } from './LockScreen';
import { MenuBar } from './MenuBar';
import { OverviewScreen } from './Overview';
import { CabinetScreen, PatientScreen } from './Patient';
import { deleteLocalFiles } from './Print';
import { ReferralScreen } from './Referral';
import { setToken } from './Rest';
import { RoomScreen } from './Room';
import { getUserLanguage } from './Strings';
import { isWeb, styles } from './Styles';
import type {
  Account,
  CodeDefinition,
  Configuration,
  Store,
  User
} from './Types';
import { fetchUserSettings } from './User';
import { getCurrentRoute } from './Util';
import { fetchVisitTypes } from './Visit';
import { VisitTypeTemplateScreen } from './VisitType';
import createDoctorAppNavigator from './utilities/CustomStack';
import NavigationService from './utilities/NavigationService';
import PropTypes from 'prop-types'

let account: Account;
let doctor: User;
let store: Store;

export function getAccount(): Account {
  return account;
}

async function setAccount(selectedAccount: Account) {
  account = selectedAccount;
  let accountChanged: boolean = true;
  if (selectedAccount?.id) {
    const selectedAccountId: number = selectedAccount.id;
    const accountId: number = await AsyncStorage.getItem('accountId');
    accountChanged = accountId != selectedAccountId;
    if (accountChanged) {
      await AsyncStorage.setItem('accountId', selectedAccountId?.toString());
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

const NavContainer = ({ logout, setNavigator, navigationStateChanged }) => {
  const StackNavigator = createDoctorAppNavigator();
  
  return (
    <NavigationContainer 
      ref={(navigator) => setNavigator(navigator)}
      onStateChange={navigationStateChanged}
    >
      <StackNavigator.Navigator initialRouteName="overview" screenOptions={{ headerShown: false }} >
          <StackNavigator.Screen name="overview">
            {(props) => <OverviewScreen {...props} onLogout={logout} />}
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

NavContainer.propTypes = {
  logout: PropTypes.func, 
  setNavigator: PropTypes.func,  
  navigationStateChanged: PropTypes.func
}

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
      if (inactivityTimer?.code) {
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
                <NavContainer 
                  logout={this.logout} 
                  setNavigator={(navigatorRef) => this.setNavigator(navigatorRef)} 
                  navigationStateChanged={this.navigationStateChanged}
                />
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

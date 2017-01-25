/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Image, Text, TextInput, View, StatusBar, Dimensions, Button,  NavigationExperimental, ScrollView} from 'react-native';
const {CardStack: NavigationCardStack, StateUtils: NavigationStateUtils} = NavigationExperimental;
import { AppointmentScreen, AppointmentsSummary, fetchAppointments } from './Appointment';
import type {Appointment, Patient, PatientInfo, Exam } from './Types';
import { Reminders } from './Reminders';
import { Today } from './Today';
import { PatientScreen } from './Patient';
import { ExamScreen } from './Exam';
import { styles, fontScale } from './Styles';
import { MenuBar, Notifications } from './MenuBar';
import { FindPatient } from './FindPatient';
import { FindPatientScreen } from './FindPatient';

class WorkFlow extends Component {
    render() {
        return <ScrollView>
            <View style={styles.store}>
                <View style={styles.room}>
                    <Text style={styles.h3}>Entrance</Text>
                </View>
                <View style={styles.room}>
                    <Text style={styles.h3}>Waiting Room</Text>
                </View>
                <View style={styles.room}>
                    <Text style={styles.h3}>Cabinet 1</Text>
                    <Text style={styles.h3}>Cabinet 2</Text>
                </View>
                <View style={styles.room}>
                    <Text style={styles.h3}>Frame station 1</Text>
                    <Text style={styles.h3}>Frame station 2</Text>
                    <Text style={styles.h3}>Frame station 3</Text>
                </View>
                <View style={styles.room}>
                    <Text style={styles.h3}>Contact station 1</Text>
                    <Text style={styles.h3}>Contact station 2</Text>
                </View>
                <View style={styles.room}>
                    <Text style={styles.h3}>In store</Text>
                </View>
                <View style={styles.room}>
                    <Text style={styles.h3}>Cash desk</Text>
                </View>
                <View style={styles.room}>
                    <Text style={styles.h3}>Exit</Text>
                </View>
            </View>
        </ScrollView>
    }
}

class OverviewScreen extends Component {
    state: {
        appointments: Appointment[]
    }
    constructor(props: any) {
        super(props);
        this.state = {
            appointments: []
        }
    }

    render() {
        return <View style={styles.page}>
            <AppointmentsSummary appointments={this.state.appointments} onNavigationChange={this.props.onNavigationChange} />
            <WorkFlow />
            {/** <FindPatient popupResults={true}
                onSelectPatient={(patient: Patient) => this.props.onNavigationChange('showPatient', patient)}
                onNewPatient={(searchCriterium: string) => this.props.onNavigationChange('newPatient', searchCriterium)} />*/}
            <View style={styles.buttonsRowLayout}>
                <View style={[styles.flow]}>
                    <View style={styles.tabCard}><Text style={styles.h3}>Agenda</Text></View>
                    <View style={styles.tabCard}><Text style={styles.h3}>Reminders</Text></View>
                    <View style={styles.tabCard}><Text style={styles.h3}>Configuration</Text></View>
                    <View style={styles.tabCard}><Text style={styles.h3}>Customisation</Text></View>
                </View>
            </View>
        </View >
    }

    componentDidMount() {
        const appointments = fetchAppointments();
        this.setState({ appointments: appointments });
    }
}

class OverviewNavigator extends Component {
    props: {
        navigationState: {
            index: number,
            routes: { key: string, scene: string, menuHidden?: boolean }[]
        },
        onNavigationChange: (action: string, data: any) => void,
        onUpdate: (itemType: string, item: any) => void
    }
    constructor(props: any, context: any) {
        super(props, context);
    }


    render() {
        return <NavigationCardStack enableGestures={true}
            onPop={() => this.props.onNavigationChange('back')}
            onNavigateBack={() => this.props.onNavigationChange('back')}
            navigationState={this.props.navigationState}
            renderScene={(sceneProps) => this.renderScene(sceneProps)}
        />
    }

    // The detailed spec of `sceneProps` is defined at `NavigationTypeDefinition`
    // as type `NavigationSceneRendererProps`.
    renderScene(sceneProps: Object) {
        const scene = sceneProps.scene.route.scene;
        const patientInfo: PatientInfo = sceneProps.scene.route.patientInfo;
        switch (scene) {
            case 'overview':
                return <OverviewScreen onNavigationChange={this.props.onNavigationChange} />;
            case 'findPatient':
                return <FindPatientScreen onNavigationChange={this.props.onNavigationChange}
                  onUpdatePatientInfo={(patientInfo: PatientInfo) => this.props.onUpdate('PatientInfo', patientInfo)} />;
            case 'reminders':
                return <Reminders onNavigationChange={this.props.onNavigationChange} />;
            case 'today':
                return <Today onNavigationChange={this.props.onNavigationChange} />;
            case 'appointment':
                let appointment: Appointment = sceneProps.scene.route.appointment;
                return <AppointmentScreen appointment={appointment} patientInfo={patientInfo} onNavigationChange={this.props.onNavigationChange} onUpdate={this.props.onUpdate} />;
            case 'patient':
                let searchCriterium: string = sceneProps.scene.route.searchCriterium;
                return <PatientScreen searchCriterium={searchCriterium} patientInfo={patientInfo} onNavigationChange={this.props.onNavigationChange}
                  onUpdatePatientInfo={(patientInfo: PatientInfo) => this.props.onUpdate('PatientInfo', patientInfo)} />
            case 'exam':
                let exam: Exam = sceneProps.scene.route.exam;
                return <ExamScreen exam={exam} onNavigationChange={this.props.onNavigationChange} onUpdateExam={(exam: Exam) => this.props.onUpdate('Exam',exam)} />
        }
    }
}

export class DoctorApp extends Component {
    state: {
        statusMessage: string,
        navigationState: {
            index: number,
            routes: { key: string, scene: string, menuHidden?: boolean, appointment?: Appointment }[]
        }

    }
    constructor(props: any) {
        super(props);
        this.state = {
            statusMessage: "Welcome to Wink EHR Dr. " + this.props.user.lastName + ".",
            navigationState: {
                index: 0,
                routes: [{ key: '0', scene: 'overview', menuHidden: false }],
            }
        }
    }

    onNavigationChange(action: string, data: any): void {
        let {navigationState} = this.state;
        let replaceLastScene: boolean = false;
        switch (action) {
            case 'back':
                navigationState = NavigationStateUtils.pop(navigationState);
                break;
            case 'showAppointments':
                const appointmentsRoute = {
                    key: navigationState.routes.length.toString(),
                    scene: 'appointments',
                };
                navigationState = NavigationStateUtils.push(navigationState, appointmentsRoute);
                break;
            case 'showPatients':
                const patientsRoute = {
                    key: navigationState.routes.length.toString(),
                    scene: 'patients',
                };
                navigationState = NavigationStateUtils.push(navigationState, patientsRoute);
                break;
            case 'showReminders':
                const remindersRoute = {
                    key: navigationState.routes.length.toString(),
                    scene: 'reminders'
                };
                navigationState = NavigationStateUtils.push(navigationState, remindersRoute);
                break;
            case 'showToday':
                replaceLastScene = navigationState.routes[navigationState.index].scene === 'today' || (navigationState.routes[navigationState.index].scene === 'findPatient');
                if (navigationState.routes[navigationState.index].scene === 'today') {
                    //TODO: refresh today
                    console.log('TODO: refresh today');
                    return;
                }
                const todayRoute = {
                    key: replaceLastScene ? (navigationState.routes.length - 1).toString() : navigationState.routes.length.toString(),
                    scene: 'today',
                }
                if (replaceLastScene) {
                    navigationState = NavigationStateUtils.replaceAtIndex(navigationState, this.state.navigationState.routes.length - 1, todayRoute);
                } else {
                    navigationState = NavigationStateUtils.push(navigationState, todayRoute);
                }
                break;
            case 'findPatient':
                replaceLastScene = navigationState.routes[navigationState.index].scene === 'today' || (navigationState.routes[navigationState.index].scene === 'findPatient');
                const findPatientRoute = {
                    key: replaceLastScene ? (navigationState.routes.length - 1).toString() : navigationState.routes.length.toString(),
                    scene: 'findPatient',
                }
                if (replaceLastScene) {
                    navigationState = NavigationStateUtils.replaceAtIndex(navigationState, this.state.navigationState.routes.length - 1, findPatientRoute);
                } else {
                    navigationState = NavigationStateUtils.push(navigationState, findPatientRoute);
                }
                break;
            case 'showAppointment':
                const appointmentRoute = {
                    key: navigationState.routes.length.toString(),
                    scene: 'appointment',
                    appointment: data,
                    patientInfo: data.patient
                };
                navigationState = NavigationStateUtils.push(navigationState, appointmentRoute);
                break;
            case 'newPatient':
                const newPatientRoute = {
                    key: navigationState.routes.length.toString(),
                    scene: 'patient',
                    patient: { lastName: data.searchCriterium }
                };
                navigationState = NavigationStateUtils.push(navigationState, newPatientRoute);
                break;
            case 'showPatient':
                const patientRoute = {
                    key: navigationState.routes.length.toString(),
                    scene: 'patient',
                    patientInfo: data
                };
                navigationState = NavigationStateUtils.push(navigationState, patientRoute);
                break;
            case 'showExam':
                const examRoute = {
                    key: navigationState.routes.length.toString(),
                    scene: 'exam',
                    exam: data
                }
                navigationState = NavigationStateUtils.push(navigationState, examRoute);
                break;
        }
        if (this.state.navigationState !== navigationState) {
            this.setState({ navigationState });
        }
        //console.log(navigationState);
    }

    /**
    componentWillMount() {
                console.log('installing pan responder');
            this._panResponder = PanResponder.create({
                onMoveShouldSetResponderCapture: () => false,
          onMoveShouldSetPanResponderCapture: () => false,
          onPanResponderGrant: (e, gestureState) => {},
          onPanResponderMove: () => console.log('pan responder move'),
          onPanResponderRelease: (e, {vx, vy}) => {}
            });
    }
    */

    onUpdate(itemType: string, item: any) :void {
      if (itemType==='PatientInfo' && this.state.navigationState.routes.length>=2) {
        const patientInfo : PatientInfo = item;
        if (this.state.navigationState.routes[1].scene==='appointment') {
          this.state.navigationState.routes[1].appointment.patient = {patientId: patientInfo.patientId, accountsId: patientInfo.accountsId, firstName: patientInfo.firstName, lastName: patientInfo.lastName};
          this.state.navigationState.routes[1].patientInfo = {...patientInfo};
          //TODO: update patient firstname and lastname in visit.exams
        }
        if (this.state.navigationState.routes.length>=3) {
          if (this.state.navigationState.routes[2].scene==='patient') {
              this.state.navigationState.routes[2].patientInfo = {...patientInfo};
          }
        }
      } else if (itemType==='Exam' && this.state.navigationState.routes.length>=2) {
        const exam : Exam = item;
        if (this.state.navigationState.routes[1].scene==='appointment') {
          //TODO: update exam in selectedVisit
        }
        if (this.state.navigationState.routes[2].scene==='exam') {
            this.state.navigationState.routes[2].exam = {...exam};
        }
      } else {
        console.log('TODO: update '+itemType);
      }
    }

    render() {
        const scene = this.state.navigationState.routes[this.state.navigationState.index]
        return <View style={styles.screeen}>
            <StatusBar hidden={true} />
            <OverviewNavigator
                navigationState={this.state.navigationState}
                onNavigationChange={(action: string, data: any) => this.onNavigationChange(action, data)}
                onUpdate={(itemType: string, item: any) => this.onUpdate(itemType, item)}
            />
            <MenuBar
                hidden={scene.menuHidden}
                backable={this.state.navigationState.index > 0}
                appointment={scene.appointment}
                onNavigationChange={(action: string, data: any) => this.onNavigationChange(action, data)} />
        </View>
    }
}

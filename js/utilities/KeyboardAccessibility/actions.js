/**
 * @flow
 */
 'use strict';

 import React from 'react';
 import { CommonActions } from '@react-navigation/native';
import { getCachedItem } from "../../DataCache";
import { getCurrentRoute } from "../../Util.js";
import NavigationService from "../NavigationService.js";


export function configRightKeyOnExam() {
    const currentRoute = getCurrentRoute(NavigationService.getNavigationState());
    if (currentRoute.name && currentRoute.name !== "exam") {
        return;
    }
    if (NavigationService.isModalVisible()) {
        return;
    }

    const exam: Exam = currentRoute && currentRoute.params
        ? currentRoute.params.exam
        : undefined;

    const nextExam: ?Exam = exam && exam.next ? getCachedItem(exam.next) : undefined;
    const navigation = NavigationService.getTopLevelNavigator();

    nextExam && navigation && navigation.dispatch(
        CommonActions.navigate({
          name: 'exam',
          params: {
            exam: nextExam,
            stateKey: currentRoute.key,
            appointmentStateKey: currentRoute.params.appointmentStateKey,
          }
        })
    );

    nextExam === undefined && 
    navigation && 
    navigation.dispatch(CommonActions.goBack());
}

export function configureLeftKeyOnExam() {
    const currentRoute = getCurrentRoute(NavigationService.getNavigationState());
    if (currentRoute.name && currentRoute.name !== "exam") {
        return;
    }
    if (NavigationService.isModalVisible()) {
        return;
    }

    const exam: Exam = currentRoute && currentRoute.params
        ? currentRoute.params.exam
        : undefined;
    
    const previousExam: ?Exam = exam && exam.previous ? getCachedItem(exam.previous) : undefined;
    const navigation = NavigationService.getTopLevelNavigator();

    previousExam && navigation && navigation.dispatch(
        CommonActions.navigate({
          name: 'exam',
          params: {
            exam: previousExam,
            stateKey: currentRoute.key,
            appointmentStateKey: currentRoute.params.appointmentStateKey,
          }
        })
    );
}

export function configureEscapeKey() {
    const currentRoute = getCurrentRoute(NavigationService.getNavigationState());
    if ((currentRoute.name && currentRoute.name === "lock") || NavigationService.isModalVisible()) {
        return;
    }

    const navigation = NavigationService.getTopLevelNavigator();
    navigation && 
    navigation.dispatch(CommonActions.goBack());
}
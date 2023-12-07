/**
 * @flow
 */
 'use strict';

 import React from 'react';
import { NavigationActions } from "react-navigation";
import { getCachedItem } from "../../DataCache";
import { getValue, isEmpty } from "../../Util.js";
import NavigationService from "../NavigationService.js";


function getCurrentRoute(): any {
    const navigation = NavigationService.getTopLevelNavigator();
    if (navigation) {
        if (
            !isEmpty(getValue(navigation, 'state.nav.routes')) &&
            Array.isArray(navigation.state.nav.routes)
        ) {
          return navigation.state.nav.routes[
            navigation.state.nav.routes.length - 1
          ]
        }
    }
    return undefined;
}

export function configRightKeyOnExam() {
    const currentRoute = getCurrentRoute();
    if (currentRoute.routeName && currentRoute.routeName !== "exam") {
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

    nextExam && navigation && navigation.dispatch({
        type: NavigationActions.NAVIGATE,
        routeName: 'exam',
        params: {
            exam: nextExam,
            stateKey: currentRoute.key,
        }
    }); 

    nextExam === undefined && 
    navigation && 
    navigation.dispatch({type: NavigationActions.BACK});
}

export function configureLeftKeyOnExam() {
    const currentRoute = getCurrentRoute();
    if (currentRoute.routeName && currentRoute.routeName !== "exam") {
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

    previousExam && navigation && navigation.dispatch({
        type: NavigationActions.NAVIGATE,
        routeName: 'exam',
        params: {
            exam: previousExam,
            stateKey: currentRoute.key,
        }
    });
}

export function configureEscapeKey() {
    const currentRoute = getCurrentRoute();
    if ((currentRoute.routeName && currentRoute.routeName === "lock") || NavigationService.isModalVisible()) {
        return;
    }

    const navigation = NavigationService.getTopLevelNavigator();
    navigation && 
    navigation.dispatch({type: NavigationActions.BACK});
}
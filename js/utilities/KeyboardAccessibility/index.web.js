/**
 * @flow
 */
 'use strict';

import React from 'react';
import * as KeyboardAccessibilityActions from "./actions";


function startTracking(): void {
    window.addEventListener('keyup', handleKeyboardEvent, true);
}

function stopTracking(): void {
    window.removeEventListener('keyup', handleKeyboardEvent, true);
}

function isEditableField(event: any) {
    if (event.target.nodeName == "INPUT" || event.target.nodeName == "TEXTAREA" || event.target.isContentEditable) {
        return true;
    } 
    return false;
}

function handleKeyboardEvent (event) {
    // __DEV__ && console.log("Keyboard event: ", event);
    
    switch (event.keyCode) {
        case 27:
            //escape key
            KeyboardAccessibilityActions.configureEscapeKey();
            break;
        case 37:
            //ArrowLeft
            !isEditableField(event) && KeyboardAccessibilityActions.configureLeftKeyOnExam();
            break;
        case 39: 
            //ArrowRight
            !isEditableField(event) && KeyboardAccessibilityActions.configRightKeyOnExam();
            break;
        default:
            //do nothing
    }
}




export default {
    startTracking,
    stopTracking
};
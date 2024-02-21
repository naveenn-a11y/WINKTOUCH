/**
 * @flow
 */
 'use strict';
 import React from 'react';
 import { NativeEventEmitter, NativeModules } from "react-native";
 import * as KeyboardAccessibilityActions from "./actions";

let _keyboardTracker = null;
let _iosKeybooardTrackerEmitter = null;
let _iosKeyEventSubscription = null;

let _keyConfigJson = [];

function startTracking(): void {
    _keyboardTracker = NativeModules.EventTrackerModule;
    _iosKeybooardTrackerEmitter = NativeModules.EventTrackerModule ? new NativeEventEmitter(NativeModules.EventTrackerModule) : null;

    if(_keyboardTracker) {
        loadConfig();
        _keyboardTracker.setKeyCommandsWithJSON(_keyConfigJson);
        _iosKeyEventSubscription = _iosKeybooardTrackerEmitter.addListener('onKeyUp', (keyEvent) => {handleKeyboardEvent(keyEvent)} );
    }
}


function stopTracking(): void {
    _iosKeyEventSubscription ? _iosKeyEventSubscription.remove() : () => {};
}


function handleKeyboardEvent (event: KeyCommand) {
    // __DEV__ && console.log("Keyboard event: ", event);

    if (event.input === _keyboardTracker.keyInputEscape) {
        KeyboardAccessibilityActions.configureEscapeKey();
    } else if(event.input === _keyboardTracker.keyInputLeftArrow) {
        KeyboardAccessibilityActions.configureLeftKeyOnExam();
    } else if(event.input === _keyboardTracker.keyInputRightArrow) {
        KeyboardAccessibilityActions.configRightKeyOnExam();
    } else {
        //do nothing
    }
}
/**
 * Set up key input to listen for
 *  e.g: 
 * [
        {
          input: "c",
          keyModifier: _keyboardTracker.keyModifierShift,
          discoverabilityTitle: "Perform action shift + c"
        }
      ];
 * @returns 
 */
function loadConfig() {
    if(!_keyboardTracker) { return; }

    _keyConfigJson = [
        {
          input: _keyboardTracker.keyInputRightArrow
        },
        {
          input: _keyboardTracker.keyInputLeftArrow
        },
        {
          input: _keyboardTracker.keyInputEscape
        }
      ];
}


export default {
    startTracking,
    stopTracking
};
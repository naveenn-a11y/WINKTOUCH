/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import {StyleSheet, Image, Text, View, Navigator, TouchableHighlight} from 'react-native';
import {styles} from './Styles';
import LoginScreen from './LoginScreen';
import PatientDetails from './PatientDetails';

export default class JsNavigation extends Component {
  constructor(props) {
    super(props);
    this.routes = [
      { title: 'Login', index: 0 },
      { title: 'Overview', index: 1 },
      { title: 'Patient', index: 2 },
    ];
  }

  renderNavigation(sceneIndex, navigator) {
    if (sceneIndex === 0) {
      return;
    }
    return <View style={{ flex: 0, width: 400, flexDirection: 'row', backgroundColor: '#bbbb00', justifyContent: 'space-around'} }>
      <TouchableHighlight onPress = {() => navigator.pop() }>
        <Text>Back</Text>
      </TouchableHighlight>
      {this.routes.map(function (route) {
        if (route.index > 0) {
          return <TouchableHighlight key={route.index} onPress = {() => navigator.push(route) }>
            <Text>{route.title}</Text>
          </TouchableHighlight>
        }
      }) }
    </View>
  }

  renderBody(sceneIndex, navigator) {
    if (sceneIndex === 0) {
      return <LoginScreen onChange={(data) => navigator.push(this.routes[1]) }/>
    }
    if (sceneIndex==2) {
      return <PatientDetails/>
    }
    return <View style={styles.container} >
      <Text>
        this is the {this.routes[sceneIndex].title} scene.
      </Text>

    </View>
  }

  renderScene(route, navigator) {
    <View style={styles.container}>
      {this.renderNavigation(route.index, navigator) }
      {this.renderBody(route.index, navigator) }
    </View>
  }

  render() {
    return <Navigator
      initialRoute={this.routes[0]}
      initialRouteStack={this.routes}
      configureScene={(route, routeStack) =>
        Navigator.SceneConfigs.HorizontalSwipeJump}
      renderScene={(route, navigator) => <View style={styles.container}>
        {this.renderNavigation(route.index, navigator) }
        {this.renderBody(route.index, navigator) }
      </View>
    }/>
  }
}

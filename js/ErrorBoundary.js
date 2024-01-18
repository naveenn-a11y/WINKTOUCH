import React, {Component} from 'react';
import {Text, View, SafeAreaView, StyleSheet, Platform} from 'react-native';
import {Avatar, Button, Card, Title, Paragraph} from 'react-native-paper';
import { CommonActions } from '@react-navigation/native';
import {isWeb} from './Styles';
import codePush from 'react-native-code-push';
import {getUserLanguage, strings} from './Strings';
import {getCurrentHost} from '../scripts/Util';
import {getRestUrl, getToken} from './Rest';
import {bundleVersion, deploymentVersion, touchVersion} from './Version';
async function postLogService(error: any, errorInfo: any): void {
  let url = getRestUrl() + 'Logger/';
  try {
    const searchCriteria = {
      entity: 'emr-' + Platform.OS,
      version: `${deploymentVersion}.${touchVersion}.${bundleVersion}`,
      error: error.toString(),
      errorInfo: errorInfo.componentStack.toString(),
    };
    await fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        token: getToken(),
        Accept: 'application/json',
        'Accept-language': getUserLanguage(),
      },
      body: JSON.stringify(searchCriteria),
    });
  } catch (error) {
    console.log(error);
  }
}

export class VisitErrorBoundary extends Component {
  props: {
    navigation: any,
  };

  constructor(props: any) {
    super(props);

    this.state = {hasError: false};
  }

  static getDerivedStateFromError(error) {
    return {hasError: true};
  }
  componentDidMount() {}

  componentDidCatch(error, errorInfo) {
    postLogService(error, errorInfo);
    console.error(error.toString());
    console.error(errorInfo.componentStack.toString());
  }

  navigate() {
    this.props.navigation.dispatch(
      CommonActions.navigate({
        name: 'agenda'
      })
    );
  }

  restart() {
    this.props.navigation.goBack();
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.container}>
            <Card>
              <Card.Content>
                <Title style={styles.paragraph}>
                  {strings.somethingWentWrongVisitTitle}
                </Title>
              </Card.Content>
              <Card.Actions
                style={{
                  justifyContent: 'center',
                  textAlign: 'center',
                }}>
                <Button onPress={() => this.restart()}>
                  {strings.reloadVisitTitle}
                </Button>
              </Card.Actions>
            </Card>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export class ErrorBoundary extends Component {
  props: {
    navigator: any,
  };

  constructor(props: any) {
    super(props);

    this.state = {hasError: false};
  }

  static getDerivedStateFromError(error) {
    return {hasError: true};
  }
  componentDidMount() {}

  componentDidCatch(error, errorInfo) {
    postLogService(error, errorInfo);
    console.error(error.toString());
    console.error(errorInfo.componentStack.toString());
  }

  navigate() {
    this.props.navigation.dispatch(
      CommonActions.navigate({
        name: 'agenda'
      })
    );
  }

  restart() {
    if (isWeb) {
      window.location.href = getCurrentHost();
    } else {
      codePush.restartApp();
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.container}>
            <Card>
              <Card.Content>
                <Title style={styles.paragraph}>
                  {strings.somethingWentWrongTitle}
                </Title>
                <Paragraph style={styles.paragraph}>
                  {strings.somethingWentWrongMessage}
                </Paragraph>
              </Card.Content>

              <Card.Actions
                style={{
                  justifyContent: 'center',
                  textAlign: 'center',
                }}>
                <Button onPress={() => this.restart()}>
                  {strings.restartApp}
                </Button>
              </Card.Actions>
            </Card>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#ecf0f1',
  },
  paragraph: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
  },
});

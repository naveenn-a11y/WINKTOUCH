import React, {Component} from 'react';
import {Text, View, SafeAreaView, StyleSheet} from 'react-native';
import {EhrApp} from './EhrApp';
import {Avatar, Button, Card, Title, Paragraph} from 'react-native-paper';
import {NavigationActions} from 'react-navigation';
export default class ErrorBoundary extends Component {
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
  componentDidMount() {
    //   console.log('NAVVVV: ' + JSON.stringify(this.props));
  }

  componentDidCatch(error, errorInfo) {
    // logErrorToMyService(error, errorInfo);
  }

  navigate() {
    this.props.navigator.dispatch({
      type: NavigationActions.NAVIGATE,
      routeName: 'agenda',
    });
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
                  Oops! Something when wrong.
                </Title>
                <Paragraph style={styles.paragraph}>
                  Sorry, Something went wrong there. See the action below !
                </Paragraph>
              </Card.Content>

              <Card.Actions
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  textAlign: 'center',
                }}></Card.Actions>
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

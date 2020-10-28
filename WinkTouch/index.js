/**
 * @format
 */

import {AppRegistry, Platform} from 'react-native';
import Index from './js/Index';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => Index);
if (Platform.OS === 'web') {
  AppRegistry.runApplication(appName, {
    rootTag: document.getElementById('root'),
  });
}

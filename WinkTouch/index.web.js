import {AppRegistry, Platform} from 'react-native';
import Index from './js/Index';
import {name as appName} from './app.json';
import {setIconsConfig} from './web/Util';

AppRegistry.registerComponent(appName, () => Index);
if (Platform.OS === 'web') {
  setIconsConfig();
  AppRegistry.runApplication(appName, {
    rootTag: document.getElementById('root'),
  });
}

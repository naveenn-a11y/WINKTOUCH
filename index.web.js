import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import Index from './js/Index';
import { setIconsConfig } from './web/Util';

AppRegistry.registerComponent(appName, () => Index);
setIconsConfig();
AppRegistry.runApplication(appName, {rootTag: document.getElementById('root')});

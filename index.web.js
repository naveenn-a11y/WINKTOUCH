import ReactGA from "react-ga4";
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import Index from './js/Index';
import { setIconsConfig } from './web/Util';

ReactGA.initialize(process.env.WINK_APP_HOST ?? 'G-B8CSV07K1J');
AppRegistry.registerComponent(appName, () => Index);
setIconsConfig();
AppRegistry.runApplication(appName, {rootTag: document.getElementById('root')});

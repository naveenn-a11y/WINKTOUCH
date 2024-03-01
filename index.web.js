import {AppRegistry} from 'react-native';
import Index from './js/Index';
import {name as appName} from './app.json';
import {setIconsConfig} from './web/Util';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

AppRegistry.registerComponent(appName, () => Index);
setIconsConfig();
AppRegistry.runApplication(appName, {rootTag: document.getElementById('root')});

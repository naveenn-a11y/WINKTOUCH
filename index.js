/**
 * @format
 */

import {AppRegistry} from 'react-native';
import Index from './js/Index';
import {name as appName} from './app.json';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

AppRegistry.registerComponent(appName, () => Index);


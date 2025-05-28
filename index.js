/**
 * @format
 */

import { ReactNativePlugin } from '@microsoft/applicationinsights-react-native';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import Index from './js/Index';

var RNMPlugin = new ReactNativePlugin();
var appInsights = new ApplicationInsights({
    config: {
        instrumentationKey: process.env.APP_INSIGHT_KEY,
        extensions: [RNMPlugin]
    }
});

appInsights.loadAppInsights();
AppRegistry.registerComponent(appName, () => Index);


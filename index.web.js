import { ReactNativePlugin } from '@microsoft/applicationinsights-react-native';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import ReactGA from "react-ga4";
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import Index from './js/Index';
import { setIconsConfig } from './web/Util';

const RNPlugin = new ReactNativePlugin();
const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: process.env.APP_INSIGHT_KEY,
    extensions: [RNPlugin],
    extensionConfig: {
      [RNPlugin.identifier]: {
        // optional config for the plugin
      }
    }
  }
});

appInsights.loadAppInsights();
ReactGA.initialize(process.env.GOOGLE_TAG_ID ?? 'G-B8CSV07K1J');
AppRegistry.registerComponent(appName, () => Index);
setIconsConfig();
AppRegistry.runApplication(appName, {rootTag: document.getElementById('root')});

import { ReactNativePlugin } from '@microsoft/applicationinsights-react-native';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

// Create the plugin instance
const RNPlugin = new ReactNativePlugin();

// Configure Application Insights
const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: '07438b9c-d293-4021-a954-afb1dec598ca',
    extensions: [RNPlugin],
    extensionConfig: {
      [RNPlugin.identifier]: {
        // optional config for the plugin
      }
    }
  }
});

// Initialize
appInsights.loadAppInsights();

// Make it globally accessible
global.appInsights = appInsights;

export default appInsights;

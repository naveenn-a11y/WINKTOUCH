import {NavigationActions} from 'react-navigation';

this._navigator = null;

function setTopLevelNavigator(navigationRef) {
  this._navigator = navigationRef;
}

function navigate(routeName, params) {
  if (this._navigator) {
    this._navigator.dispatch({
      type: NavigationActions.NAVIGATE,
      routeName,
      params,
    });
  }
}

function dismissLockScreen() {
  if (this._navigator) {
    if (
      this._navigator.state.nav.routes &&
      Array.isArray(this._navigator.state.nav.routes)
    ) {
      if (
        this._navigator.state.nav.routes[
          this._navigator.state.nav.routes.length - 1
        ].routeName === 'lock'
      ) {
        this._navigator.dispatch({type: NavigationActions.BACK});
      }
    }
  }
}

function getPreviousRoute() {
  return  this._navigator &&
  this._navigator.state.nav.routes &&
  Array.isArray(this._navigator.state.nav.routes) &&
  this._navigator.state.nav.routes.length > 1 ? this._navigator.state.nav.routes[this._navigator.state.nav.routes.length - 2] : undefined;
}

export default {
  navigate,
  setTopLevelNavigator,
  dismissLockScreen,
  getPreviousRoute,
};

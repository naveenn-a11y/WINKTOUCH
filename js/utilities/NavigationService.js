import {NavigationActions} from 'react-navigation';
import {cacheItem, getCachedItem} from '../DataCache';

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

function getTopLevelNavigator() : NavigationContainerComponent {
  return this._navigator;
}

function setModalVisibility(isModalVisible: boolean, componentKey: string){
  const visibleModalList = getCachedItem("_visibleModalList") ?? new Map();

  if (isModalVisible === true) {
    visibleModalList.set(componentKey, true);
  } else if (isModalVisible === false && visibleModalList.has(componentKey)) {
    visibleModalList.delete(componentKey);
  }

  cacheItem("_visibleModalList", visibleModalList);
}

function isModalVisible() : boolean {
  const visibleModalList = getCachedItem("_visibleModalList") ?? new Map();
  return visibleModalList.size > 0;
}

export default {
  navigate,
  setTopLevelNavigator,
  dismissLockScreen,
  getTopLevelNavigator,
  setModalVisibility,
  isModalVisible,
};

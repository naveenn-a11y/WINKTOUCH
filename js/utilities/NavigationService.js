import { CommonActions } from '@react-navigation/native';
import {cacheItem, getCachedItem} from '../DataCache';
import { getCurrentRoute } from '../Util';

this._navigator = null;
this._navigationState = {};

function setTopLevelNavigator(navigationRef) {
  this._navigator = navigationRef;
}

function setNavigationState(navigationState) {
  this._navigationState = navigationState;
}

function getNavigationState() {
  return this._navigationState;
}

function navigate(routeName, params) {
  if (this._navigator) {
    this._navigator.dispatch(
      CommonActions.navigate({
        name: routeName,
        params: params
      })
    );
  }
}

function dismissLockScreen() {
  if (this._navigator) {
    const currentRoute = getCurrentRoute(this._navigationState);
    if ((currentRoute.name && currentRoute.name === "lock")) {
      this._navigator.dispatch(CommonActions.goBack());
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

function setParams(params) {
  return CommonActions.setParams(params);
}

export default {
  navigate,
  setTopLevelNavigator,
  dismissLockScreen,
  getTopLevelNavigator,
  setModalVisibility,
  isModalVisible,
  setParams,
  setNavigationState,
  getNavigationState,
};

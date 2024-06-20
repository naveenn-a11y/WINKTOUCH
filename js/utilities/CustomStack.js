import * as React from 'react'
import { useNavigationBuilder, createNavigatorFactory, StackRouter } from '@react-navigation/native'
import { StackView } from '@react-navigation/stack'

const CustomStackRouter = options => {
  const router = StackRouter(options);
  const replaceRoutes: string[] = ['findPatient', 'examHistory', 'examGraph'];

  return {
    ...router,
    getStateForAction(state, action, options) {
      const newState = router.getStateForAction(state, action, options);

      if (state && action.type === "NAVIGATE") {
        if (replaceRoutes.includes(state.routes[state.index].name)) {
          action.type = "REPLACE";
        }
      }

      if (!state && action.payload.name !== 'overview') {
        newState.routes[0].name = 'overview';
        newState.routes[0].params = {refreshAppointments: false};
      }

      if (state && action.type === "GO_BACK") {
        if (state.index === 1) {
          newState.routes[0].params = {refreshAppointments: true};
        }
      }
      
      return newState;
    },
  };
};

function DoctorNavigator({ initialRouteName, children, screenOptions, ...rest }) {
  const { state, descriptors, navigation } = useNavigationBuilder(CustomStackRouter, {
    initialRouteName,
    children,
    screenOptions,
  })
  
  return <StackView {...rest} state={state} navigation={navigation} descriptors={descriptors} />
}

export default createNavigatorFactory(DoctorNavigator)
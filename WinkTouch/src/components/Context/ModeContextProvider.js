import React, {Component} from 'react';
import {isWeb} from '../../../js/Styles';

const ModeContext = React.createContext();

const MODE = {
  DESKTOP: 'desktop',
  TABLET: 'tablet',
};
class ModeContextProvider extends Component {
  state = {
    keyboardMode: isWeb ? MODE.DESKTOP : MODE.TABLET,
  };

  toggleMode = () => {
    this.setState((prevState) => {
      return {
        keyboardMode:
          prevState.keyboardMode === MODE.DESKTOP ? MODE.TABLET : MODE.DESKTOP,
      };
    });
  };
  render() {
    return (
      <ModeContext.Provider
        value={{
          keyboardMode: this.state.keyboardMode,
          toggleMode: this.toggleMode,
        }}>
        {this.props.children}
      </ModeContext.Provider>
    );
  }
}

export {ModeContextProvider, ModeContext};

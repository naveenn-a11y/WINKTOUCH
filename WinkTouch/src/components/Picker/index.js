import React from 'react';
import DropDown from 'react-native-paper-dropdown';

export default ({mode, visible, onClose, onShow, onChange, options}) => (
  <DropDown
    value={mode}
    visible={visible}
    showDropDown={onShow}
    onDismiss={onClose}
    setValue={onChange}
    list={options}
  />
);

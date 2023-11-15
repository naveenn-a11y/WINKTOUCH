import React from 'react';
import {fontScale} from '../../../js/Styles';
import {strings} from '../../../js/Strings';
import {Picker} from 'react-native';
export default ({mode, visible, onClose, onShow, onChange, options}) => (
  <Picker
    style={{width: 200, padding: 10 * fontScale}}
    itemStyle={{height: 44, borderWidth: 1, borderColor: 'gray'}}
    selectedValue={mode}
    onValueChange={onChange}>
    <Picker.Item value="day" label={strings.daily} />
    <Picker.Item value="custom" label={strings.weekly} />
  </Picker>
);

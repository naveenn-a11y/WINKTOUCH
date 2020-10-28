import RNBeep from 'react-native-a-beep';

export const playSound = () => {
  RNBeep.PlaySysSound(RNBeep.AndroidSoundIDs.TONE_CDMA_ABBR_ALERT);
};
export const test = 'hello android';

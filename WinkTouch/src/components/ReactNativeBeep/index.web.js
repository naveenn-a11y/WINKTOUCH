import RNBeep from 'react-native-a-beep';

export const playSound = () => {
  console.log('Not supported' + JSON.stringify(RNBeep));
  RNBeep.PlaySysSound(RNBeep.AndroidSoundIDs.TONE_CDMA_ABBR_ALERT);
};
export const test: string = 'hello web';

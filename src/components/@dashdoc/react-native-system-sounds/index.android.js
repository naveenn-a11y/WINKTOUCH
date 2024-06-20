import RNBeep from '@dashdoc/react-native-system-sounds';

export const playSound = () => {
  RNBeep.play(RNBeep.AndroidSoundIDs.TONE_CDMA_ABBR_ALERT);
};
export const test = 'hello android';

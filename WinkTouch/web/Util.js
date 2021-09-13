import {Platform} from 'react-native';

import materialCommunityFont from 'react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf';
import antDesignFont from 'react-native-vector-icons/Fonts/AntDesign.ttf';
import materialFont from 'react-native-vector-icons/Fonts/MaterialIcons.ttf';

export const setIconsConfig = () => {
  const materialCommunityFontStyles = `@font-face {
  src: url(${materialCommunityFont});
  font-family: MaterialCommunityIcons;
}`;
  const antDesignOconFontStyles = `@font-face {
  src: url(${antDesignFont});
  font-family: AntDesign;
}`;

  const materialFontStyles = `@font-face {
  src: url(${materialFont});
  font-family: MaterialIcons;
}`;

  if (Platform.OS === 'web') {
    const style = document.createElement('style');
    style.type = 'text/css';
    if (style.styleSheet) {
      style.styleSheet.cssText = materialCommunityFontStyles;
      style.styleSheet.cssText += antDesignOconFontStyles;
      style.styleSheet.cssText += materialFontStyles;


    } else {
        style.appendChild(document.createTextNode(materialCommunityFontStyles));
        style.appendChild(document.createTextNode(antDesignOconFontStyles));
        style.appendChild(document.createTextNode(materialFontStyles));


    }
    document.head.appendChild(style);


  }
};

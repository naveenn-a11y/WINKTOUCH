/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Editor, Provider, Tools } from 'react-native-tinymce';
import { styles } from './Styles';

type ReferralScreenProps = {
  navigation: any
};

type ReferralScreenState = {
};

export class ReferralScreen extends Component<ReferralScreenProps, ReferralScreenState> {
  render() {
    return <View style={styles.pageEditor}>
        <Provider>
          <Editor
            ref={ ref => this.editor = ref }
            value="<H2>Hello world!</H2>"
          />
          <Tools />
          </Provider>
    </View>
  }
}

/**
 * @flow
 */
'use strict';

import React from 'react';
import {StyleSheet} from 'react-native';
import {styles, windowHeight, fontScale} from '../../../js/Styles';
import {Editor} from '@tinymce/tinymce-react';

interface EditorProps {
  /**
   * CSS to apply to the HTML content inside the editor.
   *
   * https://www.tiny.cloud/docs/configure/content-appearance/#content_style
   */
  contentCss?: string;

  /**
   * Styles to apply to the web view.
   */
  style?: any;

  /**
   * Initial HTML content for the editor.
   */
  value?: string;
}
interface EditorState {
  activeEditor?: any;
}

export class HtmlEditor extends React.Component<EditorProps, EditorState> {
  constructor(props: EditorProps) {
    super(props);
    this.state = {
      activeEditor: undefined,
    };
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.value !== prevProps.value) {
      this.setContent(this.props.value);
    }
  }
  async getContent(): string {
    return this.state.activeEditor.getContent({format: 'raw'});
  }

  async isDirty(): Boolean {
    return this.state.activeEditor.isDirty();
  }

  insertContent(html: string) {
    __DEV__ && console.log('Inserting raw html: ' + html);
    this.state.activeEditor.selection.setContent(`${html}`, {format: 'raw'});
  }

  setContent(html: string) {
    __DEV__ && console.log('Set raw html: ' + html);
    this.state.activeEditor.setContent(`${html}`, {format: 'raw'});
  }

  afterSave() {
    let javaScript: string = 'tinymce.activeEditor.setDirty(false)';
    this.state.activeEditor.setDirty(false);
  }

  render() {
    return (
      <Editor
        tinymceScriptSrc="https://ws-touch.downloadwink.com/tinymce/js/tinymce/tinymce.min.js"
        initialValue={this.props.value}
        init={{
          setup: (editor) => {
            this.setState({activeEditor: editor}),
              editor.on('init', function (e) {
                editor.setContent(this.props.value, {format: 'raw'});
              });
          },
          images_dataimg_filter: function (img) {
            return img.hasAttribute('internal-blob');
          },
          selector: '#mytextarea',
          height: windowHeight - 150 * fontScale,
          branding: false,
          statusbar: false,
          removed_menuitems: 'newdocument',
          extended_valid_elements:
            'svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]',
          plugins: [
            'advlist autolink lists link image charmap print  anchor',
            'searchreplace visualblocks code fullscreen',
            'insertdatetime media table paste code help wordcount',
          ],
        }}
        ref={this.state.activeEditor}
      />
    );
  }
}

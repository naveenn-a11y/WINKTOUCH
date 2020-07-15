/**
 * @flow
 */
'use strict';

import React from 'react';
import {StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent} from 'react-native-webview';
import { styles } from './Styles';


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

export class HtmlEditor extends React.Component<EditorProps> {
	resolveContent : ( content: string ) => void = null;

	async getContent(): Promise<string> {
		return new Promise( ( resolve, reject ) => {
			this.resolveContent = resolve;
			this.refs.webref.injectJavaScript(`
				window.ReactNativeWebView.postMessage(JSON.stringify({
					type: 'getContent',
					html: tinymce.activeEditor.getContent({format: 'raw'})
				}));
			`);
		});
	}

	insertContent(html: string) {
		__DEV__ && console.log('Inserting raw html: '+html);
		let javaScript : string = `tinymce.activeEditor.selection.setContent(\`${html}\`, {format: 'raw'})`;
		this.refs.webref.injectJavaScript(javaScript);
	}

	setContent(html: string) {
		__DEV__ && console.log('Set raw html: '+html);
		let javaScript : string = `tinymce.activeEditor.setContent(\`${html}\`, {format: 'raw'})`;
		this.refs.webref.injectJavaScript(javaScript);
	}

	webCallback = ( event: WebViewMessageEvent ) => {
		const data: any = JSON.parse( event.nativeEvent.data );
		if (this.resolveContent) {
			this.resolveContent( data.html );
		}
	}

	render() {
		let html : string = '<!DOCTYPE html>'+
		'<html>'+
		'<head>'+
		'  <script src="https://ws-touch.downloadwink.com/tinymce/js/tinymce/tinymce.min.js" referrerpolicy="origin"></script>'+
		'  <script type="text/javascript">'+
		'  tinymce.init({'+
		'    selector: \'#mytextarea\','+
		'    height: \'680\','+
		'	   branding: false,'+
		'    statusbar: false,'+
		'    extended_valid_elements: "svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]",'+
		'    images_dataimg_filter: function(img) {' +
   	'		    return img.hasAttribute(\'internal-blob\');'+
  	'		 },'+
		'    setup: function (editor) {'+
		'           editor.on(\'init\', function (e) {'+
		'            editor.setContent(`'+this.props.value+'`, {format: \'raw\'});'+
		'          });'+
		'      }'+
		'  });'+
		'  </script>'+
		'</head>'+
		'<body>'+
		'    <textarea id="mytextarea"></textarea>'+
		'</body>'+
		'</html>';
		return <WebView
				ref={ 'webref' }
				hideKeyboardAccessoryView={ true }
				keyboardDisplayRequiresUserAction={ false }
				originWhitelist={['*']}
				scrollEnabled={ true }
				source={ { html: html}}
				style={ StyleSheet.flatten( [ styles.page, this.props.style ] ) }
				onMessage={ this.webCallback }
			/>
	}
}

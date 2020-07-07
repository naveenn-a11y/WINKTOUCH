/**
 * @flow
 */
'use strict';

import React from 'react';
import {StyleProp,ViewStyle, StyleSheet } from 'react-native';
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
	 * Placeholder text to show in the field.
	 */
	placeholder?: string;

	/**
	 * Styles to apply to the web view.
	 */
	style?: StyleProp<ViewStyle>;

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
				window.ReactNativeWebView.postMessage( JSON.stringify( {
					type: 'getContent',
					payload: {
						html: tinymce.activeEditor.getContent(),
					},
				} ) );
			` );
		});
	}

	setContent(html: string) {
		this.refs.webref.injectJavaScript(`tinymce.activeEditor.selection.setContent('${html}', {format: 'raw'})`);
	}

	webCallback = ( event: WebViewMessageEvent ) => {
		const data: EditorEvent = JSON.parse( event.nativeEvent.data );
		this.resolveContent( data.payload.html );
	}

	render() {
		let html : string = '<!DOCTYPE html>'+
		'<html>'+
		'<head>'+
		'  <script src="https://cdn.tiny.cloud/1/no-api-key/tinymce/5/tinymce.min.js" referrerpolicy="origin"></script>'+ //TODO: deploy tinymce local
		'  <script type="text/javascript">'+
		'  tinymce.init({'+
		'    selector: \'#mytextarea\','+
		'    height: \'640\','+
		'    extended_valid_elements: "svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]",'+
		'    setup: function (editor) {'+
		'           editor.on(\'init\', function (e) {'+
		'            editor.setContent('+JSON.stringify(this.props.value)+');'+
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

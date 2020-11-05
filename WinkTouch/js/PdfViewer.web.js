import React, {Component} from 'react';
import {Text, View} from 'react-native';
import {Document, Page} from 'react-pdf/dist/esm/entry.webpack';
import AsyncStorage from '@react-native-community/async-storage';

type PdfViewerProps = {
  navigation: any,
};

type PdfViewerState = {
  numPages: number,
  link: string,
};
export class PdfViewer extends Component<PdfViewerProps, PdfViewerState> {
  constructor(props: PdfViewerProps) {
    super(props);
    this.state = {
      numPages: 0,
      link: undefined,
    };
  }
  setNumPages(numPages: number) {
    this.setState({numPages: numPages});
  }
  onDocumentLoadSuccess({numPages}) {
    console.log('Numpage: ' + numPages);
    //this.setNumPages(numPages);
  }

  componentDidMount() {
    this.loadPrintingLink();
  }
  componentWillUnmount() {
    console.log('COmponent is Unmontingggg');
  }
  async loadPrintingLink() {
    const link: string = await AsyncStorage.getItem('printLink');
    this.setLink(link);
  }

  setLink(link: string) {
    this.setState({link: link});
  }
  //Base64 or url
  render() {
    console.log('linkk: ' + this.state.link);
    return (
      <View>
        <Document
          file={this.state.link}
          onLoadSuccess={this.onDocumentLoadSuccess}>
          <Page size="A4" pageNumber={1} />
        </Document>
      </View>
    );
  }
}

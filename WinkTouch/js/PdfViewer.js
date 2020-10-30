import React, {Component} from 'react';
import {Text, View} from 'react-native';
import {Document, Page} from 'react-pdf/dist/esm/entry.webpack';

type PdfViewerProps = {};

type PdfViewerState = {
  numPages: number,
};
export default class PdfViewer extends Component<
  PdfViewerProps,
  PdfViewerState,
> {
  constructor(props: ReferralScreenProps) {
    super(props);
    this.state = {
      numPages: 0,
    };
  }
  setNumPages(numPages) {
    this.setState({numPages: numPages});
  }
  onDocumentLoadSuccess({numPages}) {
    this.setNumPages(numPages);
  }
  render() {
    return (
      <View>
        <Document
          file="https://s21.q4cdn.com/798735247/files/doc_downloads/test.pdf"
          onLoadSuccess={this.onDocumentLoadSuccess}>
          <Page size="A4" pageNumber={1} />
        </Document>
      </View>
    );
  }
}

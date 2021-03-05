import React, {Component} from 'react';
import {View} from 'react-native';
import {Document, Page} from 'react-pdf/dist/esm/entry.webpack';

type PdfViewerProps = {
  base64Pdf: string,
  style: any,
  isPreview: ?boolean,
};

type PdfViewerState = {
  numPages: number,
};
export class PdfViewer extends Component<PdfViewerProps, PdfViewerState> {
  constructor(props: PdfViewerProps) {
    super(props);
    this.state = {
      numPages: 0,
    };
    this.onDocumentLoadSuccess = this.onDocumentLoadSuccess.bind(this);
  }
  static defaultProps = {
    isPreview: false,
  };
  setNumPages(numPages: number) {}
  onDocumentLoadSuccess({numPages}) {
    this.setState({numPages: this.props.isPreview ? 1 : numPages});
  }
  renderPages() {
    var pages = [];
    for (var i = 1; i <= this.state.numPages; i++) {
      pages.push(
        <Page
          width={this.props.style.width}
          height={this.props.style.height}
          pageNumber={i}
        />,
      );
    }
    return pages;
  }
  //Base64 or url
  render() {
    return (
      <View>
        <Document
          file={this.props.base64Pdf}
          onLoadSuccess={this.onDocumentLoadSuccess}>
          {this.renderPages()}
        </Document>
      </View>
    );
  }
}

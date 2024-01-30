import React, {Component} from 'react';
import {View} from 'react-native';
import {Document, Page, pdfjs} from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

type PdfViewerProps = {
  source: string,
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

  componentDidMount() {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
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
          file={this.props.source}
          onLoadSuccess={this.onDocumentLoadSuccess}>
          {this.renderPages()}
        </Document>
      </View>
    );
  }
}

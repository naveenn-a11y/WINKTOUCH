import React, {Component} from 'react';
import NativePdf from 'react-native-pdf';

type PdfViewerProps = {
  source: any,
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

  //Base64 or url
  render() {
    return (
      <NativePdf
        source={{uri: this.props.source}}
        fitWidth={true}
        fitPolicy={2}
        onLoadComplete={(numberOfPages, filePath) => {
          __DEV__ && console.log(`number of pages: ${numberOfPages}`);
        }}
        onPageChanged={(page, numberOfPages) => {
          __DEV__ && console.log(`current page: ${page}`);
        }}
        onError={(error) => {
          console.log(error);
        }}
        style={this.props.style}
      />
    );
  }
}

/**
 * @flow
 */

'use strict';
import React, {Component} from 'react';
import {PdfViewer} from '../src/components/PdfViewer';
import type {Upload} from './Types';
import {styles} from './Styles';
import {getCachedItem} from './DataCache';
import {fetchUpload} from './Upload';

export class Pdf extends Component {
  props: {
    uploadId?: string,
    upload?: Upload,
    style: any,
  };
  state: {
    upload: Upload,
  };

  constructor(props: any) {
    super(props);
    if (this.props.upload) {
      this.state = {
        upload: this.props.upload,
      };
    } else {
      this.state = {
        upload: getCachedItem(this.props.uploadId),
      };
      this.loadUpload(this.props.uploadId);
    }
  }

  componentDidUpdate(prevProps: any) {
    if (
      this.props.uploadId === prevProps.uploadId &&
      this.props.upload === prevProps.upload &&
      this.props.style === prevProps.style
    )
      return;
    if (this.props.upload) {
      this.setState({upload: this.props.upload});
    } else {
      this.setState({
        upload: getCachedItem(this.props.uploadId),
      });
      this.loadUpload(this.props.uploadId);
    }
  }

  async loadUpload(uploadId: string) {
    if (!uploadId) return;
    let upload: Upload = await fetchUpload(uploadId);
    this.setState({upload});
  }

  render() {
    //const source = {uri:'http://samples.leanpub.com/thereactnativebook-sample.pdf',cache:true};
    if (!this.state.upload) return null;

    const source = 'data:application/pdf;base64,' + this.state.upload.data;
    return <PdfViewer source={source} style={styles.patientDocument} />;
  }
}

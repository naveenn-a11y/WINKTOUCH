/**
 * @flow
 */
 'use strict';

import React, {Component} from 'react';
import {
  Modal, 
  ModalProps,
} from 'react-native';
import NavigationService from "../utilities/NavigationService.js";
import { generateRandomGUID } from './../Helper/GenerateRandomId.js';

export class CustomModal extends Component<ModalProps> {

    state = {
        id: generateRandomGUID()
    }

    componentDidMount() {
        this.props.visible && NavigationService.setModalVisibility(this.props.visible, this.state.id);
    }

    componentWillUnmount() {
        NavigationService.setModalVisibility(false, this.state.id);
    }

    render() {
        const {children, style, ...modalProps} = this.props;
        return (
            <Modal style={style} {...modalProps}>
                {children}
            </Modal>
        );
    }
}
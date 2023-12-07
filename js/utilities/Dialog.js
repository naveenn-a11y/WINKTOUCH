/**
 * @flow
 */
 'use strict';

import React, {Component, useEffect, useState} from 'react';

import {Dialog} from 'react-native-paper';
import NavigationService from "../utilities/NavigationService.js";

const CustomDialog = ({ children, style, ...props }: React.PropsWithChildren<T>) => {
    const [id, setId] = useState(Math.floor(Math.random() * Math.floor(Math.random() * Date.now())));

    useEffect(() => {
        props.visible && NavigationService.setModalVisibility(props.visible, id);
        return () => {
            NavigationService.setModalVisibility(false, id);
        };
    });

    return (
        <Dialog style={style} {...props}>
            {children}
        </Dialog>
    );
};

const CustomDialogTitle = ({ children, style, ...dialogProps }: React.PropsWithChildren<T>) => (
    <Dialog.Title style={style} {...dialogProps}>
        {children}
    </Dialog.Title>
);

const CustomDialogContent = ({ children, style, ...dialogProps }: React.PropsWithChildren<T>) => (
    <Dialog.Content style={style} {...dialogProps}>
        {children}
    </Dialog.Content>
);

const CustomDialogScrollArea = ({ children, style, ...dialogProps }: React.PropsWithChildren<T>) => (
    <Dialog.ScrollArea style={style} {...dialogProps}>
        {children}
    </Dialog.ScrollArea>
);

const CustomDialogActions = ({ children, style, ...dialogProps }: React.PropsWithChildren<T>) => (
    <Dialog.Actions style={style} {...dialogProps}>
        {children}
    </Dialog.Actions>
);


CustomDialog.Title = CustomDialogTitle;
CustomDialog.Content = CustomDialogContent;
CustomDialog.ScrollArea = CustomDialogScrollArea;
CustomDialog.Actions = CustomDialogActions;


export default CustomDialog;
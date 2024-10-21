/**
 * @flow
 */
'use strict';

import type { Visit } from './Types';

import React, { Component } from 'react';
import {
  ActivityIndicator,
  FlatList,
  InteractionManager,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { formatCode, getAllCodes, getCodeDefinition } from './Codes';
import { cacheItem, getCachedItem } from './DataCache';
import { FormCode, FormRow, FormTextInput } from './Form';
import {
  fontScale,
  isWeb,
  selectionColor,
  selectionFontColor,
  styles,
  windowHeight,
} from './Styles';
import type {
  CodeDefinition,
  EmailDefinition,
  FollowUp,
  PatientInfo,
  ReferralDefinition,
  ReferralStatusCode,
  Upload,
} from './Types';
import { fetchReferralFollowUpHistory, fetchVisit } from './Visit';
import { Alert, Button, TextField } from './Widgets';
import { TilesField } from './TilesField';
import { fetchWinkRest } from './WinkRest';

import RNBeep from '@dashdoc/react-native-system-sounds';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { print, printHtml } from '../src/components/HtmlToPdf';
import { getDoctor } from './DoctorApp';
import { fetchPatientInfo, getPatientFullName } from './Patient';
import { getPDFAttachmentFromHtml } from './PatientFormHtml';
import { printBase64Pdf } from './Print';
import { stripDataType } from './Rest';
import { strings } from './Strings';
import { getMimeType } from './Upload';
import { deAccent, formatDate, isEmpty, jsonDateFormat } from './Util';
import { CustomModal as Modal } from './utilities/Modal';

const COMMAND = {
  RESEND: 0,
  REPLY: 1,
  FORWARD: 2,
};

const PRIVILEGE = {
  FULLACCESS: 'FULLACCESS',
  NOACCESS: 'NOACCESS',
  READONLY: 'READONLY',
};

function hasReferralFollowUpReadAccess(followUp: FollowUp): boolean {
  if (!followUp) {
    return false;
  }
  return (
    followUp.referralPrivilege === PRIVILEGE.READONLY ||
    followUp.referralPrivilege === PRIVILEGE.FULLACCESS
  );
}

function hasReferralFollowUpFullAccess(followUp: FollowUp): boolean {
  if (!followUp) {
    return false;
  }
  return followUp.referralPrivilege === PRIVILEGE.FULLACCESS;
}
type FollowUpScreenProps = {
  navigation: any,
  patientInfo: PatientInfo,
  isDraft: boolean,
  onUpdateVisitSelection: (selectedVisitId: string) => void,
  route: any,
};

type FollowUpScreenState = {
  doctorReferral: ReferralDefinition,
  allFollowUp: FollowUp[],
  selectedItem: FollowUp,
  allRefStatusCode: ReferralStatusCode[],
  isActive: ?boolean,
  isPopupVisibile: ?boolean,
  emailDefinition: ?EmailDefinition,
  command: COMMAND,
  isDirty: boolean,
  showDialog: boolean,
};

export class FollowUpScreen extends Component<
  FollowUpScreenProps,
  FollowUpScreenState,
> {
  editor;

  constructor(props: FollowUpScreenProps) {
    super(props);

    this.state = {
      doctorReferral: {},
      isActive: true,
      isPopupVisibile: false,
      allFollowUp: [],
      selectedItem: undefined,
      allRefStatusCode: getAllCodes('referralStatus'),
      emailDefinition: {},
      command: undefined,
      isDirty: false,
      showDialog: false,
      loading: false,
      pageNumber: 1,
      pageSize: 20,
      loadMoreData: true,
    };
  }

  async send(): Promise<void> {
    if (this.state.emailDefinition === undefined) {
      return;
    }
    this.setState({isActive: false});
    let parameters: {} = {};
    const referral: FollowUp = this.state.selectedItem;
    let isFax: Boolean = false;
    if (
      this.state.command == COMMAND.RESEND &&
      !isEmpty(referral.faxedOn) &&
      isEmpty(referral.emailOn)
    ) {
      isFax = true;
    }

    let body = {
      visitId: stripDataType(this.state.selectedItem.visitId),
      doctorId: stripDataType(referral.doctorId),
      emailDefinition: this.state.emailDefinition,
      doctorReferral: this.state.doctorReferral,
      action: this.state.command,
      isFax: isFax,
    };

    let response = await fetchWinkRest(
      'webresources/template/email',
      parameters,
      'POST',
      body,
    );
    if (response) {
      if (response.errors) {
        alert(response.errors);
      } else {
        RNBeep.play(RNBeep.iOSSoundIDs.MailSent);
        this.setState({isPopupVisibile: false, emailDefinition: {}});
      }
    }
    this.setState({isActive: true});
  }

  updateFieldCc(newValue: any) {
    let emailDefinition: EmailDefinition = this.state.emailDefinition;
    if (!emailDefinition) {
      return;
    }
    emailDefinition.cc = newValue;
    this.setState({emailDefinition: emailDefinition});
  }

  updateFieldTo(newValue: any) {
    let emailDefinition: EmailDefinition = this.state.emailDefinition;
    if (!emailDefinition) {
      return;
    }
    emailDefinition.to = newValue;
    this.setState({emailDefinition: emailDefinition});
  }

  updateFieldSubject(newValue: any) {
    let emailDefinition: EmailDefinition = this.state.emailDefinition;
    if (!emailDefinition) {
      return;
    }
    emailDefinition.subject = newValue;
    this.setState({emailDefinition: emailDefinition});
  }

  updateFieldBody(newValue: any) {
    let emailDefinition: EmailDefinition = this.state.emailDefinition;
    if (!emailDefinition) {
      return;
    }
    emailDefinition.body = newValue;
    this.setState({emailDefinition: emailDefinition});
  }

  cancelEdit = () => {
    this.setState({isActive: true});
    this.setState({isPopupVisibile: false});
  };

  reply(): Promise<void> {
    if (this.state.selectedItem === undefined) {
      alert('item not selected');
      return;
    }
    let emailDefinition: EmailDefinition = this.state.emailDefinition;
    const selectedItem: FollowUp = this.state.selectedItem;
    if (
      selectedItem.doctorId === undefined ||
      selectedItem.doctorId <= 0 ||
      isEmpty(selectedItem.doctorId)
    ) {
      alert(strings.doctorReferralMissing);
      return;
    }
    emailDefinition.to = selectedItem.from.email;
    this.setState({
      emailDefinition: emailDefinition,
      isPopupVisibile: true,
      command: COMMAND.REPLY,
    });
  }

  resend(): Promise<void> {
    if (this.state.selectedItem === undefined) {
      alert('item not selected');
      return;
    }
    let emailDefinition: EmailDefinition = this.state.emailDefinition;
    const selectedItem: FollowUp = this.state.selectedItem;
    if (
      selectedItem.doctorId === undefined ||
      selectedItem.doctorId <= 0 ||
      isEmpty(selectedItem.doctorId)
    ) {
      alert(strings.doctorReferralMissing);
      return;
    }
    if (!isEmpty(selectedItem.faxedOn) && isEmpty(selectedItem.emailOn)) {
      emailDefinition.to = selectedItem.to.fax;
    } else {
      emailDefinition.to = selectedItem.to.email;
    }
    this.setState({
      emailDefinition: emailDefinition,
      isPopupVisibile: true,
      command: COMMAND.RESEND,
    });
  }

  forward(): Promise<void> {
    let emailDefinition: EmailDefinition = this.state.emailDefinition;
    const selectedItem: FollowUp = this.state.selectedItem;
    const patientInfo: PatientInfo = this.props.patientInfo
      ? this.props.patientInfo
      : this.props.route.params.patientInfo
      ? this.props.route.params.patientInfo
      : selectedItem.patientInfo;
    emailDefinition.to = patientInfo ? patientInfo.email : undefined;
    this.setState({
      emailDefinition: emailDefinition,
      isPopupVisibile: true,
      command: COMMAND.FORWARD,
    });
  }

  async deleteItem(selectedItem: FollowUp): Promise<void> {
    let allFollowUp: FollowUp[] = this.state.allFollowUp;

    const index = allFollowUp.indexOf(selectedItem);
    allFollowUp.splice(index, 1);
    this.setState({allFollowUp});

    let body: {} = {
      referral: selectedItem,
    };
    let parameters: {} = {};

    let response = fetchWinkRest(
      'webresources/followup/delete',
      parameters,
      'POST',
      body,
    );
    if (response) {
      if (response.errors) {
        alert(response.errors);
        return;
      }
    }
    const visit: Visit = this.props.route.params.visit;
    const isDraft: Boolean = this.props.isDraft;
    const patientInfo: PatientInfo = this.props.patientInfo
      ? this.props.patientInfo
      : this.props.route.params.patientInfo;
    const patientId: string = isEmpty(patientInfo) ? '*' : patientInfo.id;
    if (isDraft && visit) {
      allFollowUp = getCachedItem('referralFollowUpHistory-' + patientId);
      const cachedIndex = allFollowUp.indexOf(selectedItem);
      allFollowUp.splice(cachedIndex, 1);
    }
    cacheItem('referralFollowUpHistory-' + patientId, allFollowUp);
    this.setState({selectedItem: undefined});
  }

  showDialog(selectedItem: FollowUp) {
    if (selectedItem === undefined) {
      alert(strings.itemNotSelected);
      return;
    }
    this.setState({selectedItem: selectedItem, showDialog: true});
  }
  confirmDeleteReferral() {
    const selectedItem: FollowUp = this.state.selectedItem;
    if (selectedItem === undefined) {
      alert(strings.itemNotSelected);
      return;
    }
    this.deleteItem(selectedItem);
    this.hideDialog();
  }

  hideDialog() {
    this.setState({showDialog: false});
  }

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.refreshList();
    });
  }
  onRefresh(refresh: boolean) {}

  async componentDidUpdate(prevProps: any) {
    let params = this.props.route.params;
    if (params && params.refreshFollowUp) {
      this.props.navigation.setParams({refreshFollowUp: false});
      await this.refreshList();
    }
  }

  async refreshList() {
    const selectedItem: FollowUp = this.state.selectedItem;
    const patientInfo: PatientInfo = this.props.patientInfo
      ? this.props.patientInfo
      : this.props.route.params.patientInfo !== undefined
      ? this.props.route.params.patientInfo
      : selectedItem !== undefined
      ? getCachedItem(selectedItem.patientInfo.id)
      : undefined;

    this.setState({
      loading: true,
    });
    const response = patientInfo
      ? await fetchReferralFollowUpHistory(patientInfo.id)
      : await fetchReferralFollowUpHistory();

    if (response) {
      if (response.followUp) {
        const allFollowUp = this.filterFollowUp(response.followUp);

        this.setState({
          allFollowUp: allFollowUp,
          pageNumber: response.currentPage
            ? response.currentPage
            : this.state.pageNumber,
          pageSize: response.pageSize ? response.pageSize : this.state.pageSize,
          loadMoreData: !response.lastPage,
          loading: false,
        });
      }
    }
  }

  handleLoadMoreFollowUp = async () => {
    if (!(this.state.loading || !this.state.loadMoreData)) {
      this.setState({
        loading: true,
      });

      const patientInfo: PatientInfo = this.props.patientInfo
        ? this.props.patientInfo
        : this.props.route.params.patientInfo;

      const patientId: string = isEmpty(patientInfo)
        ? undefined
        : patientInfo.id;
      const response = await fetchReferralFollowUpHistory(
        patientId,
        this.state.pageNumber + 1,
        this.state.pageSize,
      );

      if (response) {
        if (response.followUp) {
          const allFollowUp = this.filterFollowUp(response.followUp);
          const combinedFollowUps = this.state.allFollowUp;

          allFollowUp?.forEach((value) => {
            if (combinedFollowUps?.find((item) => item.id === value.id)) {
              //found duplicates
            } else {
              combinedFollowUps.push(value);
            }
          });

          this.setState({
            allFollowUp: combinedFollowUps,
            pageNumber: response.currentPage
              ? response.currentPage
              : this.state.pageNumber,
            pageSize: response.pageSize
              ? response.pageSize
              : this.state.pageSize,
            loadMoreData: !response.lastPage,
            loading: false,
          });
        }
      }
    }
  };

  async loadReferralStatusCode() {
    let parameters: {} = {};
    let body: {} = {};

    let response = await fetchWinkRest(
      'webresources/followup/statusCode',
      parameters,
      'GET',
      body,
    );
    if (response) {
      if (response.errors) {
        alert(response.errors);
        return;
      }
      const allRefStatusCode: ReferralStatusCode[] = response.referralStatus;
      this.setState({allRefStatusCode});
    }
  }

  filterFollowUp(data: FollowUp[]) {
    let allFollowUp = data;
    const visit: Visit = this.props.route.params.visit;
    const isDraft: Boolean = this.props.isDraft;

    if (isDraft && visit) {
      allFollowUp = allFollowUp.filter(
        (followUp: FollowUp) =>
          isEmpty(followUp.emailOn) &&
          isEmpty(followUp.faxedOn) &&
          followUp.visitId === visit.id,
      );
    }
    return allFollowUp;
  }

  async updateItem(item: any): Promise<void> {
    let allFollowUp: FollowUp[] = this.state.allFollowUp;
    const index = allFollowUp.indexOf(item);
    allFollowUp[index] = item;
    this.setState({allFollowUp});
    this.setState({isActive: false});

    let body: {} = {
      referral: item,
    };
    let parameters: {} = {};

    let response = await fetchWinkRest(
      'webresources/followup/update',
      parameters,
      'POST',
      body,
    );
    this.setState({isActive: true});
    if (response) {
      if (response.errors) {
        alert(response.errors);
        return;
      }
    }
  }

  async openAttachment() {
    let body: {} = {
      referral: this.state.selectedItem,
    };
    let parameters: {} = {};
    this.setState({isActive: false});

    let response = await fetchWinkRest(
      'webresources/followup/attachment',
      parameters,
      'POST',
      body,
    );
    this.setState({isActive: true});

    if (response) {
      if (response.errors) {
        alert(response.errors);
        return;
      }
      const upload: Upload = response;
      let html: string = '';
      const mimeType: string = getMimeType(upload).toLowerCase();
      if (mimeType === 'html') {
        html += upload.data;
        let PDFAttachment = getPDFAttachmentFromHtml(html);
        await printHtml(html, PDFAttachment);
      } else {
        const mimeType: string = getMimeType(upload);
        if (
          mimeType === 'application/pdf;base64' ||
          mimeType === 'application/pdf'
        ) {
          await printBase64Pdf(upload.data);
        } else {
          const data = {uri: `data:${mimeType};base64,${upload.data}`};
          html = `<iframe src=${data.uri} height="100%" width="100%" frameBorder="0"></iframe>`;
          if (isWeb) {
            print(html);
          } else {
            let PDFAttachment = getPDFAttachmentFromHtml(html);
            await printHtml(html, PDFAttachment);
          }
        }
      }
    }
  }

  async openFollowUp() {
    let body: {} = {
      referral: this.state.selectedItem,
    };
    let parameters: {} = {};
    this.setState({isActive: false});

    let response = await fetchWinkRest(
      'webresources/followup/attachment',
      parameters,
      'POST',
      body,
    );
    this.setState({isActive: true});

    if (response) {
      if (response.errors) {
        alert(response.errors);
        return;
      }
      const upload: Upload = response;
      let html: string = '';
      if (getMimeType(upload).toLowerCase() === 'html') {
        html += upload.data;
      } else {
        const data = {uri: `data:${getMimeType(upload)};base64,${upload.data}`};
        html = `<iframe src=${data.uri} height="100%" width="100%" frameBorder="0"></iframe>`;
      }

      await printHtml(html);
    }
  }

  async openPatientFile() {
    const selectedItem: FollowUp = this.state.selectedItem;
    if (!selectedItem) {
      return;
    }
    let patientInfo: PatientInfo = this.props.patientInfo
      ? this.props.patientInfo
      : this.props.route.params.patientInfo !== undefined
      ? this.props.route.params.patientInfo
      : getCachedItem(selectedItem.patientInfo.id);
    patientInfo =
      patientInfo === undefined
        ? await fetchPatientInfo(selectedItem.patientInfo.id)
        : patientInfo;
    const params = this.props.route.params;
    let visit: Visit = getCachedItem(selectedItem.visitId);
    if (visit === undefined) {
      visit = await fetchVisit(selectedItem.visitId);
    }
    if (visit && !visit.inactive) {
      if (params && params.overview) {
        this.props.navigation.navigate('appointment', {
          patientInfo: patientInfo,
          selectedVisitId: selectedItem.visitId,
          refreshStateKey: this.props.route.key,
        });
      } else {
        this.props.onUpdateVisitSelection(selectedItem.visitId);
      }
    } else {
      alert(strings.deletedVisitMessage);
    }
  }

  async selectItem(value: any): void {
    if (this.state.selectedItem === value && this.state.isActive == true) {
      await this.openAttachment();
      return;
    }

    let doctorReferral: ReferralDefinition = {id: value.id};
    let emailDefinition: EmailDefinition = {};
    emailDefinition.subject = value.referralTemplate.subject;
    this.setState({
      selectedItem: value,
      doctorReferral: doctorReferral,
      emailDefinition: emailDefinition,
    });
    this.shouldUpdateStatus();
  }

  shouldUpdateStatus(): void {
    let selectedItem: FollowUp = this.state.selectedItem;
    if (!selectedItem) {
      return;
    }
    const statusCode: CodeDefinition = getCodeDefinition(
      'referralStatus',
      this.state.selectedItem.status,
    );
    if (statusCode && statusCode.status == 3) {
      let allStatusCode: CodeDefinition[] = getAllCodes('referralStatus');
      allStatusCode =
        allStatusCode !== undefined
          ? allStatusCode.filter((code: CodeDefinition) => code.status == 4)
          : undefined;
      const openedStatusCode: CodeDefinition =
        allStatusCode !== undefined && allStatusCode.length > 0
          ? allStatusCode[0]
          : undefined;
      const currentUser: User = getDoctor();
      const userTo: User = selectedItem.to;
      if (
        currentUser &&
        userTo &&
        stripDataType(currentUser.id) == stripDataType(userTo.id) &&
        openedStatusCode !== undefined
      ) {
        selectedItem.status = openedStatusCode.code;
        this.updateItem(selectedItem);
      }
    }
  }

  shouldActivateEdit(): boolean {
    const selectedItem: FollowUp = this.state.selectedItem;
    if (!selectedItem) {
      return false;
    }
    if (!selectedItem.referralTemplate) {
      return false;
    }
    if (
      selectedItem.referralTemplate &&
      !selectedItem.referralTemplate.template
    ) {
      return false;
    }

    const statusCode: CodeDefinition = getCodeDefinition(
      'referralStatus',
      this.state.selectedItem.status,
    );

    if (
      (statusCode && statusCode.status == 1) ||
      (isEmpty(selectedItem.emailOn) && isEmpty(selectedItem.faxedOn))
    ) {
      return true;
    }
    return false;
  }

  shouldActivateResend() {
    const selectedItem: FollowUp = this.state.selectedItem;
    if (!selectedItem) {
      return false;
    }
    const params = this.props.route.params;
    if (params && params.overview) {
      return false;
    }

    const statusCode: CodeDefinition = getCodeDefinition(
      'referralStatus',
      this.state.selectedItem.status,
    );

    if (
      selectedItem.isOutgoing &&
      ((statusCode && statusCode.status == 2) || statusCode.status == 0)
    ) {
      return true;
    }
    return false;
  }

  shouldActivateReply() {
    const selectedItem: FollowUp = this.state.selectedItem;
    if (!selectedItem) {
      return false;
    }

    const statusCode: CodeDefinition = getCodeDefinition(
      'referralStatus',
      this.state.selectedItem.status,
    );

    if (
      !selectedItem.isOutgoing &&
      statusCode &&
      (statusCode.status == 3 || statusCode.status == 0)
    ) {
      return true;
    }
    return false;
  }

  shouldActivateForward() {
    const selectedItem: FollowUp = this.state.selectedItem;
    if (!selectedItem) {
      return false;
    }
    const params = this.props.route.params;
    if (params && params.overview) {
      return false;
    }
    const statusCode: CodeDefinition = getCodeDefinition(
      'referralStatus',
      this.state.selectedItem.status,
    );

    if (statusCode && statusCode.status == 1) {
      return false;
    }
    return true;
  }

  shouldActivateFollowUp() {
    const selectedItem: FollowUp = this.state.selectedItem;
    if (!selectedItem) {
      return false;
    }

    const statusCode: CodeDefinition = getCodeDefinition(
      'referralStatus',
      this.state.selectedItem.status,
    );

    if (statusCode && statusCode.status == 1) {
      return false;
    }
    return true;
  }
  shouldActivateDelete() {
    const selectedItem: FollowUp = this.state.selectedItem;
    if (!selectedItem) {
      return false;
    }
    if (isEmpty(selectedItem.emailOn) && isEmpty(selectedItem.faxedOn)) {
      return true;
    }
    return false;
  }

  renderAlert() {
    const selectedItem: FollowUp = this.state.selectedItem;
    return (
      <Alert
        title={strings.deleteReferralTitle}
        message={strings.formatString(
          strings.deleteReferralQuestion,
          selectedItem.ref,
          formatDate(selectedItem.date, jsonDateFormat),
        )}
        dismissable={false}
        onConfirmAction={() => this.confirmDeleteReferral()}
        onCancelAction={() => this.hideDialog()}
        confirmActionLabel={strings.confirm}
        cancelActionLabel={strings.cancel}
        style={styles.alert}
      />
    );
  }
  renderFollowUp() {
    const listFollowUp: FollowUp[] = this.state.allFollowUp;

    const patientInfo: PatientInfo = this.props.patientInfo
      ? this.props.patientInfo
      : this.props.route.params.patientInfo;
    const style =
      !isEmpty(patientInfo) && !this.props.isDraft
        ? [
            styles.tabCardFollowUp,
            {
              maxHeight: windowHeight - 295 * fontScale,
              minHeight: windowHeight - 295 * fontScale,
            },
          ]
        : styles.tabCardFollowUp;
    return (
      <View style={style}>
        {this.props.isDraft && (
          <Text style={styles.cardTitle}>Existing Referrals</Text>
        )}
        <TableList
          items={listFollowUp}
          onUpdate={(item) => this.updateItem(item)}
          selection={this.state.selectedItem}
          onUpdateSelection={(value) => this.selectItem(value)}
          onDeleteSelection={(value) => this.showDialog(value)}
          isForPatient={isEmpty(patientInfo)}
          isDraft={this.props.isDraft}
          onRefreshList={() => this.refreshList()}
          navigation={this.props.navigation}
          loading={this.state.loading}
          handleLoadMore={this.handleLoadMoreFollowUp}
          allRefStatusCode={this.state.allRefStatusCode}
        />
        {this.renderButtons()}
        <Modal
          visible={this.state.isPopupVisibile}
          transparent={true}
          animationType={'slide'}
          onRequestClose={this.cancelEdit}>
          {this.renderPopup()}
        </Modal>
        {this.state.showDialog && this.state.selectedItem && this.renderAlert()}
      </View>
    );
  }

  renderButtons() {
    const hasReferralReadAccess: boolean = hasReferralFollowUpReadAccess(
      this.state.selectedItem,
    );
    const hasReferralFullAccess: boolean = hasReferralFollowUpFullAccess(
      this.state.selectedItem,
    );
    const visit: Visit =
      this.state.selectedItem !== undefined
        ? getCachedItem(this.state.selectedItem.visitId)
        : undefined;
    const isDraft: boolean = this.props.isDraft;
    const patientInfo: PatientInfo = this.props.patientInfo
      ? this.props.patientInfo
      : this.props.route.params.patientInfo
      ? this.props.route.params.patientInfo
      : this.state.selectedItem !== undefined
      ? this.state.selectedItem.patientInfo
      : undefined;
    return (
      <View style={styles.flow}>
        {this.state.selectedItem && hasReferralReadAccess && (
          <Button
            title={strings.view}
            onPress={() => this.openAttachment()}
            disabled={!this.state.isActive}
          />
        )}
        {this.state.selectedItem &&
          hasReferralFullAccess &&
          !isDraft &&
          this.shouldActivateReply() && (
            <Button
              title={strings.quickReply}
              onPress={() => this.reply()}
              disabled={!this.state.isActive}
            />
          )}
        {this.state.selectedItem &&
          hasReferralFullAccess &&
          !isDraft &&
          visit &&
          this.shouldActivateFollowUp() && (
            <Button
              title={strings.followUpTitle}
              disabled={!this.state.isActive}
              onPress={() => {
                this.props.navigation.navigate('referral', {
                  visit: visit,
                  referral: this.state.selectedItem,
                  followUp: true,
                  followUpStateKey: this.props.route.key,
                  patientInfo: patientInfo,
                });
              }}
            />
          )}
        {this.state.selectedItem &&
          hasReferralFullAccess &&
          visit &&
          this.shouldActivateEdit() && (
            <Button
              title={strings.edit}
              disabled={!this.state.isActive}
              onPress={() => {
                this.props.navigation.navigate('referral', {
                  visit: visit,
                  referral: this.state.selectedItem,
                  followUp: false,
                  followUpStateKey: this.props.route.key,
                  patientInfo: patientInfo,
                });
              }}
            />
          )}
        {this.state.selectedItem &&
          hasReferralFullAccess &&
          !isDraft &&
          this.shouldActivateResend() && (
            <Button
              title={strings.resend}
              onPress={() => this.resend()}
              disabled={!this.state.isActive}
            />
          )}
        {this.state.selectedItem &&
          hasReferralFullAccess &&
          !isDraft &&
          this.shouldActivateForward() && (
            <Button
              title={strings.forward}
              onPress={() => this.forward()}
              disabled={!this.state.isActive}
            />
          )}
        {this.state.selectedItem &&
          hasReferralFullAccess &&
          this.shouldActivateDelete() && (
            <Button
              title={strings.deleteTitle}
              onPress={() => this.showDialog(this.state.selectedItem)}
              disabled={!this.state.isActive}
            />
          )}
        {this.state.selectedItem && !isDraft && (
          <Button
            title={strings.openFile}
            onPress={() => this.openPatientFile()}
            disabled={!this.state.isActive}
          />
        )}
      </View>
    );
  }

  renderPopup() {
    let emailDefinition: EmailDefinition = this.state.emailDefinition;

    return (
      <TouchableWithoutFeedback onPress={isWeb ? {} : this.cancelEdit}>
        <View style={styles.popupBackground}>
          <View style={styles.flexColumnLayout}>
            <View style={styles.form}>
              <FormRow>
                <View style={styles.flexRow}>
                  <FormTextInput
                    label="To"
                    value={emailDefinition.to}
                    readonly={this.state.command !== COMMAND.FORWARD}
                    onChangeText={(newValue: string) =>
                      this.updateFieldTo(newValue)
                    }
                  />
                </View>
              </FormRow>
              <FormRow>
                <View style={styles.flexRow}>
                  <FormTextInput
                    label="Cc"
                    value={emailDefinition.cc}
                    readonly={false}
                    onChangeText={(newValue: string) =>
                      this.updateFieldCc(newValue)
                    }
                  />
                </View>
              </FormRow>
              <FormRow>
                <View style={styles.flexRow}>
                  <FormTextInput
                    label="Subject"
                    value={emailDefinition.subject}
                    readonly={false}
                    onChangeText={(newValue: string) =>
                      this.updateFieldSubject(newValue)
                    }
                  />
                </View>
              </FormRow>
              <FormRow>
                <View style={styles.flexRow}>
                  <FormTextInput
                    multiline={true}
                    label="Body"
                    value={emailDefinition.body}
                    readonly={false}
                    onChangeText={(newValue: string) =>
                      this.updateFieldBody(newValue)
                    }
                  />
                </View>
              </FormRow>
              <View style={styles.flow}>
                <Button
                  title={strings.cancel}
                  onPress={this.cancelEdit}
                  disabled={!this.state.isActive}
                />
                <Button
                  title={strings.send}
                  onPress={() => {
                    Keyboard.dismiss();
                    this.send();
                  }}
                  disabled={!this.state.isActive}
                />
              </View>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  render() {
    const listFollowUp: FollowUp[] = this.state.allFollowUp;
    if (
      (Array.isArray(listFollowUp) && listFollowUp.length > 0) ||
      this.state.loading
    ) {
      return <View style={styles.page}>{this.renderFollowUp()}</View>;
    } else if (!this.props.isDraft) {
      return <Text>{strings.noDataFound}</Text>;
    }

    return null;
  }
}

export class TableListRow extends React.PureComponent {
  props: {
    rowValue: {},
    selected: boolean | string,
    onSelect: (select: boolean | string) => void,
    onChangeValue: (value: ?string | ?number) => void,
    maxLength?: number,
    simpleSelect?: boolean,
    testID: string,
    backgroundColor: string,
    readonly: boolean,
    onLongPress?: () => void,
    isVisible: boolean,
    allRefStatusCode: ReferralStatusCode[],
  };
  state: {
    commentValue: string,
  };
  static defaultProps = {
    maxLength: 60,
    simpleSelect: false,
  };
  constructor(props: any) {
    super(props);
    this.state = {
      commentValue: this.props.rowValue.comment,
    };
  }

  componentDidUpdate(prevProps: any) {
    if (
      prevProps.rowValue.comment !== this.props.rowValue.comment &&
      this.state.commentValue == prevProps.rowValue.comment
    ) {
      this.changeText(this.props.rowValue.comment);
    }
  }
  async loadReferralStatusCode() {
    let parameters: {} = {};
    let body: {} = {};

    let response = await fetchWinkRest(
      'webresources/followup/statusCode',
      parameters,
      'GET',
      body,
    );
    if (response) {
      if (response.errors) {
        alert(response.errors);
        return;
      }
      const allRefStatusCode: ReferralStatusCode[] = response.referralStatus;
      this.setState({allRefStatusCode});
    }
  }

  toggleSelect() {
    this.props.onSelect(true);
  }
  toggleLongPress() {
    this.toggleSelect();
    if (
      isEmpty(this.props.rowValue.emailOn) &&
      isEmpty(this.props.rowValue.faxedOn)
    ) {
      this.props.onLongPress();
    }
  }

  toggleSelectStatus() {}

  formatLabel(): string {
    return this.props.rowValue.item;
  }

  updateValue(value: any) {
    if (this.props.onChangeValue && value !== this.props.rowValue.status) {
      this.props.rowValue.status = value;
      this.props.onChangeValue();
    }
  }

  commitEdit(value: string) {
    if (this.props.onChangeValue && value !== this.props.rowValue.comment) {
      if (!(isEmpty(value) && isEmpty(this.props.rowValue.comment))) {
        this.props.rowValue.comment = value;
        this.props.onChangeValue();
      }
    }
  }
  changeText(value: string) {
    this.setState({commentValue: value});
  }

  render() {
    let referralStatusCode : ReferralStatusCode = this.props?.allRefStatusCode.find(code => code.code == this.props.rowValue?.status)
    const RECEIVED_STATUS = 3
    const style = this.props.selected
      ? styles.tableListTextSelected
      : styles.tableListText;
    const textStyle = (this.props.rowValue.isParent || referralStatusCode?.status === RECEIVED_STATUS)
      ? [style, {fontWeight: 'bold'}]
      : style;

    let formCodeStyle = this.props.readonly ? styles.formFieldReadOnly : styles.formField;
    //make bold if status is received i.e RECEIVED_STATUS
    formCodeStyle = (referralStatusCode?.status === RECEIVED_STATUS)
        ? [formCodeStyle, {fontWeight: 'bold'}]
        : formCodeStyle;

    const prefix: string = this.props.selected
      ? this.props.selected === true
        ? undefined
        : '(' + this.props.selected + ') '
      : undefined;

    const commentStyle = (referralStatusCode?.status === RECEIVED_STATUS)
        ? [styles.formField, {minWidth: 150 * fontScale, fontWeight: 'bold'}]
        : [styles.formField, {minWidth: 150 * fontScale}];

    return (
      <TouchableOpacity
        underlayColor={selectionColor}
        onPress={() => this.toggleSelect()}
        onLongPress={() => this.toggleLongPress()}
        testID={this.props.testID}>
        <View
          style={[
            styles.listRow,
            {backgroundColor: this.props.backgroundColor},
          ]}>
          <Icon
            name={
              this.props.rowValue.isOutgoing ? 'call-made' : 'call-received'
            }
            color={selectionFontColor}
          />
          <Text style={textStyle} testID={this.props?.testID + '.Referral'}>{this.props.rowValue.ref}</Text>
          {this.props.isVisible && (
            <Text style={textStyle} testID={this.props?.testID + '.PatientName'}>
              {getPatientFullName(this.props.rowValue.patientInfo)}
            </Text>
          )}
          <Text style={textStyle} testID={this.props?.testID + '.From'}>{this.props.rowValue.from.name}</Text>
          <Text style={textStyle} testID={this.props?.testID + '.To'}>{this.props.rowValue.to.name}</Text>
          <Text style={textStyle} testID={this.props?.testID + '.Date'}>
            {formatDate(this.props.rowValue.date, jsonDateFormat)}
          </Text>
          <FormCode
            code="referralStatus"
            value={this.props.rowValue.status}
            showLabel={false}
            label={'Status'}
            onChangeValue={(code: ?string | ?number) => this.updateValue(code)}
            readonly={this.props.readonly}
            style={formCodeStyle}
            testID={this.props?.testID + '.Status'}
          />

          <TextField
            returnKeyType="done"
            editable={!this.props.readonly}
            autoCorrect={false}
            autoCapitalize="none"
            value={this.state.commentValue}
            style={commentStyle}
            onChangeValue={(text: string) => this.changeText(text)}
            testID={this.props?.testID+ '.Filter'}
            onBlur={() => this.commitEdit(this.state.commentValue)}
          />
        </View>
      </TouchableOpacity>
    );
  }
}
export class TableList extends React.PureComponent {
  props: {
    label: string,
    items: any[],
    selection?: string | string[],
    required?: boolean,
    multiValue?: boolean,
    freestyle?: boolean,
    simpleSelect?: boolean,
    onUpdateSelection: (selection: ?(string[] | string)) => void,
    onUpdate: (item: ?any) => void,
    isDraft?: boolean,
    isForPatient?: boolean,
    fieldId: string,
    onRefreshList: () => void,
    navigation: any,
    loading: boolean,
    handleLoadMore: () => void,
    allRefStatusCode : ReferralStatusCode[],
  };

  state: {
    searchable: boolean,
    filter: string,
    item: any,
    options: string[],
    groupBy: ?string,
    groupedData: any[],
    refHeaderSelected: boolean,
    fromHeaderSelected: boolean,
    toHeaderSelected: boolean,
    dateHeaderSelected: boolean,
    statusHeaderSelected: boolean,
    commentHeaderSelected: boolean,
    patientHeaderSelected: boolean,
    refreshing: boolean,
    orderDesc: boolean,
  };

  static defaultProps = {
    selection: undefined,
    required: false,
    multiValue: false,
    freestyle: false,
    simpleSelect: false,
    isForPatient: true,
  };
  constructor(props: any) {
    super(props);
    this.state = {
      searchable: this.isSearchable(this.props.items),
      filter: '',
      item: {},
      options: [
        'Date',
        'Referral',
        'From',
        'To',
        'Status',
        'Comment',
        'Patient',
      ],
      groupBy: undefined,
      groupedData: [],
      refHeaderSelected: false,
      fromHeaderSelected: false,
      toHeaderSelected: false,
      dateHeaderSelected: false,
      statusHeaderSelected: false,
      commentHeaderSelected: false,
      patientHeaderSelected: false,
      refreshing: false,
      orderDesc: false,
    };
  }

  componentDidMount() {
    if (this.state.groupBy === undefined) {
      this.orderByDate();
      this.setState({groupBy: this.state.options[0]});
    }
  }

  isSearchable(items: string[]): boolean {
    return (
      this.props.freestyle === true || (items != undefined && items.length > 20)
    );
  }

  isSelected(item: any): boolean | string {
    const selection: any = this.props.selection;
    if (!selection) {
      return false;
    }
    if (selection === item) {
      return true;
    }

    return false;
  }

  select(item: any, select: boolean | string) {
    this.props.onUpdateSelection(item);
  }
  onDelete(item: any) {
    this.props.onDeleteSelection(item);
  }

  getItems(): any[] {
    let data: any[] = [...this.props.items];
    if (this.state.groupBy === 'Referral') {
      data = this.groupByReferral();
    } else if (this.state.groupBy === 'Date') {
      data = this.groupByDate();
    } else if (this.state.groupBy === 'From') {
      data = this.groupByFrom();
    } else if (this.state.groupBy === 'To') {
      data = this.groupByTo();
    } else if (this.state.groupBy === 'Status') {
      data = this.groupByStatus();
    } else if (this.state.groupBy === 'Comment') {
      data = this.groupByComment();
    } else if (this.state.groupBy === 'Patient') {
      data = this.groupByPatient();
    }
    if (!this.state.orderDesc) {
      data.reverse();
    }

    const filter: ?string =
      this.state.filter !== undefined && this.state.filter !== ''
        ? deAccent(this.state.filter.trim().toLowerCase())
        : undefined;
    if (filter) {
      if (!data) {
        data = [...this.props.items];
      }
      data = data.filter(
        (item: any) =>
          item != null &&
          item !== undefined &&
          JSON.stringify(item).trim().length > 0 &&
          (deAccent(JSON.stringify(item).toLowerCase()).indexOf(filter) >= 0 ||
            deAccent(
              JSON.stringify(
                formatCode('referralStatus', item.status),
              ).toLowerCase(),
            ).indexOf(filter) >= 0),
      );
    }
    return data;
  }

  updateValue(item: any, value: string | number) {
    this.setState({item: item});
    this.props.onUpdate(item);
  }

  selectField(value: string, options: any) {
    this.setState({groupBy: value});
  }

  getParent(item: FollowUp) {
    let parentReferral: FollowUp = item;
    let isFound: boolean = false;
    let data: any[] = [...this.props.items];
    for (const element: FollowUp of data) {
      if (item.linkedReferralId === element.id) {
        isFound = true;
        parentReferral = element;
        break;
      }
    }
    if (isFound && parentReferral && parentReferral.linkedReferralId) {
      return this.getParent(parentReferral);
    }
    return parentReferral;
  }

  resetItems(): any {
    if (!this.props.items) {
      return;
    }
    let data: any[] = [...this.props.items];
    data?.forEach((followUp: FollowUp, index: number) => {
      followUp.ref = followUp.ref.trim();
      followUp.isParent = false;
    });
    return data;
  }
  groupByDate(): any {
    let data: any[] = this.resetItems();
    data.sort(this.compareDateFollowUp);
    return data;
  }

  groupByFrom() {
    let data: any[] = this.resetItems();
    data.sort(this.compareFromFollowUp);
    return data;
  }

  groupByTo() {
    let data: any[] = this.resetItems();
    data.sort(this.compareToFollowUp);
    return data;
  }

  groupByStatus() {
    let data: any[] = this.resetItems();
    data.sort(this.compareStatusFollowUp);
    return data;
  }

  groupByComment() {
    let data: any[] = this.resetItems();
    data.sort(this.compareCommentFollowUp);
    return data;
  }

  groupByPatient() {
    let data: any[] = this.resetItems();
    data.sort(this.comparePatientFollowUp);
    return data;
  }

  groupByReferral(): any {
    if (!this.props.items) {
      return;
    }
    let groupedData: any = new Map();
    let data: any[] = [...this.props.items];
    for (const element: FollowUp of data) {
      let parentReferral: FollowUp = element;
      if (element.linkedReferralId) {
        parentReferral = this.getParent(element);
      }
      if (!groupedData.get(parentReferral)) {
        let followUpList: FollowUp[] = [];
        followUpList.push(element);
        groupedData.set(parentReferral, followUpList);
      } else {
        groupedData.get(parentReferral).push(element);
      }
    }

    groupedData = new Map(
      [...groupedData.entries()].sort(this.compareFollowUp),
    );

    let finalResult: any = [];
    for (const [key, value]: any of groupedData.entries()) {
      const parent: FollowUp = key;
      const childs: FollowUp[] = value;
      const parentId: string = parent.id;
      parent.isParent = true;
      finalResult.push(parent);
      const finalChilds: FollowUp[] = childs.filter(
        (v, i) => stripDataType(v.id) !== stripDataType(parentId),
      );
      for (const childElement: FollowUp of finalChilds) {
        if (stripDataType(childElement.id) !== stripDataType(parentId)) {
          childElement.ref = '        ' + childElement.ref.trim();
          childElement.isParent = false;
          finalResult.push(childElement);
        }
      }
    }
    return finalResult;
  }

  compareFollowUp(a: FollowUp, b: FollowUp): number {
    if (a.id < b.id) {
      return -1;
    } else if (a.id > b.id) {
      return 1;
    }
    return 0;
  }

  compareFromFollowUp(a: FollowUp, b: FollowUp): number {
    if (b.from.name.toLowerCase() < a.from.name.toLowerCase()) {
      return -1;
    } else if (b.from.name.toLowerCase() > a.from.name.toLowerCase()) {
      return 1;
    }
    return 0;
  }
  compareToFollowUp(a: FollowUp, b: FollowUp): number {
    if (b.to.name.toLowerCase() < a.to.name.toLowerCase()) {
      return -1;
    } else if (b.to.name.toLowerCase() > a.to.name.toLowerCase()) {
      return 1;
    }
    return 0;
  }
  compareDateFollowUp(a: FollowUp, b: FollowUp): number {
    if (b.date < a.date) {
      return -1;
    } else if (b.date > a.date) {
      return 1;
    }
    return 0;
  }
  compareStatusFollowUp(a: FollowUp, b: FollowUp): number {
    const aStatusCode: CodeDefinition = getCodeDefinition(
      'referralStatus',
      a.status,
    );
    const bStatusCode: CodeDefinition = getCodeDefinition(
      'referralStatus',
      b.status,
    );
    if (aStatusCode === undefined || bStatusCode === undefined) {
      return 0;
    }
    if (
      bStatusCode.description.toLowerCase() <
      aStatusCode.description.toLowerCase()
    ) {
      return -1;
    } else if (
      bStatusCode.description.toLowerCase() >
      aStatusCode.description.toLowerCase()
    ) {
      return 1;
    }
    return 0;
  }

  compareCommentFollowUp(a: FollowUp, b: FollowUp): number {
    if (isEmpty(b.comment) && !isEmpty(a.comment)) {
      return -10;
    }
    if (isEmpty(a.comment) && !isEmpty(b.comment)) {
      return 10;
    }
    if (isEmpty(a.comment) && isEmpty(b.comment)) {
      return 0;
    }

    if (b.comment.toLowerCase() < a.comment.toLowerCase()) {
      return -1;
    } else if (b.comment.toLowerCase() > a.comment.toLowerCase()) {
      return 1;
    }
    return 0;
  }

  comparePatientFollowUp(a: FollowUp, b: FollowUp): number {
    if (
      b.patientInfo.firstName.toLowerCase() <
      a.patientInfo.firstName.toLowerCase()
    ) {
      return -1;
    } else if (
      b.patientInfo.firstName.toLowerCase() >
      a.patientInfo.firstName.toLowerCase()
    ) {
      return 1;
    }
    return 0;
  }
  updateOrder() {
    const order: boolean = this.state.orderDesc;
    this.setState({orderDesc: !order});
  }

  orderByRef() {
    if (!this.state.refHeaderSelected) {
      this.setState({
        groupBy: 'Referral',
        refHeaderSelected: true,
        fromHeaderSelected: false,
        toHeaderSelected: false,
        dateHeaderSelected: false,
        statusHeaderSelected: false,
        commentHeaderSelected: false,
        patientHeaderSelected: false,
        orderDesc: true,
      });
    }
  }
  orderByDate() {
    if (!this.state.dateHeaderSelected) {
      this.setState({
        groupBy: 'Date',
        refHeaderSelected: false,
        fromHeaderSelected: false,
        toHeaderSelected: false,
        dateHeaderSelected: true,
        statusHeaderSelected: false,
        commentHeaderSelected: false,
        patientHeaderSelected: false,
        orderDesc: true,
      });
    } else {
      this.updateOrder();
    }
  }
  orderByPatient() {
    if (!this.state.patientHeaderSelected) {
      this.setState({
        groupBy: 'Patient',
        refHeaderSelected: false,
        fromHeaderSelected: false,
        toHeaderSelected: false,
        dateHeaderSelected: false,
        statusHeaderSelected: false,
        commentHeaderSelected: false,
        patientHeaderSelected: true,
        orderDesc: true,
      });
    } else {
      this.updateOrder();
    }
  }
  orderByFrom() {
    if (!this.state.fromHeaderSelected) {
      this.setState({
        groupBy: 'From',
        refHeaderSelected: false,
        fromHeaderSelected: true,
        toHeaderSelected: false,
        dateHeaderSelected: false,
        statusHeaderSelected: false,
        commentHeaderSelected: false,
        patientHeaderSelected: false,
        orderDesc: true,
      });
    } else {
      this.updateOrder();
    }
  }
  orderByTo() {
    if (!this.state.toHeaderSelected) {
      this.setState({
        groupBy: 'To',
        refHeaderSelected: false,
        fromHeaderSelected: false,
        toHeaderSelected: true,
        dateHeaderSelected: false,
        statusHeaderSelected: false,
        commentHeaderSelected: false,
        patientHeaderSelected: false,
        orderDesc: true,
      });
    } else {
      this.updateOrder();
    }
  }
  orderByStatus() {
    if (!this.state.statusHeaderSelected) {
      this.setState({
        groupBy: 'Status',
        refHeaderSelected: false,
        fromHeaderSelected: false,
        toHeaderSelected: false,
        dateHeaderSelected: false,
        statusHeaderSelected: true,
        commentHeaderSelected: false,
        patientHeaderSelected: false,
        orderDesc: true,
      });
    } else {
      this.updateOrder();
    }
  }
  orderByComment() {
    if (!this.state.commentHeaderSelected) {
      this.setState({
        groupBy: 'Comment',
        refHeaderSelected: false,
        fromHeaderSelected: false,
        toHeaderSelected: false,
        dateHeaderSelected: false,
        statusHeaderSelected: false,
        commentHeaderSelected: true,
        patientHeaderSelected: false,
        orderDesc: true,
      });
    } else {
      this.updateOrder();
    }
  }

  async handleRefresh() {
    this.setState({refreshing: true});
    await this.props.onRefreshList();
    this.setState({refreshing: false});
  }
  renderItem = ({item, index}) => {
    return (
      <View style={styles.fieldFlexContainer}>
        <Text>{item.key}</Text>
      </View>
    );
  };
  renderFilterField() {
    const style = [styles.searchField, {minWidth: 350 * fontScale}];

    return (
      <TextInput
        returnKeyType="search"
        placeholder={strings.findRow}
        autoCorrect={false}
        autoCapitalize="none"
        style={style}
        value={this.state.filter}
        onChangeText={(filter: string) => this.setState({filter})}
        testID={this.props.fieldId + '.filter'}
      />
    );
  }

  renderGroupField() {
    const options: string[] = this.state.options;
    const style = [styles.searchField, {marginLeft: 10}];
    return (
      <TilesField
        label="Group By"
        options={options}
        value={this.state.groupBy}
        style={style}
        onChangeValue={(value: string) => this.selectField(value, options)}
      />
    );
  }
  renderHeader() {
    const style = [styles.formTableColumnHeader, {textAlign: 'left'}];
    const styleText = [
      styles.text,
      {fontSize: 22 * fontScale, fontWeight: '500'},
    ];
    const styleSelected = [
      styles.text,
      {
        color: selectionFontColor,
        fontSize: 22 * fontScale,
        fontWeight: '500',
        textAlign: 'left',
      },
    ];
    const commentStyle = [style, {minWidth: 150 * fontScale}];
    const isPatientVisible: boolean =
      this.props.route &&
      this.props.route.params &&
      this.props.route.params.overview
        ? true
        : false;
    return (
      <View style={[styles.listRow, {margin: 0}]}>
        <View>
          <Text
            style={this.state.refHeaderSelected ? styleSelected : styles.text}>
            {' '}
          </Text>
        </View>
        <TouchableOpacity
          underlayColor={selectionColor}
          onPress={() => this.orderByRef()}
          style={style}>
          <View>
            <Text
              style={this.state.refHeaderSelected ? styleSelected : styleText}>
              {'Ref'}
            </Text>
          </View>
        </TouchableOpacity>
        {isPatientVisible && (
          <TouchableOpacity
            underlayColor={selectionColor}
            onPress={() => this.orderByPatient()}
            style={style}>
            <View style={styles.formRow}>
              {this.state.patientHeaderSelected && (
                <Icon
                  name={
                    this.state.orderDesc ? 'arrow-downward' : 'arrow-upward'
                  }
                  color={selectionFontColor}
                />
              )}
              <Text
                style={
                  this.state.patientHeaderSelected ? styleSelected : styleText
                }>
                {strings.patient}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          underlayColor={selectionColor}
          onPress={() => this.orderByFrom()}
          style={style}>
          <View style={styles.formRow}>
            {this.state.fromHeaderSelected && (
              <Icon
                name={this.state.orderDesc ? 'arrow-downward' : 'arrow-upward'}
                color={selectionFontColor}
              />
            )}
            <Text
              style={this.state.fromHeaderSelected ? styleSelected : styleText}>
              {strings.from}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          underlayColor={selectionColor}
          onPress={() => this.orderByTo()}
          style={style}>
          <View style={styles.formRow}>
            {this.state.toHeaderSelected && (
              <Icon
                name={this.state.orderDesc ? 'arrow-downward' : 'arrow-upward'}
                color={selectionFontColor}
              />
            )}
            <Text
              style={this.state.toHeaderSelected ? styleSelected : styleText}>
              {strings.to}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          underlayColor={selectionColor}
          onPress={() => this.orderByDate()}
          style={style}>
          <View style={styles.formRow}>
            {this.state.dateHeaderSelected && (
              <Icon
                name={this.state.orderDesc ? 'arrow-downward' : 'arrow-upward'}
                color={selectionFontColor}
              />
            )}
            <Text
              style={this.state.dateHeaderSelected ? styleSelected : styleText}>
              {strings.date}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          underlayColor={selectionColor}
          onPress={() => this.orderByStatus()}
          style={style}>
          <View style={styles.formRow}>
            {this.state.statusHeaderSelected && (
              <Icon
                name={this.state.orderDesc ? 'arrow-downward' : 'arrow-upward'}
                color={selectionFontColor}
              />
            )}
            <Text
              style={
                this.state.statusHeaderSelected ? styleSelected : styleText
              }>
              {strings.status}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          underlayColor={selectionColor}
          onPress={() => this.orderByComment()}
          style={commentStyle}>
          <View style={styles.formRow}>
            {this.state.commentHeaderSelected && (
              <Icon
                name={this.state.orderDesc ? 'arrow-downward' : 'arrow-upward'}
                color={selectionFontColor}
              />
            )}
            <Text
              style={
                this.state.commentHeaderSelected ? styleSelected : styleText
              }>
              {strings.comment}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  renderFooter = () => {
    return (
      <View>
        {this.props.loading ? (
          <ActivityIndicator size="large" color={selectionColor} />
        ) : (
          <></>
        )}
      </View>
    );
  };

  renderItemSeparator() {
    return <View style={styles.listSeparator} />;
  }
  render() {
    let data: any[] = this.getItems();

    const isVisible: boolean =
      this.props.route &&
      this.props.route.params &&
      this.props.route.params.overview
        ? true
        : false;

    return (
      <View style={styles.flexColumnLayout}>
        <View style={styles.formRow}>{this.renderFilterField()}</View>
        <FlatList
          initialNumToRender={10}
          data={data}
          extraData={{filter: this.state.filter, selection: this.state.item}}
          renderItem={(item, index) => (
            <TableListRow
              rowValue={item.item}
              simpleSelect={this.props.simpleSelect}
              selected={this.isSelected(item.item)}
              backgroundColor={item.index % 2 === 0 ? '#F9F9F9' : '#FFFFFF'}
              onChangeValue={(value: string | number) =>
                this.updateValue(item.item, value)
              }
              onSelect={(isSelected: boolean | string) =>
                this.select(item.item, isSelected)
              }
              onLongPress={() => this.onDelete(item.item)}
              testID={'Referral.Row-' + (item?.index + 1)}
              readonly={this.props.isDraft}
              isVisible={isVisible}
              allRefStatusCode={this.props.allRefStatusCode}
            />
          )}
          ListHeaderComponent={this.renderHeader()}
          stickyHeaderIndices={[0]}
          refreshing={this.state.refreshing}
          onRefresh={() => this.handleRefresh()}
          ListFooterComponent={this.renderFooter}
          onEndReached={this.props.handleLoadMore}
          onEndReachedThreshold={0.1}
        />
      </View>
    );
  }
}

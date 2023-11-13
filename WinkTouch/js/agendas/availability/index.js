/**
 * @flow
 */

'use strict';

import React, {useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {styles, fontScale} from '../../Styles';
import {FormInput, FormOptions, FormRow} from '../../Form';
import {strings} from '../../Strings';
import {getStore} from '../../DoctorApp';
import {Button as NativeBaseButton, Portal, Dialog} from 'react-native-paper';
import {getCachedItem} from '../../DataCache';
import {agendaStyles} from '../../Agenda';
import {getAppointmentTypes} from '../../Appointment';
import moment from 'moment';

export function AvailabilityModal({
  show,
  selectedDoctors,
  event,
  updateAvailability,
  cancelManageAvailabilities,
  showNewAvailabilityOptions,
  setUnavailableAppointment,
  resetAppointment,
  bookAppointment,
}) {

  const duration = () => {
    let arr = [];
    for(let i = 5; i < 60; i += 5) {
      arr.push({
          code: i,
          description: `${i} mins`
      });
    }
    return arr;
  }

  const labelWidth = 225 * fontScale;
  const selectedAppointmentTypes = event.appointmentTypes ? event.appointmentTypes.map((appointmentType) => {
    return appointmentType.replace('appointmentType-', '');
  })  : [];
  const [doctor, setDoctor] = useState(showNewAvailabilityOptions ? selectedDoctors[0] : event.userId);
  const [start, setStart] = useState(event?.start);
  const [currSlot, setSlot] = useState(1);
  const [appointmentTypes, setAppointmentTypes] = useState(selectedAppointmentTypes);
  const [timeFrame, setTimeFrame] = useState(30);

  const doctors: User[] = selectedDoctors.map((element) => {
    const doctor = getCachedItem(element);
    return {
      code: element,
      description: `${doctor?.firstName} ${doctor?.lastName}`,
    };
  });

  const startOptions = () => {
    let intervals = [
      {
        code: moment(event?.start),
        description: moment(event?.start).format('h:mm a'),
      }
    ];

    for( let timeCount = timeFrame; timeCount < 60; timeCount += timeFrame) {
      intervals.push({
          code: moment(event?.start).add(timeCount, 'minutes'),
          description: moment(event?.start).add(timeCount, 'minutes').format('h:mm a'),
      });
    }
    return intervals;
  }

  const renderAppointmentsTypes = () => {
    const updateValue = (val, index) => {
      let apps = [...appointmentTypes];
      if (val) {
        apps.push(val);
      } else {
        apps.splice(index, 1);
      }
      setAppointmentTypes(apps);
    };
    let appointments: string[] = [...appointmentTypes];
    let dropdowns = [];
    dropdowns.push(
      <View style={{flexDirection: 'row'}}>
        <FormOptions
          options={getAppointmentTypes()}
          showLabel={false}
          readonly={!showNewAvailabilityOptions}
          label={strings.AppointmentType}
          value={appointments ? appointments[0] : ''}
          onChangeValue={(code: ?string | ?number) => updateValue(code, 0)}
        />
      </View>,
    );
    if (appointments && appointments.length >= 1) {
      for (let i: number = 1; i <= appointments.length; i++) {
        if (i < 5) {
          dropdowns.push(
            <View style={{flexDirection: 'row'}}>
              <FormOptions
                options={getAppointmentTypes()}
                showLabel={false}
                readonly={!showNewAvailabilityOptions}
                label={strings.AppointmentType}
                value={appointments[i]}
                onChangeValue={(code: ?string | ?number) =>
                  updateValue(code, i)
                }
              />
            </View>,
          );
        }
      }
    }

    return dropdowns;
  };

  return (
    <Portal theme={{colors: {backdrop: 'transparent'}}}>
      <Dialog
        style={{width: '50%', alignSelf: 'center', backgroundColor: '#fff'}}
        visible={show}
        onDismiss={cancelManageAvailabilities}
        dismissable={true}>
        <Dialog.Content>
          {showNewAvailabilityOptions && <FormInput
            multiOptions
            singleSelect
            value={currSlot}
            style={{flexDirection: 'row', justifyContent: 'space-evenly'}}
            showLabel={false}
            readonly={false}
            definition={{
              options: [
                {label: strings.createAvailability, value: 1},
                {label: strings.markAsUnavailable, value: 2},
              ],
            }}
            onChangeValue={(slot) => setSlot(slot)}
            errorMessage={'error'}
            isTyping={false}
          />}
          <View style={{marginTop: 25}}>
            <View style={agendaStyles.field}>
              <Text
                style={[
                  styles.formLabel,
                  {width: labelWidth},
                ]}>
                {strings.store} :
              </Text>
              <View style={styles.formField}>
                <Text style={{opacity: 0.7}}>{getStore().name}</Text>
              </View>
            </View>
            <View style={agendaStyles.field}>
              <FormOptions
                labelWidth={labelWidth}
                options={doctors}
                showLabel={true}
                readonly={!showNewAvailabilityOptions}
                label={strings.doctor}
                value={doctor}
                hideClear={true}
                onChangeValue={(code) => {
                  if (code) {
                    setDoctor(code);
                  }
                }}
              />
            </View>
            {showNewAvailabilityOptions && <View style={agendaStyles.field}>
              <FormOptions
                  labelWidth={labelWidth}
                  options={duration()}
                  showLabel={true}
                  readonly={!showNewAvailabilityOptions}
                  label={strings.duration}
                  value={timeFrame}
                  hideClear={true}
                  onChangeValue={(code) => {
                    if (code) {
                      setTimeFrame(code);
                      setStart(moment(event?.start));
                    }
                  }}
                />
            </View>}
            <View style={agendaStyles.field}>
              <FormOptions
                labelWidth={labelWidth}
                options={startOptions()}
                showLabel={true}
                label={strings.from}
                readonly={!showNewAvailabilityOptions}
                value={moment(start).format('h:mm a')}
                hideClear={true}
                onChangeValue={(date) => {
                  if (date) {
                    setStart(date);
                  }
                }}
              />
            </View>

            <View style={agendaStyles.field}>
              <FormOptions
                labelWidth={labelWidth}
                options={[]}
                showLabel={true}
                readonly={true}
                label={strings.to}
                value={ showNewAvailabilityOptions 
                  ?  moment(start).add(timeFrame, 'minutes').format('h:mm a') 
                  : moment(event?.end).format('h:mm a')}
              />
            </View>

            <View style={agendaStyles.field}>
              <Text
                style={[
                  styles.formLabel,
                  {width: labelWidth},
                ]}>
                {strings.AppointmentType} :
              </Text>
              <View style={{flex: 100}}>{renderAppointmentsTypes()}</View>
            </View>
          </View>
          {!showNewAvailabilityOptions && (
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 10,
              }}>
              {!event.isBusy && <TouchableOpacity
                onPress={bookAppointment}
                style={styles.appointmentActionButton}>
                <Text style={{color: '#fff'}}>{strings.book}</Text>
              </TouchableOpacity>}
              {!event.isBusy && <TouchableOpacity
                onPress={setUnavailableAppointment}
                style={styles.appointmentActionButton}>
                <Text style={{color: '#fff'}}> {strings.markAsUnavailable}</Text>
              </TouchableOpacity>}
              <TouchableOpacity
                onPress={resetAppointment}
                style={styles.appointmentActionButton}>
                <Text style={{color: '#fff'}}> {strings.reset}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <NativeBaseButton onPress={cancelManageAvailabilities}>
            {strings.close}
          </NativeBaseButton>
          {showNewAvailabilityOptions && <NativeBaseButton
            onPress={() =>
              updateAvailability({
                ...event,
                start,
                end: moment(start).add(timeFrame, 'minutes'),
                userId: doctor,
                slotType: currSlot,
                appointmentTypes,
              })
            }>
            {strings.apply}
          </NativeBaseButton>}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

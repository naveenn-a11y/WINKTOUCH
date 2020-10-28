import DateTimePicker from 'react-datepicker';
import React, {Component} from 'react';
import 'react-datepicker/dist/react-datepicker.css';

export default class CustomDateTimePicker extends Component {
  props: {
    selected: Date,
    onChange: (date: Date) => void,
  };

  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <DateTimePicker
        selected={this.props.selected}
        onChange={(date) => this.props.onChange(date)}
      />
    );
  }
}

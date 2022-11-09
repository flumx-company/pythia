import React, { HTMLAttributes } from 'react';
import _camelCase from 'lodash/camelCase';
import _uniqueId from 'lodash/uniqueId';
import classNames from 'classnames';
import '@/components/Checkbox.pcss';

type CheckboxSize = 'sm';

interface CheckboxState {
  id?: string;
}

interface CheckboxProps extends HTMLAttributes<HTMLInputElement> {
  label?: string;
  checked?: boolean;
  name?: string;
  size?: CheckboxSize;
}

export default class extends React.Component<CheckboxProps, CheckboxState> {
  componentWillMount() {
    const prefix = _camelCase(this.props.label) || 'checkbox';

    this.setState({
      id: _uniqueId(prefix),
    });
  }

  render() {
    const { label, checked, onChange } = this.props;
    const id = this.state && this.state.id || undefined;

    return (
      <div>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          styleName={
            classNames('checkbox')
          }
        />

        <label htmlFor={id}>{label}</label>
      </div>
    );
  }
}

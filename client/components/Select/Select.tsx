import React from 'react';

import '@/components/Select/Select.pcss';

import { SelectProps } from '@/components/Select/Select.d';

const Select: React.SFC<SelectProps> = ({ options = [], name, label, onChange, value }) => {
  const selectHandler = (e: any) => {
    onChange(e);
  };
  return (
    <div styleName="select-wrapper">
      {
        label &&
        <label styleName="select-label">
          {label}
        </label>
      }
      <div className="relative">
        <select styleName="select" name={name} onChange={selectHandler} value={value || ''}>
          <option key={'default'} disabled={true} value="">Select value</option>
          {options.length > 0 && options.map(item => (
            <option key={item.value} value={item.value}>{item.title}</option>
          ))}
        </select>
        <div styleName="select-arrow">
          <svg styleName="select-svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Select;

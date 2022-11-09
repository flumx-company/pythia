import React from 'react';

interface FormFieldProps {
  name: string;
  value: string;
  label?: string;
  onChange?: (e: React.ChangeEvent<any>) => any;
  required?: boolean;
  tip?: string;
}

interface FormFieldState {

}

export default (
  { name, value, onChange, label, required, tip }: FormFieldProps,
  {}: FormFieldState,
) => (
  <div className="my-2">
    {label && (
      <label className="text-xs font-bold text-grey-darker">
        {label}
        {required && (
          ' *'
        )}
      </label>
    )}

    <div>
      <input
        className="border-b block w-full py-2 px-3"
        type="text"
        name={name}
        value={value}
        onChange={onChange}
      />
    </div>

    {tip && (
      <div className="text-xs text-grey-darker">{tip}</div>
    )}
  </div>
);

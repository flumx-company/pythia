import React, { SFC, HTMLAttributes } from 'react';
import classNames from 'classnames';
import '@/components/Button.pcss';

type ButtonSize = 'sm' | 'xs';
type ButtonType = 'primary' | 'secondary' | 'danger' | 'success';

interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  type?: ButtonType;
  submit?: Boolean;
  reset?: Boolean;
  disabled?: Boolean;
  inverted?: Boolean;
}

const Button: SFC<ButtonProps> = ({
  size,
  type,
  submit,
  reset,
  disabled,
  inverted,
  ...props
}) => {
  let htmlType: 'submit' | 'reset' | 'button' | undefined;

  if (submit) {
    htmlType = 'submit';
  } else if (reset) {
    htmlType = 'reset';
  } else {
    htmlType = 'button';
  }

  return (
    <button
      type={htmlType}
      {...props}
      styleName={
        classNames(
          'button',
          [
            size && `button-${size}`,
            type && `button-${type}`,
            inverted && 'button-inverted',
            disabled && 'button-disabled',
          ],
        )
      }
      className={props.className}
    >
      {props.children}
    </button>
  );
};

export default Button;

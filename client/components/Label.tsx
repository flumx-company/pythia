import React from 'react';
import classNames from 'classnames';
import '@/components/Label.pcss';

type LabelType = 'success' | 'error';

interface LabelProps {
  text: string;
  type?: LabelType;
}

const Label: React.SFC<LabelProps> = ({ text, type }) => (
  <div
    styleName={classNames([
      'label',
      type && `label-${type}`,
    ])}
  >
    {text}
  </div>
);

export default Label;

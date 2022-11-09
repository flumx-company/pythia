export interface SelectProps {
  options?: Option[];
  name: string;
  label?: string;
  value?: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
}

export interface Option {
  title: string;
  value: string;
}

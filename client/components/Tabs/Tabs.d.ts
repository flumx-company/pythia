export interface TabsProps {
  items: Item[];
}

export interface Item {
  title: string;
  href: string;
  type: string;
  disabled?: boolean;
}

import { Component } from 'react';
import ReactDOM from 'react-dom';

const backdropClassName = 'modal-backdrop';
const modalClassName = 'modal';

export default class Modal extends Component<any, any> {
  // Create a div that we'll render the modal into. Because each
  // Modal component has its own element, we can render multiple
  // modal components into the modal container.
  root: HTMLElement = document.getElementById('modals')!;
  modal: HTMLElement = document.createElement('div');
  backdrop: any;

  constructor(props: any) {
    super(props);
  }

  addModal() {
    this.backdrop.appendChild(this.modal);
  }

  removeModal() {
    this.backdrop.removeChild(this.modal);

    if (!this.backdrop.querySelector(modalClassName)) {
      this.root.removeChild(this.backdrop);
    }
  }

  componentDidMount() {
    this.root = document.getElementById('modals')!;

    this.modal.classList.add(modalClassName);
    this.backdrop = this.root.querySelector(`.${backdropClassName}`);

    if (!this.backdrop) {
      this.backdrop = document.createElement('div');
      this.backdrop.classList.add(backdropClassName);
      this.root.appendChild(this.backdrop);
    }

    this.addModal();
  }

  componentWillUnmount() {
    this.removeModal();
  }

  render() {
    // Use a portal to render the children into the element
    return ReactDOM.createPortal(
      // Any valid React child: JSX, strings, arrays, etc.
      this.props.children,
      // A DOM element
      this.modal,
    );
  }
}

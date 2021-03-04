import { createButton, createDiv, createLabel } from '../domUtil';
import classes from '../../scss/call.scss';

class CallTextButton {
  constructor({ buttonClass, labelText, type }) {
    const wrapper = createDiv({ className: `${classes['column']} ${classes['center']} ${classes['hidden']}` });
    const icon = createButton({ className: buttonClass });
    const label = createLabel({ innerText: labelText });
    icon.appendChild(label);
    wrapper.appendChild(icon);

    this.element = wrapper;
    this.type = type || 'mutual';
    this.icon = icon;
    this.label = label;
  }

  set onclick(value) {
    this.icon.onclick = value;
  }
}

export {
  CallTextButton
};
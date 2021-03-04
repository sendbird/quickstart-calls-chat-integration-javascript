import styles from '../../scss/message-delete-modal.scss';
import { createDivEl, errorAlert, protectFromXSS } from '../utils';
import { SendBirdAction } from '../SendBirdAction';
import { Spinner } from './Spinner';
import { Modal } from './Modal';
import { Chat } from '../Chat';

const title = 'Delete Message';
const description = 'Are you Sure? Do you want to delete message?';
const submitText = 'DELETE';

class MessageDeleteModal extends Modal {
  constructor({ channel, message }) {
    super({ title, description, submitText });
    this.channel = channel;
    this.message = message;
    this._createElement();
    this._createHandler();
  }

  _createElement() {
    const content = createDivEl({
      className: styles['modal-message'],
      content: this.message.isFileMessage() ? protectFromXSS(this.message.name) : protectFromXSS(this.message.message)
    });
    this.contentElement.appendChild(content);
  }

  _createHandler() {
    this.submitHandler = () => {
      SendBirdAction.getInstance()
        .deleteMessage({ channel: this.channel, message: this.message })
        .then(() => {
          Spinner.remove();
          this.close();
          Chat.getInstance().main.removeMessage(this.message.messageId);
        })
        .catch(error => {
          errorAlert(error.message);
        });
    };
  }
}

export { MessageDeleteModal };

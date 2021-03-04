import styles from '../../scss/message.scss';
import { createDivEl, errorAlert, isImage, protectFromXSS, setDataInElement, timestampToTime } from '../utils';
import { SendBirdAction } from '../SendBirdAction';
import { COLOR_RED, MESSAGE_REQ_ID } from '../const';
import { MessageDeleteModal } from './MessageDeleteModal';
import { UserBlockModal } from './UserBlockModal';
import { Chat } from '../Chat';
import { SendBirdCallAction } from '../SendBirdCallAction';
import { Call } from '../Call';

class Message {
  constructor({ channel, message }) {
    this.channel = channel;
    this.message = message;
    this.element = this._createElement();
  }

  _createElement() {
    if (this.message.isUserMessage()) {
      if (this.message.plugins.some((plugin) => plugin.vendor === 'sendbird' && plugin.type === 'call')) {
        return this._createCallElement();
      } else {
        return this._createUserElement();
      }
    } else if (this.message.isFileMessage()) {
      return this._createFileElement();
    } else if (this.message.isAdminMessage()) {
      return this._createAdminElement();
    } else {
      console.error('Message is invalid data.');
      return null;
    }
  }

  _hoverOnNickname(nickname, hover) {
    if (!SendBirdAction.getInstance().isCurrentUser(this.message.sender)) {
      nickname.innerHTML = hover ? 'BLOCK   ' : `${protectFromXSS(this.message.sender.nickname)} : `;
      nickname.style.color = hover ? COLOR_RED : '';
      nickname.style.opacity = hover ? '1' : '';
    }
  }

  _hoverOnTime(time, hover) {
    if (SendBirdAction.getInstance().isCurrentUser(this.message.sender)) {
      time.innerHTML = hover ? 'DELETE' : timestampToTime(this.message.createdAt);
      time.style.color = hover ? COLOR_RED : '';
      time.style.opacity = hover ? '1' : '';
      time.style.fontWeight = hover ? '600' : '';
    }
  }

  _createCallElement() {
    const detail = this.message.plugins.find((plugin) => plugin.vendor === 'sendbird' && plugin.type === 'call').detail;

    const sendbirdAction = SendBirdAction.getInstance();
    const isCurrentUser = sendbirdAction.isCurrentUser(this.message.sender);
    const root = createDivEl({ className: styles['call-message'], id: this.message.messageId });
    setDataInElement(root, MESSAGE_REQ_ID, this.message.reqId);

    const messageContent = createDivEl({ className: styles['message-content'] });
    const nickname = createDivEl({
      className: isCurrentUser ? [styles['message-nickname'], styles['is-user']] : styles['message-nickname'],
      content: `${protectFromXSS(this.message.sender.nickname)} : `
    });
    nickname.addEventListener('mouseover', () => {
      this._hoverOnNickname(nickname, true);
    });
    nickname.addEventListener('mouseleave', () => {
      this._hoverOnNickname(nickname, false);
    });
    nickname.addEventListener('click', () => {
      if (!isCurrentUser) {
        const userBlockModal = new UserBlockModal({ user: this.message.sender, isBlock: true });
        userBlockModal.render();
      }
    });
    messageContent.appendChild(nickname);

    const bubble = createDivEl({ className: styles['bubble-content'] });
    const isInitiator = SendBirdAction.getInstance().isCurrentUser(this.channel.members[0]);
    const peer = isInitiator ? this.channel.members[1] : this.channel.members[0];
    bubble.onclick = () => {
      SendBirdCallAction
        .getInstance()
        .dial(peer.userId, detail.is_video_call, {
            localMediaView: null,
            remoteMediaView: null,
            audioEnabled: true,
            videoEnabled: true,
          },
          this.channel.url
        )
        .then((call) => {
          const sbc = Call.getInstance();
          sbc.setCall(call);
          sbc.render();
        })
        .catch(error => {
          errorAlert(error.message);
        });
    };

    const icon = createDivEl({ className: (detail.is_video_call) ? styles['video-icon'] : styles['audio-icon'] });
    let msgContent;
    if (detail.end_result) {
      if (detail.end_result === 'completed') {
        const durationInSec = Math.floor(detail.duration / 1000);
        const minutes = `0${Math.floor(durationInSec / 60)}`.slice(-2);
        const seconds = `0${durationInSec % 60}`.slice(-2);
        msgContent = `${minutes}:${seconds}`;
      } else {
        msgContent = detail.end_result;
      }
    } else {
      msgContent = (detail.is_video_call) ? 'Video calling...' : 'Voice calling...';
    }
    const msg = createDivEl({ className: styles['message-content'], content: msgContent });
    bubble.appendChild(icon);
    bubble.appendChild(msg);

    messageContent.appendChild(bubble);

    root.appendChild(messageContent);

    return root;
  }

  _createUserElement() {
    const sendbirdAction = SendBirdAction.getInstance();
    const isCurrentUser = sendbirdAction.isCurrentUser(this.message.sender);
    const root = createDivEl({ className: styles['chat-message'], id: this.message.messageId });
    setDataInElement(root, MESSAGE_REQ_ID, this.message.reqId);

    const messageContent = createDivEl({ className: styles['message-content'] });
    const nickname = createDivEl({
      className: isCurrentUser ? [styles['message-nickname'], styles['is-user']] : styles['message-nickname'],
      content: `${protectFromXSS(this.message.sender.nickname)} : `
    });
    nickname.addEventListener('mouseover', () => {
      this._hoverOnNickname(nickname, true);
    });
    nickname.addEventListener('mouseleave', () => {
      this._hoverOnNickname(nickname, false);
    });
    nickname.addEventListener('click', () => {
      if (!isCurrentUser) {
        const userBlockModal = new UserBlockModal({ user: this.message.sender, isBlock: true });
        userBlockModal.render();
      }
    });
    messageContent.appendChild(nickname);

    const msg = createDivEl({ className: styles['message-content'], content: protectFromXSS(this.message.message) });
    messageContent.appendChild(msg);

    const time = createDivEl({
      className: isCurrentUser ? [styles.time, styles['is-user']] : styles.time,
      content: timestampToTime(this.message.createdAt)
    });
    time.addEventListener('mouseover', () => {
      this._hoverOnTime(time, true);
    });
    time.addEventListener('mouseleave', () => {
      this._hoverOnTime(time, false);
    });
    time.addEventListener('click', () => {
      if (isCurrentUser) {
        const messageDeleteModal = new MessageDeleteModal({
          channel: this.channel,
          message: this.message
        });
        messageDeleteModal.render();
      }
    });
    messageContent.appendChild(time);

    if (this.channel.isGroupChannel()) {
      const count = sendbirdAction.getReadReceipt(this.channel, this.message);
      const read = createDivEl({
        className: count ? [styles.read, styles.active] : styles.read,
        content: count
      });
      messageContent.appendChild(read);
    }

    root.appendChild(messageContent);
    return root;
  }

  _createFileElement() {
    const sendbirdAction = SendBirdAction.getInstance();
    const root = createDivEl({ className: styles['chat-message'], id: this.message.messageId });
    setDataInElement(root, MESSAGE_REQ_ID, this.message.reqId);

    const messageContent = createDivEl({ className: styles['message-content'] });
    const nickname = createDivEl({
      className: sendbirdAction.isCurrentUser(this.message.sender)
        ? [styles['message-nickname'], styles['is-user']]
        : styles['message-nickname'],
      content: `${protectFromXSS(this.message.sender.nickname)} : `
    });
    messageContent.appendChild(nickname);

    const msg = createDivEl({
      className: [styles['message-content'], styles['is-file']],
      content: protectFromXSS(this.message.name)
    });
    msg.addEventListener('click', () => {
      window.open(this.message.url);
    });
    messageContent.appendChild(msg);

    const time = createDivEl({ className: styles.time, content: timestampToTime(this.message.createdAt) });
    time.addEventListener('mouseover', () => {
      this._hoverOnTime(time, true);
    });
    time.addEventListener('mouseleave', () => {
      this._hoverOnTime(time, false);
    });
    time.addEventListener('click', () => {
      const messageDeleteModal = new MessageDeleteModal({
        channel: this.channel,
        message: this.message
      });
      messageDeleteModal.render();
    });
    messageContent.appendChild(time);

    if (this.channel.isGroupChannel()) {
      const count = sendbirdAction.getReadReceipt(this.channel, this.message);
      const read = createDivEl({
        className: count ? [styles.read, styles.active] : styles.read,
        content: count
      });
      messageContent.appendChild(read);
    }

    root.appendChild(messageContent);

    if (isImage(this.message.type) && this.message.messageId) {
      const imageContent = createDivEl({ className: styles['image-content'] });
      imageContent.addEventListener('click', () => {
        window.open(this.message.url);
      });
      const imageRender = document.createElement('img');
      imageRender.className = styles['image-render'];
      imageRender.src = protectFromXSS(this.message.url);
      imageRender.onload = () => {
        Chat.getInstance().main.repositionScroll(imageRender.offsetHeight);
      };
      imageContent.appendChild(imageRender);
      root.appendChild(imageContent);
    }

    return root;
  }

  _createAdminElement() {
    const root = createDivEl({ className: styles['chat-message'], id: this.message.messageId });
    const msg = createDivEl({ className: styles['message-admin'], content: protectFromXSS(this.message.message) });
    root.appendChild(msg);
    return root;
  }

  static getRootElementClasasName() {
    return styles['chat-message'];
  }

  static getReadReceiptElementClassName() {
    return styles.active;
  }
}

export { Message };

import styles from '../../scss/chat-top-menu.scss';
import { createDivEl, errorAlert, protectFromXSS } from '../utils';
import { Chat } from '../Chat';
import { ChatLeftMenu } from '../ChatLeftMenu';
import { UserList } from './UserList';
import { SendBirdAction } from '../SendBirdAction';
import { SendBirdCallAction } from '../SendBirdCallAction';
import { Call } from '../Call';

class ChatTopMenu {
  constructor(channel) {
    this.channel = channel;
    this.element = this._createElement(channel);
  }

  get chatTitle() {
    const isOpenChannel = this.channel.isOpenChannel();
    if (isOpenChannel) {
      return `# ${this.channel.name}`;
    } else {
      return this.channel.members
        .map(member => {
          return protectFromXSS(member.nickname);
        })
        .join(', ');
    }
  }

  _createElement(channel) {
    const isOpenChannel = channel.isOpenChannel();

    const root = createDivEl({ className: styles['chat-top'] });

    this.title = createDivEl({
      className: isOpenChannel ? styles['chat-title'] : [styles['chat-title'], styles['is-group']],
      content: this.chatTitle
    });
    root.appendChild(this.title);

    const button = createDivEl({ className: styles['chat-button'] });
    const audioCall = createDivEl({ className: styles['button-audio-call'] });
    audioCall.addEventListener('click', () => {
      const isInitiator = SendBirdAction.getInstance().isCurrentUser(this.channel.members[0]);
      const peer = isInitiator ? this.channel.members[1] : this.channel.members[0];

      const sbca = SendBirdCallAction.getInstance();
      sbca
        .dial(peer.userId, false, {
            localMediaView: null,
            remoteMediaView: null,
            audioEnabled: true,
            videoEnabled: false,
          },
          channel.url
        )
        .then((call) => {
          const sbc = Call.getInstance();
          sbc.setCall(call);
          sbc.render();
        })
        .catch(error => {
          errorAlert(error.message);
        });
    });
    button.appendChild(audioCall);

    const videoCall = createDivEl({ className: styles['button-video-call'] });
    videoCall.addEventListener('click', () => {
      const isInitiator = SendBirdAction.getInstance().isCurrentUser(this.channel.members[0]);
      const peer = isInitiator ? this.channel.members[1] : this.channel.members[0];

      const sbca = SendBirdCallAction.getInstance();
      sbca
        .dial(peer.userId, true, {
            localMediaView: null,
            remoteMediaView: null,
            audioEnabled: true,
            videoEnabled: true,
          },
          channel.url
        )
        .then((call) => {
          const sbc = Call.getInstance();
          sbc.setCall(call);
          sbc.render();
          sbc.setDialing();
        })
        .catch(error => {
          errorAlert(error.message);
        });
    });
    button.appendChild(videoCall);

    if (!isOpenChannel) {
      const invite = createDivEl({ className: styles['button-invite'] });
      invite.addEventListener('click', () => {
        UserList.getInstance().render(true);
      });
      button.appendChild(invite);
      const hide = createDivEl({ className: styles['button-hide'] });
      hide.addEventListener('click', () => {
        SendBirdAction.getInstance()
          .hide(channel.url)
          .then(() => {
            ChatLeftMenu.getInstance().removeGroupChannelItem(this.channel.url);
            Chat.getInstance().renderEmptyElement();
          })
          .catch(error => {
            errorAlert(error.message);
          });
      });
      button.appendChild(hide);
    }
    const leave = createDivEl({ className: styles['button-leave'] });
    leave.addEventListener('click', () => {
      if (isOpenChannel) {
        ChatLeftMenu.getInstance().removeOpenChannelItem(this.channel.url);
        SendBirdAction.getInstance()
          .exit(channel.url)
          .then(() => {
            Chat.getInstance().renderEmptyElement();
          })
          .catch(error => {
            errorAlert(error.message);
          });
      } else {
        SendBirdAction.getInstance()
          .leave(channel.url)
          .then(() => {
            ChatLeftMenu.getInstance().removeGroupChannelItem(this.channel.url);
            Chat.getInstance().renderEmptyElement();
          })
          .catch(error => {
            errorAlert(error.message);
          });
      }
    });
    button.appendChild(leave);
    root.appendChild(button);
    return root;
  }

  updateTitle(channel) {
    this.channel = channel;
    this.title.innerHTML = this.chatTitle;
  }
}

export { ChatTopMenu };

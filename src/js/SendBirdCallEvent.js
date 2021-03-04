import SendBirdCall from 'sendbird-calls';
import { uuid4 } from './utils';

let instance = null;

class SendBirdCallEvent {
  constructor() {
    if (instance) {
      return instance;
    }

    this.sbc = SendBirdCall;
    this.key = uuid4();
    this._createChannelHandler();

    instance = this;
  }

  _createChannelHandler() {
    const handler = new this.sb.ChannelHandler();
    handler.onMessageReceived = (channel, message) => {
      if (this.onMessageReceived) {
        this.onMessageReceived(channel, message);
      }
    };
    handler.onMessageUpdated = (channel, message) => {
      if (this.onMessageUpdated) {
        this.onMessageUpdated(channel, message);
      }
    };
    handler.onMessageDeleted = (channel, messageId) => {
      if (this.onMessageDeleted) {
        this.onMessageDeleted(channel, messageId);
      }
    };

    handler.onReadReceiptUpdated = groupChannel => {
      if (this.onReadReceiptUpdated) {
        this.onReadReceiptUpdated(groupChannel);
      }
    };
    handler.onTypingStatusUpdated = groupChannel => {
      if (this.onTypingStatusUpdated) {
        this.onTypingStatusUpdated(groupChannel);
      }
    };
    this.sb.addChannelHandler(this.key, handler);
  }
}
import SendBirdCall from 'sendbird-calls';
import { APP_ID as appId } from './const';

let instance = null;

class SendBirdCallAction {
  constructor() {
    if (instance) {
      return instance;
    }
    this.sbc = SendBirdCall;
    this.onRinging = null;
    instance = this;
  }

  init() {
    SendBirdCall.init(appId);
    SendBirdCall.addListener(1, {
      onRinging: (call) => {
        if (this.isBusy()) {
          call.end();
        } else if (!call.endResult) {
          if (this.onRinging) {
            this.onRinging(call);
          }
        }
      }
    });
  }

  login(userId, accessToken) {
    return SendBirdCall.authenticate({ userId: userId, accessToken: accessToken })
      .then(() => {
        SendBirdCall.connectWebSocket();
      })
      .then(() => {
        //if (this.onLoginSuccess) this.onLoginSuccess();
      })
      .catch(e => {
        throw e;
      });
  }

  logout() {
    SendBirdCall.deauthenticate();
  }

  dial(peerId, isVideoCall = false, callOption, channelUrl, callback) {
    if (peerId === '') {
      alert('Enter a valid user ID');
      return;
    }

    return new Promise((resolve, reject) => {
      const call = SendBirdCall.dial({
        userId: peerId,
        isVideoCall: isVideoCall,
        callOption: callOption,
        sendBirdChatOptions: {
          channelUrl
        },
      }, (call, error) => {
        if (error) {
          reject(error);
        }

        if (callback) callback(call, error);
        resolve(call);
      });
    });
  }

  isBusy() {
    return this.sbc.getOngoingCallCount() > 1;
  }

  static getInstance() {
    return new SendBirdCallAction();
  }
}

export {
  SendBirdCallAction
};
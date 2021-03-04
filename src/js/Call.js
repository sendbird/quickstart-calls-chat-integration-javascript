import { createAudio, createDiv, createImg, createLabel, createVideo } from './domUtil';
import classes from '../scss/call.scss';
import { CallButtons } from './components/CallButtons';
import { PeriodicJob } from './components/PeriodicJob';

let instance = null;

const targetEl = document.querySelector('.body-center');

class Call {
  constructor() {
    if (instance) {
      return instance;
    }

    this.call = null;
    this.callButtons = null;
    this.localMediaView = null;
    this.remoteMediaView = null;
    this.element = null;

    instance = this;
  }

  setCall(call) {
    this.call = call;
    this.addCallListeners(call);
  }

  setDialing() {
    this.callButtons.setDialing();
  }

  setRinging() {
    this.callButtons.setRinging();
  }

  setConnected() {
    this.callButtons.setConnected();
  }

  setEnded() {
    this.callButtons.setEnded();
  }

  render() {
    this.close();

    this.element = createDiv({className: `${classes['column']} ${classes['center']} ${classes['view']} ${classes['viewCall']}`});
    const localUser = this.call.localUser;
    const remoteUser = this.call.remoteUser;

    this.peerProfile = createImg({
      src: remoteUser.profileUrl,
      alt: 'Sendbird voice & video call opponent profile photo',
      className: classes['remoteProfile'],
      onerror: (e) => e.target.style.visibility = 'hidden'
    });
    this.peerName = createLabel({
      id: 'peer_name',
      innerText: (remoteUser.nickname ? remoteUser.nickname : remoteUser.userId),
      className: `${classes['peerName']} ${classes['fontBig']} ${classes['fontDemi']}`
    });

    let connectionText;
    if (this.call.isVideoCall) {
      connectionText = 'incoming video call…';
    } else {
      connectionText = 'incoming voice call…';
    }
    this.connectionInfo = createLabel({
      id: 'conn_info_label',
      className: `${classes['connectionInfo']} ${classes['fontNormal']} ${classes['fontColorWhite']}`,
      innerText: connectionText
    });

    const peerStateDiv = createDiv({ id: 'peer_state', className: `${classes['column']} ${classes['peerStateDiv']} ${classes['invisible']}` });
    const peerMuteIcon = createDiv({ id: 'peer_mute_icon', className: `${classes['peerMuteIcon']}` });
    const peerMuteLabel = createLabel({ id: 'peer_mute_label', className: `${classes['peerMuteLabel']} ${classes['fontSmall']} ${classes['fontColorWhite']}`, innerText: `${remoteUser.userId} is muted.` });
    peerStateDiv.appendChild(peerMuteIcon);
    peerStateDiv.appendChild(peerMuteLabel);

    const buttons = new CallButtons(this.call);
    this.callButtons = buttons;

    if (this.call.isVideoCall) {
      this.localMediaView = createVideo({ className: `${classes['videoView']}`, autoplay: true, muted: true, style: 'background-color: #fff;' });
      this.remoteMediaView = createVideo({ className: `${classes['videoView']}`, autoplay: true, muted: false, remote: true });
    } else {
      this.localMediaView = createAudio({ autoplay: true, muted: true });
      this.remoteMediaView = createAudio({ autoplay: true, muted: false, remote: true });
    }

    this.localMediaViewDiv = createDiv({ className: `${classes['videoViewDiv']} ${classes['videoFull']}` });
    this.remoteMediaViewDiv = createDiv({ className: `${classes['videoViewDiv']} ${classes['videoHidden']}` });
    this.localMediaViewDiv.appendChild(this.localMediaView);
    this.remoteMediaViewDiv.appendChild(this.remoteMediaView);

    this.call.setLocalMediaView(this.localMediaView);
    this.call.setRemoteMediaView(this.remoteMediaView);

    const background = createDiv({ className: classes['callBackground'] });
    const foreground = createDiv({ className: `${classes['column']} ${classes['center']} ${classes['callForeground']}` });

    background.appendChild(this.remoteMediaViewDiv);
    background.appendChild(this.localMediaViewDiv);

    foreground.appendChild(this.peerProfile);
    foreground.appendChild(this.peerName);
    foreground.appendChild(this.connectionInfo);
    foreground.appendChild(peerStateDiv);

    this.element.appendChild(background);
    this.element.appendChild(foreground);
    this.element.appendChild(buttons.element);


    if (this.call.caller.userId === localUser.userId) {
      this.drawCallingText();
    }

    targetEl.appendChild(this.element);
  }

  close() {
    const element = this.element;
    if (element && element.parentNode) {
      element.parentNode.removeChild(this.element);
    }
  }

  addCallListeners(call) {
    call.onConnected = () => {
      this.setConnected();
      this.drawCurrentTime();
      if (this.call.isVideoCall) {
        this.localMediaViewDiv.classList.remove(classes['videoFull']);
        this.localMediaViewDiv.classList.add(classes['videoSmall']);
        this.remoteMediaViewDiv.classList.remove(classes['videoHidden']);
        this.remoteMediaViewDiv.classList.add(classes['videoFull']);

        this.hideSecondaryInfo();
      }
    };

    call.onEnded = (endedCall) => {
      this.setEnded();
      this.drawEndResult();
      if (endedCall.isVideoCall) {
        this.localMediaViewDiv.classList.add(classes['videoHidden']);
        this.remoteMediaViewDiv.classList.add(classes['videoHidden']);

        this.showSecondaryInfo();
      }
    };

    call.onReconnected = () => {
      this.drawCurrentTime();
    };

    call.onReconnecting = () => {
      this.drawReconnectingText();
    };

    call.onRemoteAudioSettingsChanged = (call) => {
      this.onRemoteAudioMuted(call.isRemoteAudioEnabled);
    };

    call.onRemoteVideoSettingsChanged = (call) => {
      this.onRemoteVideoMuted(call.isRemoteVideoEnabled);
    };
  }

  onRemoteAudioMuted(isEnabled) {
    const peerStateDiv = this.element.querySelector('#peer_state');
    if (isEnabled) {
      peerStateDiv.classList.add(classes['invisible']);
    } else {
      peerStateDiv.classList.remove(classes['invisible']);
    }
  }

  onRemoteVideoMuted(isEnabled) {
    if (isEnabled) {
      this.remoteMediaViewDiv.classList.remove(classes['videoHidden']);
    } else {
      this.remoteMediaViewDiv.classList.add(classes['videoHidden']);
    }
  }

  drawCallingText() {
    this.removeConnectionInfoDrawer();
    const rotatingTexts = ['calling', 'calling.', 'calling..'];
    let frame = 0;
    this.connectionInfoDrawer = new PeriodicJob(() => {
      this.connectionInfo.innerText = rotatingTexts[frame];
      frame = (frame + 1) % rotatingTexts.length;
    }).start();
  }

  drawReconnectingText() {
    this.removeConnectionInfoDrawer();
    const rotatingTexts = ['reconnecting', 'reconnecting.', 'reconnecting..'];
    let frame = 0;
    this.connectionInfoDrawer = new PeriodicJob(() => {
      this.connectionInfo.innerText = rotatingTexts[frame];
      frame = (frame + 1) % rotatingTexts.length;
    }).start();
  }

  drawCurrentTime() {
    this.removeConnectionInfoDrawer();
    this.connectionInfoDrawer = new PeriodicJob(() => {
      const durationInSec = Math.floor(this.call.getDuration() / 1000);
      const minutes = `0${Math.floor(durationInSec / 60)}`.slice(-2);
      const seconds = `0${durationInSec % 60}`.slice(-2);
      this.connectionInfo.innerText = `${minutes}:${seconds}`;
    }).start();
  }

  drawEndResult() {
    this.removeConnectionInfoDrawer();
    this.connectionInfo.innerText = this.call.endResult;
  }

  removeConnectionInfoDrawer() {
    if (this.connectionInfoDrawer) {
      this.connectionInfoDrawer.stop();
      this.connectionInfoDrawer = null;
    }
    this.connectionInfo.innerText = '';
  }

  hideSecondaryInfo() {
    this.peerProfile.classList.add(classes['invisible']);
    this.peerName.classList.add(classes['invisible']);
    this.connectionInfo.classList.add(classes['invisible']);
  }

  showSecondaryInfo() {
    this.peerProfile.classList.remove(classes['invisible']);
    this.peerName.classList.remove(classes['invisible']);
    this.connectionInfo.classList.remove(classes['invisible']);
  }

  static getInstance() {
    return new Call();
  }
}

export {
  Call
};
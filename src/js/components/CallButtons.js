import { createDiv } from '../domUtil';
import classes from '../../scss/call.scss';
import { CallButton } from './CallButton';
import { CallTextButton } from './CallTextButton';
import { Call } from '../Call';

function replaceClassName(element, searchValue, newValue) {
  element.classList.replace(searchValue, newValue);
}

class CallButtons {
  constructor(call) {
    this.acceptBtn = null;
    this.muteBtn = null;
    this.endBtn = null;
    this.videoBtn = null;
    this.btnEnd = null;
    this.closeBtn = null;
    this.activeButtons = [];
    this.call = call;

    this.element = this._createElement();
  }

  _createElement() {
    const element = createDiv({ className: `${classes['row']} ${classes['center']} ${classes['callButtons']}` });

    if (this.call.isVideoCall) {
      this.acceptBtn = new CallButton({
        buttonClass: `${classes['btnCircle']} ${classes['btnCall']} ${classes['btnVideoAccept']}`,
        labelClass: classes['fontSmall'],
        type: 'mutual'
      });
    } else {
      this.acceptBtn = new CallButton({
        buttonClass: `${classes['btnCircle']} ${classes['btnCall']} ${classes['btnAccept']}`,
        labelClass: classes['fontSmall'],
        type: 'mutual'
      });
    }

    this.muteBtn = new CallButton({
      buttonClass: `${classes['btnCircle']} ${classes['btnCall']} ${classes['btnMute']}`,
      labelClass: classes['fontSmall'],
      type: 'mutual'
    });

    this.videoBtn = new CallButton({
      buttonClass: `${classes['btnCircle']} ${classes['btnCall']} ${classes['btnStopVideo']}`,
      labelClass: classes['fontSmall'],
      type: 'video'
    });

    this.endBtn = new CallButton({
      buttonClass: `${classes['btnCircle']} ${classes['btnCall']} ${classes['btnEnd']}`,
      labelClass: classes['fontSmall'],
      type: 'mutual'
    });

    this.closeBtn = new CallTextButton({
      buttonClass: `${classes['btnClose']} ${classes['fontNormal']}`,
      labelText: 'Back',
      type: 'mutual'
    });

    element.appendChild(this.acceptBtn.element);
    element.appendChild(this.muteBtn.element);
    element.appendChild(this.videoBtn.element);
    element.appendChild(this.endBtn.element);
    element.appendChild(this.closeBtn.element);

    this.acceptBtn.onclick = () => {
      this.setAccepting();
      this.call.accept({
        callOption: {
          localMediaView: Call.getInstance().localMediaView,
          remoteMediaView: Call.getInstance().remoteMediaView,
          audioEnabled: true,
          videoEnabled: this.call.isVideoCall,
        }
      });
    };

    this.muteBtn.onclick = () => {
      this.invertMuteIcon();
    };

    this.videoBtn.onclick = () => {
      this.invertVideoIcon();
    };

    this.endBtn.onclick = () => {
      this.call.end();
    };

    this.closeBtn.onclick = () => {
      Call.getInstance().close();
    };

    return element;
  }

  invertMuteIcon() {
    if (this.call.isLocalAudioEnabled) {
      this.call.muteMicrophone();
      replaceClassName(this.muteBtn.icon, classes['btnMute'], classes['btnUnmute']);
    } else {
      this.call.unmuteMicrophone();
      replaceClassName(this.muteBtn.icon, classes['btnUnmute'], classes['btnMute']);
    }
  }

  invertVideoIcon() {
    if (this.call.isLocalVideoEnabled) {
      this.call.stopVideo();
      replaceClassName(this.videoBtn.icon, classes['btnStopVideo'], classes['btnStartVideo']);
    } else {
      this.call.startVideo();
      replaceClassName(this.videoBtn.icon, classes['btnStartVideo'], classes['btnStopVideo']);
    }
  }

  setAccepting() {
    this.hideActiveButtons();
    this.showButtons(this.endBtn);
  }

  setDialing() {
    this.hideActiveButtons();
    this.showButtons(this.muteBtn, this.videoBtn, this.endBtn);
  }

  setRinging() {
    this.hideActiveButtons();
    this.showButtons(this.muteBtn, this.videoBtn, this.acceptBtn, this.endBtn);
  }

  setConnected() {
    this.hideActiveButtons();
    this.showButtons(this.muteBtn, this.videoBtn, this.endBtn);
  }

  setEnded() {
    this.hideActiveButtons();
    this.showButtons(this.closeBtn);
  }

  hideActiveButtons() {
    for (const btn of this.activeButtons) {
      btn.element.classList.add(classes['hidden']);
    }
    this.activeButtons = [];
  }

  showButtons(...btns) {
    for (const btn of btns) {
      if (!this.call.isVideoCall && btn.type === 'video'
        || this.call.isVideoCall && btn.type === 'audio') {
        continue;
      }

      btn.element.classList.remove(classes['hidden']);
    }

    this.activeButtons.push(...btns);
  }
}

export {
  CallButtons
};
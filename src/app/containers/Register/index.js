import React, { Component } from 'react';
import { Button, message, Steps } from 'antd';
import { observer, inject } from 'mobx-react';

import './index.less';
import InputPwd from 'components/Mnemonic/InputPwd';
import Generate from 'components/Mnemonic/Generate';
import ConfirmPhrase from 'components/Mnemonic/ConfirmPhrase';

const Step = Steps.Step;

@inject(stores => ({
  current: stores.mnemonic.current,
  isSamePwd: stores.mnemonic.isSamePwd,
  hasMnemonicOrNot: stores.session.hasMnemonicOrNot,
  setIndex: index => stores.mnemonic.setIndex(index),
  getMnemonic: ret => stores.session.getMnemonic(ret),
  setMnemonicStatus: ret => stores.session.setMnemonicStatus(ret)
}))

@observer
class Register extends Component {
  state = {
    pwd: '',
    mnemonic: [],
    current: 0,
    steps: [{
      title: 'Create Phrase',
      content: <InputPwd />,
    }, {
      title: 'Secret Backup Phrase',
      content: <Generate />,
    }, {
      title: 'Confirm your Secret Backup Phrase',
      content: <ConfirmPhrase />,
    }]
  }

  next = () => {
    const { current, isSamePwd, setIndex } = this.props;
    if(current === 0) {
      if(isSamePwd) {
        setIndex(1);
      } else {
        message.error('Incorrect password setting');
      }
    } else {
      setIndex( current + 1 );
    }
  }

  prev = () => {
    const { setIndex, current } = this.props;
    console.log(current,'current')
    setIndex(current - 1);
  }

  render() {
    const { steps } = this.state;
    const { current } = this.props;

    return (
      <div className="content">
        <Steps current={current}>
          {steps.map(item => <Step key={item.title} title={item.title} />)}
        </Steps>
        <div className="steps-content">{steps[current].content}</div>
        <div className="steps-action">
          {
            current < steps.length - 1
            && <Button type="primary" onClick={this.next}>Next</Button>
          }
          {
            current === steps.length - 1
            && <Button type="primary" onClick={() => message.success('Processing complete!')}>Done</Button>
          }
          {
            current > 0 && (<Button style={{ marginLeft: 8 }} onClick={this.prev}>Previous</Button>)
          }
        </div>
      </div>
    );
  }
}

export default Register;
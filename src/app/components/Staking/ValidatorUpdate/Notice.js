import React, { Component } from 'react';
import { Button, Modal } from 'antd';
import './index.less';
import intl from 'react-intl-universal';



class Notice extends Component {
  constructor(props) {
    super(props)
    this.state = {
      title: intl.get('Mnemonic.ShowPhrase.tips'),
      note: props.note,
    }
  }

  render() {
    return (
      <div className="withdraw">
        <Modal
          visible
          destroyOnClose={true}
          closable={false}
          title={this.state.title}
          onCancel={this.props.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.props.onCancel}>{intl.get('HwWallet.Connect.continue')}</Button>,
          ]}
          className="withdraw-modal"
        >
          <p className="withdraw-note">{this.state.note}</p>
        </Modal>
      </div>
    );
  }
}

export default Notice;
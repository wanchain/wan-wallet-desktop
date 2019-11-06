import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { message, Button, Form } from 'antd';
import { observer, inject } from 'mobx-react';

import BTCNormalTransForm from 'components/NormalTransForm/BTCNormalTrans/BTCNormalTransForm'
import { getBalanceByAddr } from 'utils/helper';

const CollectionCreateForm = Form.create({ name: 'BTCNormalTransForm' })(BTCNormalTransForm);

@inject(stores => ({
  addrInfo: stores.btcAddress.addrInfo,
  language: stores.languageIntl.language,
  transParams: stores.sendTransParams.transParams,
  addTransTemplate: (addr, params) => stores.sendTransParams.addBTCTransTemplate(addr, params),
}))

@observer
class SendBTCNormalTrans extends Component {
  state = {
    spin: true,
    loading: false,
    visible: false,
  }

  showModal = async () => {
    const { from, addrInfo, path, addTransTemplate } = this.props;

    if (getBalanceByAddr(from, addrInfo) === 0) {
      message.warn(intl.get('SendNormalTrans.hasBalance'));
      return;
    }

    this.setState({ visible: true });
    addTransTemplate(from, { path });
    try {
      setTimeout(() => { this.setState({ spin: false }) }, 0)
    } catch (err) {
      console.log(`showModal: ${err}`);
      message.warn(intl.get('network.down'));
    }
  }

  handleCancel = () => {
    this.setState({ visible: false, spin: true });
  }

  saveFormRef = formRef => {
    this.formRef = formRef;
  }

  handleSend = from => {
    this.setState({ loading: true });
    this.props.handleSend(from).then(ret => {
      this.setState({ visible: false, loading: false, spin: true });
    }).catch(err => {
      console.log(err);
      this.setState({ visible: false, loading: false, spin: true });
    });
  }

  render () {
    const { visible, loading, spin } = this.state;

    return (
      <div>
        <Button type="primary" onClick={this.showModal}>{intl.get('Common.send')}</Button>
        { visible &&
          <CollectionCreateForm wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.handleSend} loading={loading} spin={spin}/>
        }
      </div>
    );
  }
}

export default SendBTCNormalTrans;

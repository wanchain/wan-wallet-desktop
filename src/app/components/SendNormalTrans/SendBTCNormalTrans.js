import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { message, Button, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import { estimateSmartFee } from 'utils/helper';

import BTCNormalTransForm from 'components/NormalTransForm/BTCNormalTrans/BTCNormalTransForm'

const CollectionCreateForm = Form.create({ name: 'BTCNormalTransForm' })(BTCNormalTransForm);

@inject(stores => ({
  addrInfo: stores.btcAddress.addrInfo,
  language: stores.languageIntl.language,
  getAmount: stores.btcAddress.getAllAmount,
  transParams: stores.sendTransParams.transParams,
  updateBTCTransParams: params => stores.sendTransParams.updateBTCTransParams(params)
}))

@observer
class SendBTCNormalTrans extends Component {
  state = {
    spin: true,
    loading: false,
    visible: false,
  }

  showModal = async () => {
    const { from, getAmount, updateBTCTransParams } = this.props;
    if (getAmount === 0) {
      message.warn(intl.get('SendNormalTrans.hasBalance'));
      return;
    }
    let feeRate = await estimateSmartFee('BTC');
    updateBTCTransParams({ changeAddress: from, feeRate });
    this.setState({ visible: true });
    setTimeout(() => { this.setState({ spin: false }) }, 0);
  }

  handleCancel = () => {
    this.setState({ visible: false, spin: true });
  }

  saveFormRef = formRef => {
    this.formRef = formRef;
  }

  handleSend = () => {
    this.setState({ loading: true });
    this.props.handleSend().then(ret => {
      this.setState({ visible: false, loading: false, spin: true });
    }).catch(err => {
      console.log(err);
      this.setState({ visible: false, loading: false, spin: true });
    });
  }

  render () {
    const { visible, loading, spin } = this.state;

    return (
      <div style={{ display: 'inline-block', marginLeft: '10px' }}>
        <Button className="createBtn" type="primary" shape="round" size="large" onClick={this.showModal}>{intl.get('Common.send')}</Button>
        { visible &&
          <CollectionCreateForm wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.handleSend} loading={loading} spin={spin}/>
        }
      </div>
    );
  }
}

export default SendBTCNormalTrans;

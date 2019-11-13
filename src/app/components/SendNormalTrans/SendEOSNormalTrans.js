import React, { Component } from 'react';
import { message, Button, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import EOSNormalTransForm from 'components/NormalTransForm/EOSNormalTrans/EOSNormalTransForm'
import { getNonce, getGasPrice, getBalanceByAddr } from 'utils/helper';

const TxForm = Form.create({ name: 'EOSNormalTransForm' })(EOSNormalTransForm);

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  transParams: stores.sendTransParams.transParams,
  addTransTemplate: (addr, params) => stores.sendTransParams.addTransTemplate(addr, params),
  updateTransParams: (addr, paramsObj) => stores.sendTransParams.updateTransParams(addr, paramsObj),
  updateGasPrice: (gasPrice, chainType) => stores.sendTransParams.updateGasPrice(gasPrice, chainType),
}))

@observer
class SendEOSNormalTrans extends Component {
  state = {
    spin: false,
    loading: false,
    visible: false,
  }

  showModal = async () => {
    this.setState({ visible: true });
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
      <div style={{ display: 'inline-block', marginLeft: '10px' }}>
        <Button type="primary" onClick={this.showModal}>{intl.get('Common.send')}</Button>
        { visible &&
          <TxForm wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.handleSend} loading={loading} spin={spin}/>
        }
      </div>
    );
  }
}

export default SendEOSNormalTrans;

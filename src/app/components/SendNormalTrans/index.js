import React, { Component } from 'react';
import { message, Button, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';
import NormalTransForm from 'components/NormalTransForm'
import { getNonce, getGasPrice, estimateGas, getChainId } from 'utils/helper';

const CollectionCreateForm = Form.create({ name: 'NormalTransForm' })(NormalTransForm);

@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
  transParams: stores.sendTransParams.transParams,
  addTransTemplate: (addr, params) => stores.sendTransParams.addTransTemplate(addr, params),
  updateTransParams: (addr, paramsObj) => stores.sendTransParams.updateTransParams(addr, paramsObj),
}))

@observer
class SendNormalTrans extends Component {
  state = {
    loading: false,
    visible: false,
  }

  showModal = async () => {
    const { from, path, chainType, chainId, addTransTemplate, updateTransParams } = this.props;
    addTransTemplate(from, { chainType, chainId });
    try {
      let [nonce, gasPrice] = await Promise.all([getNonce(from, chainType), getGasPrice(chainType)]);
      updateTransParams(from, { path, nonce, gasPrice });
      this.setState({ visible: true });
    } catch (err) {
      console.log(`err: ${err}`)
      message.warn(err);
    }
  }

  handleCancel = () => {
    this.setState({ visible: false });
  }

  saveFormRef = formRef => {
    this.formRef = formRef;
  }

  handleSend = from => {
    this.setState({ loading: true });
    this.props.handleSend(from).then(ret => {
      this.setState({ visible: false, loading: false });
    }).catch(err => {
      this.setState({ visible: false, loading: false });
    });
  }

  render() {
    const { visible, loading } = this.state;
    return (
      <div>
        <Button type="primary" onClick={this.showModal}>{intl.get('SendNormalTrans.send')}</Button>
        { visible 
          ? <CollectionCreateForm wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.handleSend} loading={loading}/>
          : ''
        }
      </div>
    );
  }
}

export default SendNormalTrans;
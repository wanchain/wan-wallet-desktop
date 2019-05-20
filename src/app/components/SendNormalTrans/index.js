import React, { Component } from 'react';
import { message, Button, Form } from 'antd';
import { observer, inject } from 'mobx-react';

import './index.less';
import NormalTransForm from 'components/NormalTransForm'
import { getNonce, getGasPrice, estimateGas, getChainId } from 'utils/helper';

const CollectionCreateForm = Form.create({ name: 'NormalTransForm' })(NormalTransForm);

@inject(stores => ({
  chainId: stores.session.chainId,
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

  handleSend = (from, rawTx) => {
    this.props.handleSend(from, rawTx);
    this.setState({ visible: false });
  }

  render() {
    const { visible } = this.state;
    return (
      <div>
        <Button type="primary" onClick={this.showModal}>Send</Button>
        { visible 
          ? <CollectionCreateForm wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.handleSend} />
          : ''
        }
      </div>
    );
  }
}

export default SendNormalTrans;
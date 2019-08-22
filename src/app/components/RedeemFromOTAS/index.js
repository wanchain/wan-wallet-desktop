import React, { Component } from 'react';
import { message, Button, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';
import RedeemFromOTASForm from 'components/RedeemFromOTASForm'
import { getNonce, getGasPrice, getPrivateBalanceByAddr, estimateGas, getChainId } from 'utils/helper';
import { fromWei } from 'utils/support';

const RedeemForm = Form.create({ name: 'RedeemFromOTASForm' })(RedeemFromOTASForm);

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.wanAddress.addrInfo,
  transParams: stores.sendTransParams.transParams,
  updateGasPrice: (gasPrice) => stores.sendTransParams.updateGasPrice(gasPrice),
}))

@observer
class RedeemFromOTAS extends Component {
  state = {
    spin: true,
    visible: false,
    balanceData: []
  }

  showModal = async () => {
    const { from, addrInfo, wid, path, chainType, updateGasPrice } = this.props;

    // 余额不足
    if (getPrivateBalanceByAddr(from, addrInfo) === '0') {
      message.warn('隐私交易余额不足');
      return;
    }

    this.setState({ visible: true });

    try {
      // let [nonce, gasPrice] = await Promise.all([getNonce(from, chainType), getGasPrice(chainType)]);
      let gasPrice = await getGasPrice(chainType);
      console.log('gasPrice:', gasPrice);
      updateGasPrice(gasPrice);
      // get the data of private transaction list.
      wand.request('address_getPrivateTxInfo', { wid, path }, (err, res) => {
        if (err) {
          console.log('not ok');
          message.warn('Get private transaction info failed.');
        } else {
          console.log('ok');
          console.log(res);
          let data = res.map(v => {
            return {
              from: v.from,
              value: fromWei(v.value),
              toOTA: v.toOTA,
              txhash: v.txhash,
            }
          });
          this.setState({
            balanceData: data,
            spin: false
          });
        }
      });
    } catch (err) {
      console.log(`err: ${err}`)
      message.warn(err);
    }

    /* addTransTemplate(from, { chainType, chainId });
    try {
      let [nonce, gasPrice] = await Promise.all([getNonce(from, chainType), getGasPrice(chainType)]);
      updateTransParams(from, { path, nonce, gasPrice });
      updateGasPrice(gasPrice);
      setTimeout(() => {this.setState({ spin: false })}, 0)
    } catch (err) {
      console.log(`err: ${err}`)
      message.warn(err);
    } */
  }

  handleCancel = () => {
    this.setState({ visible: false, spin: true });
  }

  redeemFormRef = formRef => {
    this.formRef = formRef;
  }

  handleSend = from => {
    /*
    this.props.handleSend(from).then(ret => {
      this.setState({ visible: false, spin: true });
    }).catch(err => {
      this.setState({ visible: false, spin: true });
    }); */
  }

  render() {
    const { visible, spin } = this.state;
    return (
      <div>
        <Button type="primary" className="redeemButton" onClick={this.showModal}>{intl.get('WanAccount.redeem')}</Button>
        { visible
          ? <RedeemForm wrappedComponentRef={this.redeemFormRef} balanceData={this.state.balanceData} wid={this.props.wid} path={this.props.path} onCancel={this.handleCancel} from={this.props.from} onSend={this.handleSend} spin={spin}/>
          : ''
        }
      </div>
    );
  }
}

export default RedeemFromOTAS;

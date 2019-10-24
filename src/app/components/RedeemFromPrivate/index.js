import React, { Component } from 'react';
import { message, Button, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';
import RedeemFromPrivateForm from 'components/RedeemFromPrivateForm';
import { getNonce, getGasPrice, getPrivateBalanceByAddr, estimateGas, getChainId } from 'utils/helper';
import { fromWei } from 'utils/support';

const RedeemForm = Form.create({ name: 'RedeemFromPrivateForm' })(RedeemFromPrivateForm);

@inject(stores => ({
  language: stores.languageIntl.language,
  chainId: stores.session.chainId,
  addrInfo: stores.wanAddress.addrInfo,
  transParams: stores.sendTransParams.transParams,
  updateGasPrice: (gasPrice) => stores.sendTransParams.updateGasPrice(gasPrice),
}))

@observer
class RedeemFromPrivate extends Component {
  state = {
    spin: true,
    visible: false,
    balanceData: []
  }

  showModal = async () => {
    const { from, addrInfo, wid, path, chainType, updateGasPrice } = this.props;

    // No sufficient funds
    if (getPrivateBalanceByAddr(from, addrInfo) === '0') {
      message.warn(intl.get('RedeemFromPrivate.noSufficientFunds'));
      return;
    }

    this.setState({ visible: true });

    try {
      let gasPrice = await getGasPrice(chainType);
      updateGasPrice(gasPrice);
      // get the data of private transaction list.
      wand.request('address_getPrivateTxInfo', { wid, path }, (err, res) => {
        if (err) {
          message.warn(intl.get('RedeemFromPrivate.getPrivateTxInfoFailed'));
        } else {
          let data = res.map(v => {
            return {
              from: from,
              value: fromWei(v.value),
              toPrivateAddr: v.toOTA,
              txHash: v.txhash,
            }
          });
          this.setState({
            balanceData: data,
            spin: false
          });
        }
      });
    } catch (err) {
      console.log(`Get private transaction information failed: ${err}`)
      message.warn(err);
    }
  }

  handleCancel = () => {
    this.setState({ visible: false, spin: true });
  }

  redeemFormRef = formRef => {
    this.formRef = formRef;
  }

  handleSpin = v => {
    this.setState({ spin: v });
  }

  render() {
    const { visible, spin } = this.state;
    return (
      <div>
        <Button type="primary" className="redeemButton" onClick={this.showModal}>{intl.get('WanAccount.redeem')}</Button>
        { visible
          ? <RedeemForm wrappedComponentRef={this.redeemFormRef} balanceData={this.state.balanceData} wid={this.props.wid} path={this.props.path} onCancel={this.handleCancel} from={this.props.from} spin={spin} handleSpin={this.handleSpin}/>
          : ''
        }
      </div>
    );
  }
}

export default RedeemFromPrivate;

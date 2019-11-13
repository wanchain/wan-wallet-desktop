import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message, Spin } from 'antd';

import style from './index.less';
import PwdForm from 'componentUtils/PwdForm';
import SelectForm from 'componentUtils/SelectForm';
import { isExceedBalance, formatNumByDecimals } from 'utils/support';
import CommonFormItem from 'componentUtils/CommonFormItem';
import { CHAINNAME, BTCPATH, WANPATH } from 'utils/settings';
import ConfirmForm from 'components/CrossChain/CrossChainTransForm/CrossChainConfirmForm';
import { getBalanceByAddr, checkAmountUnit, formatAmount, btcCoinSelect, getPathFromUtxos } from 'utils/helper';

const Confirm = Form.create({ name: 'CrossChainConfirmForm' })(ConfirmForm);

@inject(stores => ({
  utxos: stores.btcAddress.utxos,
  settings: stores.session.settings,
  btcPath: stores.btcAddress.btcPath,
  addrInfo: stores.btcAddress.addrInfo,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  getAmount: stores.btcAddress.getNormalAmount,
  from: stores.sendCrossChainParams.currentFrom,
  transParams: stores.sendCrossChainParams.transParams,
  updateBTCTransParams: paramsObj => stores.sendCrossChainParams.updateBTCTransParams(paramsObj)
}))

@observer
class CrossBTCForm extends Component {
  state = {
    fee: 0,
    confirmVisible: false,
    disabledAmount: false,
  }

  componentWillUnmount () {
    this.setState = (state, callback) => {
      return false;
    };
  }

  handleConfirmCancel = () => {
    this.setState({
      confirmVisible: false,
    });
  }

  onCancel = () => {
    this.props.onCancel();
  }

  handleSave = () => {
    let { form, addrInfo } = this.props;
    let from = form.getFieldValue('from');
    if (this.state.disabledAmount) {
      let fee = form.getFieldValue('fee');
      form.setFieldsValue({
        amount: getBalanceByAddr(from, addrInfo) - fee
      });
    }
  }

  handleNext = () => {
    const { updateBTCTransParams, addrInfo, settings, estimateFee, form, from, chainType, wanAddrInfo } = this.props;
    form.validateFields(err => {
      if (err) {
        console.log('handleNext:', err);
        return;
      };

      let { pwd, amount: sendAmount, to } = form.getFieldsValue(['pwd', 'amount', 'to']);
      let origAddrAmount = getBalanceByAddr(from, chainType === 'BTC' ? addrInfo : wanAddrInfo);
      let destAddrAmount = getBalanceByAddr(to, chainType === 'BTC' ? wanAddrInfo : addrInfo);
      let path = chainType === 'BTC' ? WANPATH + wanAddrInfo.normal[to].path : BTCPATH + addrInfo.normal[to].path;

      if (isExceedBalance(origAddrAmount, estimateFee.original, sendAmount) || isExceedBalance(destAddrAmount, estimateFee.destination, 0)) {
        message.warn(intl.get('CrossChainTransForm.overBalance'));
        return;
      }
      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_reveal', { pwd: pwd }, (err) => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            updateBTCTransParams({ to: { walletID: 1, path }, toAddr: to, amount: formatAmount(sendAmount) });
            this.setState({ confirmVisible: true });
          }
        })
      } else {
        updateBTCTransParams({ to: { walletID: 1, path }, toAddr: to, amount: formatAmount(sendAmount) });
        this.setState({ confirmVisible: true });
      }
    });
  }

  sendTrans = () => {
    this.props.onSend(this.props.from);
  }

  checkAmount = (rule, value, callback) => {
    if (new BigNumber(value).gte('0') && checkAmountUnit(8, value)) {
      const { utxos, addrInfo, btcPath, updateBTCTransParams } = this.props;

      btcCoinSelect(utxos, value).then(data => {
        updateBTCTransParams({ from: getPathFromUtxos(data.inputs, addrInfo, btcPath) });
        this.setState({
          fee: formatNumByDecimals(data.fee, 8)
        })
        callback();
      }).catch(() => {
        callback(intl.get('NormalTransForm.invalidAmount'));
      });
    } else {
      callback(intl.get('NormalTransForm.invalidAmount'));
    }
  }

  updateLockAccounts = (storeman, option) => {
    let { form, updateBTCTransParams, smgList, chainType } = this.props;

    if (chainType === 'BTC') {
      form.setFieldsValue({
        capacity: formatNumByDecimals(smgList[option.key].quota, 8),
        quota: formatNumByDecimals(smgList[option.key].inboundQuota, 8),
      });
    } else {
      form.setFieldsValue({
        quota: formatNumByDecimals(smgList[option.key].outboundQuota, 8),
      });
    }

    updateBTCTransParams({ storeman, feeRate: smgList[option.key].txFeeRatio });
  }

  filterStoremanData = item => {
    return item[this.props.chainType === 'BTC' ? 'btcAddress' : 'wanAddress'];
  }

  render () {
    const { loading, form, from, settings, smgList, wanAddrInfo, estimateFee, chainType, addrInfo, symbol, getAmount } = this.props;
    let totalFeeTitle, desChain, selectedList, defaultSelectStoreman, capacity, quota, title;

    if (chainType === 'BTC') {
      desChain = 'WAN';
      selectedList = Object.keys(wanAddrInfo.normal);
      title = symbol ? `${symbol} TO W${symbol}` : 'BTC TO WBTC';
      totalFeeTitle = `${this.state.fee} btc + ${estimateFee.destination} wan`;
    } else {
      desChain = 'BTC';
      selectedList = Object.keys(addrInfo.normal);
      title = symbol ? `W${symbol} TO ${symbol}` : 'WBTC TO BTC';
      totalFeeTitle = `${estimateFee.original} wan + ${this.state.fee} btc`;
    }

    if (smgList.length === 0) {
      defaultSelectStoreman = '';
      capacity = quota = 0;
    } else {
      if (chainType === 'BTC') {
        defaultSelectStoreman = smgList[0].btcAddress;
        capacity = formatNumByDecimals(smgList[0].quota, 8)
        quota = formatNumByDecimals(smgList[0].inboundQuota, 8)
      } else {
        defaultSelectStoreman = smgList[0].wanAddress;
        quota = formatNumByDecimals(smgList[0].outboundQuota, 8);
      }
    }

    return (
      <div>
        <Modal
          visible
          destroyOnClose={true}
          closable={false}
          title={title}
          onCancel={this.onCancel}
          className={style['cross-chain-modal']}
          footer={[
            <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('NormalTransForm.cancel')}</Button>,
            <Button disabled={this.props.spin} key="submit" type="primary" onClick={this.handleNext}>{intl.get('NormalTransForm.next')}</Button>,
          ]}
        >
          <Spin spinning={this.props.spin} tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} className="loadingData">
            <div className="validator-bg">
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='balance'
                disabled={true}
                options={{ initialValue: getAmount + ' BTC' }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('StakeInForm.balance')}
              />
              <SelectForm
                form={form}
                colSpan={6}
                formName='lockedAccount'
                initialValue={defaultSelectStoreman}
                selectedList={smgList}
                filterItem={this.filterStoremanData}
                handleChange={this.updateLockAccounts}
                formMessage={intl.get('CrossChainTransForm.lockedAccount')}
              />
              {
                chainType === 'BTC' &&
                <CommonFormItem
                  form={form}
                  colSpan={6}
                  formName='capacity'
                  disabled={true}
                  options={{ initialValue: capacity + ' BTC' }}
                  prefix={<Icon type="credit-card" className="colorInput" />}
                  title={intl.get('CrossChainTransForm.capacity')}
                />
              }
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='quota'
                disabled={true}
                options={{ initialValue: quota + ' BTC' }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('CrossChainTransForm.quota')}
              />
              <SelectForm
                form={form}
                colSpan={6}
                formName='to'
                initialValue={selectedList[0]}
                selectedList={selectedList}
                formMessage={intl.get('NormalTransForm.to') + CHAINNAME[desChain]}
              />
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='totalFee'
                disabled={true}
                options={{ initialValue: totalFeeTitle }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('CrossChainTransForm.estimateFee')}
              />
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='amount'
                disabled={this.state.disabledAmount}
                options={{ initialValue: 0, rules: [{ required: true, validator: this.checkAmount }] }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('Common.amount') + ` (${chainType.toLowerCase()})`}
              />
              {settings.reinput_pwd && <PwdForm form={form} colSpan={6}/>}
            </div>
          </Spin>
        </Modal>
        {
          false &&
          <Confirm chainType={chainType} estimateFee={estimateFee} visible={this.state.confirmVisible} handleCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading}/>
        }
      </div>
    );
  }
}

export default CrossBTCForm;

import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message, Spin } from 'antd';

import style from './index.less';
import PwdForm from 'componentUtils/PwdForm';
import SelectForm from 'componentUtils/SelectForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import { ETHPATH, WANPATH, PENALTYNUM } from 'utils/settings';
import ConfirmForm from 'components/CrossChain/CrossChainTransForm/ConfirmForm/CrossETHConfirmForm';
import { fromWei, isExceedBalance, formatNumByDecimals } from 'utils/support';
import { getFullChainName, getBalanceByAddr, checkAmountUnit, formatAmount } from 'utils/helper';

const Confirm = Form.create({ name: 'CrossETHConfirmForm' })(ConfirmForm);

@inject(stores => ({
  settings: stores.session.settings,
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  from: stores.sendCrossChainParams.currentFrom,
  transParams: stores.sendCrossChainParams.transParams,
  updateTransParams: (addr, paramsObj) => stores.sendCrossChainParams.updateTransParams(addr, paramsObj),
}))

@observer
class CrossETHForm extends Component {
  state = {
    confirmVisible: false
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

  handleNext = () => {
    const { updateTransParams, addrInfo, settings, form, from, chainType, wanAddrInfo, tokenAddr, estimateFee } = this.props;
    form.validateFields(err => {
      if (err) {
        console.log('handleNext:', err);
        return;
      };

      let { pwd, amount: sendAmount, to } = form.getFieldsValue(['pwd', 'amount', 'to']);
      let origAddrAmount = getBalanceByAddr(from, chainType === 'ETH' ? addrInfo : wanAddrInfo);
      let destAddrAmount = getBalanceByAddr(to, chainType === 'ETH' ? wanAddrInfo : addrInfo);
      let path = chainType === 'ETH' ? WANPATH + wanAddrInfo.normal[to].path : ETHPATH + addrInfo.normal[to].path;

      if (tokenAddr) {
        if (isExceedBalance(origAddrAmount, estimateFee.original) || isExceedBalance(destAddrAmount, estimateFee.destination)) {
          message.warn(intl.get('CrossChainTransForm.overBalance'));
          return;
        }
      } else {
        if (isExceedBalance(origAddrAmount, estimateFee.original, chainType === 'ETH' ? sendAmount : 0) || isExceedBalance(destAddrAmount, estimateFee.destination)) {
          message.warn(intl.get('CrossChainTransForm.overBalance'));
          return;
        }
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
            updateTransParams(from, { to: { walletID: 1, path }, toAddr: to, amount: formatAmount(sendAmount) });
            this.setState({ confirmVisible: true });
          }
        })
      } else {
        updateTransParams(from, { to: { walletID: 1, path }, toAddr: to, amount: formatAmount(sendAmount) });
        this.setState({ confirmVisible: true });
      }
    });
  }

  sendTrans = () => {
    this.props.onSend(this.props.from);
  }

  checkAmount = (rule, value, callback) => {
    const { decimals, balance, chainType, smgList, form, estimateFee } = this.props;
    if (new BigNumber(value).gte('0') && checkAmountUnit(decimals || 18, value)) {
      if (new BigNumber(value).gt(balance)) {
        callback(intl.get('CrossChainTransForm.overTransBalance'));
      } else {
        if (chainType === 'WAN') {
          let { storemanAccount } = form.getFieldsValue(['storemanAccount']);
          let smg = smgList.find(item => (item.wanAddress || item.smgWanAddr) === storemanAccount);
          let newOriginalFee = new BigNumber(value).multipliedBy(smg.coin2WanRatio).multipliedBy(smg.txFeeRatio).dividedBy(PENALTYNUM).dividedBy(PENALTYNUM).plus(estimateFee.original).toString();
          form.setFieldsValue({
            totalFee: `${newOriginalFee} WAN + ${estimateFee.destination} ETH`,
          });
        }
        callback();
      }
    } else {
      callback(intl.get('Common.invalidAmount'));
    }
  }

  checkQuota = (rule, value, callback) => {
    if (new BigNumber(value).gt(0)) {
      let { amount } = this.props.form.getFieldsValue(['amount']);
      if (isExceedBalance(value, amount)) {
        callback(intl.get('CrossChainTransForm.overQuota'));
        return;
      }
      callback();
    } else {
      callback(intl.get('CrossChainTransForm.overQuota'));
    }
  }

  updateLockAccounts = (storeman, option) => {
    let { from, form, updateTransParams, smgList, chainType, tokenAddr, decimals } = this.props;

    if (chainType === 'ETH') {
      form.setFieldsValue({
        capacity: tokenAddr ? formatNumByDecimals(smgList[option.key].quota, decimals) : fromWei(smgList[option.key].quota),
        quota: tokenAddr ? formatNumByDecimals(smgList[option.key].inboundQuota, decimals) : fromWei(smgList[option.key].inboundQuota),
      });
    } else {
      form.setFieldsValue({
        quota: tokenAddr ? formatNumByDecimals(smgList[option.key].outboundQuota, decimals) : fromWei(smgList[option.key].outboundQuota),
      });
    }

    updateTransParams(from, { storeman, txFeeRatio: smgList[option.key].txFeeRatio });
  }

  filterStoremanData = item => {
    if (this.props.chainType === 'ETH') {
      return item[this.props.tokenAddr ? 'smgOrigAddr' : 'ethAddress']
    } else {
      return item[this.props.tokenAddr ? 'smgWanAddr' : 'wanAddress']
    }
  }

  render () {
    const { loading, form, from, settings, smgList, wanAddrInfo, chainType, addrInfo, symbol, tokenAddr, decimals, estimateFee, balance } = this.props;
    let totalFeeTitle, desChain, selectedList, defaultSelectStoreman, capacity, quota, title, tokenSymbol;

    if (chainType === 'ETH') {
      desChain = 'WAN';
      selectedList = Object.keys(wanAddrInfo.normal);
      title = symbol ? `${symbol} -> W${symbol}` : 'ETH -> WETH';
      tokenSymbol = symbol || 'ETH';
      totalFeeTitle = `${estimateFee.original} ETH + ${estimateFee.destination} WAN`;
    } else {
      desChain = 'ETH';
      selectedList = Object.keys(addrInfo.normal);
      title = symbol ? `W${symbol} -> ${symbol}` : 'WETH -> ETH';
      tokenSymbol = symbol ? `W${symbol}` : 'WETH';
      totalFeeTitle = `${estimateFee.original} WAN + ${estimateFee.destination} ETH`;
    }

    if (smgList.length === 0) {
      defaultSelectStoreman = '';
      capacity = quota = 0;
    } else {
      if (chainType === 'ETH') {
        defaultSelectStoreman = tokenAddr ? smgList[0].smgOrigAddr : smgList[0].ethAddress;
        capacity = tokenAddr ? formatNumByDecimals(smgList[0].quota, decimals) : fromWei(smgList[0].quota)
        quota = tokenAddr ? formatNumByDecimals(smgList[0].inboundQuota, decimals) : fromWei(smgList[0].inboundQuota)
      } else {
        defaultSelectStoreman = tokenAddr ? smgList[0].smgWanAddr : smgList[0].wanAddress;
        quota = tokenAddr ? formatNumByDecimals(smgList[0].outboundQuota, decimals) : fromWei(smgList[0].outboundQuota)
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
            <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button disabled={this.props.spin} key="submit" type="primary" onClick={this.handleNext}>{intl.get('Common.next')}</Button>,
          ]}
        >
          <Spin spinning={this.props.spin} tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} className="loadingData">
            <div className="validator-bg">
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='from'
                disabled={true}
                options={{ initialValue: from }}
                prefix={<Icon type="wallet" className="colorInput" />}
                title={intl.get('Common.from') + ' (' + getFullChainName(chainType) + ')'}
              />
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='balance'
                disabled={true}
                options={{ initialValue: balance + ` ${tokenSymbol}` }}
                prefix={<Icon type="wallet" className="colorInput" />}
                title={intl.get('Common.balance')}
              />
              <SelectForm
                form={form}
                colSpan={6}
                formName='storemanAccount'
                initialValue={defaultSelectStoreman}
                selectedList={smgList}
                filterItem={this.filterStoremanData}
                handleChange={this.updateLockAccounts}
                formMessage={intl.get('CrossChainTransForm.storemanAccount')}
              />
              {
                chainType === 'ETH' &&
                <CommonFormItem
                  form={form}
                  colSpan={6}
                  formName='capacity'
                  disabled={true}
                  options={{ initialValue: capacity }}
                  prefix={<Icon type="credit-card" className="colorInput" />}
                  title={intl.get('CrossChainTransForm.capacity')}
                />
              }
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='quota'
                disabled={true}
                options={{ initialValue: quota, rules: [{ validator: this.checkQuota }] }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('CrossChainTransForm.quota')}
              />
              <SelectForm
                form={form}
                colSpan={6}
                formName='to'
                initialValue={selectedList[0]}
                selectedList={selectedList}
                formMessage={intl.get('NormalTransForm.to') + ' (' + getFullChainName(desChain) + ')'}
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
                placeholder={0}
                options={{ rules: [{ required: true, validator: this.checkAmount }] }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('Common.amount') + ` (${tokenSymbol})`}
              />
              {settings.reinput_pwd && <PwdForm form={form} colSpan={6}/>}
            </div>
          </Spin>
        </Modal>
        <Confirm tokenSymbol={tokenSymbol} chainType={chainType} estimateFee={form.getFieldValue('totalFee')} visible={this.state.confirmVisible} handleCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading}/>
      </div>
    );
  }
}

export default CrossETHForm;

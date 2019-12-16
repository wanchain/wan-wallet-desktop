import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message, Spin } from 'antd';

import style from './index.less';
import PwdForm from 'componentUtils/PwdForm';
import SelectForm from 'componentUtils/SelectForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import { WANPATH, PENALTYNUM, INBOUND } from 'utils/settings';
import ConfirmForm from 'components/CrossChain/CrossChainTransForm/ConfirmForm/CrossEOSConfirmForm';
import { isExceedBalance, formatNumByDecimals } from 'utils/support';
import { getFullChainName, checkAmountUnit, formatAmount, getAddrInfoByTypes, getBalanceByAddr } from 'utils/helper';

const Confirm = Form.create({ name: 'CrossEOSConfirmForm' })(ConfirmForm);

@inject(stores => ({
  settings: stores.session.settings,
  addrInfo: stores.eosAddress.accountInfo,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  from: stores.sendCrossChainParams.currentFrom,
  transParams: stores.sendCrossChainParams.transParams,
  updateTransParams: (addr, paramsObj) => stores.sendCrossChainParams.updateTransParams(addr, paramsObj),
}))

@observer
class CrossEOSForm extends Component {
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
    const { updateTransParams, addrInfo, settings, form, from, direction, wanAddrInfo, tokenAddr, estimateFee, balance: origAddrAmount } = this.props;
    form.validateFields(err => {
      if (err) {
        console.log('handleNext:', err);
        return;
      };

      let { pwd, amount: sendAmount, to, totalFee } = form.getFieldsValue(['pwd', 'amount', 'to', 'totalFee']);
      let destAddrAmount = direction === INBOUND ? getAddrInfoByTypes(to, 'name', wanAddrInfo, 'balance') : addrInfo[to].balance;
      let path = direction === INBOUND ? WANPATH + getAddrInfoByTypes(to, 'name', wanAddrInfo, 'path') : addrInfo[to].path;
      let toAddress = direction === INBOUND ? getAddrInfoByTypes(to, 'name', wanAddrInfo, 'address') : to
      if (tokenAddr) {
        if (isExceedBalance(origAddrAmount, estimateFee) || isExceedBalance(destAddrAmount, estimateFee)) {
          message.warn(intl.get('CrossChainTransForm.overBalance'));
          return;
        }
      } else {
        if (isExceedBalance(origAddrAmount, sendAmount) || isExceedBalance(destAddrAmount, direction === INBOUND ? estimateFee : 0)) {
          message.warn(intl.get('CrossChainTransForm.overBalance'));
          return;
        }
        if (direction !== INBOUND && isExceedBalance(getBalanceByAddr(from, wanAddrInfo), totalFee)) {
          message.warn(intl.get('CrossChainTransForm.overBalance'));
          return;
        }
      }

      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_reveal', { pwd }, (err) => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            updateTransParams(from, { to: { walletID: 1, path, address: toAddress }, toAddr: to, amount: formatAmount(sendAmount) });
            this.setState({ confirmVisible: true });
          }
        })
      } else {
        updateTransParams(from, { to: { walletID: 1, path, address: toAddress }, toAddr: to, amount: formatAmount(sendAmount) });
        this.setState({ confirmVisible: true });
      }
    });
  }

  sendTrans = () => {
    this.props.onSend(this.props.from);
  }

  checkAmount = (rule, value, callback) => {
    const { decimals, balance, direction, smgList, form, estimateFee } = this.props;
    if (new BigNumber(value).gt('0') && checkAmountUnit(decimals || 18, value)) {
      if (new BigNumber(value).gt(balance)) {
        callback(intl.get('CrossChainTransForm.overTransBalance'));
      } else {
        if (direction !== INBOUND) {
          let { storemanAccount } = form.getFieldsValue(['storemanAccount']);
          let smg = smgList.find(item => item.storemanGroup === storemanAccount);
          let newOriginalFee = new BigNumber(value).multipliedBy(smg.coin2WanRatio).multipliedBy(smg.txFeeRatio).dividedBy(PENALTYNUM).dividedBy(PENALTYNUM).plus(estimateFee).toString();
          form.setFieldsValue({
            totalFee: `${new BigNumber(newOriginalFee).plus(estimateFee)} WAN`,
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
    let { from, form, updateTransParams, smgList, direction, decimals } = this.props;

    if (direction === INBOUND) {
      form.setFieldsValue({
        quota: formatNumByDecimals(smgList[option.key].inboundQuota, decimals)
      });
    } else {
      form.setFieldsValue({
        quota: formatNumByDecimals(smgList[option.key].outboundQuota, decimals)
      });
    }

    updateTransParams(from, { storeman, txFeeRatio: smgList[option.key].txFeeRatio });
  }

  render () {
    const { loading, form, from, settings, smgList, wanAddrInfo, direction, addrInfo, symbol, decimals, estimateFee, balance } = this.props;
    let desChain, selectedList, defaultSelectStoreman, quota, title, tokenSymbol;
    if (direction === INBOUND) {
      desChain = 'WAN';
      selectedList = Object.values(wanAddrInfo.normal).map(item => item.name);
      title = symbol ? `${symbol} -> W${symbol}` : 'EOS -> WEOS';
      tokenSymbol = symbol || 'EOS';
    } else {
      desChain = 'EOS';
      selectedList = Object.keys(addrInfo);
      title = symbol ? `W${symbol} -> ${symbol}` : 'WEOS -> EOS';
      tokenSymbol = symbol ? `W${symbol}` : 'WEOS';
    }

    if (smgList.length === 0) {
      defaultSelectStoreman = '';
      quota = 0;
    } else {
      defaultSelectStoreman = smgList[0].storemanGroup;
      quota = formatNumByDecimals(direction === INBOUND ? smgList[0].inboundQuota : smgList[0].outboundQuota, decimals);
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
                title={intl.get('Common.from') + ' (' + getFullChainName('EOS') + ')'}
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
                filterItem={item => item.storemanGroup}
                handleChange={this.updateLockAccounts}
                formMessage={intl.get('CrossChainTransForm.storemanAccount')}
              />
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
                options={{ initialValue: `${estimateFee} WAN` }}
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
        <Confirm tokenSymbol={tokenSymbol} direction={direction} estimateFee={form.getFieldValue('totalFee')} visible={this.state.confirmVisible} handleCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading}/>
      </div>
    );
  }
}

export default CrossEOSForm;

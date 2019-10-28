import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Modal, Form, Icon, Checkbox, message, Spin } from 'antd';

import './index.less';
import PwdForm from 'componentUtils/PwdForm';
import SelectForm from 'componentUtils/SelectForm';
import { fromWei, isExceedBalance } from 'utils/support';
import CommonFormItem from 'componentUtils/CommonFormItem';
import { CHAINNAME, ETHPATH, WANPATH } from 'utils/settings';
import ConfirmForm from 'components/CrossChain/CrossChainTransForm/CrossChainConfirmForm';
import { getBalanceByAddr, checkAmountUnit, formatAmount } from 'utils/helper';

const Confirm = Form.create({ name: 'CrossChainConfirmForm' })(ConfirmForm);

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
    const { updateTransParams, addrInfo, settings, estimateFee, form, from, chainType, wanAddrInfo } = this.props;
    form.validateFields(err => {
      if (err) {
        console.log('handleNext:', err);
        return;
      };

      let { pwd, amount: sendAmount, to } = form.getFieldsValue(['pwd', 'amount', 'to']);
      let origAddrAmount = getBalanceByAddr(from, chainType === 'ETH' ? addrInfo : wanAddrInfo);
      let destAddrAmount = getBalanceByAddr(to, chainType === 'ETH' ? wanAddrInfo : addrInfo);
      let path = chainType === 'ETH' ? WANPATH + wanAddrInfo.normal[to].path : ETHPATH + addrInfo.normal[to].path;

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

  handleClick = (e, gasPrice, gasLimit, nonce, fee) => {
    let { form, addrInfo } = this.props;
    let from = form.getFieldValue('from');
    this.props.updateTransParams(this.props.from, { gasLimit, gasPrice, nonce });
    if (this.state.disabledAmount) {
      form.setFieldsValue({
        amount: new BigNumber(getBalanceByAddr(from, addrInfo)).minus(new BigNumber(fee))
      });
    }
  }

  checkAmount = (rule, value, callback) => {
    if (value >= 0 && checkAmountUnit(18, value)) {
      callback();
    } else {
      callback(intl.get('NormalTransForm.invalidAmount'));
    }
  }

  updateLockAccounts = (storeman, option) => {
    let { from, form, updateTransParams, smgList, chainType } = this.props;

    if (chainType === 'ETH') {
      form.setFieldsValue({
        capacity: fromWei(smgList[option.key].quota),
        quota: fromWei(smgList[option.key].inboundQuota),
      });
    } else {
      form.setFieldsValue({
        quota: fromWei(smgList[option.key].outboundQuota),
      });
    }

    updateTransParams(from, { storeman, txFeeRatio: smgList[option.key].txFeeRatio });
  }

  filterStoremanData = item => {
    return item[this.props.chainType === 'ETH' ? 'ethAddress' : 'wanAddress'];
  }

  render () {
    const { loading, form, from, settings, smgList, wanAddrInfo, estimateFee, chainType, addrInfo } = this.props;
    let totalFeeTitle, desChain, selectedList, defaultSelectStoreman, capacity, quota;

    if (chainType === 'ETH') {
      desChain = 'WAN';
      selectedList = Object.keys(wanAddrInfo.normal);
      totalFeeTitle = `${estimateFee.original} eth + ${estimateFee.destination} wan`;
    } else {
      desChain = 'ETH';
      selectedList = Object.keys(addrInfo.normal);
      totalFeeTitle = `${estimateFee.original} wan + ${estimateFee.destination} eth`;
    }

    if (smgList.length === 0) {
      defaultSelectStoreman = '';
      capacity = quota = 0;
    } else {
      if (chainType === 'ETH') {
        defaultSelectStoreman = smgList[0].ethAddress;
        capacity = fromWei(smgList[0].quota)
        quota = fromWei(smgList[0].inboundQuota)
      } else {
        defaultSelectStoreman = smgList[0].wanAddress;
        quota = fromWei(smgList[0].outboundQuota);
      }
    }

    return (
      <div>
        <Modal visible destroyOnClose={true} closable={false} title={intl.get('CrossChainTransForm.transaction.ethtoweth')} onCancel={this.onCancel} className="cross-chain-modal"
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
                formName='from'
                disabled={true}
                options={{ initialValue: from }}
                prefix={<Icon type="wallet" className="colorInput" />}
                title={intl.get('NormalTransForm.from') + CHAINNAME[chainType]}
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
                options={{ initialValue: quota }}
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
        <Confirm chainType={chainType} estimateFee={estimateFee} visible={this.state.confirmVisible} handleCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading}/>
      </div>
    );
  }
}

export default CrossETHForm;
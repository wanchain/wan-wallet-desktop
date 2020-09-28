import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message, Spin, Checkbox } from 'antd';
import style from './index.less';
import PwdForm from 'componentUtils/PwdForm';
import SelectForm from 'componentUtils/SelectForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import { ETHPATH, WANPATH, PENALTYNUM, INBOUND, OUTBOUND, CROSS_TYPE, FAST_GAS } from 'utils/settings';
import ConfirmForm from 'components/CrossChain/CrossChainTransForm/ConfirmForm/CrossWANConfirmForm';
import { fromWei, isExceedBalance, formatNumByDecimals } from 'utils/support';
import { getFullChainName, getBalanceByAddr, checkAmountUnit, formatAmount, getValueByAddrInfo, getValueByNameInfo, getMintQuota, getBurnQuota } from 'utils/helper';

const Confirm = Form.create({ name: 'CrossWANConfirmForm' })(ConfirmForm);

@inject(stores => ({
  settings: stores.session.settings,
  language: stores.languageIntl.language,
  from: stores.sendCrossChainParams.currentFrom,
  tokenPairs: stores.crossChain.tokenPairs,
  currTokenPairId: stores.crossChain.currTokenPairId,
  updateTransParams: (addr, paramsObj) => stores.sendCrossChainParams.updateTransParams(addr, paramsObj),
  getChainAddressInfoByChain: chain => stores.tokens.getChainAddressInfoByChain(chain),
}))

@observer
class CrossWANForm extends Component {
  state = {
    confirmVisible: false,
    quota: 0,
    crossType: CROSS_TYPE[0],
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevProps.smgList !== this.props.smgList) {
      let { chainType, type, smgList, tokenPairs, currTokenPairId } = this.props;
      if (smgList.length === 0) {
        return;
      }
      const storeman = smgList[0].groupId;
      const decimals = tokenPairs[currTokenPairId].ancestorDecimals;
      let quota = '';
      if (type === INBOUND) {
        quota = await getMintQuota(chainType, currTokenPairId, storeman);
      } else {
        quota = await getBurnQuota(chainType, currTokenPairId, storeman);
      }
      this.setState({
        quota: formatNumByDecimals(quota, decimals)
      })
    }
  }

  componentWillUnmount() {
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
    const { updateTransParams, settings, form, from, estimateFee, tokenPairs, type, getChainAddressInfoByChain, currTokenPairId } = this.props;
    const tokenPairInfo = Object.assign({}, tokenPairs[currTokenPairId]);
    let fromAddrInfo = getChainAddressInfoByChain(tokenPairInfo[type === INBOUND ? 'fromChainSymbol' : 'toChainSymbol']);
    let toAddrInfo = getChainAddressInfoByChain(tokenPairInfo[type === INBOUND ? 'toChainSymbol' : 'fromChainSymbol']);
    form.validateFields(err => {
      if (err) {
        console.log('handleNext:', err);
        return;
      };

      let { pwd, amount: sendAmount, to } = form.getFieldsValue(['pwd', 'amount', 'to']);
      to = getValueByNameInfo(to, 'address', toAddrInfo);
      let origAddrAmount = getBalanceByAddr(from, fromAddrInfo);
      let destAddrAmount = getBalanceByAddr(to, toAddrInfo);
      let toPath = (type === INBOUND ? tokenPairInfo.toChainID : tokenPairInfo.fromChainID) - Number('0x80000000'.toString(10));
      toPath = `m/44'/${toPath}'/0'/0/${toAddrInfo.normal[to].path}`;
      // inbound
      if (type === INBOUND && (isExceedBalance(origAddrAmount, estimateFee.original, sendAmount) || isExceedBalance(destAddrAmount, estimateFee.destination))) {
        message.warn(intl.get('CrossChainTransForm.overBalance'));
        return;
      }
      // outbound
      if (type === OUTBOUND && (isExceedBalance(origAddrAmount, estimateFee.original) || isExceedBalance(destAddrAmount, estimateFee.destination))) {
        message.warn(intl.get('CrossChainTransForm.overBalance'));
        return;
      }
      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_checkPwd', { pwd: pwd }, (err) => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            updateTransParams(from, { to: { walletID: 1, path: toPath }, toAddr: to, amount: formatAmount(sendAmount) });
            this.setState({ confirmVisible: true });
          }
        })
      } else {
        updateTransParams(from, { to: { walletID: 1, path: toPath }, toAddr: to, amount: formatAmount(sendAmount) });
        this.setState({ confirmVisible: true });
      }
    });
  }

  sendTrans = () => {
    this.props.onSend(this.props.from);
  }

  checkAmount = (rule, value, callback) => {
    const { balance, smgList, form, estimateFee, tokenPairs, currTokenPairId, type } = this.props;
    let tokenPairInfo = Object.assign({}, tokenPairs[currTokenPairId]);
    const decimals = tokenPairInfo.ancestorDecimals;
    if (new BigNumber(value).gte('0') && checkAmountUnit(decimals || 18, value)) {
      if (type === INBOUND) {
        if (new BigNumber(value).plus(estimateFee.original).gt(balance)) {
          callback(intl.get('CrossChainTransForm.overTransBalance'));
        } else {
          callback();
        }
      } else if (type === OUTBOUND) {
        if (new BigNumber(value).gt(balance)) {
          callback(intl.get('CrossChainTransForm.overTransBalance'));
        } else {
          callback();
        }
      } else {
        /* if (type === OUTBOUND) {
          let { storemanAccount } = form.getFieldsValue(['storemanAccount']);
          let smg = smgList.find(item => (item.wanAddress || item.smgWanAddr) === storemanAccount);
          let newOriginalFee = new BigNumber(value).multipliedBy(smg.coin2WanRatio).multipliedBy(smg.txFeeRatio).dividedBy(PENALTYNUM).dividedBy(PENALTYNUM).plus(estimateFee.original).toString();// Outbound: crosschain fee + gas fee
          form.setFieldsValue({
            totalFee: `${newOriginalFee} WAN + ${estimateFee.destination} ETH`,
          });
        } */
        callback();
      }
    } else {
      callback(intl.get('Common.invalidAmount'));
    }
  }

  checkQuota = (rule, value, callback) => {
    value = value.split(' ')[0];
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

  updateLockAccounts = async (storeman) => {
    let { from, form, updateTransParams, chainType, type, tokenPairs, currTokenPairId } = this.props;
    const decimals = tokenPairs[currTokenPairId].ancestorDecimals;
    let quota = '';
    if (type === INBOUND) {
      quota = await getMintQuota(chainType, currTokenPairId, storeman);
    } else {
      quota = await getBurnQuota(chainType, currTokenPairId, storeman);
    }
    form.setFieldsValue({ quota: formatNumByDecimals(quota, decimals) });
    updateTransParams(from, { storeman });
  }

  updateCrossType = (v) => {
    let { from, updateTransParams } = this.props;
    updateTransParams(from, { crossType: v });
    this.setState({
      crossType: v,
    })
  }

  filterStoremanData = item => {
    return item.groupId;
  }

  sendAllAmount = e => {
    let { form, balance } = this.props;
    if (e.target.checked) {
      balance = typeof (balance) === 'string' ? balance.replace(/,/g, '') : balance;
      form.setFieldsValue({
        amount: new BigNumber(balance).toString(10)
      });
    } else {
      form.setFieldsValue({
        amount: 0
      });
    }
  }

  render() {
    const { loading, form, from, settings, smgList, chainType, symbol, gasPrice, type, tokenPairs, estimateFee, balance, getChainAddressInfoByChain, record, currTokenPairId } = this.props;
    const { quota } = this.state;
    let totalFeeTitle, desChain, selectedList, defaultSelectStoreman, title, fromAccount, toAccountList, unit;
    const tokenPairInfo = Object.assign({}, tokenPairs[currTokenPairId]);
    if (type === INBOUND) {
      desChain = tokenPairInfo.toChainSymbol;
      toAccountList = getChainAddressInfoByChain(tokenPairInfo.toChainSymbol);
      fromAccount = record.name;
      selectedList = Object.keys(getChainAddressInfoByChain(tokenPairInfo.toChainSymbol).normal);
      title = `${tokenPairInfo.fromTokenSymbol}@${tokenPairInfo.fromChainName} -> ${tokenPairInfo.toTokenSymbol}@${tokenPairInfo.toChainName}`;
      totalFeeTitle = this.state.crossType === CROSS_TYPE[0] ? `${estimateFee.original}  ${tokenPairInfo.fromChainSymbol}` : `${estimateFee.original} ${tokenPairInfo.fromChainSymbol} + ${estimateFee.destination} ${tokenPairInfo.toChainSymbol}`;
      unit = tokenPairInfo.fromTokenSymbol;
    } else {
      desChain = tokenPairInfo.fromChainSymbol;
      toAccountList = getChainAddressInfoByChain(tokenPairInfo.fromChainSymbol);
      fromAccount = record.name;
      selectedList = Object.keys(getChainAddressInfoByChain(tokenPairInfo.fromChainSymbol).normal);
      title = `${tokenPairInfo.toTokenSymbol}@${tokenPairInfo.toChainName} -> ${tokenPairInfo.fromTokenSymbol}@${tokenPairInfo.fromChainName}`;
      totalFeeTitle = this.state.crossType === CROSS_TYPE[0] ? `${estimateFee.original}  ${tokenPairInfo.toChainSymbol}` : `${estimateFee.original} ${tokenPairInfo.toChainSymbol} + ${estimateFee.destination} ${tokenPairInfo.fromChainSymbol}`;
      unit = tokenPairInfo.toTokenSymbol;
    }

    if (smgList.length === 0) {
      defaultSelectStoreman = '';
    } else {
      defaultSelectStoreman = smgList[0].groupId;
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
          <Spin spinning={this.props.spin} size="large" className="loadingData">
            <div className="validator-bg">
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='from'
                disabled={true}
                options={{ initialValue: fromAccount }}
                prefix={<Icon type="wallet" className="colorInput" />}
                title={intl.get('Common.from') + ' (' + getFullChainName(chainType) + ')'}
              />
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='balance'
                disabled={true}
                options={{ initialValue: balance + ` ${unit}` }}
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
                formMessage={intl.get('Common.storeman')}
              />
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='quota'
                disabled={true}
                options={{ initialValue: `${quota} ${unit}`, rules: [{ validator: this.checkQuota }] }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('CrossChainTransForm.quota')}
              />
              <SelectForm
                form={form}
                colSpan={6}
                formName='to'
                addrInfo={toAccountList}
                initialValue={getValueByAddrInfo(selectedList[0], 'name', toAccountList)}
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
                title={intl.get('Common.amount')}
              />
              {
                !(chainType === 'ETH' && symbol === undefined) && (<Checkbox onChange={this.sendAllAmount} style={{ padding: '0px 20px' }}>{intl.get('NormalTransForm.sendAll')}</Checkbox>)
              }
              {settings.reinput_pwd && <PwdForm form={form} colSpan={6} />}
            </div>
          </Spin>
        </Modal>
        {
          this.state.confirmVisible && <Confirm tokenSymbol={unit} chainType={chainType} estimateFee={form.getFieldValue('totalFee')} handleCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading} />
        }
      </div>
    );
  }
}

export default CrossWANForm;

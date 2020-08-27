import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message, Spin, Checkbox } from 'antd';

import style from './index.less';
import PwdForm from 'componentUtils/PwdForm';
import SelectForm from 'componentUtils/SelectForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import { ETHPATH, WANPATH, PENALTYNUM, INBOUND, OUTBOUND, CROSS_TYPE } from 'utils/settings';
import ConfirmForm from 'components/CrossChain/CrossChainTransForm/ConfirmForm';
import { fromWei, isExceedBalance, formatNumByDecimals } from 'utils/support';
import { getFullChainName, getBalanceByAddr, checkAmountUnit, formatAmount, getValueByAddrInfo, getValueByNameInfo, getChainInfoByChainId } from 'utils/helper';

const Confirm = Form.create({ name: 'CrossChainConfirmForm' })(ConfirmForm);

@inject(stores => ({
  settings: stores.session.settings,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  ethAddrInfo: stores.ethAddress.addrInfo,
  from: stores.sendCrossChainParams.currentFrom,
  transParams: stores.sendCrossChainParams.transParams,
  tokenPairs: stores.crossChain.tokenPairs,
  updateTransParams: (addr, paramsObj) => stores.sendCrossChainParams.updateTransParams(addr, paramsObj),
}))

@observer
class CrossChainTransForm extends Component {
  state = {
    confirmVisible: false,
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
    const { updateTransParams, settings, form, from, chainType, tokenAddr, estimateFee, transParams, tokenPairs, type } = this.props;
    const chainPairId = transParams[from].chainPairId;
    const tokenPairInfo = Object.assign({}, tokenPairs[chainPairId]);
    let fromAddrInfo = this.props[`${tokenPairInfo[type === INBOUND ? 'fromChainSymbol' : 'toChainSymbol'].toLowerCase()}AddrInfo`];
    let toAddrInfo = this.props[`${tokenPairInfo[type === INBOUND ? 'toChainSymbol' : 'fromChainSymbol'].toLowerCase()}AddrInfo`];

    form.validateFields(async err => {
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
      // console.log('next path::::', toPath);
      /* if (tokenAddr) {
        if (isExceedBalance(origAddrAmount, estimateFee.original) || isExceedBalance(destAddrAmount, estimateFee.destination)) {
          message.warn(intl.get('CrossChainTransForm.overBalance'));
          return;
        }
      } else {
        if (isExceedBalance(origAddrAmount, estimateFee.original, chainType === 'ETH' ? sendAmount : 0) || isExceedBalance(destAddrAmount, estimateFee.destination)) {
          message.warn(intl.get('CrossChainTransForm.overBalance'));
          return;
        }
      } */

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
    const { balance, chainType, smgList, form, estimateFee, transParams, from, tokenPairs } = this.props;
    const chainPairId = transParams[from].chainPairId;
    let tokenPairInfo = Object.assign({}, tokenPairs[chainPairId]);
    const decimals = tokenPairInfo.ancestorDecimals;

    if (new BigNumber(value).gte('0') && checkAmountUnit(decimals || 18, value)) {
      if (new BigNumber(value).gt(balance)) {
        callback(intl.get('CrossChainTransForm.overTransBalance'));
      } else {
        /* if (chainType === 'WAN') {
          let { storemanAccount } = form.getFieldsValue(['storemanAccount']);
          let smg = smgList.find(item => (item.wanAddress || item.smgWanAddr) === storemanAccount);
          let newOriginalFee = new BigNumber(value).multipliedBy(smg.coin2WanRatio).multipliedBy(smg.txFeeRatio).dividedBy(PENALTYNUM).dividedBy(PENALTYNUM).plus(estimateFee.original).toString();
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

    /* if (chainType === 'ETH') {
      form.setFieldsValue({
        capacity: tokenAddr ? formatNumByDecimals(smgList[option.key].quota, decimals) : fromWei(smgList[option.key].quota),
        quota: tokenAddr ? formatNumByDecimals(smgList[option.key].inboundQuota, decimals) : fromWei(smgList[option.key].inboundQuota),
      });
    } else {
      form.setFieldsValue({
        quota: tokenAddr ? formatNumByDecimals(smgList[option.key].outboundQuota, decimals) : fromWei(smgList[option.key].outboundQuota),
      });
    }

    updateTransParams(from, { storeman, txFeeRatio: smgList[option.key].txFeeRatio }); */
    updateTransParams(from, { storeman });
  }

  updateCrossType = (v) => {
    let { from, updateTransParams } = this.props;
    updateTransParams(from, { crossType: v });
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
    const { loading, form, from, settings, smgList, chainType, estimateFee, balance, tokenPairs, transParams, type, account } = this.props;
    let totalFeeTitle, desChain, selectedList, defaultSelectStoreman, capacity, quota, title, tokenSymbol, toAccountList;
    const chainPairId = transParams[from].chainPairId;
    const tokenPairInfo = Object.assign({}, tokenPairs[chainPairId]);
    const decimals = tokenPairInfo.ancestorDecimals;

    if (type === INBOUND) {
      desChain = tokenPairInfo.toChainSymbol;
      // let addrInfo = this.props[`${tokenPairInfo.fromChainSymbol.toLowerCase()}AddrInfo`];
      let addrInfo = this.props.ethAddrInfo;
      toAccountList = this.props[`${tokenPairInfo.toChainSymbol.toLowerCase()}AddrInfo`];
      selectedList = Object.keys(this.props[`${tokenPairInfo.toChainSymbol.toLowerCase()}AddrInfo`].normal);
      title = `${tokenPairInfo.fromTokenName} -> ${tokenPairInfo.toTokenName}`;
      tokenSymbol = tokenPairInfo.ancestorSymbol;
      totalFeeTitle = `${estimateFee.original} ${tokenPairInfo.fromChainSymbol} + ${estimateFee.destination} ${tokenPairInfo.toChainSymbol}`;
    } else {
      desChain = tokenPairInfo.fromChainSymbol;
      toAccountList = this.props[`${tokenPairInfo.fromChainSymbol.toLowerCase()}AddrInfo`];
      selectedList = Object.keys(this.props[`${tokenPairInfo.fromChainSymbol.toLowerCase()}AddrInfo`].normal);
      title = `${tokenPairInfo.toTokenName} -> ${tokenPairInfo.fromTokenName}`;
      tokenSymbol = tokenPairInfo.ancestorSymbol;
      totalFeeTitle = `${estimateFee.original} ${tokenPairInfo.toChainSymbol} + ${estimateFee.destination} ${tokenPairInfo.fromChainSymbol}`;
    }

    if (smgList.length === 0) {
      defaultSelectStoreman = '';
      capacity = quota = 0;
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
          <Spin spinning={this.props.spin} size="large" /* tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} */ className="loadingData">
            <div className="validator-bg">
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='from'
                disabled={true}
                options={{ initialValue: account }}
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
              {/* {
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
              /> */}
              <SelectForm
                form={form}
                colSpan={6}
                formName='to'
                addrInfo={toAccountList}
                initialValue={getValueByAddrInfo(selectedList[0], 'name', toAccountList)}
                selectedList={selectedList}
                formMessage={intl.get('NormalTransForm.to') + ' (' + getFullChainName(desChain) + ')'}
              />
              <SelectForm
                form={form}
                colSpan={6}
                formName='crossType'
                initialValue={CROSS_TYPE[0]}
                selectedList={CROSS_TYPE}
                formMessage={'Type'}
                handleChange={this.updateCrossType}
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
              {
                // !(chainType === 'ETH' && symbol === undefined) && (<Checkbox onChange={this.sendAllAmount} style={{ padding: '0px 20px' }}>{intl.get('NormalTransForm.sendAll')}</Checkbox>)
              }
              {settings.reinput_pwd && <PwdForm form={form} colSpan={6} />}
            </div>
          </Spin>
        </Modal>
        <Confirm tokenSymbol={tokenSymbol} chainType={chainType} estimateFee={form.getFieldValue('totalFee')} visible={this.state.confirmVisible} handleCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading} />
      </div>
    );
  }
}

export default CrossChainTransForm;

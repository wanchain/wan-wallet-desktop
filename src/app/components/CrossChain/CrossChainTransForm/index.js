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
import { getFullChainName, getBalanceByAddr, checkAmountUnit, formatAmount, getValueByAddrInfo, getValueByNameInfo, getChainInfoByChainId, getMintQuota, getBurnQuota } from 'utils/helper';

const Confirm = Form.create({ name: 'CrossChainConfirmForm' })(ConfirmForm);

@inject(stores => ({
  settings: stores.session.settings,
  language: stores.languageIntl.language,
  from: stores.sendCrossChainParams.currentFrom,
  transParams: stores.sendCrossChainParams.transParams,
  tokenPairs: stores.crossChain.tokenPairs,
  updateTransParams: (addr, paramsObj) => stores.sendCrossChainParams.updateTransParams(addr, paramsObj),
  getChainAddressInfoByChain: chain => stores.tokens.getChainAddressInfoByChain(chain),
}))

@observer
class CrossChainTransForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      confirmVisible: false,
      quota: 0,
    }
  }

  async componentWillMount() {
    let { from, chainType, type, smgList, transParams, tokenPairs } = this.props;
    if (smgList.length === 0) {
      return;
    }
    const storeman = smgList[0].groupId;
    const chainPairId = transParams[from].chainPairId;
    const tokenPairInfo = tokenPairs[chainPairId];
    const decimals = tokenPairInfo.ancestorDecimals;
    let quota = '';
    if (type === INBOUND) {
      quota = await getMintQuota(chainType, chainPairId, storeman);
    } else {
      quota = await getBurnQuota(chainType, chainPairId, storeman);
    }
    this.setState({
      quota: formatNumByDecimals(quota, decimals)
    })
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
    const { updateTransParams, settings, form, from, estimateFee, transParams, tokenPairs, type, getChainAddressInfoByChain } = this.props;
    const chainPairId = transParams[from].chainPairId;
    const tokenPairInfo = Object.assign({}, tokenPairs[chainPairId]);
    let fromAddrInfo = getChainAddressInfoByChain(tokenPairInfo[type === INBOUND ? 'fromChainSymbol' : 'toChainSymbol']);
    let toAddrInfo = getChainAddressInfoByChain(tokenPairInfo[type === INBOUND ? 'toChainSymbol' : 'fromChainSymbol']);

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

      // console.log('==', origAddrAmount, estimateFee.original, destAddrAmount, estimateFee.destination);
      if (isExceedBalance(origAddrAmount, estimateFee.original) || isExceedBalance(destAddrAmount, estimateFee.destination)) {
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

  updateLockAccounts = async (storeman, option) => {
    let { from, form, updateTransParams, chainType, type, transParams, tokenPairs } = this.props;
    const chainPairId = transParams[from].chainPairId;
    const decimals = tokenPairs[chainPairId].ancestorDecimals;
    let quota = '';
    // console.log('params:', chainType, chainPairId, storeman, typeof chainPairId);
    if (type === INBOUND) {
      quota = await getMintQuota(chainType, chainPairId, storeman);
    } else {
      quota = await getBurnQuota(chainType, chainPairId, storeman);
    }
    // console.log('quota:', quota);
    form.setFieldsValue({ quota: formatNumByDecimals(quota, decimals) });
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
    const { loading, form, from, settings, smgList, chainType, estimateFee, balance, tokenPairs, transParams, type, account, getChainAddressInfoByChain } = this.props;
    const { quota } = this.state;
    let totalFeeTitle, desChain, selectedList, defaultSelectStoreman, title, tokenSymbol, toAccountList;
    const chainPairId = transParams[from].chainPairId;
    const tokenPairInfo = Object.assign({}, tokenPairs[chainPairId]);
    // console.log('tokenPairInfo:', tokenPairInfo);
    if (type === INBOUND) {
      desChain = tokenPairInfo.toChainSymbol;
      toAccountList = getChainAddressInfoByChain(tokenPairInfo.toChainSymbol);
      selectedList = Object.keys(getChainAddressInfoByChain(tokenPairInfo.toChainSymbol).normal);
      title = `${tokenPairInfo.fromTokenName} -> ${tokenPairInfo.toTokenName}`;
      tokenSymbol = tokenPairInfo.ancestorSymbol;
      totalFeeTitle = `${estimateFee.original} ${tokenPairInfo.fromChainSymbol} + ${estimateFee.destination} ${tokenPairInfo.toChainSymbol}`;
    } else {
      desChain = tokenPairInfo.fromChainSymbol;
      toAccountList = getChainAddressInfoByChain(tokenPairInfo.fromChainSymbol);
      selectedList = Object.keys(getChainAddressInfoByChain(tokenPairInfo.fromChainSymbol).normal);
      title = `${tokenPairInfo.toTokenName} -> ${tokenPairInfo.fromTokenName}`;
      tokenSymbol = tokenPairInfo.ancestorSymbol;
      totalFeeTitle = `${estimateFee.original} ${tokenPairInfo.toChainSymbol} + ${estimateFee.destination} ${tokenPairInfo.fromChainSymbol}`;
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

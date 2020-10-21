import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message, Spin, Checkbox } from 'antd';
import style from './index.less';
import PwdForm from 'componentUtils/PwdForm';
import SelectForm from 'componentUtils/SelectForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import AdvancedCrossChainOptionForm from 'components/AdvancedCrossChainOptionForm';
import { ETHPATH, WANPATH, PENALTYNUM, CROSS_TYPE, INBOUND, FAST_GAS, OUTBOUND, WAN_ETH_DECIMAL } from 'utils/settings';
import ConfirmForm from 'components/CrossChain/CrossChainTransForm/ConfirmForm/CrossETHConfirmForm';
import { isExceedBalance, formatNumByDecimals, hexCharCodeToStr } from 'utils/support';
import { getFullChainName, getBalanceByAddr, checkAmountUnit, formatAmount, getValueByAddrInfo, getValueByNameInfo, getMintQuota, getBurnQuota } from 'utils/helper';

const Confirm = Form.create({ name: 'CrossETHConfirmForm' })(ConfirmForm);
const AdvancedCrossChainModal = Form.create({ name: 'AdvancedCrossChainOptionForm' })(AdvancedCrossChainOptionForm);

@inject(stores => ({
  settings: stores.session.settings,
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  from: stores.sendCrossChainParams.currentFrom,
  currTokenPairId: stores.crossChain.currTokenPairId,
  currentTokenPairInfo: stores.crossChain.currentTokenPairInfo,
  transParams: stores.sendCrossChainParams.transParams,
  updateTransParams: (addr, paramsObj) => stores.sendCrossChainParams.updateTransParams(addr, paramsObj),
  getChainAddressInfoByChain: chain => stores.tokens.getChainAddressInfoByChain(chain),
}))

@observer
class CrossETHForm extends Component {
  state = {
    confirmVisible: false,
    quota: 0,
    crossType: CROSS_TYPE[0],
    advancedVisible: false,
    advanced: false,
    advancedFee: 0,
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevProps.smgList !== this.props.smgList) {
      let { chainType, type, smgList, currTokenPairId, currentTokenPairInfo: info } = this.props;
      if (smgList.length === 0) {
        return;
      }
      const storeman = smgList[0].groupId;
      const decimals = info.ancestorDecimals;
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
    const { updateTransParams, settings, form, from, estimateFee, type, getChainAddressInfoByChain, currentTokenPairInfo: info } = this.props;
    let fromAddrInfo = getChainAddressInfoByChain(info[type === INBOUND ? 'fromChainSymbol' : 'toChainSymbol']);
    let toAddrInfo = getChainAddressInfoByChain(info[type === INBOUND ? 'toChainSymbol' : 'fromChainSymbol']);

    form.validateFields(err => {
      if (err) {
        console.log('handleNext:', err);
        return;
      };

      let { pwd, amount: sendAmount, to } = form.getFieldsValue(['pwd', 'amount', 'to']);
      to = getValueByNameInfo(to, 'address', toAddrInfo);
      let origAddrAmount = getBalanceByAddr(from, fromAddrInfo);
      let toPath = (type === INBOUND ? info.toChainID : info.fromChainID) - Number('0x80000000'.toString(10));
      toPath = `m/44'/${toPath}'/0'/0/${toAddrInfo.normal[to].path}`;

      if (type === INBOUND && isExceedBalance(origAddrAmount, estimateFee.original, sendAmount)) {
        message.warn(intl.get('CrossChainTransForm.overBalance'));
        return;
      }
      if (type === OUTBOUND && isExceedBalance(origAddrAmount, estimateFee.original)) {
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
    const { balance, chainType, smgList, form, estimateFee, from, type, currentTokenPairInfo: info } = this.props;
    const { advanced, advancedFee } = this.state;
    const decimals = info.ancestorDecimals;
    if (new BigNumber(value).gte('0') && checkAmountUnit(decimals || 18, value)) {
      if (type === INBOUND) {
        if (new BigNumber(value).plus(advanced ? advancedFee : estimateFee.original).gt(balance)) {
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

  updateLockAccounts = async (storeman, option) => {
    let { from, form, updateTransParams, chainType, type, currTokenPairId, currentTokenPairInfo: info } = this.props;
    const decimals = info.ancestorDecimals;
    let quota = '';
    if (type === INBOUND) {
      quota = await getMintQuota(chainType, currTokenPairId, storeman);
    } else {
      quota = await getBurnQuota(chainType, currTokenPairId, storeman);
    }
    form.setFieldsValue({ quota: formatNumByDecimals(quota, decimals) + ` ${type === INBOUND ? info.fromTokenSymbol : info.toTokenSymbol}` });
    updateTransParams(from, { storeman });
  }

  updateCrossType = (v) => {
    let { from, updateTransParams } = this.props;
    updateTransParams(from, { crossType: v });
    this.setState({
      crossType: v,
    })
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

  onAdvanced = () => {
    this.setState({
      advancedVisible: true,
    });
  }

  handleAdvancedCancel = () => {
    this.setState({
      advancedVisible: false,
    });
  }

  handleSaveOption = (gasPrice, gasLimit) => {
    this.setState({
      advancedVisible: false,
      advanced: true,
      advancedFee: formatNumByDecimals(new BigNumber(gasPrice).times(gasLimit).times(BigNumber(10).pow(9)).toString(10), WAN_ETH_DECIMAL)
    });
  }

  render() {
    const { loading, form, from, settings, smgList, gasPrice, chainType, estimateFee, balance, type, account, getChainAddressInfoByChain, currentTokenPairInfo: info } = this.props;
    const { quota, advancedVisible, advanced, advancedFee } = this.state;
    let totalFeeTitle, desChain, selectedList, defaultSelectStoreman, title, toAccountList, unit;
    if (type === INBOUND) {
      desChain = info.toChainSymbol;
      toAccountList = getChainAddressInfoByChain(info.toChainSymbol);
      selectedList = Object.keys(toAccountList.normal);
      title = `${info.fromTokenSymbol}@${info.fromChainName} -> ${info.toTokenSymbol}@${info.toChainName}`;
      if (advanced) {
        totalFeeTitle = `${advancedFee}  ${info.fromChainSymbol}`;
      } else {
        totalFeeTitle = this.state.crossType === CROSS_TYPE[0] ? `${new BigNumber(gasPrice).times(FAST_GAS).div(BigNumber(10).pow(9)).toString(10)}  ${info.fromChainSymbol}` : `${estimateFee.original} ${info.fromChainSymbol} + ${estimateFee.destination} ${info.toChainSymbol}`;
      }
      unit = info.fromTokenSymbol;
    } else {
      desChain = info.fromChainSymbol;
      toAccountList = getChainAddressInfoByChain(info.fromChainSymbol);
      selectedList = Object.keys(toAccountList.normal);
      title = `${info.toTokenSymbol}@${info.toChainName} -> ${info.fromTokenSymbol}@${info.fromChainName}`;
      if (advanced) {
        totalFeeTitle = `${advancedFee}  ${info.toChainSymbol}`;
      } else {
        totalFeeTitle = this.state.crossType === CROSS_TYPE[0] ? `${new BigNumber(gasPrice).times(FAST_GAS).div(BigNumber(10).pow(9)).toString(10)}  ${info.toChainSymbol}` : `${estimateFee.original} ${info.toChainSymbol} + ${estimateFee.destination} ${info.fromChainSymbol}`;
      }
      unit = info.toTokenSymbol;
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
                options={{ initialValue: balance + ` ${unit}` }}
                prefix={<Icon type="wallet" className="colorInput" />}
                title={intl.get('Common.balance')}
              />
              <SelectForm
                form={form}
                colSpan={6}
                formName='storemanAccount'
                initialValue={defaultSelectStoreman}
                selectedList={smgList.map(v => ({
                  text: hexCharCodeToStr(v.groupId),
                  value: v.groupId
                }))}
                isTextValueData={true}
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
              {/*  <SelectForm
                form={form}
                colSpan={6}
                formName='crossType'
                isTextValueData={true}
                initialValue={this.state.crossType}
                selectedList={CROSS_TYPE.map(v => ({ value: v, text: intl.get(`CrossChainTransForm.${v}`) }))}
                formMessage={'Type'}
                handleChange={this.updateCrossType}
              /> */}
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
              {type === OUTBOUND && (<Checkbox onChange={this.sendAllAmount} style={{ padding: '0px 20px' }}>{intl.get('NormalTransForm.sendAll')}</Checkbox>)}
              {settings.reinput_pwd && <PwdForm form={form} colSpan={6} />}
              <p className="onAdvancedT" onClick={this.onAdvanced}>{intl.get('NormalTransForm.advancedOptions')}</p>
            </div>
          </Spin>
        </Modal>
        { this.state.confirmVisible && <Confirm tokenSymbol={unit} chainType={chainType} estimateFee={form.getFieldValue('totalFee')} handleCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading} type={type} />}
        {advancedVisible && <AdvancedCrossChainModal onCancel={this.handleAdvancedCancel} onSave={this.handleSaveOption} from={from} />}
      </div>
    );
  }
}

export default CrossETHForm;

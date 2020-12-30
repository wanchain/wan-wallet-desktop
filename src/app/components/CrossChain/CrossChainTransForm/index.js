import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message, Spin, Checkbox, Tooltip } from 'antd';
import style from './index.less';
import PwdForm from 'componentUtils/PwdForm';
import SelectForm from 'componentUtils/SelectForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import AutoCompleteForm from 'componentUtils/AutoCompleteForm';
import AdvancedCrossChainOptionForm from 'components/AdvancedCrossChainOptionForm';
import { ETHPATH, WANPATH, PENALTYNUM, INBOUND, OUTBOUND, CROSS_TYPE, FAST_GAS, WAN_ETH_DECIMAL } from 'utils/settings';
import ConfirmForm from 'components/CrossChain/CrossChainTransForm/ConfirmForm';
import { isExceedBalance, formatNumByDecimals, hexCharCodeToStr, removeRedundantDecimal } from 'utils/support';
import { getFullChainName, getBalanceByAddr, checkAmountUnit, formatAmount, getValueByAddrInfo, getValueByNameInfo, getMintQuota, getBurnQuota, checkAddressByChainType, getFastMinCount, getFees } from 'utils/helper';

const Confirm = Form.create({ name: 'CrossChainConfirmForm' })(ConfirmForm);
const AdvancedCrossChainModal = Form.create({ name: 'AdvancedCrossChainOptionForm' })(AdvancedCrossChainOptionForm);

@inject(stores => ({
  settings: stores.session.settings,
  language: stores.languageIntl.language,
  from: stores.sendCrossChainParams.currentFrom,
  currTokenPairId: stores.crossChain.currTokenPairId,
  currentTokenPairInfo: stores.crossChain.currentTokenPairInfo,
  transParams: stores.sendCrossChainParams.transParams,
  coinPriceObj: stores.portfolio.coinPriceObj,
  updateTransParams: (addr, paramsObj) => stores.sendCrossChainParams.updateTransParams(addr, paramsObj),
  getChainAddressInfoByChain: chain => stores.tokens.getChainAddressInfoByChain(chain),
}))

@observer
class CrossChainTransForm extends Component {
  constructor(props) {
    super(props);
    let info = props.currentTokenPairInfo;
    this.addressSelections = Object.keys(props.getChainAddressInfoByChain(props.type === INBOUND ? info.toChainSymbol : info.fromChainSymbol).normal);
    this.state = {
      confirmVisible: false,
      quota: 0,
      crossType: CROSS_TYPE[0],
      advancedVisible: false,
      advanced: false,
      advancedFee: 0,
      fastMinCount: 0,
    }
    this.operationFee = 0;
    getFees(info[props.type === INBOUND ? 'fromChainSymbol' : 'toChainSymbol'], info.fromChainID, info.toChainID).then(res => {
      this.operationFee = res[0];
    }).catch(err => {
      console.log('err:', err);
      message.warn(intl.get('CrossChainTransForm.getOperationFeeFailed'));
    });
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevProps.smgList !== this.props.smgList) {
      let { chainType, type, smgList, currentTokenPairInfo: info, currTokenPairId } = this.props;
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

  componentDidMount() {
    const { currentTokenPairInfo: info, currTokenPairId, type } = this.props;
    getFastMinCount(type === INBOUND ? info.fromChainSymbol : info.toChainSymbol, currTokenPairId).then(res => {
      this.setState({ fastMinCount: res });
    }).catch(err => {
      console.log('err:', err);
    });
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
    const { advanced, advancedFee, fastMinCount } = this.state;
    let fromAddrInfo = getChainAddressInfoByChain(info[type === INBOUND ? 'fromChainSymbol' : 'toChainSymbol']);
    let toAddrInfo = getChainAddressInfoByChain(info[type === INBOUND ? 'toChainSymbol' : 'fromChainSymbol']);
    let isNativeAccount = false; // Figure out if the to value is contained in my wallet.
    form.validateFields(async err => {
      if (err) {
        console.log('handleNext:', err);
        return;
      };

      let { pwd, amount: sendAmount, to } = form.getFieldsValue(['pwd', 'amount', 'to']);
      if (new BigNumber(sendAmount).lt(fastMinCount)) {
        message.warn(`${intl.get('CrossChainTransForm.UnderFastMinimum')}: ${removeRedundantDecimal(fastMinCount, 2)} ${info[type === INBOUND ? 'fromTokenSymbol' : 'toTokenSymbol']}`);
        return;
      }
      if (this.accountSelections.includes(to)) {
        to = getValueByNameInfo(to, 'address', toAddrInfo);
        isNativeAccount = true;
      } else if (this.addressSelections.includes(to)) {
        isNativeAccount = true;
      }
      let origAddrAmount = getBalanceByAddr(from, fromAddrInfo);
      let toPath = (type === INBOUND ? info.toChainID : info.fromChainID) - Number('0x80000000'.toString(10));
      toPath = isNativeAccount ? `m/44'/${toPath}'/0'/0/${toAddrInfo.normal[to].path}` : undefined;

      if (isExceedBalance(origAddrAmount, advanced ? advancedFee : estimateFee.original)) {
        message.warn(intl.get('CrossChainTransForm.overOriginalBalance'));
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
            updateTransParams(from, { to: isNativeAccount ? { walletID: 1, path: toPath } : to, toAddr: to, amount: formatAmount(sendAmount) });
            this.setState({ confirmVisible: true });
          }
        })
      } else {
        updateTransParams(from, { to: isNativeAccount ? { walletID: 1, path: toPath } : to, toAddr: to, amount: formatAmount(sendAmount) });
        this.setState({ confirmVisible: true });
      }
    });
  }

  sendTrans = () => {
    this.props.onSend(this.props.from);
  }

  checkAmount = (rule, value, callback) => {
    const { balance, chainType, smgList, form, estimateFee, from, type, currentTokenPairInfo: info } = this.props;
    const decimals = info.ancestorDecimals;

    if (new BigNumber(value).gte('0') && checkAmountUnit(decimals || 18, value)) {
      if (new BigNumber(value).gt(balance)) {
        callback(intl.get('CrossChainTransForm.overTransBalance'));
      } else {
        /* if (type === OUTBOUND) {
          let { storemanAccount } = form.getFieldsValue(['storemanAccount']);
          let smg = smgList.find(item => (item.wanAddress || item.smgWanAddr) === storemanAccount);
          let newOriginalFee = new BigNumber(value).multipliedBy(smg.coin2WanRatio).multipliedBy(smg.txFeeRatio).dividedBy(PENALTYNUM).dividedBy(PENALTYNUM).plus(estimateFee.original).toString(); // Outbound: crosschain fee + gas fee
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
      form.setFieldsValue({
        amount: new BigNumber(balance).toString(10)
      });
    } else {
      form.setFieldsValue({
        amount: 0
      });
    }
  }

  checkTo = async (rule, value, callback) => {
    const { currentTokenPairInfo: info, type } = this.props;
    let chain = type === INBOUND ? info.toChainSymbol : info.fromChainSymbol;
    if (this.accountSelections.includes(value) || this.addressSelections.includes(value)) {
      callback();
    } else {
      let isValid = await checkAddressByChainType(value, chain);
      isValid ? callback() : callback(intl.get('NormalTransForm.invalidAddress'));
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
      advancedFee: formatNumByDecimals(new BigNumber(gasPrice).times(gasLimit).times(BigNumber(10).pow(9)).toString(10), WAN_ETH_DECIMAL),
    });
  }

  render() {
    const { loading, form, from, settings, smgList, gasPrice, chainType, balance, type, account, getChainAddressInfoByChain, currentTokenPairInfo: info, coinPriceObj } = this.props;
    const { quota, advancedVisible, advanced, advancedFee } = this.state;
    let gasFee, operationFee, totalFee, desChain, title, tokenSymbol, toAccountList, quotaUnit, canAdvance, feeUnit;
    if (type === INBOUND) {
      desChain = info.toChainSymbol;
      toAccountList = getChainAddressInfoByChain(info.toChainSymbol);
      title = `${info.fromTokenSymbol}@${info.fromChainName} -> ${info.toTokenSymbol}@${info.toChainName}`;
      tokenSymbol = info.fromTokenSymbol;
      quotaUnit = info.fromTokenSymbol;
      feeUnit = info.fromChainSymbol;
      canAdvance = ['WAN', 'ETH'].includes(info.fromChainSymbol);
    } else {
      desChain = info.fromChainSymbol;
      toAccountList = getChainAddressInfoByChain(info.fromChainSymbol);
      title = `${info.toTokenSymbol}@${info.toChainName} -> ${info.fromTokenSymbol}@${info.fromChainName}`;
      tokenSymbol = info.toTokenSymbol;
      quotaUnit = info.toTokenSymbol;
      feeUnit = info.toChainSymbol;
      canAdvance = ['WAN', 'ETH'].includes(info.toChainSymbol);
    }
    gasFee = advanced ? advancedFee : new BigNumber(gasPrice).times(FAST_GAS).div(BigNumber(10).pow(9)).toString(10);
    this.accountSelections = this.addressSelections.map(val => getValueByAddrInfo(val, 'name', toAccountList));
    let defaultSelectStoreman = smgList.length === 0 ? '' : smgList[0].groupId;

    // Convert the value of fee to USD
    if ((typeof coinPriceObj === 'object') && feeUnit in coinPriceObj) {
      totalFee = `${new BigNumber(gasFee).plus(this.operationFee).times(coinPriceObj[feeUnit]).toString()} USD`;
    } else {
      totalFee = `${new BigNumber(gasFee).plus(this.operationFee).toString()} ${feeUnit}`;
    }
    gasFee = `${removeRedundantDecimal(gasFee)} ${feeUnit}`;
    operationFee = `${removeRedundantDecimal(this.operationFee)} ${feeUnit}`;

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
                selectedList={smgList.map(v => ({
                  text: hexCharCodeToStr(v.groupId),
                  value: v.groupId
                }))}
                isTextValueData={true}
                handleChange={this.updateLockAccounts}
                formMessage={intl.get('Common.storemanGroup')}
              />
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='quota'
                disabled={true}
                options={{ initialValue: `${quota} ${quotaUnit}`, rules: [{ validator: this.checkQuota }] }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('CrossChainTransForm.quota')}
              />
              <AutoCompleteForm
                form={form}
                colSpan={6}
                formName='to'
                dataSource={this.accountSelections}
                formMessage={intl.get('NormalTransForm.to') + ' (' + getFullChainName(desChain) + ')'}
                options={{ rules: [{ required: true }, { validator: this.checkTo }], initialValue: this.accountSelections[0] }}
              />
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='totalFee'
                disabled={true}
                options={{ initialValue: totalFee }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('CrossChainTransForm.estimateFee')}
                suffix={<Tooltip title={
                  <table className={style['suffix_table']}>
                    <tbody>
                      <tr><td>{intl.get('CrossChainTransForm.gasFee')}:</td><td>{gasFee}</td></tr>
                      <tr><td>{intl.get('CrossChainTransForm.operationFee')}:</td><td>{operationFee}</td></tr>
                    </tbody>
                  </table>
                }><Icon type="exclamation-circle" /></Tooltip>}
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
              <Checkbox onChange={this.sendAllAmount} style={{ padding: '0px 20px' }}>{intl.get('NormalTransForm.sendAll')}</Checkbox>
              {settings.reinput_pwd && <PwdForm form={form} colSpan={6} />}
              <p className="onAdvancedT"><span onClick={this.onAdvanced}>{intl.get('NormalTransForm.advancedOptions')}</span></p>
            </div>
          </Spin>
        </Modal>
        <Confirm tokenSymbol={tokenSymbol} chainType={chainType} estimateFee={form.getFieldValue('totalFee')} visible={this.state.confirmVisible} handleCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} type={type} loading={loading} />
        {advancedVisible && <AdvancedCrossChainModal chainType={chainType} onCancel={this.handleAdvancedCancel} onSave={this.handleSaveOption} from={from} />}
      </div>
    );
  }
}

export default CrossChainTransForm;

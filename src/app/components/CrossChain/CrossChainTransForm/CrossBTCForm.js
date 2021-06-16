import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message, Spin, Checkbox, Tooltip } from 'antd';
import style from './index.less';
import PwdForm from 'componentUtils/PwdForm';
import SelectForm from 'componentUtils/SelectForm';
import { isExceedBalance, formatNumByDecimals, removeRedundantDecimal, hexCharCodeToStr } from 'utils/support';
import CommonFormItem from 'componentUtils/CommonFormItem';
import AutoCompleteForm from 'componentUtils/AutoCompleteForm';
import { INBOUND, OUTBOUND, WALLETID } from 'utils/settings';
import outboundOptionForm from 'components/AdvancedCrossChainOptionForm';
import OptionForm from 'components/AdvancedCrossChainOptionForm/AdvancedBTCCrossChainOptionForm';
import ConfirmForm from 'components/CrossChain/CrossChainTransForm/ConfirmForm/CrossBTCConfirmForm';
import { getFullChainName, getBalanceByAddr, checkAmountUnit, formatAmount, getValueByAddrInfo, getCrossChainContractData, getQuota, checkAddressByChainType, getValueByNameInfoAllType, getInfoByAddress } from 'utils/helper';

const Confirm = Form.create({ name: 'CrossBTCConfirmForm' })(ConfirmForm);
const AdvancedOptionForm = Form.create({ name: 'AdvancedBTCCrossChainOptionForm' })(OptionForm);
const AdvancedOutboundOptionForm = Form.create({ name: 'AdvancedBTCCrossChainOptionForm' })(outboundOptionForm);

@inject(stores => ({
  utxos: stores.btcAddress.utxos,
  settings: stores.session.settings,
  btcPath: stores.btcAddress.btcPath,
  addrInfo: stores.btcAddress.addrInfo,
  language: stores.languageIntl.language,
  minCrossBTC: stores.sendCrossChainParams.minCrossBTC,
  currentTokenPairInfo: stores.crossChain.currentTokenPairInfo,
  coinPriceObj: stores.portfolio.coinPriceObj,
  transParams: stores.sendCrossChainParams.transParams,
  BTCCrossTransParams: stores.sendCrossChainParams.BTCCrossTransParams,
  currTokenPairId: stores.crossChain.currTokenPairId,
  updateTransParams: (addr, paramsObj) => stores.sendCrossChainParams.updateTransParams(addr, paramsObj),
  updateBTCTransParams: paramsObj => stores.sendCrossChainParams.updateBTCTransParams(paramsObj),
  getChainAddressInfoByChain: chain => stores.tokens.getChainAddressInfoByChain(chain),
  getPathPrefix: chain => stores.tokens.getPathPrefix(chain),
}))

@observer
class CrossBTCForm extends Component {
  constructor(props) {
    super(props);
    let info = props.currentTokenPairInfo;
    let addressInfo = props.getChainAddressInfoByChain(props.direction === INBOUND ? info.toChainSymbol : info.fromChainSymbol);
    this.addressSelections = Object.keys({ ...addressInfo.normal, ...addressInfo.ledger, ...addressInfo.trezor });
    this.accountSelections = this.addressSelections.map(val => getValueByAddrInfo(val, 'name', addressInfo));
    this.state = {
      fee: 0,
      crossChainNetworkFee: 0,
      confirmVisible: false,
      advancedVisible: false,
      feeRate: 0,
      minQuota: 0,
      maxQuota: 0,
      receive: 0,
      sendAll: false,
    }
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.smgList !== this.props.smgList) {
      let { smgList, direction, currentTokenPairInfo: info } = this.props;
      try {
        const chainType = direction === INBOUND ? info.fromChainSymbol : info.toChainSymbol;
        let [{ minQuota, maxQuota }] = await getQuota(chainType, smgList[0].groupId, [info.ancestorSymbol]);
        const decimals = info.ancestorDecimals;
        this.setState({
          minQuota: formatNumByDecimals(minQuota, decimals),
          maxQuota: formatNumByDecimals(maxQuota, decimals)
        })
      } catch (e) {
        console.log('e:', e);
        message.warn(intl.get('CrossChainTransForm.getQuotaFailed'));
        this.props.onCancel();
      }
    }
  }

  componentWillUnmount() {
    this.setState = () => {
      return false;
    };
  }

  handleConfirmCancel = () => {
    this.setState({
      confirmVisible: false,
    });
  }

  handleNext = () => {
    const { updateBTCTransParams, updateTransParams, addrInfo, settings, estimateFee, form, direction, balance, from, btcPath, currentTokenPairInfo: info, getChainAddressInfoByChain, getPathPrefix } = this.props;
    const { sendAll } = this.state;
    let otherAddrInfo = Object.assign({}, getChainAddressInfoByChain(info.toChainSymbol));
    let isNativeAccount = false; // Figure out if the to value is contained in my wallet.
    form.validateFields((err, { pwd, amount: sendAmount, to }) => {
      if (err) {
        console.log('handleNext:', err);
        return;
      };

      const { minQuota, maxQuota, fee } = this.state;
      if (new BigNumber(sendAmount).lt(minQuota)) {
        message.warn(`${intl.get('CrossChainTransForm.UnderFastMinimum')}: ${removeRedundantDecimal(minQuota, 2)} ${info[direction === INBOUND ? 'fromTokenSymbol' : 'toTokenSymbol']}`);
        return;
      }

      if (new BigNumber(sendAmount).gt(maxQuota)) {
        message.warn(intl.get('CrossChainTransForm.overQuota'));
        return;
      }

      let addrType = 'normal';
      let toAddrInfo = direction === INBOUND ? otherAddrInfo : addrInfo
      if (this.accountSelections.includes(to)) {
        addrType = getValueByNameInfoAllType(to, 'type', toAddrInfo);
        to = getValueByNameInfoAllType(to, 'address', toAddrInfo);
        isNativeAccount = true;
      } else if (this.addressSelections.includes(to)) {
        isNativeAccount = true;
        addrType = getInfoByAddress(to, [], toAddrInfo).type;
      }

      if (direction === INBOUND) {
        if (!sendAll && isExceedBalance(balance, fee, sendAmount)) {
          message.warn(intl.get('CrossChainTransForm.overBalance'));
          return;
        }
      } else {
        if (isExceedBalance(balance, sendAmount) || isExceedBalance(getBalanceByAddr(from, otherAddrInfo), estimateFee)) {
          message.warn(intl.get('CrossChainTransForm.overBalance'));
          return;
        }
      }

      let walletID = addrType === 'normal' ? 1 : WALLETID[addrType.toUpperCase()]
      let toValue = isNativeAccount && addrType !== 'trezor';
      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_checkPwd', { pwd }, (err) => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            if (direction === INBOUND) {
              updateBTCTransParams({ to: toValue ? { walletID, path: addrType === 'normal' ? getPathPrefix(info.toChainSymbol) + otherAddrInfo.normal[to].path : otherAddrInfo[addrType][to].path } : to, toAddr: to, value: formatAmount(sendAmount) });
            } else {
              updateTransParams(from, { to: toValue ? { walletID, path: btcPath + addrInfo.normal[to].path } : to, toAddr: to, amount: formatAmount(sendAmount) });
            }
            this.setState({ confirmVisible: true });
          }
        })
      } else {
        if (direction === INBOUND) {
          updateBTCTransParams({ to: toValue ? { walletID, path: addrType === 'normal' ? getPathPrefix(info.toChainSymbol) + otherAddrInfo.normal[to].path : otherAddrInfo[addrType][to].path } : to, toAddr: to, value: formatAmount(sendAmount) });
        } else {
          updateTransParams(from, { to: toValue ? { walletID, path: btcPath + addrInfo.normal[to].path } : to, toAddr: to, amount: formatAmount(sendAmount) });
        }
        this.setState({ confirmVisible: true });
      }
    });
  }

  sendTrans = () => {
    this.props.onSend(this.props.from);
  }

  checkAmount = async (rule, value, callback) => {
    const { addrInfo, btcPath, updateBTCTransParams, minCrossBTC, direction, balance, transParams, currentTokenPairInfo: info } = this.props;
    if (new BigNumber(value).gte(minCrossBTC)) {
      if (checkAmountUnit(8, value)) {
        const { minQuota, maxQuota, sendAll } = this.state;
        if (new BigNumber(value).lt(minQuota)) {
          let errText = `${intl.get('CrossChainTransForm.UnderFastMinimum')}: ${removeRedundantDecimal(minQuota, 2)} ${info[direction === INBOUND ? 'fromTokenSymbol' : 'toTokenSymbol']}`;
          callback(errText);
          return;
        }

        if (new BigNumber(value).gt(maxQuota)) {
          callback(intl.get('CrossChainTransForm.overQuota'));
          return;
        }

        if (direction === INBOUND) {
          let from = Object.keys(addrInfo.normal).map(key => ({
            path: `${btcPath}${addrInfo.normal[key].path}`,
            walletID: 1
          }));
          updateBTCTransParams({ from });
          try {
            let getFee = await this.getFee(from, value);
            if (getFee === false) {
              callback(intl.get('CrossChainTransForm.getNetworkFeeFailed'));
              return;
            }
            let fee = formatNumByDecimals(getFee.result.fee, 8); // user network fee
            let crossChainNetworkFee = formatNumByDecimals(getFee.result.networkFee || 0, 8); // cross-chain network fee
            this.setState({ fee, crossChainNetworkFee });
            if (!this.state.sendAll && isExceedBalance(balance, fee, value)) {
              callback(intl.get('CrossChainTransForm.overBalance'));
              return;
            }
            this.setState({ receive: new BigNumber(value).minus(crossChainNetworkFee).minus(sendAll ? fee : 0).toString() });
            callback();
          } catch (e) {
            console.log('get Fee error:', e);
            callback(intl.get('CrossChainTransForm.getNetworkFeeFailed'));
          }
        } else {
          if (isExceedBalance(balance, value)) {
            callback(intl.get('CrossChainTransForm.overBalance'));
            return;
          }

          try {
            let from = transParams[this.props.from].from;
            let getFee = await this.getFee(Object.assign({}, from), value);
            if (getFee === false) {
              callback(intl.get('CrossChainTransForm.getNetworkFeeFailed'));
              return;
            }

            let crossChainNetworkFee = formatNumByDecimals(getFee.result.networkFee || 0, 8); // cross-chain network fee
            this.setState({ receive: new BigNumber(value).minus(crossChainNetworkFee).toString(), crossChainNetworkFee });
            callback();
          } catch (e) {
            console.log('get Fee error:', e);
            callback(intl.get('CrossChainTransForm.getNetworkFeeFailed'));
          }
        }
      } else {
        callback(intl.get('Common.invalidAmount'));
      }
    } else {
      let message = intl.get('CrossChainTransForm.invalidAmount') + minCrossBTC;
      callback(message);
    }
  }

  getFee = (from, value) => {
    const { direction, BTCCrossTransParams, transParams, currTokenPairId: tokenPairID, currentTokenPairInfo: info, getPathPrefix, getChainAddressInfoByChain, form, addrInfo } = this.props;
    let otherAddrInfo = getChainAddressInfoByChain(info.toChainSymbol);

    let toAddress = form.getFieldsValue(['to']).to;
    let isNativeAccount = false;
    let addrType = 'normal';
    let toAddrInfo = direction === INBOUND ? otherAddrInfo : addrInfo
    if (this.accountSelections.includes(toAddress)) {
      addrType = getValueByNameInfoAllType(toAddress, 'type', toAddrInfo)
      toAddress = getValueByNameInfoAllType(toAddress, 'address', toAddrInfo);
      isNativeAccount = true;
    } else if (this.addressSelections.includes(toAddress)) {
      isNativeAccount = true;
      addrType = getInfoByAddress(toAddress, [], toAddrInfo).type
    }

    let input;
    if (direction === INBOUND) {
      input = {
        from,
        tokenPairID,
        value,
        feeRate: BTCCrossTransParams.feeRate,
        changeAddress: BTCCrossTransParams.changeAddress,
        storeman: BTCCrossTransParams.storeman,
        to: isNativeAccount && addrType !== 'trezor' ? {
          walletID: 1,
          path: addrType === 'normal' ? getPathPrefix(info.toChainSymbol) + otherAddrInfo.normal[toAddress].path : otherAddrInfo[addrType][toAddress].path
        } : toAddress
      }
    } else {
      input = {
        from: from.walletID === 3 ? this.props.from : from,
        to: isNativeAccount ? {
          walletID: 1,
          path: getPathPrefix(info.fromChainSymbol) + addrInfo.normal[toAddress].path
        } : toAddress,
        amount: value,
        gasPrice: transParams[this.props.from].gasPrice,
        gasLimit: transParams[this.props.from].gasLimit,
        storeman: transParams[this.props.from].storeman,
        tokenPairID,
        crossType: transParams[this.props.from].crossType
      };
    }
    let param = direction === INBOUND ? { input, tokenPairID, sourceSymbol: info.fromChainSymbol, sourceAccount: info.fromAccount, destinationSymbol: info.toChainSymbol, destinationAccount: info.toAccount, type: 'LOCK' } : { input, tokenPairID, sourceSymbol: info.toChainSymbol, sourceAccount: info.toAccount, destinationSymbol: info.fromChainSymbol, destinationAccount: info.fromAccount, type: 'LOCK' };
    return getCrossChainContractData(param);
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

  checkTo = async (rule, value, callback) => {
    const { currentTokenPairInfo: info, direction } = this.props;
    let toChain = direction === INBOUND ? info.toChainSymbol : info.fromChainSymbol;
    if (this.accountSelections.includes(value) || this.addressSelections.includes(value)) {
      callback();
    } else {
      let isValid;
      if (toChain === 'WAN') {
        let [isWAN, isETH] = await Promise.all([checkAddressByChainType(value, 'WAN'), checkAddressByChainType(value, 'ETH')]);
        isValid = isWAN || isETH;
      } else {
        isValid = await checkAddressByChainType(value, toChain);
      }
      isValid ? callback() : callback(intl.get('NormalTransForm.invalidAddress'));
    }
  }

  updateLockAccounts = async (storeman) => {
    const { updateBTCTransParams, updateTransParams, direction, currentTokenPairInfo: info, from } = this.props;
    try {
      const chainType = direction === INBOUND ? info.fromChainSymbol : info.toChainSymbol;
      const [{ minQuota, maxQuota }] = await getQuota(chainType, storeman, [info.ancestorSymbol]);
      const decimals = info.ancestorDecimals;
      this.setState({
        minQuota: formatNumByDecimals(minQuota, decimals),
        maxQuota: formatNumByDecimals(maxQuota, decimals)
      });
    } catch (e) {
      console.log('e:', e);
      message.warn(intl.get('CrossChainTransForm.getQuotaFailed'));
      this.props.onCancel();
    }

    direction === INBOUND ? updateBTCTransParams({ storeman }) : updateTransParams(from, { storeman });
  }

  filterStoremanData = item => {
    return item.groupId;
  }

  sendAllAmount = e => {
    let { form, balance } = this.props;
    if (e.target.checked) {
      this.setState({ sendAll: true });
      form.setFieldsValue({
        amount: new BigNumber(balance).toString(10)
      }, () => {
        form.validateFields(['amount'], { force: true });
      });
    } else {
      this.setState({ sendAll: false });
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

  handleInBoundSaveOption = (feeRate) => {
    const { updateBTCTransParams, form } = this.props;
    this.setState({
      advancedVisible: false,
      feeRate
    });
    updateBTCTransParams({ feeRate });
    form.validateFields(['amount'], { force: true });
  }

  handleOutBoundSaveOption = (gasPrice, gasLimit) => {
    this.props.updateBTCTransParams({ gasPrice, gasLimit });
    this.setState({
      advancedVisible: false,
    });
  }

  render() {
    const { loading, form, from, settings, smgList, estimateFee, direction, addrInfo, balance, currentTokenPairInfo: info, getChainAddressInfoByChain, coinPriceObj } = this.props;
    const { advancedVisible, feeRate, receive, crossChainNetworkFee, sendAll } = this.state;
    let gasFee, totalFee, desChain, defaultSelectStoreman, title, unit, toUnit;
    let otherAddrInfo = getChainAddressInfoByChain(info.toChainSymbol);
    if (direction === INBOUND) {
      desChain = info.toChainSymbol;
      title = `${info.fromTokenSymbol}@${info.fromChainName} -> ${info.toTokenSymbol}@${info.toChainName}`;
      // Convert the value of fee to USD
      if ((typeof coinPriceObj === 'object') && info.fromChainSymbol in coinPriceObj) {
        totalFee = `${new BigNumber(this.state.fee).times(coinPriceObj[info.fromChainSymbol]).toString()} USD`;
      } else {
        totalFee = `${this.state.fee} ${info.fromChainSymbol}`;
      }
      gasFee = `${this.state.fee} ${info.fromChainSymbol}`;
    } else {
      desChain = info.fromChainSymbol;
      title = `${info.toTokenSymbol}@${info.toChainName} -> ${info.fromTokenSymbol}@${info.fromChainName}`;
      // Convert the value of fee to USD
      if ((typeof coinPriceObj === 'object') && info.toChainSymbol in coinPriceObj) {
        totalFee = `${new BigNumber(estimateFee).times(coinPriceObj[info.toChainSymbol]).toString()} USD`;
      } else {
        totalFee = `${estimateFee} ${info.toChainSymbol}`;
      }
      gasFee = `${removeRedundantDecimal(estimateFee)} ${info.toChainSymbol}`;
    }

    if (smgList.length === 0) {
      defaultSelectStoreman = '';
    } else {
      if (direction === INBOUND) {
        unit = info.fromTokenSymbol;
        toUnit = info.toTokenSymbol;
      } else {
        unit = info.toTokenSymbol;
        toUnit = info.fromTokenSymbol;
      }
      defaultSelectStoreman = smgList[0].groupId;
    }

    return (
      <div>
        <Modal
          visible
          destroyOnClose={true}
          closable={false}
          title={title}
          onCancel={this.props.onCancel}
          className={style['cross-chain-modal']}
          footer={[
            <Button key="back" className="cancel" onClick={this.props.onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button disabled={this.props.spin} key="submit" type="primary" onClick={this.handleNext}>{intl.get('Common.next')}</Button>,
          ]}
        >
          <Spin spinning={this.props.spin} size="large" className="loadingData">
            <div className="validator-bg">
              {
                direction !== INBOUND &&
                <CommonFormItem
                  form={form}
                  colSpan={6}
                  formName='from'
                  disabled={true}
                  options={{ initialValue: getValueByAddrInfo(from, 'name', otherAddrInfo) }}
                  prefix={<Icon type="credit-card" className="colorInput" />}
                  title={intl.get('Common.from')}
                />
              }
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='balance'
                disabled={true}
                options={{ initialValue: `${balance} ${unit}` }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('StakeInForm.balance')}
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
                filterItem={this.filterStoremanData}
                handleChange={this.updateLockAccounts}
                formMessage={intl.get('Common.storemanGroup')}
              />
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='quota'
                disabled={true}
                options={{ initialValue: `${this.state.maxQuota} ${unit}`, rules: [{ validator: this.checkQuota }] }}
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
                      <tr><td>{intl.get('CrossChainTransForm.userNetworkFee')}:</td><td>{gasFee}</td></tr>
                    </tbody>
                  </table>
                }><Icon type="exclamation-circle" /></Tooltip>}
              />
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='amount'
                options={{ rules: [{ required: true, validator: this.checkAmount }] }}
                placeholder={0}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('Common.amount')}
              />
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='receive'
                disabled={true}
                options={{ initialValue: `${receive} ${toUnit}` }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('CrossChainTransForm.youWillReceive')}
                suffix={<Tooltip title={
                  <table className={style['suffix_table']}>
                    <tbody>
                      <tr><td>{intl.get('CrossChainTransForm.crossChainNetworkFee')}:</td><td>{`${crossChainNetworkFee} ${toUnit}`}</td></tr>
                    </tbody>
                  </table>
                }><Icon type="exclamation-circle" /></Tooltip>}
              />
              <Checkbox checked={sendAll} onChange={this.sendAllAmount} style={{ padding: '0px 20px' }}>{intl.get('NormalTransForm.sendAll')}</Checkbox>
              {settings.reinput_pwd && <PwdForm form={form} colSpan={6} />}
              <p className="onAdvancedT"><span onClick={this.onAdvanced}>{intl.get('NormalTransForm.advancedOptions')}</span></p>
            </div>
          </Spin>
        </Modal>
        <Confirm chainType="BTC" direction={direction} totalFeeTitle={totalFee} visible={this.state.confirmVisible} handleCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading} />
        { advancedVisible && direction === INBOUND && <AdvancedOptionForm chainType={'BTC'} value={feeRate || this.props.BTCCrossTransParams.feeRate} onCancel={this.handleAdvancedCancel} onSave={this.handleInBoundSaveOption} from={from} />}
        { advancedVisible && direction === OUTBOUND && <AdvancedOutboundOptionForm chainType={info.toChainSymbol} onCancel={this.handleAdvancedCancel} onSave={this.handleOutBoundSaveOption} from={from} />}
      </div>
    );
  }
}

export default CrossBTCForm;

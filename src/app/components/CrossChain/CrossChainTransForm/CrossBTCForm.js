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
import { INBOUND, OUTBOUND } from 'utils/settings';
import outboundOptionForm from 'components/AdvancedCrossChainOptionForm';
import OptionForm from 'components/AdvancedCrossChainOptionForm/AdvancedBTCCrossChainOptionForm';
import ConfirmForm from 'components/CrossChain/CrossChainTransForm/ConfirmForm/CrossBTCConfirmForm';
import { getFullChainName, getBalanceByAddr, checkAmountUnit, formatAmount, btcCoinSelect, getNormalPathFromUtxos, getValueByAddrInfo, getValueByNameInfo, getCrossChainContractData } from 'utils/helper';

const Confirm = Form.create({ name: 'CrossBTCConfirmForm' })(ConfirmForm);
const AdvancedOptionForm = Form.create({ name: 'AdvancedBTCCrossChainOptionForm' })(OptionForm);
const AdvancedOutboundOptionForm = Form.create({ name: 'AdvancedBTCCrossChainOptionForm' })(outboundOptionForm);

@inject(stores => ({
  utxos: stores.btcAddress.utxos,
  settings: stores.session.settings,
  btcPath: stores.btcAddress.btcPath,
  addrInfo: stores.btcAddress.addrInfo,
  language: stores.languageIntl.language,
  btcFee: stores.sendCrossChainParams.btcFee,
  minCrossBTC: stores.sendCrossChainParams.minCrossBTC,
  currentTokenPairInfo: stores.crossChain.currentTokenPairInfo,
  coinPriceObj: stores.portfolio.coinPriceObj,
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
    this.state = {
      fee: 0,
      confirmVisible: false,
      advancedVisible: false,
      feeRate: 0
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
    form.validateFields((err, { pwd, amount: sendAmount, to }) => {
      if (err) {
        console.log('handleNext:', err);
        return;
      };
      let origAddrAmount, destAddrAmount, origAddrFee, destAddrFee;
      let otherAddrInfo = Object.assign({}, getChainAddressInfoByChain(info.toChainSymbol));
      to = getValueByNameInfo(to, 'address', direction === INBOUND ? otherAddrInfo : addrInfo);
      if (direction === INBOUND) {
        origAddrAmount = balance;
        destAddrAmount = getBalanceByAddr(to, otherAddrInfo);
        origAddrFee = this.state.fee;
        destAddrFee = estimateFee.destination;
        if (isExceedBalance(origAddrAmount, origAddrFee, sendAmount) || isExceedBalance(destAddrAmount, destAddrFee)) {
          message.warn(intl.get('CrossChainTransForm.overBalance'));
          return;
        }
      } else {
        origAddrAmount = getBalanceByAddr(from, otherAddrInfo);
        destAddrAmount = getBalanceByAddr(to, addrInfo);
        origAddrFee = estimateFee.originalFee;
        destAddrFee = this.state.fee;
        if (isExceedBalance(origAddrAmount, origAddrFee) || isExceedBalance(balance, sendAmount) || isExceedBalance(destAddrAmount, destAddrFee)) {
          message.warn(intl.get('CrossChainTransForm.overBalance'));
          return;
        }
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
            if (direction === INBOUND) {
              updateBTCTransParams({ to: { walletID: 1, path: getPathPrefix(info.toChainSymbol) + otherAddrInfo.normal[to].path }, toAddr: to, value: formatAmount(sendAmount) });
            } else {
              updateTransParams(from, { to: { walletID: 1, path: btcPath + addrInfo.normal[to].path }, toAddr: to, amount: formatAmount(sendAmount) });
            }
            this.setState({ confirmVisible: true });
          }
        })
      } else {
        if (direction === INBOUND) {
          updateBTCTransParams({ to: { walletID: 1, path: getPathPrefix(info.toChainSymbol) + otherAddrInfo.normal[to].path }, toAddr: to, value: formatAmount(sendAmount) });
        } else {
          updateTransParams(from, { to: { walletID: 1, path: btcPath + addrInfo.normal[to].path }, toAddr: to, amount: formatAmount(sendAmount) });
        }
        this.setState({ confirmVisible: true });
      }
    });
  }

  sendTrans = () => {
    this.props.onSend(this.props.from);
  }

  checkAmount = async (rule, value, callback) => {
    const { addrInfo, btcPath, updateBTCTransParams, minCrossBTC, direction, btcFee, balance, BTCCrossTransParams: transParams, currTokenPairId: tokenPairID, currentTokenPairInfo: info } = this.props;
    if (new BigNumber(value).gte(minCrossBTC)) {
      if (checkAmountUnit(8, value)) {
        if (direction === INBOUND) {
          let from = Object.keys(addrInfo.normal).map(key => ({
            path: `${btcPath}${addrInfo.normal[key].path}`,
            walletID: 1
          }));
          updateBTCTransParams({ from });
          try {
            let getFee = await this.getFee(from, value);
            if (getFee.code === false) {
              callback(intl.get('CrossChainTransForm.overBalance'));
              return;
            }
            let fee = formatNumByDecimals(getFee.result.fee, 8);
            this.setState({ fee });
            if (isExceedBalance(balance, fee, value)) {
              callback(intl.get('CrossChainTransForm.overBalance'));
              return;
            }
            callback();
          } catch (e) {
            console.log('get Fee error:', e);
            callback(intl.get('CrossChainTransForm.overBalance'));
          }
        } else {
          if (isExceedBalance(balance, value)) {
            callback(intl.get('CrossChainTransForm.overBalance'));
            return;
          }
          this.setState({ fee: btcFee });
          callback();
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
    const { direction, BTCCrossTransParams: transParams, currTokenPairId: tokenPairID, currentTokenPairInfo: info, getPathPrefix, getChainAddressInfoByChain, form, addrInfo } = this.props;
    let otherAddrInfo = getChainAddressInfoByChain(info.toChainSymbol)
    let to = getValueByNameInfo(form.getFieldsValue(['to']).to, 'address', direction === INBOUND ? otherAddrInfo : addrInfo);
    let input = {
      from,
      tokenPairID,
      value,
      feeRate: transParams.feeRate,
      changeAddress: transParams.changeAddress,
      storeman: transParams.storeman,
      to: {
        walletID: 1,
        path: getPathPrefix(info.toChainSymbol) + otherAddrInfo.normal[to].path
      }
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

  updateLockAccounts = (storeman) => {
    let { updateBTCTransParams } = this.props;
    updateBTCTransParams({ storeman });
  }

  filterStoremanData = item => {
    return item.groupId;
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
    form.setFieldsValue({
      amount: form.getFieldValue('amount')
    });
    form.validateFields(['amount']);
  }

  handleOutBoundSaveOption = (gasPrice, gasLimit) => {
    this.props.updateBTCTransParams({ gasPrice, gasLimit });
    this.setState({
      advancedVisible: false,
    });
  }

  render() {
    const { loading, form, from, settings, smgList, estimateFee, direction, addrInfo, balance, currentTokenPairInfo: info, getChainAddressInfoByChain, coinPriceObj } = this.props;
    const { advancedVisible, feeRate } = this.state;
    let gasFee, operationFee, totalFee, desChain, selectedList, defaultSelectStoreman, title, toAccountList, unit;
    let otherAddrInfo = getChainAddressInfoByChain(info.toChainSymbol);
    if (direction === INBOUND) {
      desChain = info.toChainSymbol;
      toAccountList = otherAddrInfo;
      selectedList = Object.keys(otherAddrInfo.normal);
      title = `${info.fromTokenSymbol}@${info.fromChainName} -> ${info.toTokenSymbol}@${info.toChainName}`;

      // Convert the value of fee to USD
      if ((typeof coinPriceObj === 'object') && info.fromChainSymbol in coinPriceObj && info.toChainSymbol in coinPriceObj) {
        totalFee = `${new BigNumber(this.state.fee).times(coinPriceObj[info.fromChainSymbol]).plus(BigNumber(estimateFee.destination).times(coinPriceObj[info.toChainSymbol])).toString()} USD`;
      } else {
        totalFee = `${this.state.fee} ${info.fromChainSymbol} + ${estimateFee.destination} ${info.toChainSymbol}`;
      }
      gasFee = `${this.state.fee} ${info.fromChainSymbol} + ${estimateFee.destination} ${info.toChainSymbol}`;
    } else {
      desChain = info.fromChainSymbol;
      toAccountList = addrInfo;
      selectedList = Object.keys(addrInfo.normal);
      title = `${info.toTokenSymbol}@${info.toChainName} -> ${info.fromTokenSymbol}@${info.fromChainName}`;

      // Convert the value of fee to USD
      if ((typeof coinPriceObj === 'object') && info.fromChainSymbol in coinPriceObj && info.toChainSymbol in coinPriceObj) {
        totalFee = `${new BigNumber(estimateFee.original).times(coinPriceObj[info.toChainSymbol]).plus(BigNumber(this.state.fee).times(coinPriceObj[info.fromChainSymbol])).toString()} USD`;
      } else {
        totalFee = `${estimateFee.original} ${info.toChainSymbol} + ${this.state.fee} ${info.fromChainSymbol}`;
      }
      gasFee = `${removeRedundantDecimal(estimateFee.original)} ${info.toChainSymbol}`;
      operationFee = `${removeRedundantDecimal(this.state.fee)} ${info.fromChainSymbol}`;
    }

    if (smgList.length === 0) {
      defaultSelectStoreman = '';
    } else {
      if (direction === INBOUND) {
        unit = info.fromTokenSymbol;
      } else {
        unit = info.toTokenSymbol;
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
                options={{ initialValue: totalFee }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('CrossChainTransForm.estimateFee')}
                suffix={<Tooltip title={
                  <table className={style['suffix_table']}>
                    <tbody>
                      <tr><td>{intl.get('CrossChainTransForm.gasFee')}:</td><td>{gasFee}</td></tr>
                      {direction === OUTBOUND && (<tr><td>{intl.get('CrossChainTransForm.operationFee')}:</td><td>{operationFee}</td></tr>)}
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
              {
                direction === OUTBOUND && (<Checkbox onChange={this.sendAllAmount} style={{ padding: '0px 20px' }}>{intl.get('NormalTransForm.sendAll')}</Checkbox>)
              }
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

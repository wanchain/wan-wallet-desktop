import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message, Spin, Checkbox, Tooltip } from 'antd';
import style from './index.less';
import PwdForm from 'componentUtils/PwdForm';
import SelectForm from 'componentUtils/SelectForm';
import { isExceedBalance, formatNumByDecimals, removeRedundantDecimal } from 'utils/support';
import CommonFormItem from 'componentUtils/CommonFormItem';
import { INBOUND, OUTBOUND } from 'utils/settings';
import ConfirmForm from 'components/CrossChain/CrossChainTransForm/ConfirmForm/CrossBTCConfirmForm';
import { getFullChainName, getBalanceByAddr, checkAmountUnit, formatAmount, btcCoinSelect, getNormalPathFromUtxos, getValueByAddrInfo, getValueByNameInfo } from 'utils/helper';

const Confirm = Form.create({ name: 'CrossBTCConfirmForm' })(ConfirmForm);

@inject(stores => ({
  utxos: stores.btcAddress.utxos,
  settings: stores.session.settings,
  btcPath: stores.btcAddress.btcPath,
  addrInfo: stores.btcAddress.addrInfo,
  language: stores.languageIntl.language,
  btcFee: stores.sendCrossChainParams.btcFee,
  minCrossBTC: stores.sendCrossChainParams.minCrossBTC,
  transParams: stores.sendCrossChainParams.transParams,
  currentTokenPairInfo: stores.crossChain.currentTokenPairInfo,
  coinPriceObj: stores.portfolio.coinPriceObj,
  updateBTCTransParams: paramsObj => stores.sendCrossChainParams.updateBTCTransParams(paramsObj),
  getChainAddressInfoByChain: chain => stores.tokens.getChainAddressInfoByChain(chain),
  getPathPrefix: chain => stores.tokens.getPathPrefix(chain),
}))

@observer
class CrossBTCForm extends Component {
  state = {
    fee: 0,
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

  handleNext = () => {
    const { updateBTCTransParams, addrInfo, settings, estimateFee, form, direction, balance, from, btcPath, smgList, currentTokenPairInfo: info, getChainAddressInfoByChain, getPathPrefix } = this.props;
    form.validateFields(err => {
      if (err) {
        console.log('handleNext:', err);
        return;
      };
      let origAddrAmount, destAddrAmount, origAddrFee, destAddrFee;
      let { pwd, amount: sendAmount, to } = form.getFieldsValue(['pwd', 'amount', 'to']);
      let wanAddrInfo = Object.assign({}, getChainAddressInfoByChain(info.toChainSymbol));
      to = getValueByNameInfo(to, 'address', direction === INBOUND ? wanAddrInfo : addrInfo);

      if (direction === INBOUND) {
        origAddrAmount = balance;
        destAddrAmount = getBalanceByAddr(to, wanAddrInfo);
        origAddrFee = this.state.fee;
        destAddrFee = estimateFee.destination;
        if (isExceedBalance(origAddrAmount, origAddrFee, sendAmount) || isExceedBalance(destAddrAmount, destAddrFee)) {
          message.warn(intl.get('CrossChainTransForm.overBalance'));
          return;
        }
      } else {
        origAddrAmount = getBalanceByAddr(from, wanAddrInfo);
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
              updateBTCTransParams({ wanAddress: { walletID: 1, path: getPathPrefix(info.toChainSymbol) + wanAddrInfo.normal[to].path }, toAddr: to, value: formatAmount(sendAmount) });
            } else {
              updateBTCTransParams({ crossAddr: { walletID: 1, path: btcPath + addrInfo.normal[to].path }, toAddr: to, amount: formatAmount(sendAmount) });
            }
            this.setState({ confirmVisible: true });
          }
        })
      } else {
        if (direction === INBOUND) {
          updateBTCTransParams({ wanAddress: { walletID: 1, path: getPathPrefix(info.toChainSymbol) + wanAddrInfo.normal[to].path }, toAddr: to, value: formatAmount(sendAmount) });
        } else {
          updateBTCTransParams({ crossAddr: { walletID: 1, path: btcPath + addrInfo.normal[to].path }, toAddr: to, amount: formatAmount(sendAmount) });
        }
        this.setState({ confirmVisible: true });
      }
    });
  }

  checkAmount = (rule, value, callback) => {
    const { utxos, addrInfo, btcPath, updateBTCTransParams, minCrossBTC, form, direction, btcFee, balance } = this.props;
    let { quota } = form.getFieldsValue(['quota']);
    if (new BigNumber(value).gte(minCrossBTC)) {
      if (checkAmountUnit(8, value)) {
        if (direction === INBOUND) {
          btcCoinSelect(utxos, value).then(data => {
            let fee = formatNumByDecimals(data.fee, 8);
            this.setState({ fee });
            if (isExceedBalance(balance, fee, value)) {
              callback(intl.get('CrossChainTransForm.overBalance'));
              return;
            }
            if (isExceedBalance(quota.split(' ')[0], value)) {
              callback(intl.get('CrossChainTransForm.overQuota'));
              return;
            }
            let from = getNormalPathFromUtxos(data.inputs, addrInfo, btcPath);
            if (from.length === 0) {
              callback(intl.get('CrossChainTransForm.overBalance'));
              return;
            }
            updateBTCTransParams({ from });
            callback();
          }).catch(() => {
            callback(intl.get('CrossChainTransForm.overBalance'));
          });
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

  updateLockAccounts = (storeman, option) => {
    let { form, updateBTCTransParams, smgList, direction, currentTokenPairInfo: info } = this.props;

    if (direction === INBOUND) {
      form.setFieldsValue({
        capacity: formatNumByDecimals(smgList[option.key].quota, 8) + ` ${info.fromTokenSymbol}`,
        quota: formatNumByDecimals(smgList[option.key].inboundQuota, 8) + ` ${info.fromTokenSymbol}`,
      });
    } else {
      form.setFieldsValue({
        quota: formatNumByDecimals(smgList[option.key].outboundQuota, 8) + ` ${info.toTokenSymbol}`,
      });
    }
    let smg = smgList[option.key];
    updateBTCTransParams({ btcAddress: smg.btcAddress, changeAddress: storeman, storeman: smg[`${info.toChainSymbol.toLowerCase()}Address`], feeRate: smg.txFeeRatio, smgBtcAddr: smg.smgBtcAddr });
  }

  filterStoremanData = item => {
    let { currentTokenPairInfo } = this.props;
    return item[this.props.direction === INBOUND ? 'btcAddress' : `${currentTokenPairInfo.toChainSymbol.toLowerCase()}Address`];
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

  render() {
    const { loading, form, from, settings, smgList, estimateFee, direction, addrInfo, balance, currentTokenPairInfo: info, getChainAddressInfoByChain, coinPriceObj } = this.props;
    let gasFee, operationFee, totalFee, desChain, selectedList, defaultSelectStoreman, capacity, quota, title, toAccountList, unit;
    let wanAddrInfo = getChainAddressInfoByChain(info.toChainSymbol);
    if (direction === INBOUND) {
      desChain = info.toChainSymbol;
      toAccountList = wanAddrInfo;
      selectedList = Object.keys(wanAddrInfo.normal);
      title = `${info.fromTokenSymbol}@${info.fromChainName} -> ${info.toTokenSymbol}@${info.toChainName}`;
      // totalFee = `${this.state.fee} ${info.fromChainSymbol} + ${estimateFee.destination} ${info.toChainSymbol}`;

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
      capacity = quota = 0;
    } else {
      if (direction === INBOUND) {
        defaultSelectStoreman = smgList[0].btcAddress;
        capacity = formatNumByDecimals(smgList[0].quota, 8);
        quota = formatNumByDecimals(smgList[0].inboundQuota, 8);
        unit = info.fromTokenSymbol;
      } else {
        defaultSelectStoreman = smgList[0][`${info.toChainSymbol.toLowerCase()}Address`];
        quota = formatNumByDecimals(smgList[0].outboundQuota, 8);
        unit = info.toTokenSymbol;
      }
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
          <Spin spinning={this.props.spin} size="large" /* tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} */ className="loadingData">
            <div className="validator-bg">
              {
                direction !== INBOUND &&
                <CommonFormItem
                  form={form}
                  colSpan={6}
                  formName='from'
                  disabled={true}
                  options={{ initialValue: getValueByAddrInfo(from, 'name', wanAddrInfo) }}
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
                selectedList={smgList}
                filterItem={this.filterStoremanData}
                handleChange={this.updateLockAccounts}
                formMessage={intl.get('Common.storemanGroup')}
              />
              {
                direction === INBOUND &&
                <CommonFormItem
                  form={form}
                  colSpan={6}
                  formName='capacity'
                  disabled={true}
                  options={{ initialValue: `${capacity} ${unit}` }}
                  prefix={<Icon type="credit-card" className="colorInput" />}
                  title={intl.get('CrossChainTransForm.capacity')}
                />
              }
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
            </div>
          </Spin>
        </Modal>
        <Confirm chainType="BTC" direction={direction} totalFeeTitle={totalFee} visible={this.state.confirmVisible} handleCancel={this.handleConfirmCancel} sendTrans={this.props.onSend} from={from} loading={loading} />
      </div>
    );
  }
}

export default CrossBTCForm;

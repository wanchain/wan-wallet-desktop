import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message, Spin, Checkbox } from 'antd';
import style from './index.less';
import PwdForm from 'componentUtils/PwdForm';
import SelectForm from 'componentUtils/SelectForm';
import { isExceedBalance, formatNumByDecimals } from 'utils/support';
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
      let chian = info.toChainSymbol;
      let toAddrInfo = Object.assign({}, getChainAddressInfoByChain(chian));
      to = getValueByNameInfo(to, 'address', direction === INBOUND ? toAddrInfo : addrInfo);

      if (direction === INBOUND) {
        origAddrAmount = balance;
        destAddrAmount = getBalanceByAddr(to, toAddrInfo);
        origAddrFee = this.state.fee;
        destAddrFee = estimateFee.destination;
        if (isExceedBalance(origAddrAmount, origAddrFee, sendAmount) || isExceedBalance(destAddrAmount, destAddrFee)) {
          message.warn(intl.get('CrossChainTransForm.overBalance'));
          return;
        }
      } else {
        origAddrAmount = getBalanceByAddr(from, toAddrInfo);
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
              updateBTCTransParams({ wanAddress: { walletID: 1, path: getPathPrefix(info.toChainSymbol) + toAddrInfo.normal[to].path }, toAddr: to, value: formatAmount(sendAmount) });
            } else {
              updateBTCTransParams({ crossAddr: { walletID: 1, path: btcPath + addrInfo.normal[to].path }, toAddr: to, amount: formatAmount(sendAmount) });
            }
            this.setState({ confirmVisible: true });
          }
        })
      } else {
        if (direction === INBOUND) {
          updateBTCTransParams({ wanAddress: { walletID: 1, path: getPathPrefix(info.toChainSymbol) + toAddrInfo.normal[to].path }, toAddr: to, value: formatAmount(sendAmount) });
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
    let { form, updateBTCTransParams, smgList, direction, currentTokenPairInfo } = this.props;

    if (direction === INBOUND) {
      form.setFieldsValue({
        capacity: formatNumByDecimals(smgList[option.key].quota, 8) + ' BTC',
        quota: formatNumByDecimals(smgList[option.key].inboundQuota, 8) + ' BTC',
      });
    } else {
      form.setFieldsValue({
        quota: formatNumByDecimals(smgList[option.key].outboundQuota, 8) + ' BTC',
      });
    }
    let smg = smgList[option.key];
    updateBTCTransParams({ btcAddress: smg.btcAddress, changeAddress: storeman, storeman: smg[`${currentTokenPairInfo.toChainSymbol.toLowerCase()}Address`], feeRate: smg.txFeeRatio, smgBtcAddr: smg.smgBtcAddr });
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
    const { loading, form, from, settings, smgList, estimateFee, direction, addrInfo, balance, currentTokenPairInfo, getChainAddressInfoByChain } = this.props;
    let totalFeeTitle, desChain, selectedList, defaultSelectStoreman, capacity, quota, title, toAccountList, unit;
    let info = currentTokenPairInfo;
    let toAddrInfo = getChainAddressInfoByChain(currentTokenPairInfo.toChainSymbol);
    if (direction === INBOUND) {
      desChain = info.toChainSymbol;
      toAccountList = toAddrInfo;
      selectedList = Object.keys(toAddrInfo.normal);
      title = `${info.fromTokenSymbol}@${info.fromChainName} -> ${info.toTokenSymbol}@${info.toChainName}`;
      totalFeeTitle = `${this.state.fee} ${currentTokenPairInfo.fromChainSymbol} + ${estimateFee.destination} ${currentTokenPairInfo.toChainSymbol}`;
    } else {
      desChain = info.fromChainSymbol;
      toAccountList = addrInfo;
      selectedList = Object.keys(addrInfo.normal);
      title = `${info.toTokenSymbol}@${info.toChainName} -> ${info.fromTokenSymbol}@${info.fromChainName}`;
      totalFeeTitle = `${estimateFee.original} ${currentTokenPairInfo.toChainSymbol} + ${this.state.fee} ${currentTokenPairInfo.fromChainSymbol}`;
    }

    if (smgList.length === 0) {
      defaultSelectStoreman = '';
      capacity = quota = 0;
    } else {
      if (direction === INBOUND) {
        defaultSelectStoreman = smgList[0].btcAddress;
        capacity = formatNumByDecimals(smgList[0].quota, 8);
        quota = formatNumByDecimals(smgList[0].inboundQuota, 8);
        unit = currentTokenPairInfo.fromTokenSymbol;
      } else {
        defaultSelectStoreman = smgList[0][`${currentTokenPairInfo.toChainSymbol.toLowerCase()}Address`];
        quota = formatNumByDecimals(smgList[0].outboundQuota, 8);
        unit = currentTokenPairInfo.toTokenSymbol;
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
                  options={{ initialValue: getValueByAddrInfo(from, 'name', toAddrInfo) }}
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
                formMessage={intl.get('Common.storeman')}
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
                options={{ initialValue: totalFeeTitle }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('CrossChainTransForm.estimateFee')}
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
        <Confirm chainType="BTC" direction={direction} totalFeeTitle={totalFeeTitle} visible={this.state.confirmVisible} handleCancel={this.handleConfirmCancel} sendTrans={this.props.onSend} from={from} loading={loading} />
      </div>
    );
  }
}

export default CrossBTCForm;

import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message, Spin } from 'antd';

import style from './index.less';
import PwdForm from 'componentUtils/PwdForm';
import SelectForm from 'componentUtils/SelectForm';
import { isExceedBalance, formatNumByDecimals } from 'utils/support';
import CommonFormItem from 'componentUtils/CommonFormItem';
import { CHAINNAME, BTCPATH, WANPATH, INBOUND } from 'utils/settings';
import ConfirmForm from 'components/CrossChain/CrossChainTransForm/ConfirmForm/CrossBTCConfirmForm';
import { getBalanceByAddr, checkAmountUnit, formatAmount, btcCoinSelect, getPathFromUtxos } from 'utils/helper';

const Confirm = Form.create({ name: 'CrossBTCConfirmForm' })(ConfirmForm);

@inject(stores => ({
  utxos: stores.btcAddress.utxos,
  settings: stores.session.settings,
  btcPath: stores.btcAddress.btcPath,
  addrInfo: stores.btcAddress.addrInfo,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  getAmount: stores.btcAddress.getNormalAmount,
  from: stores.sendCrossChainParams.currentFrom,
  minCrossBTC: stores.sendCrossChainParams.minCrossBTC,
  transParams: stores.sendCrossChainParams.transParams,
  updateBTCTransParams: paramsObj => stores.sendCrossChainParams.updateBTCTransParams(paramsObj)
}))

@observer
class CrossBTCForm extends Component {
  state = {
    fee: 0,
    confirmVisible: false,
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

  handleNext = () => {
    const { updateBTCTransParams, addrInfo, settings, estimateFee, form, from, direction, wanAddrInfo, getAmount } = this.props;
    form.validateFields(err => {
      if (err) {
        console.log('handleNext:', err);
        return;
      };
      let origAddrAmount, destAddrAmount, origAddrFee, destAddrFee;
      let { pwd, amount: sendAmount, to } = form.getFieldsValue(['pwd', 'amount', 'to']);

      if (direction === INBOUND) {
        origAddrAmount = getAmount;
        destAddrAmount = getBalanceByAddr(to, wanAddrInfo);
        origAddrFee = this.state.fee;
        destAddrFee = estimateFee.destination;
      } else {
        origAddrAmount = getBalanceByAddr(from, wanAddrInfo);
        destAddrAmount = getAmount;
        origAddrFee = estimateFee.originalFee;
        destAddrFee = this.state.fee;
      }

      if (isExceedBalance(origAddrAmount, origAddrFee, sendAmount) || isExceedBalance(destAddrAmount, destAddrFee, 0)) {
        message.warn(intl.get('CrossChainTransForm.overBalance'));
        return;
      }

      let path = direction === INBOUND ? WANPATH + wanAddrInfo.normal[to].path : BTCPATH + addrInfo.normal[to].path;
      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_reveal', { pwd: pwd }, (err) => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            updateBTCTransParams({ wanAddress: { walletID: 1, path }, toAddr: to, value: formatAmount(sendAmount) });
            this.setState({ confirmVisible: true });
          }
        })
      } else {
        updateBTCTransParams({ wanAddress: { walletID: 1, path }, toAddr: to, value: formatAmount(sendAmount) });
        this.setState({ confirmVisible: true });
      }
    });
  }

  checkAmount = (rule, value, callback) => {
    const { utxos, addrInfo, btcPath, updateBTCTransParams, minCrossBTC } = this.props;

    if (new BigNumber(value).gte(minCrossBTC) && checkAmountUnit(8, value)) {
      btcCoinSelect(utxos, value).then(data => {
        updateBTCTransParams({ from: getPathFromUtxos(data.inputs, addrInfo, btcPath) });
        this.setState({
          fee: formatNumByDecimals(data.fee, 8)
        })
        callback();
      }).catch(() => {
        callback(intl.get('NormalTransForm.invalidAmount'));
      });
    } else {
      let message = intl.get('CrossChainTransForm.invalidAmount') + minCrossBTC;
      callback(message);
    }
  }

  updateLockAccounts = (storeman, option) => {
    let { form, updateBTCTransParams, smgList, direction } = this.props;

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
    updateBTCTransParams({ btcAddress: smg.btcAddress, changeAddress: storeman, storeman: smg.wanAddress, feeRate: smg.txFeeRatio, smgBtcAddr: smg.smgBtcAddr });
  }

  filterStoremanData = item => {
    return item[this.props.direction === INBOUND ? 'btcAddress' : 'wanAddress'];
  }

  render () {
    const { loading, form, from, settings, smgList, wanAddrInfo, estimateFee, direction, addrInfo, symbol, getAmount } = this.props;
    let totalFeeTitle, desChain, selectedList, defaultSelectStoreman, capacity, quota, title;

    if (direction === INBOUND) {
      desChain = 'WAN';
      selectedList = Object.keys(wanAddrInfo.normal);
      title = symbol ? `${symbol} TO W${symbol}` : 'BTC TO WBTC';
      totalFeeTitle = `${this.state.fee} btc + ${estimateFee.destination} wan`;
    } else {
      desChain = 'BTC';
      selectedList = Object.keys(addrInfo.normal);
      title = symbol ? `W${symbol} TO ${symbol}` : 'WBTC TO BTC';
      totalFeeTitle = `${estimateFee.original} wan + ${this.state.fee} btc`;
    }

    if (smgList.length === 0) {
      defaultSelectStoreman = '';
      capacity = quota = 0;
    } else {
      if (direction === INBOUND) {
        defaultSelectStoreman = smgList[0].btcAddress;
        capacity = formatNumByDecimals(smgList[0].quota, 8)
        quota = formatNumByDecimals(smgList[0].inboundQuota, 8)
      } else {
        defaultSelectStoreman = smgList[0].wanAddress;
        quota = formatNumByDecimals(smgList[0].outboundQuota, 8);
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
            <Button key="back" className="cancel" onClick={this.props.onCancel}>{intl.get('NormalTransForm.cancel')}</Button>,
            <Button disabled={this.props.spin} key="submit" type="primary" onClick={this.handleNext}>{intl.get('NormalTransForm.next')}</Button>,
          ]}
        >
          <Spin spinning={this.props.spin} tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} className="loadingData">
            <div className="validator-bg">
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='balance'
                disabled={true}
                options={{ initialValue: getAmount + ' BTC' }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('StakeInForm.balance')}
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
                direction === INBOUND &&
                <CommonFormItem
                  form={form}
                  colSpan={6}
                  formName='capacity'
                  disabled={true}
                  options={{ initialValue: capacity + ' BTC' }}
                  prefix={<Icon type="credit-card" className="colorInput" />}
                  title={intl.get('CrossChainTransForm.capacity')}
                />
              }
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='quota'
                disabled={true}
                options={{ initialValue: quota + ' BTC' }}
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
                options={{ initialValue: 0, rules: [{ required: true, validator: this.checkAmount }] }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('Common.amount') + direction === INBOUND ? ' BTC' : ' WBTC'}
              />
              {settings.reinput_pwd && <PwdForm form={form} colSpan={6}/>}
            </div>
          </Spin>
        </Modal>
        <Confirm chainType="BTC" direction={direction} totalFeeTitle={totalFeeTitle} visible={this.state.confirmVisible} handleCancel={this.handleConfirmCancel} sendTrans={this.props.onSend} from={from} loading={loading}/>
      </div>
    );
  }
}

export default CrossBTCForm;

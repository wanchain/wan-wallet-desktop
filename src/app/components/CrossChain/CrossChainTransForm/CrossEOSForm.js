import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message, Spin, Checkbox } from 'antd';
import style from './index.less';
import PwdForm from 'componentUtils/PwdForm';
import SelectForm from 'componentUtils/SelectForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import { WANPATH, PENALTYNUM, INBOUND } from 'utils/settings';
import ConfirmForm from 'components/CrossChain/CrossChainTransForm/ConfirmForm/CrossEOSConfirmForm';
import { isExceedBalance, formatNumByDecimals } from 'utils/support';
import { getFullChainName, checkAmountUnit, formatAmount, getAddrInfoByTypes, getBalanceByAddr } from 'utils/helper';

const Confirm = Form.create({ name: 'CrossEOSConfirmForm' })(ConfirmForm);

@inject(stores => ({
  settings: stores.session.settings,
  addrInfo: stores.eosAddress.accountInfo,
  getNormalAccountListWithBalance: stores.eosAddress.getNormalAccountListWithBalance,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  from: stores.sendCrossChainParams.currentFrom,
  transParams: stores.sendCrossChainParams.transParams,
  currentTokenPairInfo: stores.crossChain.currentTokenPairInfo,
  updateTransParams: (addr, paramsObj) => stores.sendCrossChainParams.updateTransParams(addr, paramsObj),
  getChainAddressInfoByChain: chain => stores.tokens.getChainAddressInfoByChain(chain),
}))

@observer
class CrossEOSForm extends Component {
  state = {
    confirmVisible: false
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
    const { updateTransParams, addrInfo, settings, form, from, direction, wanAddrInfo, estimateFee, balance: origAddrAmount } = this.props;
    form.validateFields(err => {
      if (err) {
        console.log('handleNext:', err);
        return;
      };

      let { pwd, amount: sendAmount, to, totalFee } = form.getFieldsValue(['pwd', 'amount', 'to', 'totalFee']);
      let destAddrAmount = direction === INBOUND ? getAddrInfoByTypes(to, 'name', wanAddrInfo, 'balance') : addrInfo[to].balance;
      let path = direction === INBOUND ? WANPATH + getAddrInfoByTypes(to, 'name', wanAddrInfo, 'path') : addrInfo[to].path;
      let toAddress = direction === INBOUND ? getAddrInfoByTypes(to, 'name', wanAddrInfo, 'address') : to

      if (isExceedBalance(origAddrAmount, sendAmount) || isExceedBalance(destAddrAmount, direction === INBOUND ? estimateFee : 0)) {
        message.warn(intl.get('CrossChainTransForm.overBalance'));
        return;
      }
      if (direction !== INBOUND && isExceedBalance(getBalanceByAddr(from, wanAddrInfo), totalFee)) {
        message.warn(intl.get('CrossChainTransForm.overBalance'));
        return;
      }

      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_checkPwd', { pwd }, (err) => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            updateTransParams(from, { to: { walletID: 1, path, address: toAddress }, toAddr: to, amount: formatAmount(sendAmount) });
            this.setState({ confirmVisible: true });
          }
        })
      } else {
        updateTransParams(from, { to: { walletID: 1, path, address: toAddress }, toAddr: to, amount: formatAmount(sendAmount) });
        this.setState({ confirmVisible: true });
      }
    });
  }

  sendTrans = () => {
    this.props.onSend(this.props.from);
  }

  checkAmount = (rule, value, callback) => {
    const { decimals, balance, direction, smgList, form, estimateFee } = this.props;
    if (new BigNumber(value).gt('0') && checkAmountUnit(decimals || 18, value)) {
      if (new BigNumber(value).gt(balance)) {
        callback(intl.get('CrossChainTransForm.overTransBalance'));
      } else {
        /* if (direction !== INBOUND) {
          let storemanAccount = form.getFieldValue('storemanAccount');
          let smg = smgList.find(item => item.storemanGroup.substr(0, 24) === storemanAccount.substr(0, 24));
          let newOriginalFee = new BigNumber(value).multipliedBy(smg.coin2WanRatio).multipliedBy(smg.txFeeRatio).dividedBy(PENALTYNUM).dividedBy(PENALTYNUM).plus(estimateFee).toString(); // Outbound: crosschain fee + gas fee
          form.setFieldsValue({
            totalFee: `${new BigNumber(newOriginalFee).plus(estimateFee)} WAN`,
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
      let amount = this.props.form.getFieldValue('amount');
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
    let { from, form, updateTransParams, smgList, direction, decimals, currentTokenPairInfo } = this.props;

    if (direction === INBOUND) {
      form.setFieldsValue({
        quota: formatNumByDecimals(smgList[option.key].inboundQuota, decimals) + ` ${currentTokenPairInfo.fromTokenSymbol}`,
        txFeeRatio: smgList[option.key].txFeeRatio / 100 + '%'
      });
    } else {
      form.setFieldsValue({
        quota: formatNumByDecimals(smgList[option.key].outboundQuota, decimals) + ` ${currentTokenPairInfo.toTokenSymbol}`
      });
    }

    updateTransParams(from, { storeman, txFeeRatio: smgList[option.key].txFeeRatio });
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
    const { loading, form, from, record, settings, smgList, direction, decimals, estimateFee, balance, getChainAddressInfoByChain, transParams, currentTokenPairInfo, addrInfo } = this.props;
    let srcChain, desChain, selectedList, title, txFeeRatio, quota, fromAccount, unit, totalFeeTitle;
    const info = Object.assign({}, currentTokenPairInfo);
    let txParam = transParams[from];

    if (direction === INBOUND) {
      fromAccount = record.address;
      srcChain = info.fromChainSymbol;
      desChain = info.toChainSymbol;
      let toAccountList = getChainAddressInfoByChain(info.toChainSymbol);
      selectedList = Object.keys(toAccountList.normal).map(key => toAccountList.normal[key].name);
      title = `${info.fromTokenSymbol}@${info.fromChainName} -> ${info.toTokenSymbol}@${info.toChainName}`;
      totalFeeTitle = `${estimateFee.original} ${info.fromChainSymbol} + ${estimateFee.destination} ${info.toChainSymbol}`;
      unit = info.fromTokenSymbol;
    } else {
      fromAccount = record.name;
      srcChain = info.toChainSymbol;
      desChain = info.fromChainSymbol;
      selectedList = Object.keys(addrInfo);
      title = `${info.toTokenSymbol}@${info.toChainName} -> ${info.fromTokenSymbol}@${info.fromChainName}`;
      totalFeeTitle = `${estimateFee.original} ${info.toChainSymbol} + ${estimateFee.destination} ${info.fromChainSymbol}`;
      unit = info.toTokenSymbol;
    }

    if (smgList.length === 0) {
      quota = 0;
      txFeeRatio = 0;
    } else {
      quota = formatNumByDecimals(txParam.quota, decimals);
      txFeeRatio = txParam.txFeeRatio / 100 + '%';
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
                options={{ initialValue: fromAccount }}
                prefix={<Icon type="wallet" className="colorInput" />}
                title={intl.get('Common.from') + ' (' + getFullChainName(srcChain) + ')'}
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
                initialValue={txParam.storeman}
                selectedList={smgList}
                filterItem={item => item.storemanGroup.replace(/^([a-zA-z0-9]{24})[a-zA-z0-9]{84}([a-zA-z0-9]{24})$/, '$1****$2')}
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
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='txFeeRatio'
                disabled={true}
                options={{ initialValue: txFeeRatio }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('CrossChainTransForm.txFeeRatio')}
              />
              <SelectForm
                form={form}
                colSpan={6}
                formName='to'
                initialValue={selectedList[0]}
                selectedList={selectedList}
                formMessage={intl.get('NormalTransForm.to') + ' (' + getFullChainName(desChain) + ')'}
              />
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='totalFee'
                disabled={true}
                options={{ initialValue: `${estimateFee} WAN` }}
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
              <Checkbox onChange={this.sendAllAmount} style={{ padding: '0px 20px' }}>{intl.get('NormalTransForm.sendAll')}</Checkbox>
              {settings.reinput_pwd && <PwdForm form={form} colSpan={6} />}
            </div>
          </Spin>
        </Modal>
        {
          this.state.confirmVisible && <Confirm tokenSymbol={unit} direction={direction} estimateFee={form.getFieldValue('totalFee')} visible={this.state.confirmVisible} handleCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading} />
        }
      </div>
    );
  }
}

export default CrossEOSForm;

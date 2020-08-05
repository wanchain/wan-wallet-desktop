import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, Select, message, Row, Col, Avatar } from 'antd';

import { toWei } from 'utils/support.js';
import PwdForm from 'componentUtils/PwdForm';
import { signTransaction } from 'componentUtils/trezor';
import { MAIN, TESTNET, WALLETID } from 'utils/settings';
import CommonFormItem from 'componentUtils/CommonFormItem';
import AddrSelectForm from 'componentUtils/AddrSelectForm';
import DelegationConfirmForm from './DelegationConfirmForm';
import style from 'components/Staking/DelegateInForm/index.less';
import { getNonce, getGasPrice, checkAmountUnit, getChainId, getContractAddr, getStoremanContractData, getValueByAddrInfo } from 'utils/helper';

const colSpan = 6;
const MINAMOUNT = 100;
const ACTION = 'delegateIn';
const pu = require('promisefy-util');
const Confirm = Form.create({ name: 'DelegationConfirmForm' })(DelegationConfirmForm);

@inject(stores => ({
  settings: stores.session.settings,
  chainId: stores.session.chainId,
  addrInfo: stores.wanAddress.addrInfo,
  addrSelectedList: stores.wanAddress.addrSelectedList,
  onlineValidatorList: stores.staking.onlineValidatorList,
  updateStakeInfo: () => stores.staking.updateStakeInfo(),
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
}))

@observer
class OsmDelegateInForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      confirmVisible: false,
      confirmLoading: false,
      loading: false,
      record: undefined,
      selectedChain: undefined,
      storemanInfo: undefined,
    }
  }

  getValueByAddrInfoArgs = (...args) => {
    return getValueByAddrInfo(...args, this.props.addrInfo);
  }

  onChangeAddrSelect = value => {
    this.props.form.setFieldsValue({
      balance: value ? this.getValueByAddrInfoArgs(value, 'balance') : 0
    })
  }

  onStoremanChange = storeman => {
    let { form, onlineValidatorList } = this.props;
    let storemanInfo = onlineValidatorList.find(i => i.name === storeman);
    let crosschain = storemanInfo ? storemanInfo.crosschain : undefined;
    form.setFieldsValue({
      storeman,
      crosschain,
      quota: storemanInfo ? storemanInfo.quota : '0',
      delegationFee: storemanInfo ? storemanInfo.feeRate : '0',
    });
    this.setState({ storemanInfo });
  }

  onCrossChainChange = crosschain => {
    this.props.form.setFieldsValue({ crosschain });
    this.setState({ crosschain });
  }

  checkAmount = (rule, value, callback) => {
    let valueStringPre = value.toString().slice(0, 4);
    let { quota, balance } = this.props.form.getFieldsValue(['quota', 'balance']);

    if (!checkAmountUnit(18, value)) {
      callback(intl.get('Common.invalidAmount'));
    }
    if (new BigNumber(value).lt('0.0001') || Math.floor(valueStringPre) < 100) {
      callback(intl.get('StakeInForm.stakeTooLow'));
      return;
    }
    if (new BigNumber(value).gt(balance)) {
      callback(intl.get('SendNormalTrans.overBalance'));
      return;
    }
    if (new BigNumber(value).gt(quota)) {
      callback(intl.get('StakeInForm.stakeExceed'));
      return;
    }

    callback();
  }

  showConfirmForm = () => {
    this.setState({ loading: true })
    let { form, settings } = this.props;
    form.validateFields(async (err) => {
      if (err) {
        this.setState({ loading: false });
        return;
      };

      let { myAddr: account, amount, pwd, delegationFee, crosschain, storeman } = form.getFieldsValue(['myAddr', 'amount', 'pwd', 'delegationFee', 'crosschain', 'storeman']);
      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          this.setState({ loading: false });
          return;
        }

        try {
          await pu.promisefy(wand.request, ['phrase_checkPwd', { pwd: pwd }], this);
        } catch (error) {
          message.warn(intl.get('Backup.invalidPassword'));
          this.setState({ loading: false });
          return;
        }
      }

      this.setState({
        loading: false,
        confirmVisible: true,
        record: { amount, account, wAddr: storeman, crosschain, delegationFee, }
      });
    })
  }

  onConfirmCancel = () => {
    this.setState({ confirmVisible: false, confirmLoading: false });
  }

  onSend = async () => {
    this.setState({ confirmLoading: true });
    let { form } = this.props;
    let { myAddr: from, amount } = form.getFieldsValue(['myAddr', 'amount']);
    let path = this.getValueByAddrInfoArgs(from, 'path');
    let walletID = from.indexOf(':') !== -1 ? WALLETID[from.split(':')[0].toUpperCase()] : WALLETID.NATIVE;

    let tx = {
      from,
      walletID,
      BIP44Path: path,
      amount: amount.toString(),
      wAddr: this.state.storemanInfo.wAddr,
    }

    if (walletID === WALLETID.LEDGER) {
      message.info(intl.get('Ledger.signTransactionInLedger'))
    }

    if (walletID === WALLETID.TREZOR) {
      await this.trezorDelegateIn(path, from, amount);
      this.setState({ confirmVisible: false });
      this.props.onSend(walletID);
    } else {
      wand.request('storeman_openStoremanAction', { tx, ACTION }, (err, ret) => {
        if (err) {
          message.warn(intl.get('ValidatorRegister.updateFailed'));
        } else {
          console.log('validatorModify ret:', ret);
        }
        this.setState({ confirmVisible: false, confirmLoading: false });
        this.props.onSend();
      });
    }
  }

  onClick = () => {
    let href = this.props.chainId === 1 ? `${MAIN}/vlds` : `${TESTNET}/vlds`;
    wand.shell.openExternal(href);
  }

  trezorDelegateIn = async (path, from, value) => {
    let { record } = this.state;
    try {
      let { chainId, nonce, gasPrice, data, to } = await Promise.all([getChainId(), getNonce(from, 'wan'), getGasPrice('wan'), getStoremanContractData(ACTION, record.wAddr, value), getContractAddr()])
      let rawTx = {
        to,
        from,
        data,
        chainId,
        Txtype: 1,
        value: toWei(value),
        nonce: '0x' + nonce.toString(16),
        gasPrice: toWei(gasPrice, 'gwei'),
        gasLimit: '0x' + Number(200000).toString(16),
      };
      let raw = await pu.promisefy(signTransaction, [path, rawTx], this);// Trezor sign

      let txHash = await pu.promisefy(wand.request, ['transaction_raw', { raw, chainType: 'WAN' }], this);

      console.log('Transaction Hash:', txHash);
      let params = {
        txHash,
        from: from.toLowerCase(),
        to: rawTx.to,
        value: rawTx.value,
        gasPrice: rawTx.gasPrice,
        gasLimit: rawTx.gasLimit,
        nonce: rawTx.nonce,
        srcSCAddrKey: 'WAN',
        srcChainType: 'WAN',
        tokenSymbol: 'WAN',
        status: 'Sending',
      }
      let satellite = {
        wAddr: record.wAddr,
        annotate: 'StoremanDelegateIn'
      };

      await pu.promisefy(wand.request, ['storeman_insertStoremanTransToDB', { tx: params, satellite }], this);
      this.props.updateStakeInfo();
      this.props.updateTransHistory();
    } catch (error) {
      console.log('Trezor validator append failed', error);
      message.error(intl.get('ValidatorRegister.topUpFailed'));
    }
  }

  render () {
    const { onlineValidatorList, form, settings, disabled, onCancel, addrSelectedList } = this.props;
    const { getFieldDecorator } = form;
    let showConfirmItem = { storeman: true, delegationFee: true, crosschain: true, account: true, amount: true };

    // TODO delete it
    let crosschainData = ['wan-btc', 'eth-wan', 'wan-eos']
    this.props.onlineValidatorList.forEach((i, index) => {
      index % 2 ? i.crosschain = 'wan-btc' : i.crosschain = 'eth-wan'
    })

    let storemanListSelect = onlineValidatorList.filter(i => {
      let crosschain = this.state.crosschain;
      return !crosschain || crosschain === i.crosschain;
    }).map(v => <div name={v.name}><Avatar src={v.icon} name={v.name} value={v.name} size="small" /> {v.name}</div>);

    let crosschainListSelect = crosschainData.filter(i => {
      let storemanInfo = this.state.storemanInfo;
      return !storemanInfo || storemanInfo.crosschain === i;
    })
    return (
      <div>
        <Modal visible destroyOnClose={true} closable={false} title={intl.get('StakeInForm.title')} onCancel={this.onCancel} className={style['stakein-modal']}
          footer={[
            <Button key="back" className="cancel" onClick={onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button loading={this.state.loading} key="submit" type="primary" onClick={this.showConfirmForm}>{intl.get('Common.next')}</Button>,
          ]}
        >
          <div className="validator-bg">
            <div className="stakein-title">Storeman's Account</div>
            <div className="validator-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={6}><span className="stakein-name">Cross Chain</span></Col>
                <Col span={18}>
                  <Form layout="inline" id="osmChainSelect">
                    <Form.Item>
                      {getFieldDecorator('crosschain', {
                        rules: [{ required: false }],
                      })(
                        <Select
                          disabled={disabled}
                          showArrow={!disabled}
                          showSearch
                          allowClear
                          style={{ width: 400 }}
                          placeholder="Select Cross Chain"
                          optionFilterProp="children"
                          onChange={this.onCrossChainChange}
                          getPopupContainer={() => document.getElementById('osmChainSelect')}
                        >
                          {crosschainListSelect.map((item, index) => <Select.Option value={item} key={index}>{item}</Select.Option>)}
                        </Select>
                      )}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>
            <div className="validator-line">
              <Row type="flex" justify="space-around" align="middle" className="storeman">
                <Col span={6}><span className="stakein-name">Storeman</span></Col>
                <Col span={15}>
                  <Form layout="inline" id="osmNameSelect">
                    <Form.Item>
                      {getFieldDecorator('storeman', {
                        rules: [{ required: false }],
                      })(
                        <Select
                          disabled={disabled}
                          showArrow={!disabled}
                          showSearch
                          allowClear
                          style={{ width: 400 }}
                          placeholder="Select Storeman Account"
                          optionFilterProp="children"
                          onChange={this.onStoremanChange}
                          getPopupContainer={() => document.getElementById('osmNameSelect')}
                        >
                          {storemanListSelect.map((item, index) => <Select.Option value={item.props.name} key={index}>{item}</Select.Option>)}
                        </Select>
                      )}
                    </Form.Item>
                  </Form>
                </Col>
                <Col span={3} align="right" className={style['col-stakein-info']}>
                  <a onClick={this.onClick}>{intl.get('StakeInForm.more')}</a>
                </Col>
              </Row>
            </div>
            <CommonFormItem form={form} formName='quota' disabled={true}
              options={{ initialValue: '0' }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title='Quota'
              colSpan={colSpan}
            />
            <CommonFormItem form={form} formName='delegationFee' disabled={true}
              options={{ initialValue: '0' }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title='Delegation Fee'
              colSpan={colSpan}
            />
          </div>
          <div className="validator-bg">
            <div className="stakein-title">{intl.get('ValidatorRegister.myAccount')}</div>
            <div className="validator-line">
              <AddrSelectForm form={form} colSpan={6} addrSelectedList={addrSelectedList} handleChange={this.onChangeAddrSelect} getValueByAddrInfoArgs={this.getValueByAddrInfoArgs} />
            </div>
            <CommonFormItem form={form} formName='balance' disabled={true}
              options={{ initialValue: '0' }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title={intl.get('ValidatorRegister.balance')}
              colSpan={colSpan}
            />
            <CommonFormItem form={form} formName='amount'
              options={{ initialValue: MINAMOUNT, rules: [{ required: true, validator: this.checkAmount }] }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title={intl.get('Common.amount')}
              colSpan={colSpan}
            />
            {settings.reinput_pwd && <PwdForm form={form} />}
          </div>
        </Modal>
        {
          this.state.confirmVisible &&
          <Confirm
            onSend={this.onSend}
            record={this.state.record}
            onCancel={this.onConfirmCancel}
            showConfirmItem={showConfirmItem}
            visible={this.state.confirmVisible}
            confirmLoading={this.state.confirmLoading}
            title={intl.get('NormalTransForm.ConfirmForm.transactionConfirm')}
          />
        }
      </div>
    );
  }
}

export default OsmDelegateInForm;

import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input, Icon, Select, InputNumber, message, Row, Col, Avatar } from 'antd';
import './index.less';
import { checkWanValidatorAddr } from 'utils/helper';
import StakeConfirmForm from '../StakeConfirmForm';
const Confirm = Form.create({ name: 'StakeConfirmForm' })(StakeConfirmForm);

import intl from 'react-intl-universal';
const wanTx = require('wanchainjs-tx');
import TrezorConnect from 'trezor-connect';
const pu = require('promisefy-util')
import { getNonce, getGasPrice, checkAmountUnit, getChainId, getContractAddr, getContractData } from 'utils/helper';
import { toWei } from 'utils/support.js';

const main = 'https://www.wanscan.org/vlds'
const testnet = 'http://testnet.wanscan.org/vlds';

const Option = Select.Option;

@inject(stores => ({
  settings: stores.session.settings,
  getAddrList: stores.wanAddress.getNormalAddrList,
  ledgerAddrList: stores.wanAddress.ledgerAddrList,
  trezorAddrList: stores.wanAddress.trezorAddrList,
  onlineValidatorList: stores.staking.onlineValidatorList,
  updateStakeInfo: () => stores.staking.updateStakeInfo(),
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
}))

@observer
class StakeInForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      balance: "0",
      addrList: [],
      confirmVisible: false,
      record: {
        validator: {},
        accountAddress: '',
        myStake: { title: '' },
      }
    }
  }

  componentWillMount() {
    const { getAddrList, ledgerAddrList, trezorAddrList } = this.props;
    let addrList = []
    getAddrList.forEach(addr => {
      addrList.push(
        addr.address
      )
    });

    ledgerAddrList.forEach(addr => {
      addrList.push(
        'Ledger: ' + addr.address
      )
    });

    trezorAddrList.forEach(addr => {
      addrList.push(
        'Trezor: ' + addr.address
      )
    });

    this.setState({ addrList: addrList })
  }

  componentDidMount() {
    if (this.props.record) {
      let { form } = this.props;
      form.setFieldsValue({ to: this.props.record.validator.address });

      let name = this.props.record.validator.name;
      // let validatorName = ((<div name={name}><Avatar src={this.props.record.validator.img} name={name} value={name} size="small" />{" "}{name}</div>))

      form.setFieldsValue({ validatorName: name });

      let quota = this.getQuota(this.props.record.validator.address);
      form.setFieldsValue({ quota: quota})
      form.setFieldsValue({ commission: this.getFeeRate(this.props.record.validator.address) })


      let from = this.props.record.accountAddress;

      const { ledgerAddrList, trezorAddrList } = this.props;

      for (let i = 0; i < ledgerAddrList.length; i++) {
        const hdAddr = ledgerAddrList[i].address;
        if (hdAddr.toLowerCase() == from.toLowerCase()) {
          from = 'Ledger: ' + from;
          break;
        }
      }

      for (let i = 0; i < trezorAddrList.length; i++) {
        const hdAddr = trezorAddrList[i].address;
        if (hdAddr.toLowerCase() == from.toLowerCase()) {
          from = 'Trezor: ' + from;
          break;
        }
      }

      form.setFieldsValue({ from: from });
      this.onChange(from);
    }
  }

  componentDidUpdate() {

  }

  componentWillUnmount() {

  }

  onValidatorChange = value => {
    let { form } = this.props;
    let addr = this.getAddr(value);
    form.setFieldsValue({ to: addr });
    form.setFieldsValue({ validatorName: value });
    form.setFieldsValue({ quota: this.getQuota(addr) });
    form.setFieldsValue({ commission: this.getFeeRate(addr) })

    this.validator = value;
  }

  getBalance = (value) => {
    const { getAddrList, ledgerAddrList, trezorAddrList } = this.props;
    if (!value) {
      return
    }

    if (value.includes('Ledger')) {
      for (let i = 0; i < ledgerAddrList.length; i++) {
        const element = ledgerAddrList[i];
        value = value.replace('Ledger: ', '')
        if (element.address == value) {
          return element.balance;
        }
      }
      return;
    }

    if (value.includes('Trezor')) {
      for (let i = 0; i < trezorAddrList.length; i++) {
        const element = trezorAddrList[i];
        value = value.replace('Trezor: ', '')
        if (element.address == value) {
          return element.balance;
        }
      }
      return;
    }

    for (let i = 0; i < getAddrList.length; i++) {
      const element = getAddrList[i];
      if (element.address == value) {
        return element.balance;
      }
    }
  }

  onChange = value => {
    if (!value) {
      return
    }

    //this.props.form.setFieldsValue({from: 'hello'});

    this.setState({
      balance: this.getBalance(value),
    })
  }


  checkToWanAddr = (rule, value, callback) => {
    checkWanValidatorAddr(value).then(ret => {
      if (ret) {
        callback();
      } else {
        callback(intl.get('NormalTransForm.invalidAddress'));
      }
    }).catch((err) => {
      callback(err);
    })
  }

  checkAmount = (rule, value, callback) => {
    let { form } = this.props;
    let quota = form.getFieldValue('quota');
    let balance = form.getFieldValue('balance');

    if (!checkAmountUnit(18, value)) {
      callback(intl.get('NormalTransForm.invalidAmount'));
    }

    if (Number(value) < 100) {
      callback(intl.get('StakeInForm.stakeTooLow'));
      return;
    }

    if (Number(value) > Number(balance)) {
      callback(intl.get('SendNormalTrans.hasBalance'));
      return;
    }

    if (Number(value) > Number(quota)) {
      callback(intl.get('StakeInForm.stakeExceed'));
      return;
    }

    callback();
  }

  getPath = (from) => {
    const { getAddrList, ledgerAddrList, trezorAddrList } = this.props;
    let addrs = getAddrList
    let fromAddr = from

    if (from.includes('Ledger')) {
      fromAddr = from.replace('Ledger: ', '')
      addrs = ledgerAddrList
    }

    if (from.includes('Trezor')) {
      fromAddr = from.replace('Trezor: ', '')
      addrs = trezorAddrList
    }

    for (let i = 0; i < addrs.length; i++) {
      const addr = addrs[i];
      if (addr.address == fromAddr) {
        return addr.path;
      }
    }
  }

  getAddr = (name) => {
    if (!name) {
      return "";
    }

    let { onlineValidatorList } = this.props;
    for (let i = 0; i < onlineValidatorList.length; i++) {
      const v = onlineValidatorList[i];
      if (name.toLowerCase() == v.name.toLowerCase()) {
        return v.address;
      }
    }
  }

  getQuota = (addr) => {
    if (!addr) {
      return " ";
    }

    let { onlineValidatorList } = this.props;
    for (let i = 0; i < onlineValidatorList.length; i++) {
      const v = onlineValidatorList[i];
      if (addr.toLowerCase() == v.address.toLowerCase()) {
        return v.quota;
      }
    }
    return " ";
  }

  getFeeRate = (addr) => {
    if (!addr) {
      return " ";
    }

    let { onlineValidatorList } = this.props;
    for (let i = 0; i < onlineValidatorList.length; i++) {
      const v = onlineValidatorList[i];
      if (addr.toLowerCase() == v.address.toLowerCase()) {
        return v.feeRate;
      }
    }
    return " ";
  }

  showConfirmForm = () => {
    let { form, settings } = this.props;
    form.validateFields(async (err) => {
      if (err) return;

      let from = form.getFieldValue('from');
      let to = form.getFieldValue('to');
      let pwd = form.getFieldValue('pwd');

      let path = this.getPath(from);

      let amount = form.getFieldValue('amount');
      if (!amount || amount < 100) {
        message.error(intl.get('NormalTransForm.amountIsIncorrect'));
        return;
      }

      if (Number(this.state.balance) <= amount) {
        message.error(intl.get('NormalTransForm.overBalance'))
        return;
      }

      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }

        try {
          await pu.promisefy(wand.request, ['phrase_reveal', { pwd: pwd }], this);
        } catch (error) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
      }

      let validator = {}
      let { onlineValidatorList } = this.props;

      for (let i = 0; i < onlineValidatorList.length; i++) {
        const v = onlineValidatorList[i];
        if (to == v.address) {
          validator = v;
          break;
        }
      }

      this.setState({
        confirmVisible: true,
        record: {
          accountAddress: from,
          validator: { name: validator.name, img: validator.icon, address: validator.address, commission: validator.feeRate },
          myStake: { title: amount },
        }
      });
    })
  }

  onConfirmCancel = () => {
    this.setState({ confirmVisible: false });
  }

  onSend = async () => {

    let { form } = this.props;
    let from = form.getFieldValue('from');
    let to = form.getFieldValue('to');

    let path = this.getPath(from);

    let amount = form.getFieldValue('amount');
    if (!amount || amount < 100) {
      message.error("Please input a valid amount.");
      return;
    }

    // if (this.state.balance <= amount) {
    //   message.error("Balance is not enough.")
    //   return;
    // }

    const WALLET_ID_NATIVE = 0x01;   // Native WAN HD wallet
    const WALLET_ID_LEDGER = 0x02;
    const WALLET_ID_TREZOR = 0x03;

    let walletID = WALLET_ID_NATIVE;

    if (from.includes('Ledger')) {
      from = from.replace('Ledger: ', '')
      walletID = WALLET_ID_LEDGER;
    }

    if (from.includes('Trezor')) {
      from = from.replace('Trezor: ', '')
      walletID = WALLET_ID_TREZOR;
    }

    let tx = {
      "from": from,
      "validatorAddr": to,
      "amount": (form.getFieldValue('amount') || 0).toString(),
      "gasPrice": 0,
      "gasLimit": 0,
      "BIP44Path": path,
      "walletID": walletID,
      "stakeAmount": (form.getFieldValue('amount') || 0).toString(),
    }

    if (walletID == WALLET_ID_TREZOR) {
      await this.trezorDelegateIn(path, from, to, (form.getFieldValue('amount') || 0).toString());
      this.props.onSend(walletID);
    } else {
      wand.request('staking_delegateIn', tx, (err, ret) => {
        if (err) {
          message.warn(err.message);
        } else {
          console.log('delegateIn ret:', ret);
        }
      });
    }

    this.setState({ confirmVisible: false });

    this.props.onSend(walletID);

    this.props.updateStakeInfo();
    this.props.updateTransHistory();
  }

  onClick = () => {
    let href = this.props.chainId === 1 ? `${main}` : `${testnet}`;
    wand.shell.openExternal(href);
  }

  trezorDelegateIn = async (path, from, validator, value) => {
    let chainId = await getChainId();
    let func = 'delegateIn';
    try {
      let nonce = await getNonce(from, 'wan');
      let gasPrice = await getGasPrice('wan');
      let data = await getContractData(func, validator);
      let amountWei = toWei(value);
      const cscContractAddr = await getContractAddr();
      let rawTx = {};
      rawTx.from = from;
      rawTx.to = cscContractAddr;
      rawTx.value = amountWei;
      rawTx.data = data;
      rawTx.nonce = '0x' + nonce.toString(16);
      rawTx.gasLimit = '0x' + Number(200000).toString(16);
      rawTx.gasPrice = toWei(gasPrice, "gwei");
      rawTx.Txtype = Number(1);
      rawTx.chainId = chainId;

      let raw = await pu.promisefy(this.signTrezorTransaction, [path, rawTx], this);
      console.log('Raw tx:', raw);

      let txHash = await pu.promisefy(wand.request, ['transaction_raw', { raw, chainType: 'WAN' }], this);
      console.log('Sending transaction finished, txHash:', txHash);
      let params = {
        srcSCAddrKey: 'WAN',
        srcChainType: 'WAN',
        tokenSymbol: 'WAN',
        //hashX: txHash,
        txHash,
        from: from.toLowerCase(),
        validator: validator,
        annotate: 'DelegateIn',
        status: 'Sent',
        source: "external",
        stakeAmount: value,
        ...rawTx
      }

      await pu.promisefy(wand.request, ['staking_insertTransToDB', { rawTx: params }], this);
      this.props.updateStakeInfo();
      this.props.updateTransHistory();
    } catch (error) {
      message.error(error)
    }
  }

  signTrezorTransaction = (path, tx, callback) => {
    TrezorConnect.ethereumSignTransaction({
      path: path,
      transaction: {
        to: tx.to,
        value: tx.value,
        data: tx.data,
        chainId: tx.chainId,
        nonce: tx.nonce,
        gasLimit: tx.gasLimit,
        gasPrice: tx.gasPrice,
        txType: tx.Txtype, // Txtype case is required by wanTx
      },
    }).then((result) => {
      if (!result.success) {
        message.warn(intl.get('Trezor.signTransactionFailed'));
        callback(intl.get('Trezor.signFailed'), null);
        return;
      }

      tx.v = result.payload.v;
      tx.r = result.payload.r;
      tx.s = result.payload.s;
      let eTx = new wanTx(tx);
      let signedTx = '0x' + eTx.serialize().toString('hex');
      console.log('Signed tx', signedTx);
      console.log('Tx:', tx);
      callback(null, signedTx);
    });
  }


  render() {
    let { onlineValidatorList, form, settings } = this.props;

    let validatorListSelect = []
    for (let i = 0; i < onlineValidatorList.length; i++) {
      const v = onlineValidatorList[i];
      validatorListSelect.push(
        (<div name={v.name}><Avatar src={v.icon} name={v.name} value={v.name} size="small" />{" "}{v.name}</div>)
      )
    }

    const { getFieldDecorator } = form;

    return (
      <div className="stakein">
        <Modal
          visible={this.props.visible}
          destroyOnClose={true}
          closable={false}
          title={intl.get('StakeInForm.title')}
          onCancel={this.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.props.onCancel}>{intl.get('NormalTransForm.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.showConfirmForm}>{intl.get('NormalTransForm.next')}</Button>,
          ]}
          className="stakein-modal"
        >
          <div className="stakein-bg">
            <div className="stakein-title">{intl.get('StakeInForm.validatorAccount')}</div>
            <div className="stakein-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={4} className="col-stakein-name"><span className="stakein-name">{intl.get('StakeInForm.name')}</span></Col>
                <Col span={16}>

                  <Form layout="inline" id="posNameSelect">
                    <Form.Item>
                      {getFieldDecorator('validatorName', {
                        rules: [{ required: false }],
                      })(
                        <Select
                          disabled={this.props.disabled}
                          showArrow={!this.props.disabled}
                          showSearch
                          allowClear
                          style={{ width: 355 }}
                          placeholder={intl.get('StakeInForm.selectName')}
                          optionFilterProp="children"
                          onChange={this.onValidatorChange}
                          getPopupContainer={() => document.getElementById('posNameSelect')}
                          filterOption={(input, option) => option.props.value.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                        >
                          {validatorListSelect.map((item, index) => <Option value={item.props.name} key={index}>{item}</Option>)}
                        </Select>
                      )}
                    </Form.Item>
                  </Form>
                </Col>
                <Col span={4}>
                  <a href="javascript:void(0)" onClick={this.onClick}>{intl.get('StakeInForm.more')}</a>
                </Col>
              </Row>
            </div>
            <div className="stakein-line">
              <Row type="flex" justify="space-around" align="top">
                <Col span={4} className="col-stakein-name"><span className="stakein-name">{intl.get('StakeInForm.address')}</span></Col>
                <Col span={20}>
                  <Form layout="inline">
                    <Form.Item>
                      {getFieldDecorator('to', { rules: [{ required: true, message: 'Address is incorrect', validator: this.checkToWanAddr }] })
                        (<Input disabled={this.props.disabled} placeholder={intl.get('StakeInForm.enterAddress')} prefix={<Icon type="wallet" className="colorInput" />} />)}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>
            <div className="stakein-line">
              <Row type="flex" justify="space-around" align="top">
                <Col span={4} className="col-stakein-name"><span className="stakein-name">{intl.get('StakeInForm.quota')}</span></Col>
                <Col span={20}>
                  <Form layout="inline">
                    <Form.Item >
                      {getFieldDecorator('quota')
                        (<Input disabled={true} prefix={<Icon type="credit-card" className="colorInput" />} />)}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>
            <div className="stakein-line">
              <Row type="flex" justify="space-around" align="top">
                <Col span={4} className="col-stakein-name"><span className="stakein-name">{intl.get('StakeInForm.commission')}</span></Col>
                <Col span={20}>
                  <Form layout="inline">
                    <Form.Item >
                      {getFieldDecorator('commission')
                        (<Input disabled={true} prefix={<Icon type="credit-card" className="colorInput" />} />)}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>
          </div>
          <div className="stakein-bg">
            <div className="stakein-title">{intl.get('StakeInForm.myAccount')}</div>

            <div className="stakein-line">
              <Row type="flex" justify="space-around" align="top">
                <Col span={4} className="col-stakein-name"><span className="stakein-name">{intl.get('StakeInForm.address')}</span></Col>
                <Col span={20}>
                  <Form layout="inline" id="posAddrSelect">
                    <Form.Item>
                      {getFieldDecorator('from', { rules: [{ required: true, message: intl.get('NormalTransForm.invalidAddress') }] })
                        (
                          <Select
                            autoFocus
                            showSearch
                            allowClear
                            optionLabelProp="value"
                            dropdownMatchSelectWidth={false}
                            dropdownStyle={{width: "470px"}}
                            placeholder={intl.get('StakeInForm.selectAddress')}
                            optionFilterProp="children"
                            // onChange={this.onChange}
                            onSelect={this.onChange}
                            getPopupContainer={() => document.getElementById('posAddrSelect')}
                            filterOption={(input, option) => option.props.value.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                            className="colorInput"
                          >
                            {this.state.addrList.map((item, index) =>
                              <Option value={item} key={index}>
                                <Row>
                                  <Col span={20}>{item}</Col>
                                  <Col span={4} align="right" className="stakein-selection-balance">- {Number(this.getBalance(item)).toFixed(1)}</Col>
                                </Row>
                              </Option>)}
                          </Select>
                        )}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>

            <div className="stakein-line">
              <Row type="flex" justify="space-around" align="top">
                <Col span={4} className="col-stakein-name"><span className="stakein-name">{intl.get('StakeInForm.balance')}</span></Col>
                <Col span={20}>
                  <Form layout="inline">
                    <Form.Item >
                      {getFieldDecorator('balance', { initialValue: this.state.balance })
                        (<Input disabled={true} prefix={<Icon type="credit-card" className="colorInput" />} />)}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>

            <div className="stakein-line">
              <Row type="flex" justify="space-around">
                <Col span={4} className="col-stakein-name"><span className="stakein-name">{intl.get('StakeInForm.stake')}</span></Col>
                <Col span={20}>
                  <Form layout="inline">
                    <Form.Item>
                      {getFieldDecorator('amount', { initialValue: 100, rules: [{ required: true, validator: this.checkAmount }] })
                        (<Input min={100} prefix={<Icon type="credit-card" className="colorInput" />} />)}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>
            {settings.reinput_pwd
              ? <div className="stakein-line">
                <Row type="flex" justify="space-around" align="top">
                  <Col span={4} className="col-stakein-name"><span className="stakein-name">{intl.get('NormalTransForm.password')}</span></Col>
                  <Col span={20}>
                    <Form layout="inline">
                      <Form.Item>
                        {getFieldDecorator('pwd', { rules: [{ required: true, message: intl.get('NormalTransForm.pwdIsIncorrect') }] })
                          (<Input.Password placeholder={intl.get('Backup.enterPassword')} prefix={<Icon type="lock" className="colorInput" />} />)}
                      </Form.Item>
                    </Form>
                  </Col>
                </Row>
              </div>
              : ''
            }
          </div>
        </Modal>
        {
          this.state.confirmVisible ?
            (<Confirm visible={this.state.confirmVisible}
              onCancel={this.onConfirmCancel} onSend={this.onSend}
              record={this.state.record}
              title={intl.get('NormalTransForm.ConfirmForm.transactionConfirm')}
              note={''}
            />) : ''
        }

      </div>
    );
  }
}

export default StakeInForm;
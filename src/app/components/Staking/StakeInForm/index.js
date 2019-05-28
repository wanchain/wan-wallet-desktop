import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Modal, Form, Input, Icon, Select, InputNumber, message, Row, Col, Radio } from 'antd';
import Validator from '../Validators/Validator';
import './index.less';
import validatorImg from 'static/image/validator.png';
import { checkWanAddr } from 'utils/helper';
import { checkWanValidatorAddr } from 'utils/helper';

import { toWei } from 'utils/support';
import intl from 'react-intl-universal';



const DEFAULT_GAS = 4700000;

@inject(stores => ({
  getAddrList: stores.wanAddress.getAddrList,
}))

@observer
class StakeInForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      balance: "0",
      addrList: [],
    }
  }

  componentWillMount() {
    const { getAddrList } = this.props;
    let addrList = []
    getAddrList.forEach(addr => {
      addrList.push(
        addr.address
      )
    });
    this.setState({ addrList: addrList })
  }

  componentDidMount() {
    if (this.props.record) {
      let { form } = this.props;
      form.setFieldsValue({to: this.props.record.validator.address});
      form.setFieldsValue({validatorName: this.props.record.validator});
      form.setFieldsValue({from: this.props.record.accountAddress});
      this.onChange(this.props.record.accountAddress);
    }
  }

  componentDidUpdate() {

  }

  componentWillUnmount() {

  }

  onChange = value => {
    const { getAddrList } = this.props;
    for (let i = 0; i < getAddrList.length; i++) {
      const element = getAddrList[i];
      if (element.address == value) {
        this.setState({ balance: element.balance })
      }
    }
  }


  checkToWanAddr = (rule, value, callback) => {
    checkWanValidatorAddr(value).then(ret => {
      if (ret) {
        callback();
      } else {
        callback('Invalid address');
      }
    }).catch((err) => {
      callback(err);
    })
  }

  checkAmount = (rule, value, callback) => {
    if (value >= 0) {
      callback();
    } else {
      callback('Invalid amount');
    }
  }

  getPath = (from) => {
    const addrs = this.props.getAddrList
    console.log('getPath called', addrs)
    for (let i = 0; i < addrs.length; i++) {
      const addr = addrs[i];
      console.log('addr,from', addr, from)
      if (addr.address == from) {
        return addr.path;
      }
    }
  }

  onSend = () => {

    let { form } = this.props;
    let from = form.getFieldValue('from');
    let to = form.getFieldValue('to');

    let path = this.getPath(from);

    let amount = form.getFieldValue('amount');
    if(!amount || amount < 100) {
      message.error("Please input a valid amount.");
      return;
    }

    if (this.state.balance <= amount) {
      message.error("Balance is not enough.")
      return;
    }

    let tx = {
      "from": from,
      "validatorAddr": to,
      "amount": (form.getFieldValue('amount')|| 0).toString(),
      "gasPrice": 0,
      "gasLimit": 0,
      "BIP44Path": path,
      "walletID": 1
    }

    wand.request('staking_delegateIn', tx, (err, ret) => {
      if (err) {
        message.warn(err.message);
      } else {
        console.log('delegateIn ret:', ret);
      }
    });

    this.props.onSend();
  }

  render() {
    let validatorList = []
    validatorList.push(
      (<Validator img={validatorImg} name="Ethereum" />)
    )

    const { loading, form, validator, minGasPrice, maxGasPrice, averageGasPrice, gasFeeArr } = this.props;

    const { getFieldDecorator } = form;

    return (
      <div className="stakein">
        <Modal
          visible
          destroyOnClose={true}
          closable={false}
          title={intl.get('StakeInForm.title')}
          onCancel={this.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.props.onCancel}>{intl.get('NormalTransForm.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.onSend}>{intl.get('SendNormalTrans.send')}</Button>,
          ]}
          className="stakein-modal"
        >
          <div className="stakein-bg">
            <div className="stakein-title">{intl.get('StakeInForm.validatorAccount')}</div>
            <div className="stakein-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={4}><span className="stakein-name">{intl.get('StakeInForm.name')}</span></Col>
                <Col span={16}>

                  <Form layout="inline">
                    <Form.Item>
                      {getFieldDecorator('validatorName', {
                        rules: [{ required: false }],
                      })(
                        <Select
                          showSearch
                          allowClear
                          style={{ width: 355 }}
                          placeholder={intl.get('StakeInForm.selectName')}
                          optionFilterProp="children"
                          onChange={this.onChange}
                          onFocus={this.onFocus}
                          onBlur={this.onBlur}
                          onSearch={this.onSearch}
                          filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                        >
                          {validatorList.map((item, index) => <Option value={item} key={index}>{item}</Option>)}
                        </Select>
                      )}
                    </Form.Item>
                  </Form>
                </Col>
                <Col span={4}>
                  <a href="https://www.wanscan.org/">{intl.get('StakeInForm.more')}</a>
                </Col>
              </Row>
            </div>
            <div className="stakein-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={4}><span className="stakein-name">{intl.get('StakeInForm.address')}</span></Col>
                <Col span={20}>
                  <Form layout="inline">
                    <Form.Item>
                      {getFieldDecorator('to', { rules: [{ required: true, message: 'Address is incorrect', validator: this.checkToWanAddr }] })
                        (<Input placeholder={intl.get('StakeInForm.enterAddress')} prefix={<Icon type="wallet" className="colorInput"/>} />)}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>
          </div>
          <div className="stakein-bg">
            <div className="stakein-title">{intl.get('StakeInForm.myAccount')}</div>
            <div className="stakein-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={4}><span className="stakein-name">{intl.get('StakeInForm.stake')}</span></Col>
                <Col span={20}>
                  <Form layout="inline">
                    <Form.Item>
                      {getFieldDecorator('amount', { rules: [{ required: true, message: 'Amount is incorrect', validator: this.checkAmount }] })
                        (<InputNumber min={100} placeholder="100" prefix={<Icon type="money-collect" className="colorInput" />} />)}
                    </Form.Item>
                  </Form>
                </Col>
                {/* <Col span={4}><span className="stakein-addr">WAN</span></Col> */}
              </Row>
            </div>
            <div className="stakein-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={5}><span className="stakein-name">{intl.get('StakeInForm.balance')}</span></Col>
                <Col span={19}><span className="stakein-addr">{this.state.balance} WAN</span></Col>
              </Row>
            </div>
            <div className="stakein-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={4}><span className="stakein-name">{intl.get('StakeInForm.address')}</span></Col>
                <Col span={20}>
                  <Form layout="inline">
                    <Form.Item>
                      {getFieldDecorator('from', { rules: [{ required: true, message: 'Address is incorrect' }] })
                        (
                          <Select
                            showSearch
                            allowClear
                            style={{ width: 355 }}
                            placeholder={intl.get('StakeInForm.selectAddress')}
                            optionFilterProp="children"
                            onChange={this.onChange}
                            onFocus={this.onFocus}
                            onBlur={this.onBlur}
                            onSearch={this.onSearch}
                            filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                            className="colorInput"
                          >
                            {this.state.addrList.map((item, index) => <Option value={item} key={index}>{item}</Option>)}
                          </Select>
                        )}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default StakeInForm;
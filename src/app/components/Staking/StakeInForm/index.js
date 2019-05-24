import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Modal, Form, Input, Icon, Select, InputNumber, message, Row, Col, Radio } from 'antd';
import Validator from '../Validators/Validator';
import './index.less';
import validatorImg from 'static/image/validator.png';
import { checkWanAddr } from 'utils/helper';
import { toWei } from 'utils/support';



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
    //callback();
    checkWanAddr(value).then(ret => {
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
    console.log('path', path);

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
        message.warn("Estimate gas failed. Please try again");
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
          title="Delegate Now"
          onCancel={this.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.props.onCancel}>Cancel</Button>,
            <Button key="submit" type="primary" onClick={this.onSend}>Send</Button>,
          ]}
          className="stakein-modal"
        >
          <div className="stakein-bg">
            <div className="stakein-title">Validator's Account:</div>
            <div className="stakein-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={4}><span className="stakein-name">Name</span></Col>
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
                          placeholder="Select a FROM name"
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
                  <a href="https://www.wanscan.org/">More Info</a>
                </Col>
              </Row>
            </div>
            <div className="stakein-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={4}><span className="stakein-name">Address</span></Col>
                <Col span={20}>
                  <Form layout="inline">
                    <Form.Item>
                      {getFieldDecorator('to', { rules: [{ required: true, message: 'Address is incorrect', validator: this.checkToWanAddr }] })
                        (<Input placeholder="Please enter address" prefix={<Icon type="wallet" className="colorInput" />} />)}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>
          </div>
          <div className="stakein-bg">
            <div className="stakein-title">My Account:</div>
            <div className="stakein-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={4}><span className="stakein-name">Stake</span></Col>
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
                <Col span={5}><span className="stakein-name">Balance</span></Col>
                <Col span={19}><span className="stakein-addr">{this.state.balance} WAN</span></Col>
              </Row>
            </div>
            <div className="stakein-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={4}><span className="stakein-name">Address</span></Col>
                <Col span={20}>
                  <Form layout="inline">
                    <Form.Item>
                      {getFieldDecorator('from', { rules: [{ required: true, message: 'Address is incorrect' }] })
                        (
                          <Select
                            showSearch
                            allowClear
                            style={{ width: 355 }}
                            placeholder="Select a FROM address"
                            optionFilterProp="children"
                            onChange={this.onChange}
                            onFocus={this.onFocus}
                            onBlur={this.onBlur}
                            onSearch={this.onSearch}
                            filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
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
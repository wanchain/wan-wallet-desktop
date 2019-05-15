import React, { Component } from 'react';
import { Button, Table, Row, Col, message } from 'antd';
import { observer, inject } from 'mobx-react';
import wanUtil from "wanchain-util";

import './index.less';

import { EditableFormRow, EditableCell } from './Rename';
import SendNormalTrans from 'components/SendNormalTrans';
import CopyAndQrcode from 'components/CopyAndQrcode';
import TransHistory from 'components/TransHistory';

import totalImg from 'static/image/wan.png';

const WAN = "m/44'/5718350'/0'/0/";
const CHAINTYPE = 'WAN';
const SYMBOL = 'WAN';
const WALLETID = 1;

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  getAmount: stores.wanAddress.getNormalAmount,
  getAddrList: stores.wanAddress.getAddrList,
  transParams: stores.sendTransParams.transParams,
  updateName: arr => stores.wanAddress.updateName(arr),
  addAddress: newAddr => stores.wanAddress.addAddress(newAddr),
  changeTitle: newTitle => stores.session.changeTitle(newTitle),
  updateTransHistory: newTrans => stores.wanAddress.updateTransHistory(newTrans),
}))

@observer
class WanAccount extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bool: true,
      isUnlock: false,
    }
    this.props.changeTitle('Wallet');
    this.props.updateTransHistory();
  }

  componentDidMount() {
    this.timer = setInterval(() => this.props.updateTransHistory(), 5000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  columns = [
    {
      title: 'NAME',
      dataIndex: 'name',
      editable: true
    },
    {
      title: 'ADDRESS',
      dataIndex: 'address',
      render: text => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} /></div>
    },
    {
      title: 'BALANCE',
      dataIndex: 'balance',
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      title: 'ACTION',
      dataIndex: 'action',
      render: (text, record) => <div><SendNormalTrans from={record.address} path={record.path} handleSend={this.handleSend} chainType={CHAINTYPE}/></div>
    }
  ];

  handleSend = from => {
    let params = this.props.transParams[from];
    let trans = {
      walletID: WALLETID,
      chainType: CHAINTYPE,
      symbol: SYMBOL,
      path: params.path,
      to: params.to,
      amount: params.amount,
      gasLimit: `0x${params.gasLimit.toString(16)}`,
      gasPrice: params.gasPrice,
    };
    wand.request('transaction_normal', trans, (err, val) => {
      if (err) {
        message.warn("Send transaction failed. Please try again");
        console.log(err);
      } else {
        this.props.updateTransHistory();
        console.log("TxHash:", val);
      }
    });
    this.setState({ visible: true });
  }

  creatAccount = () => {
    const { addrInfo, addAddress } = this.props;
    const addrLen = Object.keys(addrInfo['normal']).length;
    this.setState({
      bool: false
    });

    if (this.state.bool) {
      wand.request('address_get', { walletID: WALLETID, chainType: CHAINTYPE, start: addrLen, end: addrLen + 1 }, (err, val_address_get) => {
        if (!err) {
          wand.request('account_create', { walletID: WALLETID, path: `${WAN}${addrLen}`, meta: { name: `Account${addrLen + 1}`, addr: `0x${val_address_get.addresses[0].address}` } }, (err, val_account_create) => {
            if (!err && val_account_create) {
              let addressInfo = val_address_get.addresses[0];
              addressInfo.start = addressInfo.index;
              addressInfo.address = wanUtil.toChecksumAddress(`0x${addressInfo.address}`);
              addAddress(addressInfo);
              this.setState({
                bool: true
              });
            }
          });
        }
      });
    }
  }

  handleSave = row => {
    this.props.updateName(row);
  }

  render() {
    const { getAmount } = this.props;
    const components = {
      body: {
        cell: EditableCell,
        row: EditableFormRow,
      },
    };

    const columns = this.columns.map((col) => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: record => ({
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          handleSave: this.handleSave,
        }),
      };
    });

    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} alt="Wanchain" /> <span className="wanTotal">{getAmount}</span><span className="wanTex">WAN</span></Col>
          <Col span={12} className="col-right">
            <Button className="creatBtn" type="primary" shape="round" size="large" onClick={this.creatAccount}>Create</Button>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table components={components} rowClassName={() => 'editable-row'} className="content-wrap" pagination={false} columns={columns} dataSource={this.props.getAddrList} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <TransHistory name="normal"/>
          </Col>
        </Row>
      </div>
    );
  }
}

export default WanAccount;
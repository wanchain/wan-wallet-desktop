import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, Icon, Modal, message } from 'antd';
import ChainMiniList from './ChainMiniList';
import SelectChainType from 'componentUtils/SelectChainType';
import { COIN_ACCOUNT } from 'utils/settings';
import style from './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
  getWalletSelections: stores.tokens.getWalletSelections,
  tokenIconList: stores.tokens.tokenIconList,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  deleteCustomToken: token => stores.tokens.deleteCustomToken(token),
}))

@observer
class MoreAccount extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pairFilter: false,
      selectedOnly: false,
      showAddToken: false,
      showDeleteToken: false,
      deleteObj: {},
    }
    this.props.changeTitle('MoreTokens.tokenList');
  }

  columns = [
    {
      dataIndex: 'ancestor',
      width: 360,
      title: 'TOKEN',
      align: 'center',
      ellipsis: false,
      render: (text, record) => {
        let filtered = record.children.map(v => v.account).filter(v => v !== COIN_ACCOUNT);
        return (<div className={style.tokenGrid}>
          <div><img className={style.totalImg} src={this.props.tokenIconList[filtered.length === 0 ? COIN_ACCOUNT : filtered[0]]} /></div>
          <div className={style.coinText}>{text}</div>
        </div>)
      }
    },
    {
      dataIndex: 'key',
      width: 600,
      title: 'CROSS-CHAIN',
      align: 'center',
      ellipsis: false,
      render: (text, record) => <ChainMiniList record={record} handleDelete={this.handleDelete} />
    },
    {
      flex: 1
    }
  ];

  handleAddToken = event => {
    this.setState({
      showAddToken: true
    });
  }

  onCancel = () => {
    this.setState({
      showAddToken: false
    });
  }

  handleDelete =(data) => {
    this.setState({
      deleteObj: data,
      showDeleteToken: true
    });
  }

  deleteConfirm = () => {
    const addr = this.state.deleteObj.toAccount;
    wand.request('crossChain_deleteCustomToken', { tokenAddr: addr }, err => {
      if (err) {
        console.log('stores_deleteCustomToken', err);
        message.warn(intl.get('Config.deleteTokenAddrErr'));
      } else {
        this.props.deleteCustomToken(addr);
        message.success(intl.get('TransHistory.success'));
      }
    });
    this.setState({
      showDeleteToken: false,
      deleteObj: {},
    })
  }

  deleteCancel = () => {
    this.setState({
      showDeleteToken: false
    });
  }

  render() {
    let { getWalletSelections } = this.props;
    return (
      <div className={style['moreCrossChain']}>
        <Row>
          <Col>
            <div className={style['addCustom']} onClick={this.handleAddToken}>
              <Icon type="plus" style={{ fontWeight: 'bold' }}/>
            </div>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" mode={'horizontal'} childrenColumnName={'unset'} showHeader={false} pagination={false} columns={this.columns} dataSource={getWalletSelections} />
          </Col>
        </Row>
        {
          this.state.showAddToken && <SelectChainType onCancel={this.onCancel} />
        }
        <Modal
            title={intl.get('Config.deleteConfirm')}
            visible={this.state.showDeleteToken}
            onOk={this.deleteConfirm}
            onCancel={this.deleteCancel}
            closable={false}
            okText={intl.get('Common.ok')}
            cancelText={intl.get('Common.cancel')}
            bodyStyle={{ textAlign: 'center' }}
          >
            <div className={style.deleteMsg}>
              <span className={style.deleteConfirmMsg}>{intl.get('CopyAndQrcode.confirmText')} : </span>
              <span className={style.symbolSty}>{this.state.deleteObj.symbol}</span>
            </div>
          </Modal>
      </div>
    );
  }
}

export default MoreAccount;

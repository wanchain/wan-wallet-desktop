import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, Icon, Modal, message, Input, Tag } from 'antd';
import ChainMiniList from './ChainMiniList';
import SelectChainType from 'componentUtils/SelectChainType';
import { COIN_ACCOUNT, COIN_ACCOUNT_EOS } from 'utils/settings';
import style from './index.less';

const { Search } = Input;
@inject(stores => ({
  language: stores.languageIntl.language,
  getWalletSelections: stores.tokens.getWalletSelections,
  tokensList: stores.tokens.tokensList,
  tokenIconList: stores.tokens.tokenIconList,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  deleteCustomToken: token => stores.tokens.deleteCustomToken(token),
  getCoinImage: (...args) => stores.tokens.getCoinImage(...args),
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
      filterText: '',
    }
  }

  componentDidMount() {
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
        let filtered = record.children.filter(v => v.account !== COIN_ACCOUNT && v.account !== COIN_ACCOUNT_EOS);
        return (<div className={style.tokenGrid}>
          <div><img className={style.totalImg} src={this.props.getCoinImage(record.ancestor, filtered.length === 0 ? false : filtered[0].account)} /></div>
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

  handleDelete = (data) => {
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

  searchChange = (e) => {
    let value = e.target.value;
    this.setState({
      filterText: value.trim()
    })
  }

  getTokenList = () => {
    let { getWalletSelections } = this.props;
    let text = this.state.filterText.trim().toLowerCase();
    let lists = [];
    if (text.length === 0) {
      return getWalletSelections;
    }
    getWalletSelections.forEach(obj => {
      if (new RegExp(text).test(obj.ancestor.toLowerCase())) {
        lists.push(obj);
      } else {
        if (obj.children.length > 0) {
          let list = null;
          obj.children.forEach(child => {
            if (new RegExp(text).test(child.symbol.toLowerCase())) {
              if (list === null) {
                list = {
                  ancestor: obj.ancestor,
                  key: obj.key,
                  symbol: obj.symbol,
                  children: []
                }
              }
              list.children.push(child);
            }
          })
          if (list !== null) {
            lists.push(list);
          }
        }
      }
    });
    return lists;
  }

  closeFilter = () => {
    this.setState({ filterText: '' });
  }

  render() {
    return (
      <div className={style['moreCrossChain']}>
        <Row>
          <Col className={style['settingContainer']}>
            <div className={style['addCustom']} onClick={this.handleAddToken}>
              <Icon type="plus" style={{ fontWeight: 'bold' }} />
            </div>
            <div></div>
            <Search className={style['searchField']} placeholder={intl.get('MoreAccount.inputSearchText')} onChange={this.searchChange} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" mode={'horizontal'} childrenColumnName={'unset'} showHeader={false} pagination={false} columns={this.columns} dataSource={this.getTokenList()} />
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

import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Row, Col, message } from 'antd';

import style from './index.less';
import totalImg from 'static/image/eos.png';
import { EOSPATH, WALLETID } from 'utils/settings';
import EOSKeyPairList from './EOSKeyPairList';
import TransHistory from 'components/TransHistory/EthTransHistory';
import CopyAndQrcode from 'components/CopyAndQrcode';
import SendNormalTrans from 'components/SendNormalTrans/SendETHNormalTrans';
import { checkAddrType, hasSameName } from 'utils/helper';

const CHAINTYPE = 'EOS';

@inject(stores => ({
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  transParams: stores.sendTransParams.transParams,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class EosAccount extends Component {
  constructor (props) {
    super(props);
    // this.props.updateTransHistory();
    this.props.changeTitle('WanAccount.wallet');
    this.state = {
      showAddAccountForm: false
    }
  }

  componentDidMount () {
  }

  componentWillUnmount () {
  }

  handleSend = from => {
  }

  creatAccount = () => {
  }

  generateKeyPair2 = () => {
  }

  generateKeyPair = () => {
    const addrLen = 0;
    let path = `${EOSPATH}${addrLen}`;
    // console.log({ walletID: WALLETID.NATIVE, chainType: CHAINTYPE, path: path });
    wand.request('address_getOne', { walletID: WALLETID.NATIVE, chainType: CHAINTYPE, path: path }, (err, res) => {
      if (err) {
        console.log('error:', err);
      } else {
        console.log('res:', res);
      }
    });
  }

  createAccount = () => {
    console.log('createAccount');
  }

  handleSave = row => {
  }

  render () {
    console.log('style:', style);
    const { getAmount } = this.props;
    return (
      <div className={style.account}>
        <Row className={style.title + ' ' + style['narrow-bottom-title']}>
          <Col span={12} className="col-left">
            <img className="totalImg" src={totalImg} alt={intl.get('EosAccount.eos')} />
            <span className="wanTotal">{getAmount}</span>
            <span className="wanTex">{intl.get('EosAccount.eos')}</span>
          </Col>
        </Row>
        <Row className={style['sub-title']}>
          <Col span={12} className="col-left">
            <img className="totalImg" src={totalImg} alt={intl.get('EosAccount.eos')} />
            <span className="wanTex">{'EOS Key Pairs'}</span>
          </Col>
          <Col span={12} className="col-right">
            <Button className="creatBtn" type="primary" shape="round" size="large" onClick={this.generateKeyPair}>{'Generate Key Pair'}</Button>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <EOSKeyPairList/>
          </Col>
        </Row>
        <Row className={style['sub-title']}>
          <Col span={12} className="col-left">
            {/* <img className="totalImg" src={totalImg} alt={intl.get('EosAccount.eos')} />
            <span className="wanTex">{'EOS Key Pairs'}</span> */}
          </Col>
          <Col span={12} className="col-right">
            <Button className="creatBtn" type="primary" shape="round" size="large" onClick={this.createAccount}>{'Create Account'}</Button>
          </Col>
        </Row>
        {/* <Row className="mainBody">
          <Col>
            <Table components={components} rowClassName={() => 'editable-row'} className="content-wrap" pagination={false} columns={this.columnsTree} dataSource={getAddrList} />
          </Col>
        </Row> */}
        {/* <Row className="mainBody">
          <Col>
            <TransHistory name={['normal']} />
          </Col>
        </Row> */}
        {
          this.state.showAddAccountForm && <div>Add Account Form Modal</div>
        }
      </div>
    );
  }
}

export default EosAccount;

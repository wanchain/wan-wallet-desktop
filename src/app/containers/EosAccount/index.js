import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Row, Col, Form } from 'antd';

import style from './index.less';
import totalImg from 'static/image/eos.png';
import { EOSPATH, WALLETID } from 'utils/settings';
import EOSTransHistory from 'components/EOSTransHistory';
import EOSKeyPairList from './EOSKeyPairList';
import EOSAccountList from './EOSAccountList';
import EOSCreateAccountForm from './EOSCreateAccountForm';

const CHAINTYPE = 'EOS';
const CreateAccountForm = Form.create({ name: 'createAccountForm' })(EOSCreateAccountForm);

@inject(stores => ({
  language: stores.languageIntl.language,
  keyInfo: stores.eosAddress.keyInfo,
  getAmount: stores.eosAddress.getAllAmount,
  getAccount: stores.eosAddress.getAccount,
  addKey: obj => stores.eosAddress.addKey(obj),
  updateTransHistory: () => stores.eosAddress.updateTransHistory(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class EosAccount extends Component {
  constructor (props) {
    super(props);
    this.props.updateTransHistory();
    this.props.changeTitle('WanAccount.wallet');
    this.state = {
      showCreateAccountForm: false,
    }
  }

  componentDidMount () {
    this.timer = setInterval(() => this.props.updateTransHistory(), 5000);
  }

  componentWillUnmount () {
    clearInterval(this.timer);
  }

  generateKeyPair = () => {
    const { keyInfo, addKey } = this.props;
    const addrLen = Object.keys(keyInfo['normal']).length;
    let path = `${EOSPATH}${addrLen}`;
    wand.request('address_getOne', { walletID: WALLETID.NATIVE, chainType: CHAINTYPE, path: path }, (err, res) => {
      if (!err) {
        let DBObject = {
          name: `EOS-PublicKey${addrLen + 1}`,
          publicKey: res.address,
        };
        wand.request('account_create', { walletID: WALLETID.NATIVE, path: path, meta: DBObject }, (err, response) => {
          if (!err && response) {
            addKey({
              start: addrLen,
              publicKey: res.address,
              path: res.path
            });
          } else {
            console.log('error:', err);
          }
        });
      } else {
        console.log('error:', err);
      }
    });
  }

  createAccount = () => {
    this.setState({
      showCreateAccountForm: true
    })
  }

  handleCancel = () => {
    this.setState({
      showCreateAccountForm: false
    })
  }

  render() {
    const { getAmount } = this.props;
    return (
      <div className={style.EOSAccount + ' account'}>
        <Row className={'title ' + style['narrow-bottom-title']}>
          <Col span={12} className="col-left">
            <img className="totalImg" src={totalImg} alt={'EOS'} />
            <span className="wanTotal">{intl.get('EosAccount.keyPair')}</span>
          </Col>
          <Col span={12} className="col-right">
            <Button className="createBtn" type="primary" shape="round" size="large" onClick={this.generateKeyPair}>{intl.get('Common.create')}</Button>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <EOSKeyPairList />
          </Col>
        </Row>
        <Row className={'title ' + style['narrow-bottom-title'] + ' ' + style.topBorder}>
          <Col span={12} className="col-left">
            <img className="totalImg" src={totalImg} alt={'EOS'} />
            <span className="wanTotal">
              {intl.get('EosAccount.Accounts')} ({getAmount} <span className="wanTex">EOS</span>)
            </span>
          </Col>
          <Col span={12} className="col-right">
            <Button className="createBtn" type="primary" disabled={this.props.getAccount.length === 0} shape="round" size="large" onClick={this.createAccount}>{intl.get('Common.create')}</Button>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <EOSAccountList />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <EOSTransHistory name={['normal', 'import']} />
          </Col>
        </Row>
        { this.state.showCreateAccountForm && <CreateAccountForm handleCancel={this.handleCancel} /> }
      </div>
    );
  }
}

export default EosAccount;

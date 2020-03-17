import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Row, Col, Form, message } from 'antd';

import style from './index.less';
import totalImg from 'static/image/eos.png';
import { createEOSAddr } from 'utils/helper';
import EOSTransHistory from 'components/EOSTransHistory';
import EOSKeyPairList from './EOSKeyPairList';
import EOSAccountList from './EOSAccountList';
import EOSCreateAccountForm from './EOSCreateAccountForm';

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
    const { addKey } = this.props;
    try {
      createEOSAddr().then(info => {
        addKey(info);
        message.success(intl.get('EosAccount.createKeyPairSuccess'));
      });
    } catch (e) {
      console.log('err:', e);
      message.warn(intl.get('EosAccount.createKeyPairFailed'));
    };
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

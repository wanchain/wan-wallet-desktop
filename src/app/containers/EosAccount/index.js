import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Row, Col, Form, message } from 'antd';

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
  keyInfo: stores.eosAddress.keyInfo,
  language: stores.languageIntl.language,
  addKey: obj => stores.eosAddress.addKey(obj),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class EosAccount extends Component {
  constructor (props) {
    super(props);
    // this.props.updateTransHistory();
    this.props.changeTitle('WanAccount.wallet');
    this.state = {
      showCreateAccountForm: false,
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

  generateKeyPair = () => {
    const { keyInfo, addKey } = this.props;
    const addrLen = Object.keys(keyInfo['normal']).length;
    let path = `${EOSPATH}${addrLen}`;
    wand.request('address_getOne', { walletID: WALLETID.NATIVE, chainType: CHAINTYPE, path: path }, (err, res) => {
      if (err) {
        console.log('error:', err);
      } else {
        console.log('res:', res);
        addKey({
          start: addrLen,
          name: res.name,
          publicKey: res.address,
          path: res.path
        });
      }
    });
  }

  createAccount = () => {
    this.setState({
      showCreateAccountForm: true
    })
  }

  handleSave = row => {
  }

  handleCancel = () => {
    console.log('handleCancel');
    this.setState({
      showCreateAccountForm: false
    })
  }

  render () {
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
            <img className="totalImg" src={totalImg} alt={intl.get('EosAccount.eos')} />
            <span className="wanTex">{'EOS Accounts'}</span>
          </Col>
          <Col span={12} className="col-right">
            <Button className="creatBtn" type="primary" shape="round" size="large" onClick={this.createAccount}>{'Create Account'}</Button>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <EOSAccountList/>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <EOSTransHistory name={['normal', 'import']} />
          </Col>
        </Row>
        <CreateAccountForm showModal={this.state.showCreateAccountForm} handleCancel={this.handleCancel}/>
      </div>
    );
  }
}

export default EosAccount;

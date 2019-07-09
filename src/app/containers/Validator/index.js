import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Row, Col, message, Form } from 'antd';

import ValidatorCards from 'components/Staking/Cards/validatorCards';
import ValidatorRegister from 'components/Staking/ValidatorRegister';
import MyValidators from 'components/Staking/Validators/MyValidators';
import RegistValidatorHistory from 'components/Staking/RegistValidatorHistory';

import './index.less';
import total from 'static/image/total.png';

const ValidatorRegisterForm = Form.create({ name: 'ValidatorRegister' })(ValidatorRegister);

@inject(stores => ({
  settings: stores.session.settings,
  language: stores.languageIntl.language,
  stakingList: stores.staking.stakingList,
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class Validator extends Component {
  state = {
    validatorRegister: false,
  }

  constructor(props) {
    super(props);
    this.props.updateTransHistory();
    this.props.changeTitle('validator.title');
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      this.props.updateTransHistory();
    }, 20000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  handleStateToggle = () => {
    this.setState(state => ({ validatorRegister: !state.validatorRegister }));
  }

  handleSend = walletID => {
    if (walletID === 2) {
      message.info(intl.get('Ledger.signTransactionInLedger'))
    }
    this.handleStateToggle();
  }

  render() {
    return (
      <div className="staking">
        <Row>
          <ValidatorCards />
        </Row>
        <Row>
          <div className="historyCon">
            <Col span={12} className="col-left">
              <img src={total} /><span>{intl.get('ValidatorNode.nodeList')}</span>
            </Col>
            <Col span={12} className="col-right">
              <Button className="newValidatorBtn" type="primary" shape="round" size="large" onClick={this.handleStateToggle}>{intl.get('ValidatorNode.registValidatorNode')}</Button>
              { this.state.validatorRegister && <ValidatorRegisterForm onCancel={this.handleStateToggle} onSend={this.handleSend} /> }
            </Col>
          </div>
        </Row>
        <Row>
          <MyValidators />
        </Row>
        <Row>
          <RegistValidatorHistory name="normal" />
        </Row>
      </div>
    );
  }
}

export default Validator;
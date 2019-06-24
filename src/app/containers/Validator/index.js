import React, { Component } from 'react';
import { Button, Table, Row, Col, message, Form } from 'antd';
import intl from 'react-intl-universal';
import { observer, inject } from 'mobx-react';
import totalImg from 'static/image/wan.png';
import './index.less';
import Cards from 'components/Staking/Cards';
import Validators from 'components/Staking/Validators';
import StakingHistory from 'components/Staking/StakingHistory';
import StakeInForm from 'components/Staking/StakeInForm';
import ValidatorRegister from 'components/Staking/ValidatorRegister';
import ValidatorUpdate from 'components/Staking/ValidatorUpdate';

const DelegateInForm = Form.create({ name: 'StakeInForm' })(StakeInForm);
const ValidatorRegisterForm = Form.create({ name: 'ValidatorRegister' })(ValidatorRegister);
const ValidatorUpdateForm = Form.create({ name: 'ValidatorUpdate' })(ValidatorUpdate);



@inject(stores => ({
  settings: stores.session.settings,
  language: stores.languageIntl.language,
  stakingList: stores.staking.stakingList,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  updateStakeInfo: () => stores.staking.updateStakeInfo(),
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
}))

@observer
class Validator extends Component {
  constructor(props) {
    super(props);
    this.props.changeTitle('validator.title');
    this.state = {
      delegateIn: false,
      validatorRegister: false,
      validatorUpdate: false,
    }

    this.props.updateStakeInfo();
    this.props.updateTransHistory();
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      this.props.updateStakeInfo();
      this.props.updateTransHistory();
    }, 20000)
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  handleDelegateNew = () => {
    this.setState({ delegateIn: true });
  }

  handleValidatorRegister = () => {
    this.setState({ validatorRegister: true });
  }

  handleValidatorUpdate = () => {
    this.setState({ validatorUpdate: true });
  }

  handleCancel = () => {
    this.setState({ delegateIn: false });
    this.setState({ validatorRegister: false });
    this.setState({ validatorUpdate: false });
  }

  handleSend = (walletID) => {
    console.log('walletID', walletID)
    if (walletID == 2) {
      message.info(intl.get('Ledger.signTransactionInLedger'))
    }

    this.handleCancel();
  }

  render() {
    return (
      <div className="staking">
        <Row className="title">
          <Col span={12} className="col-left">
            {/* <img className="totalImg" src={totalImg} alt="Wanchain" />
            <span className="dashboard">{intl.get('staking.dashboard')}</span> */}
            </Col>
          <Col span={12} className="col-right">
            {
              this.props.settings.staking_advance ?
                <Button className="newValidatorBtn" type="primary" shape="round" size="large" onClick={this.handleValidatorRegister}>{intl.get('staking.validatorRegister')}</Button>
                : ''
            }
            {
              this.props.settings.staking_advance ?
                <Button className="newValidatorBtn" type="primary" shape="round" size="large" onClick={this.handleValidatorUpdate}>{intl.get('staking.validatorUpdate')}</Button>
                : ''
            }

            {/* <Button className="newValidatorBtn" type="primary" shape="round" size="large" onClick={this.handleDelegateNew}>{intl.get('staking.newDelegate')}</Button> */}
            {this.state.delegateIn
              ? <DelegateInForm onCancel={this.handleCancel} onSend={this.handleSend} />
              : ''
            }
            {this.state.validatorRegister
              ? <ValidatorRegisterForm onCancel={this.handleCancel} onSend={this.handleSend} />
              : ''
            }
            {this.state.validatorUpdate
              ? <ValidatorUpdateForm onCancel={this.handleCancel} onSend={this.handleSend} />
              : ''
            }
          </Col>
        </Row>
        <Row>
          <Col>
            <Cards />
          </Col>
        </Row>
        <Row>
          <Col>
            <Validators />
          </Col>
        </Row>
        <Row>
          <Col>
            <StakingHistory name="normal" />
          </Col>
        </Row>
      </div>
    );
  }
}

export default Validator;
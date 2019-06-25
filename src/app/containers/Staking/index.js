import React, { Component } from 'react';
import { Button, Row, Col, message, Form, Icon } from 'antd';
import intl from 'react-intl-universal';
import { observer, inject } from 'mobx-react';
import './index.less';
import Cards from 'components/Staking/Cards';
import Validators from 'components/Staking/Validators';
import StakingHistory from 'components/Staking/StakingHistory';
import StakeInForm from 'components/Staking/StakeInForm';
import total from 'static/image/total.png';

const DelegateInForm = Form.create({ name: 'StakeInForm' })(StakeInForm);


@inject(stores => ({
  settings: stores.session.settings,
  language: stores.languageIntl.language,
  stakingList: stores.staking.stakingList,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  updateStakeInfo: () => stores.staking.updateStakeInfo(),
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
}))

@observer
class Staking extends Component {
  constructor(props) {
    super(props);
    this.props.changeTitle('staking.title');
    this.state = {
      delegateInFormVisible: false
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
    this.setState({ delegateInFormVisible: true });
  }

  handleCancel = () => {
    this.setState({ delegateInFormVisible: false });
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
        <Row>
          <Col>
            <Cards />
          </Col>
        </Row>
        <Row>
          <div className="historyCon">
            <Col span={12} className="col-left">
              <img src={total} /><span>{intl.get('staking.delegateList')}</span>
            </Col>
            <Col span={12} className="col-right">
              <Button className="newValidatorBtn" type="primary" shape="round" size="large" onClick={this.handleDelegateNew}>{intl.get('staking.newDelegate')}</Button>
              <DelegateInForm visible={this.state.delegateInFormVisible} onCancel={this.handleCancel} onSend={this.handleSend} />
            </Col>
          </div>
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

export default Staking;
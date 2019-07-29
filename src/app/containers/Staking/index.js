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
  updateStakeInfo: () => stores.staking.updateStakeInfo(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
}))

@observer
class Staking extends Component {
  state = {
    delegateInFormVisible: false
  }

  constructor(props) {
    super(props);
    this.props.changeTitle('staking.title');
    this.props.updateTransHistory();
  }

  componentDidMount() {
    this.props.updateStakeInfo();
    this.timer = setInterval(() => {
      this.props.updateStakeInfo();
      this.props.updateTransHistory();
    }, 20000)
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  handleStateToggle = () => {
    this.setState(state => ({ delegateInFormVisible: !state.delegateInFormVisible }));
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
              <Button className="newValidatorBtn" type="primary" shape="round" size="large" onClick={this.handleStateToggle}>{intl.get('staking.newDelegate')}</Button>
              {this.state.delegateInFormVisible &&
                <DelegateInForm onCancel={this.handleStateToggle} onSend={this.handleStateToggle} />
              }
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
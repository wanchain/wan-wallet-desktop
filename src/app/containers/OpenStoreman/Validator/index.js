import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Row, Col, Form } from 'antd';

import GroupList from './GroupList';
import MyValidatorsList from './MyValidatorsList';
import ValidatorCards from './ValidatorCards';
import ValidatorRegister from 'components/Staking/ValidatorRegister';
import RegisterValidatorHistory from 'components/Staking/RegisterValidatorHistory';

import style from './index.less';
import total from 'static/image/total.png';

const ValidatorRegisterForm = Form.create({ name: 'ValidatorRegister' })(ValidatorRegister);

@inject(stores => ({
  language: stores.languageIntl.language,
  stakingList: stores.staking.stakingList,
  updateStakeInfo: () => stores.staking.updateStakeInfo(),
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
    this.props.updateStakeInfo();
    this.timer = setInterval(() => {
      this.props.updateTransHistory();
      this.props.updateStakeInfo();
    }, 20000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
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
              <img src={total} /><span>Group List</span>
            </Col>
          </div>
        </Row>
        <Row>
          <GroupList />
        </Row>
        <Row>
          <div className="historyCon">
            <Col span={12} className="col-left">
              <img src={total} /><span>{intl.get('ValidatorNode.nodeList')}</span>
            </Col>
          </div>
        </Row>
        <Row>
          <MyValidatorsList />
        </Row>
        <Row>
          <RegisterValidatorHistory name="normal" />
        </Row>
      </div>
    );
  }
}

export default Validator;

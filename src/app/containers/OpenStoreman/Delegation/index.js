import React, { Component } from 'react';
import { Button, Row, Col, Form } from 'antd';
import intl from 'react-intl-universal';
import { observer, inject } from 'mobx-react';

import style from './index.less';
import styleComm from 'containers/OpenStoreman/Validator/index.less';

import DelegationCards from './DelegationCards';
import OsmDelegateList from './OsmDelegateList';
import DelegationHistory from 'components/Staking/DelegationHistory';
import OsmDelegateInForm from './OsmDelegateInForm';
import total from 'static/image/total.png';

const InForm = Form.create({ name: 'OsmDelegateInForm' })(OsmDelegateInForm);

@inject(stores => ({
  settings: stores.session.settings,
  language: stores.languageIntl.language,
  stakingList: stores.staking.stakingList,
  updateStakeInfo: () => stores.staking.updateStakeInfo(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
}))

@observer
class Delegation extends Component {
  state = {
    delegateInFormVisible: false
  }

  constructor (props) {
    super(props);
    this.props.changeTitle('staking.title');
    this.props.updateTransHistory();
  }

  componentDidMount () {
    this.props.updateStakeInfo();
    this.timer = setInterval(() => {
      this.props.updateStakeInfo();
      this.props.updateTransHistory();
    }, 20000)
  }

  componentWillUnmount () {
    clearInterval(this.timer);
  }

  handleStateToggle = () => {
    this.setState(state => ({ delegateInFormVisible: !state.delegateInFormVisible }));
  }

  render () {
    return (
      <div className={style.staking}>
        <Row>
          <Col>
            <DelegationCards />
          </Col>
        </Row>
        <Row>
          <div className="historyCon">
            <Col span={12} className="col-left">
              <img src={total} /><span className={styleComm.itemTitle}>{intl.get('staking.delegateList')}</span>
            </Col>
            <Col span={12} className="col-right">
              <Button className={style.newValidatorBtn} type="primary" shape="round" size="large" onClick={this.handleStateToggle}>{intl.get('staking.newDelegate')}</Button>
              {this.state.delegateInFormVisible &&
                <InForm onCancel={this.handleStateToggle} onSend={this.handleStateToggle} />
              }
            </Col>
          </div>
        </Row>
        <Row>
          <Col>
            <OsmDelegateList />
          </Col>
        </Row>
        <Row>
          <Col>
            <DelegationHistory name="normal" />
          </Col>
        </Row>
      </div>
    );
  }
}

export default Delegation;

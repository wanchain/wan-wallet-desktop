import { Row, Col } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import style from './index.less';
import GroupList from './GroupList';
import total from 'static/image/total.png';
import StoremanCards from './StoremanCards';
import MyStoremanList from './MyStoremanList';
import OsmStakeHistory from './OsmStakeHistory';

@inject(stores => ({
  language: stores.languageIntl.language,
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  getStoremanStakeTotalIncentive: () => stores.openstoreman.getStoremanStakeTotalIncentive()
}))

@observer
class Storeman extends Component {
  constructor(props) {
    super(props);
    this.state = {
      validatorRegister: false,
    }
    this.props.updateTransHistory();
    this.props.changeTitle('Common.storeman');
  }

  update() {
    this.props.updateTransHistory();
    // this.props.getStoremanStakeTotalIncentive();
  }

  componentDidMount() {
    this.update();
    this.timer = setInterval(() => {
      this.update();
    }, 60000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {
    return (
      <div className="staking">
        <Row>
          <StoremanCards />
        </Row>
        <Row>
          <div className="historyCon">
            <Col span={12} className="col-left">
              <img src={total} /><span className={style.itemTitle}>{intl.get('Storeman.openGroupList')}</span>
            </Col>
          </div>
        </Row>
        <Row>
          <GroupList />
        </Row>
        <Row>
          <div className="historyCon">
            <Col span={12} className="col-left">
              <img src={total} /><span className={style.itemTitle}>{intl.get('Storeman.storemanList')}</span>
            </Col>
          </div>
        </Row>
        <Row>
          <MyStoremanList />
        </Row>
        <Row>
          <OsmStakeHistory name="normal" />
        </Row>
      </div>
    );
  }
}

export default Storeman;

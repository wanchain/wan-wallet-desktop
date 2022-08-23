import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { observer, inject } from 'mobx-react';
import { Row, Button, Col, Input, Avatar, Select, Pagination, message, Spin, Empty } from 'antd';

import style from './index.less';
import { dAppSort } from 'utils/helper';
import totalImg from 'static/image/wan.png';
import { DAPPORDERING, ALLCATEGORIES } from 'utils/settings';
import DAppInfo from 'components/DApp/DAppInfo';

const pageNum = 6;
@inject(stores => ({
  dAppTypes: stores.dapps.dAppTypes,
  language: stores.languageIntl.language,
  formatedDApp: stores.dapps.formatedDApp,
  showDisclaimer: stores.dapps.showDisclaimer,
  dAppsOnSideBar: stores.dapps.dAppsOnSideBar,
  addCustomDApp: obj => stores.dapps.addCustomDApp(obj),
  updateDApps: options => stores.dapps.updateDApps(options),
  setShowDisclaimer: () => stores.dapps.setShowDisclaimer(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class DAppMarket extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sortBy: DAPPORDERING[0],
      selectType: ALLCATEGORIES,
      dAppDetail: null,
      showDetail: false,
      searchbarWords: '',
      search: '',
    };
  }

  componentDidUpdate(prevProps) {
    const { language } = this.props;
    const { selectType } = this.state;
    if (language !== prevProps.language) {
      this.setState({ selectType });
    }
  }

  componentDidMount() {
    this.props.changeTitle('DApp.dAppMarket');
    this.props.updateDApps({ chainTyps: 'WAN', language: this.props.language })
  }

  handleTypeChange = value => {
    this.setState({ selectType: value })
  }

  handleSortChange = value => {
    this.setState({ sortBy: value });
  }

  handleJumpToWebsite = url => {
    wand.shell.openExternal(url);
  }

  showDetail = info => {
    this.setState({ dAppDetail: info, showDetail: true })
  }

  addDApp = info => {
    let ret = this.props.addCustomDApp({
      url: info.url,
      name: info.name,
      commit: info.summary,
      icon: `data:image/${info.iconType};base64,${info.iconData}`,
    });
    if (!ret) {
      message.error(intl.get('DApp.addFailed'));
    } else {
      message.success(intl.get('DApp.addSuccess'));
    }
  }

  closeDetail = () => {
    this.setState({ dAppDetail: null, showDetail: false })
  }

  handleSearch = e => {
    if (e.target.value === '') {
      this.setState({
        search: e.target.value,
        searchbarWords: e.target.value,
      });
    } else {
      this.setState({
        searchbarWords: e.target.value,
      });
    }
  }

  handleSearchDApp = () => {
    const { searchbarWords } = this.state;
    this.setState({
      search: searchbarWords.trim(),
    });
  }

  render() {
    const { searchbarWords } = this.state;
    const { formatedDApp, dAppTypes, dAppsOnSideBar } = this.props;
    let dAppsList;

    // Filter By Search
    dAppsList = this.state.search === '' ? formatedDApp : formatedDApp.filter(item => item.name.search(this.state.search) !== -1);
    // Filter By Type
    dAppsList = ALLCATEGORIES === this.state.selectType ? dAppsList : dAppsList.filter(item => item.type === this.state.selectType.split('.')[1]);
    // Sort By Ordering
    dAppsList = dAppSort(dAppsList, this.state.sortBy, DAPPORDERING);

    return (
      <div className="account dappStyle">
        <Row className={style.Row1 + ' title'}>
          <Col span={12} className="col-left">
            <img className="totalImg" src={totalImg} />
            <span className="wanTotal">ÐApps</span>
            <Input allowClear placeholder={intl.get('DApp.dAppSearch')} value={searchbarWords} className={style.colorInputAddr} onChange={this.handleSearch} />
            <Button type="primary" onClick={this.handleSearchDApp} shape="round" className={style.getInfoBtn}>{intl.get('popup.search')}</Button>
          </Col>
          <Col className={style.textRight} span={3} push={6} id="dAppType">
            <Select
              className='category-style'
              onChange={this.handleTypeChange}
              value={intl.get(this.state.selectType)}
              getPopupContainer={() => document.getElementById('dAppType')}
            >
              {dAppTypes.map((item, index) => {
                return <Select.Option value={item} key={index}>{intl.get(item)}</Select.Option>
              })}
            </Select>
          </Col>
          <Col className={style.textRight} span={3} push={6} id="dAppSort">
            <Select
              className='category-style'
              onChange={this.handleSortChange}
              value={intl.get(this.state.sortBy)}
              getPopupContainer={() => document.getElementById('dAppSort')}
            >
              {DAPPORDERING.map((item, index) => <Select.Option value={item} key={index}>{intl.get(item)}</Select.Option>)}
            </Select>
          </Col>
        </Row>
        <Spin spinning={!this.props.formatedDApp.length} size="large">
          {
            dAppsList.length === 0
              ? <Empty className={style.emptyStyle} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              : <div className={style.rowContent}>
                <Row className={style.Row2 + ' title'} type="flex">
                  {
                    dAppsList.map((item, index) =>
                      <Col span={7} className={style.cardDApp + ' col-left'} key={index}>
                        <Row type="flex" justify="center" align="middle">
                          <Col span={5} style={{ textAlign: 'center' }}><Avatar size="large" className={style.dappIcon} src={`data:image/${item.iconType};base64,${item.iconData}`} /></Col>
                          <Col span={19}>
                            <Row>
                              <Col span={12}><span className={style.dAppName}>{item.name}</span></Col>
                              <Col span={6} offset={4}><Button className={style.createBtnType} shape="round" size="small">{intl.get(`DApp.${item.type}`)}</Button></Col>
                            </Row>
                            <Row className={style.dAppSummary}>
                              <Col><span>{item.summary}</span></Col>
                            </Row>
                            <Row className={style.dAppUrl}>
                              <Col><a onClick={() => this.handleJumpToWebsite(item.url)}>{item.url}</a></Col>
                            </Row>
                            <Row>
                              <Col span={6}><Button onClick={() => this.showDetail(item)} className={style.createBtn} type="primary" size="small">{intl.get('DApp.dAppDetail')}</Button></Col>
                              <Col span={6}><Button disabled={dAppsOnSideBar.find(v => v.url === item.url)} onClick={() => this.addDApp(item)} className={style.createBtn} type="primary" size="small">
                                {dAppsOnSideBar.find(v => v.url === item.url) ? intl.get('DApp.addedButton') : intl.get('DApp.addButton')}</Button></Col>
                              <Col span={12} style={{ textAlign: 'right' }}><span className={style.dAppCreator}>{intl.get('DApp.poweredBy')}{item.creator}</span></Col>
                            </Row>
                          </Col>
                        </Row>
                      </Col>
                    )
                  }
                </Row>
              </div>
          }
        </Spin>
        {this.state.showDetail && <DAppInfo info={this.state.dAppDetail} handleClose={this.closeDetail} />}
      </div>
    );
  }
}

export default DAppMarket;

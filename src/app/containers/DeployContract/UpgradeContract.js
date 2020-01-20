import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Input, message, Divider, Icon, Select, Row, Col, Modal } from 'antd';

import style from './index.less';
import { WANPATH } from 'utils/settings';
import TableShowing from 'componentUtils/TableShowing';

import { getInfoByAddress } from 'utils/helper';

const btnStyle = { marginLeft: '10px' }
const { Option } = Select;

const children = [];
const upgradeType = ['lib', 'tokenManager', 'htlc', 'storemanGroupAdmin'];
for (let i = 0; i < upgradeType.length; i++) {
  children.push(<Option key={upgradeType[i]}>{upgradeType[i]}</Option>);
}

@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  upgradeAddrPath: stores.deployContract.upgradeAddrPath,
  upgradeComponents: stores.deployContract.upgradeComponents,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setUpgradeAddrPath: val => stores.deployContract.setUpgradeAddrPath(val),
  setUpgradeComponents: val => stores.deployContract.setUpgradeComponents(val),
}))

@observer
class UpgradeContract extends Component {
  state = {
    dependencyStatus: false,
    upgradeAddr: this.props.upgradeAddrPath.addr,
    upgradeAddrNonce: '',
    upgradeContractStatus: false,
    libAddressStatus: false,
    contractAddressStatus: false,
    upgradeContractLoading: false,
    upgradeContractAddressStatus: false,
    upgradeContractFile: false,
    upgradeDependencyStatus: false,
    upgradeDependencyLoading: false,
    buildUpgradeDependencyStatus: false,
    buildUpgradeDependencyLoading: false,
    buildUpgradeContractStatus: false,
    buildUpgradeContractLoading: false,
    upgradeContractFileShowing: false,
    upgradeContractContent: [],
    upgradeDependencyFileShowing: false,
    upgradeDependencyContent: [],
    upgradeContractAddressFileShowing: false,
    upgradeContractAddressContent: []
  }

  constructor (props) {
    super(props);
    this.props.changeTitle('menuConfig.upgradeContract');
  }

  handleGetInfo = type => {
    wand.request('offline_openFile', { type }, (err, data) => {
      if (err) {
        message.warn('Import File Error, Please insert it again')
        return;
      }
      if (data.ret) {
        message.success('Success')
        this.setState({ [`${type}Status`]: true });
        if (type !== 'contractAddress' && data.openFileContent && data.openFileContent.length !== 0) {
          this.setState({ [`${type}FileShowing`]: true, [`${type}Content`]: data.openFileContent })
        }
      }
    })
  }

  handleSelectAddr = (value, type) => {
    const { wanAddrInfo, setUpgradeAddrPath } = this.props;
    if (value === undefined) {
      value = ''
    }
    this.setState({ [type]: value })
    switch (type) {
      case 'upgradeAddr':
        let upgradeAddrInfo = getInfoByAddress(value, ['path'], wanAddrInfo);
        setUpgradeAddrPath({ walletId: upgradeAddrInfo.type === 'normal' ? 1 : 5, path: `${WANPATH}${upgradeAddrInfo.path}`, addr: value });
        break;
    }
  }

  handleBuildContract = type => {
    const { wanAddrInfo, setUpgradeAddrPath, upgradeAddrPath, upgradeComponents } = this.props;
    const { upgradeAddr, upgradeAddrNonce } = this.state;
    this.setState({ [`${type}Loading`]: true });

    if (upgradeComponents.length === 0) {
      this.setState({ [`${type}Loading`]: false });
      message.warn('Please select the contract components to upgrade!')
      return;
    }

    if (type === 'buildUpgradeContract') {
      if (![upgradeAddr, upgradeAddrNonce].includes('')) {
        let obj = {
          [upgradeAddr]: upgradeAddrNonce
        };
        let upgradeAddrInfo = getInfoByAddress(upgradeAddr, ['path'], wanAddrInfo);
        wand.request('offline_updateNonce', obj, (err, data) => {
          if (err) {
            this.setState({ [`${type}Loading`]: false });
            return;
          };
          let path = { walletId: upgradeAddrInfo.type === 'normal' ? 1 : 5, path: `${WANPATH}${upgradeAddrInfo.path}`, addr: upgradeAddrInfo.addr };
          setUpgradeAddrPath(path);
          wand.request('offline_buildContract', { type, data: path }, (err, data) => {
            if (err || !data.ret) {
              this.setState({ [`${type}Loading`]: false });
              message.warn('Build Failures!')
              return;
            }
            this.setState({ [`${type}Loading`]: false, [`${type}Status`]: true });
            message.success('Build Success!')
          })
        })
      } else {
        message.warn('Please insert correct data');
        this.setState({ [`${type}Loading`]: false });
      }
    } else {
      if (upgradeAddrPath !== undefined && Object.keys(upgradeAddrPath).length === 0) {
        message.warn('Please select an address to build/deploy the transactions!');
        return;
      }
      wand.request('offline_buildContract', { type, data: upgradeAddrPath }, (err, data) => {
        if (err || !data.ret) {
          this.setState({ [`${type}Loading`]: false });
          message.warn('Build Failures!')
          return;
        }
        this.setState({ [`${type}Loading`]: false, [`${type}Status`]: true });
        message.success('Build Success!')
      })
    }
  }

  handleDownloadFile = type => {
    wand.request('offline_downloadFile', { type }, (err, data) => {
      if (err) {
        message.warn('Download failed. Please try again!')
        return;
      }
      message.success('Download Success!')
    })
  }

  deployContractAction = type => {
    this.setState({ [`${type}Loading`]: true });
    wand.request('offline_deployContractAction', { type }, (err, data) => {
      if (err || !data.ret) {
        let content = err ? err.desc : 'Error occurred. Please restart!';
        Modal.error({ content });
        this.setState({ [`${type}Loading`]: false });
        return;
      }
      message.success('Success!');
      if (type === 'upgradeContract') {
        this.setState({ [`${type}File`]: true, [`${type}Loading`]: false });
      } else {
        this.setState({ dependencyStatus: true, [`${type}Loading`]: false });
      }
    })
  }

  handleUpgradeType = types => {
    wand.request('offline_upgradeComponents', { components: types }, (err, data) => {
      if (err && types.length !== 0) {
        message.warn('Select Upgrade Components Failures!')
        return;
      };
      this.props.setUpgradeComponents(types)
    })
  }

  render () {
    const { contractAddressStatus, dependencyStatus, upgradeContractAddressContent, upgradeContractAddressFileShowing, upgradeDependencyFileShowing, upgradeDependencyContent, upgradeContractFileShowing, upgradeContractContent, upgradeDependencyLoading, upgradeDependencyStatus, buildUpgradeDependencyStatus, buildUpgradeDependencyLoading, upgradeContractAddressStatus, libAddressStatus, buildUpgradeContractLoading, buildUpgradeContractStatus, upgradeContractStatus, upgradeContractFile, upgradeContractLoading, setDependencyImportFile } = this.state;
    const { upgradeComponents, wanAddrInfo, upgradeAddrPath } = this.props;
    let addr = Object.keys(wanAddrInfo.normal).concat(Object.keys(wanAddrInfo.import));

    return (
      <React.Fragment>
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>1_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Data Preparation</h3>
          <div>
            <h5 className={style.fontText + ' ' + style.inlineBlock}>Import Deployment File</h5>
            <Button type="primary" onClick={() => this.handleGetInfo('libAddress')}>Import libAddress file</Button>
            { libAddressStatus && <Icon type="check-circle" theme="twoTone" twoToneColor="#52c41a" /> }
            <Button type="primary" onClick={() => this.handleGetInfo('contractAddress')}>Import contractAddress file</Button>
            { contractAddressStatus && <Icon type="check-circle" theme="twoTone" twoToneColor="#52c41a" /> }
          </div>
          <div className={style.selectStyle}>
            <h5 className={style.fontText + ' ' + style.inlineBlock}>Select Address</h5>
            <Select
              autoFocus
              className="colorInput"
              optionLabelProp="value"
              optionFilterProp="children"
              defaultValue={upgradeAddrPath.addr}
              onChange={value => this.handleSelectAddr(value, 'upgradeAddr')}
              placeholder="Select contract owner"
              dropdownMatchSelectWidth={false}
            >
              {
                addr.map((item, index) =>
                  <Option value={item} key={index}>
                    <Row className="ant-row-flex">
                      <Col>{item}</Col>&nbsp;
                    </Row>
                  </Option>)
              }
            </Select>
            <Input onChange={e => this.handleSelectAddr(e.target.value, 'upgradeAddrNonce')} className={style.nonceInput} placeholder="Input Nonce" size="small"/>
          </div>
          <div className={style.selectStyle}>
            <h5 className={style.fontText + ' ' + style.inlineBlock}>Select Upgrade Components</h5>
            <Select
              showArrow
              mode="multiple"
              className='colorInput'
              defaultValue={upgradeComponents}
              placeholder="Select Upgrade Type"
              onChange={this.handleUpgradeType}
            >
              {children}
            </Select>
          </div>
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>2_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Build Upgrade TokenManager/HTLC/StoremanGroupAdmin Contracts</h3>
          <Button type="primary" style={btnStyle} loading={buildUpgradeContractLoading} onClick={() => this.handleBuildContract('buildUpgradeContract')}>Build</Button>
          { buildUpgradeContractStatus && <Button type="primary" style={btnStyle} onClick={() => this.handleDownloadFile(['txData', 'upgradeContract(step2).dat'])}>Download</Button> }
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>3_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Upgrade TokenManager/HTLC/StoremanGroupAdmin Contracts</h3>
          <Button type="primary" style={btnStyle} onClick={() => this.handleGetInfo('upgradeContract')}>Import upgradeContract(step2) File</Button>
          { upgradeContractStatus && <Button type="primary" style={btnStyle} loading={upgradeContractLoading} onClick={() => this.deployContractAction('upgradeContract')}>Deploy</Button> }
          { upgradeContractFile && <Button type="primary" style={btnStyle} onClick={() => this.handleDownloadFile(['upgradeContractAddress(step3).dat'])}>Download</Button> }
          { upgradeContractFileShowing && <TableShowing type="deployContract" data={upgradeContractContent}/> }
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>4_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Build Upgrade TokenManager/HTLC/StoremanGroupAdmin Dependency</h3>
          <Button type="primary" style={btnStyle} onClick={() => this.handleGetInfo('upgradeContractAddress')}>Import upgradeContractAddress(step3) File</Button>
          { upgradeContractAddressStatus && <Button type="primary" style={btnStyle} loading={buildUpgradeDependencyLoading} onClick={() => this.handleBuildContract('buildUpgradeDependency')}>Build</Button> }
          { buildUpgradeDependencyStatus && <Button type="primary" style={btnStyle} onClick={() => this.handleDownloadFile(['txData', 'upgradeDependency(step4).dat'])}>Download</Button> }
          { upgradeContractAddressFileShowing && <TableShowing type="upgradeContractAddress" data={upgradeContractAddressContent}/> }
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>5_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Upgrade TokenManager/HTLC/StoremanGroupAdmin Dependency</h3>
          <Button type="primary" style={btnStyle} onClick={() => this.handleGetInfo('upgradeDependency')}>Import upgradeDependency(step4) File</Button>
          { upgradeDependencyStatus && <Button type="primary" style={btnStyle} loading={upgradeDependencyLoading} onClick={() => this.deployContractAction('upgradeDependency')}>Deploy</Button> }
          { dependencyStatus && <Icon type="check-circle" theme="twoTone" twoToneColor="#52c41a" /> }
          { upgradeDependencyFileShowing && <TableShowing type="upgradeDependency" data={upgradeDependencyContent}/> }
        </div>
      </React.Fragment>
    );
  }
}

export default UpgradeContract;

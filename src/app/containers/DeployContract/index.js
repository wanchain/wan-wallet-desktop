import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Input, message, Divider, Icon, Tooltip, Select, Row, Col } from 'antd';

import style from './index.less';
import { fromWei } from 'utils/support';
import { WANPATH } from 'utils/settings';

import { deserializeWanTx, getInfoByAddress } from 'utils/helper';

@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  sgAddrPath: stores.deployContract.sgAddrPath,
  contractOwnerPath: stores.deployContract.contractOwnerPath,
  setSgAddrPath: val => stores.deployContract.setSgAddrPath(val),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setContractOwnerPath: val => stores.deployContract.setContractOwnerPath(val),
}))

@observer
class DeployContract extends Component {
  state = {
    contractOwner: '',
    contractOwnerNonce: '',
    deployContractStatus: false,
    contractAddressStatus: false,
    deployContractLoading: false,
    setDependencyImportStatus: false,
    deployContractFile: false,
    setDependencyStatus: false,
    setDependencyLoading: false,
    buildSetDependencyStatus: false,
    buildSetDependencyLoading: false,
    buildDeployContractStatus: false,
    buildDeployContractLoading: false,
  }

  constructor (props) {
    super(props);
    this.props.changeTitle('menuConfig.deployContract');
  }

  handleGetInfo = type => {
    let action;
    switch (type) {
      case 'libAddress':
      case 'contractAddress':
      case 'setDependencyImport':
        action = 'contractAddress';
        break;
      default:
        action = type;
        break;
    }
    wand.request('offline_openFile', { type: action }, (err, data) => {
      if (err) {
        message.warn('Import File Error, Please insert it again')
        return;
      }
      if (data) {
        message.success('Success')
        this.setState({ [`${type}Status`]: true })
      }
    })
  }

  handleSelectAddr = (value, type) => {
    const { wanAddrInfo } = this.props;
    if (value === undefined) {
      value = ''
    }
    this.setState({ [type]: value })
    switch (type) {
      case 'contractOwner':
        let contractOwnerInfo = getInfoByAddress(value, ['path'], wanAddrInfo);
        this.props.setContractOwnerPath({ walletId: contractOwnerInfo.type === 'normal' ? 1 : 5, path: `${WANPATH}${contractOwnerInfo.path}` });
        break;
    }
  }

  handleBuildContract = (type, data) => {
    this.setState({ [`${type}Loading`]: true });
    if (data !== undefined && Object.keys(data).length === 0) {
      message.warn('Please select an address to build/deploy the transactions!');
      return;
    }

    if (type === 'buildDeployContract') {
      const { wanAddrInfo, setContractOwnerPath } = this.props;
      const { contractOwner, contractOwnerNonce } = this.state;
      if (![contractOwner, contractOwnerNonce].includes('')) {
        let obj = {
          [contractOwner]: contractOwnerNonce
        };
        let contractOwnerInfo = getInfoByAddress(contractOwner, ['path'], wanAddrInfo);
        wand.request('offline_updateNonce', obj, (err, data) => {
          if (err) {
            this.setState({ [`${type}Loading`]: false });
            return;
          };
          setContractOwnerPath({ walletId: contractOwnerInfo.type === 'normal' ? 1 : 5, path: `${WANPATH}${contractOwnerInfo.path}` });
          wand.request('offline_buildContract', { type, data }, (err, ret) => {
            if (err) {
              this.setState({ [`${type}Loading`]: false });
              message.success('Build Failures!')
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
      wand.request('offline_buildContract', { type, data }, (err, ret) => {
        if (err) {
          this.setState({ [`${type}Loading`]: false });
          message.success('Build Failures!')
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
      if (err) {
        message.warn(err.desc);
        this.setState({ [`${type}Loading`]: false });
        return;
      }
      message.success('Success!');
      if (!['setDependency'].includes(type)) {
        this.setState({ [`${type}File`]: true, [`${type}Loading`]: false });
      } else {
        this.setState({ [`${type}Loading`]: false });
      }
    })
  }

  render () {
    const { setDependencyLoading, setDependencyStatus, buildSetDependencyStatus, buildSetDependencyLoading, setDependencyImportStatus, contractAddressStatus, buildDeployContractLoading, buildDeployContractStatus, deployContractStatus, deployContractFile, deployContractLoading, setDependencyImportFile } = this.state;
    const { wanAddrInfo, contractOwnerPath } = this.props;
    let addr = Object.keys(wanAddrInfo.normal).concat(Object.keys(wanAddrInfo.import));

    return (
      <React.Fragment>
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>1_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Data Preparation</h3>
          <div>
            <h5 className={style.fontText + ' ' + style.inlineBlock}>Import Deployment Library File</h5>
            <Button type="primary" onClick={() => this.handleGetInfo('libAddress')}>Import</Button>
            { contractAddressStatus && <Icon type="check-circle" theme="twoTone" twoToneColor="#52c41a" /> }
          </div>
          <div>
            <h5 className={style.fontText + ' ' + style.inlineBlock}>Select Address</h5>
            <Select
              autoFocus
              className="colorInput"
              optionLabelProp="value"
              optionFilterProp="children"
              onChange={value => this.handleSelectAddr(value, 'contractOwner')}
              placeholder="Select contract owner"
              dropdownMatchSelectWidth={false}
            >
              {
                addr.map((item, index) =>
                  <Select.Option value={item} key={index}>
                    <Row className="ant-row-flex">
                      <Col>{item}</Col>&nbsp;
                    </Row>
                  </Select.Option>)
              }
            </Select>
            <Input onChange={e => this.handleSelectAddr(e.target.value, 'contractOwnerNonce')} className={style.nonceInput} placeholder="Input Nonce" size="small"/>
          </div>
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>2_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Build TokenManager/HTLC/StoremanGroupAdmin Contracts</h3>
          <Button type="primary" loading={buildDeployContractLoading} onClick={() => this.handleBuildContract('buildDeployContract')}>Build</Button>
          { buildDeployContractStatus && <Button type="primary" onClick={() => this.handleDownloadFile(['txData', 'deployContract.dat'])}>Download</Button> }
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>3_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Deploy TokenManager/HTLC/StoremanGroupAdmin Contracts</h3>
          <Button type="primary" onClick={() => this.handleGetInfo('deployContract')}>Import</Button>
          { deployContractStatus && <Button type="primary" loading={deployContractLoading} onClick={() => this.deployContractAction('deployContract')}>Deploy</Button> }
          { deployContractFile && <Button type="primary" onClick={() => this.handleDownloadFile(['contractAddress.json'])}>Download</Button> }
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>4_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Build TokenManager/HTLC/StoremanGroupAdmin Dependency</h3>
          <Button type="primary" onClick={() => this.handleGetInfo('setDependencyImport')}>Import</Button>
          { setDependencyImportStatus && <Button type="primary" loading={buildSetDependencyLoading} onClick={() => this.handleBuildContract('buildSetDependency', contractOwnerPath)}>Build</Button> }
          { buildSetDependencyStatus && <Button type="primary" onClick={() => this.handleDownloadFile(['txData', 'setDependency.dat'])}>Download</Button> }
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>5_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Set TokenManager/HTLC/StoremanGroupAdmin Dependency</h3>
          <Button type="primary" onClick={() => this.handleGetInfo('setDependency')}>Import</Button>
          { setDependencyStatus && <Button type="primary" loading={setDependencyLoading} onClick={() => this.deployContractAction('setDependency')}>Deploy</Button> }
        </div>
      </React.Fragment>
    );
  }
}

export default DeployContract;

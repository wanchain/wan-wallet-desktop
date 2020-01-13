import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Input, message, Divider, Icon, Select, Row, Col } from 'antd';

import style from './index.less';
import { WANPATH } from 'utils/settings';
import TableShowing from 'componentUtils/TableShowing';

import { getInfoByAddress } from 'utils/helper';

const btnStyle = { marginLeft: '10px' }
@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  contractOwnerPath: stores.deployContract.contractOwnerPath,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setContractOwnerPath: val => stores.deployContract.setContractOwnerPath(val),
}))

@observer
class DeployContract extends Component {
  state = {
    contractOwner: '',
    contractOwnerNonce: '',
    deployContractStatus: false,
    libAddressStatus: false,
    deployContractLoading: false,
    setDependencyImportStatus: false,
    deployContractFile: false,
    setDependencyStatus: false,
    setDependencyLoading: false,
    buildSetDependencyStatus: false,
    buildSetDependencyLoading: false,
    buildDeployContractStatus: false,
    buildDeployContractLoading: false,
    deployContractFileShowing: false,
    deployContractFileContent: [],
    setDependencyFileShowing: false,
    setDependencyContent: [],
    setDependencyImportFileShowing: false,
    setDependencyImportContent: []
  }

  constructor (props) {
    super(props);
    this.props.changeTitle('menuConfig.deployContract');
  }

  handleGetInfo = type => {
    let action;
    switch (type) {
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
      if (data.ret) {
        message.success('Success')
        this.setState({ [`${type}Status`]: true });
        if (data.openFileContent && data.openFileContent.length !== 0) {
          this.setState({ [`${type}FileShowing`]: true, [`${type}Content`]: data.openFileContent })
        }
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

  handleBuildContract = type => {
    const { wanAddrInfo, setContractOwnerPath, contractOwnerPath } = this.props;
    const { contractOwner, contractOwnerNonce } = this.state;
    this.setState({ [`${type}Loading`]: true });

    if (type === 'buildDeployContract') {
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
          let path = { walletId: contractOwnerInfo.type === 'normal' ? 1 : 5, path: `${WANPATH}${contractOwnerInfo.path}` };
          setContractOwnerPath(path);
          wand.request('offline_buildContract', { type, data: path }, (err, ret) => {
            if (err || !ret.ret) {
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
      if (contractOwnerPath !== undefined && Object.keys(contractOwnerPath).length === 0) {
        message.warn('Please select an address to build/deploy the transactions!');
        return;
      }
      wand.request('offline_buildContract', { type, data: contractOwnerPath }, (err, ret) => {
        if (err || !ret.ret) {
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
    const { setDependencyImportContent, setDependencyImportFileShowing, setDependencyFileShowing, setDependencyContent, deployContractFileShowing, deployContractContent, setDependencyLoading, setDependencyStatus, buildSetDependencyStatus, buildSetDependencyLoading, setDependencyImportStatus, libAddressStatus, buildDeployContractLoading, buildDeployContractStatus, deployContractStatus, deployContractFile, deployContractLoading, setDependencyImportFile } = this.state;
    const { wanAddrInfo } = this.props;
    let addr = Object.keys(wanAddrInfo.normal).concat(Object.keys(wanAddrInfo.import));

    return (
      <React.Fragment>
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>1_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Data Preparation</h3>
          <div>
            <h5 className={style.fontText + ' ' + style.inlineBlock}>Import Deployment Library File</h5>
            <Button type="primary" onClick={() => this.handleGetInfo('libAddress')}>Import libAddress file</Button>
            { libAddressStatus && <Icon type="check-circle" theme="twoTone" twoToneColor="#52c41a" /> }
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
          <Button type="primary" style={btnStyle} loading={buildDeployContractLoading} onClick={() => this.handleBuildContract('buildDeployContract')}>Build</Button>
          { buildDeployContractStatus && <Button type="primary" style={btnStyle} onClick={() => this.handleDownloadFile(['txData', 'deployContract(step2).dat'])}>Download</Button> }
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>3_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Deploy TokenManager/HTLC/StoremanGroupAdmin Contracts</h3>
          <Button type="primary" style={btnStyle} onClick={() => this.handleGetInfo('deployContract')}>Import deployContract(step2) File</Button>
          { deployContractStatus && <Button type="primary" style={btnStyle} loading={deployContractLoading} onClick={() => this.deployContractAction('deployContract')}>Deploy</Button> }
          { deployContractFile && <Button type="primary" style={btnStyle} onClick={() => this.handleDownloadFile(['contractAddress(step3).json'])}>Download</Button> }
          { deployContractFileShowing && <TableShowing type="deployContract" data={deployContractContent}/> }
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>4_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Build TokenManager/HTLC/StoremanGroupAdmin Dependency</h3>
          <Button type="primary" style={btnStyle} onClick={() => this.handleGetInfo('setDependencyImport')}>Import contractAddress(step3) File</Button>
          { setDependencyImportStatus && <Button type="primary" style={btnStyle} loading={buildSetDependencyLoading} onClick={() => this.handleBuildContract('buildSetDependency')}>Build</Button> }
          { buildSetDependencyStatus && <Button type="primary" style={btnStyle} onClick={() => this.handleDownloadFile(['txData', 'setDependency(step4).dat'])}>Download</Button> }
          { setDependencyImportFileShowing && <TableShowing type="setDependencyImport" data={setDependencyImportContent}/> }
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>5_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Set TokenManager/HTLC/StoremanGroupAdmin Dependency</h3>
          <Button type="primary" style={btnStyle} onClick={() => this.handleGetInfo('setDependency')}>Import setDependency(step4) File</Button>
          { setDependencyStatus && <Button type="primary" style={btnStyle} loading={setDependencyLoading} onClick={() => this.deployContractAction('setDependency')}>Deploy</Button> }
          { setDependencyFileShowing && <TableShowing type="setDependency" data={setDependencyContent}/> }
        </div>
      </React.Fragment>
    );
  }
}

export default DeployContract;

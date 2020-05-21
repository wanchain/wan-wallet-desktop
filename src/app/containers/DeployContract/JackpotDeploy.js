import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Input, message, Divider, Icon, Select, Row, Col, Modal } from 'antd';

import style from './index.less';
import { WANPATH } from 'utils/settings';
import TableShowing from 'componentUtils/TableShowing';

import { getInfoByAddress } from 'utils/helper';

const btnStyle = { marginLeft: '10px', width: '330px' }
const btnStyle2 = { marginLeft: '10px', marginTop: '20px', width: '330px' }
const btnStyle3 = { marginLeft: '10px', width: '120px' }

@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  contractOwnerPath: stores.deployContract.contractOwnerPath,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setContractOwnerPath: val => stores.deployContract.setContractOwnerPath(val),
}))

@observer
class JackpotDeploy extends Component {
  state = {
    deployStatus: false,
    contractOwner: this.props.contractOwnerPath.addr,
    contractOwnerNonce: '',
    loading: {
      buildJackPotContract: false,
      deployJackPotContract: false,
      buildJackPotConfig: false,
      sendJackPotConfig: false,
    },
    disableAction: {
      buildJackPotContract: false,
      deployJackPotContract: true,
      buildJackPotConfig: true,
      sendJackPotConfig: true,
    },
    disableDownload: {
      buildJackPotContract: true,
      deployJackPotContract: true,
      buildJackPotConfig: true,
      sendJackPotConfig: true,
    },
  }

  constructor(props) {
    super(props);
    this.props.changeTitle('menuConfig.jackpotDeploy');
  }

  handleImportFile = (type, step = 0) => {
    wand.request('offline_jackpotOpenFile', { type }, (err, data) => {
      if (err || !data.success) {
        message.warn('Import File Error, Please insert it again')
        return;
      }
      if (data.success) {
        message.success('Success');
        this.enableButton(type, 0, step);
      }
    })
  }

  handleSelectAddr = (value, type) => {
    const { wanAddrInfo, setContractOwnerPath } = this.props;
    if (value === undefined) {
      value = ''
    }
    this.setState({ [type]: value })
    switch (type) {
      case 'contractOwner':
        let contractOwnerInfo = getInfoByAddress(value, ['path'], wanAddrInfo);
        setContractOwnerPath({ walletId: contractOwnerInfo.type === 'normal' ? 1 : 5, path: `${WANPATH}${contractOwnerInfo.path}`, addr: value });
        break;
    }
  }

  handleDownloadFile = type => {
    wand.request('offline_jackpotDownloadFile', { type }, (err, data) => {
      if (err) {
        message.warn('Download failed. Please try again!');
        return;
      }
      message.success('Download Success!')
    })
  }

  enableButton = (type, id, step) => {
    console.log(type, id, step);
    let disableAction = Object.assign({}, this.state.disableAction);
    let disableDownload = Object.assign({}, this.state.disableDownload);
    let target = '';
    if (type.includes('.json')) {
      switch (step) {
        case 2: target = 'deployJackPotContract'; break;
        case 3: target = 'buildJackPotConfig'; break;
        case 4: target = 'sendJackPotConfig'; break;
      }
    } else {
      target = type;
    }

    if (id === 0) {
      disableAction[target] = false;
      this.setState({ disableAction });
    } else {
      disableDownload[target] = false;
      this.setState({ disableDownload });
    }
  }

  handleAction = type => {
    const { wanAddrInfo, setContractOwnerPath, contractOwnerPath } = this.props;
    const { contractOwner, contractOwnerNonce } = this.state;
    let loading = Object.assign({}, this.state.loading);
    loading[type] = true;
    this.setState({ loading });

    if (type.includes('build')) {
      if (![contractOwner, contractOwnerNonce].includes('')) {
        let obj = {
          [contractOwner]: contractOwnerNonce
        };
        let contractOwnerInfo = getInfoByAddress(contractOwner, ['path'], wanAddrInfo);
        wand.request('offline_jackpotUpdateNonce', obj, (err, data) => {
          if (err) {
            loading[type] = false;
            this.setState({ loading });
            return;
          };
          let path = { walletId: contractOwnerInfo.type === 'normal' ? 1 : 5, path: `${WANPATH}${contractOwnerInfo.path}`, addr: contractOwnerInfo.addr };
          setContractOwnerPath(path);
          wand.request('offline_jackpotAction', { type, data: path }, (err, data) => {
            console.log(err, data);
            if (err || !data) {
              message.warn('Failed!', 5);
              loading[type] = false;
              this.setState({ loading: loading });
              return;
            }
            message.success('Success!', 5);
            loading[type] = false;
            this.setState({ loading });
            this.enableButton(type, 1);
          })
        })
      } else {
        message.warn('Please insert correct data or select Address.');
        loading[type] = false;
        this.setState({ loading });
      }
    } else {
      wand.request('offline_jackpotAction', { type, data: '' }, (err, data) => {
        console.log(err, data);
        if (err || !data) {
          message.warn('Failed!', 5);
          loading[type] = false;
          this.setState({ loading: loading });
          if (type.includes('verify')) {
            this.setState({ verifyState: 2 });
          }
          return;
        }
        message.success('Success!', 5);
        loading[type] = false;
        this.setState({ loading });
        this.enableButton(type, 1);
      })
    }
  }

  render() {
    const { wanAddrInfo, contractOwnerPath } = this.props;
    let addr = Object.keys(wanAddrInfo.normal).concat(Object.keys(wanAddrInfo.import));

    const { loading, disableAction, disableDownload } = this.state;

    return (
      <React.Fragment>
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 1_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Build Jackpot Contract / Delegate, Proxy</h3>
          <div style={{ margin: '20px 0px 20px 0px' }}>
            <h5 className={style.fontText + ' ' + style.inlineBlock} style={{ width: '150px' }}>Select Admin Address:</h5>
            <Select
              autoFocus
              className="colorInput"
              optionLabelProp="value"
              optionFilterProp="children"
              defaultValue={contractOwnerPath.addr}
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
            <Input style={{ marginLeft: '20px', textAlign: 'center' }} onChange={e => this.handleSelectAddr(e.target.value, 'contractOwnerNonce')} className={style.nonceInput} placeholder="Input Nonce" size="small" />
          </div>
          <div>
            <Button type="primary" style={btnStyle3} loading={loading['buildJackPotContract']} onClick={() => this.handleAction('buildJackPotContract')}>Build</Button>
            {<Button disabled={disableDownload['buildJackPotContract']} type="primary" style={btnStyle3} onClick={() => this.handleDownloadFile(['buildJackPotContract(step1).json'])}>Download</Button>}
          </div>
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 2_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Deploy Jackpot Contract / Delegate, Proxy</h3>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleImportFile('buildJackPotContract(step1).json', 2)}>Import buildJackPotContract(step1).json file</Button>
          {<Button disabled={disableAction['deployJackPotContract']} type="primary" style={btnStyle3} loading={loading['deployJackPotContract']} onClick={() => this.handleAction('deployJackPotContract')}>Deploy</Button>}
          {<Button disabled={disableDownload['deployJackPotContract']} type="primary" style={btnStyle3} onClick={() => this.handleDownloadFile(['deployJackPotContract(step2).json'])}>Download</Button>}
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 3_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Build Jackpot Config</h3>
          <div style={{ margin: '20px 0px 20px 0px' }}>
            <h5 className={style.fontText + ' ' + style.inlineBlock} style={{ width: '150px' }}>Select Admin Address:</h5>
            <Select
              autoFocus
              className="colorInput"
              optionLabelProp="value"
              optionFilterProp="children"
              defaultValue={contractOwnerPath.addr}
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
            <Input style={{ marginLeft: '20px', textAlign: 'center' }} onChange={e => this.handleSelectAddr(e.target.value, 'contractOwnerNonce')} className={style.nonceInput} placeholder="Input Nonce" size="small" />
          </div>
          <div>
            <Button type="primary" style={btnStyle} onClick={() => this.handleImportFile('deployJackPotContract(step2).json', 3)}>Import deployJackPotContract(step2).json file</Button>
            <Button type="primary" style={btnStyle2} onClick={() => this.handleImportFile('jackpot-offline-config.json', 4)}>Import jackpot-offline-config.json file</Button>
            <Button disabled={disableAction['buildJackPotConfig']} type="primary" style={btnStyle3} loading={loading['buildJackPotConfig']} onClick={() => this.handleAction('buildJackPotConfig')}>Build</Button>
            {<Button disabled={disableDownload['buildJackPotConfig']} type="primary" style={btnStyle3} onClick={() => this.handleDownloadFile(['buildJackPotConfig(step3).json'])}>Download</Button>}
          </div>
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 4_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Send Jackpot Config</h3>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleImportFile('buildJackPotConfig(step3).json', 4)}>Import buildJackPotConfig(step3).json file</Button>
          {<Button disabled={disableAction['sendJackPotConfig']} type="primary" style={btnStyle3} loading={loading['sendJackPotConfig']} onClick={() => this.handleAction('sendJackPotConfig')}>Send</Button>}
        </div>
      </React.Fragment>
    );
  }
}

export default JackpotDeploy;

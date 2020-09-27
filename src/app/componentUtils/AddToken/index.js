import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Modal, Input, Button, message, Descriptions } from 'antd';

import style from './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
  tokensList: stores.tokens.tokensList,
  addCustomToken: tokenInfo => stores.tokens.addCustomToken(tokenInfo)
}))

@observer
class AddToken extends Component {
  state = {
    showConfirm: false,
    tokenAddr: '',
    tokenInfo: null,
    btnLoading: false,
    loading: false
  }

  handleSearch = () => {
    this.setState({ loading: true });
    if (this.state.tokenAddr.length === 0) {
      message.warn(intl.get('Config.checkTokenAddr'));
      return;
    }
    wand.request('crossChain_getTokenInfo', { scAddr: this.state.tokenAddr, chain: this.props.chain }, (err, ret) => {
      if (err) {
        console.log('crossChain_getTokenInfo:', err);
        this.setState({ loading: false })
        message.warn(intl.get('Config.checkTokenAddr'))
        return;
      }
      if (ret.symbol !== '') {
        this.setState({
          showConfirm: true,
          tokenInfo: ret
        });
      } else {
        message.warn(intl.get('Config.checkTokenAddr'))
      }
      this.setState({ loading: false })
    })
  }

  handleChange = e => {
    this.setState({
      tokenAddr: e.target.value
    })
  }

  handleAddToken = () => {
    const { tokensList, addCustomToken, chain } = this.props;
    const { tokenAddr, tokenInfo } = this.state;
    const key = `${Number('0x80000000'.toString(10)) + (chain === 'WAN' ? 5718350 : 60)}-${tokenAddr}`;
    let token = { key, account: tokenAddr, ancestor: tokenInfo.symbol, chain: chain === 'WAN' ? 'Wanchain' : 'Ethereum', chainSymbol: chain, decimals: tokenInfo.decimals, select: true, symbol: tokenInfo.symbol };
    // console.log('token:', token);
    if (tokensList[key.toLowerCase()]) {
      message.warn(intl.get('Config.existedTokenAddr'));
      this.setState({
        showConfirm: false
      })
      return;
    } else {
      this.setState({
        btnLoading: true
      })
    }

    wand.request('crossChain_addCustomToken', token, err => {
      if (err) {
        console.log('crossChain_addCustomToken', err);
        message.warn(intl.get('Config.addTokenAddrErr'));
      } else {
        addCustomToken(token)
        message.success(intl.get('TransHistory.success'))
      }
      this.props.onCloseAll();
    })
  }

  onCancel = () => {
    this.setState({
      showConfirm: false,
    })
  }

  render() {
    return (
      <div>
        <Modal visible destroyOnClose={true} title={intl.get(`Config.addToken`)} closable={false}
          footer={[
            <Button key="back" className="cancel" onClick={this.props.onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button key="submit" type="primary" loading={this.state.loading} onClick={this.handleSearch}>{intl.get('popup.search')}</Button>,
          ]}
        >
          <div style={{ marginBottom: '20px' }}>
            <Input placeholder={intl.get('Common.chain')} value={this.props.chain} disabled={true} />
          </div>

          <div>
            <Input placeholder={intl.get('Common.tokenAddr')} value={this.state.tokenAddr} onChange={this.handleChange} />
          </div>
        </Modal>
        {
          this.state.showConfirm &&
          <div>
            <Modal visible destroyOnClose={true} title={intl.get(`Config.addToken`)} closable={false} className={style.showTokenModal}
              footer={[
                <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('Common.cancel')}</Button>,
                <Button loading={this.state.btnLoading} key="submit" type="primary" onClick={this.handleAddToken}>{intl.get('Common.ok')}</Button>,
              ]}
            >
              <Descriptions title="Token Contract Information">
                <Descriptions.Item label="Symbol">{this.state.tokenInfo.symbol}</Descriptions.Item>
                <Descriptions.Item label="Decimals">{this.state.tokenInfo.decimals}</Descriptions.Item>
              </Descriptions>
            </Modal>
          </div>
        }
      </div>
    );
  }
}

export default AddToken;

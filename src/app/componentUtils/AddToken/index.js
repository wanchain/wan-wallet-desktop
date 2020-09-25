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
    this.setState({ loading: true })
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
    let token = { tokenAddr, select: true, symbol: tokenInfo.symbol, decimals: tokenInfo.decimals, chain };
    if (tokensList[tokenAddr.toLowerCase()]) {
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
      this.props.onCancel();
    })
  }

  onCancel = () => {
    this.setState({
      showConfirm: false,
    })
  }

  render () {
    return (
      <div>
        <Modal visible destroyOnClose={true} title={intl.get(`Config.addToken`)} closable={false}
          footer={[
            <Button key="back" className="cancel" onClick={this.props.onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button key="submit" type="primary" loading={this.state.loading} onClick={this.handleSearch}>{intl.get('popup.search')}</Button>,
          ]}
        >
          <div>
            <Input placeholder={intl.get('Common.tokenAddr')} value={this.state.tokenAddr} onChange={this.handleChange}/>
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

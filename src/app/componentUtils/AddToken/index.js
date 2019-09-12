import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Modal, Input, Button, message, Descriptions } from 'antd';

import './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
class AddToken extends Component {
  state = {
    showConfirm: false,
    tokenAddr: '',
    tokenInfo: null
  }

  handleSearch = () => {
    wand.request('crosschain_getTokenInfo', { scAddr: this.state.tokenAddr }, (err, ret) => {
      if (err) {
        console.log('crosschain_getTokenInfo:', err);
        message.warn(intl.get('Config.checkTokenAddr'))
        return;
      }
      this.setState({
        showConfirm: true,
        tokenInfo: ret
      });
    })
  }

  handleChange = e => {
    this.setState({
      tokenAddr: e.target.value
    })
  }

  handleAddToken = () => {
    console.log(this.state.tokenInfo, 'kkkkkkkkkkkkkkkkkkkkkkkk')
  }

  render () {
    return (
      <div>
        <Modal visible destroyOnClose={true} title={intl.get('Config.addToken')} closable={false}
          footer={[
            <Button key="back" className="cancel" onClick={this.props.onCancel}>{intl.get('popup.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.handleSearch}>{intl.get('popup.search')}</Button>,
          ]}
        >
          <div>
            <Input placeholder="TOKEN CONTRACT ADDRESS" value={this.state.tokenAddr} onChange={this.handleChange}/>
          </div>
        </Modal>
        {
          this.state.showConfirm &&
          <div>
            <Modal visible destroyOnClose={true} title={intl.get('Config.addToken')} closable={false} className="showTokenModal"
            footer={[
                <Button key="back" className="cancel" onClick={this.props.onCancel}>{intl.get('popup.cancel')}</Button>,
                <Button key="submit" type="primary" onClick={this.handleAddToken}>{intl.get('popup.ok')}</Button>,
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

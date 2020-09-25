import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Modal, Input, Button, message, Descriptions, Radio } from 'antd';
import AddToken from 'componentUtils/AddToken';
import wanImg from 'static/image/wan.png';
import ethImg from 'static/image/eth.png';
import style from './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
class SelectChainType extends Component {
  state = {
    showAddToken: false,
    showForm: false,
    chain: 'WAN',
  }

  handleChange = e => {
    this.setState({
      chain: e.target.value
    })
  }

  handleOk = e => {
    this.setState({
      showAddToken: true,
    })
  }

  onCancel = () => {
    this.setState({
      showAddToken: false,
    });
  }

  onCloseAll = () => {
    this.setState({
      showAddToken: false,
    });
    this.props.onCancel();
  }

  render() {
    return (
      <div>
        <Modal visible destroyOnClose={true} title={'Choose Block Chain'} closable={false} className={style.chainTypeModal}
          footer={[
            <Button key="back" className="cancel" onClick={this.props.onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button key="ok" type="primary" onClick={this.handleOk}>{intl.get('Common.ok')}</Button>,
          ]}
        >
          <div className={style.radioGroupContainer}>
            <Radio.Group onChange={this.handleChange} defaultValue={this.state.chain} className={style.radioGroup}>
              <Radio.Button value="WAN"><img src={wanImg} className={style.chainImage} /> <div>WANCHAIN</div></Radio.Button>
              <Radio.Button value="ETH"><img src={ethImg} className={style.chainImage} /> <div>ETHEREUM</div></Radio.Button>
            </Radio.Group>
          </div>
        </Modal>
        {
          this.state.showAddToken && <AddToken chain={this.addTokenChain} onCancel={this.onCancel} onCloseAll={this.onCloseAll} chain={this.state.chain} />
        }
      </div>
    );
  }
}

export default SelectChainType;

import React, { Component } from 'react';
import { Button, Card, Modal, Input, message } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
class Restore extends Component {
  state = {
    visible: false,
  }

  resetStateVal = () => {
    this.setState({
      visible: false,
    });
  }

  showModal = () => {
    this.setState({ visible: true, })
  }

  handleOk = () => {
    wand.request('phrase_reset', null, () => {});
  }

  render() {
    return (
      <div>
        <Card title={intl.get('Restore.restoreFromSeedPhrase')}>
          <p className="textP">
            {intl.get('Restore.warning')}: {intl.get('Restore.restoreNewWalletWillDeleteAllLocalData')}
          </p>
          <Button type="primary" onClick={this.showModal}>{intl.get('Restore.continue')}</Button>
          <Modal
            destroyOnClose={true}
            title={intl.get('Restore.restoreFromSeedPhrase')}
            visible={this.state.visible}
            onOk={this.handleOk}
            onCancel={this.resetStateVal}
            closable={false}
            okText={intl.get('popup.ok')}
            cancelText={intl.get('popup.cancel')}
          >
            <p className="textP">{intl.get('Restore.warning')}: {intl.get('Restore.allLocalDataWillBeLost')}</p>
          </Modal>
        </Card>
      </div>
    );
  }
}

export default Restore;





import React, { Component } from 'react';
import { Button, Card, Tooltip, Table, Checkbox } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import style from './index.less';
import imgBtc from 'static/image/btc.png';
import imgEos from 'static/image/eos.png';
import imgEth from 'static/image/eth.png';
import imgLine1 from 'static/image/network_line1.png';
import imgLine2 from 'static/image/network_line2.png';
import imgServer from 'static/image/network_server.png';
import imgWallet from 'static/image/network_wallet2.png';
import imgWanchain from 'static/image/wan.png';
import imgRed from 'static/image/network_red.png';

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
class DAppManage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      config: [],
      rows: this.getRowsData(),
    }
  }

  getRowsData = () => {
    return this.data;
  }

  onEnableChange = (index, text) => {
    console.log('onEnableChange', index, text);
    let rows = this.getRowsData();
    rows[index].enable = !rows[index].enable;
    this.setState({ rows });
  }

  colums = [
    {
      title: intl.get('DApp.enableCol'),
      dataIndex: 'enable',
      width: 100,
      key: 'enable',
      render: (text, row, index) => {
        return <Checkbox checked={text}
          onChange={() => { this.onEnableChange(index, text); }}
        />
      },
    },
    {
      title: intl.get('DApp.titleCol'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: intl.get('DApp.urlCol'),
      dataIndex: 'url',
      key: 'url',
    },
    {
      title: intl.get('DApp.commitCol'),
      dataIndex: 'commit',
      key: 'commit',
    },
  ]

  data = [
    {
      key: '1',
      enable: true,
      title: 'WRDEX',
      url: 'https://wrdex.io',
      commit: 'A Dex site',
    },
    {
      key: '2',
      enable: false,
      title: 'WanBet',
      url: 'https://wanbet.wandevs.org/',
      commit: 'A game.',
    },
  ]

  rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
    },
    getCheckboxProps: record => ({
      disabled: record.name === 'Disabled User', // Column configuration not to be checked
      name: record.name,
    }),
  };

  render() {
    return (
      <div className={style['settings_network']}>
        <Card title={intl.get('DApp.title')}>
          <Button
            className={style.startBtn}
            type="primary" >{intl.get('DApp.addButton')}
          </Button>
          <Button
            className={style.startBtn}
            type="primary" >{intl.get('DApp.delButton')}
          </Button>
          <Table rowSelection={this.rowSelection} columns={this.colums} dataSource={this.data} />
        </Card>
      </div>
    );
  }
}

export default DAppManage;

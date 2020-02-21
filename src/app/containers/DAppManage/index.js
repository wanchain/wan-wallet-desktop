import React, { Component } from 'react';
import { Button, Card, Tooltip, Table, Checkbox, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import AddDAppForm from 'components/AddDAppForm';

import style from './index.less';

const DAppAddForm = Form.create({ name: 'AddDAppForm' })(AddDAppForm);

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
      addFromVisible: false,
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

  onCancel = () => {
    this.setState({ addFromVisible: false });
  }

  onOk = () => {
    this.setState({ addFromVisible: false });
  }

  render() {
    return (
      <div className={style['settings_network']}>
        <Card title={intl.get('DApp.title')}>
          <Button
            className={style.startBtn}
            type="primary"
            onClick={() => { this.setState({ addFromVisible: true }) }}
          >{intl.get('DApp.addButton')}
          </Button>
          <Button
            className={style.startBtn}
            type="primary" >{intl.get('DApp.delButton')}
          </Button>
          <Table rowSelection={this.rowSelection} columns={this.colums} dataSource={this.data} />
          {this.state.addFromVisible && <DAppAddForm onCancel={this.onCancel} onOk={this.onOk} />}
        </Card>
      </div>
    );
  }
}

export default DAppManage;

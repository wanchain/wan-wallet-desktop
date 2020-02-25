import React, { Component } from 'react';
import { Button, Card, Table, Checkbox, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import AddDAppForm from 'components/AddDAppForm';

import style from './index.less';

const DAppAddForm = Form.create({ name: 'AddDAppForm' })(AddDAppForm);

@inject(stores => ({
  getDappsInfo: stores.dapps.getDappsInfo,
  switchDApp: stores.dapps.switchDApp,
  delDApp: stores.dapps.delDApp,
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

  componentDidMount(props) {
    this.setState({ rows: this.getRowsData() });
  }

  getRowsData = () => {
    let info = this.props.getDappsInfo().slice();
    for (let i = 0; i < info.length; i++) {
      info[i].key = i;
    }
    return info;
  }

  onEnableChange = (index, text) => {
    let rows = this.getRowsData();
    this.props.switchDApp(rows[index].name, !rows[index].enable);
    let newRows = this.getRowsData();
    this.setState({ rows: newRows });
  }

  handleDelete = (key) => {
    console.log('handleDelete', key);
    this.props.delDApp(key);
    let newRows = this.getRowsData();
    this.setState({ rows: newRows });
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
      dataIndex: 'name',
      key: 'name',
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
    {
      title: 'Operation',
      dataIndex: 'operation',
      render: (text, record) =>
        this.state.rows.length >= 1 ? (
          <a onClick={() => this.handleDelete(record.key)}>{intl.get('DApp.delButton')}</a>
        ) : null,
    },
  ]

  render() {
    return (
      <div className={style['settings_network']}>
        <Card title={intl.get('DApp.title')}>
          <Table columns={this.colums} dataSource={this.state.rows} />
        </Card>
      </div>
    );
  }
}

export default DAppManage;

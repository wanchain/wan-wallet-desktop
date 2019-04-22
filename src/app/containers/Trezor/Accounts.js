import React, { Component } from "react";
import { Button, Table } from "antd";
import "./index.less";
import SendNormalTrans from 'components/SendNormalTrans';


class Accounts extends Component {
  constructor(props) {
    super(props);
    this.columns = [
      { title: "Name", dataIndex: "name" },
      { title: "Address", dataIndex: "address" },
      { title: "Balance", dataIndex: "balance" },
      { title: "Action", render: (text) => <div> <SendNormalTrans addr={text} /> </div> }
    ];
    this.state = {
      addresses: []
    }
  }

  setAddresses = (addresses) => {
    this.setState({ addresses: addresses });
  }

  render() {
    return (
      <div>
        <Table rowSelection={this.rowSelection} pagination={false} columns={this.columns} dataSource={this.props.addresses}></Table>
      </div>
    )
  }
}

export default Accounts;
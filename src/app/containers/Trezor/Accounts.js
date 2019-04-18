import React, { Component } from "react";
import { Button, Table } from "antd";
import "./index.less";


class Accounts extends Component {
  constructor(props) {
    super(props);
    this.columns = [
      { title: "Name", dataIndex: "name" },
      { title: "Address", dataIndex: "address" },
      { title: "Balance", dataIndex: "balance" },
      { title: "Action", render: () => <a href="javascript:;">Send</a> }
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
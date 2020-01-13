import React from 'react';
import { Table } from 'antd';

const textRend = (text, record) => (
  <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>
    {text}
  </div>
)

function TableShowing (props) {
  let colWidth = Math.floor(100 / Object.keys(props.data[0]).length);
  let columns = Object.keys(props.data[0]).map(item => ({ title: item.replace(item[0], item[0].toUpperCase()), render: textRend, dataIndex: item, key: item, width: `${colWidth}%`, ellipsis: true }))
  return <Table rowKey={props.type} className="content-wrap" columns={columns} dataSource={props.data} pagination={false} />;
}

export default TableShowing;

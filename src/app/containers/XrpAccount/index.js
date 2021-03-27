import intl from 'react-intl-universal';
import { Button, Table, Row, Col, Tag, message } from 'antd';
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { observer, MobXProviderContext } from 'mobx-react';

import totalImg from 'static/image/xrp.png';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { hasSameName, createXRPAddr } from 'utils/helper';
import { EditableFormRow, EditableCell } from 'components/Rename';
import WarningExistAddress from 'components/WarningExistAddress';
import TransHistory from 'components/TransHistory/XRPTransHistory';
import SendNormalTrans from 'components/SendNormalTrans/SendXRPNormalTrans';

const CHAINTYPE = 'XRP';
const columsTemplate = [
  { dataIndex: 'name', editable: true },
  { dataIndex: 'address' },
  { dataIndex: 'balance', sorter: (a, b) => a.orignBalance - b.orignBalance },
  { dataIndex: 'action' },
];
const components = { body: { cell: EditableCell, row: EditableFormRow } };

const AddrFunc = (text, record) => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} type={CHAINTYPE} path={record.path} wid={record.wid} name={record.name} /></div>

const SendTrans = (text, record) => <div><SendNormalTrans record={record} /></div>

const XrpAccount = observer(() => {
  const { languageIntl, xrpAddress: { addrInfo, updateName, getAddrList, addAddress, getAllAmount } } = useContext(MobXProviderContext)
  const [address, setAddress] = useState(undefined);
  const [isExist, setIsExist] = useState(false);
  const onCloseModal = () => setIsExist(false);
  let canCreate = true;

  useEffect(() => {
    languageIntl.changeTitle('WanAccount.wallet');
  }, [])

  const columnsTree = useMemo(() => {
    return columsTemplate.map(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`);
      if (col.editable) {
        col.onCell = record => ({ record, editable: col.editable, dataIndex: col.dataIndex, title: col.title, handleSave })
      }
      switch (col.dataIndex) {
        case 'address':
          col.render = AddrFunc;
          break;
        case 'action':
          col.render = SendTrans;
          break;
      }
      return col;
    });
  }, [languageIntl.language])

  const handleSave = row => {
    if (hasSameName('normal', row, addrInfo)) {
      message.warn(intl.get('WanAccount.notSameName'));
    } else {
      updateName(row, row.wid);
    }
  }

  const checkDuplicate = address => {
    if (getAddrList.find(obj => obj.address.toLowerCase() === address.toLowerCase())) {
      setAddress(address)
      setIsExist(true)
      return true;
    }
    return false;
  }

  const createAccount = () => {
    if (canCreate) {
      try {
        canCreate = false;
        createXRPAddr(checkDuplicate).then(addressInfo => {
          addAddress(addressInfo);
          canCreate = true;
          message.success(intl.get('WanAccount.createAccountSuccess'));
        }).catch((e) => {
          canCreate = true;
          if (e.message === 'exist') {
            return;
          }
          message.warn(intl.get('WanAccount.createAccountFailed'));
        });
      } catch (e) {
        console.log('err:', e);
        canCreate = true;
        message.warn(intl.get('WanAccount.createAccountFailed'));
      };
    }
  }

  return (
    <div className="account">
      <Row className="title">
        <Col span={12} className="col-left">
          <img className="totalImg" src={totalImg} alt={intl.get('WanAccount.wanchain')} />
          <span className="wanTotal">{getAllAmount}</span>
          <span className="wanTex">{'XRP'}</span>
          <Tag className="symbol">{intl.get('Common.xrpl')}</Tag>
        </Col>
        <Col span={12} className="col-right">
          <Button className="createBtn" type="primary" shape="round" size="large" onClick={createAccount}>{intl.get('Common.create')}</Button>
        </Col>
      </Row>
      <Row className="mainBody">
        <Col>
          <Table components={components} rowClassName={() => 'editable-row'} className="content-wrap" pagination={false} columns={columnsTree} dataSource={getAddrList} />
        </Col>
      </Row>
      <Row className="mainBody">
        <Col>
          <TransHistory name={['normal', 'rawKey']}/>
        </Col>
      </Row>
      {
        isExist && <WarningExistAddress title={intl.get('Common.warning')} address={address} onCloseModal={onCloseModal} text={intl.get('WanAccount.newAddressExistInImportedList')}/>
      }
    </div>
  )
})

export default XrpAccount;

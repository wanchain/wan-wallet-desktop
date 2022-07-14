import React, { Component } from 'react';
import { Icon, Modal, Row, Col, List } from 'antd';
import intl from 'react-intl-universal';
import style from './index.less';
import choose from 'static/image/choose.png';

class ChooseContactsModal extends Component {
  onCancel = () => {
    this.props.onCancel();
  }

  render() {
    const { list, to, handleChoose } = this.props;

    return (
      <div>
        <Modal
          visible={true}
          className={style['cross-chain-modal']}
          destroyOnClose={true}
          closable={false}
          title={intl.get('AddressBook.title')}
          onCancel={this.onCancel}
          footer={null}
        >
          <div className={style['con']}>
            <List
              dataSource={list}
              renderItem={
                item => (
                  <List.Item style={{ borderBottomColor: 'rgba(217, 217, 217, 0.1)' }}>
                    <Row style={{ width: '100%' }} type="flex" align="middle" onClick={() => {
                      handleChoose(item.address);
                      this.onCancel();
                    }}>
                      <Col span={22}><span className={to === item.address ? style['magicTxt'] : ''}>{item.address}</span></Col>
                      <Col span={2}>
                        {
                          to === item.address
                          ? <img src={choose} className={style['chooseIcon']} />
                          : null
                        }
                      </Col>
                    </Row>
                  </List.Item>
                )
              }
            />
          </div>
        </Modal>
      </div>
    );
  }
}

export default ChooseContactsModal;

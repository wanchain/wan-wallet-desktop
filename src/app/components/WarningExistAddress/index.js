import React from 'react';
import { Modal, Input, Button } from 'antd';
import intl from 'react-intl-universal';

export default function WarningExistAddress(props) {
    let { onCloseModal, address, text } = props;
    return (
        <Modal
            title={props.title}
            visible={true}
            closable={false}
            footer={[
                <Button key="submit" type="primary" onClick={onCloseModal}>{intl.get('Common.ok')}</Button>
            ]}
        >
            <p style={{ marginBottom: '16px' }}>{text}</p>
            <Input defaultValue={address} disabled={true} style={{ textAlign: 'center' }} />
        </Modal>
    )
}

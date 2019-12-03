import React, { Component } from 'react';
import { message, Button, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import EOSNormalTransForm from 'components/NormalTransForm/EOSNormalTrans/EOSNormalTransForm'

const TxForm = Form.create({ name: 'EOSNormalTransForm' })(EOSNormalTransForm);

@inject(stores => ({
  language: stores.languageIntl.language,
  selectedAccount: stores.eosAddress.selectedAccount,
  updateSelectedAccount: obj => stores.eosAddress.updateSelectedAccount(obj),
}))

@observer
class SendEOSNormalTrans extends Component {
  state = {
    visible: false,
  }

  showModal = () => {
    const { record } = this.props;
    if (record.balance) {
      this.setState({
        visible: true,
      });
      this.props.updateSelectedAccount(this.props.record);
    } else {
      message.warn(intl.get('EOSAccountList.noSufficientBalance'));
    }
  }

  handleCancel = () => {
    this.setState({ visible: false });
  }

  saveFormRef = formRef => {
    this.formRef = formRef;
  }

  render () {
    const { visible } = this.state;

    return (
      <div style={{ display: 'inline-block', marginLeft: '10px' }}>
        {
          this.props.buttonDisabled ? (<Button type="primary" disabled onClick={this.showModal}>{intl.get('Common.send')}</Button>) : (<Button type="primary" onClick={this.showModal}>{intl.get('Common.send')}</Button>)
        }
        { visible &&
          <TxForm wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel}/>
        }
      </div>
    );
  }
}

export default SendEOSNormalTrans;

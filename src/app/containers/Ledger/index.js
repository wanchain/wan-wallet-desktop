import React, { Component } from 'react';
import './index.less';
import ConnectHwWallet from 'components/ConnectHwWallet';
import Accounts from './Accounts';
import { observer, inject } from 'mobx-react';

@inject(stores => ({
  changeTitle: newTitle => stores.session.changeTitle(newTitle)
}))

@observer
class Ledger extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      // addresses: [{ key: "0xcf0ade20ee35f2f1dcaa0686315b5680d6c0a4e5", address: "0xcf0ade20ee35f2f1dcaa0686315b5680d6c0a4e5", balance: 0, path: "m/44'/5718350'/0'/0/0" },
      // { key: "0xaa0ade20ee35f2f1dcaa0686315b5680d6c0a4e5", address: "0xaa0ade20ee35f2f1dcaa0686315b5680d6c0a4e5", balance: 0, path: "m/44'/5718350'/0'/0/0" }
      // ],
      addresses: []
    };
  }

  instruction = () => {
    return (
      <div>
        <h2 className="com-yellow">Please follow the below instructions to connect your Ledger wallet:</h2>
        <p className="com-white">1. Connect your Ledger wallet directly to your computer.</p>
        <p className="com-white">2. Enter pin code to unlock your Ledger wallet.</p>
        <p className="com-white">3. Navigate to Wanchain APP and enter into it.</p>
      </div>
    )
  }

  componentWillMount() {
    this.props.changeTitle('Ledger')
  }

  resetStateVal = () => {
    this.setState({
      visible: false,
      addresses: [],
    });
  }

  setAddresses = (addresses) => {
    this.setState({ addresses: addresses });
  }

  render() {
    return (
      <div>
        {
          this.state.addresses.length === 0 ? <ConnectHwWallet setAddresses={this.setAddresses} Instruction={this.instruction} /> : <Accounts addresses={this.state.addresses} />
        }
      </div>
    );
  }
}

export default Ledger;





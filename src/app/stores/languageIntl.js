import { observable, action, computed } from 'mobx';
import intl from 'react-intl-universal';

class LanguageIntl {
  @observable language = 'en_US';

  @action setLanguage(language) {
    self.language = language;
  }

  @computed get transColumns() {
    return self.language && [
      {
        title: intl.get('TransHistory.time'),
        dataIndex: 'time',
        key: 'time',
      }, {
        title: intl.get('TransHistory.from'),
        dataIndex: 'from',
        key: 'from',
      }, {
        title: intl.get('TransHistory.to'),
        dataIndex: 'to',
        key: 'to',
      }, {
        title: intl.get('TransHistory.value'),
        dataIndex: 'value',
        key: 'value'
      }, {
        title: intl.get('TransHistory.status'),
        dataIndex: 'status',
        key: 'status'
      }
    ]
  };

  @computed get sidebarColumns() {
    return self.language && [
      {
        title: intl.get('menuConfig.portfolio'),
        step: '1',
        key: '/',
        icon: 'user'
      },
      {
        title: intl.get('menuConfig.wallet'),
        step: '1',
        key: '/wallet',
        icon: 'wallet',
        children: [
          {
            title: intl.get('menuConfig.wan'),
            key: '/wanAccount',
            icon: 'block'
          }
        ]
      },
      {
        title: intl.get('menuConfig.hardwareWallet'),
        step: '1',
        key: '/hardwareWallet',
        icon: 'credit-card',
        children: [
          {
            title: intl.get('menuConfig.ledger'),
            key: '/ledger',
            icon: 'block'
          },
          {
            title: intl.get('menuConfig.trezor'),
            key: '/trezor',
            icon: 'block'
          }
        ]
      },
      {
        title: intl.get('menuConfig.settings'),
        step: '1',
        key: '/settings',
        icon: 'setting'
      },
    ];
  }

  @computed get portfolioColumns() {
    return self.language && [
      {
        title: intl.get('Portfolio.name'),
        dataIndex: 'name',
        key: 'name',
      }, {
        title: intl.get('Portfolio.price'),
        dataIndex: 'price',
        key: 'price',
      }, {
        title: intl.get('Portfolio.balance'),
        dataIndex: 'balance',
        key: 'balance',
      }, {
        title: intl.get('Portfolio.value'),
        dataIndex: 'value',
        key: 'value'
      }, {
        title: intl.get('Portfolio.portfolioUppercase'),
        dataIndex: 'portfolio',
        key: 'portfolio',
      }
    ];
  }

  @computed get selectAddrColumns() {
    return self.language && [
      { title: intl.get('HwWallet.Connect.address'), dataIndex: 'address' }, 
      { title: intl.get('HwWallet.Connect.balance'), dataIndex: 'balance' }
    ];
  }

  @computed get settingsColumns() {
    return self.language && [
      {
        title: intl.get('Settings.backup'),
        key: 'backup',
      }, {
        title: intl.get('Settings.restore'),
        key: 'restore',
      }
    ];
  }

  @computed get wanAddrColumns() {
    return self.language && [
      {
        title: intl.get('WanAccount.name'),
        dataIndex: 'name',
        editable: true
      },
      {
        title: intl.get('WanAccount.address'),
        dataIndex: 'address',
      },
      {
        title: intl.get('WanAccount.balance'),
        dataIndex: 'balance',
        sorter: (a, b) => a.balance - b.balance,
      },
      {
        title: intl.get('WanAccount.action'),
        dataIndex: 'action',
      }
    ];
  }
}

const self = new LanguageIntl();
export default self;

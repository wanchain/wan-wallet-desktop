import { observable, action, computed } from 'mobx';
import intl from 'react-intl-universal';

class LanguageIntl {
  @observable language = 'en_US';
  @observable title = 'Portfolio.portfolio';

  @action setLanguage(language) {
    self.language = language;
  }

  @action changeTitle(newTitle) {
    self.title = newTitle;
  }

  @computed get pageTitle() {
    return self.language && intl.get(self.title);
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

  @computed get stakingColumns() {
    return self.language && [
      {
        title: intl.get('TransHistory.time'),
        dataIndex: 'time',
        key: 'time',
      }, {
        title: intl.get('staking.table.type'),
        dataIndex: 'annotate',
        key: 'annotate',
      }, {
        title: intl.get('TransHistory.from'),
        dataIndex: 'from',
        key: 'from',
      }, {
        title: intl.get('staking.table.validator'),
        dataIndex: 'validator',
        key: 'validator'
      }, {
        title: intl.get('TransHistory.value'),
        dataIndex: 'stakeAmount',
        key: 'stakeAmount'
      }, {
        title: intl.get('TransHistory.status'),
        dataIndex: 'status',
        key: 'status'
      }
    ]
  };

  @computed get validatorColumns() {
    return self.language && [
      {
        title: intl.get('staking.table.myAccount'),
      }, {
        title: intl.get('staking.table.myStake'),
      }, {
        title: '',
      }, {
        title: intl.get('staking.table.validator'),
      }, {
        title: '',
      }, {
        title: intl.get('staking.table.distributedReward'),
      }, {
        title: intl.get('staking.table.modifyStake'),
      }
    ]
  }

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
        icon: 'usb',
        children: [
          {
            title: intl.get('menuConfig.ledger'),
            key: '/ledger',
            icon: 'block'
          },
          /** TODO */
          // {
          //   title: intl.get('menuConfig.trezor'),
          //   key: '/trezor',
          //   icon: 'block'
          // }
        ]
      },
      {
        title: intl.get('menuConfig.galaxyPos'),
        step: '1',
        key: '/staking',
        icon: 'pie-chart',
        children: [
          {
            title: intl.get('menuConfig.delegation'),
            key: '/staking',
            icon: 'block'
          },
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
        title: intl.get('Settings.config'),
        key: 'config',
      }, {
        title: intl.get('Settings.backup'),
        key: 'backup',
      }, {
        title: intl.get('Settings.restore'),
        key: 'restore',
      }
    ];
  }
}

const self = new LanguageIntl();
export default self;

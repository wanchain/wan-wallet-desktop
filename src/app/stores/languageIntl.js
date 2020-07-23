import { observable, action, computed } from 'mobx';
import intl from 'react-intl-universal';

import { WALLET_CHAIN, CROSSCHAINTYPE, THIRD_PARTY_OPEN } from 'utils/settings';

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
    return self.language && (intl.get(self.title) || self.title);
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

  @computed get transBTCColumns() {
    return self.language && [
      {
        title: intl.get('TransHistory.time'),
        dataIndex: 'time',
        key: 'time',
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

  @computed get privateTransColumns() {
    return self.language && [
      {
        title: intl.get('TransHistory.time'),
        dataIndex: 'time',
        key: 'time'
      }, {
        title: intl.get('TransHistory.from'),
        dataIndex: 'from',
        key: 'from'
      }, {
        title: intl.get('TransHistory.to'),
        dataIndex: 'to',
        className: 'privateTxTo',
        key: 'to'
      }, {
        title: intl.get('PrivateTransHistory.type'),
        dataIndex: 'type',
        key: 'type'
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

  @computed get myValidatorColumns() {
    return self.language && [
      {
        key: 'myAccount',
        dataIndex: 'myAccount',
        title: intl.get('ValidatorNode.table.myAccount'),
      },
      {
        key: 'principal',
        dataIndex: 'principal',
        title: intl.get('ValidatorNode.table.principal'),
      },
      {
        key: 'entrustment',
        dataIndex: 'entrustment',
        title: intl.get('ValidatorNode.table.entrustment'),
      },
      {
        title: '',
        key: 'arrow1',
        dataIndex: 'arrow1',
      },
      {
        key: 'validator',
        dataIndex: 'validator',
        title: intl.get('ValidatorNode.table.validator'),
      },
      {
        title: '',
        key: 'arrow2',
        dataIndex: 'arrow2',
      },
      {
        key: 'distributeRewards',
        dataIndex: 'distributeRewards',
        title: intl.get('ValidatorNode.table.distributedReward'),
      },
      {
        key: 'modifyStake',
        align: 'center',
        dataIndex: 'modifyStake',
        title: intl.get('ValidatorNode.table.modifyStake'),
      }
    ]
  }

  @computed get osmGroupListColumns() {
    return self.language && [
      {
        key: 'groupId',
        dataIndex: 'groupId',
        title: 'Group Id',
      },
      {
        key: 'startTime',
        dataIndex: 'startTime',
        title: 'Start Time',
      },
      {
        key: 'endTime',
        dataIndex: 'endTime',
        title: 'End Time',
      },
      {
        key: 'chain',
        dataIndex: 'chain',
        title: 'Chain',
      },
      {
        key: 'currDeposit',
        dataIndex: 'currDeposit',
        title: 'Current Deposit',
      },
      {
        key: 'fee',
        dataIndex: 'fee',
        title: 'Fee',
      },
      {
        key: 'action',
        dataIndex: 'action',
        title: 'Action',
      }
    ]
  }

  @computed get osmValidatorListColumns() {
    return self.language && [
      {
        key: 'account',
        dataIndex: 'account',
        title: 'Account',
      },
      {
        key: 'deposit',
        dataIndex: 'deposit',
        title: 'Deposit',
      },
      {
        key: 'groupId',
        dataIndex: 'groupId',
        title: 'GroupId',
      },
      {
        key: 'chain',
        dataIndex: 'chain',
        title: 'Chain',
      },
      {
        key: 'storeman',
        dataIndex: 'storeman',
        title: 'Storeman',
      },
      {
        key: 'reward',
        dataIndex: 'reward',
        title: 'Reward',
      },
      {
        key: 'status',
        dataIndex: 'status',
        title: 'Status',
      },
      {
        key: 'action',
        dataIndex: 'action',
        title: 'Action',
      }
    ]
  }

  @computed get osmDelegateListColumns() {
    return self.language && [
      {
        key: 'account',
        dataIndex: 'account',
        title: 'Account',
      },
      {
        key: 'stake',
        dataIndex: 'stake',
        title: 'Stake',
      },
      {
        key: 'storeman',
        dataIndex: 'storeman',
        title: 'Storeman',
      },
      {
        key: 'crosschain',
        dataIndex: 'crosschain',
        title: 'Cross Chain',
      },
      {
        key: 'reward',
        dataIndex: 'reward',
        title: 'Reward',
      },
      {
        key: 'action',
        dataIndex: 'action',
        title: 'Action',
      }
    ]
  }

  @computed get sidebarColumns () {
    let sidebar = self.language && [
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
        children: WALLET_CHAIN.map(item => ({
          title: item,
          key: `/${item.toLowerCase()}Account`,
          icon: 'block'
        }))
      },
      {
        title: intl.get('Common.crossChain'),
        step: '1',
        key: '/crossChain',
        icon: 'wallet',
        children: CROSSCHAINTYPE.map(item => ({
          title: item,
          key: `/cross${item}`,
          icon: 'block'
        }))
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
          {
            title: intl.get('menuConfig.trezor'),
            key: '/trezor',
            icon: 'block'
          }
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
            key: '/delegation',
            icon: 'block'
          }
        ]
      },
      {
        title: 'Open Storeman',
        step: '1',
        key: '/openstoreman',
        icon: 'pie-chart',
        children: [
          {
            title: 'Delegation',
            key: '/osm_delegation',
            icon: 'block'
          },
          {
            title: 'Storeman',
            key: '/osm_validator',
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

    if (THIRD_PARTY_OPEN) {
      sidebar.splice(sidebar.length - 1, 0, {
        title: intl.get('menuConfig.thirdPartyDapps'),
        step: '1',
        key: '/thirdPartyDapps',
        icon: 'stock',
        children: [
          {
            title: intl.get('DApp.moreDApp'),
            key: '/AddDApp',
            icon: 'plus-circle',
          },
        ]
      });
    }

    return sidebar;
  }

  @computed get portfolioColumns() {
    return self.language && [
      {
        title: intl.get('Portfolio.name'),
        dataIndex: 'name',
        key: 'name',
      }, {
        title: intl.get('Portfolio.balance'),
        dataIndex: 'balance',
        key: 'balance',
      }, {
        title: intl.get('Portfolio.price'),
        dataIndex: 'price',
        key: 'price',
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
        title: intl.get('Settings.import'),
        key: 'importPrivateKey',
      }, {
        title: intl.get('Settings.application'),
        key: 'application',
      }, {
        title: intl.get('Settings.restore'),
        key: 'restore',
      }, {
        title: intl.get('Settings.network'),
        key: 'network',
      }
    ];
  }

  @computed get dappMangeColumns() {
    return self.language && [
      {
        title: intl.get('DApp.enableCol'),
      },
      {
        title: intl.get('DApp.titleCol'),
      },
      {
        title: intl.get('DApp.urlCol'),
      },
      {
        title: intl.get('DApp.commitCol'),
      },
      {
        title: intl.get('DApp.operation'),
      }
    ];
  }
}

const self = new LanguageIntl();
export default self;

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

  @computed get sidebarColums() {
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

}

const self = new LanguageIntl();
export default self;

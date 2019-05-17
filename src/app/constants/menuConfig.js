const menuList = [
  {
    title: 'Portfolio',
    step: '1',
    key: '/',
    icon: 'user'
  },
  {
    title: 'Wallet',
    step: '1',
    key: '/wallet',
    icon: 'wallet',
    children: [
      {
        title: 'WAN',
        key: '/wanAccount',
        icon: 'block'
      }
    ]
  },
  {
    title: 'Hardware Wallet',
    step: '1',
    key: '/hardwareWallet',
    icon: 'credit-card',
    children: [
      {
        title: 'Ledger',
        key: '/ledger',
        icon: 'block'
      },
      {
        title: 'Trezor',
        key: '/trezor',
        icon: 'block'
      }
    ]
  },
  {
    title: 'Staking',
    step: '1',
    key: '/staking',
    icon: 'pie-chart'
  },
  {
    title: 'Settings',
    step: '1',
    key: '/settings',
    icon: 'setting'
  },
];

export default menuList;


const menuList = [
  {
    title: 'Portfolio',
    key: '/',
    icon: 'user'
  },
  {
    title: 'Wallet',
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
    title: 'Settings',
    key: '/settings',
    icon: 'setting'
  },
];

export default menuList;


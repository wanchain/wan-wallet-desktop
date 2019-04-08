const menuList = [
  {
    title: 'Portfolio',
    key: '/portfolio',
    icon: 'user'
  },
  {
    title: 'Wallet',
    key: '/wallet',
    icon: 'user',
    children: [
      {
        title: 'WAN',
        key: '/wanAccount',
        icon: 'user'
      },
      {
        title: 'BTC',
        key: '/btcAccount',
        icon: 'user'
      },
      {
        title: 'ETH',
        key: '/ethAccount',
        icon: 'user'
      },
    ]
  },
  {
    title: 'Cross Chain',
    key: '/crossChain',
    icon: 'user'
  },
  {
    title: 'Hardware Wallet',
    key: '/hardwareWallet',
    icon: 'user'
  },
  {
    title: 'Settings',
    key: '/settings',
    icon: 'user'
  },
];

export default menuList;


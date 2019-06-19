# WAN WALLET

Wan wallet is an open source project.

## Features

* Sign in quickly (Password + Phrase).
* Dynamic asset information.
* Easy to transfer WAN to others.
* Hardware wallet can be connected(Ledger, Trezor).

## Development

### Initialization

Before install WAN wallet's dependencies, you need to pre-install following tools:

Windows :

* Node.js
* Python (v2.7 is recommended, v3 is not supported)
* Git

Linux (Ubuntu) :

* Node.js

        wget https://nodejs.org/dist/v10.9.0/node-v10.9.0-linux-x64.tar.xz
        tar xf  node-v10.9.0-linux-x64.tar.xz
        cd node-v10.9.0-linux-x64/
        ./bin/node -v

        sudo ln -s /home/user/node/node-v10.9.0-linux-x64/bin/npm   /usr/local/bin/
        sudo ln -s /home/user/node/node-v10.9.0-linux-x64/bin/node   /usr/local/bin/

* Python

        sudo apt install python2.7
* Git

        sudo apt install git

MAC OS :

* Node.js

        brew install node
        brew install yarn 

* Python

        brew install python@2

* Git

        brew install git

### Download

Download project from github.

    git clone https://github.com/wanchain/wan-wallet-desktop.git
    cd wan-wallet-desktop

### Environment File

Firstly, you need to sign up in our [official website](https://iwan.wanchain.org/), and apply for you personal  API_KEY and API_SECRET.

Then, create a file named ".env" in the root directory of project and add following codes to it:

.env:

    API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxx(Your personal API_KEY)
    API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxx(Your personal API_SECRET)

You must create this file or you will not be able to connect to the server！

### Dependencies

1. Windows :

        npm install

1. Linux (Ubuntu) :

        sudo apt install build-essential libxss-dev pkg-config libusb-1.0-0 libusb-1.0-0-dev libudev-dev
        
        npm install

1. MAC OS :

        yarn install or npm install

### Get Started

    npm run dev

## Package

* Windows :

        npm run pack:win

* Linux (Ubuntu) :

        npm run pack:linux

* MAC OS :

        npm run pack:mac

## License

WAN Wallet is open source software licensed as GPL 3.

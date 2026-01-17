import { Chain } from "viem";


const chains: readonly Chain[] = [
    {
      id: 8453,
      name: "Base",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: ["https://mainnet.base.org"],
        },
      },
      blockExplorers: {
        default: {
          name: "Basescan",
          url: "https://basescan.org",
          apiUrl: "https://api.basescan.org/api",
        },
      },
      contracts: {
        multicall3: {
          address: "0xca11bde05977b3631167028862be2a173976ca11",
          blockCreated: 5022,
        },
      },
    },
    {
      id: 42161,
      name: "Arbitrum One",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: ["https://arb1.arbitrum.io/rpc"],
        },
      },
      blockExplorers: {
        default: {
          name: "Arbiscan",
          url: "https://arbiscan.io",
          apiUrl: "https://api.arbiscan.io/api",
        },
      },
      contracts: {
        multicall3: {
          address: "0xca11bde05977b3631167028862be2a173976ca11",
          blockCreated: 7654707,
        },
      },
    },
    {
      id: 10,
      name: "OP Mainnet",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: ["https://mainnet.optimism.io"],
        },
      },
      blockExplorers: {
        default: {
          name: "Optimistic Etherscan",
          url: "https://optimistic.etherscan.io",
          apiUrl: "https://api-optimistic.etherscan.io/api",
        },
      },
      contracts: {
        multicall3: {
          address: "0xca11bde05977b3631167028862be2a173976ca11",
          blockCreated: 4286263,
        },
      },
    },
    {
      id: 747474,
      name: "Katana",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: ["https://rpc.katana.network"],
        },
      },
      blockExplorers: {
        default: {
          name: "Katana Explorer",
          url: "https://explorer.katanarpc.com",
        },
      },
      contracts: {
        multicall3: {
          // abhi Katana pe multicall3 deployed nahi hai (placeholder address)
          address: "0x0000000000000000000000000000000000000000",
          blockCreated: 0,
        },
      }
    },{
      "id": 11155111,
      "name": "Sepolia",
      "nativeCurrency": {
          "name": "Sepolia Ether",
          "symbol": "ETH",
          "decimals": 18
      },
      "rpcUrls": {
          "default": {
              "http": [
                  "https://rpc.sepolia.org"
              ]
          }
      },
      "blockExplorers": {
          "default": {
              "name": "Etherscan",
              "url": "https://sepolia.etherscan.io",
              "apiUrl": "https://api-sepolia.etherscan.io/api"
          }
      },
      "contracts": {
          "multicall3": {
              "address": "0xca11bde05977b3631167028862be2a173976ca11",
              "blockCreated": 751532
          },
          "ensRegistry": {
              "address": "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"
          },
          "ensUniversalResolver": {
              "address": "0xc8Af999e38273D658BE1b921b88A9Ddf005769cC",
              "blockCreated": 5317080
          }
      },
      "testnet": true
    }
  ] as const

  

/* 
@author sanujit
@ 
*/


const networkOptions = [
  {
    id: "base",
    name: "Base",
    icon: "/icons/base-icon.svg",
    chainId: 8453, // 0x2105 in hex
    rpcUrl: "https://mainnet.base.org",
    blockExplorerUrl: "https://basescan.org",
  },
  {
    id: "arbitrum",
    name: "Arbitrum One",
    icon: "/icons/arbitrum-icon.svg",
    chainId: 42161, // 0xa4b1 in hex
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorerUrl: "https://arbiscan.io",
  },
  {
    id: "optimism",
    name: "OP Mainnet",
    icon: "/icons/optimism-icon.svg",
    chainId: 10, // 0xa in hex
    rpcUrl: "https://mainnet.optimism.io",
    blockExplorerUrl: "https://optimistic.etherscan.io",
  },
  {
    id: "katana",
    name: "Katana",
    icon: "/icons/katana.jpg",
    chainId: 747474, // 0xB6B6A in hex
    rpcUrl: "https://rpc.katana.network",
    blockExplorerUrl: "https://explorer.katanarpc.com",
  },
] as const;

   const BASE_NETWORK = "base";
  const ARBITRUM_NETWORK = "arbitrum";
  const OPTIMISM_NETWORK = "optimism";
  
  const SECS_PER_YEAR = 31556952;
  const FEES = 0.01;
  const oneMonthTimestampInterval = 2629743;
  const referralCode =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const percentageClickValues = [10, 25, 50, 100]
  

// =============== ARBITRUM ============================================
const arbTokensAddress: Record<string, `0x${string}`> = {
  USDC: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
  USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
  DAI:  "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
};

const arbAddressList = {
  daiTokenAddress: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  usdcTokenAddress: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
  usdtTokenAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
  wethTokenAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  wbtcTokenAddress: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",

  vDaiContractAddress: "0xA7d9c98dEDb545A6e66F46BEE8faF8f90c3a5c6f",
  vUSDCContractAddress: "0xE17258A56F0da671a028F2276Ddeaa5C1ccF3bdb",
  vUSDTContractAddress: "0x615A1B9A30C0C0e3E2391c5b93210Ce96FD2F0ef",
  vWBTCContractAddress: "0x15Dd8d2d7034eb3d249189964Cb44a114D79cF68",
  vEtherContractAddress: "0xA1f41ad5e26167db20c722835A6DB33889c49Cd7",
  accountManagerContractAddress: "0x13da9e485D17c0F62f64F77aAbE7b6c048a2f33C",
  registryContractAddress: "0x6DCD57f3C7CBc465832213646BEEf5501f63a3C4",
  lyraContractAddress: "0x919E5e0C096002cb8a21397D724C4e3EbE77bC15",
  muxFutureContractAddress: "0xa19fD5aB6C8DCffa2A295F78a5Bb4aC543AAF5e3",
  // spotUniswapContractAddress: "0x3e0199792Ce69DC29A0a36146bFa68bd7C8D6633",
  broker: "0x988aA44E12c7BCE07E449A4156b4A269d6642B3A",
  rateModelContractAddress: "0xbfB65FA7cC024c3315c4Eb13891f41223906f364",
  riskEngineContractAddress: "0x676fbE39A5a403b85474D155567e43D9b2b85922",
  uniswapRouterAddress: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  muxLiquidityPoolAddress: "0x3e0199792Ce69DC29A0a36146bFa68bd7C8D6633",
  multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
};

// =============== OP ============================================
const opTokensAddress: Record<string, `0x${string}`> = {
  USDC: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
  USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
  DAI:  "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  WETH: "0x4200000000000000000000000000000000000006",
  WBTC: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
};

const opAddressList = {
  daiTokenAddress: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  usdcTokenAddress: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
  wethTokenAddress: "0x4200000000000000000000000000000000000006",
  usdtTokenAddress: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
  wbtcTokenAddress: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
  tTokenAddress: "0xc8b4aA9729EE997adE0B14723e9A37f5C01b9531",
  vDaiContractAddress: "0x278e5d039ba2E09FaD254b87787f852f31060118",
  vUSDCContractAddress: "0x010305302F7BFc12Ec2597Cef77AF2DE91a90Ee9",
  vUSDTContractAddress: "0x7e70816B257Be3AbC4f2acA8C7e42b7bde76AEC8",
  vWBTCContractAddress: "0xf197f4ed8473cC4c589D06319e4ccB52fa86CFE2",
  vEtherContractAddress: "0xa66d23d6b0bF9283059E2a2938d67FEE9080659b",
  accountManagerContractAddress: "0x6A82847B5Dc8c3535eE370308D78D396228A0D3a",
  registryContractAddress: "0xFd4568C1d084e281BEAa0d55BB5CFc7Cd91B39a4",
  riskEngineContractAddress: "0x6E7EA2E46e72ff84CeFfc5e11fB9c6e97B01c617",
  lyraContractAddress: "0x919E5e0C096002cb8a21397D724C4e3EbE77bC15",
  muxFutureContractAddress: "0xa19fD5aB6C8DCffa2A295F78a5Bb4aC543AAF5e3",
  broker: "0x988aA44E12c7BCE07E449A4156b4A269d6642B3A",
  rateModelContractAddress: "0x687a9656ba10Ca157dDA7c55D64bd64b3212ABce",
  uniswapRouterAddress: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  avantifiTradingAddress: "0x5FF292d70bA9cD9e7CCb313782811b3D7120535f",
  avantifiStorage: "0x8a311D7048c35985aa31C131B9A13e03a5f7422d", //for approve
  avantifiMultiCallContractAddress:
    "0x118f99aBD7101b528B17AB91c7d7aeFD2Cc1E5c0",
  muxLiquidityPoolAddress: "0x3e0199792Ce69DC29A0a36146bFa68bd7C8D6633",
  multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
  ethBalanceFetcher: "0x0728024F87FAaa1b1D897cbD202De18398B33B46",
  vault: "0xAD7b4C162707E0B2b5f6fdDbD3f8538A5fbA0d60",
  ClearingHouse: "0x82ac2CE43e33683c58BE4cDc40975E73aA50f459",
  perphouse: "0x82ac2CE43e33683c58BE4cDc40975E73aA50f459",
  vETH: "0x8C835DFaA34e2AE61775e80EE29E2c724c6AE2BB",
  optimismFetchPositionContractAddress:
    "0xA7f3FC32043757039d5e13d790EE43edBcBa8b7c",
  indexPriceContractAddress: "0x722Ef09F933f09069257C68563B715486365B895",
  markPriceContractAddress: "0x3d03748A0FbBa8DD5F07b16c0178cdd1327FC58a",
  OracleFacade: "0x61959f47e62A3F92F36B2391b0F4a111c659F042",
  // faucetAddress: "0x090D54a11fe2d2C279e23791A3ee1c1266d678b9"
  faucetAddress: "0x5d305ba94C1b75F1DFB460219E21190Ba370bfBF"
};

// =============== BASE ============================================
const baseTokensAddress: Record<string, `0x${string}`> = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
  DAI:  "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  WETH: "0x4200000000000000000000000000000000000006",
  WBTC: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
};


const baseAddressList = {
  daiTokenAddress: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  usdcTokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  wethTokenAddress: "0x4200000000000000000000000000000000000006", 
  usdtTokenAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
  wbtcTokenAddress: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",

  vDaiContractAddress: "0x70351aF1d415bc1D7cE930415EB75aE226fC7651",  
  vUSDCContractAddress: "0x22D4FB89834738714e6B4aDa414B900138148289",
  vUSDTContractAddress: "0x615A1B9A30C0C0e3E2391c5b93210Ce96FD2F0ef",
  vWBTCContractAddress: "0x15Dd8d2d7034eb3d249189964Cb44a114D79cF68",
  vEtherContractAddress: "0xA8A7Ae5C132524398FF29293C0bB00530d47cdA9",
  accountManagerContractAddress: "0x6F5303D7277B100443A3AfCec9886774d7214e00",
  registryContractAddress: "0xDfd5D412A9FB58aE12d6b1AC20Df97D038c3E32b",
  lyraContractAddress: "0x919E5e0C096002cb8a21397D724C4e3EbE77bC15",
  muxFutureContractAddress: "0xa19fD5aB6C8DCffa2A295F78a5Bb4aC543AAF5e3",
  riskEngineContractAddress: "0x29133317047183c48a3DF2022bD89B089Fc4F97a",
  broker: "0x988aA44E12c7BCE07E449A4156b4A269d6642B3A",
  rateModelContractAddress: "0xe190EA24860f8521f8a97f1E897677335C81a23B",
  uniswapRouterAddress: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  avantifiTradingAddress: "0x5FF292d70bA9cD9e7CCb313782811b3D7120535f",
  avantifiStorage: "0x8a311D7048c35985aa31C131B9A13e03a5f7422d", //for approve
  avantifiMultiCallContractAddress:
    "0x118f99aBD7101b528B17AB91c7d7aeFD2Cc1E5c0",
  muxLiquidityPoolAddress: "0x3e0199792Ce69DC29A0a36146bFa68bd7C8D6633",
  multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
  ethBalanceFetcher: "0x3a0897075e1c909293458a07bfb719b5facb6b30",
};

const OptionType = {
  LongCall: 0,
  LongPut: 1,
  ShortCallBase: 2, // WETH
  ShortCallQuote: 3, // USDC
  ShortPutQuote: 4,
};

const codeToAsset: { [key: string]: string } = {
  "00": "USDC",
  "01": "USDT",
  "02": "DAI",
  "03": "ETH",
  "04": "BTC",
};

const CollateralAssetCode: { [key: string]: string } = {
  USDC: "00",
  USDT: "01",
  DAI: "02",
  WETH: "03",
  WBTC: "04",
  ETH: "03",
  BTC: "04",
};


export {chains,networkOptions,arbTokensAddress,arbAddressList,baseTokensAddress,opTokensAddress,opAddressList,baseAddressList,OptionType,codeToAsset,CollateralAssetCode}
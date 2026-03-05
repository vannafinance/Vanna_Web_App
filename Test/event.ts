import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { abi } from '../abi/vanna/out/out/AccountManager.sol/AccountManager.json';
import { baseAddressList } from '../lib/web3Constants';

const MY_MARGIN_ACCOUNT = '0xfD822D9e41A8Bc0CE411Fc40D15352003ECA8Cd1';

const publicClient = createPublicClient({
  chain: base,
  transport: http(`https://mainnet.base.org`), // free public RPC
});

const CONTRACT_ADDRESS = '0x6F5303D7277B100443A3AfCec9886774d7214e00';

async function fetchLastBorrows() {
  console.log('📜 Fetching last 5 Borrow events for your margin account...\n');
  const currentBlock = await publicClient.getBlockNumber();

  // Alchemy free tier: max 10 blocks per eth_getLogs request
  // Scan last 5000 blocks in chunks of 10
  const TOTAL_BLOCKS = 500000n;
  const CHUNK_SIZE = 10n;
  const startBlock = currentBlock - TOTAL_BLOCKS;
  const allLogs: any[] = [];

  for (let from = startBlock; from <= currentBlock; from += CHUNK_SIZE) {
    const to = from + CHUNK_SIZE - 1n > currentBlock ? currentBlock : from + CHUNK_SIZE - 1n;
    try {
      const logs = await publicClient.getContractEvents({
        address: CONTRACT_ADDRESS,
        abi,
        eventName: 'Borrow',
        args: { account: MY_MARGIN_ACCOUNT },
        fromBlock: from,
        toBlock: to,
      });
      if (logs.length > 0) {
        allLogs.push(...logs);
        console.log(`  Found ${logs.length} event(s) in blocks ${from}-${to}`);
      }
    } catch (err) {
      // skip failed chunks
    }
  }

  const last5 = allLogs.slice(-5);
  console.log(`\nFound ${allLogs.length} total Borrow event(s), showing last ${last5.length}:\n`);

  last5.forEach((log: any) => {
    const { account, owner, token, amt } = log.args;

    let tokenSymbol = 'Unknown';
    let decimals = 18;

    if (token?.toLowerCase() === baseAddressList.usdcTokenAddress?.toLowerCase()) {
      tokenSymbol = 'USDC';
      decimals = 6;
    } else if (token?.toLowerCase() === baseAddressList.usdtTokenAddress?.toLowerCase()) {
      tokenSymbol = 'USDT';
      decimals = 6;
    } else if (token?.toLowerCase() === baseAddressList.wethTokenAddress?.toLowerCase()) {
      tokenSymbol = 'WETH';
      decimals = 18;
    }

    console.log('---------------------------------');
    console.log(`  Account (Margin Account): ${account}`);
    console.log(`  Owner: ${owner}`);
    console.log(`  Token: ${token} (${tokenSymbol})`);
    console.log(`  Amount: ${formatUnits(amt || 0n, decimals)} ${tokenSymbol}`);
    console.log(`  Block: ${log.blockNumber}`);
    console.log(`  Tx Hash: ${log.transactionHash}`);
    console.log('---------------------------------');
  });
}

fetchLastBorrows().catch((err) => console.error('❌ Error:', err));
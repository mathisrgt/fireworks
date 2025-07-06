import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { parseUnits } from 'ethers/lib/utils'

interface DepositArgs {
    amount: string
    contractAddress?: string
    usdcAddress?: string
}

interface WithdrawArgs {
    amount: string
    contractAddress?: string
    usdcAddress?: string
}

// Hardcoded USDC address as fallback - update this for your network
const DEFAULT_USDC_ADDRESS = "0x5fd84259d66Cd46123540766Be93DFE6D43130D7";

async function getUSDCAddress(lzUSD: any, contractAddress: string, ethers: any, usdcAddressOverride?: string): Promise<string> {
    if (usdcAddressOverride) {
        return usdcAddressOverride;
    }

    try {
        // Try calling underlyingToken() function
        return await lzUSD.underlyingToken();
    } catch (error) {
        console.log('⚠️  Could not read underlyingToken from contract, using default USDC address');
        return DEFAULT_USDC_ADDRESS;
    }
}

task('lz:deposit', 'Deposit USDC to mint lzUSD tokens')
    .addParam('amount', 'Amount of USDC to deposit (human readable units, e.g. "100.5")', undefined, types.string)
    .addOptionalParam('contractAddress', 'lzUSD contract address override', undefined, types.string)
    .addOptionalParam('usdcAddress', 'USDC contract address override', undefined, types.string)
    .setAction(async (args: DepositArgs, hre: HardhatRuntimeEnvironment) => {
        const { ethers } = hre;
        const [signer] = await ethers.getSigners();

        console.log('Depositing USDC for lzUSD with parameters:');
        console.log('- Amount:', args.amount, 'USDC');
        console.log('- Signer:', signer.address);

        // Get contract address
        let contractAddress: string;
        if (args.contractAddress) {
            contractAddress = args.contractAddress;
        } else {
            const deployment = await hre.deployments.get('lzUSD');
            contractAddress = deployment.address;
        }

        console.log('- lzUSD contract address:', contractAddress);

        // Get contract instances with minimal ABI first
        const minimalABI = [
            "function underlyingToken() view returns (address)",
            "function deposit(uint256 amount) external",
            "function balanceOf(address account) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "event Deposit(address indexed user, uint256 usdcAmount, uint256 lzUSDAmount)"
        ];

        const lzUSD = new ethers.Contract(contractAddress, minimalABI, signer);

        // Get USDC address
        const usdcAddress = await getUSDCAddress(lzUSD, contractAddress, ethers, args.usdcAddress);
        console.log('- USDC contract address:', usdcAddress);

        // Standard ERC20 ABI for USDC
        const erc20ABI = [
            "function balanceOf(address account) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function transfer(address to, uint256 amount) returns (bool)"
        ];

        const usdc = new ethers.Contract(usdcAddress, erc20ABI, signer);

        // Get decimals
        const usdcDecimals = await usdc.decimals();
        const lzUSDDecimals = await lzUSD.decimals();

        console.log('- USDC decimals:', usdcDecimals);
        console.log('- lzUSD decimals:', lzUSDDecimals);

        // Convert amount to wei
        const amountInWei = parseUnits(args.amount, usdcDecimals);
        console.log('- Amount in wei:', amountInWei.toString());

        // Check USDC balance
        const usdcBalance = await usdc.balanceOf(signer.address);
        console.log('- Current USDC balance:', ethers.utils.formatUnits(usdcBalance, usdcDecimals));

        if (usdcBalance.lt(amountInWei)) {
            throw new Error('Insufficient USDC balance');
        }

        // Check allowance
        const allowance = await usdc.allowance(signer.address, contractAddress);
        console.log('- Current allowance:', ethers.utils.formatUnits(allowance, usdcDecimals));

        if (allowance.lt(amountInWei)) {
            console.log('Approving USDC spend...');
            const approveTx = await usdc.approve(contractAddress, amountInWei);
            await approveTx.wait();
            console.log('✓ USDC approved');
        }

        // Get current lzUSD balance before deposit
        const lzUSDBalanceBefore = await lzUSD.balanceOf(signer.address);
        console.log('- lzUSD balance before:', ethers.utils.formatUnits(lzUSDBalanceBefore, lzUSDDecimals));

        // Perform deposit
        console.log('Depositing USDC...');
        const tx = await lzUSD.deposit(amountInWei, {
            gasLimit: 200000, // Adjust as needed
        });

        console.log('Transaction sent:', tx.hash);
        console.log('Waiting for confirmation...');

        const receipt = await tx.wait();
        console.log('✓ Transaction confirmed in block:', receipt.blockNumber);
        console.log('Gas used:', receipt.gasUsed.toString());

        // Get lzUSD balance after deposit
        const lzUSDBalanceAfter = await lzUSD.balanceOf(signer.address);
        const lzUSDMinted = lzUSDBalanceAfter.sub(lzUSDBalanceBefore);
        console.log('- lzUSD balance after:', ethers.utils.formatUnits(lzUSDBalanceAfter, lzUSDDecimals));
        console.log('- lzUSD minted:', ethers.utils.formatUnits(lzUSDMinted, lzUSDDecimals));

        // Parse events
        const events = receipt.events?.filter((e: any) => e.event);
        if (events && events.length > 0) {
            console.log('Events emitted:');
            events.forEach((event: any) => {
                console.log(`- ${event.event}:`, event.args);
            });
        }

        return {
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            lzUSDMinted: ethers.utils.formatUnits(lzUSDMinted, lzUSDDecimals)
        };
    });

task('lz:withdraw', 'Withdraw USDC by burning lzUSD tokens')
    .addParam('amount', 'Amount of lzUSD to burn (human readable units, e.g. "100.5")', undefined, types.string)
    .addOptionalParam('contractAddress', 'lzUSD contract address override', undefined, types.string)
    .addOptionalParam('usdcAddress', 'USDC contract address override', undefined, types.string)
    .setAction(async (args: WithdrawArgs, hre: HardhatRuntimeEnvironment) => {
        const { ethers } = hre;
        const [signer] = await ethers.getSigners();

        console.log('Withdrawing USDC by burning lzUSD with parameters:');
        console.log('- Amount:', args.amount, 'lzUSD');
        console.log('- Signer:', signer.address);

        // Get contract address
        let contractAddress: string;
        if (args.contractAddress) {
            contractAddress = args.contractAddress;
        } else {
            const deployment = await hre.deployments.get('lzUSD');
            contractAddress = deployment.address;
        }

        console.log('- lzUSD contract address:', contractAddress);

        // Get contract instances with minimal ABI
        const minimalABI = [
            "function underlyingToken() view returns (address)",
            "function withdraw(uint256 amount) external",
            "function balanceOf(address account) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "event Withdraw(address indexed user, uint256 usdcAmount, uint256 lzUSDAmount)"
        ];

        const lzUSD = new ethers.Contract(contractAddress, minimalABI, signer);

        // Get USDC address
        const usdcAddress = await getUSDCAddress(lzUSD, contractAddress, ethers, args.usdcAddress);
        console.log('- USDC contract address:', usdcAddress);

        // Standard ERC20 ABI for USDC
        const erc20ABI = [
            "function balanceOf(address account) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "function transfer(address to, uint256 amount) returns (bool)"
        ];

        const usdc = new ethers.Contract(usdcAddress, erc20ABI, signer);

        // Get decimals
        const usdcDecimals = await usdc.decimals();
        const lzUSDDecimals = await lzUSD.decimals();

        console.log('- USDC decimals:', usdcDecimals);
        console.log('- lzUSD decimals:', lzUSDDecimals);

        // Convert amount to wei
        const amountInWei = parseUnits(args.amount, lzUSDDecimals);
        console.log('- Amount in wei:', amountInWei.toString());

        // Check lzUSD balance
        const lzUSDBalance = await lzUSD.balanceOf(signer.address);
        console.log('- Current lzUSD balance:', ethers.utils.formatUnits(lzUSDBalance, lzUSDDecimals));

        if (lzUSDBalance.lt(amountInWei)) {
            throw new Error('Insufficient lzUSD balance');
        }

        // Get current USDC balance before withdrawal
        const usdcBalanceBefore = await usdc.balanceOf(signer.address);
        console.log('- USDC balance before:', ethers.utils.formatUnits(usdcBalanceBefore, usdcDecimals));

        // Check contract's USDC balance
        const contractUsdcBalance = await usdc.balanceOf(contractAddress);
        console.log('- Contract USDC balance:', ethers.utils.formatUnits(contractUsdcBalance, usdcDecimals));

        // Perform withdrawal
        console.log('Withdrawing USDC...');
        const tx = await lzUSD.withdraw(amountInWei, {
            gasLimit: 200000, // Adjust as needed
        });

        console.log('Transaction sent:', tx.hash);
        console.log('Waiting for confirmation...');

        const receipt = await tx.wait();
        console.log('✓ Transaction confirmed in block:', receipt.blockNumber);
        console.log('Gas used:', receipt.gasUsed.toString());

        // Get USDC balance after withdrawal
        const usdcBalanceAfter = await usdc.balanceOf(signer.address);
        const usdcReceived = usdcBalanceAfter.sub(usdcBalanceBefore);
        console.log('- USDC balance after:', ethers.utils.formatUnits(usdcBalanceAfter, usdcDecimals));
        console.log('- USDC received:', ethers.utils.formatUnits(usdcReceived, usdcDecimals));

        // Parse events
        const events = receipt.events?.filter((e: any) => e.event);
        if (events && events.length > 0) {
            console.log('Events emitted:');
            events.forEach((event: any) => {
                console.log(`- ${event.event}:`, event.args);
            });
        }

        return {
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            usdcReceived: ethers.utils.formatUnits(usdcReceived, usdcDecimals)
        };
    });

// Additional helper task to check balances
task('lz:balances', 'Check USDC and lzUSD balances')
    .addOptionalParam('contractAddress', 'lzUSD contract address override', undefined, types.string)
    .addOptionalParam('usdcAddress', 'USDC contract address override', undefined, types.string)
    .addOptionalParam('account', 'Account address to check (defaults to first signer)', undefined, types.string)
    .setAction(async (args: { contractAddress?: string; usdcAddress?: string; account?: string }, hre: HardhatRuntimeEnvironment) => {
        const { ethers } = hre;
        const [signer] = await ethers.getSigners();

        const accountAddress = args.account || signer.address;
        console.log('Checking balances for account:', accountAddress);

        // Get contract address
        let contractAddress: string;
        if (args.contractAddress) {
            contractAddress = args.contractAddress;
        } else {
            const deployment = await hre.deployments.get('lzUSD');
            contractAddress = deployment.address;
        }

        console.log('- lzUSD contract address:', contractAddress);

        // Get contract instances with minimal ABI
        const minimalABI = [
            "function underlyingToken() view returns (address)",
            "function balanceOf(address account) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "function totalSupply() view returns (uint256)"
        ];

        const lzUSD = new ethers.Contract(contractAddress, minimalABI, ethers.provider);

        // Get USDC address
        const usdcAddress = await getUSDCAddress(lzUSD, contractAddress, ethers, args.usdcAddress);
        console.log('- USDC contract address:', usdcAddress);

        // Standard ERC20 ABI for USDC
        const erc20ABI = [
            "function balanceOf(address account) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "function allowance(address owner, address spender) view returns (uint256)"
        ];

        const usdc = new ethers.Contract(usdcAddress, erc20ABI, ethers.provider);

        // Get decimals
        const usdcDecimals = await usdc.decimals();
        const lzUSDDecimals = await lzUSD.decimals();

        // Get balances
        const usdcBalance = await usdc.balanceOf(accountAddress);
        const lzUSDBalance = await lzUSD.balanceOf(accountAddress);
        const usdcAllowance = await usdc.allowance(accountAddress, contractAddress);

        console.log('\n📊 Account Balances:');
        console.log('- USDC balance:', ethers.utils.formatUnits(usdcBalance, usdcDecimals));
        console.log('- lzUSD balance:', ethers.utils.formatUnits(lzUSDBalance, lzUSDDecimals));
        console.log('- USDC allowance to lzUSD:', ethers.utils.formatUnits(usdcAllowance, usdcDecimals));

        // Contract balances
        const contractUsdcBalance = await usdc.balanceOf(contractAddress);
        const contractLzUSDSupply = await lzUSD.totalSupply();

        console.log('\n📊 Contract Stats:');
        console.log('- Contract USDC balance:', ethers.utils.formatUnits(contractUsdcBalance, usdcDecimals));
        console.log('- Total lzUSD supply:', ethers.utils.formatUnits(contractLzUSDSupply, lzUSDDecimals));

        return {
            account: accountAddress,
            usdcBalance: ethers.utils.formatUnits(usdcBalance, usdcDecimals),
            lzUSDBalance: ethers.utils.formatUnits(lzUSDBalance, lzUSDDecimals),
            usdcAllowance: ethers.utils.formatUnits(usdcAllowance, usdcDecimals),
            contractUsdcBalance: ethers.utils.formatUnits(contractUsdcBalance, usdcDecimals),
            totalLzUSDSupply: ethers.utils.formatUnits(contractLzUSDSupply, lzUSDDecimals)
        };
    });
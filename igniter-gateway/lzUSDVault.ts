import assert from 'assert'

import { type DeployFunction } from 'hardhat-deploy/types'

const contractName = 'lzUSDVault'

const deploy: DeployFunction = async (hre) => {
    const { getNamedAccounts, deployments } = hre

    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    assert(deployer, 'Missing named deployer account')

    console.log(`Network: ${hre.network.name}`)
    console.log(`Deployer: ${deployer}`)

    // Get the lzUSD token deployment
    const lzUSDDeployment = await hre.deployments.get('lzUSD')

    // Define chain-specific configurations
    const chainConfigs: { [key: string]: { asset: string; chainId: number } } = {
        'arbitrum-testnet': {
            asset: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // USDC on Arbitrum
            chainId: 40231  // LayerZero Arbitrum endpoint ID
        },
        'optimism-testnet': {
            asset: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7', // USDC on Optimism
            chainId: 40232 // LayerZero Optimism endpoint ID
        },
    }

    // Get current network configuration
    const currentConfig = chainConfigs[hre.network.name]

    if (!currentConfig) {
        throw new Error(`Unsupported network: ${hre.network.name}`)
    }

    const { address } = await deploy(contractName, {
        from: deployer,
        args: [
            currentConfig.asset, // USDC token address for current chain
            'lzUSD Vault Share', // Vault Share Name
            'lzUSD-VS', // Vault Share Symbol
            lzUSDDeployment.address, // lzUSD token address
            currentConfig.chainId, // Current chain LayerZero endpoint ID
        ],
        log: true,
        skipIfAlreadyDeployed: false,
    })

    console.log(`Deployed contract: ${contractName}, network: ${hre.network.name}, address: ${address}`)

    // Set the vault address in the lzUSD token contract
    const lzUSDContract = await hre.ethers.getContractAt('lzUSD', lzUSDDeployment.address)
    const vaultAddress = await lzUSDContract.vault()

    if (vaultAddress === '0x0000000000000000000000000000000000000000') {
        console.log('Setting vault address in lzUSD contract...')
        const tx = await lzUSDContract.setVault(address)
        await tx.wait()
        console.log('Vault address set successfully')
    } else {
        console.log('Vault address already set in lzUSD contract')
    }
}

deploy.tags = [contractName]
deploy.dependencies = ['lzUSD'] // Ensure lzUSD is deployed first

export default deploy
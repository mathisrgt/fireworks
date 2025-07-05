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
        arbitrum: {
            asset: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
            chainId: 30110 // LayerZero Arbitrum endpoint ID
        },
        ethereum: {
            asset: '0xA0b86a33E6441b07ab8c76CE7E9E8E91aD4e3c7d', // USDC on Ethereum
            chainId: 30101 // LayerZero Ethereum endpoint ID
        },
        polygon: {
            asset: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
            chainId: 30109 // LayerZero Polygon endpoint ID
        },
        optimism: {
            asset: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // USDC on Optimism
            chainId: 30111 // LayerZero Optimism endpoint ID
        },
        base: {
            asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
            chainId: 30184 // LayerZero Base endpoint ID
        }
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
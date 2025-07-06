import { ethers } from "hardhat";
import { EndpointId } from "@layerzerolabs/lz-definitions";

async function main() {
  console.log("Deploying YieldRateReader contract...");

  // Get the contract factory
  const YieldRateReader = await ethers.getContractFactory("YieldRateReader");

  // LayerZero endpoint address for Arbitrum
  const endpointAddress = "0x3c2269811836af69497E5F486A85D7316753cf62"; // Arbitrum endpoint
  
  // Read channel ID (you can change this as needed)
  const readChannelId = 1;

  // Deploy the contract
  const yieldReader = await YieldRateReader.deploy(endpointAddress, readChannelId);

  await yieldReader.waitForDeployment();

  const address = await yieldReader.getAddress();
  console.log(`YieldRateReader deployed to: ${address}`);

  console.log("Deployment completed!");
  console.log("Next steps:");
  console.log("1. Configure LayerZero read channels");
  console.log("2. Set up DVNs and executors");
  console.log("3. Update the contract address in your frontend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
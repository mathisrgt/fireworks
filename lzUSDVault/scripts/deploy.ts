import { ethers } from "hardhat";

async function main() {
  const lzUSDVault = await ethers.deployContract("lzUSDVault", []);

  await lzUSDVault.waitForDeployment();

  console.log(
    `lzUSDVault deployed to ${lzUSDVault.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

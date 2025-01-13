// scripts/deploy.js
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Starting deployment...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy SageToken
  console.log("\nDeploying SageToken...");
  const SageToken = await ethers.getContractFactory("SageToken");
  const sageToken = await SageToken.deploy();
  await sageToken.waitForDeployment();
  const sageTokenAddress = await sageToken.getAddress();
  console.log("SageToken deployed to:", sageTokenAddress);

  // Deploy AgentRegistry
  console.log("\nDeploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy(sageTokenAddress);
  await agentRegistry.waitForDeployment();
  const agentRegistryAddress = await agentRegistry.getAddress();
  console.log("AgentRegistry deployed to:", agentRegistryAddress);

  // Deploy LearningRewards
  console.log("\nDeploying LearningRewards...");
  const LearningRewards = await ethers.getContractFactory("LearningRewards");
  const learningRewards = await LearningRewards.deploy(sageTokenAddress);
  await learningRewards.waitForDeployment();
  const learningRewardsAddress = await learningRewards.getAddress();
  console.log("LearningRewards deployed to:", learningRewardsAddress);

  // Initialize contract setup
  console.log("\nInitializing contracts...");

  // Transfer tokens to LearningRewards for rewards
  const rewardsAmount = ethers.parseEther("1000000"); // 1M tokens
  await sageToken.transfer(learningRewardsAddress, rewardsAmount);
  console.log("Transferred initial rewards to LearningRewards");

  // Create some initial achievements
  const achievements = [
    {
      name: "Getting Started",
      category: "General",
      reward: ethers.parseEther("10"),
      requiredProof: 1,
    },
    {
      name: "Math Master",
      category: "Mathematics",
      reward: ethers.parseEther("50"),
      requiredProof: 90,
    },
    {
      name: "Language Pro",
      category: "Languages",
      reward: ethers.parseEther("30"),
      requiredProof: 85,
    },
  ];

  for (const achievement of achievements) {
    await learningRewards.createAchievement(
      achievement.name,
      achievement.category,
      achievement.reward,
      achievement.requiredProof
    );
    console.log(`Created achievement: ${achievement.name}`);
  }

  // Save deployment information
  const deploymentInfo = {
    chainId: 5115,
    contracts: {
      SageToken: sageTokenAddress,
      AgentRegistry: agentRegistryAddress,
      LearningRewards: learningRewardsAddress,
    },
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment info saved to deployment.json");

  // Verify contracts if on the main network
  if (process.env.EDUCHAIN_API_KEY) {
    console.log("\nVerifying contracts...");
    try {
      await hre.run("verify:verify", {
        address: sageTokenAddress,
        constructorArguments: [],
      });

      await hre.run("verify:verify", {
        address: agentRegistryAddress,
        constructorArguments: [sageTokenAddress],
      });

      await hre.run("verify:verify", {
        address: learningRewardsAddress,
        constructorArguments: [sageTokenAddress],
      });
    } catch (error) {
      console.log("Error verifying contracts:", error);
    }
  }

  console.log("\nDeployment completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

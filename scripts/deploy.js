const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying QuizGame contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const QuizGame = await ethers.getContractFactory("QuizGame");
  const quizGame = await QuizGame.deploy();

  await quizGame.waitForDeployment();
  const contractAddress = await quizGame.getAddress();

  console.log("QuizGame deployed to:", contractAddress);
  console.log("Transaction hash:", quizGame.deploymentTransaction()?.hash);

  // Sample question flow removed for production deploy. Uncomment below if needed for demos.
  /*
  console.log("\nAdding sample question...");
  const correctAnswer = 2; // Third option (index 2)
  const salt = ethers.randomBytes(32);
  const answerHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(["uint8", "bytes32"], [correctAnswer, salt])
  );

  const addQuestionTx = await quizGame.addQuestion(
    "What is the primary consensus mechanism used by Ethereum 2.0?",
    [
      "Proof of Work",
      "Proof of Authority", 
      "Proof of Stake",
      "Delegated Proof of Stake"
    ],
    answerHash
  );
  
  await addQuestionTx.wait();
  console.log("Sample question added!");

  console.log("Revealing answer...");
  const revealTx = await quizGame.revealAnswer(0, correctAnswer, salt);
  await revealTx.wait();
  console.log("Answer revealed!");
  */

  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log("Contract Address:", contractAddress);
  console.log("Owner Address:", deployer.address);
  // Sample Question ID: 0
  // Correct Answer Index: correctAnswer
  console.log("\nUpdate your .env file with:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

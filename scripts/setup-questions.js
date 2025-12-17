const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Contract address - update this with your deployed contract address
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "YOUR_CONTRACT_ADDRESS";
  
  if (!contractAddress || contractAddress === "YOUR_CONTRACT_ADDRESS") {
    console.error("Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file");
    process.exit(1);
  }

  const QuizGame = await ethers.getContractFactory("QuizGame");
  const quizGame = QuizGame.attach(contractAddress);

  console.log("Adding sample questions...\n");

  // Question 1: Ethereum basics
  const question1Answer = 2; // Proof of Stake
  const question1Salt = ethers.randomBytes(32);
  const question1Hash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(["uint8", "bytes32"], [question1Answer, question1Salt])
  );

  console.log("Adding Question 1...");
  const tx1 = await quizGame.addQuestion(
    "What is the primary consensus mechanism used by Ethereum 2.0?",
    [
      "Proof of Work",
      "Proof of Authority",
      "Proof of Stake",
      "Delegated Proof of Stake"
    ],
    question1Hash
  );
  await tx1.wait();
  console.log("Question 1 added! Transaction:", tx1.hash);

  // Reveal Question 1
  console.log("Revealing Question 1...");
  const reveal1 = await quizGame.revealAnswer(0, question1Answer, question1Salt);
  await reveal1.wait();
  console.log("Question 1 revealed! Correct answer: C (Proof of Stake)");

  // Question 2: Blockchain basics
  const question2Answer = 1; // Immutable
  const question2Salt = ethers.randomBytes(32);
  const question2Hash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(["uint8", "bytes32"], [question2Answer, question2Salt])
  );

  console.log("\nAdding Question 2...");
  const tx2 = await quizGame.addQuestion(
    "What is a key characteristic of blockchain technology?",
    [
      "Centralized control",
      "Immutability",
      "High energy efficiency",
      "Single point of failure"
    ],
    question2Hash
  );
  await tx2.wait();
  console.log("Question 2 added! Transaction:", tx2.hash);

  // Reveal Question 2
  console.log("Revealing Question 2...");
  const reveal2 = await quizGame.revealAnswer(1, question2Answer, question2Salt);
  await reveal2.wait();
  console.log("Question 2 revealed! Correct answer: B (Immutability)");

  // Question 3: Smart Contracts
  const question3Answer = 0; // Ethereum
  const question3Salt = ethers.randomBytes(32);
  const question3Hash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(["uint8", "bytes32"], [question3Answer, question3Salt])
  );

  console.log("\nAdding Question 3...");
  const tx3 = await quizGame.addQuestion(
    "Which blockchain platform is most commonly associated with smart contracts?",
    [
      "Ethereum",
      "Bitcoin",
      "Litecoin",
      "Ripple"
    ],
    question3Hash
  );
  await tx3.wait();
  console.log("Question 3 added! Transaction:", tx3.hash);

  // Reveal Question 3
  console.log("Revealing Question 3...");
  const reveal3 = await quizGame.revealAnswer(2, question3Answer, question3Salt);
  await reveal3.wait();
  console.log("Question 3 revealed! Correct answer: A (Ethereum)");

  console.log("\n✅ All questions have been added and revealed!");
  console.log("📊 Quiz Setup Complete:");
  console.log("   - Question 0: Ethereum consensus mechanism (Answer: C)");
  console.log("   - Question 1: Blockchain characteristics (Answer: B)");
  console.log("   - Question 2: Smart contract platform (Answer: A)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
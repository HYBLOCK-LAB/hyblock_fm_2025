const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Contract address
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "YOUR_CONTRACT_ADDRESS";
  
  if (!contractAddress || contractAddress === "YOUR_CONTRACT_ADDRESS") {
    console.error("Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file");
    process.exit(1);
  }

  const QuizGame = await ethers.getContractFactory("QuizGame");
  const quizGame = QuizGame.attach(contractAddress);

  console.log("📊 Quiz Game Status");
  console.log("==================");

  try {
    // Get basic info
    const questionCount = await quizGame.questionCount();
    console.log(`📝 Total Questions: ${questionCount}`);

    if (questionCount > 0) {
      console.log("\n📋 Question Details:");
      
      for (let i = 0; i < questionCount; i++) {
        try {
          const [isActive, isRevealed, creator] = await quizGame.getQuestionState(i);
          console.log(`\n   Question ${i}:`);
          console.log(`   ├─ Active: ${isActive ? '✅' : '❌'}`);
          console.log(`   ├─ Revealed: ${isRevealed ? '✅' : '❌'}`);
          console.log(`   └─ Creator: ${creator}`);

          if (isActive) {
            try {
              const [questionText, options] = await quizGame.getQuestion(i);
              console.log(`   ├─ Text: "${questionText}"`);
              console.log(`   └─ Options:`);
              options.forEach((option, idx) => {
                console.log(`      ${String.fromCharCode(65 + idx)}. ${option}`);
              });

              if (isRevealed) {
                try {
                  const correctAnswer = await quizGame.getCorrectAnswer(i);
                  console.log(`   └─ Correct Answer: ${String.fromCharCode(65 + correctAnswer)}`);
                } catch (e) {
                  console.log(`   └─ Correct Answer: (Access denied - not owner)`);
                }
              }
            } catch (e) {
              console.log(`   └─ Question details: (Error reading question)`);
            }
          }
        } catch (error) {
          console.log(`   Question ${i}: Error - ${error.message}`);
        }
      }
    }

    // Check owner
    try {
      const owner = await quizGame.owner();
      console.log(`\n👑 Owner: ${owner}`);
      console.log(`🔑 You are ${signer.address === owner ? 'the owner' : 'not the owner'}`);
    } catch (error) {
      console.log(`\n👑 Owner info: ${error.message}`);
    }

  } catch (error) {
    console.error("Error reading contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
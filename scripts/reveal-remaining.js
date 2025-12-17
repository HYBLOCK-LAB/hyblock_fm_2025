const { ethers } = require("hardhat");

/**
 * Reveal questions 1 and 2 that were added but not revealed
 */
async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS missing");

  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  const QuizGame = await ethers.getContractFactory("QuizGame");
  const quizGame = QuizGame.attach(contractAddress).connect(signer);

  // Questions data from our JSON (matching what was added)
  const questions = [
    { answerIndex: 2 }, // Question 1: 이더리움 2.0 → 지분 증명 (index 2)
    { answerIndex: 2 }  // Question 2: duplicate → 지분 증명 (index 2)
  ];

  for (let i = 0; i < questions.length; i++) {
    const questionId = i + 1; // Questions 1, 2
    const correctAnswer = questions[i].answerIndex;
    
    try {
      // Generate salt and hash
      const salt = ethers.randomBytes(32);
      const answerHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(["uint8", "bytes32"], [correctAnswer, salt])
      );
      
      console.log(`🔓 Revealing Question ${questionId} (answerIndex=${correctAnswer})`);
      const revealTx = await quizGame.revealAnswer(questionId, correctAnswer, salt);
      console.log(`  tx: ${revealTx.hash}`);
      await revealTx.wait();
      console.log(`  ✅ Revealed Question ${questionId}`);
      
    } catch (e) {
      console.log(`  ❌ Failed to reveal Question ${questionId}:`, e.message);
    }
  }

  console.log("\n📊 Final Status:");
  const questionCount = await quizGame.questionCount();
  console.log(`Total Questions: ${questionCount}`);
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
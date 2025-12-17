const { ethers } = require("hardhat");

/**
 * Demo: Submit an answer end-to-end with logs.
 *
 * Usage:
 *  NEXT_PUBLIC_CONTRACT_ADDRESS=0x... QUESTION_ID=1 ANSWER_INDEX=2 npx hardhat run scripts/demo-submit.js --network sepolia
 */

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const questionId = Number(process.env.QUESTION_ID || 1);
  const answerIndex = Number(process.env.ANSWER_INDEX || 2);

  if (!contractAddress) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS missing");

  const signers = await ethers.getSigners();
  let signer = signers[1] || signers[0];
  if (process.env.SECOND_PRIVATE_KEY) {
    const provider = ethers.provider;
    signer = new ethers.Wallet(process.env.SECOND_PRIVATE_KEY, provider);
  }
  console.log("👤 Using:", signer.address);

  const QuizGame = await ethers.getContractFactory("QuizGame");
  const quizGame = QuizGame.attach(contractAddress).connect(signer);

  // Check registration
  const hasRegistered = await quizGame.hasRegistered(signer.address);
  if (!hasRegistered) {
    console.log("📝 Registering player...");
    const name = process.env.PLAYER_NAME || "DemoUser";
    const regTx = await quizGame.register(name);
    console.log("  tx:", regTx.hash);
    await regTx.wait();
    console.log("  ✅ Registered");
  }

  // Check question state
  const state = await quizGame.getQuestionState(questionId);
  console.log("📄 Question State:", state);
  if (!state.isRevealed) {
    throw new Error(`Question ${questionId} not revealed. Please run add-and-reveal-questions.js first.`);
  }

  // Preflight: static call to capture revert reasons
  try {
    await quizGame.submitAnswer.staticCall(questionId, answerIndex);
    console.log("🔎 Preflight: submit would succeed");
  } catch (e) {
    console.error("❌ Preflight revert:", e.message);
  }

  // Estimate gas (can fail on some RPCs); proceed anyway
  try {
    const gas = await quizGame.submitAnswer.estimateGas(questionId, answerIndex);
    console.log("⛽ Gas estimate:", gas.toString());
  } catch (e) {
    console.warn("⚠️ Gas estimate failed, proceeding to send:", e.message);
  }

  // Send transaction
  const tx = await quizGame.submitAnswer(questionId, answerIndex);
  console.log("🚀 Submit tx:", tx.hash);
  const receipt = await tx.wait();
  console.log("✅ Confirmed in block:", receipt.blockNumber);

  // Check score
  const score = await quizGame.getMyScore();
  console.log("🏆 New Score:", Number(score));
}

main().catch((err) => { console.error(err); process.exitCode = 1; });

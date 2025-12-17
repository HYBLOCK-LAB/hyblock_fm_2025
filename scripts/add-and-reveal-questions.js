const { ethers } = require("hardhat");
const fs = require("fs");

/**
 * Usage:
 * 1) Create questions.json in project root (or pass QUESTIONS_JSON env)
 * Example questions.json:
 * [
 *  {
 *    "text": "What does Ethereum 2.0 use?",
 *    "options": ["PoW", "PoA", "PoS", "DPoS"],
 *    "answerIndex": 2
 *  }
 * ]
 *
 * 2) Run:
 *   NEXT_PUBLIC_CONTRACT_ADDRESS=0x... npx hardhat run scripts/add-and-reveal-questions.js --network sepolia
 */

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your env.");
    process.exit(1);
  }

  const jsonPath = process.env.QUESTIONS_JSON || "questions.json";
  if (!fs.existsSync(jsonPath)) {
    console.error(`Questions file not found: ${jsonPath}`);
    process.exit(1);
  }

  const questions = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  if (!Array.isArray(questions) || questions.length === 0) {
    console.error("No questions in JSON");
    process.exit(1);
  }

  const QuizGame = await ethers.getContractFactory("QuizGame");
  const quizGame = QuizGame.attach(contractAddress);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.text || !q.options || q.options.length !== 4 || typeof q.answerIndex !== "number") {
      console.error(`Invalid question format at index ${i}`);
      continue;
    }

    // Generate salt and hash
    const salt = ethers.randomBytes(32);
    const answerHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(["uint8", "bytes32"], [q.answerIndex, salt])
    );

    console.log(`\n➕ Adding Question ${i}: ${q.text}`);
    const addTx = await quizGame.addQuestion(q.text, q.options, answerHash);
    console.log("  tx:", addTx.hash);
    await addTx.wait();

    const questionCount = await quizGame.questionCount();
    const newId = Number(questionCount) - 1;
    console.log(`  ✅ Added as ID ${newId}`);

    console.log(`  🔓 Revealing Question ${newId} (answerIndex=${q.answerIndex})`);
    const revealTx = await quizGame.revealAnswer(newId, q.answerIndex, salt);
    console.log("  tx:", revealTx.hash);
    await revealTx.wait();
    console.log(`  ✅ Revealed Question ${newId}`);
  }

  console.log("\nAll questions processed.");
}

main().catch((err) => { console.error(err); process.exitCode = 1; });

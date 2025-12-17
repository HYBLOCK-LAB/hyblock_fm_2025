const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xA07FE05Ef9bce2508204c5df3F661c15CC1dFa2b";
  
  console.log("📝 Adding new revealed question...");
  
  const QuizGame = await hre.ethers.getContractFactory("QuizGame");
  const contract = QuizGame.attach(contractAddress);
  
  // 새로운 질문을 추가하고 바로 reveal
  const correctAnswer = 2; // "Proof of Stake" (index 2)
  const salt = hre.ethers.randomBytes(32);
  const answerHash = hre.ethers.keccak256(
    hre.ethers.AbiCoder.defaultAbiCoder().encode(["uint8", "bytes32"], [correctAnswer, salt])
  );
  
  try {
    // 1. 질문 추가
    console.log("Adding question...");
    const addTx = await contract.addQuestion(
      "What consensus mechanism does Ethereum 2.0 use?",
      [
        "Proof of Work",
        "Proof of Authority", 
        "Proof of Stake",
        "Delegated Proof of Stake"
      ],
      answerHash
    );
    await addTx.wait();
    
    const questionCount = await contract.questionCount();
    const newQuestionId = questionCount - BigInt(1);
    console.log(`✅ Question ${newQuestionId} added!`);
    
    // 2. 답 공개
    console.log("Revealing answer...");
    const revealTx = await contract.revealAnswer(newQuestionId, correctAnswer, salt);
    await revealTx.wait();
    console.log(`✅ Question ${newQuestionId} answer revealed! Correct: ${correctAnswer} (Proof of Stake)`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
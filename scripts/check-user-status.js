const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  const QuizGame = await ethers.getContractFactory("QuizGame");
  const contract = QuizGame.attach("0x4A82708Edb7155eC26b140B52119c74F31a134FA");
  
  console.log("User:", signer.address);
  const score = await contract.getPlayerScore(signer.address);
  console.log("Score:", score.toString());
  
  console.log("\nAnswer Status:");
  for(let i = 0; i < 5; i++) {
    try {
      const hasAnswered = await contract.hasPlayerAnswered(i, signer.address);
      console.log(`Question ${i}: ${hasAnswered ? 'ANSWERED ✅' : 'Not answered ❌'}`);
    } catch(e) {
      console.log(`Question ${i}: Error checking - ${e.message}`);
    }
  }
}

main().catch(console.error);
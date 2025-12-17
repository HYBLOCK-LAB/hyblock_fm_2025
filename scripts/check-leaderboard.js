const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env.local' });

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("Contract address not found. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your environment.");
    console.error("Current env:", process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);
    return;
  }

  console.log("🔍 Checking current quiz participants and their performance...\n");

  try {
    const [deployer] = await ethers.getSigners();
    const QuizGame = await ethers.getContractFactory("QuizGame");
    const quizGame = QuizGame.attach(contractAddress);

    // Get all PlayerRegistered events
    console.log("📋 Registered Players:");
    const registrationFilter = quizGame.filters.PlayerRegistered();
    const registrationEvents = await quizGame.queryFilter(registrationFilter);
    
    const players = new Map();
    for (const event of registrationEvents) {
      const { player, name } = event.args;
      players.set(player.toLowerCase(), {
        address: player,
        name: name,
        score: 0,
        answers: []
      });
    }

    console.log(`Total registered players: ${players.size}\n`);

    // Get all AnswerSubmitted events
    console.log("📊 Answer Submission History:");
    const answerFilter = quizGame.filters.AnswerSubmitted();
    const answerEvents = await quizGame.queryFilter(answerFilter);
    
    let totalAnswers = 0;
    let correctAnswers = 0;

    for (const event of answerEvents) {
      const { player, questionId, isCorrect } = event.args;
      const playerKey = player.toLowerCase();
      
      if (players.has(playerKey)) {
        const playerData = players.get(playerKey);
        playerData.answers.push({
          questionId: Number(questionId),
          isCorrect: isCorrect,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
        
        totalAnswers++;
        if (isCorrect) {
          correctAnswers++;
        }
      }
    }

    // Get current scores
    console.log("🏆 Current Player Rankings:");
    const rankedPlayers = [];
    for (const [address, playerData] of players) {
      try {
        const currentScore = await quizGame.getPlayerScore(playerData.address);
        playerData.score = Number(currentScore);
        rankedPlayers.push(playerData);
      } catch (error) {
        console.error(`Error getting score for ${playerData.name}:`, error.message);
      }
    }

    // Sort by score (descending)
    rankedPlayers.sort((a, b) => b.score - a.score);

    console.log("┌─────────────────────────────────────────────────────────────┐");
    console.log("│ Rank │ Player Name      │ Score │ Correct │ Total │ Address │");
    console.log("├─────────────────────────────────────────────────────────────┤");
    
    rankedPlayers.forEach((player, index) => {
      const rank = (index + 1).toString().padStart(4);
      const name = player.name.padEnd(16).substring(0, 16);
      const score = player.score.toString().padStart(5);
      const correct = player.answers.filter(a => a.isCorrect).length.toString().padStart(7);
      const total = player.answers.length.toString().padStart(5);
      const addr = `${player.address.slice(0, 6)}...${player.address.slice(-4)}`;
      
      console.log(`│ ${rank} │ ${name} │ ${score} │ ${correct} │ ${total} │ ${addr} │`);
    });
    
    console.log("└─────────────────────────────────────────────────────────────┘\n");

    // Get question details
    console.log("📝 Available Questions:");
    const questionCount = await quizGame.questionCount();
    
    for (let i = 0; i < questionCount; i++) {
      try {
        const question = await quizGame.getQuestion(i);
        const questionState = await quizGame.getQuestionState(i);
        
        console.log(`\nQuestion ${i}:`);
        console.log(`  Text: ${question.questionText}`);
        console.log(`  Status: ${questionState.isActive ? '✅ Active' : '❌ Inactive'}`);
        console.log(`  Revealed: ${questionState.isRevealed ? '✅ Yes' : '❌ No'}`);
        
        if (questionState.isRevealed) {
          console.log(`  Correct Answer: ${String.fromCharCode(65 + questionState.correctAnswer)} (${question.options[questionState.correctAnswer]})`);
        }

        // Count responses for this question
        const questionAnswers = answerEvents.filter(event => Number(event.args.questionId) === i);
        const correctCount = questionAnswers.filter(event => event.args.isCorrect).length;
        console.log(`  Responses: ${questionAnswers.length} total, ${correctCount} correct (${questionAnswers.length > 0 ? Math.round(correctCount/questionAnswers.length*100) : 0}% accuracy)`);
      } catch (error) {
        console.log(`Question ${i}: Error - ${error.message}`);
      }
    }

    // Summary statistics
    console.log("\n📈 Overall Statistics:");
    console.log(`Total Players: ${players.size}`);
    console.log(`Total Answers Submitted: ${totalAnswers}`);
    console.log(`Overall Accuracy: ${totalAnswers > 0 ? Math.round(correctAnswers/totalAnswers*100) : 0}%`);
    console.log(`Average Score: ${rankedPlayers.length > 0 ? Math.round(rankedPlayers.reduce((sum, p) => sum + p.score, 0) / rankedPlayers.length) : 0} points`);

    if (rankedPlayers.length > 0) {
      console.log(`Top Scorer: ${rankedPlayers[0].name} with ${rankedPlayers[0].score} points`);
    }

  } catch (error) {
    console.error("Error checking quiz status:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
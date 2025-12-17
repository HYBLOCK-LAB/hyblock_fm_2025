const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("QuizGame", function () {
  let quizGame;
  let owner;
  let player1;
  let player2;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();
    
    const QuizGame = await ethers.getContractFactory("QuizGame");
    quizGame = await QuizGame.deploy();
    await quizGame.waitForDeployment();
  });

  describe("Registration", function () {
    it("Should allow player registration", async function () {
      await expect(quizGame.connect(player1).register("Alice"))
        .to.emit(quizGame, "PlayerRegistered")
        .withArgs(player1.address, "Alice");

      expect(await quizGame.hasRegistered(player1.address)).to.be.true;
      expect(await quizGame.getPlayerName(player1.address)).to.equal("Alice");
    });

    it("Should reject empty name", async function () {
      await expect(quizGame.connect(player1).register(""))
        .to.be.revertedWithCustomError(quizGame, "EmptyName");
    });

    it("Should reject duplicate registration", async function () {
      await quizGame.connect(player1).register("Alice");
      await expect(quizGame.connect(player1).register("Bob"))
        .to.be.revertedWithCustomError(quizGame, "AlreadyRegistered");
    });
  });

  describe("Question Management", function () {
    let answerHash;
    let correctAnswer = 2;
    let salt;

    beforeEach(async function () {
      salt = ethers.randomBytes(32);
      answerHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(["uint8", "bytes32"], [correctAnswer, salt])
      );
    });

    it("Should allow owner to add question", async function () {
      await expect(quizGame.addQuestion(
        "Test question?",
        ["Option A", "Option B", "Option C", "Option D"],
        answerHash
      )).to.emit(quizGame, "QuestionAdded");

      expect(await quizGame.questionCount()).to.equal(1);
    });

    it("Should allow owner to reveal answer", async function () {
      await quizGame.addQuestion(
        "Test question?",
        ["Option A", "Option B", "Option C", "Option D"],
        answerHash
      );

      await expect(quizGame.revealAnswer(0, correctAnswer, salt))
        .to.emit(quizGame, "AnswerRevealed")
        .withArgs(0, correctAnswer, salt);
    });

    it("Should reject invalid answer reveal", async function () {
      await quizGame.addQuestion(
        "Test question?",
        ["Option A", "Option B", "Option C", "Option D"],
        answerHash
      );

      const wrongSalt = ethers.randomBytes(32);
      await expect(quizGame.revealAnswer(0, correctAnswer, wrongSalt))
        .to.be.revertedWithCustomError(quizGame, "InvalidAnswer");
    });
  });

  describe("Answer Submission", function () {
    let correctAnswer = 1;
    let salt;

    beforeEach(async function () {
      // Register players
      await quizGame.connect(player1).register("Alice");
      await quizGame.connect(player2).register("Bob");

      // Add and reveal question
      salt = ethers.randomBytes(32);
      const answerHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(["uint8", "bytes32"], [correctAnswer, salt])
      );

      await quizGame.addQuestion(
        "Test question?",
        ["Option A", "Option B", "Option C", "Option D"],
        answerHash
      );

      await quizGame.revealAnswer(0, correctAnswer, salt);
    });

    it("Should allow registered player to submit correct answer", async function () {
      await expect(quizGame.connect(player1).submitAnswer(0, correctAnswer))
        .to.emit(quizGame, "AnswerSubmitted")
        .withArgs(player1.address, 0, true)
        .and.to.emit(quizGame, "ScoreUpdated")
        .withArgs(player1.address, 10);

      expect(await quizGame.getPlayerScore(player1.address)).to.equal(10);
    });

    it("Should allow registered player to submit wrong answer", async function () {
      const wrongAnswer = 3;
      await expect(quizGame.connect(player1).submitAnswer(0, wrongAnswer))
        .to.emit(quizGame, "AnswerSubmitted")
        .withArgs(player1.address, 0, false);

      expect(await quizGame.getPlayerScore(player1.address)).to.equal(0);
    });

    it("Should reject duplicate submission", async function () {
      await quizGame.connect(player1).submitAnswer(0, correctAnswer);
      await expect(quizGame.connect(player1).submitAnswer(0, correctAnswer))
        .to.be.revertedWithCustomError(quizGame, "AlreadyAnswered");
    });

    it("Should reject submission from unregistered player", async function () {
      const [, , , unregisteredPlayer] = await ethers.getSigners();
      await expect(quizGame.connect(unregisteredPlayer).submitAnswer(0, correctAnswer))
        .to.be.revertedWithCustomError(quizGame, "NotRegistered");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await quizGame.connect(player1).register("Alice");
      
      const salt = ethers.randomBytes(32);
      const answerHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(["uint8", "bytes32"], [2, salt])
      );

      await quizGame.addQuestion(
        "Sample question?",
        ["Option A", "Option B", "Option C", "Option D"],
        answerHash
      );
    });

    it("Should return question details", async function () {
      const [questionText, options] = await quizGame.getQuestion(0);
      expect(questionText).to.equal("Sample question?");
      expect(options[0]).to.equal("Option A");
      expect(options[3]).to.equal("Option D");
    });

    it("Should return question state", async function () {
      const [isActive, isRevealed, creator] = await quizGame.getQuestionState(0);
      expect(isActive).to.be.true;
      expect(isRevealed).to.be.false;
      expect(creator).to.equal(owner.address);
    });
  });
});
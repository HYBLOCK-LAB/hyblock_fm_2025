import { ethers } from 'ethers'

// Contract ABI - essential functions only
export const QUIZ_GAME_ABI = [
  // Events
  "event PlayerRegistered(address indexed player, string name)",
  "event NameChanged(address indexed player, string newName)",
  "event AnswerSubmitted(address indexed player, uint256 indexed questionId, uint8 answer)",
  "event AnswerEvaluated(address indexed player, uint256 indexed questionId, bool isCorrect)",
  "event ScoreUpdated(address indexed player, uint256 newScore)",
  "event AnswerRevealed(uint256 indexed questionId, uint8 correctAnswer, bytes32 salt)",
  
  // Admin functions
  "function owner() public view returns (address)",
  "function addQuestion(string memory _questionText, string[4] memory _options, bytes32 _answerHash) public",
  "function revealAnswer(uint256 _questionId, uint8 _correctAnswer, bytes32 _salt) public",
  
  // Registration functions
  "function register(string memory _name) public",
  "function hasRegistered(address _player) public view returns (bool)",
  "function getMyName() public view returns (string memory)",
  "function getPlayerName(address _player) public view returns (string memory)",
  
  // Quiz functions
  "function getQuestion(uint256 _questionId) public view returns (string memory questionText, string[4] memory options)",
  "function getQuestionState(uint256 _questionId) public view returns (bool isActive, bool isRevealed, address creator)",
  "function submitAnswer(uint256 _questionId, uint8 _answer) public",
  "function hasPlayerAnswered(uint256 _questionId, address _player) public view returns (bool)",
  "function getCorrectAnswer(uint256 _questionId) public view returns (uint8)",
  
  // Score functions
  "function getMyScore() public view returns (uint256)",
  "function getPlayerScore(address _player) public view returns (uint256)",
  
  // View functions
  "function questionCount() public view returns (uint256)"
]

export interface QuestionData {
  questionText: string
  options: [string, string, string, string]
}

export interface QuestionState {
  isActive: boolean
  isRevealed: boolean
  creator: string
}

export class QuizGameContract {
  private contract: ethers.Contract
  private signerOrProvider: ethers.Signer | ethers.Provider

  constructor(signerOrProvider: ethers.Signer | ethers.Provider) {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
    if (!contractAddress || contractAddress.trim() === '') {
      console.error('Contract address not configured')
      console.error('Steps to fix:')
      console.error('1. Create .env.local file in project root')
      console.error('2. Add: NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address')
      console.error('3. Restart development server: npm run dev')
      throw new Error('Contract address not found. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local and restart the server.')
    }
    
    this.signerOrProvider = signerOrProvider
    this.contract = new ethers.Contract(contractAddress, QUIZ_GAME_ABI, signerOrProvider)
  }

  // Registration methods
  async register(name: string): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.register(name)
  }

  async hasRegistered(address: string): Promise<boolean> {
    return await this.contract.hasRegistered(address)
  }

  async getMyName(): Promise<string> {
    return await this.contract.getMyName()
  }

  async getPlayerName(address: string): Promise<string> {
    return await this.contract.getPlayerName(address)
  }

  // Quiz methods
  async getQuestion(questionId: number): Promise<QuestionData> {
    const [questionText, options] = await this.contract.getQuestion(questionId)
    return { questionText, options }
  }

  async getQuestionState(questionId: number): Promise<QuestionState> {
    const [isActive, isRevealed, creator] = await this.contract.getQuestionState(questionId)
    return { isActive, isRevealed, creator }
  }

  async submitAnswer(questionId: number, answerIndex: number): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.submitAnswer(questionId, answerIndex)
  }

  async hasPlayerAnswered(questionId: number, playerAddress: string): Promise<boolean> {
    return await this.contract.hasPlayerAnswered(questionId, playerAddress)
  }

  // Score methods
  async getMyScore(): Promise<bigint> {
    return await this.contract.getMyScore()
  }

  async getPlayerScore(address: string): Promise<bigint> {
    return await this.contract.getPlayerScore(address)
  }

  // View methods
  async getQuestionCount(): Promise<bigint> {
    return await this.contract.questionCount()
  }

  // Admin methods
  async getOwner(): Promise<string> {
    return await this.contract.owner()
  }

  async addQuestion(
    questionText: string,
    options: [string, string, string, string],
    answerHash: string
  ): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.addQuestion(questionText, options, answerHash)
  }

  async revealAnswer(
    questionId: number,
    correctAnswer: number,
    salt: string
  ): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.revealAnswer(questionId, correctAnswer, salt)
  }

  // Event listeners
  onPlayerRegistered(callback: (player: string, name: string) => void) {
    this.contract.on('PlayerRegistered', callback)
  }

  onAnswerSubmitted(callback: (player: string, questionId: bigint, answer: number) => void) {
    this.contract.on('AnswerSubmitted', callback)
  }

  onScoreUpdated(callback: (player: string, newScore: bigint) => void) {
    this.contract.on('ScoreUpdated', callback)
  }

  onAnswerRevealed(callback: (questionId: bigint, correctAnswer: number, salt: string) => void) {
    this.contract.on('AnswerRevealed', callback)
  }

  onAnswerEvaluated(callback: (player: string, questionId: bigint, isCorrect: boolean) => void) {
    this.contract.on('AnswerEvaluated', callback)
  }

  // Remove all listeners
  removeAllListeners() {
    this.contract.removeAllListeners()
  }

  // Get contract address
  getAddress(): string {
    return this.contract.target as string
  }
}

// Read-only contract factory (no signer required)
export const getReadOnlyQuizContract = (provider: ethers.Provider) => {
  return new ethers.Contract(
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
    QUIZ_GAME_ABI,
    provider
  )
}

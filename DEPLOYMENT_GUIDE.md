# HyBlock Quiz DApp - 개발자 가이드

## 서버 배포 가이드

### 사전 요구사항
- Node.js 16+ 
- Git
- MetaMask 지갑 (Sepolia 테스트 ETH 보유)
- Infura 계정

### 1단계: 프로젝트 클론 및 설치
```bash
git clone https://github.com/HYBLOCK-LAB/hyblock_fm_2025.git
cd hyblock_fm_2025
npm install
```

### 2단계: 환경변수 설정
```bash
cp .env.example .env.local
```

`.env.local` 파일 편집:
```bash
# 관리자용 - 컨트랙트 배포 및 관리용
PRIVATE_KEY=your_wallet_private_key_without_0x
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_project_id
BASE_RPC_URL=https://mainnet.base.org

# 모든 사용자 공통 - 배포된 컨트랙트 주소 (배포 후 설정)
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_NETWORK_ID=11155111
```

#### Private Key 얻기
1. MetaMask → Account details → Export private key
2. 0x 접두사 제거한 64자리 문자열 복사

#### Infura Project ID 얻기
1. [infura.io](https://infura.io) 계정 생성
2. Create New Project → Ethereum 선택
3. Project ID 복사 (32자리 문자열)

### 3단계: 스마트 컨트랙트 배포
```bash
# 컨트랙트 컴파일
npm run compile

# 테스트 실행 (12개 테스트 통과 확인)
npm test

# Sepolia 테스트넷에 배포
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_PROJECT_ID" PRIVATE_KEY="YOUR_PRIVATE_KEY" npm run deploy:sepolia
```

**배포 성공 시 출력 예시:**
```
QuizGame deployed to: 0xA07FE05Ef9bce2508204c5df3F661c15CC1dFa2b
Update your .env file with:
NEXT_PUBLIC_CONTRACT_ADDRESS=0xA07FE05Ef9bce2508204c5df3F661c15CC1dFa2b
```

### 4단계: 환경변수 업데이트
출력된 컨트랙트 주소를 `.env.local`에 추가:
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xA07FE05Ef9bce2508204c5df3F661c15CC1dFa2b
```

### 5단계: 샘플 퀴즈 추가 (선택)
```bash
# 3개의 샘플 문제 추가 및 공개
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_PROJECT_ID" PRIVATE_KEY="YOUR_PRIVATE_KEY" npm run setup-questions

# 현재 상태 확인
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_PROJECT_ID" PRIVATE_KEY="YOUR_PRIVATE_KEY" npm run check-status
```

### 6단계: 프로덕션 빌드 및 실행
```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start

# 또는 개발 서버
npm run dev
```

## 퀴즈 관리 가이드

### 새 문제 추가하기

#### 방법 1: 스크립트 수정
`scripts/setup-questions.js` 파일에 새 문제 추가:

```javascript
// 새 문제 추가 예시
const question4Answer = 0; // 정답 인덱스 (0-3)
const question4Salt = ethers.randomBytes(32);
const question4Hash = ethers.keccak256(
  ethers.AbiCoder.defaultAbiCoder().encode(["uint8", "bytes32"], [question4Answer, question4Salt])
);

console.log("Adding Question 4...");
const tx4 = await quizGame.addQuestion(
  "새로운 질문 내용?",
  [
    "첫 번째 선택지",
    "두 번째 선택지", 
    "세 번째 선택지",
    "네 번째 선택지"
  ],
  question4Hash
);
await tx4.wait();

// 정답 공개
console.log("Revealing Question 4...");
const reveal4 = await quizGame.revealAnswer(3, question4Answer, question4Salt);
await reveal4.wait();
console.log("Question 4 revealed! Correct answer: A");
```

#### 방법 2: 직접 컨트랙트 호출
Remix IDE 또는 Hardhat console 사용:

```javascript
// Hardhat console
npx hardhat console --network sepolia

// 컨트랙트 연결
const QuizGame = await ethers.getContractFactory("QuizGame");
const quizGame = QuizGame.attach("DEPLOYED_CONTRACT_ADDRESS");

// 정답 해시 생성
const correctAnswer = 2; // 정답 인덱스
const salt = ethers.randomBytes(32);
const answerHash = ethers.keccak256(
  ethers.AbiCoder.defaultAbiCoder().encode(["uint8", "bytes32"], [correctAnswer, salt])
);

// 문제 추가
await quizGame.addQuestion(
  "질문 내용?",
  ["선택지1", "선택지2", "선택지3", "선택지4"],
  answerHash
);

// 정답 공개
await quizGame.revealAnswer(questionId, correctAnswer, salt);
```

### 퀴즈 상태 확인
```bash
# 퀴즈 문제 및 기본 상태 확인
npm run check-status

# 참가자 순위표 및 상세 통계 확인
npm run check-leaderboard
```

### 문제 활성화/비활성화
```javascript
// 문제 비활성화
await quizGame.setQuestionActive(questionId, false);

// 문제 재활성화  
await quizGame.setQuestionActive(questionId, true);
```

## 사용자 데이터 조회 및 리더보드

### 모든 참가자 현황 확인
```bash
# 상세한 리더보드 및 통계 확인
npm run check-leaderboard
```

**출력 예시:**
```
🔍 Checking current quiz participants and their performance...

📋 Registered Players:
Total registered players: 5

🏆 Current Player Rankings:
┌─────────────────────────────────────────────────────────────┐
│ Rank │ Player Name      │ Score │ Correct │ Total │ Address │
├─────────────────────────────────────────────────────────────┤
│    1 │ CryptoMaster     │    30 │       3 │     3 │ 0x1234...5678 │
│    2 │ BlockchainPro    │    20 │       2 │     3 │ 0xabcd...efgh │
│    3 │ Web3Learner      │    10 │       1 │     2 │ 0x9876...4321 │
└─────────────────────────────────────────────────────────────┘

📈 Overall Statistics:
Total Players: 5
Total Answers Submitted: 15
Overall Accuracy: 67%
Average Score: 18 points
Top Scorer: CryptoMaster with 30 points
```

### 개별 사용자 정보 조회 (스크립트)
```javascript
// Hardhat console 또는 스크립트에서
const QuizGame = await ethers.getContractFactory("QuizGame");
const quizGame = QuizGame.attach(contractAddress);

// 특정 사용자 정보
const playerName = await quizGame.getPlayerName("0x사용자주소");
const playerScore = await quizGame.getPlayerScore("0x사용자주소");
const hasAnswered = await quizGame.hasPlayerAnswered(questionId, "0x사용자주소");

console.log(`이름: ${playerName}, 점수: ${playerScore}, 답변완료: ${hasAnswered}`);
```

### 실시간 이벤트 모니터링
```javascript
// AnswerSubmitted 이벤트 실시간 구독 (프론트엔드)
contract.on("AnswerSubmitted", (player, questionId, isCorrect) => {
  console.log(`${player}이(가) 문제 ${questionId}에 ${isCorrect ? '정답' : '오답'}!`);
});

// PlayerRegistered 이벤트 구독
contract.on("PlayerRegistered", (player, name) => {
  console.log(`새로운 참가자: ${name} (${player})`);
});
```

### Etherscan에서 확인
1. [Sepolia Etherscan](https://sepolia.etherscan.io/)에서 컨트랙트 주소 검색
2. **Events** 탭에서 실시간 이벤트 확인:
   - `PlayerRegistered`: 신규 가입자
   - `AnswerSubmitted`: 답안 제출 및 정답 여부
   - `ScoreUpdated`: 점수 변경

## 문제 해결

### 배포 실패
- **"Empty string for network URL"**: Infura Project ID 확인
- **"Insufficient funds"**: Sepolia ETH 부족 → [Faucet](https://sepoliafaucet.com/)에서 받기
- **"Invalid private key"**: Private key 형식 확인 (0x 제외 64자리)

### 프론트엔드 에러
- **"Contract address not found"**: 환경변수 설정 확인 후 서버 재시작
- **"Network mismatch"**: MetaMask를 Sepolia 네트워크로 변경

### 성능 최적화
- **대용량 사용자**: 이벤트 인덱싱 서비스 (The Graph) 사용 고려
- **실시간 업데이트**: WebSocket 연결로 이벤트 실시간 구독

## 보안 고려사항

1. **Private Key 관리**:
   - 프로덕션에서는 환경변수 또는 시크릿 관리 서비스 사용
   - `.env.local` 파일을 Git에 커밋하지 말 것

2. **네트워크 설정**:
   - 메인넷 배포 시 충분한 테스트 필요
   - Gas Price 모니터링

3. **컨트랙트 업그레이드**:
   - 현재 컨트랙트는 업그레이드 불가능
   - 새 기능 추가 시 새 컨트랙트 배포 필요

## 시스템 구조 및 특징

### 현재 퀴즈 방식
- **개별 문제 제출**: 각 문제를 풀 때마다 바로 블록체인에 제출
- **실시간 피드백**: 제출 즉시 정답/오답 확인 가능
- **가스비**: 문제당 1회 트랜잭션 (문제 수 × 가스비)

### 향후 개선 가능한 방식
1. **일괄 제출 모드** (새 컨트랙트 필요):
   - 모든 답안을 로컬에 저장 → 마지막에 한번에 제출
   - 가스비 절약 (1회 트랜잭션)
   - 제출 전까지 정답 확인 불가

2. **하이브리드 모드**:
   - 연습 모드: 로컬에서 즉시 피드백
   - 실전 모드: 일괄 제출로 점수 기록

### 컨트랙트 이벤트 활용
현재 시스템은 다음 이벤트들을 실시간으로 발생시켜 투명성을 보장합니다:

```solidity
event PlayerRegistered(address indexed player, string name);
event AnswerSubmitted(address indexed player, uint256 indexed questionId, bool isCorrect);
event ScoreUpdated(address indexed player, uint256 newScore);
event QuestionAdded(uint256 indexed questionId, address indexed creator);
event AnswerRevealed(uint256 indexed questionId, uint8 correctAnswer, bytes32 salt);
```

이를 통해:
- 실시간 리더보드 업데이트
- 투명한 채점 과정
- 모든 참가자의 활동 추적 가능
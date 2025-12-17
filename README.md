# 🚀 HyBlock Quiz DApp

온체인 퀴즈 데모 애플리케이션 - 블록체인 기반 실시간 퀴즈 게임

![HyBlock Logo](./public/assets/logo.png)

## 빠른 시작 (Quick Start)

### 1. 프로젝트 설치 및 설정
```bash
git clone <repository-url>
cd hyblock_fm_2025
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일에 다음 내용 추가:
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x78f9C1d0E1A77b2a61Ad071DAb84fb1448CA33b0
NEXT_PUBLIC_NETWORK_ID=11155111
```

### 3. 프론트엔드 실행
```bash
npm run build
npm start
```

브라우저에서 http://localhost:3000 접속하여 MetaMask 연결 후 퀴즈 참여

### 4. 퀴즈 문제 추가 (관리자만)
```bash
# questions.json 파일 수정 후 실행
npx hardhat run scripts/add-and-reveal-questions.js --network sepolia
```

## 프로젝트 개요

이 프로젝트는 완전한 온체인 로직을 통해 신뢰성 있는 퀴즈 게임을 구현한 데모입니다. 모든 게임 상태와 로직은 스마트 컨트랙트에 의해 관리되며, 프론트엔드는 순수하게 UI와 이벤트 처리만을 담당합니다.

## 기술 스택

### Smart Contract Layer
- **Solidity ^0.8.19**: 스마트 컨트랙트 개발 언어
- **Hardhat**: 이더리움 개발 프레임워크 (컴파일, 테스트, 배포)
- **EVM Compatible Networks**: Ethereum Virtual Machine 호환 블록체인
  - Sepolia Testnet (테스트용)
  - Base Network (프로덕션 옵션)

### Frontend Layer
- **Next.js 14**: React 기반 풀스택 프레임워크 (TypeScript)
- **ethers.js v6**: 이더리움 블록체인과의 상호작용 라이브러리
- **Browser Provider**: MetaMask 등 지갑 연동

### 개발 도구
- **TypeScript**: 정적 타입 검사 및 개발 생산성
- **ESLint**: 코드 품질 관리
- **Git**: 버전 관리

## 핵심 설계 원칙

### 1. 단일 상태 소유자 (Single Source of Truth)
- 모든 게임 상태는 스마트 컨트랙트가 소유
- 프론트엔드는 상태를 읽기만 하고 결정하지 않음
- 데이터 무결성과 신뢰성 보장

### 2. 이벤트 기반 상태 전이 (Event-Driven Architecture)
- 함수 return 값 대신 이벤트 수신으로 UI 업데이트
- 실시간 상태 동기화
- 네트워크 지연이나 트랜잭션 실패에 대한 견고성

### 3. 선형 플로우 (Linear Flow)
- 사용자 선택이나 설정 옵션 최소화
- 예측 가능한 사용자 경험
- 디버깅과 테스트 용이성

## 서버 배포 및 운영

### 서버에 배포하기
```bash
# 1. 프로젝트 클론
git clone <repository-url>
cd hyblock_fm_2025

# 2. 의존성 설치
npm install

# 3. 환경변수 설정 (.env.local)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x4A82708Edb7155eC26b140B52119c74F31a134FA
NEXT_PUBLIC_NETWORK_ID=11155111

# 4. 프로덕션 빌드 및 실행
npm run build
npm start
```

### 퀴즈 문제 추가 방법

**1. questions.json 파일 편집**
```json
[
  {
    "question": "질문 내용",
    "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
    "correctIndex": 2
  }
]
```

**2. 관리자 권한으로 추가 (컨트랙트 소유자만)**
```bash
# 환경변수 설정
PRIVATE_KEY=관리자_지갑_개인키
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/PROJECT_ID

# 문제 추가 및 공개
npx hardhat run scripts/add-and-reveal-questions.js --network sepolia
```

**3. 현재 상태 확인**
```bash
npx hardhat run scripts/check-status.js --network sepolia
```

### 사용자 플로우
1. **MetaMask 설정**: Sepolia 네트워크 추가 (아래 가이드 참조)
2. **테스트 ETH 받기**: Sepolia Faucet에서 무료 ETH 획득
3. **웹사이트 접속**: 브라우저에서 지갑 연결
4. **사용자 등록**: 닉네임 입력 후 등록
5. **퀴즈 참여**: 공개된 문제에 답변 제출
6. **점수 확인**: 정답 시 자동으로 10점 획득

## 사용자용 MetaMask 설정 가이드

### Sepolia 테스트넷 추가하기
사용자는 다음 정보로 MetaMask에 Sepolia 네트워크를 추가해야 합니다:

```
네트워크 이름: Sepolia
RPC URL: https://sepolia.infura.io/v3/
체인 ID: 11155111
통화 기호: ETH
블록 탐색기: https://sepolia.etherscan.io/
```

### 무료 테스트 ETH 받기
퀴즈 참여를 위해 트랜잭션 수수료용 테스트 ETH가 필요합니다:
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Chainlink Faucet](https://faucets.chain.link/sepolia)

### 참여 방법
1. MetaMask를 Sepolia 네트워크로 전환
2. 웹사이트에서 "Connect MetaMask" 클릭
3. 닉네임 입력하여 등록 (약 0.001 ETH 수수료)
4. 퀴즈 문제에 답변 제출 (문제당 약 0.001 ETH 수수료)
5. 정답 시 10점 획득!

\`.env.local\` 파일을 편집하여 다음 값들을 설정:

\`\`\`bash
# 지갑 개인키 (0x 제외)
PRIVATE_KEY=your_wallet_private_key

# 블록체인 네트워크 RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_project_id
BASE_RPC_URL=https://mainnet.base.org

# 배포된 컨트랙트 주소 (배포 후 설정)
NEXT_PUBLIC_CONTRACT_ADDRESS=

# 네트워크 ID (Sepolia: 11155111, Base: 8453)
NEXT_PUBLIC_NETWORK_ID=11155111
\`\`\`

**3단계: 스마트 컨트랙트 배포**
\`\`\`bash
# 1. 컨트랙트 컴파일
npm run compile

# 2. 테스트 실행 (12개 테스트 모두 통과해야 함)
npm test

# 3. Sepolia 테스트넷에 배포
npm run deploy:sepolia
\`\`\`

배포 성공 시 출력되는 컨트랙트 주소를 \`.env.local\`의 \`NEXT_PUBLIC_CONTRACT_ADDRESS\`에 설정

**4단계: 퀴즈 문제 설정 (관리자만)**
\`\`\`bash
# 샘플 퀴즈 문제 3개 추가 및 공개
npm run setup-questions

# 현재 퀴즈 상태 확인
npm run check-status
\`\`\`

**5단계: 프론트엔드 실행**
\`\`\`bash
# 개발 서버 시작
npm run dev

# 프로덕션 모드
npm run build && npm start
\`\`\`

브라우저에서 http://localhost:3000 접속

### 환경변수 에러 해결

만약 "Contract address not found" 에러가 발생하면:
1. \`.env.local\` 파일이 프로젝트 루트에 존재하는지 확인
2. \`NEXT_PUBLIC_CONTRACT_ADDRESS\` 값이 올바르게 설정되었는지 확인
3. 개발 서버를 재시작: \`Ctrl+C\` 후 \`npm run dev\`

## 사용자 플로우

### 1단계: 지갑 연결 (Wallet Connection)
- **MetaMask 브라우저 확장**: 이더리움 지갑 및 DApp 브라우저
- **Web3 Provider**: 브라우저와 블록체인 간 통신 인터페이스
- **Network 설정**: Sepolia 테스트넷 (Chain ID: 11155111)

### 2단계: 사용자 등록 (Player Registration)
- **Transaction 생성**: register() 함수 호출
- **Gas Fee**: 트랜잭션 처리를 위한 수수료 (testnet ETH)
- **Block Confirmation**: 블록에 포함되어 상태 변경 확정
- **Event Emission**: PlayerRegistered 이벤트 발생

### 3단계: 퀴즈 참여 (Quiz Participation)
- **Question Loading**: getQuestion() 뷰 함수로 문제 조회
- **Answer Submission**: submitAnswer() 함수로 답안 제출
- **Automatic Scoring**: 컨트랙트가 자동으로 정답 판정 (10점 획득)
- **Real-time Updates**: AnswerSubmitted, ScoreUpdated 이벤트 실시간 수신

## 기술 개념 설명

### 블록체인 및 이더리움 기본

**Smart Contract (스마트 컨트랙트)**
- 이더리움 블록체인에 배포되는 자동 실행 계약
- 조건이 충족되면 자동으로 실행되는 코드
- 중앙 권한 없이 신뢰할 수 있는 거래 및 계약 실행

**Gas와 Transaction (가스와 트랜잭션)**
- Transaction: 블록체인 상태를 변경하는 작업
- Gas: 트랜잭션 실행에 필요한 연산 비용
- Gas Price: 가스 1단위당 지불할 ETH 수량

**Events (이벤트)**
- 컨트랙트에서 발생하는 로그 기록
- 프론트엔드가 블록체인 상태 변화를 실시간 감지
- 인덱싱되어 효율적인 검색 가능

### 개발 프레임워크

**Hardhat**
- 이더리움 소프트웨어 개발 환경
- 컨트랙트 컴파일, 테스트, 디버깅, 배포 지원
- 로컬 블록체인 네트워크 시뮬레이션

**ethers.js**
- 이더리움 블록체인과 상호작용하는 JavaScript 라이브러리
- Provider: 블록체인 네트워크 연결
- Signer: 트랜잭션 서명을 위한 지갑 인터페이스
- Contract: 스마트 컨트랙트와의 상호작용 추상화

### 보안 메커니즘

**Commit-Reveal Scheme**
- 문제 추가 시점에는 정답을 암호화된 해시로만 저장
- 나중에 원본 값과 솔트를 공개하여 정답 검증
- 정답 유출 방지 및 공정성 보장

**Access Control (접근 제어)**
- onlyOwner: 컨트랙트 소유자만 실행 가능한 함수
- onlyRegistered: 등록된 사용자만 실행 가능한 함수
- 권한 없는 접근으로부터 시스템 보호

## 개발자 도구 및 명령어

### Smart Contract 개발

\`\`\`bash
# Solidity 컨트랙트 컴파일
npm run compile

# 단위 테스트 및 통합 테스트 실행 (12개 테스트)
npm run test

# 로컬 Hardhat 네트워크에 배포
npm run local-deploy

# Sepolia 테스트넷에 배포
npm run deploy:sepolia
\`\`\`

### Quiz 관리 (관리자 전용)

\`\`\`bash
# JSON 기반 문제 추가 및 공개
npx hardhat run scripts/add-and-reveal-questions.js --network sepolia

# 현재 퀴즈 상태, 문제 수, 활성화 여부 확인
npx hardhat run scripts/check-status.js --network sepolia
\`\`\`

### Frontend 개발

\`\`\`bash
# Next.js 개발 서버 (Hot Reload 지원)
npm run dev

# TypeScript 타입 체크 및 프로덕션 빌드
npm run build

# ESLint 코드 품질 검사
npm run lint
\`\`\`

## 프로젝트 구조

\`\`\`
├── contracts/
│   └── QuizGame.sol          # Solidity 스마트 컨트랙트 (게임 로직)
├── scripts/
│   ├── deploy.js             # 컨트랙트 배포 및 초기 설정
│   ├── setup-questions.js    # 샘플 문제 추가 및 답안 공개
│   └── check-status.js       # 컨트랙트 상태 모니터링
├── test/
│   └── QuizGame.test.js      # Mocha/Chai 기반 컨트랙트 테스트
├── app/                      # Next.js 13+ App Router 구조
│   ├── components/
│   │   ├── WalletConnection.tsx  # MetaMask 연동 컴포넌트
│   │   ├── Registration.tsx      # 사용자 등록 UI
│   │   └── QuizGame.tsx          # 퀴즈 게임 메인 UI
│   ├── lib/
│   │   └── contract.ts       # ethers.js 컨트랙트 wrapper
│   ├── globals.css           # 전역 스타일
│   ├── layout.tsx            # 루트 레이아웃
│   └── page.tsx              # 메인 페이지
├── hardhat.config.js         # Hardhat 네트워크 및 컴파일러 설정
├── next.config.js            # Next.js 최적화 설정
├── tsconfig.json            # TypeScript 컴파일러 설정
├── quick-start.sh           # 자동 설정 스크립트
└── package.json             # 의존성 및 스크립트 정의
\`\`\`

## 주요 기능

### Smart Contract 기능
- **Player Management**: 사용자 등록, 이름 변경, 등록 상태 확인
- **Question Management**: Commit-Reveal 패턴으로 보안성 있는 문제 관리
- **Answer Processing**: 자동 정답 판정, 중복 제출 방지, 점수 계산
- **Event Logging**: 모든 중요한 상태 변화를 이벤트로 기록
- **Access Control**: 소유자 권한, 등록 사용자 권한 분리
- **Security**: Custom Error를 통한 가스 효율성, 입력값 검증

### Frontend 기능
- **Wallet Integration**: MetaMask 자동 감지 및 연결
- **Real-time Sync**: Contract 이벤트 실시간 구독 및 UI 업데이트  
- **Transaction Management**: 트랜잭션 상태 추적 및 사용자 피드백
- **Error Handling**: 네트워크 오류, 사용자 거부 등 포괄적 에러 처리
- **Responsive Design**: 모바일 및 데스크톱 호환 UI
- **State Management**: 이벤트 기반 상태 동기화

## 테스트 및 검증

\`\`\`bash
# 전체 테스트 실행 (12개 테스트)
npm test
\`\`\`

### 테스트 범위

**Registration Tests**
- 정상 사용자 등록 및 PlayerRegistered 이벤트 검증
- 빈 이름 입력 시 EmptyName 커스텀 에러 발생 확인
- 중복 등록 시 AlreadyRegistered 에러 처리

**Question Management Tests**  
- 관리자의 문제 추가 기능 및 QuestionAdded 이벤트
- Commit-Reveal 패턴의 정답 공개 메커니즘
- 잘못된 솔트나 정답으로 공개 시도 시 에러 처리

**Answer Submission Tests**
- 정답 제출 시 AnswerSubmitted(true) 이벤트 및 점수 업데이트
- 오답 제출 시 AnswerSubmitted(false) 이벤트 (점수 변화 없음)
- 중복 제출 방지 (AlreadyAnswered 에러)
- 미등록 사용자 제출 방지 (NotRegistered 에러)

**View Function Tests**
- getQuestion(): 문제 텍스트와 4개 선택지 반환 검증
- getQuestionState(): 활성 상태, 공개 상태, 생성자 정보 확인

## 네트워크 설정

### Sepolia Testnet (추천)
- **Network Name**: Sepolia  
- **RPC URL**: https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
- **Chain ID**: 11155111
- **Currency Symbol**: ETH
- **Block Explorer**: https://sepolia.etherscan.io/

### Base Network (프로덕션 옵션)
- **Network Name**: Base
- **RPC URL**: https://mainnet.base.org
- **Chain ID**: 8453  
- **Currency Symbol**: ETH
- **Block Explorer**: https://basescan.org/

### 테스트 ETH Faucet
무료 테스트 ETH 획득 (거래 수수료용):
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Chainlink Faucet](https://faucets.chain.link/sepolia)

### Infura 설정
1. [Infura](https://infura.io/) 계정 생성
2. 새 프로젝트 생성 
3. Project ID를 RPC URL에 추가: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

## 보안 및 최적화

### 가스 효율성
- **Custom Errors**: 기존 require 문 대신 커스텀 에러로 가스 비용 절약
- **Efficient Storage**: 필요한 데이터만 상태변수로 저장
- **Event Indexing**: 효율적인 로그 검색을 위한 indexed 매개변수

### 접근 제어
- **onlyOwner Modifier**: 컨트랙트 소유자만 문제 추가/관리 가능
- **onlyRegistered Modifier**: 등록된 사용자만 퀴즈 참여 가능
- **Function Visibility**: 외부 호출이 필요한 함수만 public으로 노출

### 데이터 무결성
- **Input Validation**: 모든 입력값에 대한 검증 (빈 문자열, 인덱스 범위)
- **Duplicate Prevention**: 중복 등록, 중복 답안 제출 방지
- **State Consistency**: 상태 변경 전 조건 검사

### Answer Security  
- **Commit-Reveal Scheme**: 문제 추가 시 정답을 해시로 암호화
- **Salt Usage**: 무작위 솔트로 해시 충돌 및 추측 공격 방지
- **Delayed Revelation**: 답안 제출 기간과 정답 공개 시점 분리

## 문제 해결

### 일반적인 에러

**"Contract address not found in environment variables"**
- `.env.local` 파일 존재 여부 확인
- `NEXT_PUBLIC_CONTRACT_ADDRESS=0x78f9C1d0E1A77b2a61Ad071DAb84fb1448CA33b0` 설정 확인  
- 서버 재시작 (`Ctrl+C` 후 `npm start`)

**"Cannot read properties of null (reading 'removeAllListeners')"**  
- 컨트랙트 초기화 실패로 인한 null 참조
- 네트워크 연결 및 컨트랙트 주소 재확인

**MetaMask 연결 실패**
- MetaMask 설치 여부 확인
- 올바른 네트워크 (Sepolia) 연결 확인
- 브라우저 새로고침 후 재시도

**Transaction 실패**
- 충분한 테스트 ETH 잔액 확인
- Gas Limit 자동 설정 허용
- 네트워크 혼잡 시 Gas Price 증가

### 개발 환경 이슈

**Hardhat 컴파일 에러**
- Node.js 버전 확인 (v16+ 권장)
- `npm install` 재실행
- `npx hardhat clean` 후 재컴파일

**Next.js 빌드 실패**
- TypeScript 에러 확인 및 수정
- `.next` 폴더 삭제 후 재빌드
- 환경변수 설정 검증

## 중요 사항

### 현재 배포된 컨트랙트
- **주소**: `0x78f9C1d0E1A77b2a61Ad071DAb84fb1448CA33b0`
- **네트워크**: Sepolia Testnet (Chain ID: 11155111)
- **상태**: 활성화, 블록체인/Web3 관련 문제 5개 공개됨

### 권한 및 제한사항
- **문제 추가**: 컨트랙트 소유자(관리자)만 가능
- **답변 제출**: 등록된 사용자 누구나 가능
- **중복 제출**: 같은 문제에 한 번만 답변 가능
- **소유자 제한**: 문제를 낸 사람은 자신의 문제에 답변 불가

### 점수 시스템
- 정답: 10점 획득
- 오답: 점수 변화 없음
- 문제 추가 시: 관리자에게 10점 보너스

## 라이선스

MIT 라이선스 하에 배포됩니다.

---

**HYBLOCK Year-End On-Chain Quiz 2025**

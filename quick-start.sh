#!/bin/bash

echo "🚀 HyBlock Quiz DApp - 빠른 시작 스크립트"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되지 않았습니다. Node.js를 먼저 설치해주세요."
    exit 1
fi

echo "📦 의존성 설치 중..."
npm install

echo "🔧 스마트 컨트랙트 컴파일 중..."
npm run compile

echo "🧪 테스트 실행 중..."
npm test

if [ $? -eq 0 ]; then
    echo "✅ 모든 테스트 통과!"
else
    echo "❌ 테스트 실패. 문제를 확인해주세요."
    exit 1
fi

echo "🏗️  프론트엔드 빌드 중..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 빌드 성공!"
else
    echo "❌ 빌드 실패. 문제를 확인해주세요."
    exit 1
fi

echo ""
echo "🎉 설정 완료!"
echo ""
echo "다음 단계:"
echo "1. .env.local 파일을 생성하고 환경 변수를 설정하세요"
echo "2. npm run deploy:sepolia 로 컨트랙트를 배포하세요"
echo "3. npm run setup-questions 로 샘플 문제를 추가하세요"
echo "4. npm run dev 로 개발 서버를 시작하세요"
echo ""
echo "자세한 내용은 README.md를 참조하세요."
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract QuizGame {
    // Custom Errors (gas-efficient reverts)
    error NotOwner();
    error NotRegistered();
    error AlreadyRegistered();
    error EmptyName();
    error QuestionNotFound();
    error QuestionInactive();
    error QuestionNotRevealed();
    error AlreadyRevealed();
    error InvalidAnswer();
    error AlreadyAnswered();
    error EmptyQuestion();
    error EmptyOption();
    error EmptyAnswerHash();
    error NotCreator();
    error CreatorCannotAnswer();

    uint256 private constant SCORE_REWARD = 10;
    uint8 private constant UNSET_ANSWER = type(uint8).max;

    // Question (commit-reveal: answerHash committed, revealed later)
    struct Question {
        string questionText;
        string[4] options;
        bytes32 answerHash; // keccak256(abi.encode(correctAnswer, salt))
        uint8 correctAnswer; // revealed answer (0-3), UNSET_ANSWER when unrevealed
        address creator;
        bool isActive;
        bool isRevealed;
    }

    // State
    address public owner;
    mapping(uint256 => Question) private questions; // avoid auto-getter exposing answers
    uint256 public questionCount;

    mapping(address => string) public playerNames;
    mapping(address => bool) public hasRegistered;

    mapping(address => uint256) public playerScores;
    mapping(uint256 => mapping(address => bool)) public hasAnswered;

    // Events
    event PlayerRegistered(address indexed player, string name);
    event QuestionAdded(
        uint256 indexed questionId,
        string questionText,
        address indexed creator
    );
    event AnswerSubmitted(
        address indexed player,
        uint256 indexed questionId,
        bool isCorrect
    );
    event ScoreUpdated(address indexed player, uint256 newScore);
    event QuestionStatusChanged(uint256 indexed questionId, bool isActive);
    event NameChanged(address indexed player, string newName);
    event AnswerRevealed(
        uint256 indexed questionId,
        uint8 correctAnswer,
        bytes32 salt
    );

    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyRegistered() {
        if (!hasRegistered[msg.sender]) revert NotRegistered();
        _;
    }

    modifier questionExists(uint256 _questionId) {
        if (_questionId >= questionCount) revert QuestionNotFound();
        if (!questions[_questionId].isActive) revert QuestionInactive();
        _;
    }

    constructor() {
        owner = msg.sender;
        questionCount = 0;
    }

    // 참가자 등록 함수
    function register(string memory _name) public {
        if (bytes(_name).length == 0) revert EmptyName();
        if (hasRegistered[msg.sender]) revert AlreadyRegistered();

        playerNames[msg.sender] = _name;
        hasRegistered[msg.sender] = true;

        emit PlayerRegistered(msg.sender, _name);
    }

    // 이름 변경 함수
    function changeName(string memory _newName) public onlyRegistered {
        if (bytes(_newName).length == 0) revert EmptyName();

        playerNames[msg.sender] = _newName;
        emit NameChanged(msg.sender, _newName);
    }

    // 문제 추가 (출제자 1인: owner만)
    // _answerHash = keccak256(abi.encode(correctAnswerIndex, salt))
    function addQuestion(
        string memory _questionText,
        string[4] memory _options,
        bytes32 _answerHash
    ) public onlyOwner {
        if (bytes(_questionText).length == 0) revert EmptyQuestion();
        if (_answerHash == bytes32(0)) revert EmptyAnswerHash();
        for (uint256 i = 0; i < 4; i++) {
            if (bytes(_options[i]).length == 0) revert EmptyOption();
        }

        questions[questionCount] = Question({
            questionText: _questionText,
            options: _options,
            answerHash: _answerHash,
            correctAnswer: UNSET_ANSWER,
            creator: msg.sender,
            isActive: true,
            isRevealed: false
        });

        emit QuestionAdded(questionCount, _questionText, msg.sender);
        questionCount++;
    }

    // 정답 공개 (reveal): salt와 정답 인덱스로 커밋 일치 확인 후 공개
    function revealAnswer(
        uint256 _questionId,
        uint8 _correctAnswer,
        bytes32 _salt
    ) public {
        if (_questionId >= questionCount) revert QuestionNotFound();
        if (_correctAnswer >= 4) revert InvalidAnswer();
        Question storage q = questions[_questionId];
        if (msg.sender != q.creator) revert NotCreator();
        if (q.isRevealed) revert AlreadyRevealed();

        bytes32 expectedHash = keccak256(abi.encode(_correctAnswer, _salt));
        if (expectedHash != q.answerHash) revert InvalidAnswer();

        q.correctAnswer = _correctAnswer;
        q.isRevealed = true;

        playerScores[msg.sender] += SCORE_REWARD;
        emit ScoreUpdated(msg.sender, playerScores[msg.sender]);
        emit AnswerRevealed(_questionId, _correctAnswer, _salt);
    }

    // 답안 제출 (리빌된 문제만)
    function submitAnswer(
        uint256 _questionId,
        uint8 _answer
    ) public onlyRegistered questionExists(_questionId) {
        if (_answer >= 4) revert InvalidAnswer();
        if (questions[_questionId].creator == msg.sender)
            revert CreatorCannotAnswer();
        if (hasAnswered[_questionId][msg.sender]) revert AlreadyAnswered();
        if (!questions[_questionId].isRevealed) revert QuestionNotRevealed();

        hasAnswered[_questionId][msg.sender] = true;

        bool isCorrect = (questions[_questionId].correctAnswer == _answer);

        if (isCorrect) {
            playerScores[msg.sender] += SCORE_REWARD;
            emit ScoreUpdated(msg.sender, playerScores[msg.sender]);
        }

        emit AnswerSubmitted(msg.sender, _questionId, isCorrect);
    }

    // 문제 조회 함수 (정답 제외)
    function getQuestion(
        uint256 _questionId
    )
        public
        view
        questionExists(_questionId)
        returns (string memory questionText, string[4] memory options)
    {
        Question memory q = questions[_questionId];
        return (q.questionText, q.options);
    }

    // 문제 상태 조회 (활성/리빌 여부)
    function getQuestionState(
        uint256 _questionId
    ) public view returns (bool isActive, bool isRevealed, address creator) {
        if (_questionId >= questionCount) revert QuestionNotFound();
        Question memory q = questions[_questionId];
        return (q.isActive, q.isRevealed, q.creator);
    }

    // 플레이어 이름 조회
    function getPlayerName(
        address _player
    ) public view returns (string memory) {
        if (!hasRegistered[_player]) revert NotRegistered();
        return playerNames[_player];
    }

    // 내 이름 조회
    function getMyName() public view returns (string memory) {
        if (!hasRegistered[msg.sender]) revert NotRegistered();
        return playerNames[msg.sender];
    }

    // 플레이어 점수 조회
    function getPlayerScore(address _player) public view returns (uint256) {
        return playerScores[_player];
    }

    // 내 점수 조회
    function getMyScore() public view returns (uint256) {
        return playerScores[msg.sender];
    }

    // 문제 활성화/비활성화 (관리자만 가능)
    function setQuestionActive(
        uint256 _questionId,
        bool _isActive
    ) public onlyOwner {
        if (_questionId >= questionCount) revert QuestionNotFound();
        questions[_questionId].isActive = _isActive;
        emit QuestionStatusChanged(_questionId, _isActive);
    }

    // 답변 여부 확인
    function hasPlayerAnswered(
        uint256 _questionId,
        address _player
    ) public view returns (bool) {
        return hasAnswered[_questionId][_player];
    }

    // 정답 확인 (관리자만 가능, 리빌 후)
    function getCorrectAnswer(
        uint256 _questionId
    ) public view onlyOwner returns (uint8) {
        if (_questionId >= questionCount) revert QuestionNotFound();
        if (!questions[_questionId].isRevealed) revert QuestionNotRevealed();
        return questions[_questionId].correctAnswer;
    }
}
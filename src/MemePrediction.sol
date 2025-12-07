// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MemeAnalytics.sol";

/**
 * @title MemePrediction
 * @dev 밈 트렌드 예측 게임 - InfoFi의 핵심 참여 메커니즘
 * @notice 사용자가 밈의 Cultural Impact Score 변화를 예측하고 보상 획득
 */
contract MemePrediction {
    MemeAnalytics public analytics;
    address public owner;
    address public rewardContract;

    // 예측 라운드 상태
    enum RoundStatus {
        Open,
        Closed,
        Resolved
    }

    // 예측 유형
    enum PredictionType {
        ScoreUp, // Cultural Score 상승
        ScoreDown, // Cultural Score 하락
        TrendUp, // 트렌드 상승 (확산 증가)
        TrendDown, // 트렌드 하락
        RegionSpread // 특정 지역으로 확산
    }

    // 예측 라운드 구조체
    struct PredictionRound {
        uint256 roundId;
        string tokenSymbol; // 예측 대상 토큰
        uint256 startTime;
        uint256 endTime;
        uint256 resolutionTime; // 결과 확정 시간
        uint256 initialScore; // 시작 시점 Cultural Score
        uint256 finalScore; // 종료 시점 Cultural Score
        uint256 totalUpStake; // 상승 예측 총 스테이킹
        uint256 totalDownStake; // 하락 예측 총 스테이킹
        RoundStatus status;
        PredictionType predictionType;
        bool resolved;
        bool upWon; // true: 상승 예측 승리
    }

    // 사용자 예측 구조체
    struct UserPrediction {
        uint256 roundId;
        address user;
        bool predictedUp; // true: 상승 예측
        uint256 stakeAmount;
        bool claimed;
        uint256 reward;
    }

    // 저장소
    mapping(uint256 => PredictionRound) public rounds;
    mapping(uint256 => mapping(address => UserPrediction)) public userPredictions;
    mapping(address => uint256[]) public userRoundHistory;
    mapping(address => uint256) public userTotalWins;
    mapping(address => uint256) public userTotalPredictions;

    uint256 public currentRoundId;
    uint256 public minStake = 0.001 ether;
    uint256 public platformFeePercent = 5; // 5%

    // 이벤트
    event RoundCreated(
        uint256 indexed roundId, string tokenSymbol, uint256 startTime, uint256 endTime, uint256 initialScore
    );

    event PredictionMade(uint256 indexed roundId, address indexed user, bool predictedUp, uint256 stakeAmount);

    event RoundResolved(uint256 indexed roundId, bool upWon, uint256 finalScore);

    event RewardClaimed(uint256 indexed roundId, address indexed user, uint256 reward);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _analytics) {
        owner = msg.sender;
        analytics = MemeAnalytics(_analytics);
    }

    /**
     * @dev 보상 컨트랙트 설정
     */
    function setRewardContract(address _rewardContract) external onlyOwner {
        rewardContract = _rewardContract;
    }

    /**
     * @dev 새 예측 라운드 생성
     */
    function createRound(string calldata _tokenSymbol, uint256 _duration, PredictionType _predictionType)
        external
        onlyOwner
        returns (uint256)
    {
        currentRoundId++;

        // Analytics에서 현재 Cultural Score 가져오기
        (,, uint256 avgCulturalScore,,,,) = analytics.tokenAnalyses(_tokenSymbol);

        rounds[currentRoundId] = PredictionRound({
            roundId: currentRoundId,
            tokenSymbol: _tokenSymbol,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            resolutionTime: 0,
            initialScore: avgCulturalScore,
            finalScore: 0,
            totalUpStake: 0,
            totalDownStake: 0,
            status: RoundStatus.Open,
            predictionType: _predictionType,
            resolved: false,
            upWon: false
        });

        emit RoundCreated(currentRoundId, _tokenSymbol, block.timestamp, block.timestamp + _duration, avgCulturalScore);

        return currentRoundId;
    }

    /**
     * @dev 예측 참여
     */
    function predict(uint256 _roundId, bool _predictUp) external payable {
        PredictionRound storage round = rounds[_roundId];

        require(round.roundId != 0, "Round not found");
        require(round.status == RoundStatus.Open, "Round not open");
        require(block.timestamp < round.endTime, "Round ended");
        require(msg.value >= minStake, "Below min stake");
        require(userPredictions[_roundId][msg.sender].stakeAmount == 0, "Already predicted");

        userPredictions[_roundId][msg.sender] = UserPrediction({
            roundId: _roundId,
            user: msg.sender,
            predictedUp: _predictUp,
            stakeAmount: msg.value,
            claimed: false,
            reward: 0
        });

        if (_predictUp) {
            round.totalUpStake += msg.value;
        } else {
            round.totalDownStake += msg.value;
        }

        userRoundHistory[msg.sender].push(_roundId);
        userTotalPredictions[msg.sender]++;

        emit PredictionMade(_roundId, msg.sender, _predictUp, msg.value);
    }

    /**
     * @dev 라운드 종료 (예측 마감)
     */
    function closeRound(uint256 _roundId) external onlyOwner {
        PredictionRound storage round = rounds[_roundId];

        require(round.roundId != 0, "Round not found");
        require(round.status == RoundStatus.Open, "Not open");
        require(block.timestamp >= round.endTime, "Not ended yet");

        round.status = RoundStatus.Closed;
    }

    /**
     * @dev 라운드 결과 확정 (오라클/오너가 호출)
     */
    function resolveRound(uint256 _roundId, uint256 _finalScore) external onlyOwner {
        PredictionRound storage round = rounds[_roundId];

        require(round.roundId != 0, "Round not found");
        require(round.status == RoundStatus.Closed || block.timestamp >= round.endTime, "Not closed");
        require(!round.resolved, "Already resolved");

        round.finalScore = _finalScore;
        round.resolutionTime = block.timestamp;
        round.resolved = true;
        round.status = RoundStatus.Resolved;

        // 상승/하락 결정
        round.upWon = _finalScore > round.initialScore;

        emit RoundResolved(_roundId, round.upWon, _finalScore);
    }

    /**
     * @dev 보상 청구
     */
    function claimReward(uint256 _roundId) external {
        PredictionRound storage round = rounds[_roundId];
        UserPrediction storage prediction = userPredictions[_roundId][msg.sender];

        require(round.resolved, "Not resolved");
        require(prediction.stakeAmount > 0, "No prediction");
        require(!prediction.claimed, "Already claimed");

        prediction.claimed = true;

        // 승리 여부 확인
        bool won = (prediction.predictedUp == round.upWon);

        if (won) {
            uint256 totalWinningStake = round.upWon ? round.totalUpStake : round.totalDownStake;
            uint256 totalLosingStake = round.upWon ? round.totalDownStake : round.totalUpStake;

            // 보상 계산: 자신의 스테이크 + (패자 풀에서 비율만큼)
            uint256 platformFee = (totalLosingStake * platformFeePercent) / 100;
            uint256 rewardPool = totalLosingStake - platformFee;

            uint256 reward = prediction.stakeAmount + (rewardPool * prediction.stakeAmount) / totalWinningStake;

            prediction.reward = reward;
            userTotalWins[msg.sender]++;

            payable(msg.sender).transfer(reward);

            emit RewardClaimed(_roundId, msg.sender, reward);
        }
        // 패자는 보상 없음 (스테이크 손실)
    }

    /**
     * @dev 라운드 정보 조회
     */
    function getRound(uint256 _roundId) external view returns (PredictionRound memory) {
        return rounds[_roundId];
    }

    /**
     * @dev 사용자 예측 정보 조회
     */
    function getUserPrediction(uint256 _roundId, address _user) external view returns (UserPrediction memory) {
        return userPredictions[_roundId][_user];
    }

    /**
     * @dev 사용자 통계 조회
     */
    function getUserStats(address _user)
        external
        view
        returns (uint256 totalPredictions, uint256 totalWins, uint256 winRate)
    {
        totalPredictions = userTotalPredictions[_user];
        totalWins = userTotalWins[_user];
        winRate = totalPredictions > 0 ? (totalWins * 10000) / totalPredictions : 0;
    }

    /**
     * @dev 활성 라운드 목록 조회
     */
    function getActiveRounds() external view returns (uint256[] memory) {
        uint256 count = 0;

        // 활성 라운드 개수 세기
        for (uint256 i = 1; i <= currentRoundId; i++) {
            if (rounds[i].status == RoundStatus.Open) {
                count++;
            }
        }

        uint256[] memory activeRounds = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 1; i <= currentRoundId; i++) {
            if (rounds[i].status == RoundStatus.Open) {
                activeRounds[index] = i;
                index++;
            }
        }

        return activeRounds;
    }

    /**
     * @dev 플랫폼 수수료 인출
     */
    function withdrawFees() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    /**
     * @dev 최소 스테이크 설정
     */
    function setMinStake(uint256 _minStake) external onlyOwner {
        minStake = _minStake;
    }

    receive() external payable {}
}

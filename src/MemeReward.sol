// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MemeToken.sol";
import "./MemePrediction.sol";

/**
 * @title MemeReward
 * @dev 보상 분배 시스템 - 예측 성공, 기여도에 따른 토큰 보상
 * @notice InfoFi 참여자에게 MISP 토큰 보상 제공
 */
contract MemeReward {
    MemeToken public token;
    MemePrediction public prediction;
    address public owner;

    // 보상 등급
    enum RewardTier { Bronze, Silver, Gold, Platinum, Diamond }

    // 사용자 프로필
    struct UserProfile {
        uint256 totalRewardsEarned;
        uint256 contributionScore;     // 기여도 점수
        uint256 predictionAccuracy;    // 예측 정확도 (0-10000)
        uint256 streakCount;           // 연속 성공 횟수
        uint256 maxStreak;             // 최대 연속 성공
        RewardTier tier;
        uint256 lastClaimTime;
        bool isActive;
    }

    // 보상 이벤트 구조체
    struct RewardEvent {
        uint256 eventId;
        address user;
        uint256 amount;
        string reason;                 // "prediction_win", "streak_bonus", "contribution", "daily"
        uint256 timestamp;
    }

    // 보상 설정
    struct RewardConfig {
        uint256 baseReward;            // 기본 보상
        uint256 streakMultiplier;      // 연속 보너스 배율 (100 = 1x)
        uint256 tierMultiplier;        // 등급 보너스 배율
        uint256 dailyClaimAmount;      // 일일 청구 가능량
    }

    // 저장소
    mapping(address => UserProfile) public userProfiles;
    mapping(address => RewardEvent[]) public userRewardHistory;
    mapping(RewardTier => RewardConfig) public tierConfigs;

    address[] public registeredUsers;
    uint256 public totalRewardsDistributed;
    uint256 public rewardEventCounter;

    // 등급 승급 기준 (예측 성공 횟수)
    uint256 public constant SILVER_THRESHOLD = 10;
    uint256 public constant GOLD_THRESHOLD = 50;
    uint256 public constant PLATINUM_THRESHOLD = 200;
    uint256 public constant DIAMOND_THRESHOLD = 500;

    // 이벤트
    event RewardDistributed(
        address indexed user,
        uint256 amount,
        string reason,
        uint256 eventId
    );

    event TierUpgraded(
        address indexed user,
        RewardTier oldTier,
        RewardTier newTier
    );

    event StreakUpdated(
        address indexed user,
        uint256 newStreak,
        bool isNewMax
    );

    event DailyRewardClaimed(
        address indexed user,
        uint256 amount
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyPrediction() {
        require(msg.sender == address(prediction) || msg.sender == owner, "Not authorized");
        _;
    }

    constructor(address _token, address payable _prediction) {
        owner = msg.sender;
        token = MemeToken(_token);
        prediction = MemePrediction(_prediction);

        // 기본 등급 설정
        _initializeTierConfigs();
    }

    function _initializeTierConfigs() internal {
        tierConfigs[RewardTier.Bronze] = RewardConfig({
            baseReward: 10 * 1e18,
            streakMultiplier: 100,
            tierMultiplier: 100,
            dailyClaimAmount: 5 * 1e18
        });

        tierConfigs[RewardTier.Silver] = RewardConfig({
            baseReward: 15 * 1e18,
            streakMultiplier: 110,
            tierMultiplier: 120,
            dailyClaimAmount: 10 * 1e18
        });

        tierConfigs[RewardTier.Gold] = RewardConfig({
            baseReward: 25 * 1e18,
            streakMultiplier: 125,
            tierMultiplier: 150,
            dailyClaimAmount: 20 * 1e18
        });

        tierConfigs[RewardTier.Platinum] = RewardConfig({
            baseReward: 50 * 1e18,
            streakMultiplier: 150,
            tierMultiplier: 200,
            dailyClaimAmount: 40 * 1e18
        });

        tierConfigs[RewardTier.Diamond] = RewardConfig({
            baseReward: 100 * 1e18,
            streakMultiplier: 200,
            tierMultiplier: 300,
            dailyClaimAmount: 100 * 1e18
        });
    }

    /**
     * @dev 사용자 등록
     */
    function registerUser(address _user) external {
        require(!userProfiles[_user].isActive, "Already registered");

        userProfiles[_user] = UserProfile({
            totalRewardsEarned: 0,
            contributionScore: 0,
            predictionAccuracy: 0,
            streakCount: 0,
            maxStreak: 0,
            tier: RewardTier.Bronze,
            lastClaimTime: 0,
            isActive: true
        });

        registeredUsers.push(_user);
    }

    /**
     * @dev 예측 성공 보상 지급
     */
    function rewardPredictionWin(address _user) external onlyPrediction {
        _ensureUserRegistered(_user);

        UserProfile storage profile = userProfiles[_user];
        RewardConfig memory config = tierConfigs[profile.tier];

        // 연속 성공 업데이트
        profile.streakCount++;
        bool isNewMax = false;
        if (profile.streakCount > profile.maxStreak) {
            profile.maxStreak = profile.streakCount;
            isNewMax = true;
        }

        emit StreakUpdated(_user, profile.streakCount, isNewMax);

        // 보상 계산: 기본 보상 * 연속 보너스 * 등급 배율
        uint256 streakBonus = 100 + (profile.streakCount * 5); // 연속당 5% 추가
        if (streakBonus > config.streakMultiplier) {
            streakBonus = config.streakMultiplier;
        }

        uint256 reward = (config.baseReward * streakBonus * config.tierMultiplier) / 10000;

        _distributeReward(_user, reward, "prediction_win");

        // 등급 업그레이드 확인
        _checkAndUpgradeTier(_user);
    }

    /**
     * @dev 예측 실패 처리 (연속 기록 리셋)
     */
    function recordPredictionLoss(address _user) external onlyPrediction {
        if (userProfiles[_user].isActive) {
            userProfiles[_user].streakCount = 0;
        }
    }

    /**
     * @dev 기여도 보상 (밈 제출, 분석 기여 등)
     */
    function rewardContribution(address _user, uint256 _contributionPoints) external onlyOwner {
        _ensureUserRegistered(_user);

        UserProfile storage profile = userProfiles[_user];
        profile.contributionScore += _contributionPoints;

        // 기여도 100점당 기본 보상 지급
        uint256 reward = (_contributionPoints * tierConfigs[profile.tier].baseReward) / 100;

        _distributeReward(_user, reward, "contribution");
    }

    /**
     * @dev 일일 보상 청구
     */
    function claimDailyReward() external {
        _ensureUserRegistered(msg.sender);

        UserProfile storage profile = userProfiles[msg.sender];

        require(
            profile.lastClaimTime == 0 || block.timestamp >= profile.lastClaimTime + 1 days,
            "Already claimed today"
        );

        profile.lastClaimTime = block.timestamp;

        uint256 dailyAmount = tierConfigs[profile.tier].dailyClaimAmount;

        _distributeReward(msg.sender, dailyAmount, "daily");

        emit DailyRewardClaimed(msg.sender, dailyAmount);
    }

    /**
     * @dev 보상 분배 내부 함수
     */
    function _distributeReward(address _user, uint256 _amount, string memory _reason) internal {
        rewardEventCounter++;

        token.mint(_user, _amount);

        userProfiles[_user].totalRewardsEarned += _amount;
        totalRewardsDistributed += _amount;

        userRewardHistory[_user].push(RewardEvent({
            eventId: rewardEventCounter,
            user: _user,
            amount: _amount,
            reason: _reason,
            timestamp: block.timestamp
        }));

        emit RewardDistributed(_user, _amount, _reason, rewardEventCounter);
    }

    /**
     * @dev 등급 확인 및 업그레이드
     */
    function _checkAndUpgradeTier(address _user) internal {
        UserProfile storage profile = userProfiles[_user];

        (uint256 totalPredictions, uint256 totalWins, ) = prediction.getUserStats(_user);

        RewardTier newTier = profile.tier;

        if (totalWins >= DIAMOND_THRESHOLD) {
            newTier = RewardTier.Diamond;
        } else if (totalWins >= PLATINUM_THRESHOLD) {
            newTier = RewardTier.Platinum;
        } else if (totalWins >= GOLD_THRESHOLD) {
            newTier = RewardTier.Gold;
        } else if (totalWins >= SILVER_THRESHOLD) {
            newTier = RewardTier.Silver;
        }

        if (newTier != profile.tier) {
            RewardTier oldTier = profile.tier;
            profile.tier = newTier;

            // 등급 업그레이드 보너스
            uint256 upgradeBonus = tierConfigs[newTier].baseReward * 5;
            _distributeReward(_user, upgradeBonus, "tier_upgrade");

            emit TierUpgraded(_user, oldTier, newTier);
        }

        // 정확도 업데이트
        if (totalPredictions > 0) {
            profile.predictionAccuracy = (totalWins * 10000) / totalPredictions;
        }
    }

    /**
     * @dev 사용자 등록 확인 및 자동 등록
     */
    function _ensureUserRegistered(address _user) internal {
        if (!userProfiles[_user].isActive) {
            userProfiles[_user] = UserProfile({
                totalRewardsEarned: 0,
                contributionScore: 0,
                predictionAccuracy: 0,
                streakCount: 0,
                maxStreak: 0,
                tier: RewardTier.Bronze,
                lastClaimTime: 0,
                isActive: true
            });
            registeredUsers.push(_user);
        }
    }

    /**
     * @dev 사용자 프로필 조회
     */
    function getUserProfile(address _user) external view returns (UserProfile memory) {
        return userProfiles[_user];
    }

    /**
     * @dev 사용자 보상 히스토리 조회
     */
    function getUserRewardHistory(address _user) external view returns (RewardEvent[] memory) {
        return userRewardHistory[_user];
    }

    /**
     * @dev 리더보드 데이터 (상위 N명)
     */
    function getLeaderboard(uint256 _count) external view returns (
        address[] memory users,
        uint256[] memory rewards
    ) {
        uint256 count = _count > registeredUsers.length ? registeredUsers.length : _count;

        users = new address[](count);
        rewards = new uint256[](count);

        // 간단한 정렬 (가스 비용 고려하여 오프체인 권장)
        address[] memory sortedUsers = new address[](registeredUsers.length);
        for (uint256 i = 0; i < registeredUsers.length; i++) {
            sortedUsers[i] = registeredUsers[i];
        }

        // 버블 정렬 (소규모용)
        for (uint256 i = 0; i < sortedUsers.length - 1; i++) {
            for (uint256 j = 0; j < sortedUsers.length - i - 1; j++) {
                if (userProfiles[sortedUsers[j]].totalRewardsEarned <
                    userProfiles[sortedUsers[j + 1]].totalRewardsEarned) {
                    address temp = sortedUsers[j];
                    sortedUsers[j] = sortedUsers[j + 1];
                    sortedUsers[j + 1] = temp;
                }
            }
        }

        for (uint256 i = 0; i < count; i++) {
            users[i] = sortedUsers[i];
            rewards[i] = userProfiles[sortedUsers[i]].totalRewardsEarned;
        }
    }

    /**
     * @dev Prediction 컨트랙트 변경
     */
    function setPrediction(address payable _prediction) external onlyOwner {
        prediction = MemePrediction(_prediction);
    }

    /**
     * @dev 등급 설정 변경
     */
    function setTierConfig(
        RewardTier _tier,
        uint256 _baseReward,
        uint256 _streakMultiplier,
        uint256 _tierMultiplier,
        uint256 _dailyClaimAmount
    ) external onlyOwner {
        tierConfigs[_tier] = RewardConfig({
            baseReward: _baseReward,
            streakMultiplier: _streakMultiplier,
            tierMultiplier: _tierMultiplier,
            dailyClaimAmount: _dailyClaimAmount
        });
    }
}

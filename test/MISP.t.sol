// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MemeToken.sol";
import "../src/MemeAnalytics.sol";
import "../src/MemePrediction.sol";
import "../src/MemeReward.sol";

contract MISPTest is Test {
    MemeToken public token;
    MemeAnalytics public analytics;
    MemePrediction public prediction;
    MemeReward public reward;

    address public owner = address(this);
    address public oracle = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);

    function setUp() public {
        // 컨트랙트 배포
        token = new MemeToken(1_000_000 * 1e18);
        analytics = new MemeAnalytics(oracle);
        prediction = new MemePrediction(address(analytics));
        reward = new MemeReward(address(token), payable(address(prediction)));

        // Reward 컨트랙트에 민팅 권한 부여
        token.addMinter(address(reward));

        // 테스트 사용자에게 ETH 제공
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    // ============ MemeToken 테스트 ============

    function test_TokenInitialSupply() public view {
        assertEq(token.totalSupply(), 1_000_000 * 1e18);
        assertEq(token.balanceOf(owner), 1_000_000 * 1e18);
    }

    function test_TokenTransfer() public {
        token.transfer(user1, 1000 * 1e18);
        assertEq(token.balanceOf(user1), 1000 * 1e18);
    }

    function test_TokenMinting() public {
        token.mint(user1, 500 * 1e18);
        assertEq(token.balanceOf(user1), 500 * 1e18);
    }

    // ============ MemeAnalytics 테스트 ============

    function test_RecordMeme() public {
        vm.prank(oracle);
        analytics.recordMeme(
            "meme_001",
            "WIF",
            8500,      // culturalScore
            7000,      // viralVelocity
            9000,      // sentimentScore
            6500,      // correlationScore
            "US"       // region
        );

        MemeAnalytics.MemeData memory meme = analytics.getMeme("meme_001");
        assertEq(meme.culturalScore, 8500);
        assertEq(keccak256(bytes(meme.tokenSymbol)), keccak256(bytes("WIF")));
    }

    function test_UpdateTokenAnalysis() public {
        vm.prank(oracle);
        analytics.updateTokenAnalysis(
            "WIF",
            150,       // totalMemeCount
            7800,      // avgCulturalScore
            5000,      // priceCorrelation (양의 상관관계)
            2,         // trendDirection (상승)
            "WIF shows strong viral momentum with 200% meme increase in 3 hours"
        );

        (
            string memory symbol,
            uint256 memeCount,
            uint256 avgScore,
            uint256 correlation,
            uint256 trend,
            uint256 lastUpdated,
        ) = analytics.tokenAnalyses("WIF");

        assertEq(memeCount, 150);
        assertEq(avgScore, 7800);
        assertEq(trend, 2);
    }

    // ============ MemePrediction 테스트 ============

    function test_CreatePredictionRound() public {
        // 먼저 토큰 분석 데이터 설정
        vm.prank(oracle);
        analytics.updateTokenAnalysis("WIF", 100, 5000, 0, 1, "Test insight");

        // 라운드 생성
        uint256 roundId = prediction.createRound(
            "WIF",
            1 hours,
            MemePrediction.PredictionType.ScoreUp
        );

        assertEq(roundId, 1);

        MemePrediction.PredictionRound memory round = prediction.getRound(1);
        assertEq(keccak256(bytes(round.tokenSymbol)), keccak256(bytes("WIF")));
        assertEq(uint256(round.status), uint256(MemePrediction.RoundStatus.Open));
    }

    function test_MakePrediction() public {
        // 라운드 설정
        vm.prank(oracle);
        analytics.updateTokenAnalysis("WIF", 100, 5000, 0, 1, "Test");

        prediction.createRound("WIF", 1 hours, MemePrediction.PredictionType.ScoreUp);

        // User1이 상승 예측
        vm.prank(user1);
        prediction.predict{value: 0.1 ether}(1, true);

        MemePrediction.UserPrediction memory userPred = prediction.getUserPrediction(1, user1);
        assertEq(userPred.predictedUp, true);
        assertEq(userPred.stakeAmount, 0.1 ether);
    }

    function test_PredictionRoundFlow() public {
        // 1. 라운드 설정
        vm.prank(oracle);
        analytics.updateTokenAnalysis("WIF", 100, 5000, 0, 1, "Test");

        prediction.createRound("WIF", 1 hours, MemePrediction.PredictionType.ScoreUp);

        // 2. 두 사용자가 반대 방향으로 예측
        vm.prank(user1);
        prediction.predict{value: 0.1 ether}(1, true);  // 상승 예측

        vm.prank(user2);
        prediction.predict{value: 0.1 ether}(1, false); // 하락 예측

        // 3. 시간 경과
        vm.warp(block.timestamp + 2 hours);

        // 4. 라운드 종료
        prediction.closeRound(1);

        // 5. 결과 확정 (점수 상승 = 상승 예측 승리)
        prediction.resolveRound(1, 6000);

        MemePrediction.PredictionRound memory round = prediction.getRound(1);
        assertEq(round.resolved, true);
        assertEq(round.upWon, true);

        // 6. 승자 보상 청구
        uint256 user1BalanceBefore = user1.balance;
        vm.prank(user1);
        prediction.claimReward(1);

        assertGt(user1.balance, user1BalanceBefore);
    }

    // ============ MemeReward 테스트 ============

    function test_UserRegistration() public {
        reward.registerUser(user1);

        MemeReward.UserProfile memory profile = reward.getUserProfile(user1);
        assertEq(profile.isActive, true);
        assertEq(uint256(profile.tier), uint256(MemeReward.RewardTier.Bronze));
    }

    function test_DailyRewardClaim() public {
        reward.registerUser(user1);

        vm.prank(user1);
        reward.claimDailyReward();

        assertGt(token.balanceOf(user1), 0);
    }

    function test_ContributionReward() public {
        reward.registerUser(user1);
        reward.rewardContribution(user1, 100);

        assertGt(token.balanceOf(user1), 0);
    }

    // ============ 통합 테스트 ============

    function test_FullIntegrationFlow() public {
        // 1. 오라클이 밈 데이터 기록
        vm.startPrank(oracle);
        analytics.recordMeme("viral_meme_1", "PEPE", 9000, 8500, 9200, 7000, "Global");
        analytics.updateTokenAnalysis("PEPE", 500, 8000, 7500, 2, "PEPE is trending globally");
        vm.stopPrank();

        // 2. 예측 라운드 생성
        prediction.createRound("PEPE", 30 minutes, MemePrediction.PredictionType.ScoreUp);

        // 3. 사용자들 예측
        vm.prank(user1);
        prediction.predict{value: 0.5 ether}(1, true);

        vm.prank(user2);
        prediction.predict{value: 0.3 ether}(1, false);

        // 4. 시간 경과 및 결과 확정
        vm.warp(block.timestamp + 1 hours);
        prediction.closeRound(1);
        prediction.resolveRound(1, 8500); // 점수 상승

        // 5. 보상 청구
        vm.prank(user1);
        prediction.claimReward(1);

        // 6. 통계 확인
        (uint256 totalPred, uint256 wins, uint256 rate) = prediction.getUserStats(user1);
        assertEq(totalPred, 1);
        assertEq(wins, 1);
    }
}

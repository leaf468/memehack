// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MemeToken.sol";
import "../src/MemeAnalytics.sol";
import "../src/MemePrediction.sol";
import "../src/MemeReward.sol";

/**
 * @title DeployMISP
 * @dev MISP (Meme Intelligence Social Platform) 전체 컨트랙트 배포 스크립트
 */
contract DeployMISP is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address oracle = vm.envAddress("ORACLE_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // 1. MemeToken 배포 (초기 공급량: 100만 토큰)
        MemeToken token = new MemeToken(1_000_000 * 1e18);
        console.log("MemeToken deployed at:", address(token));

        // 2. MemeAnalytics 배포
        MemeAnalytics analytics = new MemeAnalytics(oracle);
        console.log("MemeAnalytics deployed at:", address(analytics));

        // 3. MemePrediction 배포
        MemePrediction prediction = new MemePrediction(address(analytics));
        console.log("MemePrediction deployed at:", address(prediction));

        // 4. MemeReward 배포
        MemeReward reward = new MemeReward(address(token), payable(address(prediction)));
        console.log("MemeReward deployed at:", address(reward));

        // 5. MemeToken에 Reward 컨트랙트 민터 권한 부여
        token.addMinter(address(reward));
        console.log("MemeReward added as minter");

        // 6. Prediction에 Reward 컨트랙트 연결
        prediction.setRewardContract(address(reward));
        console.log("Reward contract linked to Prediction");

        vm.stopBroadcast();

        // 배포 주소 요약
        console.log("\n========== MISP Deployment Summary ==========");
        console.log("MemeToken:      ", address(token));
        console.log("MemeAnalytics:  ", address(analytics));
        console.log("MemePrediction: ", address(prediction));
        console.log("MemeReward:     ", address(reward));
        console.log("Oracle:         ", oracle);
        console.log("==============================================");
    }
}

/**
 * @title DeployMISPLocal
 * @dev 로컬 테스트용 배포 (Anvil)
 */
contract DeployMISPLocal is Script {
    function run() external {
        // Anvil 기본 계정 사용
        vm.startBroadcast();

        address deployer = msg.sender;
        address oracle = deployer; // 로컬에서는 배포자가 오라클 역할

        // 1. MemeToken 배포
        MemeToken token = new MemeToken(1_000_000 * 1e18);
        console.log("MemeToken deployed at:", address(token));

        // 2. MemeAnalytics 배포
        MemeAnalytics analytics = new MemeAnalytics(oracle);
        console.log("MemeAnalytics deployed at:", address(analytics));

        // 3. MemePrediction 배포
        MemePrediction prediction = new MemePrediction(address(analytics));
        console.log("MemePrediction deployed at:", address(prediction));

        // 4. MemeReward 배포
        MemeReward reward = new MemeReward(address(token), payable(address(prediction)));
        console.log("MemeReward deployed at:", address(reward));

        // 5. 권한 설정
        token.addMinter(address(reward));
        prediction.setRewardContract(address(reward));

        // 6. 테스트용 초기 데이터 설정
        analytics.recordMeme("test_meme_001", "WIF", 8500, 7500, 9000, 6500, "US");

        analytics.updateTokenAnalysis(
            "WIF", 150, 8500, 5000, 2, "WIF shows strong viral momentum with increasing meme activity"
        );

        // 테스트용 예측 라운드 생성
        prediction.createRound("WIF", 1 hours, MemePrediction.PredictionType.ScoreUp);

        vm.stopBroadcast();

        console.log("\n========== Local Deployment Complete ==========");
        console.log("Test prediction round created for WIF");
    }
}

/**
 * @title DeployMemeCore
 * @dev MemeCore Testnet (Formicarium) 배포 스크립트
 *
 * 배포 명령어:
 * forge script script/Deploy.s.sol:DeployMemeCore --rpc-url https://rpc.formicarium.memecore.net --broadcast --verify
 *
 * 필요한 환경변수:
 * - PRIVATE_KEY: 배포자 지갑 개인키
 */
contract DeployMemeCore is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        address deployer = vm.addr(deployerPrivateKey);
        address oracle = deployer; // 초기에는 배포자가 오라클 역할

        // 1. MemeToken 배포 (초기 공급량: 100만 토큰)
        MemeToken token = new MemeToken(1_000_000 * 1e18);
        console.log("MemeToken deployed at:", address(token));

        // 2. MemeAnalytics 배포
        MemeAnalytics analytics = new MemeAnalytics(oracle);
        console.log("MemeAnalytics deployed at:", address(analytics));

        // 3. MemePrediction 배포
        MemePrediction prediction = new MemePrediction(address(analytics));
        console.log("MemePrediction deployed at:", address(prediction));

        // 4. MemeReward 배포
        MemeReward reward = new MemeReward(address(token), payable(address(prediction)));
        console.log("MemeReward deployed at:", address(reward));

        // 5. 권한 설정
        token.addMinter(address(reward));
        prediction.setRewardContract(address(reward));

        vm.stopBroadcast();

        // 배포 주소 요약
        console.log("\n========== MemeCore Testnet Deployment ==========");
        console.log("Network:        Formicarium (Chain ID: 43521)");
        console.log("MemeToken:      ", address(token));
        console.log("MemeAnalytics:  ", address(analytics));
        console.log("MemePrediction: ", address(prediction));
        console.log("MemeReward:     ", address(reward));
        console.log("Oracle:         ", oracle);
        console.log("Explorer:       https://formicarium.memecorescan.io");
        console.log("=================================================");
    }
}

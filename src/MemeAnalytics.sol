// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MemeAnalytics
 * @dev 밈 데이터 및 Cultural Impact Score를 온체인에 저장
 * @notice AI 분석 결과를 온체인에 기록하여 투명성 확보 (InfoFi 핵심)
 */
contract MemeAnalytics {
    address public owner;
    address public oracle; // AI 분석 결과를 제출하는 오라클 주소

    // 밈 데이터 구조체
    struct MemeData {
        string memeId;           // 밈 고유 식별자
        string tokenSymbol;      // 관련 토큰 심볼 (예: WIF, PEPE)
        uint256 culturalScore;   // Cultural Impact Score (0-10000, 소수점 2자리)
        uint256 viralVelocity;   // 확산 속도 점수
        uint256 sentimentScore;  // 감성 분석 점수 (0-10000)
        uint256 correlationScore; // 가격 상관도 점수
        uint256 timestamp;       // 기록 시간
        string region;           // 주요 확산 지역
        bool isActive;           // 활성 상태
    }

    // 토큰별 분석 요약
    struct TokenAnalysis {
        string tokenSymbol;
        uint256 totalMemeCount;      // 관련 밈 총 개수
        uint256 avgCulturalScore;    // 평균 문화 점수
        uint256 priceCorrelation;    // 가격 상관도 (-10000 ~ 10000)
        uint256 trendDirection;      // 0: 하락, 1: 유지, 2: 상승
        uint256 lastUpdated;
        string aiInsight;            // AI 인사이트 요약
    }

    // 저장소
    mapping(bytes32 => MemeData) public memes;           // memeId hash => MemeData
    mapping(string => TokenAnalysis) public tokenAnalyses; // tokenSymbol => TokenAnalysis
    mapping(string => bytes32[]) public tokenMemes;       // tokenSymbol => memeId hashes

    bytes32[] public allMemeIds;
    string[] public trackedTokens;

    // 이벤트
    event MemeRecorded(
        bytes32 indexed memeHash,
        string memeId,
        string tokenSymbol,
        uint256 culturalScore,
        uint256 timestamp
    );

    event TokenAnalysisUpdated(
        string indexed tokenSymbol,
        uint256 avgCulturalScore,
        uint256 priceCorrelation,
        string aiInsight
    );

    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle || msg.sender == owner, "Not oracle");
        _;
    }

    constructor(address _oracle) {
        owner = msg.sender;
        oracle = _oracle;
    }

    /**
     * @dev 오라클 주소 변경
     */
    function setOracle(address _newOracle) external onlyOwner {
        emit OracleUpdated(oracle, _newOracle);
        oracle = _newOracle;
    }

    /**
     * @dev 밈 데이터 기록 (오라클만 호출 가능)
     */
    function recordMeme(
        string calldata _memeId,
        string calldata _tokenSymbol,
        uint256 _culturalScore,
        uint256 _viralVelocity,
        uint256 _sentimentScore,
        uint256 _correlationScore,
        string calldata _region
    ) external onlyOracle {
        require(_culturalScore <= 10000, "Score exceeds max");
        require(_sentimentScore <= 10000, "Sentiment exceeds max");

        bytes32 memeHash = keccak256(abi.encodePacked(_memeId));

        // 새 밈인 경우 배열에 추가
        if (!memes[memeHash].isActive) {
            allMemeIds.push(memeHash);
            tokenMemes[_tokenSymbol].push(memeHash);

            // 새 토큰인 경우 추적 목록에 추가
            if (tokenAnalyses[_tokenSymbol].lastUpdated == 0) {
                trackedTokens.push(_tokenSymbol);
                tokenAnalyses[_tokenSymbol].tokenSymbol = _tokenSymbol;
            }
        }

        memes[memeHash] = MemeData({
            memeId: _memeId,
            tokenSymbol: _tokenSymbol,
            culturalScore: _culturalScore,
            viralVelocity: _viralVelocity,
            sentimentScore: _sentimentScore,
            correlationScore: _correlationScore,
            timestamp: block.timestamp,
            region: _region,
            isActive: true
        });

        emit MemeRecorded(memeHash, _memeId, _tokenSymbol, _culturalScore, block.timestamp);
    }

    /**
     * @dev 토큰 분석 요약 업데이트 (오라클만 호출 가능)
     */
    function updateTokenAnalysis(
        string calldata _tokenSymbol,
        uint256 _totalMemeCount,
        uint256 _avgCulturalScore,
        int256 _priceCorrelation,
        uint256 _trendDirection,
        string calldata _aiInsight
    ) external onlyOracle {
        require(_trendDirection <= 2, "Invalid trend");
        require(_priceCorrelation >= -10000 && _priceCorrelation <= 10000, "Correlation out of range");

        TokenAnalysis storage analysis = tokenAnalyses[_tokenSymbol];

        if (analysis.lastUpdated == 0) {
            trackedTokens.push(_tokenSymbol);
        }

        analysis.tokenSymbol = _tokenSymbol;
        analysis.totalMemeCount = _totalMemeCount;
        analysis.avgCulturalScore = _avgCulturalScore;
        analysis.priceCorrelation = uint256(_priceCorrelation + 10000); // -10000~10000 => 0~20000
        analysis.trendDirection = _trendDirection;
        analysis.lastUpdated = block.timestamp;
        analysis.aiInsight = _aiInsight;

        emit TokenAnalysisUpdated(_tokenSymbol, _avgCulturalScore, analysis.priceCorrelation, _aiInsight);
    }

    /**
     * @dev 밈 데이터 조회
     */
    function getMeme(string calldata _memeId) external view returns (MemeData memory) {
        bytes32 memeHash = keccak256(abi.encodePacked(_memeId));
        return memes[memeHash];
    }

    /**
     * @dev 토큰별 밈 개수 조회
     */
    function getTokenMemeCount(string calldata _tokenSymbol) external view returns (uint256) {
        return tokenMemes[_tokenSymbol].length;
    }

    /**
     * @dev 전체 추적 토큰 목록 조회
     */
    function getTrackedTokens() external view returns (string[] memory) {
        return trackedTokens;
    }

    /**
     * @dev 전체 밈 개수 조회
     */
    function getTotalMemeCount() external view returns (uint256) {
        return allMemeIds.length;
    }

    /**
     * @dev 특정 토큰의 최근 밈 조회 (최대 10개)
     */
    function getRecentMemes(string calldata _tokenSymbol, uint256 _count)
        external view returns (MemeData[] memory)
    {
        bytes32[] storage memeHashes = tokenMemes[_tokenSymbol];
        uint256 total = memeHashes.length;
        uint256 count = _count > total ? total : _count;
        count = count > 10 ? 10 : count;

        MemeData[] memory result = new MemeData[](count);

        for (uint256 i = 0; i < count; i++) {
            result[i] = memes[memeHashes[total - 1 - i]];
        }

        return result;
    }
}

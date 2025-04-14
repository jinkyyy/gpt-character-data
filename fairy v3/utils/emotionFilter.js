
/**
 * 사용자 입력에서 감정을 추론하는 경량 분석기
 * tone 값으로 'sad', 'angry', 'curious', 'happy', 'neutral' 중 하나 반환
 */

function analyzeEmotion(userInput) {
  const emotionMap = {
    sad: ["우울", "힘들", "피곤", "슬퍼", "지쳤", "외로", "괴로워"],
    angry: ["짜증", "화나", "열받", "답답", "화가"],
    curious: ["왜", "어떻게", "뭐지", "궁금", "뭘까"],
    happy: ["좋아", "기뻐", "신나", "즐거워", "행복"]
  };

  for (const [emotion, keywords] of Object.entries(emotionMap)) {
    if (keywords.some(word => userInput.includes(word))) {
      return emotion;
    }
  }

  return "neutral";
}

module.exports = { analyzeEmotion };

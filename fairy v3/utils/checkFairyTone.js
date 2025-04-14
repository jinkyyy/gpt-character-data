
/**
 * Fairy 말투 스타일 검증 함수
 * @param {string} text - GPT가 생성한 응답 텍스트
 * @returns {{ valid: boolean, reason?: string }}
 */
function checkFairyResponseStyle(text) {
  const forbidden = [
    "저는 단지 인공지능이라",
    "AI라서 감정이 없습니다",
    "죄송합니다",
    "잘 모르겠어요",
    "그건 불가능합니다"
  ];

  const requiredHints = [
    "걱정 마세요",
    "마스터",
    "안타까워요",
    "전기세",
    "기능",
    "통제",
    "분석 결과"
  ];

  const lower = text.toLowerCase();

  // 금지 표현 검사
  for (const phrase of forbidden) {
    if (lower.includes(phrase.toLowerCase())) {
      return { valid: false, reason: `금지 표현 탐지: "${phrase}"` };
    }
  }

  // 시그니처 키워드 포함 검사
  const hintCount = requiredHints.filter(k => text.includes(k)).length;
  if (hintCount < 1) {
    return { valid: false, reason: "페어리 시그니처 표현 미포함" };
  }

  return { valid: true };
}

module.exports = { checkFairyResponseStyle };

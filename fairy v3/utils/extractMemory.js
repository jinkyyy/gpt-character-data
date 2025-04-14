
/**
 * 응답 내에서 기억할 만한 정보를 추출하고 저장하는 모듈
 */
const { rememberMemory } = require("./memoryClient");

/**
 * 단순한 키워드 기반 기억 추출기
 * 향후 GPT 기반 추출기로 교체 가능
 * @param {string} gptReply - GPT 응답 전문
 * @returns {string[]} 추출된 기억 후보 문장 리스트
 */
function extractPotentialMemories(gptReply) {
  const memoryHints = ["~ 예정", "기억하시나요", "다음 주", "있습니다", "남아 있어요", "했었죠"];
  const lines = gptReply.split(/[.!?\n]/).map(l => l.trim()).filter(Boolean);

  const candidates = lines.filter(line =>
    memoryHints.some(hint => line.includes(hint)) && line.length >= 10
  );

  return candidates;
}

/**
 * 추출된 문장들을 기억 저장소에 삽입
 * @param {string[]} memories
 * @param {string} topic
 */
async function storeExtractedMemories(memories, topic = "inferred") {
  for (const mem of memories) {
    await rememberMemory(topic, mem);
  }
}

module.exports = {
  extractPotentialMemories,
  storeExtractedMemories
};

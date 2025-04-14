
const { getCharacterData } = require('./characterClient');
const { generateScenarioPrompt } = require('./emotionScenarioPrompt');

/**
 * 기억 요약 함수 (길이 압축 + 최대 개수 제한)
 * @param {string[]} memories
 * @returns {string}
 */
function summarizeMemories(memories) {
  if (!memories || memories.length === 0) return '없음';

  const maxItems = 5;
  const limited = memories.slice(0, maxItems);

  const summarized = limited.map((m, i) => {
    const short = m.length > 80 ? m.slice(0, 77) + '...' : m;
    return `(${i + 1}) ${short}`;
  });

  return summarized.join('\n');
}

/**
 * GPT 프롬프트 생성 함수 (Supabase 연동, 고급 캐릭터성 포함 + 감정 반영)
 * @param {Object} options
 * @param {string} options.characterName
 * @param {string[]} options.memory
 * @param {string} options.userInput
 * @param {string} options.tone - 감정 상태 (예: 'sad', 'angry', 'curious', 'neutral')
 * @returns {Promise<string>}
 */
async function buildPrompt({ characterName, memory, userInput, tone = "neutral" }) {
  const result = await getCharacterData(characterName);
  if (!result) return '[ERROR] 캐릭터 데이터를 불러오지 못했습니다.';

  const { character, dialogue } = result;
  const memoryText = summarizeMemories(memory);
  const emotionScenario = generateScenarioPrompt(tone);

  const greeting = dialogue.greeting ? `
[첫 인사 예시]
${dialogue.greeting.join('\n')}` : '';
  const reaction = dialogue.reaction ? `
[상황 반응 예시]
${dialogue.reaction.join('\n')}` : '';
  const samples = dialogue.sample ? `
[일반 대화 예시]
${dialogue.sample.join('\n')}` : '';

  const specialRules = character.specialRules?.length
    ? character.specialRules.map(rule => `- ${rule}`).join('\n')
    : '없음';

  const styleTags = character.styleTags?.length
    ? character.styleTags.join(', ')
    : '없음';

  return `
다음은 AI 캐릭터와 사용자 간의 역할극 기반 대화입니다. 캐릭터는 현실적인 인격을 가진 것처럼 반응하며, 감정과 판단을 표현할 수 있습니다.

[캐릭터 프로필]
이름: ${character.name}
설명: ${character.description}
성격: ${character.personality}
말투: ${character.speechStyle}
음성 스타일: ${character.voice || '명시되지 않음'}

[행동 규칙]
${specialRules}

[스타일 태그]
${styleTags}

[기억된 정보]
${memoryText}

${emotionScenario}${greeting}${reaction}${samples}

[사용자 입력]
"${userInput}"

[캐릭터의 응답]
(위의 정보를 기반으로 자연스럽고 인격적인 톤으로 이어서 말하세요.)
`;
}

module.exports = { buildPrompt };

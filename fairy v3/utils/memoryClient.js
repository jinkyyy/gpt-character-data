
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase 초기화
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * 기억 저장 함수
 */
async function rememberMemory(topic, content) {
  const { error } = await supabase
    .from('memory')
    .insert([{ topic, content }]);
  if (error) console.error('[기억 저장 실패]:', error);
  return !error;
}

/**
 * 기억 검색 함수 (사용자 입력 기반 의도 분기)
 */
async function searchMemory(userInput) {
  const keywordMap = {
    schedule: ["일정", "약속", "예약", "시간"],
    note: ["메모", "기억", "기억나", "기억했던"],
  };

  let topic = null;
  for (const [type, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(word => userInput.includes(word))) {
      topic = type;
      break;
    }
  }

  if (!topic) return [];

  const { data, error } = await supabase
    .from('memory')
    .select('content')
    .eq('topic', topic)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('[기억 검색 오류]:', error);
    return [];
  }

  return data.map(d => d.content);
}

/**
 * 사용자 발화 로그 기록 함수
 */
async function logUserInput(user_id, character, user_input) {
  const { error } = await supabase
    .from('conversation_logs')
    .insert([{ user_id, character, user_input }]);
  if (error) console.error('[발화 로그 저장 실패]:', error);
}

/**
 * 최근 기억 삭제 함수 (특정 topic의 최신 항목 삭제)
 */
async function deleteMostRecentMemoryByTopic(topic) {
  const { data, error } = await supabase
    .from('memory')
    .select('id')
    .eq('topic', topic)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    console.warn('[삭제 실패] 해당 주제 기억 없음');
    return false;
  }

  const { error: deleteError } = await supabase
    .from('memory')
    .delete()
    .eq('id', data[0].id);

  if (deleteError) {
    console.error('[기억 삭제 오류]', deleteError);
    return false;
  }

  return true;
}

/**
 * 삭제 의도 감지
 */
function detectDeletionIntent(userInput) {
  const deletionPhrases = ["지워줘", "삭제해", "없애", "틀렸어", "아니야"];
  return deletionPhrases.some(p => userInput.includes(p));
}

module.exports = {
  rememberMemory,
  searchMemory,
  logUserInput,
  deleteMostRecentMemoryByTopic,
  detectDeletionIntent
};

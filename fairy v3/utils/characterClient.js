
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * 캐릭터 데이터 불러오기
 * @param {string} characterName - 예: 'fairy'
 * @returns {Promise<{ character: object, dialogue: object } | null>}
 */
async function getCharacterData(characterName) {
  const { data, error } = await supabase
    .from('character_sheets')
    .select('character, dialogue')
    .eq('name', characterName)
    .single();

  if (error) {
    console.error('[캐릭터 데이터 로딩 오류]', error);
    return null;
  }

  return data;
}

module.exports = { getCharacterData };

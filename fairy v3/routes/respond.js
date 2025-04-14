
const express = require("express");
const router = express.Router();
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const {
  rememberMemory,
  searchMemory,
  logUserInput,
  deleteMostRecentMemoryByTopic,
  detectDeletionIntent
} = require("../utils/memoryClient");
const { buildPrompt } = require("../utils/promptBuilder");
const { checkFairyResponseStyle } = require("../utils/checkFairyTone");
const { extractPotentialMemories, storeExtractedMemories } = require("../utils/extractMemory");
const { analyzeEmotion } = require("../utils/emotionFilter");

// 🔑 OpenAI 설정
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// GPT 직접 호출 함수
async function callGPT(systemPrompt, userInput) {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput },
      ],
      max_tokens: 750,
      temperature: 0.7,
      presence_penalty: 0.3,
      frequency_penalty: 0.4,
    });
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("[GPT 호출 오류]", error.response?.data || error.message);
    return "[GPT 응답 실패]";
  }
}

// 기억 저장 트리거
async function maybeRemember(userInput) {
  const keywordMap = {
    schedule: ["일정", "약속", "예약", "시간"],
    note: ["메모", "기억", "기억해", "기억해줘", "기억할래"],
  };

  let topic = null;
  for (const [key, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(word => userInput.includes(word))) {
      topic = key;
      break;
    }
  }

  if (topic) {
    const saved = await rememberMemory(topic, userInput);
    if (!saved) {
      console.warn("[기억 저장 실패] 내용:", userInput);
    } else {
      console.log(`[기억 저장 완료] ${topic}: ${userInput}`);
    }
  }
}

// /respond 엔드포인트
router.post("/respond", async (req, res) => {
  try {
    const { userInput, character } = req.body;
    if (!userInput || !character) {
      return res.status(400).json({ error: "userInput과 character가 필요합니다." });
    }

    // 🔸 사용자 발화 기록
    await logUserInput("default", character, userInput);

    // 🔹 삭제 의도 감지 및 처리
    if (detectDeletionIntent(userInput)) {
      const success = await deleteMostRecentMemoryByTopic("schedule");
      if (success) {
        return res.json({ result: "방금 기억된 일정 정보를 삭제했습니다." });
      } else {
        return res.json({ result: "삭제할 기억이 없거나, 삭제에 실패했습니다." });
      }
    }

    // 감정 분석
    const tone = analyzeEmotion(userInput);

    // 기억 저장 시도
    await maybeRemember(userInput);

    // 기억 검색
    const memory = await searchMemory(userInput);

    // 프롬프트 생성
    const systemPrompt = await buildPrompt({
      characterName: character,
      userInput,
      memory,
      tone,
    });

    // GPT 호출
    const reply = await callGPT(systemPrompt, userInput);

    // 말투 검사
    const check = checkFairyResponseStyle(reply);
    if (!check.valid) {
      console.warn("[스타일 감시 실패] ▶", check.reason);
    }

    // 응답 내 기억 추출 및 저장
    const inferred = extractPotentialMemories(reply);
    if (inferred.length > 0) {
      await storeExtractedMemories(inferred);
    }

    res.json({ result: reply });
  } catch (err) {
    console.error("Respond API error:", err);
    res.status(500).json({ error: "응답 생성 중 오류 발생" });
  }
});

module.exports = router;

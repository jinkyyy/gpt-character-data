
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const app = express();
const respondRoute = require("./routes/respond");

const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 라우터 설정
app.use("/respond", respondRoute);

// 루트 경로 응답
app.get("/", (req, res) => {
  res.send("Fairy AI 서버가 실행 중입니다.");
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`✅ Fairy AI 서버 실행 중: http://localhost:${PORT}`);
});

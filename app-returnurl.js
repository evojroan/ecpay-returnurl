//npm i mongodb@latest

import express from "express";
import fs from "fs";
import { MongoClient, ServerApiVersion } from 'mongodb';
const app = express();
import { FuncCMV, FuncAES } from "./cmvaes.js";
const port = process.env.PORT || 3000; //若部署到網上，就使用其網路服務的 port；否則就用 port=3000

app.use(express.urlencoded({ extended: true })); //解析全方位金流的 application/x-www-form-urlencoded 請求
app.use(express.json()); //解析站內付 2.0 的 JSON 請求

const uri = "mongodb+srv://roan6903:eD494702446S@returnurl.q6bf7.mongodb.net/?retryWrites=true&w=majority&appName=returnurl";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectMongoDB() {
  try {
    console.log("正在嘗試連接到 MongoDB...");
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("成功連接到 MongoDB Atlas！");
    return true;
  } catch (error) {
    console.error("MongoDB 連接錯誤:", error);
    return false;
  }
}

app.get("/test-mongodb", async (req, res) => {
  try {
    const isConnected = await connectMongoDB();
    if (isConnected) {
      res.json({ status: "success", message: "MongoDB 連接成功！" });
    } else {
      res.status(500).json({ status: "error", message: "MongoDB 連接失敗" });
    }
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

function FuncReturnURL(req, res) {
  //使用 fs 模組於本地端產生 log 檔
  // 取得台灣時間
  const today = new Date();
  const localTime = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
  const dateString = localTime.toISOString().split('T')[0]; // 格式: YYYY-MM-DD
  const timestamp = localTime.toLocaleString('zh-TW', { 
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const logFileName = `logs_${dateString}.txt`;
  const logend="=== Log 結束 ==="

  // 取得 IP 位址
  let ip = req.headers['x-forwarded-for']?.split(',')[0] || 
           req.socket.remoteAddress ||
           req.ip;
           
  // 處理 IPv6 格式
  if (ip === '::1') {
    ip = 'localhost';
  } else if (ip?.includes('::ffff:')) {
    ip = ip.split('::ffff:')[1];
  }

  // 記錄接收到的 POST 資訊
  const postData = JSON.stringify(req.body, null, 2);
  fs.appendFileSync(
    logFileName,
    `\n=== ${timestamp} ===\nIP: ${ip}\nPOST Data:\n${postData}\n`,
    'utf8'
  );

  //CheckMacValue
  if (req.body.CheckMacValue) {
    const { CheckMacValue, ...InputParams } = req.body;
    const calculatedCMV = FuncCMV(InputParams);
    const CMVCheckResult = CheckMacValue === calculatedCMV;
    
    const logMessage = `檢查碼比對是否正確：${CMVCheckResult}\n${logend}`;
    console.log(logMessage);
    fs.appendFileSync(
      logFileName,
      `${logMessage}\n`,
      'utf8'
    );
    
    res.send("1|OK"); 
  }
  //AES
  else if (req.body.Data || req.body.ResultData) {
    try {
      const decryptedData = FuncAES(req.body);
      const logMessage = `AES 解密內容：\n${decryptedData}\n${logend}`;
      console.log(logMessage);
      fs.appendFileSync(
        logFileName,
        `${logMessage}\n`,
        'utf8'
      );
      res.send("1|OK");
    } catch (error) {
      const logMessage = `AES 解密失敗：${error.message}\n${logend}`;
      console.log(logMessage);
      fs.appendFileSync(
        logFileName,
        `${logMessage}\n`,
        'utf8'
      );
      res.send("1|OK");
    }
  } else {
    const logMessage = `0|接收之資料有誤，無檢查碼或無法解密\n${logend}`;
    console.log(logMessage);
    fs.appendFileSync(
      logFileName,
      `Console Log: ${logMessage}\n`,
      'utf8'
    );
    res.send(logMessage);
  }
}

//金流與物流通知路由整合
//returnurl：金流付款結果通知

app.post(["/returnurl",  "/serverreplyurl"], (req, res) => {
  FuncReturnURL(req, res);
});

// 在服務啟動時進行連接測試
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  await connectMongoDB();
});

// 程式結束時關閉連接
process.on('SIGINT', async () => {
  await client.close();
  console.log('MongoDB 連接已關閉');
  process.exit(0);
});

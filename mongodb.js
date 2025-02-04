// MongoDB 連接設定
import { MongoClient, ServerApiVersion } from "mongodb"; //npm i mongodb@latest dotenv

const uri = `mongodb+srv://${process.env.DB_ACCOUNT}:${process.env.DB_PASSWORD}@cluster0.q6bf7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// 連接到 MongoDB
async function connectToMongo() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("成功連接到 MongoDB Atlas!");
  } catch (error) {
    console.error("MongoDB 連接錯誤:", error);
    process.exit(1);
  }
}

// 新增一個用於記錄日誌的函數
async function logToMongoDB(logData) {
  try {
    const database = client.db("logs");
    const collection = database.collection("ReturnURL_logs");
    await collection.insertOne({
      timestamp: new Date(),
      ...logData,
    });

    console.log(logData);
  } catch (error) {
    console.error("MongoDB 記錄錯誤:", error);
  }
}

export {connectToMongo,logToMongoDB,uri,client}
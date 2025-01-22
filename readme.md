# 綠界金流付款結果通知與物流貨態通知

## 一、這是什麼？
串接綠界金流與物流時，需要接收金流的付款結果通知(ReturnURL)與物流的貨態通知(ServerReplyURL)。收到訊息後，要回應字串 "1|OK" 以表示有收到訊息。  
  
若是串接全方位金流與物流整合，接收的字串中含有檢查碼(CheckMacValue)，必須以同樣的金鑰計算檢查碼並比對，才能確認發送訊息者的確是綠界，而非假冒；若是串接站內付 2.0 與全方位物流，接收的訊息必須 AES 解密才能得到完整內容。須儲存通知以供備查。  
  
本範例能夠接收綠界的付款結果通知與貨態通知，比對檢查碼或 AES 解密，並於回應綠界的同時儲存通知紀錄。

## 二、本地端設定與執行方式
### 1. 安裝套件
- `npm i mongodb@latest dotenv` 

### 2. 設定金鑰
#### 測試環境(Stage)
於 cmvaes.js 中有變數 AllHashes。需要將金鑰(HashKey 與  HashIV)設定於環境變數中，以利後續作業讀取。

- 方法一(使用環境變數)：新增 `.env` 檔案，並輸入：
``` # 金流測試帳號
HashKey_3002607=pwFHCqoQZGmho4w6
HashIV_3002607=EkRm7iFT261dpevs

HashKey_3002599=spPjZn66i0OhqJsQ
HashIV_3002599=hT5OJckN45isQTTs

HashKey_3003008=FCnGLNS7P3xQ2q3E
HashIV_3003008=awL5GRWRhyaybq13

# 物流測試帳號
HashKey_2000132=5294y06JbISpM5x9
HashIV_2000132=v77hoKGq4kWxNNIS

HashKey_2000933=XBERn1YOvpM9nfZc
HashIV_2000933=h1ONHk4P4yqbl5LK
```  
於 cmvaes.js 使用有引用 `.env` 檔案的變數(AllHashes1)。  

- 方法二(不使用環境變數)：於 cmvaes.js 使用含有金鑰的變數(AllHashes2)。

#### 正式環境(Production)
若正式環境要部署於 Render.com，則金鑰於 Render.com 設定 "Environment Variables"較安全。請自行改寫 cmvaes.js 中引用變數 AllHashes 的方式，參考 AllHashes3。

### 3. 本地端執行專案
- 先於終端機輸入：`node app-returnurl.js` 以啟動伺服器。
- 啟動後，將伺服器對外，例如使用 ngrok： `ngrok http 3000`。
- 付款結果通知或貨態通知將能記錄於專案資料夾。

## 三、 雲端設定與執行方式
前述方法已可於本地端(localhost)執行。若要部署於雲端，以下以 Render 與  MongoDB Atlas 為例。

[Render](https://render.com/)：部署伺服器  
[MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database)：資料庫儲存 log

### 1. 部署於 Render
- 將本專案檔推至自己的  GitHub Repo
- Render 的 Project / Create new service / Web Services
- Source Code 連接該 Repo
- 於 "You are deploying a web service"頁面完成必要的設定。Instance Type 可以先選 Free；Environment Variables 設定正式帳號的 HashKey 與 HashIV。設定完後按下 Deploy Web Services。
- 於該服務的控制頁面，點選右上角 Connect，得到 Static Outbound IP Addresses，全部記起來。

### 2. 設定 MongoDB Atlas 資料庫
 - 新增 Cluster，Provider 選 AWS。建立時需要一些時間。
 - 新增完畢後，於 "Network Access" 增加 Render 的 Static Outbound IP Addresses。
 - 點選該 Cluster 的 Connect 按鈕 / Connect to your application / Drivers，選擇 Driver (例如 Node.js)與 Version。

 ### 3. 繼續增加 Render 的環境變數
 - Render 的 Dashboard / Environment / Edit / Add environment variable 增加環境變數。

```(本段落待完成)```

## 四、已完成功能
### 1. 接收訊息
- [x] 可以接收全方位金流的付款結果通知。
- [x] 可以接收站內付 2.0 的付款結果通知。
- [x] 可以接收物流整合的貨態通知。
- [x] 可以接收全方位物流的貨態通知。

### 2. 辨別訊息
- [x] 可以依據收到的訊息，判斷要比對檢查碼，還是進行 AES 解密。
- [x] 若要比對檢查碼，可以判斷演算法使用全方位金流的 SHA256 還是物流整合的 MD5。
- [x] 若要解碼，可以判斷是站內付 2.0 還是全方位物流。

### 3. 處理訊息
- [x] 若收到的訊息含有檢查碼，可以計算並比對檢查碼。
- [x] 若收到訊息含有 AES 加密過的內容，可以解密 AES。

### 4. 回應訊息
- [x] 處理訊息後，若檢查碼比對正確，則回應 1|OK。
- [x] 處理訊息後，若 AES 解密成功，則回應 1|OK。
- [x] 處理訊息後，若檢查碼比對不正確，則回應檢查碼比對不正確。
- [x] 處理訊息後，若 AES 解密失敗，則回應解密失敗。

### 5. 部署伺服器
- [ ] 將伺服器部署於網路上(Render.com)。

### 6. 儲存訊息
- [x] 收到的訊息與處理結果能儲存於本地資料庫裡。
- [ ] 收到的訊息與處理結果能儲存於網路資料庫裡(MongoDB Atlas)。

## 五、延伸閱讀
- 我所有的綠界技術串接文章與示範：[https://medium.com/@roan6903/list/b0325094c59f](https://medium.com/@roan6903/list/b0325094c59f)
- 綠界技術文件 - 全方位金流：[https://developers.ecpay.com.tw/?p=2509](https://developers.ecpay.com.tw/?p=2509)
- 綠界技術文件 - 站內付2.0：[https://developers.ecpay.com.tw/?p=8972](https://developers.ecpay.com.tw/?p=8972)
- 綠界技術文件 - 物流整合：[https://developers.ecpay.com.tw/?p=7380](https://developers.ecpay.com.tw/?p=7380)
- 綠界技術文件 - 全方位物流：[https://developers.ecpay.com.tw/?p=10075](https://developers.ecpay.com.tw/?p=10075)
- Connecting to MongoDB Atlas: [https://render.com/docs/connect-to-mongodb-atlas](https://render.com/docs/connect-to-mongodb-atlas)
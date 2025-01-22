import crypto from "crypto";

//測試帳號金鑰：AllHashes1
const AllHashes = {
  3002607: {
    HashKey: process.env.HashKey_3002607,
    HashIV: process.env.HashIV_3002607,
  }, //金流 - 特店測試帳號
  3002599: {
    HashKey: process.env.HashKey_3002599,
    HashIV: process.env.HashIV_3002599,
  }, //金流 - 平台商測試帳號
  3003008: {
    HashKey: process.env.HashKey_3003008,
    HashIV: process.env.HashIV_3003008,
  }, //金流 - 平台商測試帳號
  2000132: {
    HashKey: process.env.HashKey_2000132,
    HashIV: process.env.HashIV_2000132,
  }, //物流 - B2C及宅配測試帳號
  2000933: {
    HashKey: process.env.HashKey_2000933,
    HashIV: process.env.HashIV_2000933,
  }, //物流 - C2C測試帳號
};

//測試帳號金鑰：AllHashes2
// const AllHashes = {
//   3002607: {
//     HashKey: "pwFHCqoQZGmho4w6",
//     HashIV: "EkRm7iFT261dpevs"
//   }, //金流 - 特店測試帳號
//   3002599: {
//     HashKey: "spPjZn66i0OhqJsQ",
//     HashIV: "hT5OJckN45isQTTs"
//   }, //金流 - 平台商測試帳號
//   3003008: {
//     HashKey: "FCnGLNS7P3xQ2q3E",
//     HashIV: "awL5GRWRhyaybq13"
//   }, //金流 - 平台商測試帳號
//   2000132: {
//     HashKey: "5294y06JbISpM5x9",
//     HashIV: "v77hoKGq4kWxNNIS"
//   }, //物流 - B2C及宅配測試帳號
//   2000933: {
//     HashKey: "XBERn1YOvpM9nfZc",
//     HashIV: "h1ONHk4P4yqbl5LK"
//   }, //物流 - C2C測試帳號
// };

//正式帳號金鑰(請自行改寫)：AllHashes3
// const AllHashes = {
//   "0000000": { HashKey: process.env.HashKey_0000000, HashIV: process.env.HashIV_0000000 },
//   "1111111": { HashKey: process.env.HashKey_1111111, HashIV: process.env.HashIV_1111111 },
// };

//函式：計算檢查碼
export function FuncCMV(InputParams) {
  const MerchantID = InputParams.MerchantID;

  const [HashKey, HashIV] = [
    AllHashes[MerchantID]["HashKey"],
    AllHashes[MerchantID]["HashIV"],
  ];

  //URL Encode 後，還要進行符合 .NET 的轉換
  function DotNETURLEncode(string) {
    const list = {
      "%2D": "-",
      "%5F": "_",
      "%2E": ".",
      "%21": "!",
      "%2A": "*",
      "%28": "(",
      "%29": ")",
      "%20": "+",
    };

    Object.entries(list).forEach(([encoded, decoded]) => {
      const regex = new RegExp(encoded, "g");
      string = string.replace(regex, decoded);
    });

    return string;
  }

  //(1) 將傳遞參數依照第一個英文字母，由A到Z的順序來排序(遇到第一個英文字母相同時，以第二個英文字母來比較，以此類推)，並且以&方式將所有參數串連。
  const Step1 = Object.entries(InputParams)
    .sort((a, b) => {
      return a[0].localeCompare(b[0], "en");
    })
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  //順便以參數 LogisticsType 與 LogisticsSubType 判斷是全方位金流還是物流整合
  let CMValgorithm =
    InputParams.LogisticsType && InputParams.LogisticsSubType
      ? "md5"
      : "sha256";
  //(2) 參數最前面加上HashKey、最後面加上HashIV
  const Step2 = `HashKey=${HashKey}&${Step1}&HashIV=${HashIV}`;
  //(3) 將整串字串進行URL encode，且符合 .NET URLEncode 結果 (https://developers.ecpay.com.tw/?p=2904)
  const Step3 = DotNETURLEncode(encodeURIComponent(Step2));
  //(4) 轉為小寫
  const Step4 = Step3.toLowerCase();
  //(5) 產生雜凑值
  const Step5 = crypto.createHash(CMValgorithm).update(Step4).digest("hex");
  //(6) 再轉大寫產生CheckMacValue
  const Step6 = Step5.toUpperCase();
  return Step6;
}

export function FuncAES(InputParams) {
  let MerchantID;
  let parsedData;

  try {
    if (InputParams.MerchantID) {
      MerchantID = InputParams.MerchantID;
    } else if (InputParams.ResultData) {
      parsedData = JSON.parse(InputParams.ResultData); //全方位物流改傳送 ResultData，因此需要先判斷
      MerchantID = parsedData.MerchantID;
    } else {
      throw new Error("缺少 MerchantID 參數");
    }
  } catch (error) {
    throw new Error(`解析 MerchantID 失敗: ${error.message}`);
  }

  const [HashKey, HashIV] = [
    AllHashes[MerchantID]["HashKey"],
    AllHashes[MerchantID]["HashIV"],
  ];

  try {
    const decipher = crypto.createDecipheriv("aes-128-cbc", HashKey, HashIV);
    let encryptedData;

    if (InputParams.Data) {
      encryptedData = InputParams.Data;
    } else if (parsedData) {
      encryptedData = parsedData.Data;
    } else {
      throw new Error("需要提供 Data 或 ResultData 參數");
    }

    let DecryptedData = decipher.update(encryptedData, "base64", "utf8");
    DecryptedData += decipher.final("utf8");
    return decodeURIComponent(DecryptedData);
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}

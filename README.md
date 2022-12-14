# Pet Game

此 Repo contracts 分為三大部分，分別為**Pet** **Component** **Governance**，分別使用三種協議

- ERC721
- ERC3664
- ERC2981

目的在於打造一種多功能的 NFT，並將 NFT 視為一種 IP 或是商品，任何人都可以與其合作，並部屬 Component 的合約，與本體 Pet Token 互動，而對於其 NFT 有貢獻的人或者團體可以參與 Governance 中，並享有此 NFT 的治理權限或紅利

這種開放且有互動功能的 NFT 可以帶來更多不同的變化，由於任何人都會機會參與，可以使得 NFT 應用場景不斷增加，甚至可以可在之後版本加入改良，將治理權下放，使得最一開始的項目方已經不再參與，用戶仍可自行繼續更改跟互動並進行治理

# Pet

為 Pet Token 的主要合約，可選擇組裝的 Component contract，並有著管理其 Component 的功能，可依照功能需求進行調整，並且包含 SyntheticLogic 來處理 Pet 與 Component 拆併相關功能，Pet token contract 當中含有五種預設配件

- Hat
- Hand
- Cloth
- Pants
- Glass

並且附加三種 Attribute

- Level
- Species
- Characteristic

### Level

紀錄 Pet Token 的等級，可以使用`upgrade()`來進行升級

### Species

記錄 Pet Token 的種族，在 mint 的時候隨機分配，且之後無法更改

### Characteristic

記錄 Pet Token 的個性，在 mint 的時候隨機分配，且之後無法更改

# Component

每個 Component 為獨立出來的合約，每個 Component 同時也是一個獨立 ERC721 token，可進行交易、轉移等等功能，並且需繼承**ComponentBase**，符合其相關 interface 規範，以便 Pet 主合約的調用

# Use Case

## 一般情況 General Scenario

1. 管理員需先將 Pet Component 合約部署上鏈
2. 使用 Pet 中的`setComponents()`設定想要互動的 Component contract
3. 用戶調用 Pet 的`mint()`，同時 Component 也會一併被 mint 完成，並暫存在 Pet 合約中
4. 若用戶要進行拆併，需先於 Component 合約中`setApproveForAll()`給 Pet 合約，允許其調用自己所擁有的 Component token
5. 於前端調用 separate combine 等 SyntheticLogic function 來完成功能

## 後續添加 Component

重複一般情況下的前 1 2 步，若欲添加新配件，以下分為已 mint 跟未 mint 的情況

- 若已被 mint 的 Pet token 想安裝上 new component，可調用`combine`來添加
- 若未被 mint 的 Pet token 想安裝上 new component，直接使用 Pet contract 中的`mint`即可自動添加

## Governance

Pet 合約內的`setRoyalities()`版稅接受方需設為 Governance contract
此為簡易的 DAO 合約，`addMember()`可以添加會員，並設定每位會員可獲得的版稅比例，可以藉由調用`processRoyalities()`來分配合約內現有資金

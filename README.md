# Pet Game

此 repo contracts 分為兩大部分，分別為**Pet**以及**Component**

# Pet

為寵物 NFT 的主體，可選擇組裝的 Component contract，並有著管理其 Component 的功能，可依照功能需求進行調整，並且包含 SyntheticLogic 來處理 Pet 與 Component 拆併相關功能，Pet token contract 當中含有**Hat** **Hand**兩種配件

# Component

每個 Component 為獨立出來的合約，每個 Component 同時也是一個獨立 ERC721 token，可進行交易、轉移等等功能，並且需繼承**ComponentBase**，符合其相關規範。

# 使用案例 Use Case

管理員需先將 Pet Component 合約部署上鏈，使用 Pet 中的`setComponents()`設定想要互動的 Component contract

用戶調用 Pet 的`mint()`，同時 Component 也會一併被 mint 完成，並暫存在 Pet 合約中，若用戶要進行拆併，需先於 Component 合約中`setApproveForAll()`給 Pet 合約，允許其調用自己所擁有的 Component token

/**
 * 夫妻心情配對小樹屋 - 核心互動與狀態管理 JavaScript
 */

// ==========================================================================
// 1. 全局狀態與變數
// ==========================================================================
const APP_STATE = {
  role: null,           // 'husband' 或 'wife'
  nickname: '',         // 使用者暱稱
  gasUrl: 'https://script.google.com/macros/s/AKfycbySwWTaP0zTXtE14JD9dirOkLcU8waqlEjbRLZ2obkbFv2UgEB6tCGIWbnDMAbXSirUqg/exec',           // Google Apps Script Web App URL
  customNames: {
    husband: '老公',
    wife: '老婆'
  },
  
  // 今日數據
  ownTodayMood: null,
  partnerTodayMood: null,
  history: [],
  
  // 測驗進行狀態
  quizQuestions: [],
  currentQuestionIdx: 0,
  quizAnswers: []
};

// 6種心情定義與配對解析
const MOOD_TYPES = {
  EXPLODING: {
    name: "爆炸邊緣 🌋",
    emoji: "🌋",
    desc: "今天壓力爆棚，而且體力幾乎耗盡... 現在的你就像是一顆隨時會爆開的氣球，非常需要安靜放鬆與溫柔對待。請深呼吸，今晚好好犒賞自己！",
    getAdvice: (partnerName) => `對方今天在外面受了委屈或面臨極大壓力！千萬別跟 ${partnerName} 講道理或碎碎念，也別讓他/她做家事。請默默幫 ${partnerName} 倒杯溫水，給他/她安靜的空間，或者溫柔地拍拍他/她說『辛苦了，今晚好好休息，有我在』吧！❤️`
  },
  GRUMPY: {
    name: "炸毛小刺蝟 🦔",
    emoji: "🦔",
    desc: "今天頂著不小的壓力，但戰鬥力與能量依然旺盛！你現在就像一隻充滿防備的刺蝟，有點容易炸毛、失去耐心，需要另一半好好地順順毛。",
    getAdvice: (partnerName) => `對方今天有些煩躁不安，體力雖好但耐性不足。此時最適合用幽默和甜言蜜語來融化 ${partnerName}，千萬不要正面迎擊！給他/她買個好吃的，或者開個好笑的玩笑，幫 ${partnerName} 順順毛放鬆一下！🍿`
  },
  NEED_HUG: {
    name: "需要抱抱 🥺",
    emoji: "🥺",
    desc: "今天身體累累的，電量極低，但心理上超級渴望另一半的溫暖！你現在就像一隻軟綿綿的受傷小動物，只想縮在對方懷裡好好充電。",
    getAdvice: (partnerName) => `對方現在電量嚴重不足，特別黏人且缺乏安全感！快放下手邊的事，給 ${partnerName} 一個長達 30 秒的深情大擁抱，拍拍他/她，跟他說你有多愛他/她。你的懷抱就是 ${partnerName} 最強的充電器！🔌💞`
  },
  TIRED: {
    name: "有點累累 🥱",
    emoji: "🥱",
    desc: "今天是一顆快沒電的乾電池... 體力跟腦力都快見底了，沒什麼特別的情緒，只想開啟省電與放空模式，靜靜地冬眠躺平。",
    getAdvice: (partnerName) => `對方今天電量亮紅燈囉！請貼心地主動承包今天的家事，讓 ${partnerName} 可以無後顧之憂地躺平放空。也可以幫他/她放個熱水澡、搥搥背，讓他/她好好睡一覺！💤`
  },
  HAPPY_SWEET: {
    name: "超幸福甜心 🥰",
    emoji: "🥰",
    desc: "今天你的心情灑滿了陽光與糖粉！你覺得跟另一半在一起非常幸福，滿腦子都是對方，迫不及待想把所有快樂都分享給他/她！",
    getAdvice: (partnerName) => `對方今天心情極佳，且滿滿都是對你的愛與依賴！快熱情地回應 ${partnerName}，陪他/她聊聊無聊小事、親他/她一下，這會讓你們今天的恩愛程度直接爆表喔！👩‍❤️‍👨💖`
  },
  ENERGY_FULL: {
    name: "電力滿載 🔋",
    emoji: "🔋",
    desc: "今天你整個人活力十足，精神飽滿！心情就像是萬里無雲的晴天，感覺可以一口氣完成所有挑戰，準備好散發快樂能量了嗎？",
    getAdvice: (partnerName) => `另一半今天元氣滿滿、神清氣爽！可以陪 ${partnerName} 一起做點有活力的事情，像是出門散散步、看場熱血電影，或者一起策劃一場週末的甜蜜小約會！🏃‍♂️💨`
  },
  CALM: {
    name: "平靜自在 🍃",
    emoji: "🍃",
    desc: "今天的心情像是一陣溫和的微風，平靜、自在且踏實。沒有太大的情緒起伏，這種歲月靜好的狀態讓你感到非常舒服與放鬆。",
    getAdvice: (partnerName) => `另一半今天處於非常和諧平靜的狀態。這時候不需要特別的驚喜或大餐，陪在 ${partnerName} 身邊，一起看本書、聽聽音樂，享受簡單而溫馨的共處時光就很完美了。☕`
  },

  MELTING: {
    name: "融化史萊姆 🫠",
    emoji: "🫠",
    desc: "今天能量超低，極度懶散。你現在只想跟地板或沙發融為一體，進入終極躺平待機狀態，任何指令都無法讓你移動分毫。",
    getAdvice: (partnerName) => `對方現在是極度懶散的史萊姆狀態！千萬不要給 ${partnerName} 任何指令或要求，默默把零食和電視遙控器遞到他/她手邊，讓他/她原地安心融化放空就好！🫠`
  },
  DRAMATIC: {
    name: "小抓馬劇場 🎭",
    emoji: "🎭",
    desc: "今天你的內心深處正上演著高潮迭起的八點檔小劇場！情緒飽滿、能量充足，雖然有點小焦慮，但超級渴望另一半的極致關注與配合演出。",
    getAdvice: (partnerName) => `對方今天內心戲非常多，正需要你的高度關注！無論 ${partnerName} 此時說什麼，請都帶著無比誇張的同理心點頭贊同，並配合他/她的演出，給他/她滿滿的戲劇化呵護！🍿`
  },
  FOODIE_MONSTER: {
    name: "餓鬼大爆發 🦖",
    emoji: "🦖",
    desc: "警報！你現在正處於餓到發脾氣（Hangry）的極限狀態！雖然體力能量還有，但根本沒心思談情說愛，滿腦子只渴望著大口吃肉與澱粉！",
    getAdvice: (partnerName) => `注意！${partnerName} 今天正被餓鬼附身！此時**千萬不要問『等一下吃什麼』**，那會讓他/她更煩躁。請直接叫外送或帶 ${partnerName} 去吃他/她最愛的食物，食物是拯救世界的唯一鑰匙！🍕`
  },
  SPOILEE: {
    name: "小傲嬌公主/王子 👑",
    emoji: "👑",
    desc: "今天你的傲嬌度與尊貴度雙雙破表！心裡超級渴望被另一半極致寵愛、當作皇室對待，卻又不想主動說出口，正用小眼神暗中觀察對方的表現。",
    getAdvice: (partnerName) => `今天請主動提供皇家級服務！把 ${partnerName} 當成尊貴的殿下，端茶水、捶背、甜言蜜語一應俱全，大聲誇獎他/她，這會讓傲嬌的 ${partnerName} 內心甜到融化喔！👑💖`
  },
  GHOSTING: {
    name: "放空小幽靈 👻",
    emoji: "👻",
    desc: "今天你的肉體雖然還留在地球上，但靈魂已經飄去外太空旅行了。大腦處於睡眠待機畫面，呈現極度放空、答非所問的幽靈狀態。",
    getAdvice: (partnerName) => `另一半現在正處於靈魂出竅放空狀態。請輕輕在 ${partnerName} 眼前揮揮手，給他/她倒一杯熱茶。不需要逼 ${partnerName} 做任何決定或講話，靜靜地抱著他/她一起發呆就很美好了。🍃`
  },
  ADVENTURER: {
    name: "搞怪探險家 🤪",
    emoji: "🤪",
    desc: "今天你大腦裡的頑皮細胞全數被喚醒了！精力充沛、搞怪點子滿滿，超想講一堆無厘頭冷笑話，或是調皮地戳戳另一半，跟對方一起胡鬧。",
    getAdvice: (partnerName) => `接住 ${partnerName} 的梗！對方今天想跟你一起胡鬧，請陪他/她一起做鬼臉、互相操癢或講無厘頭的話。今天你們就是這間小樹屋最無厘頭的開心果拍檔！🦖✨`
  },
  OVERWORKED: {
    name: "燃燒小蠟燭 🕯️",
    emoji: "🕯️",
    desc: "今天你的身體極度疲憊，背著極大的壓力，卻依然咬著牙想對另一半溫柔、為家裡付出。這是一顆正在燃燒自己、令人無比心疼的小蠟燭狀態。",
    getAdvice: (partnerName) => `快幫 ${partnerName} 把蠟燭吹熄！走過去從背後摟住他/她，跟 ${partnerName} 說：『你已經做得夠好了，今天接下來交給我』。主動接手所有家事，給他/她一盆熱水泡腳吧！🛁🕯️`
  },
  SHY_LOVER: {
    name: "羞答答羞羞草 🫣",
    emoji: "🫣",
    desc: "今天的心情甜甜的、軟綿綿的。你心裡極度想黏著另一半，卻又有點害羞矜持，只敢默默看著對方，或者在旁邊偷偷拉對方的衣角撒嬌。",
    getAdvice: (partnerName) => `哎呀，${partnerName} 今天正羞澀地愛著你呢！不要對他/她做粗魯的舉動，請溫柔地拉起 ${partnerName} 的手放進口袋，輕聲對他/她說甜言蜜語，帶他/她窩在被子裡看一部溫馨喜劇吧！🎬💞`
  }};

// 豐富的 15 題心理測驗題庫
const QUIZ_POOL = [
  {
    id: 1,
    title: "如果今天有一台時光機，你最想帶另一半去哪裡？",
    options: [
      { text: "未來100年後的太空餐廳吃大餐", emoji: "🚀", scores: { energy: 30, stress: -10, loveIndex: 20 } },
      { text: "侏儸紀時代看恐龍賽跑", emoji: "🦕", scores: { energy: 40, stress: -20, loveIndex: 10 } },
      { text: "回到中世紀城堡當國王與皇后", emoji: "🏰", scores: { energy: 15, stress: 10, loveIndex: 30 } },
      { text: "回到我們第一次約會的下午", emoji: "🛖", scores: { energy: 10, stress: -20, loveIndex: 50 } }
    ]
  },
  {
    id: 2,
    title: "現在你大腦的空地上，正在上演什麼節目？",
    options: [
      { text: "F1 方程式賽車，引擎轟轟叫超熱血", emoji: "🏎️", scores: { energy: 50, stress: 25, loveIndex: -10 } },
      { text: "禪修大師安靜打坐，一片祥和與空白", emoji: "🧘‍♂️", scores: { energy: -20, stress: -40, loveIndex: 10 } },
      { text: "一群可愛貓咪大跳踢踏舞，又萌又熱鬧", emoji: "💃", scores: { energy: 30, stress: -10, loveIndex: 25 } },
      { text: "暴風雨前的平靜，眼睛快閉上了", emoji: "😴", scores: { energy: -35, stress: 15, loveIndex: 5 } }
    ]
  },
  {
    id: 3,
    title: "如果一隻魔法松鼠突然送你一份禮物，你希望是什麼？",
    options: [
      { text: "喝了永遠不會累的「超級拿鐵咖啡」", emoji: "☕", scores: { energy: 40, stress: 15, loveIndex: 5 } },
      { text: "會自動按摩且帶有加熱功能的懶人沙發", emoji: "couch", scores: { energy: -35, stress: -45, loveIndex: 10 } },
      { text: "另一半「無條件聽話與貼心按摩券」", emoji: "🎫", scores: { energy: 20, stress: -15, loveIndex: 50 } },
      { text: "一袋放著會自動變多的神奇金幣", emoji: "💰", scores: { energy: 30, stress: -20, loveIndex: 10 } }
    ]
  },
  {
    id: 4,
    title: "如果今天你的心情是一杯飲料，你覺得會是？",
    options: [
      { text: "加滿珍珠與布丁的QQ超甜奶茶", emoji: "🥤", scores: { energy: 25, stress: -20, loveIndex: 35 } },
      { text: "苦澀但能強效提神的雙倍黑美式咖啡", emoji: "☕", scores: { energy: 15, stress: 45, loveIndex: -10 } },
      { text: "冰涼解悶又帶有氣泡的冰爽生啤酒", emoji: "🍺", scores: { energy: 35, stress: -30, loveIndex: 15 } },
      { text: "酸甜清爽、充滿維他命的鮮榨檸檬汁", emoji: "🍋", scores: { energy: 20, stress: 15, loveIndex: 20 } }
    ]
  },
  {
    id: 5,
    title: "走在路上，一隻流浪貓咪突然開口對你說話，你覺得牠會說？",
    options: [
      { text: "「人類，看什麼看？還不奉上罐罐！」", emoji: "😺", scores: { energy: 20, stress: 10, loveIndex: 10 } },
      { text: "「你身上有種暖暖又甜甜的另一半氣味耶～」", emoji: "😻", scores: { energy: 20, stress: -20, loveIndex: 50 } },
      { text: "「好睏喔...我們一起躺在草地上曬太陽吧。」", emoji: "💤", scores: { energy: -40, stress: -35, loveIndex: 15 } },
      { text: "「今天辛苦了，快點回家抱抱你的寶貝吧！」", emoji: "😾", scores: { energy: 10, stress: -15, loveIndex: 40 } }
    ]
  },
  {
    id: 6,
    title: "如果今晚另一半說要做一道「創意料理」，你的直覺反應是？",
    options: [
      { text: "哇！超級期待！就算燒焦我也開心地全部吃光！", emoji: "😋", scores: { energy: 30, stress: -20, loveIndex: 55 } },
      { text: "完蛋了，我是不是該先偷偷叫好外送備用？", emoji: "😱", scores: { energy: 35, stress: 25, loveIndex: 10 } },
      { text: "沒事，為了我的胃，今晚還是由我來下廚吧！", emoji: "🍳", scores: { energy: 15, stress: 10, loveIndex: 25 } },
      { text: "隨便啦...我現在累得只想吃泡麵倒頭就睡。", emoji: "💤", scores: { energy: -45, stress: -10, loveIndex: -5 } }
    ]
  },
  {
    id: 7,
    title: "如果現在你是一片雲，你最想飄去哪裡呢？",
    options: [
      { text: "富士山頂，靜靜地看著日出與白雪", emoji: "🗻", scores: { energy: -15, stress: -45, loveIndex: 15 } },
      { text: "熱帶馬爾地夫海灘，聽海浪與陽光的歌聲", emoji: "🏖️", scores: { energy: 35, stress: -35, loveIndex: 20 } },
      { text: "某個討厭的傢伙頭上，狠狠下一場暴雨發洩！", emoji: "⛈️", scores: { energy: 45, stress: 40, loveIndex: -15 } },
      { text: "我們家的窗前，偷偷看另一半此時在做什麼", emoji: "🏡", scores: { energy: 10, stress: -20, loveIndex: 55 } }
    ]
  },
  {
    id: 8,
    title: "一覺醒來，你發現自己變成了卡通人物！你直覺是誰？",
    options: [
      { text: "多啦A夢，能從百寶袋掏出無限神奇道具", emoji: "🐱", scores: { energy: 30, stress: -20, loveIndex: 30 } },
      { text: "海綿寶寶，充滿朝氣地大喊：我準備好了！", emoji: "🧽", scores: { energy: 50, stress: -10, loveIndex: 15 } },
      { text: "抱著蜂蜜罐、趴在樹洞邊不想動的維尼熊", emoji: "🐻", scores: { energy: -35, stress: -30, loveIndex: 20 } },
      { text: "隨時想放出十萬伏特閃電的皮卡丘", emoji: "⚡", scores: { energy: 40, stress: 20, loveIndex: 15 } }
    ]
  },
  {
    id: 9,
    title: "如果可以獲得一個超能力，你現在最想選哪一個？",
    options: [
      { text: "一秒看穿另一半現在腦袋在想什麼的「讀心術」", emoji: "🧠", scores: { energy: 15, stress: 20, loveIndex: 50 } },
      { text: "隨時能瞬間移動回家或約會地點的「任意門」", emoji: "🚪", scores: { energy: 25, stress: -30, loveIndex: 35 } },
      { text: "能讓時間暫停、讓我多賴床三小時的「時空鐘」", emoji: "⏱️", scores: { energy: -30, stress: -40, loveIndex: 10 } },
      { text: "不管怎麼暴飲暴食都絕對不會變胖的「神之鐵胃」", emoji: "🍔", scores: { energy: 35, stress: -25, loveIndex: 15 } }
    ]
  },
  {
    id: 10,
    title: "如果現在要選一首樂曲來代表你此刻的身體狀態？",
    options: [
      { text: "熱血奔放的重金屬搖滾樂，全速狂飆！", emoji: "🎸", scores: { energy: 55, stress: 30, loveIndex: -10 } },
      { text: "輕柔緩慢的古典搖籃曲，眼睛快黏起來了", emoji: "🎹", scores: { energy: -50, stress: -30, loveIndex: 20 } },
      { text: "慵懶微醺的沙龍爵士樂，適合來杯紅酒", emoji: "🎷", scores: { energy: -10, stress: -40, loveIndex: 35 } },
      { text: "節奏輕快活潑的流行舞曲，心情很飛揚", emoji: "🥁", scores: { energy: 35, stress: -25, loveIndex: 30 } }
    ]
  },
  {
    id: 11,
    title: "如果有一顆流星劃過，你可以許一個無厘頭願望，你會選？",
    options: [
      { text: "所有的家事（洗碗、掃地）都會自動魔法般做好！", emoji: "🧹", scores: { energy: 20, stress: -35, loveIndex: 25 } },
      { text: "冰淇淋和巧克力變成健康食品，吃越多瘦越多", emoji: "🍦", scores: { energy: 35, stress: -20, loveIndex: 15 } },
      { text: "養一隻會飛且很溫馴的小恐龍，騎著牠去上班", emoji: "🦖", scores: { energy: 45, stress: -10, loveIndex: 10 } },
      { text: "另一半每天一見面都會熱情地誇獎我十次！", emoji: "💬", scores: { energy: 20, stress: -15, loveIndex: 55 } }
    ]
  },
  {
    id: 12,
    title: "如果此時此刻，突然停電 5 分鐘，你會想做什麼？",
    options: [
      { text: "點起溫馨蠟燭，跟另一半玩投影手影遊戲", emoji: "🕯️", scores: { energy: 20, stress: -25, loveIndex: 45 } },
      { text: "順理成章立刻躺下、閉上眼睛睡大覺", emoji: "🛌", scores: { energy: -45, stress: -30, loveIndex: 10 } },
      { text: "默默拿出手機，緊張地確認還有幾 % 電量", emoji: "📱", scores: { energy: 15, stress: 30, loveIndex: -10 } },
      { text: "悄悄躲在沙發角落，準備在電燈亮起時嚇對方", emoji: "👻", scores: { energy: 45, stress: -10, loveIndex: 35 } }
    ]
  },
  {
    id: 13,
    title: "如果你的疲勞可以用一個生活物品形容，現在最像？",
    options: [
      { text: "只剩下 1% 電量、螢幕已經變暗的瀕死手機", emoji: "🪫", scores: { energy: -50, stress: 30, loveIndex: 30 } },
      { text: "吸飽了髒水、沉甸甸快擰不出乾淨水的抹布", emoji: "🧽", scores: { energy: -25, stress: 45, loveIndex: 10 } },
      { text: "洩了氣、癟塌塌趴在地板上的心型氣球", emoji: "🎈", scores: { energy: -35, stress: 20, loveIndex: 20 } },
      { text: "剛出廠、閃閃發光且堅硬無比的防彈鑽石", emoji: "💎", scores: { energy: 45, stress: -25, loveIndex: 10 } }
    ]
  },
  {
    id: 14,
    title: "如果在夢境中，有一座由食物建成的城堡，你會希望是？",
    options: [
      { text: "濃郁香甜的熱巧克力噴泉與糖果城堡", emoji: "🍫", scores: { energy: 30, stress: -25, loveIndex: 40 } },
      { text: "酥脆多汁、散發邪惡香氣的炸雞薯條防線", emoji: "🍗", scores: { energy: 45, stress: -20, loveIndex: 10 } },
      { text: "精緻清爽、充滿生機的五彩水果沙拉神殿", emoji: "🥬", scores: { energy: 20, stress: -30, loveIndex: 20 } },
      { text: "蓬鬆柔軟、散發淡淡香草甜香的草莓舒芙蕾山莊", emoji: "🧁", scores: { energy: 25, stress: -35, loveIndex: 35 } }
    ]
  },
  {
    id: 15,
    title: "另一半突然神祕地遞給你一盒精緻禮物，你打開直覺是？",
    options: [
      { text: "我一直很想買、躺在購物車很久的夢幻禮物", emoji: "💎", scores: { energy: 40, stress: -25, loveIndex: 45 } },
      { text: "一封手寫的精美信箋，寫滿了甜言蜜語與承諾", emoji: "💌", scores: { energy: 15, stress: -20, loveIndex: 65 } },
      { text: "打開會彈出一個搞笑小丑的整人嚇人玩具", emoji: "🤡", scores: { energy: 45, stress: -10, loveIndex: 30 } },
      { text: "一整盒我最愛吃的高級手工榛果巧克力", emoji: "🍫", scores: { energy: 25, stress: -20, loveIndex: 40 } }
    ]
  },
  {
    id: 16,
    title: "如果另一半突然變成一隻巨型大貓熊朝你滾過來，你會？",
    options: [
      { text: "抱住牠毛茸茸的肚子，大字型跟牠一起滾！", emoji: "🐼", scores: { energy: 30, stress: -30, loveIndex: 45 } },
      { text: "趕快去廚房拿一把新鮮竹筍餵牠吃！", emoji: "🎋", scores: { energy: 20, stress: -10, loveIndex: 25 } },
      { text: "狂拍一百張照片發到網路上炫耀我們家的大熊貓！", emoji: "📸", scores: { energy: 40, stress: -5, loveIndex: 10 } },
      { text: "當作沒看見，閉上眼睛在沙發上繼續躺著睡覺。", emoji: "💤", scores: { energy: -40, stress: -20, loveIndex: 5 } }
    ]
  },
  {
    id: 17,
    title: "如果你可以用一個大自然元素代表此時你靈魂的狀態？",
    options: [
      { text: "熊熊燃燒、劈啪作響的溫暖柴火", emoji: "🔥", scores: { energy: 45, stress: 25, loveIndex: 15 } },
      { text: "緩緩流動、拍打著沙灘的溫暖夏日海浪", emoji: "🌊", scores: { energy: -20, stress: -45, loveIndex: 25 } },
      { text: "呼呼大作、在森林裡亂竄的強烈狂風", emoji: "🌪️", scores: { energy: 40, stress: 45, loveIndex: -15 } },
      { text: "安靜躺在清澈溪流底部、長滿青苔的頑石", emoji: "🪨", scores: { energy: -40, stress: -30, loveIndex: 5 } }
    ]
  },
  {
    id: 18,
    title: "如果你是魔法師，你最想把另一半暫時變成什麼小萌物？",
    options: [
      { text: "一隻耳朵軟軟、蹦蹦跳跳的雪白小兔子", emoji: "🐰", scores: { energy: 20, stress: -25, loveIndex: 50 } },
      { text: "一隻戴著黑框眼鏡、看起來博學的貓頭鷹", emoji: "🦉", scores: { energy: 10, stress: -15, loveIndex: 25 } },
      { text: "一隻浮在水面上、雙手拼命揉臉的超萌海獺", emoji: "🦦", scores: { energy: 30, stress: -30, loveIndex: 55 } },
      { text: "一隻巴掌大、會呼呼噴出迷你小火苗的超萌小幼龍", emoji: "🦖", scores: { energy: 45, stress: -5, loveIndex: 35 } }
    ]
  },
  {
    id: 19,
    title: "如果我們現在去奇幻森林探險，你直覺我們會遇到什麼？",
    options: [
      { text: "熱情邀請我們參加深夜花園舞會的森林精靈", emoji: "🧚‍♀️", scores: { energy: 40, stress: -20, loveIndex: 30 } },
      { text: "一棵會結出各種口味巧克力冰淇淋的神奇大樹", emoji: "🌲", scores: { energy: 35, stress: -25, loveIndex: 15 } },
      { text: "藏在樹洞裡、能帶領我們找到神秘寶藏的古老地圖", emoji: "🗺️", scores: { energy: 30, stress: 10, loveIndex: 25 } },
      { text: "一個已經搭好、生著暖暖營火且放滿軟墊的豪華帳篷", emoji: "🏕️", scores: { energy: -30, stress: -40, loveIndex: 45 } }
    ]
  },
  {
    id: 20,
    title: "在一個暖洋洋的午後，你的大腦此時最想聽什麼聲音？",
    options: [
      { text: "窗外滴滴答答、很有規律的午後療癒小雨聲", emoji: "🌧️", scores: { energy: -25, stress: -35, loveIndex: 10 } },
      { text: "平底鍋上煎培根「滋滋作響」的極致誘人聲音", emoji: "🥓", scores: { energy: 35, stress: -15, loveIndex: 15 } },
      { text: "另一半靠在肩膀上，像小貓般呼嚕呼嚕睡覺的聲音", emoji: "🐈", scores: { energy: -15, stress: -40, loveIndex: 60 } },
      { text: "強烈帶感的電子舞曲，腦袋跟著瘋狂搖擺", emoji: "🎧", scores: { energy: 50, stress: 20, loveIndex: -5 } }
    ]
  },
  {
    id: 21,
    title: "如果今天我們要挑選一件情侶睡衣，你最希望是哪種風格？",
    options: [
      { text: "有一條大尾巴、走起路來很滑稽的綠色暴龍連身裝", emoji: "🦖", scores: { energy: 40, stress: -15, loveIndex: 30 } },
      { text: "摸起來滑溜溜、超有質感的高級冰絲絲綢套裝", emoji: "👚", scores: { energy: -15, stress: -30, loveIndex: 45 } },
      { text: "隨便套一件對方寬寬大大的舊 T 恤，最放鬆溫馨", emoji: "👕", scores: { energy: -25, stress: -35, loveIndex: 50 } },
      { text: "胸前有帥氣標誌、帶有發光披風的超級英雄戰服", emoji: "🦸‍♂️", scores: { energy: 45, stress: 15, loveIndex: 10 } }
    ]
  },
  {
    id: 22,
    title: "如果一覺醒來，發現今天突然多出了 3 個小時的空白時光？",
    options: [
      { text: "毫無罪惡感地把頭埋進被窩裡，瘋狂賴床睡懶覺！", emoji: "🛌", scores: { energy: -45, stress: -40, loveIndex: 10 } },
      { text: "一口氣把想玩的遊戲或熱門日劇進度狂追完畢！", emoji: "🎮", scores: { energy: 35, stress: -25, loveIndex: 15 } },
      { text: "拉著另一半出門，漫無目的地牽著手在街上散步約會", emoji: "🛍️", scores: { energy: 30, stress: -20, loveIndex: 50 } },
      { text: "大掃除模式發作，把家裡整理得一塵不染、整整齊齊", emoji: "🧼", scores: { energy: 25, stress: 25, loveIndex: 10 } }
    ]
  },
  {
    id: 23,
    title: "如果另一半遞給你一個自製的「魔法遙控器」，你最想按哪個鍵？",
    options: [
      { text: "「讓另一半暫時安靜 5 分鐘」的療癒靜音鍵", emoji: "🔇", scores: { energy: -10, stress: 15, loveIndex: -20 } },
      { text: "「讓無聊的上班或等待時間快轉」的魔幻加速鍵", emoji: "⏩", scores: { energy: 30, stress: 35, loveIndex: -5 } },
      { text: "「給我們兩個體力與精力瞬間充飽 100%」的充電鍵", emoji: "🔋", scores: { energy: 50, stress: -30, loveIndex: 35 } },
      { text: "「強制命令另一半立刻滾過來抱抱親親」的撒嬌鍵", emoji: "💖", scores: { energy: 15, stress: -20, loveIndex: 65 } }
    ]
  },
  {
    id: 24,
    title: "如果有隻小精靈告訴你今晚的熱量由他買單！你最想大吃什麼？",
    options: [
      { text: "起司拉絲拉到天花板的超級海陸大披薩", emoji: "🍕", scores: { energy: 40, stress: -30, loveIndex: 15 } },
      { text: "厚實多汁、香氣四溢的頂級熟成戰斧牛排", emoji: "🥩", scores: { energy: 45, stress: -20, loveIndex: 25 } },
      { text: "堆滿草莓、巧克力與無數棉花糖的豪華巨無霸冰淇淋聖代", emoji: "🍨", scores: { energy: 30, stress: -35, loveIndex: 35 } },
      { text: "精緻鮮美、入口即化的高級握壽司大拼盤", emoji: "🍣", scores: { energy: 20, stress: -25, loveIndex: 20 } }
    ]
  },
  {
    id: 25,
    title: "如果您在此刻代表一種顏色，你直覺自己是什麼色？",
    options: [
      { text: "像向日葵般耀眼溫暖、充滿朝氣的亮黃色", emoji: "🟨", scores: { energy: 45, stress: -20, loveIndex: 20 } },
      { text: "像深海般靜謐悠遠、能讓人沉澱放鬆的靜謐藍", emoji: "🟦", scores: { energy: -25, stress: -30, loveIndex: 10 } },
      { text: "像火山岩漿般熱情奔放、充滿行動力的亮紅色", emoji: "🟥", scores: { energy: 50, stress: 25, loveIndex: 25 } },
      { text: "像森林雨後般充滿生機、洗滌心靈的嫩綠色", emoji: "🟩", scores: { energy: -15, stress: -40, loveIndex: 15 } }
    ]
  },
  {
    id: 26,
    title: "如果我們現在決定養一隻奇特的魔法寵物，您最想選哪一隻？",
    options: [
      { text: "會踩出七彩祥雲、散發蜜桃香氣的小獨角獸", emoji: "🦄", scores: { energy: 35, stress: -25, loveIndex: 45 } },
      { text: "動作超慢、看著牠就會跟著一起發呆躺平的懶洋洋樹懶", emoji: "🦥", scores: { energy: -45, stress: -40, loveIndex: 15 } },
      { text: "會幫忙噴火烤吐司、拍打翅膀散熱的噴火小幼龍", emoji: "🐉", scores: { energy: 40, stress: -15, loveIndex: 30 } },
      { text: "會在空中寫出浪漫字眼、為我們飛鴿傳信的送信白鴿", emoji: "🦅", scores: { energy: 20, stress: -20, loveIndex: 55 } }
    ]
  },
  {
    id: 27,
    title: "半夜突然冷醒，發現另一半把大被子全捲走了...",
    options: [
      { text: "默默把對方當成被子抱上去，人肉保暖！", emoji: "🧸", scores: { energy: 10, stress: -20, loveIndex: 55 } },
      { text: "使出床邊太極，大力把被子拉回來！", emoji: "🥋", scores: { energy: 30, stress: 20, loveIndex: 10 } },
      { text: "算了...自己去櫃子拿另一條被子，明天再算帳。", emoji: "🚪", scores: { energy: -20, stress: 15, loveIndex: -5 } },
      { text: "貼心地幫對方把露在外面的腳蓋好，自己縮成一團。", emoji: "🥺", scores: { energy: -10, stress: -10, loveIndex: 45 } }
    ]
  },
  {
    id: 28,
    title: "一開冰箱，發現你珍藏一星期的限量甜點被另一半吃光了！",
    options: [
      { text: "大吼『這日子沒法過了』，要求今晚加倍奉還！", emoji: "🦖", scores: { energy: 45, stress: 35, loveIndex: -10 } },
      { text: "藉機撒嬌，命令對方明天必須買兩倍好吃的來餵我！", emoji: "🍭", scores: { energy: 20, stress: -10, loveIndex: 50 } },
      { text: "沒關係，他/她吃得開心就好，我再買新的。", emoji: "😇", scores: { energy: -10, stress: -20, loveIndex: 40 } },
      { text: "默默關上冰箱，神情呆滯地回沙發躺平融化。", emoji: "🫠", scores: { energy: -45, stress: 20, loveIndex: 5 } }
    ]
  },
  {
    id: 29,
    title: "如果有一台太空飛船，你最想和另一半去哪裡？",
    options: [
      { text: "去月球背面開個沒有地球人打擾的雙人營火晚會", emoji: "🌙", scores: { energy: 30, stress: -30, loveIndex: 45 } },
      { text: "穿越黑洞，去看看未來 50 年後的彼此", emoji: "🌌", scores: { energy: 20, stress: 15, loveIndex: 35 } },
      { text: "去土星的七彩光環上來一場刺激的飛艇極速漂移", emoji: "🚀", scores: { energy: 45, stress: -10, loveIndex: 20 } },
      { text: "去沒有地心引力的休眠艙裡，無憂無慮大睡三天", emoji: "💤", scores: { energy: -40, stress: -40, loveIndex: 15 } }
    ]
  },
  {
    id: 30,
    title: "另一半突然拿著剪刀，自信滿滿地說要幫你修剪劉海或頭髮？",
    options: [
      { text: "拼死抵抗！頭髮是我的命，想動它先過我這關！", emoji: "🙅‍♂️", scores: { energy: 45, stress: 35, loveIndex: -15 } },
      { text: "閉上雙眼，帶著英勇就義的悲壯信任交給對方！", emoji: "🫣", scores: { energy: 15, stress: 25, loveIndex: 45 } },
      { text: "好呀！就算剪壞了，也是我們獨一無二的搞怪回憶！", emoji: "✂️", scores: { energy: 35, stress: -15, loveIndex: 55 } },
      { text: "隨便啦...我現在累得只想任人宰割，剪光也無所謂。", emoji: "🥱", scores: { energy: -50, stress: -20, loveIndex: 5 } }
    ]
  },
  {
    id: 31,
    title: "一隻長相奇特但超萌的外星小生物突然降落陽台，想跟你們回家？",
    options: [
      { text: "超興奮！立刻教牠用魔法幫我們把碗洗乾淨！", emoji: "🪄", scores: { energy: 50, stress: -20, loveIndex: 25 } },
      { text: "先緊張地上網查『外星狗會不會吃家裡的貓咪』？", emoji: "📱", scores: { energy: 25, stress: 30, loveIndex: -5 } },
      { text: "抱起牠毛茸茸的身體，跟另一半一起幫牠取個蠢名字", emoji: "👽", scores: { energy: 20, stress: -25, loveIndex: 50 } },
      { text: "太累了...外星生物能幫我上班嗎？不能的話先讓牠在沙發躺著", emoji: "🛌", scores: { energy: -40, stress: 10, loveIndex: 5 } }
    ]
  },
  {
    id: 32,
    title: "大熱天兩個人去逛熱鬧的夜市，你的終極策略是？",
    options: [
      { text: "每一攤看起來都超誘人，從街頭大吃到街尾！", emoji: "🍟", scores: { energy: 50, stress: -20, loveIndex: 20 } },
      { text: "迅速精準地只買兩個人最愛吃的那幾樣，回冷氣房享用", emoji: "🛍️", scores: { energy: 15, stress: -30, loveIndex: 35 } },
      { text: "指令另一半去排隊買食物，我自己躲在陰涼處滑手機", emoji: "👑", scores: { energy: 20, stress: 15, loveIndex: 15 } },
      { text: "好擠好熱...我現在只想打包一份冰品回被窩躺平", emoji: "🫠", scores: { energy: -45, stress: 25, loveIndex: 10 } }
    ]
  },
  {
    id: 33,
    title: "一覺醒來，你發現自己說話都會自帶『搞笑綜藝配音效』？",
    options: [
      { text: "太棒了！立刻跑去跟另一半講一堆冷笑話，自帶音效超好笑！", emoji: "🤪", scores: { energy: 45, stress: -25, loveIndex: 40 } },
      { text: "好吵喔，我想按靜音鍵，腦袋瓜現在嗡嗡作響", emoji: "🔇", scores: { energy: -35, stress: 35, loveIndex: -5 } },
      { text: "對著鏡子給自己瘋狂演一齣悲劇，配上綜藝音效自己哈哈大笑", emoji: "🎭", scores: { energy: 35, stress: -15, loveIndex: 20 } },
      { text: "默默用紙筆寫字，對另一半發送『大腦待機中』的眼神", emoji: "👻", scores: { energy: -20, stress: -10, loveIndex: 20 } }
    ]
  },
  {
    id: 34,
    title: "如果今天有一項家事可以由『魔法自動完成』，你會選？",
    options: [
      { text: "洗碗與擦桌子，遠離手部油膩膩！", emoji: "🧼", scores: { energy: 20, stress: -35, loveIndex: 20 } },
      { text: "曬衣服與摺衣服，那簡直是重複性的時間地獄", emoji: "👕", scores: { energy: 25, stress: -30, loveIndex: 20 } },
      { text: "倒垃圾與廚餘分類，因為我現在一步都不想踏出家門！", emoji: "🗑️", scores: { energy: -20, stress: -40, loveIndex: 10 } },
      { text: "由魔法幫另一半搥背，幫他/她徹底充電！", emoji: "🔋", scores: { energy: 10, stress: -15, loveIndex: 60 } }
    ]
  },
  {
    id: 35,
    title: "兩個人要去『荒島荒野求生』度假一星期，你最想帶什麼？",
    options: [
      { text: "一台超大螢幕與兩支遊戲手把，在帳篷打電動度過！", emoji: "🎮", scores: { energy: 40, stress: -15, loveIndex: 35 } },
      { text: "一整箱香氣四溢的零食與冰凍生啤酒，當吃貨！", emoji: "🍻", scores: { energy: 35, stress: -25, loveIndex: 20 } },
      { text: "一頂超奢華的充氣雙人吊床，在海風中一覺不醒", emoji: "🏖️", scores: { energy: -40, stress: -45, loveIndex: 30 } },
      { text: "一本厚厚的野外求生指南...因為我很怕另一半搞砸！", emoji: "📖", scores: { energy: 25, stress: 25, loveIndex: 15 } }
    ]
  },
  {
    id: 36,
    title: "如果另一半突然變成一隻高度兩公尺的『胖企鵝』朝你走來？",
    options: [
      { text: "天啊！衝上去一把抱住牠胖乎乎白嫩嫩的肚子，好療癒！", emoji: "🐧", scores: { energy: 20, stress: -35, loveIndex: 65 } },
      { text: "冷靜地去廚房拿出冰箱所有的魚，幫牠準備晚餐", emoji: "🐟", scores: { energy: 30, stress: 15, loveIndex: 25 } },
      { text: "牽著牠胖乎乎的翅膀，在客廳搖搖擺擺跳一首踢踏舞！", emoji: "💃", scores: { energy: 40, stress: -10, loveIndex: 35 } },
      { text: "默默把牠當成一個超大軟枕頭，靠在上面睡覺放空", emoji: "💤", scores: { energy: -45, stress: -25, loveIndex: 20 } }
    ]
  },
  {
    id: 37,
    title: "在 38 度的大熱天，家裡的冷氣突然發出哀鳴壞掉了！",
    options: [
      { text: "立刻暴跳如雷，急得像熱鍋上的螞蟻，狂催冷氣師傅", emoji: "🥵", scores: { energy: 45, stress: 45, loveIndex: -10 } },
      { text: "抱著另一半大喊：『我們快一起去百貨公司吹免費冷氣逃難！』", emoji: "🏬", scores: { energy: 35, stress: -15, loveIndex: 40 } },
      { text: "搬出冰塊、電風扇，跟另一半玩古老消暑的吃西瓜比賽", emoji: "🍉", scores: { energy: 25, stress: -20, loveIndex: 45 } },
      { text: "癱倒在地板上，熱到化成一灘沒有靈魂的史萊姆", emoji: "🫠", scores: { energy: -55, stress: 30, loveIndex: 5 } }
    ]
  },
  {
    id: 38,
    title: "紀念日當天晚上，兩個人都忙了一整天，坐下來突然發現彼此都忘記買禮物了？",
    options: [
      { text: "完蛋了！內心感到無限自責與小失望，空氣瞬間凝固", emoji: "🥺", scores: { energy: 10, stress: 35, loveIndex: 10 } },
      { text: "大笑一場！『不愧是我們！』，立刻拉著對方出門吃最貴的大餐慶祝！", emoji: "🥩", scores: { energy: 40, stress: -25, loveIndex: 45 } },
      { text: "沒事啦，我們給彼此一個深情的吻，今天有你在身邊就是最好的禮物", emoji: "💋", scores: { energy: 15, stress: -30, loveIndex: 65 } },
      { text: "太好了，不用花心思送禮，今晚我們可以安心叫外送一起躺平睡覺", emoji: "🛌", scores: { energy: -35, stress: -35, loveIndex: 20 } }
    ]
  },
  {
    id: 39,
    title: "如果突然可以回到小學三年級，並且跟另一半當同班鄰座同學？",
    options: [
      { text: "每天在對方的課本上畫滿搞笑塗鴉，上課一直找他/她說悄悄話！", emoji: "🎒", scores: { energy: 45, stress: -20, loveIndex: 45 } },
      { text: "在桌子中間畫一條超嚴格的『三八線』，誰越界就打一下！", emoji: "📏", scores: { energy: 35, stress: 20, loveIndex: 10 } },
      { text: "默默在抽屜裡塞滿另一半愛吃的零食，羞答答地偷看他/她", emoji: "🫣", scores: { energy: 15, stress: -20, loveIndex: 55 } },
      { text: "上課一直賴在桌上睡覺，命令另一半等一下幫我抄筆記", emoji: "🥱", scores: { energy: -40, stress: -10, loveIndex: 25 } }
    ]
  },
  {
    id: 40,
    title: "在奇幻森林裡發現一座神祕許願池，你投下硬幣最想許的無厘頭願望是？",
    options: [
      { text: "讓我們一對眼就能立刻大笑，永遠不吵架的『幽默光環』", emoji: "✨", scores: { energy: 30, stress: -30, loveIndex: 50 } },
      { text: "讓卡路里全部消失，我們可以每天吃炸雞薯條喝奶茶卻狂瘦！", emoji: "🍟", scores: { energy: 45, stress: -25, loveIndex: 15 } },
      { text: "擁有一隻會自動幫我們掃地、摺衣服的魔法小精靈！", emoji: "🧚‍♀️", scores: { energy: 25, stress: -35, loveIndex: 25 } },
      { text: "讓時間暫停，每天為我們多出 10 個小時的『無罪惡感賴床時間』", emoji: "🛌", scores: { energy: -40, stress: -40, loveIndex: 15 } }
    ]
  },
  {
    id: 41,
    title: "如果可以獲得『隱形一小時』的超能力，你最想做什麼？",
    options: [
      { text: "悄悄跟在另一半後面，在他/她認真工作時突然抱住他/她嚇一跳！", emoji: "👻", scores: { energy: 45, stress: -15, loveIndex: 45 } },
      { text: "溜進高級甜點店，把櫥窗裡平時捨不得買的蛋糕全部試吃一遍！", emoji: "🍰", scores: { energy: 40, stress: -25, loveIndex: 10 } },
      { text: "偷偷躲在角落觀察另一半在沒有我時到底會做些什麼傻事", emoji: "🕵️‍♂️", scores: { energy: 20, stress: 15, loveIndex: 30 } },
      { text: "關掉手機，躲在房間的魔法角落，無憂無慮地安靜放空一小時", emoji: "🧘‍♂️", scores: { energy: -30, stress: -35, loveIndex: 10 } }
    ]
  },
  {
    id: 42,
    title: "另一半正在浴室洗澡，突然用五音不全但極具熱情的歌聲瘋狂飆歌？",
    options: [
      { text: "立刻在門外跟著大合唱，把浴室當作我們的超熱血演唱會！", emoji: "🎤", scores: { energy: 50, stress: -20, loveIndex: 40 } },
      { text: "默默拿出手機錄音，威脅他/她以後不幫我捶背就發給朋友們聽！", emoji: "📱", scores: { energy: 35, stress: 10, loveIndex: 25 } },
      { text: "貼心地把大毛巾和溫熱的睡衣在門口準備好，笑著聽他/她搞笑", emoji: "🧖‍♀️", scores: { energy: 15, stress: -25, loveIndex: 55 } },
      { text: "拿棉花塞住耳朵，嘆口氣：『這傢伙又開始發瘋了...』繼續倒頭睡", emoji: "😴", scores: { energy: -40, stress: 15, loveIndex: 5 } }
    ]
  },
  {
    id: 43,
    title: "下班疲憊地回到家，看到廚房水槽裡堆了一疊中午沒洗的髒碗盤...",
    options: [
      { text: "火氣立刻上湧！默默碎碎念一邊用力洗碗，一邊等另一半回來講理！", emoji: "🌋", scores: { energy: 35, stress: 45, loveIndex: -15 } },
      { text: "當作沒看見，拉起另一半的手：『今晚誰洗碗就輸了，先出去吃大餐！』", emoji: "🏃‍♀️", scores: { energy: 30, stress: -20, loveIndex: 40 } },
      { text: "深呼吸...主動動手把它洗得乾乾淨淨，心想：『算了，對方今天也很累』", emoji: "🧹", scores: { energy: -15, stress: -10, loveIndex: 45 } },
      { text: "完全失去動力，默默繞過去直接癱倒在沙發上，進入史萊姆模式", emoji: "🫠", scores: { energy: -50, stress: 30, loveIndex: 5 } }
    ]
  },
  {
    id: 44,
    title: "另一半興致勃勃端上一碗親手做的湯，你喝了一口發現味道『極度鹹』！",
    options: [
      { text: "立刻表情扭曲，大喊：『寶貝你是不是把半罐鹽都倒進去了？！』", emoji: "😖", scores: { energy: 35, stress: 25, loveIndex: -5 } },
      { text: "憋著笑一飲而盡！『超美味！』，然後狂喝三杯冰水來保命", emoji: "🥤", scores: { energy: 20, stress: -10, loveIndex: 60 } },
      { text: "溫柔地告訴對方：『很有創意！但如果多加一碗水，我們今晚不用去洗腎會更好喔～』", emoji: "🍲", scores: { energy: 15, stress: -20, loveIndex: 45 } },
      { text: "累到味覺失靈，毫無波瀾地喝下去：『有熱湯喝我就很感恩了...』", emoji: "🥱", scores: { energy: -35, stress: -15, loveIndex: 25 } }
    ]
  },
  {
    id: 45,
    title: "如果另一半在情人節，突然送你一束用『大蒜與辣椒』做成的實用花束？",
    options: [
      { text: "太有創意了！今晚立刻拿它來煮一頓超香的麻辣蒜香大餐！", emoji: "🧄", scores: { energy: 40, stress: -20, loveIndex: 35 } },
      { text: "傻在原地，嘴角抽搐，懷疑對方是不是在暗示我最近口臭？", emoji: "🌶️", scores: { energy: 25, stress: 25, loveIndex: 5 } },
      { text: "狂拍一百張照片發到網路上，向大家炫耀我們家另一半獨特的幽默感！", emoji: "📸", scores: { energy: 45, stress: -10, loveIndex: 40 } },
      { text: "嘆了口氣，心想：『好歹是個禮物...』，默默把它插進花瓶當作防蚊道具", emoji: "🍃", scores: { energy: -20, stress: -20, loveIndex: 20 } }
    ]
  },
  {
    id: 46,
    title: "出門時發現手機突然徹底壞掉一天，完全無法與外界聯繫？",
    options: [
      { text: "天啊！焦慮到手抖，感覺被整個世界拋棄了，壓力爆棚！", emoji: "😱", scores: { energy: 40, stress: 50, loveIndex: -10 } },
      { text: "太棒了！終於可以理直氣壯不看工作訊息，今天我要跟另一半黏在一起！", emoji: "👩‍❤️‍👨", scores: { energy: 30, stress: -35, loveIndex: 55 } },
      { text: "正好，今天就出門去公園散步發呆，過一天純樸的無干擾小日子", emoji: "🌳", scores: { energy: -15, stress: -40, loveIndex: 15 } },
      { text: "既然不能滑手機，那我今天要理所當然地睡 12 個小時！", emoji: "💤", scores: { energy: -45, stress: -30, loveIndex: 10 } }
    ]
  },
  {
    id: 47,
    title: "你買了一件自己覺得超有個性、但造型『非常醜』的衣服，問另一半好看嗎？",
    options: [
      { text: "期待對方大肆誇獎！如果對方敢皺眉頭，就發動嘟嘴抗議！", emoji: "👑", scores: { energy: 30, stress: 15, loveIndex: 40 } },
      { text: "其實我知道很怪，只是想穿給對方看，逗他/她哈哈大笑！", emoji: "🤡", scores: { energy: 45, stress: -20, loveIndex: 45 } },
      { text: "認真地分析這件衣服的前衛設計，堅持自己的時尚品味", emoji: "🕶️", scores: { energy: 20, stress: 10, loveIndex: 10 } },
      { text: "隨便啦...反正穿起來很舒服，醜不醜無所謂，我累得不想打扮了", emoji: "👕", scores: { energy: -35, stress: -20, loveIndex: 15 } }
    ]
  },
  {
    id: 48,
    title: "突然發現自己統一發票中了一百萬元大獎！你的直覺第一反應是？",
    options: [
      { text: "立刻發出瘋狂大笑，打電話給另一半：『不用上班了！今晚吃滿漢全席！』", emoji: "💰", scores: { energy: 55, stress: -35, loveIndex: 35 } },
      { text: "緊張兮兮，把發票藏在內褲抽屜深處，反覆確認是不是自己在作夢", emoji: "🕵️‍♀️", scores: { energy: 30, stress: 30, loveIndex: 5 } },
      { text: "默默在心裡規劃，要用這筆錢帶另一半去一趟夢想已久的豪華極光之旅", emoji: "✈️", scores: { energy: 25, stress: -30, loveIndex: 55 } },
      { text: "感覺這輩子的運氣都用光了，在沙發上呆滯躺平：『明天還是要洗碗...』", emoji: "🫠", scores: { energy: -30, stress: 10, loveIndex: 20 } }
    ]
  },
  {
    id: 49,
    title: "閉上雙眼，回想你當初第一眼看到另一半時的直覺感覺？",
    options: [
      { text: "心跳漏了一拍，感覺這個人身上閃閃發光，就是他/她了！", emoji: "✨", scores: { energy: 25, stress: -25, loveIndex: 65 } },
      { text: "嗯？這個人看起來有點傻傻的，不知道好不好相處？", emoji: "🤫", scores: { energy: 20, stress: -10, loveIndex: 30 } },
      { text: "天啊，他/她身上有一種讓人安心、想一輩子賴在一起的感覺", emoji: "🏠", scores: { energy: -10, stress: -35, loveIndex: 60 } },
      { text: "太久以前了...我現在大腦快燒壞了，想不起來啦！", emoji: "🤯", scores: { energy: -40, stress: 25, loveIndex: 5 } }
    ]
  },
  {
    id: 50,
    title: "另一半突然邀你一起去上一堂極度需要柔軟度的『雙人瑜珈課』？",
    options: [
      { text: "太好玩了！準備在課堂上擺出各種滑稽姿勢逗另一半笑！", emoji: "🧘‍♂️", scores: { energy: 45, stress: -20, loveIndex: 35 } },
      { text: "感到無比恐慌...我的筋骨硬得像鋼筋，今晚肯定會全身散架！", emoji: "🧱", scores: { energy: 25, stress: 35, loveIndex: 5 } },
      { text: "溫馨牽手，把它當作增進我們心靈默契與身體信任的甜蜜體驗", emoji: "💞", scores: { energy: 15, stress: -25, loveIndex: 55 } },
      { text: "搖頭拒絕：『我的靈魂現在已經在坐禪了，肉體就放過它吧...』", emoji: "🪨", scores: { energy: -45, stress: -15, loveIndex: 15 } }
    ]
  },
  {
    id: 51,
    title: "今天早上一覺醒來，覺得喉嚨有點癢癢的，身體好像快感冒了...",
    options: [
      { text: "緊張警報拉響！立刻翻箱倒櫃吃各種保健食品，全副武裝防護！", emoji: "😷", scores: { energy: 25, stress: 35, loveIndex: 5 } },
      { text: "藉機開啟『病嬌弱小模式』，黏在另一半懷裡撒嬌討要摸摸和熱水", emoji: "🥺", scores: { energy: -15, stress: -10, loveIndex: 60 } },
      { text: "雖然累累的，但依然努力為另一半做早餐，不想讓對方擔心", emoji: "🍳", scores: { energy: -20, stress: 15, loveIndex: 45 } },
      { text: "直接放棄戰鬥，喝杯熱水，把自己裹成一隻密不透風的冬眠蠶蛹", emoji: "🐛", scores: { energy: -50, stress: -30, loveIndex: 15 } }
    ]
  },
  {
    id: 52,
    title: "咖啡店的櫥窗裡只剩下最後一塊你最愛的草莓蛋糕，但另一半也很想吃？",
    options: [
      { text: "『兩強相爭！』發動猜拳爭奪戰，願賭服輸，贏家全拿！", emoji: "✊", scores: { energy: 40, stress: 10, loveIndex: 20 } },
      { text: "大方讓給對方吃，看著對方幸福的吃相，我也覺得心裡甜甜的", emoji: "🍰", scores: { energy: 10, stress: -25, loveIndex: 60 } },
      { text: "切成完美的兩半，你一口我一口，一口蛋糕配一口對方的愛意", emoji: "🍴", scores: { energy: 20, stress: -20, loveIndex: 55 } },
      { text: "隨便啦...我現在累得連嘴巴都不想動，對方全部吃掉就好", emoji: "🥱", scores: { energy: -35, stress: -15, loveIndex: 20 } }
    ]
  },
  {
    id: 53,
    title: "如果未來人類要搬去火星居住，另一半興致勃勃邀你一起報名？",
    options: [
      { text: "太酷了！立刻報名，準備在火星的紅色沙丘上跟另一半種馬鈴薯！", emoji: "🪐", scores: { energy: 45, stress: -15, loveIndex: 35 } },
      { text: "聽起來超危險...萬一宇宙飛船爆炸怎麼辦？我還是留在地球安全", emoji: "🙅‍♀️", scores: { energy: 20, stress: 30, loveIndex: 5 } },
      { text: "只要能跟你在一起，去哪裡我都無所謂，就算是荒涼的太空深處", emoji: "🚀", scores: { energy: 10, stress: -30, loveIndex: 60 } },
      { text: "搬去火星要坐飛船幾年？感覺好睏喔，我還是繼續在地球躺平吧", emoji: "🛌", scores: { energy: -40, stress: -20, loveIndex: 15 } }
    ]
  },
  {
    id: 54,
    title: "如果突然穿越回 90 年代，沒有任何智慧型手機和網路，今晚你們會？",
    options: [
      { text: "翻出古老的錄音帶，在客廳跟另一半跟著經典老歌瘋狂亂舞！", emoji: "📻", scores: { energy: 45, stress: -25, loveIndex: 35 } },
      { text: "大眼瞪小眼，感到極度無聊，不知道沒有滑手機要怎麼聊天", emoji: "💬", scores: { energy: 20, stress: 25, loveIndex: 5 } },
      { text: "點起蠟燭，跟另一半徹夜暢聊彼此小時候最害羞幼稚的糗事", emoji: "🕯️", scores: { energy: 15, stress: -30, loveIndex: 55 } },
      { text: "太好了！終於可以不被訊息打擾，安安靜靜、毫無干擾地大睡一場", emoji: "💤", scores: { energy: -40, stress: -40, loveIndex: 15 } }
    ]
  },
  {
    id: 55,
    title: "回家的路上突然下大雨，但兩個人身上只有一把極小的折疊傘？",
    options: [
      { text: "把傘頂在兩個人頭上，在雨中瘋狂奔跑，像演青春偶像劇一樣大笑！", emoji: "🏃‍♂️", scores: { energy: 45, stress: -10, loveIndex: 45 } },
      { text: "把傘大部分都往對方那邊撐，自己半邊肩膀濕透也心甘情願", emoji: "☔", scores: { energy: 10, stress: -25, loveIndex: 65 } },
      { text: "完蛋了，渾身濕漉漉，今晚衣服很難乾，感到非常鬱悶煩躁", emoji: "😠", scores: { energy: 25, stress: 40, loveIndex: -5 } },
      { text: "放棄掙扎，把傘收起來：『我們直接淋雨走回去吧，我累得撐不動了』", emoji: "🌧️", scores: { energy: -35, stress: -15, loveIndex: 20 } }
    ]
  },
  {
    id: 56,
    title: "如果可以不花一分錢，把家裡裝飾成你夢想的奇特風格？",
    options: [
      { text: "鋪滿軟墊與大型滑梯、滿牆都是零食的『雙人遊樂場史萊姆風』！", emoji: "🛝", scores: { energy: 45, stress: -30, loveIndex: 40 } },
      { text: "充滿高科技與發光線條、酷炫冰冷的『賽博朋克太空艙風』", emoji: "🛸", scores: { energy: 35, stress: 10, loveIndex: 15 } },
      { text: "溫暖木質、點滿蠟燭、長滿綠色植栽的『北歐童話森林小木屋風』", emoji: "🏡", scores: { energy: -10, stress: -45, loveIndex: 45 } },
      { text: "除了床和沙發什麼都不放，連大牆壁都是白色的『終極簡約放空風』", emoji: "⬜", scores: { energy: -35, stress: -35, loveIndex: 25 } }
    ]
  },
  {
    id: 57,
    title: "今晚要跟另一半的朋友們進行第一次正式的聚會餐敘？",
    options: [
      { text: "超期待！準備了好多好玩的笑話，誓要在對方朋友前展現超強魅力！", emoji: "🥳", scores: { energy: 50, stress: 15, loveIndex: 30 } },
      { text: "感到強烈的社交焦慮，緊張地一直確認自己的衣服跟頭髮有沒有亂", emoji: "😰", scores: { energy: 20, stress: 45, loveIndex: 10 } },
      { text: "默默在另一半身邊，當個安靜得體又帶著微笑的靠山，陪著對方", emoji: "🤝", scores: { energy: -15, stress: -20, loveIndex: 45 } },
      { text: "身體好累...我可以假裝臨時加班，自己在家裡躺平睡覺嗎？", emoji: "🛌", scores: { energy: -45, stress: 25, loveIndex: 5 } }
    ]
  },
  {
    id: 58,
    title: "一回到家，發現家裡的貓咪把另一半最愛的真皮沙發抓出了好幾道大破洞！",
    options: [
      { text: "氣瘋了！立刻抓起貓咪進行嚴肅的思想教育，氣呼呼找另一半商量！", emoji: "🐱", scores: { energy: 40, stress: 40, loveIndex: -10 } },
      { text: "立刻抱住另一半：『沒關係，舊的不去新的不來，我們剛好買新沙發！』", emoji: "🛋️", scores: { energy: 30, stress: -20, loveIndex: 45 } },
      { text: "摸摸貓咪的頭：『好啦，至少牠抓得很開心...』默默去買皮革貼來修補", emoji: "🩹", scores: { energy: -10, stress: -25, loveIndex: 35 } },
      { text: "癱倒在破沙發上，跟貓咪一起閉上眼睛：『就這樣吧，我也快散架了』", emoji: "👻", scores: { energy: -50, stress: 15, loveIndex: 15 } }
    ]
  },
  {
    id: 59,
    title: "半夜做了一個超真實的惡夢，夢見另一半跟別人跑了，你被冷落在一旁？",
    options: [
      { text: "醒來火氣超大！立刻轉過身，趁對方在睡覺時輕輕捏住對方的鼻子報仇！", emoji: "😡", scores: { energy: 40, stress: 25, loveIndex: 35 } },
      { text: "委屈得眼眶泛淚，縮進對方懷裡，拼命往他/她身上貼，尋求安全感", emoji: "🥺", scores: { energy: -15, stress: 15, loveIndex: 65 } },
      { text: "拍拍胸口：『幸好只是個夢』，溫柔地在對方額頭上落下一吻", emoji: "😘", scores: { energy: -10, stress: -30, loveIndex: 55 } },
      { text: "醒來覺得好睏，翻個身繼續睡：『夢裡他/她找了個更好的，我也樂得輕鬆...』", emoji: "😴", scores: { energy: -35, stress: -10, loveIndex: 5 } }
    ]
  },
  {
    id: 60,
    title: "如果可以在大腦後方接上一條傳輸線，你最想傳輸給另一半的是？",
    options: [
      { text: "我所有大腦裡的搞怪、無厘頭想法，讓對方笑到肚子痛！", emoji: "🔌", scores: { energy: 45, stress: -20, loveIndex: 35 } },
      { text: "此時此刻我累積了一整天的巨大工作壓力，讓對方替我分擔一下！", emoji: "🧠", scores: { energy: 30, stress: 40, loveIndex: 5 } },
      { text: "我此生對你所有的溫柔、愛意與幸福感，毫無保留地傳過去！", emoji: "💖", scores: { energy: 15, stress: -35, loveIndex: 70 } },
      { text: "一片空白的澄澈禪意...因為我現在腦袋已經累到完全無法運轉了", emoji: "🍃", scores: { energy: -50, stress: -40, loveIndex: 15 } }
    ]
  }];

// ==========================================================================
// 2. 音效系統 (Web Audio API 模擬 chimes & beeps)
// ==========================================================================
function playSound(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'click') {
      // 俏皮的小答題音效
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'success') {
      // 歡樂的心情分析成功 chimes (和弦疊加)
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + idx * 0.08);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.06, now + idx * 0.08 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
        
        o.start(now + idx * 0.08);
        o.stop(now + idx * 0.08 + 0.4);
      });
    } else if (type === 'nudge') {
      // 敲敲門音效
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.12); // C#5
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.setValueAtTime(0.01, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.warn("Web Audio API not allowed or supported by browser policy yet:", e);
  }
}

// ==========================================================================
// 3. UI 初始化與背景氣泡生成
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initBackgroundEffects();
  loadLocalStorage();
  registerEventListeners();
  renderAppView();
  
  // 網頁載入時，若已登入則自動進行一次靜默背景同步，確保取得最新狀態
  if (APP_STATE.role && APP_STATE.gasUrl) {
    syncCloudData(true);
  }
  
  // 定時輪詢（若有設定 GAS API，每 60 秒自動同步一次另一半心情）
  setInterval(() => {
    if (APP_STATE.gasUrl) {
      syncCloudData(true); // 靜默背景同步
    }
  }, 60000);
});

// 生成浪漫的漂浮愛心與心情氣泡
function initBackgroundEffects() {
  const bg = document.getElementById("floatingBg");
  if (!bg) return;
  
  const icons = ["fa-heart", "fa-face-smile", "fa-star", "fa-cloud-sun", "fa-seedling"];
  
  for (let i = 0; i < 15; i++) {
    createSingleBubble(bg, icons);
  }
  
  // 每隔 8 秒自動補一個氣泡，維持背景動態感
  setInterval(() => {
    createSingleBubble(bg, icons);
  }, 8000);
}

function createSingleBubble(parent, icons) {
  const elem = document.createElement("div");
  elem.classList.add("floating-element");
  
  // 隨機選取 FontAwesome 圖示
  const randomIcon = icons[Math.floor(Math.random() * icons.length)];
  elem.innerHTML = `<i class="fa-solid ${randomIcon}"></i>`;
  
  // 隨機大小、位置、延遲與速度
  const size = Math.random() * 40 + 20; // 20px ~ 60px
  const left = Math.random() * 100; // 0% ~ 100%
  const delay = Math.random() * 10; // 0s ~ 10s
  const duration = Math.random() * 15 + 10; // 10s ~ 25s
  
  elem.style.width = `${size}px`;
  elem.style.height = `${size}px`;
  elem.style.left = `${left}%`;
  elem.style.animationDelay = `${delay}s`;
  elem.style.animationDuration = `${duration}s`;
  elem.style.fontSize = `${size * 0.4}px`;
  
  parent.appendChild(elem);
  
  // 動態動畫結束後移除，防止記憶體洩漏
  elem.addEventListener("animationend", () => {
    elem.remove();
  });
}

// ==========================================================================
// 4. LOCALSTORAGE 資料讀取與保存
// ==========================================================================
function loadLocalStorage() {
  APP_STATE.role = localStorage.getItem("treehouse_role");
  APP_STATE.nickname = localStorage.getItem("treehouse_nickname") || "";
  APP_STATE.gasUrl = localStorage.getItem("treehouse_gas_url") || "https://script.google.com/macros/s/AKfycbySwWTaP0zTXtE14JD9dirOkLcU8waqlEjbRLZ2obkbFv2UgEB6tCGIWbnDMAbXSirUqg/exec";
  
  APP_STATE.customNames.husband = localStorage.getItem("treehouse_name_husband") || "老公";
  APP_STATE.customNames.wife = localStorage.getItem("treehouse_name_wife") || "老婆";
  
  // 讀取今日自己已做完的心情（避免重複測驗，但提供重新測驗按鈕）
  const savedOwnMood = localStorage.getItem("treehouse_own_mood_today");
  if (savedOwnMood) {
    try {
      const parsed = JSON.parse(savedOwnMood);
      // 檢查是否為「今天」的紀錄 (比對 timestamp 或 date 字串以防時區轉換落差)
      if (isToday(parsed.timestamp) || parsed.date === getTodayDateString()) {
        APP_STATE.ownTodayMood = parsed;
      } else {
        localStorage.removeItem("treehouse_own_mood_today");
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 讀取快取的另一半心情
  const savedPartnerMood = localStorage.getItem("treehouse_partner_mood_today");
  if (savedPartnerMood) {
    try {
      const parsed = JSON.parse(savedPartnerMood);
      if (isToday(parsed.timestamp) || parsed.date === getTodayDateString()) {
        APP_STATE.partnerTodayMood = parsed;
      } else {
        localStorage.removeItem("treehouse_partner_mood_today");
      }
    } catch (e) {
      console.error(e);
    }
  }
}

function saveOwnMoodToLocal(moodData) {
  APP_STATE.ownTodayMood = moodData;
  localStorage.setItem("treehouse_own_mood_today", JSON.stringify(moodData));
}

// ==========================================================================
// 5. 畫面切換與渲染核心 (ROUTING)
// ==========================================================================
function renderAppView() {
  const viewWelcome = document.getElementById("viewWelcome");
  const viewDashboard = document.getElementById("viewDashboard");
  const viewQuiz = document.getElementById("viewQuiz");
  const viewSettings = document.getElementById("viewSettings");
  const appHeader = document.getElementById("appHeader");
  
  // 隱藏所有視圖
  viewWelcome.classList.add("hidden");
  viewDashboard.classList.add("hidden");
  viewQuiz.classList.add("hidden");
  viewSettings.classList.add("hidden");
  appHeader.classList.add("hidden");
  
  // 如果沒有設定主角角色，強制進到歡迎頁
  if (!APP_STATE.role) {
    viewWelcome.classList.remove("hidden");
    resetWelcomeForm();
    return;
  }
  
  // 否則，預設顯示 Dashboard 並開啟導覽列
  appHeader.classList.remove("hidden");
  
  // 根據當前網頁錨點或狀態決定視圖
  const hash = window.location.hash;
  if (hash === "#settings") {
    viewSettings.classList.remove("hidden");
    initSettingsForm();
  } else if (hash === "#quiz") {
    viewQuiz.classList.remove("hidden");
    // 開始測驗
  } else {
    // 預設為 Dashboard
    window.location.hash = "#dashboard";
    viewDashboard.classList.remove("hidden");
    renderDashboard();
  }
}

function navigateTo(hash) {
  window.location.hash = hash;
  renderAppView();
}

// ==========================================================================
// 6. 首頁角色選擇 (WELCOME VIEW)
// ==========================================================================
function resetWelcomeForm() {
  document.getElementById("roleHusband").classList.remove("selected");
  document.getElementById("roleWife").classList.remove("selected");
  document.getElementById("nicknameGroup").classList.add("hidden");
  document.getElementById("inputNickname").value = "";
}

function selectRole(role) {
  playSound('click');
  APP_STATE.role = role;
  
  const husbandCard = document.getElementById("roleHusband");
  const wifeCard = document.getElementById("roleWife");
  const nickGroup = document.getElementById("nicknameGroup");
  const nickInput = document.getElementById("inputNickname");
  
  if (role === 'husband') {
    husbandCard.classList.add("selected");
    wifeCard.classList.remove("selected");
    nickInput.placeholder = `例如：帥氣${APP_STATE.customNames.husband} / 貓系男子`;
  } else {
    wifeCard.classList.add("selected");
    husbandCard.classList.remove("selected");
    nickInput.placeholder = `例如：甜心${APP_STATE.customNames.wife} / 傲嬌公主`;
  }
  
  nickGroup.classList.remove("hidden");
}

// ==========================================================================
// 7. 儀表板頁面渲染 (DASHBOARD VIEW)
// ==========================================================================
function renderDashboard() {
  const husbandName = APP_STATE.customNames.husband;
  const wifeName = APP_STATE.customNames.wife;
  const partnerRole = APP_STATE.role === 'husband' ? 'wife' : 'husband';
  const partnerTitle = APP_STATE.role === 'husband' ? wifeName : husbandName;
  const ownTitle = APP_STATE.role === 'husband' ? husbandName : wifeName;
  
  // 更新角色的標章稱謂
  document.getElementById("myRoleBadge").innerText = `${ownTitle} (${APP_STATE.nickname || "自己"})`;
    // 儀表板初次渲染：不寫死另一半的暱稱，若已取得今日心情則由下方動態更新
  document.getElementById("partnerRoleBadge").innerText = partnerTitle;
  
  // 1. 渲染自己的狀態
  const myEmpty = document.getElementById("myMoodEmpty");
  const myActive = document.getElementById("myMoodActive");
  
  if (APP_STATE.ownTodayMood) {
    myEmpty.classList.add("hidden");
    myActive.classList.remove("hidden");
    
    // 帶入心情數值
    const mood = APP_STATE.ownTodayMood;
    document.getElementById("myMoodEmoji").innerText = mood.moodEmoji;
    document.getElementById("myMoodName").innerText = mood.moodName;
    document.getElementById("myMoodTime").innerText = formatTimeDiff(mood.timestamp);
    
    // 進度條
    animateProgress("myEnergyBar", "myEnergyVal", mood.energy);
    animateProgress("myStressBar", "myStressVal", mood.stress);
    animateProgress("myLoveBar", "myLoveVal", mood.loveIndex);
    
    // 備忘錄
    document.getElementById("myMoodNote").innerText = mood.note ? mood.note : "今天沒有寫備忘小悄悄話喔～ 🍂";
  } else {
    myEmpty.classList.remove("hidden");
    myActive.classList.add("hidden");
  }
  
  // 2. 渲染另一半的狀態
  const partnerEmpty = document.getElementById("partnerMoodEmpty");
  const partnerActive = document.getElementById("partnerMoodActive");
  document.getElementById("partnerEmptyText").innerText = `${partnerTitle}今天還沒有做測驗喔...`;
  
  if (APP_STATE.partnerTodayMood) {
    partnerEmpty.classList.add("hidden");
    partnerActive.classList.remove("hidden");
    
    const mood = APP_STATE.partnerTodayMood;
    document.getElementById("partnerRoleBadge").innerText = `${partnerTitle} (${mood.nickname || "另一半"})`;
    document.getElementById("partnerMoodEmoji").innerText = mood.moodEmoji;
    document.getElementById("partnerMoodName").innerText = mood.moodName;
    document.getElementById("partnerMoodTime").innerText = formatTimeDiff(mood.timestamp);
    
    animateProgress("partnerEnergyBar", "partnerEnergyVal", mood.energy);
    animateProgress("partnerStressBar", "partnerStressVal", mood.stress);
    animateProgress("partnerLoveBar", "partnerLoveVal", mood.loveIndex);
    
    // 悄悄話
    document.getElementById("partnerMoodNote").innerText = mood.note ? mood.note : `今天${partnerTitle}很害羞，什麼都沒寫～ 🤫`;
    
    // 貼心建議
    const moodKey = findMoodKey(mood.moodEmoji);
    const adviceText = MOOD_TYPES[moodKey]?.getAdvice(partnerTitle) || `今天多給${partnerTitle}一點愛與陪伴就對囉！✨`;
    document.getElementById("partnerAdviceText").innerText = adviceText;
  } else {
    partnerEmpty.classList.remove("hidden");
    partnerActive.classList.add("hidden");
    document.getElementById("partnerRoleBadge").innerText = partnerTitle;
  }
  
  // 3. 渲染歷史紀錄牆
  renderHistoryWall();
}

function animateProgress(barId, textId, targetValue) {
  const bar = document.getElementById(barId);
  const text = document.getElementById(textId);
  if (!bar || !text) return;
  
  // 觸發前端寬度動畫
  bar.style.width = "0%";
  setTimeout(() => {
    bar.style.width = `${targetValue}%`;
  }, 100);
  
  // 數字動態滾動
  let start = 0;
  const duration = 1000; // 1s
  const stepTime = Math.abs(Math.floor(duration / targetValue)) || 10;
  
  const timer = setInterval(() => {
    start++;
    text.innerText = `${start}%`;
    if (start >= targetValue) {
      text.innerText = `${targetValue}%`;
      clearInterval(timer);
    }
  }, stepTime);
}

// 根據 Emoji 反推心情 Key
function findMoodKey(emoji) {
  for (const [key, details] of Object.entries(MOOD_TYPES)) {
    if (details.emoji === emoji) return key;
  }
  return "CALM"; // 預設
}

// ==========================================================================
// 8. 心理測驗實作與「不重複」演算法 (QUIZ VIEW)
// ==========================================================================
function startQuizAdventure() {
  playSound('click');
  navigateTo("quiz");
  APP_STATE.quizAnswers = [];
  APP_STATE.currentQuestionIdx = 0;
  
  // 執行【不重複測驗演算法】
  let usedIds = [];
  const storedUsed = localStorage.getItem("treehouse_used_quiz_ids");
  if (storedUsed) {
    try {
      usedIds = JSON.parse(storedUsed);
    } catch (e) {
      usedIds = [];
    }
  }
  
  // 過濾出尚未答過的題目
  let availableQuestions = QUIZ_POOL.filter(q => !usedIds.includes(q.id));
  
  // 如果剩下的題目不足 5 題，表示題庫幾乎答過一輪，清空已答清單並重設
  if (availableQuestions.length < 5) {
    usedIds = [];
    localStorage.removeItem("treehouse_used_quiz_ids");
    availableQuestions = [...QUIZ_POOL];
    showToast("小樹屋精靈：題庫已輪空，重啟全新一輪趣味測驗！✨", "success");
  }
  
  // 從可用題目中隨機洗牌，抽選 5 題作為今天的測驗
  shuffleArray(availableQuestions);
  APP_STATE.quizQuestions = availableQuestions.slice(0, 5);
  
  // 隱藏結果與計算畫面，顯示答題區
  document.getElementById("quizResultScreen").classList.add("hidden");
  document.getElementById("quizLoadingScreen").classList.add("hidden");
  document.getElementById("questionContainer").classList.remove("hidden");
  
  renderQuestionCard();
}

function renderQuestionCard() {
  const container = document.getElementById("questionContainer");
  container.innerHTML = "";
  
  const currentIdx = APP_STATE.currentQuestionIdx;
  const q = APP_STATE.quizQuestions[currentIdx];
  const total = APP_STATE.quizQuestions.length;
  
  // 1. 更新上方進度條
  const progressPercent = ((currentIdx) / total) * 100;
  document.getElementById("quizProgressFill").style.width = `${progressPercent}%`;
  document.getElementById("quizProgressHeart").style.left = `${progressPercent}%`;
  document.getElementById("quizProgressText").innerText = `第 ${currentIdx + 1} / ${total} 題`;
  
  // 2. 建立 Question Card DOM
  const card = document.createElement("div");
  card.className = "question-card";
  
  const title = document.createElement("h3");
  title.className = "question-title";
  title.innerText = q.title;
  card.appendChild(title);
  
  const optionsList = document.createElement("div");
  optionsList.className = "options-list";
  
  const shuffledOpts = [...q.options];
  shuffleArray(shuffledOpts);
  shuffledOpts.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    
    // 如果是 couch 字樣則帶入 FontAwesome 沙發，否則直接帶入 Emoji
    let emojiHtml = `<span class="option-emoji">${opt.emoji}</span>`;
    if (opt.emoji === "couch") {
      emojiHtml = `<span class="option-emoji"><i class="fa-solid fa-couch text-primary"></i></span>`;
    }
    
    btn.innerHTML = `${emojiHtml} ${opt.text}`;
    
    btn.addEventListener("click", () => {
      btn.style.borderColor = "var(--primary-color)";
      btn.style.background = "rgba(255, 122, 144, 0.1)";
      handleAnswerSelect(opt.scores, q.id);
    });
    
    optionsList.appendChild(btn);
  });
  
  card.appendChild(optionsList);
  container.appendChild(card);
}

function handleAnswerSelect(scores, questionId) {
  playSound('click');
  APP_STATE.quizAnswers.push({ questionId, scores });
  
  const card = document.querySelector(".question-card");
  card.classList.add("slide-out");
  
  // 卡片滑出動畫結束後，載入下一題或結算
  setTimeout(() => {
    APP_STATE.currentQuestionIdx++;
    if (APP_STATE.currentQuestionIdx < APP_STATE.quizQuestions.length) {
      renderQuestionCard();
    } else {
      // 測驗結束，進入結算畫面
      calculateQuizResult();
    }
  }, 400);
}

// 結算與分析演算法
function calculateQuizResult() {
  const container = document.getElementById("questionContainer");
  const loading = document.getElementById("quizLoadingScreen");
  const resultScr = document.getElementById("quizResultScreen");
  
  container.classList.add("hidden");
  loading.classList.remove("hidden");
  
  // 更新進度條為 100%
  document.getElementById("quizProgressFill").style.width = `100%`;
  document.getElementById("quizProgressHeart").style.left = `100%`;
  document.getElementById("quizProgressText").innerText = `測驗完成！`;
  
  // 記錄這些題目的 ID 到已使用清單，避免近期重複
  let usedIds = [];
  const storedUsed = localStorage.getItem("treehouse_used_quiz_ids");
  if (storedUsed) {
    try { usedIds = JSON.parse(storedUsed); } catch (e) {}
  }
  APP_STATE.quizQuestions.forEach(q => {
    if (!usedIds.includes(q.id)) usedIds.push(q.id);
  });
  localStorage.setItem("treehouse_used_quiz_ids", JSON.stringify(usedIds));
  
  // 模擬精靈計算動畫 (1.5秒後揭曉)
  setTimeout(() => {
    loading.classList.add("hidden");
    resultScr.classList.remove("hidden");
    playSound('success');
    
    // 心情分數累計
    let energySum = 0;
    let stressSum = 0;
    let loveSum = 0;
    
    APP_STATE.quizAnswers.forEach(ans => {
      energySum += ans.scores.energy;
      stressSum += ans.scores.stress;
      loveSum += ans.scores.loveIndex;
    });
    
    // 平衡分數計算：扣除預期之正面/負面平均偏移，使其均勻分布在 50% 周圍
    const energy = Math.max(5, Math.min(100, Math.round(50 + (energySum - 20) * 0.45)));
    const stress = Math.max(5, Math.min(100, Math.round(50 + (stressSum + 25) * 0.45)));
    const loveIndex = Math.max(5, Math.min(100, Math.round(50 + (loveSum - 70) * 0.45)));
    
    // 3D 心情標準特徵向量空間定義 (活力值, 壓力值, 黏人指數)
    const MOOD_PROFILES = {
      EXPLODING: { energy: 15, stress: 90, loveIndex: 20 },
      GRUMPY: { energy: 75, stress: 80, loveIndex: 30 },
      NEED_HUG: { energy: 20, stress: 35, loveIndex: 90 },
      TIRED: { energy: 15, stress: 65, loveIndex: 40 },
      HAPPY_SWEET: { energy: 85, stress: 15, loveIndex: 95 },
      ENERGY_FULL: { energy: 95, stress: 15, loveIndex: 60 },
      CALM: { energy: 50, stress: 15, loveIndex: 50 },
      MELTING: { energy: 10, stress: 10, loveIndex: 30 },
      DRAMATIC: { energy: 75, stress: 70, loveIndex: 80 },
      FOODIE_MONSTER: { energy: 70, stress: 55, loveIndex: 20 },
      SPOILEE: { energy: 45, stress: 45, loveIndex: 85 },
      GHOSTING: { energy: 25, stress: 20, loveIndex: 40 },
      ADVENTURER: { energy: 90, stress: 20, loveIndex: 80 },
      OVERWORKED: { energy: 25, stress: 80, loveIndex: 75 },
      SHY_LOVER: { energy: 35, stress: 20, loveIndex: 75 }
    };
    
    // 歐幾里得距離匹配演算法 (尋找 3D 空間中最契合的今日心情特徵)
    let moodKey = "CALM";
    let minDistance = Infinity;
    
    for (const [key, profile] of Object.entries(MOOD_PROFILES)) {
      const dist = Math.sqrt(
        Math.pow(energy - profile.energy, 2) +
        Math.pow(stress - profile.stress, 2) +
        Math.pow(loveIndex - profile.loveIndex, 2)
      );
      if (dist < minDistance) {
        minDistance = dist;
        moodKey = key;
      }
    }
    
    const finalMood = MOOD_TYPES[moodKey];
    
    // 暫存計算結果至 APP_STATE (尚未按儲存)
    APP_STATE.pendingResult = {
      date: getTodayDateString(),
      user: APP_STATE.role,
      moodName: finalMood.name,
      moodEmoji: finalMood.emoji,
      energy: energy,
      stress: stress,
      loveIndex: loveIndex,
      note: ""
    };
    
    // 渲染結果頁面 DOM
    document.getElementById("resEmoji").innerText = finalMood.emoji;
    document.getElementById("resMoodName").innerText = finalMood.name;
    document.getElementById("resMoodDesc").innerText = finalMood.desc;
    
    animateProgress("resEnergyBar", "resEnergyVal", energy);
    animateProgress("resStressBar", "resStressVal", stress);
    animateProgress("resLoveBar", "resLoveVal", loveIndex);
    
    document.getElementById("resNote").value = "";
    
    // 心花怒放灑花屑粒子特效
    triggerConfetti();
  }, 1800);
}

// 提交心情至 Local 與 Cloud
function submitQuizResult() {
  if (!APP_STATE.pendingResult) return;
  
  const noteInput = document.getElementById("resNote").value.trim();
  const finalMoodData = {
    ...APP_STATE.pendingResult,
    nickname: APP_STATE.nickname,
    note: noteInput,
    timestamp: new Date().toISOString()
  };
  
  // 1. 存入本機
  saveOwnMoodToLocal(finalMoodData);
  
  // 2. 存入雲端 (若有設定 GAS)
  if (APP_STATE.gasUrl) {
    showToast("小精靈：正在將您的心情送上雲端... ☁️", "info");
    
    // 使用 CORS 發送 simple POST 請求（Content-Type: text/plain 不會觸發 preflight），以正確追隨 Google 重導向並遞送 Body
    fetch(APP_STATE.gasUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify(finalMoodData)
    })
    .then(res => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then(data => {
      if (data.status === "success") {
        showToast("雲端同步成功！另一半只要開啟網頁就能看到囉！💖", "success");
        syncCloudData();
      } else {
        throw new Error(data.message || "GAS write error");
      }
    })
    .catch((err) => {
      console.error("Cloud post error:", err);
      showToast("本機已儲存，但雲端同步失敗（請檢查網路或設定）。", "error");
      navigateTo("dashboard");
    });
  } else {
    showToast("心情已保存在這台裝置！(若要讓另一半看到，請至設定串接試算表喔) 🏠", "success");
    navigateTo("dashboard");
  }
  
  APP_STATE.pendingResult = null;
}

// ==========================================================================
// 9. CLOUD API 串接與資料讀取 (GOOGLE SHEETS)
// ==========================================================================
function syncCloudData(isSilent = false) {
  if (!APP_STATE.gasUrl) {
    if (!isSilent) {
      showToast("未設定 Google Apps Script API 網址，無法同步喔！請至設定頁填寫。", "error");
    }
    return;
  }
  
  if (!isSilent) {
    showToast("正在與小樹屋雲端試算表同步中... 🍃", "info");
    const syncBtn = document.getElementById("btnForceSync");
    syncBtn.innerHTML = `<i class="fa-solid fa-arrows-rotate fa-spin"></i> 同步中...`;
  }
  
  // 動態拼接當前時間戳記做為 Cache Buster，防範瀏覽器快取 API 數據
  const timestampBuster = `_t=${new Date().getTime()}`;
  const syncUrl = APP_STATE.gasUrl + (APP_STATE.gasUrl.includes('?') ? '&' : '?') + timestampBuster;
  
  fetch(syncUrl)
  .then(res => {
    if (!res.ok) throw new Error("Network response was not ok");
    return res.json();
  })
  .then(data => {
    if (data.status === "success") {
      let isDataUpdated = false;
      const partnerRole = APP_STATE.role === 'husband' ? 'wife' : 'husband';
      const ownRole = APP_STATE.role;
      
      // 1. 更新另一半的今日心情
      const partnerLatest = data.latest[partnerRole];
      if (partnerLatest && (isToday(partnerLatest.timestamp) || partnerLatest.date === getTodayDateString())) {
        const prevPartnerMood = localStorage.getItem("treehouse_partner_mood_today");
        const nextPartnerMoodStr = JSON.stringify(partnerLatest);
        
        if (prevPartnerMood !== nextPartnerMoodStr) {
          APP_STATE.partnerTodayMood = partnerLatest;
          localStorage.setItem("treehouse_partner_mood_today", nextPartnerMoodStr);
          isDataUpdated = true;
          
          if (isSilent) {
            showToast("叮咚！另一半剛剛填寫了新的今日心情喔！快去看看！💖", "success");
          }
        }
      } else {
        // 如果對方今天沒測驗，清除快取
        APP_STATE.partnerTodayMood = null;
        localStorage.removeItem("treehouse_partner_mood_today");
      }
      
      // 2. 更新自己的今日心情（以雲端為唯一真實狀態，若雲端清空或無資料，則本地也應重置要求重新測驗）
      const ownLatest = data.latest[ownRole];
      if (ownLatest && (isToday(ownLatest.timestamp) || ownLatest.date === getTodayDateString())) {
        const prevOwnMood = localStorage.getItem("treehouse_own_mood_today");
        const nextOwnMoodStr = JSON.stringify(ownLatest);
        
        if (prevOwnMood !== nextOwnMoodStr) {
          APP_STATE.ownTodayMood = ownLatest;
          localStorage.setItem("treehouse_own_mood_today", nextOwnMoodStr);
          isDataUpdated = true;
        }
      } else {
        // 如果雲端今天沒有我的測驗紀錄（例如 Excel 內容被清空），則清空本地狀態，要求重新測驗
        if (APP_STATE.ownTodayMood) {
          APP_STATE.ownTodayMood = null;
          localStorage.removeItem("treehouse_own_mood_today");
          isDataUpdated = true;
        }
      }
      
      // 3. 更新歷史紀錄
      APP_STATE.history = data.history || [];
      
      // 更新成功提示
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      document.getElementById("lastSyncText").innerText = `上次雲端同步：今天 ${timeStr}`;
      
      if (!isSilent) {
        showToast("心情數據已完美同步！🍃", "success");
      }
      
      // 重新渲染儀表板
      renderDashboard();
    } else {
      throw new Error(data.message || "Unknown error");
    }
  })
  .catch(err => {
    console.error("Cloud fetch error:", err);
    if (!isSilent) {
      showToast("雲端連線失敗，請檢查 API 網址是否正確或權限是否開啟！", "error");
    }
  })
  .finally(() => {
    const syncBtn = document.getElementById("btnForceSync");
    syncBtn.innerHTML = `<i class="fa-solid fa-arrows-rotate animate-spin-hover"></i> 立即同步雙方最新心情`;
  });
}

// 測試 API 連線
function testApiConnection() {
  const url = document.getElementById("settingsGasUrl").value.trim();
  const statusBadge = document.getElementById("apiStatusText");
  
  if (!url) {
    showToast("請先輸入 API 網址再進行測試！", "error");
    return;
  }
  
  statusBadge.className = "api-status-badge text-warning";
  statusBadge.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 正在連線測試...`;
  
  // 動態拼接 Cache Buster，防範測試 API 時的快取干擾
  const timestampBuster = `_t=${new Date().getTime()}`;
  const testUrl = url + (url.includes('?') ? '&' : '?') + timestampBuster;
  
  fetch(testUrl)
  .then(res => {
    if (!res.ok) throw new Error();
    return res.json();
  })
  .then(data => {
    if (data.status === "success") {
      statusBadge.className = "api-status-badge text-success";
      statusBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> 連線成功！`;
      showToast("小精靈回報：Google 試算表連線完全正常！👍", "success");
    } else {
      throw new Error();
    }
  })
  .catch(() => {
    statusBadge.className = "api-status-badge text-error";
    statusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> 連線失敗`;
    showToast("連線失敗！請確認網址正確無誤，且部署的存取權已設為「所有人」。", "error");
  });
}

// ==========================================================================
// 10. 設定頁面處理 (SETTINGS VIEW)
// ==========================================================================
function initSettingsForm() {
  document.getElementById("settingsGasUrl").value = APP_STATE.gasUrl;
  document.getElementById("settingsHusbandName").value = APP_STATE.customNames.husband;
  document.getElementById("settingsWifeName").value = APP_STATE.customNames.wife;
  
  const statusBadge = document.getElementById("apiStatusText");
  if (APP_STATE.gasUrl) {
    statusBadge.className = "api-status-badge text-success";
    statusBadge.innerHTML = `<i class="fa-solid fa-link"></i> 已設定連結`;
  } else {
    statusBadge.className = "api-status-badge text-warning";
    statusBadge.innerHTML = `<i class="fa-solid fa-link-slash"></i> 未設定連線`;
  }
}

function saveSettings() {
  playSound('click');
  const gasUrl = document.getElementById("settingsGasUrl").value.trim();
  const husName = document.getElementById("settingsHusbandName").value.trim() || "老公";
  const wifName = document.getElementById("settingsWifeName").value.trim() || "老婆";
  
  APP_STATE.gasUrl = gasUrl;
  APP_STATE.customNames.husband = husName;
  APP_STATE.customNames.wife = wifName;
  
  localStorage.setItem("treehouse_gas_url", gasUrl);
  localStorage.setItem("treehouse_name_husband", husName);
  localStorage.setItem("treehouse_name_wife", wifName);
  
  showToast("設定已儲存成功！小樹屋魔法已更新 ✨", "success");
  navigateTo("dashboard");
}

function clearLocalCache() {
  if (confirm("⚠️ 確定要清除這台裝置的所有設定嗎？您的角色、暱稱及 API 網址將會被重設（試算表中的資料不會消失）。")) {
    localStorage.clear();
    APP_STATE.role = null;
    APP_STATE.nickname = "";
    APP_STATE.gasUrl = "";
    APP_STATE.ownTodayMood = null;
    APP_STATE.partnerTodayMood = null;
    APP_STATE.history = [];
    
    showToast("快取已全數清除，即將重啟載入...", "success");
    setTimeout(() => {
      window.location.hash = "";
      window.location.reload();
    }, 1000);
  }
}

// ==========================================================================
// 11. 歷史牆渲染與輔助函數 (HISTORY & UTILS)
// ==========================================================================
function renderHistoryWall() {
  const empty = document.getElementById("historyEmpty");
  const timeline = document.getElementById("historyTimeline");
  
  // 1. 如果沒有設定 GAS，歷史紀錄只顯示自己今日的
  let listToRender = [];
  if (APP_STATE.gasUrl && APP_STATE.history.length > 0) {
    listToRender = APP_STATE.history;
  } else if (APP_STATE.ownTodayMood) {
    listToRender = [APP_STATE.ownTodayMood];
  }
  
  if (listToRender.length === 0) {
    empty.classList.remove("hidden");
    timeline.classList.add("hidden");
    return;
  }
  
  empty.classList.add("hidden");
  timeline.classList.remove("hidden");
  timeline.innerHTML = "";
  
  listToRender.forEach((item) => {
    const isMe = item.user === APP_STATE.role;
    const userRoleText = item.user === 'husband' ? APP_STATE.customNames.husband : APP_STATE.customNames.wife;
    
    const div = document.createElement("div");
    div.className = "history-item";
    
    const left = document.createElement("div");
    left.className = "history-left";
    
    // 頭像圓圈
    const avatar = document.createElement("div");
    avatar.className = `history-role-avatar ${item.user}`;
    avatar.innerHTML = item.user === 'husband' ? `<i class="fa-solid fa-user-tie"></i>` : `<i class="fa-solid fa-user-ninja"></i>`;
    left.appendChild(avatar);
    
    // 暱稱與時間
    const info = document.createElement("div");
    info.className = "history-info";
    
    const nameSpan = document.createElement("span");
    nameSpan.className = "history-user-name";
    nameSpan.innerText = isMe ? `${userRoleText} (我)` : userRoleText;
    info.appendChild(nameSpan);
    
    const timeSpan = document.createElement("span");
    timeSpan.className = "history-timestamp";
    timeSpan.innerText = formatTimeDiff(item.timestamp);
    info.appendChild(timeSpan);
    
    left.appendChild(info);
    div.appendChild(left);
    
    // 右邊心情顯示
    const right = document.createElement("div");
    right.className = "history-right";
    
    const moodBadge = document.createElement("div");
    moodBadge.className = "history-mood-badge";
    moodBadge.innerHTML = `<span>${item.moodEmoji}</span> <span>${item.moodName.split(' ')[0]}</span>`;
    right.appendChild(moodBadge);
    
    // 備忘悄悄話按鈕
    if (item.note) {
      const noteBtn = document.createElement("div");
      noteBtn.className = "history-note-indicator";
      noteBtn.innerHTML = `<i class="fa-solid fa-comment-dots"></i>`;
      noteBtn.title = item.note;
      
      noteBtn.addEventListener("click", () => {
        alert(`💬 ${userRoleText} 當時寫下的悄悄話：\n「${item.note}」`);
      });
      
      right.appendChild(noteBtn);
    }
    
    div.appendChild(right);
    timeline.appendChild(div);
  });
}

// 隨機打亂陣列 (Fisher-Yates Shuffle)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 取得今天 YYYY-MM-DD 日期字串
function getTodayDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// 判斷 ISO 時間戳記是否為本地時間的「今天」 (避免 Google Apps Script 執行環境時區造成一日落差)
function isToday(timestamp) {
  if (!timestamp) return false;
  const d = new Date(timestamp);
  const now = new Date();
  return d.getDate() === now.getDate() &&
         d.getMonth() === now.getMonth() &&
         d.getFullYear() === now.getFullYear();
}

// 格式化時間差 (例如：剛剛, 5分鐘前, 3小時前, 昨天...)
function formatTimeDiff(isoString) {
  if (!isoString) return "";
  
  const entryDate = new Date(isoString);
  const now = new Date();
  const diffMs = now - entryDate;
  
  if (isNaN(diffMs)) return isoString.split('T')[0]; // 防呆
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  // 檢查是否是今天
  const isToday = entryDate.getDate() === now.getDate() && 
                  entryDate.getMonth() === now.getMonth() && 
                  entryDate.getFullYear() === now.getFullYear();
                  
  if (isToday) {
    if (diffMins < 1) return "剛剛";
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    return `${diffHours} 小時前`;
  } else {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = entryDate.getDate() === yesterday.getDate() && 
                        entryDate.getMonth() === yesterday.getMonth() && 
                        entryDate.getFullYear() === yesterday.getFullYear();
                        
    const hours = entryDate.getHours().toString().padStart(2, '0');
    const mins = entryDate.getMinutes().toString().padStart(2, '0');
    
    if (isYesterday) {
      return `昨天 ${hours}:${mins}`;
    }
    
    return `${entryDate.getMonth() + 1}月${entryDate.getDate()}日 ${hours}:${mins}`;
  }
}

// ==========================================================================
// 12. 事件註冊中心 (EVENTS)
// ==========================================================================
function registerEventListeners() {
  // 1. 首頁主角選擇
  document.getElementById("roleHusband").addEventListener("click", () => selectRole('husband'));
  document.getElementById("roleWife").addEventListener("click", () => selectRole('wife'));
  
  document.getElementById("btnStartAdventure").addEventListener("click", () => {
    playSound('click');
    const nickname = document.getElementById("inputNickname").value.trim();
    if (!nickname) {
      showToast("請輸入一個可愛的暱稱，讓小樹屋認得您喔！", "error");
      return;
    }
    
    localStorage.setItem("treehouse_role", APP_STATE.role);
    localStorage.setItem("treehouse_nickname", nickname);
    APP_STATE.nickname = nickname;
    
    // 保存當前運行的 GAS URL 到本機，避免清除快取重登後無法同步
    if (APP_STATE.gasUrl) {
      localStorage.setItem("treehouse_gas_url", APP_STATE.gasUrl);
    }
    
    showToast(`歡迎進入心情小樹屋，${nickname}！✨`, "success");
    
    // 若有設定 GAS URL 則自動拉取資料，否則直接進 Dashboard
    if (APP_STATE.gasUrl) {
      syncCloudData();
    }
    
    navigateTo("dashboard");
  });
  
  // 2. 儀表板跳轉與導覽按鈕
  document.getElementById("btnDashboard").addEventListener("click", () => {
    playSound('click');
    navigateTo("dashboard");
  });
  
  document.getElementById("btnSettings").addEventListener("click", () => {
    playSound('click');
    navigateTo("settings");
  });
  
  document.getElementById("logoClick").addEventListener("click", () => {
    playSound('click');
    navigateTo("dashboard");
  });
  
  document.getElementById("btnGoQuiz").addEventListener("click", () => startQuizAdventure());
  
  // 重新測驗
  document.getElementById("btnRetakeQuiz").addEventListener("click", () => {
    if (confirm("確定要拋棄今天的測驗結果並重新進行測驗嗎？另一半的心情也會依最新結果為準喔！")) {
      startQuizAdventure();
    }
  });
  
  // 3. 測驗控制
  document.getElementById("btnExitQuiz").addEventListener("click", () => {
    playSound('click');
    if (confirm("確定要放棄這次的心理測驗嗎？您的答題進度將不會被保存喔！")) {
      navigateTo("dashboard");
    }
  });
  
  document.getElementById("btnSubmitMood").addEventListener("click", submitQuizResult);
  document.getElementById("btnCancelResult").addEventListener("click", () => {
    playSound('click');
    if (confirm("確定要放棄這次的心情解析結果嗎？")) {
      navigateTo("dashboard");
    }
  });
  
  // 4. 設定中心按鈕
  document.getElementById("btnSaveSettings").addEventListener("click", saveSettings);
  document.getElementById("btnBackToDashboard").addEventListener("click", () => {
    playSound('click');
    navigateTo("dashboard");
  });
  document.getElementById("btnTestConnection").addEventListener("click", testApiConnection);
  document.getElementById("btnClearCache").addEventListener("click", clearLocalCache);
  
  // 複製 Apps Script 按鈕
  document.getElementById("btnCopyScript").addEventListener("click", () => {
    fetch("google_apps_script.js")
    .then(res => res.text())
    .then(text => {
      navigator.clipboard.writeText(text)
      .then(() => showToast("Google Apps Script 程式碼已成功複製到您的剪貼簿！📋", "success"))
      .catch(() => showToast("複製失敗，請手動開啟 `google_apps_script.js` 檔案複製！", "error"));
    })
    .catch(() => {
      showToast("無法讀取程式碼，請手動前往資料夾開啟程式碼複製！", "error");
    });
  });
  
  // 5. 立即同步按鈕
  document.getElementById("btnForceSync").addEventListener("click", () => {
    playSound('click');
    syncCloudData();
  });
  
  // 6. 催促另一半按鈕
  document.getElementById("btnNudgePartner").addEventListener("click", () => {
    playSound('nudge');
    
    // 抖動月亮動畫
    const graphic = document.querySelector(".cute-graphic.asleep");
    if (graphic) {
      graphic.style.animation = "none";
      setTimeout(() => {
        graphic.style.animation = "shake 0.5s ease-in-out";
      }, 50);
      
      graphic.addEventListener("animationend", function handler() {
        graphic.style.animation = "bounceSlow 3s infinite ease-in-out";
        graphic.removeEventListener("animationend", handler);
      });
    }
    
    // 生成俏皮催促文案複製到剪貼簿
    const partnerName = APP_STATE.role === 'husband' ? APP_STATE.customNames.wife : APP_STATE.customNames.husband;
    const nudgeMessages = [
      `🔔 叮咚！親愛的 ${partnerName}，小樹屋精靈在呼喚你囉！快來花一分鐘測測今天的心情，我想知道你今天開不開心！✨`,
      `🥺 報告 ${partnerName}！另一半正在心情小樹屋等你喔～快來做個簡單測驗同步你的今日心情，好想關心你！⚡`,
      `🏡 哈囉親愛的！今天在小樹屋還沒看到你的狀態，快來戳戳題目，聽說今晚有專屬的互動小撇步喔！🧁`
    ];
    
    const randomMsg = nudgeMessages[Math.floor(Math.random() * nudgeMessages.length)];
    navigator.clipboard.writeText(randomMsg)
    .then(() => {
      showToast("已成功複製『俏皮催促悄悄話』！快去貼給他/她吧！📲", "success");
    })
    .catch(() => {
      showToast("敲敲門成功！(但文字複製失敗，請口頭提醒他喔) 🗣️", "success");
    });
  });
}

// ==========================================================================
// 13. UI 小特效與輔助 (PARTICLES & TOAST)
// ==========================================================================
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let iconHtml = '<i class="fa-solid fa-circle-info"></i>';
  if (type === "success") iconHtml = '<i class="fa-solid fa-heart"></i>';
  if (type === "error") iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
  
  toast.innerHTML = `${iconHtml} <span>${message}</span>`;
  container.appendChild(toast);
  
  // 3.5秒後自動淡出移除
  setTimeout(() => {
    toast.classList.add("fade-out");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 3500);
}

// 心花怒放灑花屑特效
function triggerConfetti() {
  const container = document.getElementById("confettiContainer");
  if (!container) return;
  container.innerHTML = "";
  
  const colors = ["#FF7A90", "#6C90FF", "#FFB703", "#2EC4B6", "#FFD166"];
  const shapes = ["circle", "square", "heart"];
  
  for (let i = 0; i < 40; i++) {
    const particle = document.createElement("div");
    particle.className = `confetti-piece ${shapes[Math.floor(Math.random() * shapes.length)]}`;
    
    // 隨機定位與落點
    const left = Math.random() * 100; // 0% ~ 100%
    const delay = Math.random() * 0.5; // 0s ~ 0.5s
    const scale = Math.random() * 0.8 + 0.4;
    const bg = colors[Math.floor(Math.random() * colors.length)];
    
    particle.style.left = `${left}%`;
    particle.style.backgroundColor = bg;
    particle.style.animationDelay = `${delay}s`;
    particle.style.transform = `scale(${scale})`;
    
    container.appendChild(particle);
  }
}

// 支援 Hash routing 監聽
window.addEventListener("hashchange", renderAppView);

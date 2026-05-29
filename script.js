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
  }
};

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
  }
];

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
      // 檢查是否為「今天」的紀錄
      if (parsed.date === getTodayDateString()) {
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
      if (parsed.date === getTodayDateString()) {
        APP_STATE.partnerTodayMood = parsed;
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
  
  // 如果剩下的題目不足 3 題，表示題庫幾乎答過一輪，清空已答清單並重設
  if (availableQuestions.length < 3) {
    usedIds = [];
    localStorage.removeItem("treehouse_used_quiz_ids");
    availableQuestions = [...QUIZ_POOL];
    showToast("小樹屋精靈：題庫已輪空，重啟全新一輪趣味測驗！✨", "success");
  }
  
  // 從可用題目中隨機洗牌，抽選 3 題作為今天的測驗
  shuffleArray(availableQuestions);
  APP_STATE.quizQuestions = availableQuestions.slice(0, 3);
  
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
  
  q.options.forEach((opt) => {
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
    
    // 心情分數累計（基底為50）
    let energySum = 50;
    let stressSum = 50;
    let loveSum = 50;
    
    APP_STATE.quizAnswers.forEach(ans => {
      energySum += ans.scores.energy;
      stressSum += ans.scores.stress;
      loveSum += ans.scores.loveIndex;
    });
    
    // 限制在 5 ~ 100% 之間
    const energy = Math.max(5, Math.min(100, energySum));
    const stress = Math.max(5, Math.min(100, stressSum));
    const loveIndex = Math.max(5, Math.min(100, loveSum));
    
    // 心情判定邏輯樹
    let moodKey = "CALM";
    
    if (stress > 70) {
      moodKey = energy < 45 ? "EXPLODING" : "GRUMPY";
    } else if (energy < 40) {
      moodKey = loveIndex > 70 ? "NEED_HUG" : "TIRED";
    } else if (loveIndex > 75) {
      moodKey = "HAPPY_SWEET";
    } else if (energy > 75) {
      moodKey = "ENERGY_FULL";
    } else {
      moodKey = "CALM";
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
    note: noteInput,
    timestamp: new Date().toISOString()
  };
  
  // 1. 存入本機
  saveOwnMoodToLocal(finalMoodData);
  
  // 2. 存入雲端 (若有設定 GAS)
  if (APP_STATE.gasUrl) {
    showToast("小精靈：正在將您的心情送上雲端... ☁️", "info");
    
    // 使用 text/plain 以避免 preflight OPTIONS 跨域攔截
    fetch(APP_STATE.gasUrl, {
      method: "POST",
      mode: "no-cors", // 即使 no-cors，資料依然會送達 Google 試算表，此為靜態頁面神技
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify(finalMoodData)
    })
    .then(() => {
      showToast("雲端同步成功！另一半只要開啟網頁就能看到囉！💖", "success");
      // 隨後主動拉取一次最新資料
      syncCloudData();
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
  
  fetch(APP_STATE.gasUrl)
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
      if (partnerLatest && partnerLatest.date === getTodayDateString()) {
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
      
      // 2. 備份自己的今日心情到雲端資料（若本地被清除，可反向同步回來）
      const ownLatest = data.latest[ownRole];
      if (ownLatest && ownLatest.date === getTodayDateString() && !APP_STATE.ownTodayMood) {
        APP_STATE.ownTodayMood = ownLatest;
        localStorage.setItem("treehouse_own_mood_today", JSON.stringify(ownLatest));
        isDataUpdated = true;
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
  
  fetch(url)
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
    
    showToast(`歡迎進入心情小樹屋，${nickname}！✨`, "success");
    
    // 若本機有 GAS URL 則自動拉取資料，否則直接進 Dashboard
    if (localStorage.getItem("treehouse_gas_url")) {
      APP_STATE.gasUrl = localStorage.getItem("treehouse_gas_url");
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

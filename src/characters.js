// Character voice lines per sprite (with multi-language support)

import { getLocale } from './i18n.js';

export var CHARACTERS = {
  tabby_cat: { defaultName: 'Mochi', displayName: 'Tabby Cat' },
  blue_buddy: { defaultName: 'Buddy', displayName: 'Blue Buddy' },
  golden_retriever: { defaultName: 'Cooper', displayName: 'Golden Retriever' },
  schnauzer: { defaultName: 'Pepper', displayName: 'Schnauzer' },
  _default: { defaultName: 'Mochi' },
};

export var VOICE = {
  tabby_cat: {
    greet: '🐱',
    acks: ['~♪', '😊', { en: 'hehe', zh: '嘻嘻', ja: 'えへへ', ko: '히히', es: 'jeje' }, { en: 'meow!', zh: '喵!', ja: 'にゃー!', ko: '냐옹!', es: '¡miau!' }, '💛'],
    petHold: { en: 'purrrr~ 😊', zh: '呼噜噜~ 😊', ja: 'ゴロゴロ~ 😊', ko: '그르릉~ 😊', es: 'purrr~ 😊' },
    petLines: {
      en: ['purrrr~', 'more...', 'mmm~ 😊', "don't stop~"],
      zh: ['呼噜噜~', '还要...', '嗯~ 😊', '别停~'],
      ja: ['ゴロゴロ~', 'もっと...', 'んー~ 😊', 'やめないで~'],
      ko: ['그르릉~', '더...', '음~ 😊', '멈추지 마~'],
      es: ['purrr~', 'más...', 'mmm~ 😊', 'no pares~'],
    },
    petFallback: { en: 'purrrr~ 😊', zh: '呼噜噜~ 😊', ja: 'ゴロゴロ~ 😊', ko: '그르릉~ 😊', es: 'purrr~ 😊' },
    tapLines: { en: ['hm?', '!', 'meow?', '~'], zh: ['嗯?', '!', '喵?', '~'], ja: ['ん?', '!', 'にゃ?', '~'], ko: ['음?', '!', '냐?', '~'], es: ['hm?', '!', '¿miau?', '~'] },
    tapFallback: { en: 'meow?', zh: '喵?', ja: 'にゃ?', ko: '냐옹?', es: '¿miau?' },
    chatFallback: { en: 'meow?', zh: '喵?', ja: 'にゃ?', ko: '냐옹?', es: '¿miau?' },
  },
  blue_buddy: {
    greet: '👋',
    acks: ['~♪', '😊', { en: 'hehe', zh: '嘻嘻', ja: 'えへへ', ko: '히히', es: 'jeje' }, { en: 'yo!', zh: '哟!', ja: 'よっ!', ko: '요!', es: '¡ey!' }, '💙'],
    petHold: { en: 'hehe that tickles~ 😊', zh: '嘻嘻好痒~ 😊', ja: 'えへへ くすぐったい~ 😊', ko: '히히 간지러워~ 😊', es: 'jeje me hace cosquillas~ 😊' },
    petLines: {
      en: ['hehe~', 'more...', 'feels nice~ 😊', "don't stop~"],
      zh: ['嘻嘻~', '还要...', '好舒服~ 😊', '别停~'],
      ja: ['えへへ~', 'もっと...', '気持ちいい~ 😊', 'やめないで~'],
      ko: ['히히~', '더...', '기분 좋아~ 😊', '멈추지 마~'],
      es: ['jeje~', 'más...', 'qué rico~ 😊', 'no pares~'],
    },
    petFallback: { en: 'hehe~ 😊', zh: '嘻嘻~ 😊', ja: 'えへへ~ 😊', ko: '히히~ 😊', es: 'jeje~ 😊' },
    tapLines: { en: ['hm?', '!', 'hey?', '~'], zh: ['嗯?', '!', '嘿?', '~'], ja: ['ん?', '!', 'ねぇ?', '~'], ko: ['음?', '!', '어?', '~'], es: ['hm?', '!', '¿oye?', '~'] },
    tapFallback: { en: 'hey?', zh: '嘿?', ja: 'ねぇ?', ko: '어?', es: '¿oye?' },
    chatFallback: { en: 'hmm?', zh: '嗯?', ja: 'うーん?', ko: '음?', es: '¿hmm?' },
  },
  golden_retriever: {
    greet: '🐶',
    acks: ['~♪', '😊', { en: 'hehe', zh: '嘻嘻', ja: 'えへへ', ko: '히히', es: 'jeje' }, { en: 'woof!', zh: '汪!', ja: 'ワン!', ko: '멍!', es: '¡guau!' }, '💛'],
    petHold: { en: 'tail wagging intensifies~ 😊', zh: '尾巴疯狂摇摆~ 😊', ja: 'しっぽブンブン~ 😊', ko: '꼬리 살랑살랑~ 😊', es: '¡la cola no para!~ 😊' },
    petLines: {
      en: ['more pets~', 'best day ever~', 'so happy~ 😊', "don't stop~"],
      zh: ['再摸摸~', '最棒的一天~', '好开心~ 😊', '别停~'],
      ja: ['もっとなでて~', '最高の日~', '幸せ~ 😊', 'やめないで~'],
      ko: ['더 쓰다듬어줘~', '최고의 하루~', '너무 행복해~ 😊', '멈추지 마~'],
      es: ['más caricias~', '¡el mejor día!~', 'qué feliz~ 😊', 'no pares~'],
    },
    petFallback: { en: '*happy panting* 😊', zh: '*开心地喘气* 😊', ja: '*嬉しそうにハァハァ* 😊', ko: '*행복한 헥헥* 😊', es: '*jadeo feliz* 😊' },
    tapLines: { en: ['hm?', '!', 'woof?', '~'], zh: ['嗯?', '!', '汪?', '~'], ja: ['ん?', '!', 'ワン?', '~'], ko: ['음?', '!', '멍?', '~'], es: ['hm?', '!', '¿guau?', '~'] },
    tapFallback: { en: 'woof?', zh: '汪?', ja: 'ワン?', ko: '멍?', es: '¿guau?' },
    chatFallback: { en: 'woof?', zh: '汪?', ja: 'ワン?', ko: '멍?', es: '¿guau?' },
  },
  schnauzer: {
    greet: '🐶',
    acks: ['~♪', '😊', { en: 'hehe', zh: '嘻嘻', ja: 'えへへ', ko: '히히', es: 'jeje' }, { en: 'arf!', zh: '嗷!', ja: 'アフ!', ko: '앙!', es: '¡arf!' }, '🖤'],
    petHold: { en: 'hmph... fine, keep going~ 😊', zh: '哼...好吧，继续~ 😊', ja: 'ふん...まぁ続けて~ 😊', ko: '흥...그래, 계속해~ 😊', es: 'hmph... vale, sigue~ 😊' },
    petLines: {
      en: ['...okay that\'s nice', 'hmph~', 'don\'t tell anyone~ 😊', 'more...'],
      zh: ['...还行吧', '哼~', '别告诉别人~ 😊', '还要...'],
      ja: ['...まぁ悪くない', 'ふん~', '誰にも言わないで~ 😊', 'もっと...'],
      ko: ['...뭐 나쁘지 않아', '흥~', '아무한테도 말하지 마~ 😊', '더...'],
      es: ['...bueno, no está mal', 'hmph~', 'no se lo digas a nadie~ 😊', 'más...'],
    },
    petFallback: { en: 'hmph~ 😊', zh: '哼~ 😊', ja: 'ふん~ 😊', ko: '흥~ 😊', es: 'hmph~ 😊' },
    tapLines: { en: ['hm?', '!', 'arf?', '~'], zh: ['嗯?', '!', '嗷?', '~'], ja: ['ん?', '!', 'アフ?', '~'], ko: ['음?', '!', '앙?', '~'], es: ['hm?', '!', '¿arf?', '~'] },
    tapFallback: { en: 'arf?', zh: '嗷?', ja: 'アフ?', ko: '앙?', es: '¿arf?' },
    chatFallback: { en: 'arf?', zh: '嗷?', ja: 'アフ?', ko: '앙?', es: '¿arf?' },
  },
  _default: {
    greet: '👋',
    acks: ['~♪', '😊', { en: 'hehe', zh: '嘻嘻', ja: 'えへへ', ko: '히히', es: 'jeje' }, { en: 'hey!', zh: '嘿!', ja: 'やぁ!', ko: '야!', es: '¡ey!' }, '💛'],
    petHold: { en: 'hehe~ 😊', zh: '嘻嘻~ 😊', ja: 'えへへ~ 😊', ko: '히히~ 😊', es: 'jeje~ 😊' },
    petLines: {
      en: ['hehe~', 'more...', 'nice~ 😊', "don't stop~"],
      zh: ['嘻嘻~', '还要...', '好舒服~ 😊', '别停~'],
      ja: ['えへへ~', 'もっと...', '気持ちいい~ 😊', 'やめないで~'],
      ko: ['히히~', '더...', '좋아~ 😊', '멈추지 마~'],
      es: ['jeje~', 'más...', 'qué rico~ 😊', 'no pares~'],
    },
    petFallback: { en: 'hehe~ 😊', zh: '嘻嘻~ 😊', ja: 'えへへ~ 😊', ko: '히히~ 😊', es: 'jeje~ 😊' },
    tapLines: { en: ['hm?', '!', 'hey?', '~'], zh: ['嗯?', '!', '嘿?', '~'], ja: ['ん?', '!', 'ねぇ?', '~'], ko: ['음?', '!', '어?', '~'], es: ['hm?', '!', '¿oye?', '~'] },
    tapFallback: { en: 'hey?', zh: '嘿?', ja: 'ねぇ?', ko: '어?', es: '¿oye?' },
    chatFallback: { en: 'hmm?', zh: '嗯?', ja: 'うーん?', ko: '음?', es: '¿hmm?' },
  }
};

// Resolve a voice value: string/array pass through, {locale: val} objects resolve by current language
function resolveVoice(val) {
  if (val == null) return val;
  if (typeof val === 'string' || Array.isArray(val)) return val;
  return val[getLocale()] || val.en || val[Object.keys(val)[0]];
}

// Resolve an entire voice object — resolves each field, and for arrays resolves each element too
function resolveVoiceObject(raw) {
  var resolved = {};
  for (var key in raw) {
    var val = raw[key];
    var r = resolveVoice(val);
    // For arrays, also resolve each element (acks can mix strings and locale objects)
    if (Array.isArray(r)) {
      resolved[key] = r.map(resolveVoice);
    } else {
      resolved[key] = r;
    }
  }
  return resolved;
}

// Custom sprite sources: key → data URL
var customSpriteSources = {};

// Register a custom character (from .pet-data/sprites/)
// options: { defaultName, voiceData } — both optional
export function registerCharacter(key, displayName, spriteSrc, options) {
  var opts = options || {};
  if (!CHARACTERS[key]) {
    CHARACTERS[key] = {
      defaultName: opts.defaultName || displayName,
      displayName: displayName,
      custom: true,
    };
  }
  if (opts.voice) {
    VOICE[key] = opts.voice;
  } else if (!VOICE[key]) {
    VOICE[key] = Object.assign({}, VOICE._default);
  }
  customSpriteSources[key] = spriteSrc;
}

// Remove a custom character
export function removeCharacter(key) {
  if (CHARACTERS[key] && CHARACTERS[key].custom) {
    delete CHARACTERS[key];
    delete VOICE[key];
    delete customSpriteSources[key];
  }
}

// Get the image source URL for a character
export function getSpriteSrc(key) {
  if (customSpriteSources[key]) return customSpriteSources[key];
  return '/sprites/' + key + '.png';
}

// Check if a character is custom (user-imported)
export function isCustomCharacter(key) {
  return !!(CHARACTERS[key] && CHARACTERS[key].custom);
}

// pet.currentSprite must be set before calling
// Returns a resolved voice object with all locale objects resolved to current language
export function voice(pet) {
  var raw = VOICE[pet.currentSprite] || VOICE._default;
  return resolveVoiceObject(raw);
}

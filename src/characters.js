// Character voice lines per sprite

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
    acks: ['~♪', '😊', 'hehe', 'meow!', '💛'],
    petHold: 'purrrr~ 😊',
    petLines: ['purrrr~', 'more...', 'mmm~ 😊', "don't stop~"],
    petFallback: 'purrrr~ 😊',
    tapLines: ['hm?', '!', 'meow?', '~'],
    tapFallback: 'meow?',
    chatFallback: 'meow?',
  },
  blue_buddy: {
    greet: '👋',
    acks: ['~♪', '😊', 'hehe', 'yo!', '💙'],
    petHold: 'hehe that tickles~ 😊',
    petLines: ['hehe~', 'more...', 'feels nice~ 😊', "don't stop~"],
    petFallback: 'hehe~ 😊',
    tapLines: ['hm?', '!', 'hey?', '~'],
    tapFallback: 'hey?',
    chatFallback: 'hmm?',
  },
  golden_retriever: {
    greet: '🐶',
    acks: ['~♪', '😊', 'hehe', 'woof!', '💛'],
    petHold: 'tail wagging intensifies~ 😊',
    petLines: ['more pets~', 'best day ever~', 'so happy~ 😊', "don't stop~"],
    petFallback: '*happy panting* 😊',
    tapLines: ['hm?', '!', 'woof?', '~'],
    tapFallback: 'woof?',
    chatFallback: 'woof?',
  },
  schnauzer: {
    greet: '🐶',
    acks: ['~♪', '😊', 'hehe', 'arf!', '🖤'],
    petHold: 'hmph... fine, keep going~ 😊',
    petLines: ['...okay that\'s nice', 'hmph~', 'don\'t tell anyone~ 😊', 'more...'],
    petFallback: 'hmph~ 😊',
    tapLines: ['hm?', '!', 'arf?', '~'],
    tapFallback: 'arf?',
    chatFallback: 'arf?',
  },
  _default: {
    greet: '👋',
    acks: ['~♪', '😊', 'hehe', 'hey!', '💛'],
    petHold: 'hehe~ 😊',
    petLines: ['hehe~', 'more...', 'nice~ 😊', "don't stop~"],
    petFallback: 'hehe~ 😊',
    tapLines: ['hm?', '!', 'hey?', '~'],
    tapFallback: 'hey?',
    chatFallback: 'hmm?',
  }
};

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
export function voice(pet) { return VOICE[pet.currentSprite] || VOICE._default; }

// content-loader.js - Runtime loader for dialogue and flavor text from .txt files
// Friend edits files in content/ folder - no code changes needed

const dialogueCache = {};
const flavorCache = {};
let loaded = false;

// Simple format parser: "=== SCENE ===" blocks, "KEY: value" metadata, "Speaker: text" lines
function parseDialogueFile(text, npcName) {
    const result = {};
    let currentScene = null;
    let currentBlock = null;
    const lines = text.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            if (currentBlock && currentBlock.dialogue.length > 0) {
                // Flush current speaker line if any
            }
            continue;
        }
        const sceneMatch = trimmed.match(/^===\s*(.+?)\s*===$/);
        if (sceneMatch) {
            currentScene = sceneMatch[1].trim();
            currentBlock = { dialogue: [], unlocks: null };
            result[currentScene] = currentBlock;
            continue;
        }
        if (!currentBlock) continue;

        const metaMatch = trimmed.match(/^UNLOCKS:\s*(.+)$/i);
        if (metaMatch) {
            currentBlock.unlocks = metaMatch[1].trim();
            continue;
        }

        const colonIdx = trimmed.indexOf(':');
        if (colonIdx > 0) {
            const speaker = trimmed.slice(0, colonIdx).trim();
            const text = trimmed.slice(colonIdx + 1).trim();
            if (speaker && text) {
                currentBlock.dialogue.push({ speaker, text });
            }
        }
    }
    return result;
}

// Flavor format: "=== ID ===" blocks, "NAME: value", paragraphs = flavor variants
function parseFlavorFile(text) {
    const result = {};
    let currentId = null;
    let currentBlock = null;
    const lines = text.split('\n');
    let paragraphBuffer = [];

    const flushParagraph = () => {
        const p = paragraphBuffer.join(' ').trim();
        if (p && currentBlock) {
            currentBlock.flavorText.push(p);
        }
        paragraphBuffer = [];
    };

    for (const line of lines) {
        const headerMatch = line.match(/^===\s*(.+?)\s*===$/);
        if (headerMatch) {
            flushParagraph();
            currentId = headerMatch[1].trim();
            currentBlock = { name: currentId, flavorText: [], itemName: null };
            result[currentId] = currentBlock;
            continue;
        }
        if (!currentBlock) continue;

        const nameMatch = line.match(/^NAME:\s*(.+)$/i);
        if (nameMatch) {
            flushParagraph();
            currentBlock.name = nameMatch[1].trim();
            continue;
        }
        const itemMatch = line.match(/^ITEM:\s*(.+)$/i);
        if (itemMatch) {
            flushParagraph();
            currentBlock.itemName = itemMatch[1].trim();
            continue;
        }

        const trimmed = line.trim();
        if (trimmed === '') {
            flushParagraph();
        } else {
            paragraphBuffer.push(trimmed);
        }
    }
    flushParagraph();
    return result;
}

// Fallback: embedded data when fetch fails (e.g. file://, offline)
const FALLBACK_CONVERSATIONS = {};
const FALLBACK_FLAVOR = {};

export function registerFallbackConversations(data) {
    Object.assign(FALLBACK_CONVERSATIONS, data);
}

export function registerFallbackFlavor(id, data) {
    FALLBACK_FLAVOR[id] = data;
}

const DIALOGUE_FILES = [
    { npc: 'Maya', file: 'Maya.txt' },
    { npc: 'Jake', file: 'Jake.txt' },
    { npc: 'Tony', file: 'Tony.txt' },
    { npc: 'Rex', file: 'Rex.txt' },
    { npc: 'Morgan', file: 'Morgan.txt' },
    { npc: 'Alex & Sam', file: 'Alex_Sam.txt' },
    { npc: 'Jordan & Riley', file: 'Jordan_Riley.txt' },
    { npc: 'Casey', file: 'Casey.txt' },
    { npc: 'Leah', file: 'Leah.txt' },
    { npc: 'Theo', file: 'Theo.txt' },
    { npc: 'Nina', file: 'Nina.txt' },
    { npc: 'Priya', file: 'Priya.txt' },
    { npc: 'Mr. Clean', file: 'Mr_Clean.txt' },
    { npc: 'Kayla', file: 'Kayla.txt' },
    { npc: 'Elli', file: 'Elli.txt' },
    { npc: 'Pastor Ruth', file: 'Pastor_Ruth.txt' },
    { npc: 'Clara', file: 'Clara.txt' },
    { npc: 'June', file: 'June.txt' },
    { npc: 'Nurse Mel', file: 'Nurse_Mel.txt' },
    { npc: 'Owen', file: 'Owen.txt' },
    { npc: 'Harvey', file: 'Harvey.txt' },
    { npc: 'Customer', file: 'Customer.txt' },
    { npc: 'Foreman Dee', file: 'Foreman_Dee.txt' },
    { npc: 'Caretaker Mo', file: 'Caretaker_Mo.txt' }
];

const FLAVOR_FILES = [
    'drycleaner.txt',
    'grumby.txt',
    'grohos.txt',
    'clothing.txt',
    'donut.txt',
    'supermarket.txt',
    'clearings.txt',
    'flowers.txt',
    'carnival.txt'
];

export async function loadAllContent() {
    if (loaded) return;

    const base = 'content';

    for (const { npc, file } of DIALOGUE_FILES) {
        try {
            const res = await fetch(`${base}/dialogue/${file}`);
            if (res.ok) {
                const text = await res.text();
                const parsed = parseDialogueFile(text, npc);
                dialogueCache[npc] = parsed;
            }
        } catch (e) {
            console.warn(`Content load failed for dialogue/${file}:`, e.message);
        }
    }

    for (const file of FLAVOR_FILES) {
        try {
            const res = await fetch(`${base}/flavor/${file}`);
            if (res.ok) {
                const text = await res.text();
                const parsed = parseFlavorFile(text);
                Object.assign(flavorCache, parsed);
            }
        } catch (e) {
            console.warn(`Content load failed for flavor/${file}:`, e.message);
        }
    }

    loaded = true;
}

export function getConversation(npcName, scene) {
    const groupKey = (npcName === 'Alex' || npcName === 'Sam') ? 'Alex & Sam' :
        (npcName === 'Jordan' || npcName === 'Riley') ? 'Jordan & Riley' : null;
    let data = dialogueCache[npcName] || (groupKey ? dialogueCache[groupKey] : null);
    if (!data) data = FALLBACK_CONVERSATIONS[npcName] || (groupKey ? FALLBACK_CONVERSATIONS[groupKey] : null);
    if (!data) return null;
    const sceneData = data[scene];
    return sceneData || null;
}

export function getFlavorContent(id) {
    const data = flavorCache[id] || FALLBACK_FLAVOR[id];
    if (!data) return { name: id, flavorText: ['Nothing particular.'] };
    return {
        name: data.name || id,
        flavorText: Array.isArray(data.flavorText) ? data.flavorText : [data.flavorText || ''],
        itemName: data.itemName || null
    };
}

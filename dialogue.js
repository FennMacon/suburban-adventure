// dialogue.js - NPC dialogue and conversation system

// Conversation data for each NPC - scene-specific with back-and-forth dialogue
export const conversations = {
    // Individual NPCs
    'Maya': {
        PLAZA: {
            dialogue: [
                { speaker: 'Maya', text: "My band's playing tonight at the open mic! We practiced a bunch and we have a new song we're gonna play." },
                { speaker: 'Player', text: "Hell ya! What's the song about?" },
                { speaker: 'Maya', text: "It's about the feeling of being stuck in a small town and wanting to escape. It's about the feeling of being alone and wanting to be with someone." },
                { speaker: 'Player', text: "That sounds like all of your other songs?" },
                { speaker: 'Maya', text: "Yeah, but this one is different. It's about  feeling stuck in a small town and wanting to escape. It's about being alone and wanting to be with someone." },
                { speaker: 'Player', text: "What's it called?" },
                { speaker: 'Maya', text: "Consistency." }
            ],
            unlocks: 'Consistency'
        },
        FOREST_SUBURBAN: {
            dialogue: [
                { speaker: 'Maya', text: "This forest setting is so peaceful compared to the busy plaza. I love coming here to think." },
                { speaker: 'Player', text: "It does feel different here. More contemplative." },
                { speaker: 'Maya', text: "Exactly! I wrote this acoustic song sitting by these trees. It captures that quiet suburban forest vibe perfectly." }
            ],
            unlocks: 'Forest (acoustic)'
        },
        POND: {
            dialogue: [
                { speaker: 'Maya', text: "Everyone left like an hour ago. It's just us and the dying fire now." },
                { speaker: 'Player', text: "Kind of eerie out here, huh?" },
                { speaker: 'Maya', text: "Yeah... I wrote this song sitting here watching the embers. It's got that haunted, late-night feeling." }
            ],
            unlocks: 'Dying Embers'
        }
    },

    'Jake': {
        PLAZA: {
            dialogue: [
                { speaker: 'Jake', text: "Dude, that pizza place sucks now that Tony owns it. That was the last good pizza place in town!" },
                { speaker: 'Player', text: "I know, I heard they have a new menu now." },
                { speaker: 'Jake', text: "Yeah, it's all fancy and expensive. I wrote a song about it, but it's mostly just complaining about the new menu. How does a pizza take seven days to make?" },
                { speaker: 'Player', text: "I would definitely listen to that song." },
                { speaker: 'Jake', text: "I've got tons of new songs, my favorite one is about how the more things change, the more they stay the same." },
                { speaker: 'Player', text: "That's so true." }

            ],
            unlocks: 'Tony Sucks'
        },
        FOREST_SUBURBAN: {
            dialogue: [
                { speaker: 'Jake', text: "Man, this place reminds me of summer camp. So much quieter than downtown." },
                { speaker: 'Player', text: "Do you come here often?" },
                { speaker: 'Jake', text: "Yeah, when I need to escape the chaos. I actually recorded a song here using just forest sounds and my voice." }
            ],
            unlocks: 'The More Things Change (The More They Stay The Same)'
        },
        POND: {
            dialogue: [
                { speaker: 'Jake', text: "The fire's almost out... feels like the end of something, you know?" },
                { speaker: 'Player', text: "Yeah, everyone's gone home." },
                { speaker: 'Jake', text: "That's when I do my best writing. Made this track about watching the embers fade and thinking about the night." }
            ],
            unlocks: 'Dying Light'
        }
    },

    'Tony': {
        GROHOS_INTERIOR: {
            dialogue: [
                { speaker: 'Tony', text: "Behold the future dining experience! Investors want 'upscale nostalgia' and I'm giving them marble countertops and vinyl barstools." },
                { speaker: 'Tony', text: "I just bought this place and I'm making some big changes." },
                { speaker: 'Tony', text: "You look like someone who appreciates the finer things in life." },
                { speaker: 'Player', text: "Cool, uh, can I get a slice?" },
                { speaker: 'Tony', text: "Oh, we don't do ordinary pizza here. I'm talking about our signature 'Diamond Crust Deluxe' - imported Italian truffles, gold leaf, and aged parmesan from a secret monastery." },
                { speaker: 'Player', text: "That sounds... expensive?" },
                { speaker: 'Tony', text: "Only $39.99! But wait, for just $4 more per slice, I'll throw in our 'Platinum Pepperoni' upgrade - but you gotta buy the whole pie!" },
                { speaker: 'Player', text: "What if I just want a regular slice..." },
                { speaker: 'Tony', text: "Regular? My friend, let me tell you about the process!" },
                { speaker: 'Tony', text: "Each slice here gets blessed by three different Italian grandmothers before it can even enter the oven." },
                { speaker: 'Tony', text: "It's a seven day process. You can't rush perfection!" },
                { speaker: 'Player', text: "What happened to the people who used to work here?" },
                { speaker: 'Tony', text: "They couldn't make the pizza fancy enough. We're a boutique pizza place now." },
                { speaker: 'Player', text: "I think I'm good on pizza for now..." }
            ]
        }
    },
    
    'Rex': {
        PLAZA: {
            dialogue: [
                { speaker: 'Rex', text: "dude you are way early for the show" },
                { speaker: 'Player', text: "can I hang up a flyer somewhere? it's for the plaza comp" },
                { speaker: 'Rex', text: "yeah sure whatever" },
                { speaker: 'Rex', text: "what's going on with the plaza?" },
                { speaker: 'Player', text: "developers are tearing it down to build condos" },
                { speaker: 'Rex', text: "aw man that's no good" },
                { speaker: 'Player', text: "that's why I'm doing the comp" },
                { speaker: 'Rex', text: "that's a cool idea" },
                { speaker: 'Player', text: "thanks man" },
                { speaker: 'Rex', text: "..." },
                { speaker: 'Player', text: "where do I put the flyer?" },
                { speaker: 'Rex', text: "just put it up on the wall by the door" },
            ]
        }
    },
    'Morgan': {
        FOREST_SUBURBAN: {
            dialogue: [
                { speaker: 'Morgan', text: "Ah, another seeker drawn to the old ways... The forest whispers secrets to those who listen." },
                { speaker: 'Player', text: "Uhh I'm just trying to hang out in the park?" },
                { speaker: 'Morgan', text: "The trees here remember when the first settlers came. They've seen the rituals, the offerings left at their roots. Some say the stones in that wall were placed by hands that knew the old magic." },
                { speaker: 'Player', text: "Didn't they build this park like a decade ago?" },
                { speaker: 'Morgan', text: "Call it what you will. The Puritans called it heresy, but the land remembers. These woods have always been a place between worlds - where the veil grows thin." },
                { speaker: 'Player', text: "Hahaha ok man!" },
                { speaker: 'Morgan', text: "The forest protects those who respect its power. But beware the paths that lead deeper than you intend to go." },
                { speaker: 'Player', text: "Alright, later!" }
            ],
        }
    },

    // Group conversations - multiple NPCs talking together
    'Alex & Sam': {
        PLAZA: {
            dialogue: [
                { speaker: 'Alex', text: "Just killing time in the parking lot. This place has so many memories, you know?" },
                { speaker: 'Sam', text: "Oh totally! Like that one summer when we all learned guitar..." },
                { speaker: 'Player', text: "Sounds like you two have some stories." },
                { speaker: 'Alex', text: "We sure do! Want to hear the song we wrote about growing up here?" }
            ],
            unlocks: 'Memories'
        },
        FOREST_SUBURBAN: {
            dialogue: [
                { speaker: 'Sam', text: "This old stone wall reminds me of my grandmother's property." },
                { speaker: 'Alex', text: "Yeah, classic New England vibes. Very different from the plaza scene." },
                { speaker: 'Player', text: "You both prefer it here?" },
                { speaker: 'Sam', text: "Sometimes. We wrote a folk song about these old stone walls and family history." }
            ],
            unlocks: 'Stone Walls'
        },
        POND: {
            dialogue: [
                { speaker: 'Alex', text: "This pond always feels different at night. Quieter than anywhere else." },
                { speaker: 'Sam', text: "I know right? Everyone's gone but the vibe lingers..." },
                { speaker: 'Player', text: "You two sticking around?" },
                { speaker: 'Alex', text: "Yeah, we wrote this melancholy track about nights like this. Want to hear it?" }
            ],
            unlocks: 'Pond Night'
        }
    },

    'Jordan & Riley': {
        PLAZA: {
            dialogue: [
                { speaker: 'Jordan', text: "This corner is the best spot for people watching. I see everything that happens." },
                { speaker: 'Riley', text: "Jordan's got stories for days! Like that time with the pizza delivery drama..." },
                { speaker: 'Player', text: "Pizza delivery drama?" },
                { speaker: 'Jordan', text: "Oh man, that's a whole song right there! We turned all the plaza gossip into this epic track." }
            ],
            unlocks: 'Drama'
        },
        FOREST_SUBURBAN: {
            dialogue: [
                { speaker: 'Riley', text: "I love how the trees create these little conversation nooks." },
                { speaker: 'Jordan', text: "Perfect for deep talks away from the plaza chaos." },
                { speaker: 'Player', text: "Do you two write music together?" },
                { speaker: 'Riley', text: "All the time! This setting inspired our most introspective piece yet." }
            ],
            unlocks: 'Forest Talks'
        }
    },

    'Casey': {
        POND: {
            dialogue: [
                { speaker: 'Casey', text: "They say someone drowned in this pond back in the 80s..." },
                { speaker: 'Player', text: "Come on, don't start with the ghost stories." },
                { speaker: 'Casey', text: "I'm serious! Sometimes on foggy nights you can see ripples when there's no wind." },
                { speaker: 'Player', text: "You're just trying to freak everyone out." },
                { speaker: 'Casey', text: "Maybe. But I wrote a song about it. Want to hear it?" }
            ],
            unlocks: 'Pond Ghost'
        }
    },

    'Leah': {
        CUMBYS_INTERIOR: {
            dialogue: [
                { speaker: 'Leah', text: "You're catching the quiet shift. Everyone's stocking up before the 'redevelopment crews' roll in." },
                { speaker: 'Player', text: "So the countdown is real?" },
                { speaker: 'Leah', text: "Ninety days. I'm tracking every sound in here so the last tape feels like Grumby's at 2 A.M." }
            ],
            unlocks: 'Last Shift'
        }
    },

    'Theo': {
        CUMBYS_INTERIOR: {
            dialogue: [
                { speaker: 'Theo', text: "Listen—Slush Puppie machines make the perfect pad if you loop them right." },
                { speaker: 'Player', text: "You're still assembling that farewell mix?" },
                { speaker: 'Theo', text: "Yeah. We need one track per interior. Meet by the karaoke stage after close and claim a verse." }
            ],
            unlocks: 'Plaza Finale'
        }
    },

    'Nina': {
        GROHOS_INTERIOR: {
            dialogue: [
                { speaker: 'Nina', text: "Tony wants gold leaf on everything, but the townies just want Wednesday night slices." },
                { speaker: 'Player', text: "Can you keep the old menu alive?" },
                { speaker: 'Nina', text: "In secret. I'm sampling the ovens and writing a track called 'Back Room Sauce'." },
                { speaker: 'Player', text: "Back Room Sauce" },
                { speaker: 'Nina', text: "Maybe I'll call it something else." }
            ],
            unlocks: 'Afterhours'
        }
    },

    'Priya': {
        CLOTHING_STORE_INTERIOR: {
            dialogue: [
                { speaker: 'Priya', text: "Lease termination notice showed up with this morning's deliveries." },
                { speaker: 'Player', text: "You're really moving out?" },
                { speaker: 'Priya', text: "Eventually. But first I want a song that sounds like late-night fitting room confessions." }
            ],
            unlocks: 'Tailoring'
        }
    },

    'Mr. Clean': {
        DRYCLEANER_INTERIOR: {
            dialogue: [
                { speaker: 'Mr. Clean', text: "I've lost control of the piles" },
                { speaker: 'Player', text: "They seem pretty separated to me" },
                { speaker: 'Mr. Clean', text: "This is all my laundry, I was too focused on the business and forgot to do any of my own until now, and I have so many clothes." }
            ],
            unlocks: 'Promise'
        }
    },

    'Kayla': {
        DUNKIN_INTERIOR: {
            dialogue: [
                { speaker: 'Kayla', text: "Corporate says we're relocating, like espresso machines just walk themselves out." },
                { speaker: 'Player', text: "What'll you miss the most?" },
                { speaker: 'Kayla', text: "The sunrise choir of regulars. I'm turning them into a 'last shift' chorus." }
            ],
            unlocks: 'Last Call'
        }
    },

    'Elli': {
        FLOWER_SHOP_INTERIOR: {
            dialogue: [
                { speaker: 'Elli', text: "Petals have been wilting faster ever since the meeting about condos." },
                { speaker: 'Player', text: "Maybe the plaza's anxious too." },
                { speaker: 'Elli', text: "Maybe. I'm recording cooler fans and chimes so something beautiful blooms after we're gone." }
            ],
            unlocks: 'Bloom'
        }
    },

    'Pastor Ruth': {
        CHURCH_INTERIOR: {
            dialogue: [
                { speaker: 'Pastor Ruth', text: "We turned Thursday nights into listening circles. Change feels less heavy when the room sings." },
                { speaker: 'Player', text: "Need another synth player?" },
                { speaker: 'Pastor Ruth', text: "Always. Bring whatever memory you want preserved in these rafters." }
            ],
            unlocks: 'Long Goodbye'
        }
    },

    'Clara': {
        TOWNHALL_INTERIOR: {
            dialogue: [
                { speaker: 'Clara', text: "Tonight's agenda is supposed to be zoning, but everyone just wants to talk about the plaza." },
                { speaker: 'Player', text: "Any chance to stall the bulldozers?" },
                { speaker: 'Clara', text: "If we show why it matters. Songs, stories, packed rooms like this." }
            ],
            unlocks: 'Minutes'
        }
    },

    'June': {
        HOUSE_INTERIOR: {
            dialogue: [
                { speaker: 'June', text: "This parlor watched teenagers sneak out to that plaza for decades." },
                { speaker: 'Player', text: "You kept track?" },
                { speaker: 'June', text: "On camcorder tapes. I'm digitizing them for the farewell show—save me a verse." }
            ],
            unlocks: 'Scrapbook'
        }
    },

    'Nurse Mel': {
        HOSPITAL_INTERIOR: {
            dialogue: [
                { speaker: 'Nurse Mel', text: "Night shift's been extra quiet; people are processing the news." },
                { speaker: 'Player', text: "What do they say?" },
                { speaker: 'Nurse Mel', text: "That the plaza feels like home. I'm looping monitors and whispers into a comfort track." }
            ],
            unlocks: 'Nightshift'
        }
    },

    'Owen': {
        MODERN_INTERIOR: {
            dialogue: [
                { speaker: 'Owen', text: "Designed open offices, got empty echo chambers instead." },
                { speaker: 'Player', text: "What now?" },
                { speaker: 'Owen', text: "I convert printer squeals into bass lines. If we can't lease it, we'll at least sample it." }
            ],
            unlocks: 'Blueprints'
        }
    },

    'Harvey': {
        BRICK_INTERIOR: {
            dialogue: [
                { speaker: 'Harvey', text: "These bricks were salvaged from the mill. They deserve another chapter." },
                { speaker: 'Player', text: "What's your plan?" },
                { speaker: 'Harvey', text: "Archive every creak and echo on cassette, then layer it under a new melody." }
            ],
            unlocks: 'Bricks'
        }
    },

    'Customer': {
        SHOP_INTERIOR: {
            dialogue: [
                { speaker: 'Customer', text: "Came in for batteries, left remembering the first time I snuck out here." },
                { speaker: 'Player', text: "Everyone's feeling it." },
                { speaker: 'Customer', text: "Help me write 'Receipts & Reveries'? Every beep of that checkout is a beat." }
            ],
            unlocks: 'Memory'
        }
    },

    'Foreman Dee': {
        INDUSTRIAL_INTERIOR: {
            dialogue: [
                { speaker: 'Foreman Dee', text: "Developers measured the rafters but never heard the machine room harmony." },
                { speaker: 'Player', text: "You recorded it, right?" },
                { speaker: 'Foreman Dee', text: "Started tonight. When they swing the wrecking ball, this beat will be our protest." }
            ],
            unlocks: 'Whirring'
        }
    },

    'Caretaker Mo': {
        GRAVEYARD_INTERIOR: {
            dialogue: [
                { speaker: 'Caretaker Mo', text: "Even the mausoleum hears the rumors. Spirits get restless when plans change." },
                { speaker: 'Player', text: "Think music will calm them?" },
                { speaker: 'Caretaker Mo', text: "Already doing it. Wind through marble, footsteps on stone—I'll trade you the stems for a synth line." }
            ],
            unlocks: 'Watching'
        }
    }
};

// Track unlocked songs and conversation state
// Changed from Set to Map to store song metadata (NPC who unlocked it)
export let unlockedSongs = new Map(); // Map<songName, { unlockedBy: npcName }>
export let currentConversation = null;
export let conversationStep = 0;
export let conversationAtEnd = false;

// Track encountered items (items player has interacted with)
export let encounteredItems = new Set(); // Set of item names

// Load persisted state from localStorage
const loadPersistedState = () => {
    // Load unlocked songs
    try {
        const savedSongs = localStorage.getItem('suburbanAdventureUnlockedSongs');
        if (savedSongs) {
            const songsArray = JSON.parse(savedSongs);
            unlockedSongs = new Map(songsArray);
            console.log('Loaded unlocked songs from localStorage:', Array.from(unlockedSongs.keys()));
        }
    } catch (e) {
        console.warn('Failed to load unlocked songs from localStorage:', e);
    }
    
    // Load encountered items
    try {
        const savedItems = localStorage.getItem('suburbanAdventureEncounteredItems');
        if (savedItems) {
            const itemsArray = JSON.parse(savedItems);
            encounteredItems = new Set(itemsArray);
            console.log('Loaded encountered items from localStorage:', Array.from(encounteredItems));
        }
    } catch (e) {
        console.warn('Failed to load encountered items from localStorage:', e);
    }
};

// Save state to localStorage
const savePersistedState = () => {
    // Save unlocked songs (convert Map to array for JSON)
    try {
        const songsArray = Array.from(unlockedSongs.entries());
        localStorage.setItem('suburbanAdventureUnlockedSongs', JSON.stringify(songsArray));
    } catch (e) {
        console.warn('Failed to save unlocked songs to localStorage:', e);
    }
    
    // Save encountered items (convert Set to array for JSON)
    try {
        const itemsArray = Array.from(encounteredItems);
        localStorage.setItem('suburbanAdventureEncounteredItems', JSON.stringify(itemsArray));
    } catch (e) {
        console.warn('Failed to save encountered items to localStorage:', e);
    }
};

// Load state on module initialization
loadPersistedState();

// Function to start a conversation with an NPC
export const startConversation = (npcName, currentScene) => {
    // Check for group conversations first
    let conversationKey = npcName;
    let conversationData = conversations[npcName];
    
    // Handle group conversations
    if ((npcName === 'Alex' || npcName === 'Sam')) {
        conversationKey = 'Alex & Sam';
        conversationData = conversations['Alex & Sam'];
    } else if ((npcName === 'Jordan' || npcName === 'Riley')) {
        conversationKey = 'Jordan & Riley';
        conversationData = conversations['Jordan & Riley'];
    }
    
    if (conversationData && conversationData[currentScene]) {
        currentConversation = conversationData[currentScene];
        conversationStep = 0;
        conversationAtEnd = false;
        return true;
    }
    return false;
};

// Function to get the current dialogue line
export const getCurrentDialogue = () => {
    if (!currentConversation || conversationStep >= currentConversation.dialogue.length) {
        return null;
    }
    return currentConversation.dialogue[conversationStep];
};

// Function to advance the conversation
export const advanceConversation = () => {
    if (!currentConversation) return false;
    
    conversationStep++;
    
    // Check if conversation is complete
    if (conversationStep >= currentConversation.dialogue.length) {
        return false; // Conversation ended, but don't clear it yet
    }
    
    return true; // Conversation continues
};

// Function to get the current conversation's unlock value (without unlocking)
export const getCurrentConversationUnlock = () => {
    if (!currentConversation) return null;
    return currentConversation.unlocks || null;
};

// Function to check if a song is already unlocked
export const isSongUnlocked = (songName) => {
    return unlockedSongs.has(songName);
};

// Function to mark an item as encountered
export const markItemEncountered = (itemName) => {
    if (itemName) {
        // Check if already encountered
        const wasAlreadyEncountered = encounteredItems.has(itemName);
        
        // Add to set
        encounteredItems.add(itemName);
        savePersistedState(); // Persist to localStorage
        
        // Return the item name and whether it was newly encountered
        return { item: itemName, newlyEncountered: !wasAlreadyEncountered };
    }
    return null;
};

// Function to get encountered items
export const getEncounteredItems = () => {
    return Array.from(encounteredItems);
};

// Function to unlock the current conversation's song
// Now accepts optional npcName parameter to track who unlocked it
export const unlockCurrentSong = (npcName = null) => {
    if (!currentConversation) return null;
    
    if (currentConversation.unlocks) {
        const songName = currentConversation.unlocks;
        // Check if already unlocked
        const wasAlreadyUnlocked = unlockedSongs.has(songName);
        
        // Store song with metadata (NPC who unlocked it)
        unlockedSongs.set(songName, { unlockedBy: npcName || 'Unknown' });
        
        // Persist to localStorage
        savePersistedState();
        
        console.log('Unlocked songs:', Array.from(unlockedSongs.keys()));
        // Return the song name and whether it was newly unlocked
        return { song: songName, newlyUnlocked: !wasAlreadyUnlocked };
    }
    
    return null;
};

// Function to end the current conversation
export const endConversation = () => {
    currentConversation = null;
    conversationStep = 0;
    conversationAtEnd = false;
};

// Function to reset game progress (unlocked songs and items)
export const resetGameProgress = () => {
    // Clear unlocked songs
    unlockedSongs.clear();
    
    // Clear encountered items
    encounteredItems.clear();
    
    // Remove from localStorage
    try {
        localStorage.removeItem('suburbanAdventureUnlockedSongs');
        localStorage.removeItem('suburbanAdventureEncounteredItems');
        console.log('Game progress reset: cleared unlocked songs and items');
    } catch (e) {
        console.warn('Failed to remove game progress from localStorage:', e);
    }
};

// Function to check if there's an active conversation
export const hasActiveConversation = () => {
    return currentConversation !== null;
};

// Function to get unlocked songs
// Returns array of objects with song name and metadata
export const getUnlockedSongs = () => {
    return Array.from(unlockedSongs.entries()).map(([songName, metadata]) => ({
        name: songName,
        unlockedBy: metadata.unlockedBy
    }));
};

// Function to set conversation at end flag
export const setConversationAtEnd = (value) => {
    conversationAtEnd = value;
};

// Function to get conversation at end flag
export const getConversationAtEnd = () => {
    return conversationAtEnd;
};

// Function to check if we're at the last line of dialogue
export const checkIfLastLine = () => {
    if (!currentConversation) return false;
    return conversationStep === currentConversation.dialogue.length - 1;
};

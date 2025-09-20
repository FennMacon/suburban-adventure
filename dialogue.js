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
            unlocks: 'song_maya_urban_playlist'
        },
        FOREST_SUBURBAN: {
            dialogue: [
                { speaker: 'Maya', text: "This forest setting is so peaceful compared to the busy plaza. I love coming here to think." },
                { speaker: 'Player', text: "It does feel different here. More contemplative." },
                { speaker: 'Maya', text: "Exactly! I wrote this acoustic song sitting by these trees. It captures that quiet suburban forest vibe perfectly." }
            ],
            unlocks: 'song_maya_forest_acoustic'
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
            unlocks: 'song_jake_band_cover'
        },
        FOREST_SUBURBAN: {
            dialogue: [
                { speaker: 'Jake', text: "Man, this place reminds me of summer camp. So much quieter than downtown." },
                { speaker: 'Player', text: "Do you come here often?" },
                { speaker: 'Jake', text: "Yeah, when I need to escape the chaos. I actually recorded a song here using just forest sounds and my voice." }
            ],
            unlocks: 'song_jake_forest_sounds'
        }
    },

    'Tony': {
        PLAZA: {
            dialogue: [
                { speaker: 'Tony', text: "Hey there! Welcome to Tony's House of Pizza! I just bought this place and I'm making some big changes.You look like someone who appreciates the finer things in life." },
                { speaker: 'Player', text: "Cool, uh, can I get a slice?" },
                { speaker: 'Tony', text: "Oh, we don't do ordinary pizza here. I'm talking about our signature 'Diamond Crust Deluxe' - imported Italian truffles, gold leaf, and aged parmesan from a secret monastery." },
                { speaker: 'Player', text: "That sounds... expensive?" },
                { speaker: 'Tony', text: "Only $39.99! But wait, for just $4 more per slice, I'll throw in our 'Platinum Pepperoni' upgrade - but you gotta buy the whole pie!" },
                { speaker: 'Player', text: "What if I just want a regular slice..." },
                { speaker: 'Tony', text: "Regular? My friend, you're missing out on a once-in-a-lifetime culinary experience! Each slice is blessed by three different Italian grandmothers! It's a seven day process!" },
                { speaker: 'Player', text: "What happened to the people who used to work here?" },
                { speaker: 'Tony', text: "I had to get rid of them, they couldn't make the pizza fancy enough. We're an upscale boutique pizza place now." },
                { speaker: 'Player', text: "I think I'm good on pizza for now..." }
            ],
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
            unlocks: 'song_alex_sam_memories'
        },
        FOREST_SUBURBAN: {
            dialogue: [
                { speaker: 'Sam', text: "This old stone wall reminds me of my grandmother's property." },
                { speaker: 'Alex', text: "Yeah, classic New England vibes. Very different from the plaza scene." },
                { speaker: 'Player', text: "You both prefer it here?" },
                { speaker: 'Sam', text: "Sometimes. We wrote a folk song about these old stone walls and family history." }
            ],
            unlocks: 'song_alex_sam_stone_walls'
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
            unlocks: 'song_jordan_riley_plaza_drama'
        },
        FOREST_SUBURBAN: {
            dialogue: [
                { speaker: 'Riley', text: "I love how the trees create these little conversation nooks." },
                { speaker: 'Jordan', text: "Perfect for deep talks away from the plaza chaos." },
                { speaker: 'Player', text: "Do you two write music together?" },
                { speaker: 'Riley', text: "All the time! This setting inspired our most introspective piece yet." }
            ],
            unlocks: 'song_jordan_riley_forest_talks'
        }
    }
};

// Track unlocked songs and conversation state
export let unlockedSongs = new Set();
export let currentConversation = null;
export let conversationStep = 0;
export let conversationAtEnd = false;

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

// Function to unlock the current conversation's song
export const unlockCurrentSong = () => {
    if (!currentConversation) return null;
    
    if (currentConversation.unlocks) {
        unlockedSongs.add(currentConversation.unlocks);
        console.log('Unlocked songs:', Array.from(unlockedSongs));
        return currentConversation.unlocks;
    }
    
    return null;
};

// Function to end the current conversation
export const endConversation = () => {
    currentConversation = null;
    conversationStep = 0;
    conversationAtEnd = false;
};

// Function to check if there's an active conversation
export const hasActiveConversation = () => {
    return currentConversation !== null;
};

// Function to get unlocked songs
export const getUnlockedSongs = () => {
    return Array.from(unlockedSongs);
};

// Function to set conversation at end flag
export const setConversationAtEnd = (value) => {
    conversationAtEnd = value;
};

// Function to check if we're at the last line of dialogue
export const checkIfLastLine = () => {
    if (!currentConversation) return false;
    return conversationStep === currentConversation.dialogue.length - 1;
};

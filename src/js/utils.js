// src/js/utils.js

export function processAndAddItems(text, addPillCallback) {
    const ignoreList = new Set(['i', 'need', 'and', 'get', 'can', 'you', 'please', 'a', 'an', 'the', 'add', 'to', 'my', 'list', 'item', 'items', 'want', 'like', 'me']);
    const potentialItems = text.split(/, | /)
        .map(item => item.replace(/,$/, '').trim())
        .filter(item => item.length > 0 && !ignoreList.has(item.toLowerCase()));
    
    potentialItems.forEach(item => addPillCallback(item));
}

// You can add more utility functions here later, e.g., for local storage, date formatting, etc.
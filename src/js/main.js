// src/js/main.js

import { recommendations } from './data.js';
import { processAndAddItems } from './utils.js';

// --- DOM Element References ---
const inputView = document.getElementById('input-view');
const listView = document.getElementById('list-view');
const completionView = document.getElementById('completion-view');

const pillInputContainer = document.getElementById('pill-input-container');
const itemInput = document.getElementById('item-input');
const createListBtn = document.getElementById('create-list-btn');

const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

const recommendationModal = document.getElementById('recommendation-modal');
const modalXCloseBtn = document.getElementById('modal-x-close-btn');
const restartBtn = document.getElementById('restart-btn');

const micBtn = document.getElementById('mic-btn');
const micIcon = document.getElementById('mic-icon');

// --- App State ---
let items = []; // Holds the list of item names as strings (for pill input)
let shoppingList = []; // Holds the final list of objects {name, checked}
let checkedItems = 0;

// --- Speech Recognition Setup ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isRecognizing = false; // State to track if recognition is active

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1; // Get the most likely transcription

    micBtn.addEventListener('click', () => {
        if (isRecognizing) {
            recognition.stop();
        } else {
            // Clear previous results before starting
            recognition.start();
        }
    });

    recognition.onstart = () => { 
        isRecognizing = true; 
        micIcon.classList.add('text-blue-600'); 
        console.log('Speech recognition started.');
    };

    recognition.onend = () => { 
        isRecognizing = false; 
        micIcon.classList.remove('text-blue-600'); 
        console.log('Speech recognition ended.');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        console.log('Transcript:', transcript);
        processAndAddItems(transcript, addPill); // Pass addPill as callback
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isRecognizing = false;
        micIcon.classList.remove('text-blue-600');
        // Handle common errors like "not-allowed" (microphone permission)
        if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone permissions for this site in your browser settings.');
        } else if (event.error === 'no-speech') {
            console.log('No speech detected.');
        }
    };

} else {
    micBtn.style.display = 'none'; // Hide mic button if API not supported
    console.warn('Web Speech API not supported in this browser.');
}

// --- Event Listeners ---
itemInput.addEventListener('keydown', handleItemInput);
createListBtn.addEventListener('click', handleCreateList);
modalXCloseBtn.addEventListener('click', closeModal);
restartBtn.addEventListener('click', restartApp);

// --- Functions ---

function handleItemInput(e) {
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const text = itemInput.value.trim();
        if (text) {
            addPill(text);
            itemInput.value = '';
        }
    }
}

function addPill(text) {
    const normalizedText = text.toLowerCase();
    if (items.includes(normalizedText)) {
        return; // Prevent duplicate pills
    }
    items.push(normalizedText);

    const pill = document.createElement('div');
    pill.className = 'bg-blue-100 text-blue-800 text-sm font-semibold px-2.5 py-1 rounded-full flex items-center gap-2 fade-in';
    pill.innerHTML = `
        <span>${text}</span>
        <button class="remove-pill-btn bg-blue-200 hover:bg-blue-300 rounded-full w-4 h-4 flex items-center justify-center text-blue-800">&times;</button>
    `;
    
    pill.querySelector('.remove-pill-btn').addEventListener('click', () => {
        items = items.filter(item => item !== normalizedText);
        pill.remove();
        updateCreateListButtonState();
    });

    pillInputContainer.insertBefore(pill, itemInput);
    updateCreateListButtonState();
}

function updateCreateListButtonState() {
    createListBtn.disabled = items.length === 0;
}

function handleCreateList() {
    if (items.length === 0) return;

    shoppingList = items.map(name => ({ name, checked: false }));
    
    inputView.classList.add('hidden');
    listView.classList.remove('hidden');
    progressContainer.classList.remove('hidden');
    progressContainer.classList.add('flex'); // Ensure flex display
    
    renderShoppingList();
    updateProgress();
}

function renderShoppingList() {
    listView.innerHTML = ''; // Clear previous list
    shoppingList.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center justify-between transition-all duration-300 fade-in';
        itemEl.style.animationDelay = `${index * 50}ms`; // Stagger animation

        const recKey = Object.keys(recommendations).find(key => item.name.toLowerCase().includes(key));
        const hasRecommendation = !!recKey;
        
        const infoIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        const walmartIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z"/></svg>`;

        itemEl.innerHTML = `
            <div class="flex items-center space-x-4">
                <input type="checkbox" id="item-${index}" class="custom-checkbox" ${item.checked ? 'checked' : ''}>
                <label for="item-${index}" class="flex-grow cursor-pointer ${item.checked ? 'strikethrough' : ''}">
                    <span class="font-medium text-slate-800">${item.name.charAt(0).toUpperCase() + item.name.slice(1)}</span>
                    ${hasRecommendation ? '<p class="text-xs text-blue-600 font-semibold">Walmart recommended</p>' : ''}
                </label>
            </div>
            <button class="show-rec-btn text-slate-400 hover:text-blue-600 transition-colors" data-item-index="${index}">
                ${hasRecommendation ? walmartIcon : infoIcon}
            </button>
        `;
        itemEl.querySelector('input[type="checkbox"]').addEventListener('change', (e) => handleItemCheck(index, e.target.checked));
        itemEl.querySelector('.show-rec-btn').addEventListener('click', (e) => showRecommendation(parseInt(e.currentTarget.dataset.itemIndex, 10)));
        listView.appendChild(itemEl);
    });
}

function handleItemCheck(index, isChecked) {
    shoppingList[index].checked = isChecked;
    // Update the actual checkbox element and label class
    const checkbox = document.getElementById(`item-${index}`);
    if (checkbox) checkbox.checked = isChecked; // Ensure the UI state matches
    
    const label = document.querySelector(`label[for="item-${index}"]`);
    if (label) {
        isChecked ? label.classList.add('strikethrough') : label.classList.remove('strikethrough');
    }
    
    updateProgress();
    
    if (shoppingList.every(item => item.checked)) {
        setTimeout(() => {
            listView.classList.add('hidden');
            progressContainer.classList.add('hidden');
            completionView.classList.remove('hidden');
            completionView.querySelector('.fade-in').classList.add('fade-in'); // Trigger animation
        }, 800); // Short delay for smoother transition
    }
}

function updateProgress() {
    const totalItems = shoppingList.length;
    checkedItems = shoppingList.filter(item => item.checked).length;
    const percentage = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${checkedItems}/${totalItems}`;
}

function showRecommendation(index) {
    const modalContent = document.getElementById('modal-content');
    const item = shoppingList[index];
    const key = Object.keys(recommendations).find(k => item.name.toLowerCase().includes(k));
    
    let contentHTML = '';
    
    if (key) {
        const rec = recommendations[key];
        contentHTML = `
            <img src="${rec.image}" alt="${rec.name}" class="w-24 h-24 mx-auto rounded-lg mb-4 border border-slate-200 object-cover">
            <h3 class="text-lg font-bold text-slate-800">${rec.name}</h3>
            <p class="text-sm text-slate-600 mt-2">${rec.description}</p>
            <div class="mt-4 bg-slate-100 p-3 rounded-lg text-left">
                <p class="font-semibold text-slate-700">Location:</p>
                <p class="text-sm text-slate-600">Shelf: ${rec.shelf}, Row: ${rec.row}</p>
            </div>
        `;
    } else {
        const shelf = Math.floor(Math.random() * 15) + 1;
        const row = Math.floor(Math.random() * 5) + 1;
        contentHTML = `
            <div class="w-24 h-24 mx-auto rounded-lg mb-4 border border-slate-200 bg-slate-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <h3 class="text-lg font-bold text-slate-800">${item.name.charAt(0).toUpperCase() + item.name.slice(1)}</h3>
            <div class="mt-4 bg-slate-100 p-3 rounded-lg text-left">
                <p class="font-semibold text-slate-700">Location:</p>
                <p class="text-sm text-slate-600">Shelf: ${shelf}, Row: ${row}</p>
            </div>
        `;
    }

    contentHTML += `<button id="add-to-basket-btn" class="mt-6 w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors">Add to Basket</button>`;
    
    modalContent.innerHTML = contentHTML;

    document.getElementById('add-to-basket-btn').addEventListener('click', () => {
        handleItemCheck(index, true); // Mark as checked
        closeModal();
    });

    recommendationModal.classList.remove('hidden');
    recommendationModal.classList.add('flex');
    setTimeout(() => {
        recommendationModal.querySelector('.transform').classList.remove('scale-95', 'opacity-0');
    }, 10); // Small delay to allow CSS transition
}

function closeModal() {
    // Add transition classes back for closing animation
    recommendationModal.querySelector('.transform').classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        recommendationModal.classList.add('hidden');
        recommendationModal.classList.remove('flex');
    }, 200); // Match CSS transition duration
}

function restartApp() {
    items = [];
    shoppingList = [];
    checkedItems = 0;
    
    // Remove all existing pills
    const pills = pillInputContainer.querySelectorAll('.bg-blue-100');
    pills.forEach(p => p.remove());
    itemInput.value = ''; // Clear input field

    completionView.classList.add('hidden');
    listView.classList.add('hidden'); // Ensure list view is hidden
    inputView.classList.remove('hidden'); // Show input view
    progressContainer.classList.add('hidden'); // Hide progress
    
    updateCreateListButtonState(); // Disable button initially
    updateProgress(); // Reset progress bar
}

// Initial setup on load
document.addEventListener('DOMContentLoaded', updateCreateListButtonState);
let currentWeather = {
    temp: '',
    location: '',
    description: '',
    humidity: ''
};

// Load recent searches from LocalStorage
function loadRecentSearches() {
    const searches = JSON.parse(localStorage.getItem('recentWeatherSearches')) || [];
    const recentSearchesDiv = document.getElementById('recentSearches');
    recentSearchesDiv.innerHTML = '';
    searches.forEach(search => {
        const p = document.createElement('p');
        p.className = 'mb-1 small';
        p.textContent = `${search.location} - ${search.temp} (${new Date(search.timestamp).toLocaleTimeString()})`;
        recentSearchesDiv.appendChild(p);
    });
}

// Save to LocalStorage
function saveRecentSearch(weather) {
    const searches = JSON.parse(localStorage.getItem('recentWeatherSearches')) || [];
    searches.unshift({ ...weather, timestamp: Date.now() });
    if (searches.length > 5) searches.pop();
    localStorage.setItem('recentWeatherSearches', JSON.stringify(searches));
    loadRecentSearches();
}

// Update weather display
function updateWeatherDisplay(data) {
    currentWeather = {
        temp: `${data.main.temp}°C`,
        location: data.name,
        description: data.weather[0].description,
        humidity: `${data.main.humidity}%`
    };

    document.getElementById('location').textContent = `Location: ${currentWeather.location}`;
    document.getElementById('temperature').textContent = `Temperature: ${currentWeather.temp}`;
    document.getElementById('description').textContent = `Condition: ${currentWeather.description}`;
    document.getElementById('humidity').textContent = `Humidity: ${currentWeather.humidity}`;

    const weatherMain = data.weather[0].main;
    const emoji = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Snow': '❄️',
        'Thunderstorm': '⛈️',
        'Mist': '🌫️'
    }[weatherMain] || '⛅';
    document.querySelector('.weather-emoji').textContent = emoji;

    saveRecentSearch(currentWeather);
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon) {
    const apiKey = 'YOUR API KEY'; // Replace with your OpenWeatherMap API key
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        updateWeatherDisplay(data);
    } catch (error) {
        console.error('Error fetching weather:', error);
        alert('Error fetching weather data');
    }
}

// Get weather by city name
async function getWeatherByCity(city) {
    const apiKey = 'YOUR API KEY'; // Replace with your OpenWeatherMap API key
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        updateWeatherDisplay(data);
    } catch (error) {
        console.error('Error fetching weather:', error);
        alert('Location not found or error occurred');
    }
}

// Initial weather load using geolocation
function initWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            getWeatherByCoords(position.coords.latitude, position.coords.longitude);
        }, () => {
            alert('Location access denied. Please search manually.');
        });
    }
}

// Search weather function
function searchWeather() {
    const city = document.getElementById('searchInput').value.trim();
    if (city) {
        getWeatherByCity(city);
        document.getElementById('searchInput').value = '';
    }
}

// Chatbot functionality
const chatBtn = document.querySelector('.chat-btn');
const chatContainer = document.querySelector('.chat-container');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');

chatBtn.addEventListener('click', () => {
    chatContainer.style.display = chatContainer.style.display === 'block' ? 'none' : 'block';
});

const typingIndicator = document.createElement('div');
typingIndicator.classList.add('typing-indicator');
typingIndicator.innerHTML = '<span></span><span></span><span></span>';

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    const userMsg = document.createElement('div');
    userMsg.classList.add('message', 'user-message');
    userMsg.textContent = message;
    chatMessages.appendChild(userMsg);

    chatMessages.appendChild(typingIndicator);
    typingIndicator.style.display = 'block';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const geminiApiKey = 'YOUR GEMINI API KEY'; // Replace with your Gemini API key
    const weatherDetails = `Temperature: ${currentWeather.temp}, Location: ${currentWeather.location}, Condition: ${currentWeather.description}, Humidity: ${currentWeather.humidity}`;
    const prompt = `Based on the current temperature ${weatherDetails} ${message}`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;

        typingIndicator.style.display = 'none';
        const aiMsg = document.createElement('div');
        aiMsg.classList.add('message', 'ai-message');
        aiMsg.textContent = aiResponse;
        chatMessages.appendChild(aiMsg);
    } catch (error) {
        console.error('Error with Gemini API:', error);
        typingIndicator.style.display = 'none';
        const aiMsg = document.createElement('div');
        aiMsg.classList.add('message', 'ai-message');
        aiMsg.textContent = 'Sorry, I encountered an error. Please try again!';
        chatMessages.appendChild(aiMsg);
    }

    messageInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});

// Initialize
initWeather();
loadRecentSearches();

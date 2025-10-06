// API 
const RAWG_API_KEY = '458bd41eae7545c19a6c8116ab568d15';
const YOUTUBE_API_KEY = 'AIzaSyDLImrPt7ve-vwxDuQBDjlsPxrmSQcD03A';
const RAWG_BASE_URL = 'https://api.rawg.io/api';
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

let currentGames = [];

// loading 
document.addEventListener('DOMContentLoaded', () => {
    fetchGames();
    setupEventListeners();
    setupScrollAnimations();
});

// event listener
function setupEventListeners() {
    // search
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchGames(e.target.value);
        }
    });

    // search button
    const searchBtn = document.getElementById('searchBtn');
    searchBtn.addEventListener('click', () => {
        const searchTerm = searchInput.value;
        searchGames(searchTerm);
    });

    // filter
    document.getElementById('platformFilter').addEventListener('change', () => {
        fetchGames();
    });

    document.getElementById('ratingFilter').addEventListener('change', () => {
        fetchGames();
    });

    // close detail page with esc key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const detailPage = document.getElementById('detailPage');
            if (detailPage.classList.contains('active')) {
                hideGameDetail();
            }
        }
    });
}

// scroll animation
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.game-card, .filter-select');
    animateElements.forEach(el => observer.observe(el));
}

// fetch games
async function fetchGames() {
    showLoading(true);
    const platform = document.getElementById('platformFilter').value;
    const rating = document.getElementById('ratingFilter').value;

    let url = `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&page_size=12`;
    
    if (platform) {
        url += `&platforms=${platform}`;
    }
    
    if (rating) {
        url += `&metacritic=${Math.round(parseFloat(rating) * 20)},100`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        currentGames = data.results || [];
        displayGames(currentGames);
        setTimeout(() => {
            setupScrollAnimations();
        }, 100);
    } catch (error) {
        console.error('Failed to fetch games:', error);
        showError('Failed to load games. Please try again.');
    } finally {
        showLoading(false);
    }
}

// search games
async function searchGames(term) {
    if (!term.trim()) {
        fetchGames();
        return;
    }

    showLoading(true);
    const url = `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(term)}&page_size=12`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        currentGames = data.results || [];
        displayGames(currentGames);
        
        // search results title
        const sectionTitle = document.querySelector('.section-title');
        if (sectionTitle) {
            sectionTitle.textContent = `Search Results for "${term}"`;
        }
        
        setTimeout(() => {
            setupScrollAnimations();
        }, 100);
    } catch (error) {
        console.error('Search failed:', error);
        showError('Search failed. Please try again.');
    } finally {
        showLoading(false);
    }
}

// game grid
function displayGames(games) {
    const grid = document.getElementById('gamesGrid');
    grid.innerHTML = '';

    if (games.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--color-text-muted);">
                <p style="font-size: 1.5rem; margin-bottom: 1rem;">😕 No games found</p>
                <p>Try adjusting your filters or search terms</p>
            </div>
        `;
        return;
    }

    games.forEach((game, index) => {
        const card = createGameCard(game, index);
        grid.appendChild(card);
    });
}

// Gamecard 
function createGameCard(game, index) {
    const card = document.createElement('article');
    card.className = 'game-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${game.name} - Click to view details`);
    const showDetail = () => showGameDetail(game);
    card.onclick = showDetail;
    card.onkeypress = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            showDetail();
        }
    };

    const platforms = game.platforms ? game.platforms.slice(0, 3).map(p => p.platform.name) : [];
    const genres = game.genres ? game.genres.slice(0, 2) : [];
    const imageSrc = game.background_image || 'https://via.placeholder.com/400x300?text=No+Image';

    card.innerHTML = `
        <img 
            src="${imageSrc}" 
            alt="${game.name} cover image" 
            class="game-image"
            loading="lazy">
        <div class="game-info">
            <h3 class="game-title">${escapeHtml(game.name)}</h3>
            ${platforms.length > 0 ? `
                <div class="platforms" role="list" aria-label="Available platforms">
                    ${platforms.map(p => `<span class="platform-tag" role="listitem">${escapeHtml(p)}</span>`).join('')}
                </div>
            ` : ''}
            ${game.rating > 0 ? `
                <div class="rating" role="img" aria-label="Rating: ${game.rating.toFixed(1)} out of 5 stars">
                    <div class="stars" aria-hidden="true">${renderStars(game.rating)}</div>
                    <span class="rating-value">${game.rating.toFixed(1)}</span>
                </div>
            ` : ''}
            ${genres.length > 0 ? `
                <div class="genres" role="list" aria-label="Game genres">
                    ${genres.map(g => `<span class="genre-tag" role="listitem">${escapeHtml(g.name)}</span>`).join('')}
                </div>
            ` : ''}
            <button 
                class="view-details-btn" 
                aria-label="View details for ${game.name}">
                View Details
            </button>
        </div>
    `;

    return card;
}

// rating stars
function renderStars(rating) {
    const stars = Math.round(rating);
    let html = '';
    for (let i = 0; i < 5; i++) {
        html += `<span class="star ${i < stars ? '' : 'empty'}">★</span>`;
    }
    return html;
}
// escape html
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// search YouTube video
async function searchYouTubeVideo(gameName) {
    try {
        const searchQuery = `${gameName} official trailer gameplay`;
        const url = `${YOUTUBE_BASE_URL}/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            return data.items[0].id.videoId;
        }
        return null;
    } catch (error) {
        console.error('Failed to search YouTube video:', error);
        return null;
    }
}

// show game detail
async function showGameDetail(game) {
    showLoading(true);
    
    try {
        const response = await fetch(`${RAWG_BASE_URL}/games/${game.id}?key=${RAWG_API_KEY}`);
        const details = await response.json();
        
        const detailPage = document.getElementById('detailPage');
        const homePage = document.getElementById('homePage');
        
        const imageSrc = details.background_image || game.background_image || 'https://via.placeholder.com/1200x500?text=No+Image';
        
        detailPage.innerHTML = `
            <div class="detail-hero">
                <img 
                    src="${imageSrc}" 
                    alt="${escapeHtml(game.name)} hero image" 
                    class="detail-hero-image">
                <div class="detail-hero-overlay"></div>
                <button 
                    class="back-btn" 
                    onclick="hideGameDetail()"
                    aria-label="Go back to games list">
                    ← Back
                </button>
            </div>
            <div class="detail-content">
                <article class="detail-card">
                    <h1 id="gameTitle" class="detail-title">${escapeHtml(game.name)}</h1>
                    ${game.platforms ? `
                        <div class="detail-platforms" role="list" aria-label="Available platforms">
                            ${game.platforms.map(p => `
                                <span class="detail-platform-tag" role="listitem">${escapeHtml(p.platform.name)}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                    <div class="detail-grid">
                        <section class="detail-section">
                            <h3>Rating</h3>
                            <div class="detail-rating" role="img" aria-label="Rating: ${game.rating.toFixed(1)} out of 5 stars">
                                <div class="detail-stars" aria-hidden="true">${renderStars(game.rating)}</div>
                                <span class="detail-rating-value">${game.rating.toFixed(1)}</span>
                            </div>
                            ${details.metacritic ? `<p>Metacritic: ${details.metacritic}/100</p>` : ''}
                        </section>
                        <section class="detail-section">
                            <h3>Genres</h3>
                            <div class="detail-genres" role="list" aria-label="Game genres">
                                ${game.genres ? game.genres.map(g => `
                                    <span class="detail-genre-tag" role="listitem">${escapeHtml(g.name)}</span>
                                `).join('') : '<p>No genres available</p>'}
                            </div>
                        </section>
                    </div>
                    
                    <section class="video-section" aria-label="Game videos">
                        <h3> Trailers & Gameplay</h3>
                        <div 
                            id="videoContainer" 
                            class="video-container"
                            role="region"
                            aria-label="Video player">
                            <div class="video-loading" role="status" aria-live="polite">
                                <div class="spinner"></div>
                                <span class="visually-hidden">Loading video...</span>
                            </div>
                        </div>
                    </section>
                    
                    ${details.description_raw ? `
                        <section class="detail-section" style="margin-top: 2rem;">
                            <h3>About This Game</h3>
                            <p class="detail-description">${escapeHtml(details.description_raw)}</p>
                        </section>
                    ` : ''}
                    <section class="detail-info">
                        ${details.released ? `
                            <h3>Release Date</h3>
                            <p>${details.released}</p>
                        ` : ''}
                        ${details.developers && details.developers.length > 0 ? `
                            <h3>Developers</h3>
                            <p>${details.developers.map(d => escapeHtml(d.name)).join(', ')}</p>
                        ` : ''}
                        ${details.publishers && details.publishers.length > 0 ? `
                            <h3>Publishers</h3>
                            <p>${details.publishers.map(p => escapeHtml(p.name)).join(', ')}</p>
                        ` : ''}
                    </section>
                </article>
            </div>
        `;
        
        homePage.style.display = 'none';
        detailPage.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        detailPage.setAttribute('tabindex', '-1');
        detailPage.focus();
        
        // load video
        loadGameVideo(game.name);
        
    } catch (error) {
        console.error('Failed to fetch game details:', error);
        showError('Failed to load game details. Please try again.');
    } finally {
        showLoading(false);
    }
}

async function loadGameVideo(gameName) {
    const videoContainer = document.getElementById('videoContainer');
    
    try {
        const videoId = await searchYouTubeVideo(gameName);
        
        if (videoId) {
            videoContainer.innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1"
                    title="${escapeHtml(gameName)} gameplay video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                    loading="lazy">
                </iframe>
            `;
        } else {
            videoContainer.innerHTML = `
                <div class="video-error" role="alert">
                    <p>😕 No related videos available</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to load video:', error);
        videoContainer.innerHTML = `
            <div class="video-error" role="alert">
                <p>😕 Failed to load video</p>
            </div>
        `;
    }
}

// hide game detail
function hideGameDetail() {
    const homePage = document.getElementById('homePage');
    const detailPage = document.getElementById('detailPage');
    
    homePage.style.display = 'block';
    detailPage.classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // return focus to search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.focus();
    }
}

// show loading
function showLoading(show) {
    const loading = document.getElementById('loading');
    const grid = document.getElementById('gamesGrid');
    
    if (show) {
        loading.style.display = 'flex';
        loading.setAttribute('aria-busy', 'true');
        grid.style.opacity = '0.5';
    } else {
        loading.style.display = 'none';
        loading.setAttribute('aria-busy', 'false');
        grid.style.opacity = '1';
        grid.style.display = 'grid';
    }
}

// show error
function showError(message) {
    const grid = document.getElementById('gamesGrid');
    grid.innerHTML = `
        <div 
            role="alert"
            style="grid-column: 1/-1; text-align: center; padding: 4rem; 
                   background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-lg); 
                   border: 2px solid rgba(239, 68, 68, 0.3);">
            <p style="font-size: 1.5rem; margin-bottom: 1rem; color: #fca5a5;">⚠️ Error</p>
            <p style="color: var(--color-text-secondary);">${escapeHtml(message)}</p>
        </div>
    `;
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedSearch = debounce((term) => {
    if (term.length >= 2) {
        searchGames(term);
    }
}, 500);

document.getElementById('searchInput')?.addEventListener('input', (e) => {
    const term = e.target.value;
    if (term.length >= 2) {
        
    }
});
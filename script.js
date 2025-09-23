document.addEventListener('DOMContentLoaded', () => {
    // The 'API_KEY' variable will be available from the 'config.js' file you created.
    const TMDb = {
        baseURL: 'https://api.themoviedb.org/3/',
        imageBaseURL: 'https://image.tmdb.org/t/p/',
    };

    let state = {
        collections: {},
        watchlist: [],
        watched: [],
        ratings: {}
    };

    const searchInput = document.querySelector('#searchform input');
    const form = document.querySelector('#searchform');
    const resultsGrid = document.querySelector('#results-grid');
    const modalOverlay = document.querySelector('#modal-overlay');
    const modalContent = document.querySelector('#modal-content');
    const modalCloseBtn = document.querySelector('#modal-close-btn');
    const recommendationsGrid = document.querySelector('#recommendations-grid');
    const recommendationsSection = document.querySelector('#recommendations-section');
    const collectionsListEl = document.querySelector('#collections-list');
    const newCollectionForm = document.querySelector('#new-collection-form');
    const btnToggleNewCollection = document.querySelector('#btn-toggle-new-collection');
    const watchlistEl = document.querySelector('#watchlist');
    const watchedListEl = document.querySelector('#watched-list');

    const debounce = (func, delay = 500) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(null, args);
            }, delay);
        };
    };
    
    const showToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('visible');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, 2500);
    };

    const performSearch = async (searchTerm) => {
        if (!searchTerm) {
            displayHomePageContent();
            return;
        }
        resultsGrid.innerHTML = `<p class="message">Searching...</p>`;
        try {
            const personUrl = `${TMDb.baseURL}search/person?api_key=${API_KEY}&query=${encodeURIComponent(searchTerm)}`;
            const personRes = await axios.get(personUrl);
            const relevantPerson = personRes.data.results.find(p => p.known_for_department === "Acting" || p.known_for_department === "Directing");
            if (relevantPerson) {
                const creditsUrl = `${TMDb.baseURL}person/${relevantPerson.id}/combined_credits?api_key=${API_KEY}`;
                const creditsRes = await axios.get(creditsUrl);
                displayResults(creditsRes.data.cast, `for ${relevantPerson.name}`);
            } else {
                const multiUrl = `${TMDb.baseURL}search/multi?api_key=${API_KEY}&query=${encodeURIComponent(searchTerm)}&include_adult=true&region=IN&language=en-US,hi-IN`;
                const multiRes = await axios.get(multiUrl);
                displayResults(multiRes.data.results, `for "${searchTerm}"`);
            }
        } catch (error) {
            resultsGrid.innerHTML = `<p class="message">Error fetching data.</p>`;
        }
    };

    const displayHomePageContent = async () => {
        resultsGrid.innerHTML = `<p class="message">Loading recommendations...</p>`;
        const hasHistory = state.watched.length > 0 || state.watchlist.length > 0;
        try {
            if (hasHistory) {
                const lastWatched = state.watched[state.watched.length - 1];
                const lastWatchlist = state.watchlist[state.watchlist.length - 1];
                const seedItem = lastWatched || lastWatchlist;
                const url = `${TMDb.baseURL}${seedItem.type}/${seedItem.id}/recommendations?api_key=${API_KEY}`;
                const res = await axios.get(url);
                displayResults(res.data.results.slice(0, 10), `Based on your interest in "${seedItem.name}"`);
            } else {
                const url = `${TMDb.baseURL}trending/all/week?api_key=${API_KEY}&region=IN`;
                const res = await axios.get(url);
                displayResults(res.data.results.slice(0, 10), "Trending This Week");
            }
        } catch (error) {
            resultsGrid.innerHTML = `<p class="message">Could not load recommendations at this time.</p>`;
        }
    };

    const displayResults = (mediaItems, queryText) => {
        resultsGrid.innerHTML = '';
        const validItems = mediaItems.filter(item => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'));
        const heading = document.createElement('h2');
        heading.className = 'grid-heading';
        heading.textContent = queryText;
        resultsGrid.appendChild(heading);
        if (validItems.length === 0) {
            resultsGrid.innerHTML += `<p class="message">No results found.</p>`;
            return;
        }
        validItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'show-card';
            card.innerHTML = `<img src="${TMDb.imageBaseURL}w500${item.poster_path}" alt="${item.title || item.name}">`;
            card.addEventListener('click', () => openModal(item));
            resultsGrid.appendChild(card);
        });
    };
    
    const displayCollectionItems = (collectionName) => {
        const items = state.collections[collectionName] || [];
        displayResults(items, `Collection: ${collectionName}`);
    };

    const renderAllLists = () => {
        renderCollections();
        renderWatchlist();
        renderWatchedList();
    };

    const renderCollections = () => {
        collectionsListEl.innerHTML = Object.keys(state.collections).sort().map(name => `
            <li data-name="${name}">
                <span class="collection-name-span" data-name="${name}">${name}</span>
                <div class="collection-item-controls">
                    <button class="btn-edit-collection" data-collection="${name}" title="Rename"><i class="fas fa-pencil-alt"></i></button>
                    <button class="btn-delete-collection" data-collection="${name}" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            </li>`).join('');
    };

    const renderWatchlist = () => {
        watchlistEl.innerHTML = state.watchlist.map(s => `<li data-id="${s.id}" data-type="${s.type}">${s.name}</li>`).join('');
    };
    
    const renderWatchedList = () => {
        watchedListEl.innerHTML = state.watched.map(s => `<li data-id="${s.id}" data-type="${s.type}">${s.name}</li>`).join('');
    };

    const openModal = async (item) => {
        try {
            const detailUrl = `${TMDb.baseURL}${item.media_type}/${item.id}?api_key=${API_KEY}`;
            const details = (await axios.get(detailUrl)).data;
            const title = details.title || details.name;
            const releaseDate = details.release_date || details.first_air_date || '';
            const summary = details.overview || "No summary available.";
            const posterPath = details.poster_path ? `${TMDb.imageBaseURL}w500${details.poster_path}` : 'https://via.placeholder.com/500x750';
            const genres = details.genres ? details.genres.map(g => g.name).join(', ') : 'N/A';
            const itemForState = { id: details.id, name: title, type: item.media_type || (details.title ? 'movie' : 'tv'), media_type: item.media_type || (details.title ? 'movie' : 'tv'), poster_path: details.poster_path };
            modalContent.innerHTML = `
                <div class="modal-poster"><img src="${posterPath}" alt="${title}"></div>
                <div class="modal-info">
                    <h2>${title}</h2>
                    <div class="modal-meta">
                        <span>${releaseDate ? releaseDate.substring(0, 4) : 'N/A'}</span>
                        <span>&bull;</span>
                        <span>${genres}</span>
                        <span>&bull;</span>
                        <span class="status-${details.status ? details.status.toLowerCase() : ''}">${details.status || item.media_type}</span>
                    </div>
                    <p class="modal-summary">${summary}</p>
                    <div class="modal-actions">
                        <button class="btn" id="save-btn"><i class="fas fa-layer-group"></i> Manage Collections</button>
                        <button class="btn" id="watch-btn"><i class="fas fa-bookmark"></i> Add to Watchlist</button>
                        <button class="btn" id="watched-btn"><i class="fas fa-check-circle"></i> Mark as Watched</button>
                    </div>
                    <div class="star-rating" id="star-rating" style="display:none;">
                        ${[...Array(5)].map((_, i) => `<i class="fas fa-star" data-value="${i + 1}"></i>`).join('')}
                    </div>
                    <div id="collections-panel-container"></div>
                    <div class="modal-links">
                         <a href="https://www.google.com/search?q=${encodeURIComponent(title)}+subtitles" target="_blank">Find Subtitles</a>
                         ${details.homepage ? `<a href="${details.homepage}" target="_blank">Official Page</a>` : ''}
                         ${details.imdb_id ? `<a href="https://www.imdb.com/title/${details.imdb_id}" target="_blank">IMDb Page</a>` : ''}
                    </div>
                </div>`;

            // THIS IS THE FIX: Store the current item's data on the modal info element
            modalContent.querySelector('.modal-info').dataset.currentItem = JSON.stringify(itemForState);

            updateModalButtons(itemForState);
            modalOverlay.classList.add('visible');
            document.getElementById('save-btn').addEventListener('click', () => renderCollectionsPanel(itemForState));
            document.getElementById('watch-btn').addEventListener('click', () => toggleWatchlist(itemForState));
            document.getElementById('watched-btn').addEventListener('click', () => toggleWatched(itemForState));
            document.querySelectorAll('.star-rating .fa-star').forEach(star => {
                star.addEventListener('click', () => setRating(itemForState.id, star.dataset.value));
            });
            getRecommendations(itemForState.media_type, itemForState.id);
        } catch (error) {
            console.error("Failed to open modal:", error);
            alert("Could not load details for this item.");
        }
    };

    const getRecommendations = async (mediaType, mediaId) => {
        recommendationsGrid.innerHTML = '';
        recommendationsSection.classList.remove('visible');
        if (!mediaType || !mediaId) return;
        try {
            const url = `${TMDb.baseURL}${mediaType}/${mediaId}/recommendations?api_key=${API_KEY}`;
            const res = await axios.get(url);
            const recommendations = res.data.results.slice(0, 3);
            if (recommendations.length > 0) {
                recommendationsSection.classList.add('visible');
                recommendations.forEach(rec => {
                    if (rec.poster_path) {
                        const recCard = document.createElement('div');
                        recCard.className = 'rec-card';
                        recCard.innerHTML = `<img src="${TMDb.imageBaseURL}w300${rec.poster_path}" alt="${rec.title || rec.name}">`;
                        recCard.addEventListener('click', () => {
                            closeModal();
                            setTimeout(() => openModal(rec), 300);
                        });
                        recommendationsGrid.appendChild(recCard);
                    }
                });
            }
        } catch (error) {
            console.error("Could not fetch recommendations:", error);
        }
    };

    const closeModal = () => { modalOverlay.classList.remove('visible'); };
    const updateModalButtons = (item) => {
        const itemId = item.id;
        const isWatch = state.watchlist.some(s => s.id === itemId);
        const isWatched = state.watched.some(s => s.id === itemId);
        const watchBtn = document.getElementById('watch-btn');
        const watchedBtn = document.getElementById('watched-btn');
        const starRatingDiv = document.getElementById('star-rating');
        watchBtn.classList.toggle('active', isWatch);
        watchBtn.innerHTML = isWatch ? '<i class="fas fa-minus-circle"></i> In Watchlist' : '<i class="fas fa-bookmark"></i> Add to Watchlist';
        watchedBtn.classList.toggle('active', isWatched);
        watchedBtn.innerHTML = isWatched ? '<i class="far fa-check-circle"></i> Watched' : '<i class="fas fa-check-circle"></i> Mark as Watched';
        if (isWatched) {
            starRatingDiv.style.display = 'block';
            updateStars(itemId);
        } else {
            starRatingDiv.style.display = 'none';
        }
    };

    const renderCollectionsPanel = (itemToSave) => {
        const container = document.getElementById('collections-panel-container');
        const collectionNames = Object.keys(state.collections).sort();
        const listHTML = collectionNames.length > 0 ? collectionNames.map(name => {
            const isInCollection = state.collections[name].some(i => i.id === itemToSave.id);
            const btnClass = isInCollection ? 'collection-remove-btn' : 'collection-add-btn';
            const btnText = isInCollection ? '- Remove' : '+ Add';
            return `<li>
                        <span>${name}</span>
                        <button class="${btnClass} collection-action-btn" data-collection="${name}">${btnText}</button>
                    </li>`;
        }).join('') : '<li>No collections yet. Create one in the sidebar!</li>';
        
        container.innerHTML = `<div class="collections-panel"><h4>Save to...</h4><ul>${listHTML}</ul></div>`;
        
        if (container.style.display === 'block') {
            container.style.display = 'none';
        } else {
            container.style.display = 'block';
        }
    };

    document.querySelector('.modal').addEventListener('click', (e) => {
        if (e.target.classList.contains('collection-action-btn')) {
            const button = e.target;
            const collectionName = button.dataset.collection;
            const modalInfo = document.querySelector('.modal-info');
            const item = JSON.parse(modalInfo.dataset.currentItem);
            
            if (button.classList.contains('collection-add-btn')) {
                addItemToCollection(collectionName, item);
                showToast(`Added to "${collectionName}"`);
            } else {
                removeItemFromCollection(collectionName, item.id);
                showToast(`Removed from "${collectionName}"`);
            }
            renderCollectionsPanel(item); // Re-render to update the button
        }
    });

    const createCollection = (name) => {
        if (state.collections[name]) {
            alert('A collection with this name already exists.');
            return;
        }
        state.collections[name] = [];
        saveState();
        renderAllLists();
    };

    const editCollectionName = (oldName, liElement) => {
        const span = liElement.querySelector('.collection-name-span');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = oldName;
        input.className = 'collection-name-input';
        const saveName = () => {
            const newName = input.value.trim();
            if (newName && newName !== oldName) {
                if (state.collections[newName]) {
                    alert('A collection with this name already exists.');
                    renderAllLists();
                } else {
                    updateCollectionName(oldName, newName);
                }
            } else {
                renderAllLists();
            }
        };
        input.addEventListener('blur', saveName);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') renderAllLists();
        });
        span.replaceWith(input);
        input.focus();
    };

    const updateCollectionName = (oldName, newName) => {
        state.collections[newName] = state.collections[oldName];
        delete state.collections[oldName];
        saveState();
        renderAllLists();
    };

    const deleteCollection = (name) => {
        delete state.collections[name];
        saveState();
        renderAllLists();
        displayHomePageContent();
    };

    const addItemToCollection = (collectionName, item) => {
        const collection = state.collections[collectionName];
        if (collection && !collection.some(i => i.id === item.id)) {
            collection.push(item);
            saveState();
        }
    };

    const removeItemFromCollection = (collectionName, itemId) => {
        const collection = state.collections[collectionName];
        if (collection) {
            state.collections[collectionName] = collection.filter(i => i.id !== itemId);
            saveState();
        }
    };

    const toggleWatchlist = (item) => {
        const index = state.watchlist.findIndex(s => s.id === item.id);
        if (index > -1) {
            state.watchlist.splice(index, 1);
        } else {
            state.watchlist.push(item);
            state.watched = state.watched.filter(s => s.id !== item.id);
        }
        saveState();
        renderAllLists();
        updateModalButtons(item);
    };

    const toggleWatched = (item) => {
        const index = state.watched.findIndex(s => s.id === item.id);
        if (index > -1) {
            state.watched.splice(index, 1);
            delete state.ratings[item.id];
        } else {
            state.watched.push(item);
            state.watchlist = state.watchlist.filter(s => s.id !== item.id);
        }
        saveState();
        renderAllLists();
        updateModalButtons(item);
    };

    const setRating = (itemId, rating) => {
        state.ratings[itemId] = parseInt(rating);
        saveState();
        updateStars(itemId);
    };

    const updateStars = (itemId) => {
        const rating = state.ratings[itemId] || 0;
        document.querySelectorAll('.star-rating .fa-star').forEach(star => {
            star.classList.toggle('rated', star.dataset.value <= rating);
        });
    };

    const loadState = () => {
        try {
            const collections = localStorage.getItem('collections');
            const watchlist = localStorage.getItem('watchlist');
            const watched = localStorage.getItem('watched');
            const ratings = localStorage.getItem('ratings');
            if (collections) state.collections = JSON.parse(collections);
            if (watchlist) state.watchlist = JSON.parse(watchlist);
            if (watched) state.watched = JSON.parse(watched);
            if (ratings) state.ratings = JSON.parse(ratings);
        } catch (e) {
            console.error("Could not load state, resetting.", e);
            state = { collections: {}, watchlist: [], watched: [], ratings: {} };
        }
    };

    const saveState = () => {
        localStorage.setItem('collections', JSON.stringify(state.collections));
        localStorage.setItem('watchlist', JSON.stringify(state.watchlist));
        localStorage.setItem('watched', JSON.stringify(state.watched));
        localStorage.setItem('ratings', JSON.stringify(state.ratings));
    };

    const addGlobalEventListeners = () => {
        searchInput.addEventListener('input', debounce((e) => performSearch(e.target.value)));
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            performSearch(searchInput.value);
        });
        [watchlistEl, watchedListEl].forEach(list => {
            list.addEventListener('click', async (e) => {
                if (e.target.tagName === 'LI') {
                    const id = e.target.dataset.id;
                    const type = e.target.dataset.type;
                    if (!id || !type) return;
                    openModal({ id: parseInt(id), media_type: type });
                }
            });
        });
        collectionsListEl.addEventListener('click', (e) => {
            const target = e.target;
            const liElement = target.closest('li');
            if (!liElement) return;
            const collectionName = liElement.dataset.name;
            if (target.closest('.btn-edit-collection')) {
                editCollectionName(collectionName, liElement);
            } else if (target.closest('.btn-delete-collection')) {
                if (confirm(`Are you sure you want to delete the "${collectionName}" collection?`)) {
                    deleteCollection(collectionName);
                }
            } else {
                displayCollectionItems(collectionName);
            }
        });
        btnToggleNewCollection.addEventListener('click', () => {
            newCollectionForm.classList.toggle('hidden');
            newCollectionForm.querySelector('input').focus();
        });
        newCollectionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = e.target.querySelector('input');
            const name = input.value.trim();
            if (name) {
                createCollection(name);
                input.value = '';
                newCollectionForm.classList.add('hidden');
            }
        });
        modalCloseBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    };
    
    const init = () => {
        addGlobalEventListeners();
        loadState();
        renderAllLists();
        displayHomePageContent();
    };
    
    init();
});

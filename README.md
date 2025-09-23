# CineTrack: Your Personal Show Library

CineTrack is a sleek and modern web application for discovering, tracking, and organizing movies and TV shows. Built with vanilla JavaScript and powered by the TMDb API, it provides a dynamic and interactive experience for managing your personal media library.

![CineTrack Screenshot](https://i.imgur.com/your-screenshot-url.png) ---

## ✨ Features

-   **Dynamic Search**: Search for movies, TV shows, or even actors and directors to see their works.
-   **Personal Lists**: Manage custom "Watchlist" and "Watched" lists to keep track of your viewing history.
-   **Custom Collections**: Create and manage your own collections (e.g., "Favorite Sci-Fi," "Marvel Marathon").
-   **Detailed Information**: View detailed information for any show, including summaries, release dates, genres, and ratings.
-   **Recommendations**: Get personalized recommendations based on your viewing history.
-   **Star Ratings**: Rate the shows you've watched on a five-star scale.
-   **Persistent Storage**: All your lists and ratings are saved locally in your browser's storage.

---

## 🛠️ Technologies Used

-   **HTML5**
-   **CSS3**: For modern styling, including gradients, glassmorphism effects, and animations.
-   **JavaScript (ES6+)**: For all application logic, including API calls and DOM manipulation.
-   **Axios**: For making simple and clean HTTP requests to the TMDb API.
-   **TMDb API**: The source of all movie and TV show data.

---

## 🚀 Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/cinetrack.git](https://github.com/your-username/cinetrack.git)
    ```

2.  **Get a free TMDb API Key:**
    -   Visit [The Movie Database (TMDb)](https://www.themoviedb.org/signup) and create an account.
    -   Go to your account `Settings` -> `API` and request an API key.

3.  **Create a configuration file:**
    -   In the root of the `cinetrack` folder, create a new file named `config.js`.
    -   Add the following code to `config.js`, replacing `'YOUR_TMDB_API_KEY_HERE'` with the key you just obtained:
      ```javascript
      const API_KEY = 'YOUR_TMDB_API_KEY_HERE';
      ```

4.  **Open `index.html`:**
    -   You can now open the `index.html` file in your browser to start using the application.

---

Your project is now secure and ready for GitHub! By following these steps, your API key is safe on your local machine and will not be exposed in your public repository.
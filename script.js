class NewsQuiz {
    constructor(article) {
        this.article = article;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
    }

    generateQuestions() {
        const content = this.article.content || this.article.description;
        const title = this.article.title;

        this.questions = [
            {
                question: `According to the article, what is ${this.extractMainSubject(title)}?`,
                correctAnswer: this.getCorrectAnswer(content, 0),
                options: this.generateOptions(content, 0)
            },
            {
                question: "What was the main impact or consequence mentioned in the article?",
                correctAnswer: this.getCorrectAnswer(content, 1),
                options: this.generateOptions(content, 1)
            },
            {
                question: "Which of the following statements is true according to the article?",
                correctAnswer: this.getCorrectAnswer(content, 2),
                options: this.generateOptions(content, 2)
            },
            {
                question: "What was the key finding or announcement mentioned in the article?",
                correctAnswer: this.getCorrectAnswer(content, 3),
                options: this.generateOptions(content, 3)
            },
            {
                question: "Based on the article, what was the primary reason for this event/situation?",
                correctAnswer: this.getCorrectAnswer(content, 4),
                options: this.generateOptions(content, 4)
            }
        ];
    }

    extractMainSubject(title) {
        const words = title.split(' ');
        return words.slice(0, 3).join(' ');
    }

    getCorrectAnswer(content, questionIndex) {
        const sentences = content.split('.');
        return sentences[questionIndex] || sentences[0];
    }

    generateOptions(content, questionIndex) {
        const correctAnswer = this.getCorrectAnswer(content, questionIndex);
        const options = [correctAnswer];
        
        for(let i = 0; i < 3; i++) {
            options.push(this.generatePlausibleOption(content, correctAnswer));
        }

        return this.shuffleArray(options);
    }

    generatePlausibleOption(content, correctAnswer) {
        const sentences = content.split('.');
        return sentences[Math.floor(Math.random() * sentences.length)] || 
               "Alternative option based on context";
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

class NewsAPI {
    constructor() {
        this.baseUrl = '/api';
    }

    async fetchNews(category = 'general', searchTerm = '') {
        try {
            let url = `${this.baseUrl}/news?category=${category}`;
            if (searchTerm) {
                url += `&q=${encodeURIComponent(searchTerm)}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch news');
            }
            
            return data.articles;
        } catch (error) {
            throw error;
        }
    }
}

class NewsUI {
    constructor() {
        this.newsContainer = document.getElementById('news-container');
        this.categoryButtons = document.querySelectorAll('.category-btn');
        this.searchInput = document.getElementById('search-input');
        this.searchButton = document.getElementById('search-btn');
        this.darkModeToggle = document.getElementById('dark-mode-toggle');
        this.modal = document.getElementById('article-modal');
        this.closeButton = document.querySelector('.close-button');
        this.dateTimeElement = document.getElementById('current-date-time');
        
        this.quizContainer = document.getElementById('quiz-container');
        this.quizQuestion = document.getElementById('quiz-question');
        this.quizOptions = document.getElementById('quiz-options');
        this.quizSubmit = document.getElementById('submit-quiz');
        this.quizNext = document.getElementById('next-question');
        this.quizResult = document.getElementById('quiz-result');
        this.quizProgress = document.getElementById('quiz-progress');
        this.quizFinalScore = document.getElementById('quiz-final-score');
        
        this.newsAPI = new NewsAPI();
        this.currentCategory = 'general';
        this.bookmarks = [];
        this.currentQuiz = null;
        
        this.initializeEventListeners();
        this.setupModalListeners();
        this.showLoadingSpinner();
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 1000);
    }

    updateDateTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        this.dateTimeElement.textContent = now.toLocaleDateString('en-US', options);
    }

    showLoadingSpinner() {
        this.newsContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                Loading news...
            </div>
        `;
    }

    setupModalListeners() {
        this.closeButton.onclick = () => {
            this.modal.style.display = 'none';
            this.resetQuiz();
        };

        window.onclick = (event) => {
            if (event.target === this.modal) {
                this.modal.style.display = 'none';
                this.resetQuiz();
            }
        };

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.modal.style.display = 'none';
                this.resetQuiz();
            }
        });

        this.quizSubmit.addEventListener('click', () => this.submitQuizAnswer());
        this.quizNext.addEventListener('click', () => this.nextQuizQuestion());
    }

    initializeEventListeners() {
        this.categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.currentCategory = button.dataset.category;
                this.showLoadingSpinner();
                this.fetchAndDisplayNews();
            });
        });

        this.searchButton.addEventListener('click', () => {
            const searchTerm = this.searchInput.value.trim();
            if (searchTerm) {
                this.showLoadingSpinner();
                this.fetchAndDisplayNews(searchTerm);
            }
        });

        this.darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
        });
    }

    async fetchAndDisplayNews(searchTerm = '') {
        try {
            const newsArticles = await this.newsAPI.fetchNews(this.currentCategory, searchTerm);
            this.displayNews(newsArticles);
        } catch (error) {
            this.displayError(error.message);
        }
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    showArticle(article) {
        const modalContent = document.getElementById('modal-article-content');
        modalContent.innerHTML = `
            <div class="full-article">
                <img src="${article.urlToImage || 'https://via.placeholder.com/800x400?text=No+Image+Available'}" 
                     alt="${article.title}"
                     onerror="this.src='https://via.placeholder.com/800x400?text=Error+Loading+Image'">
                <h2>${article.title}</h2>
                <div class="article-info">
                    <span>${article.source.name || 'Unknown Source'}</span>
                    <span>${this.formatDate(article.publishedAt)}</span>
                </div>
                <div class="article-content">
                    <p>${article.description || ''}</p>
                    <p>${article.content || 'Full content not available.'}</p>
                </div>
                <a href="${article.url}" class="source-link" target="_blank">
                    Read original article at source <i class="fas fa-external-link-alt"></i>
                </a>
                <div class="article-actions">
                    <button class="bookmark-btn">
                        ${this.isBookmarked(article.url) ? 'Unbookmark' : 'Bookmark'}
                    </button>
                    <button class="share-btn">Share</button>
                    <button class="summarize-btn">Summarize</button>
                    <button class="quiz-btn">Take Quiz</button>
                </div>
            </div>
        `;

        modalContent.querySelector('.bookmark-btn').addEventListener('click', (e) => {
            this.toggleBookmark(article.url);
            e.target.textContent = this.isBookmarked(article.url) ? 'Unbookmark' : 'Bookmark';
        });

        modalContent.querySelector('.share-btn').addEventListener('click', () => {
            this.shareArticle(article);
        });

        modalContent.querySelector('.quiz-btn').addEventListener('click', () => {
            this.startQuiz(article);
        });
        
        modalContent.querySelector('.summarize-btn').addEventListener('click', () => {
            this.summarizeArticle(article);
        });

        this.modal.style.display = 'block';
    }

    startQuiz(article) {
        this.currentQuiz = new NewsQuiz(article);
        this.currentQuiz.generateQuestions();
        this.quizContainer.style.display = 'block';
        this.displayQuizQuestion();
    }

    displayQuizQuestion() {
        const currentQuestion = this.currentQuiz.questions[this.currentQuiz.currentQuestionIndex];
        this.quizProgress.textContent = `Question ${this.currentQuiz.currentQuestionIndex + 1} of ${this.currentQuiz.questions.length}`;
        this.quizQuestion.textContent = currentQuestion.question;
        
        this.quizOptions.innerHTML = '';
        currentQuestion.options.forEach((option, index) => {
            this.quizOptions.innerHTML += `
                <div>
                    <input type="radio" name="quiz-option" id="option${index}" value="${option}">
                    <label for="option${index}">${option}</label>
                </div>
            `;
        });

        this.quizSubmit.style.display = 'inline-block';
        this.quizNext.style.display = 'none';
        this.quizResult.textContent = '';
        this.quizFinalScore.style.display = 'none';
    }

    submitQuizAnswer() {
        const selectedOption = document.querySelector('input[name="quiz-option"]:checked');
        if (!selectedOption) {
            this.quizResult.textContent = "Please select an answer";
            this.quizResult.style.color = "orange";
            return;
        }

        const currentQuestion = this.currentQuiz.questions[this.currentQuiz.currentQuestionIndex];
        const isCorrect = selectedOption.value === currentQuestion.correctAnswer;

        if (isCorrect) {
            this.currentQuiz.score++;
            this.quizResult.textContent = "Correct!";
            this.quizResult.style.color = "green";
        } else {
            this.quizResult.textContent = `Incorrect. The correct answer was: ${currentQuestion.correctAnswer}`;
            this.quizResult.style.color = "red";
        }

        this.quizSubmit.style.display = 'none';
        this.quizNext.style.display = 'inline-block';
    }

    nextQuizQuestion() {
        this.currentQuiz.currentQuestionIndex++;
        
        if (this.currentQuiz.currentQuestionIndex < this.currentQuiz.questions.length) {
            this.displayQuizQuestion();
        } else {
            this.showQuizResults();
        }
    }

    showQuizResults() {
        this.quizQuestion.textContent = "Quiz Complete!";
        this.quizOptions.innerHTML = "";
        this.quizResult.textContent = "";
        this.quizProgress.textContent = "";
        this.quizSubmit.style.display = 'none';
        this.quizNext.style.display = 'none';
        this.quizFinalScore.style.display = 'block';
        this.quizFinalScore.innerHTML = `
            <h3>Final Score: ${this.currentQuiz.score}/${this.currentQuiz.questions.length}</h3>
            <p>Percentage: ${((this.currentQuiz.score / this.currentQuiz.questions.length) * 100).toFixed(2)}%</p>
            <button onclick="location.reload()">Try Again</button>
        `;
    }

    resetQuiz() {
        if (this.currentQuiz) {
            this.currentQuiz.currentQuestionIndex = 0;
            this.currentQuiz.score = 0;
            this.quizContainer.style.display = 'none';
            this.quizResult.textContent = '';
            this.quizFinalScore.style.display = 'none';
        }
    }

    isBookmarked(url) {
        return this.bookmarks.includes(url);
    }

    toggleBookmark(url) {
        if (this.isBookmarked(url)) {
            this.bookmarks = this.bookmarks.filter(bookmark => bookmark !== url);
        } else {
            this.bookmarks.push(url);
        }
    }

    shareArticle(article) {
        if (navigator.share) {
            navigator.share({
                title: article.title,
                text: article.description,
                url: article.url,
            }).catch(error => console.error('Error sharing:', error));
        } else {
            alert('Sharing is not supported on this browser, but you can copy the URL to share this article.');
        }
    }

    async summarizeArticle(article) {
        const modalContent = document.getElementById('modal-article-content');
        const articleContent = modalContent.querySelector('.article-content');
        const summarizeBtn = modalContent.querySelector('.summarize-btn');
        
        summarizeBtn.disabled = true;
        summarizeBtn.textContent = 'Summarizing...';
        
        try {
            // Prepare text for summarization - clean up any [+chars] patterns
            const articleText = (article.content || article.description || '').replace(/\[\+\d+ chars\]/g, '');
            
            // Use our local API endpoint that connects to Gemini
            const response = await fetch('/api/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: articleText
                })
            });

            if (!response.ok) throw new Error('Failed to generate summary');

            const data = await response.json();
            const summary = data.summary || 'Unable to generate summary. Please refer to the original article.';

            // Create and insert the summary
            const summaryContainer = document.createElement('div');
            summaryContainer.className = 'article-summary';
            summaryContainer.innerHTML = `
                <h3>Article Summary</h3>
                <p>${summary}</p>
            `;

            // Check if a summary already exists and remove it
            const existingSummary = modalContent.querySelector('.article-summary');
            if (existingSummary) {
                existingSummary.remove();
            }

            // Insert the new summary
            articleContent.parentNode.insertBefore(summaryContainer, articleContent);
            summarizeBtn.textContent = 'Summary Generated';
            summaryContainer.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error generating summary:', error);
            summarizeBtn.textContent = 'Summarize';
            summarizeBtn.disabled = false;
            alert('Failed to generate summary. Please try again.');
        }
    }

    displayNews(articles) {
        this.newsContainer.innerHTML = '';
        
        if (!articles || articles.length === 0) {
            this.displayError('No articles found for this category.');
            return;
        }

        articles.forEach(article => {
            const articleCard = document.createElement('div');
            articleCard.classList.add('article-card');
            
            const imageUrl = article.urlToImage || 'https://via.placeholder.com/400x200?text=No+Image+Available';
            
            articleCard.innerHTML = `
                <img src="${imageUrl}" alt="${article.title}" class="article-image" 
                     onerror="this.src='https://via.placeholder.com/400x200?text=Error+Loading+Image'">
                <div class="article-content">
                    <h2>${article.title}</h2>
                    <p>${article.description || ''}</p>
                    <div class="article-info">
                        <span>${article.source.name || 'Unknown Source'}</span>
                        <span>${this.formatDate(article.publishedAt)}</span>
                    </div>
                </div>
            `;
            
            articleCard.addEventListener('click', () => {
                this.showArticle(article);
            });
            
            this.newsContainer.appendChild(articleCard);
        });
    }

    displayError(errorMessage) {
        this.newsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                ${errorMessage}
            </div>
        `;
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const newsUI = new NewsUI();
    newsUI.fetchAndDisplayNews();
});

// Utility functions
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

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Error handling for fetch requests
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

// Service Worker Registration (if you want to make the app work offline)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed:', err);
        });
    });
}

// Local Storage utilities
const StorageUtil = {
    saveToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    },

    getFromStorage(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    },

    removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Error removing from localStorage:', e);
        }
    }
};

// Handle offline/online events
window.addEventListener('online', function() {
    document.body.classList.remove('offline');
});

window.addEventListener('offline', function() {
    document.body.classList.add('offline');
});

// Prevent form submission if there's a quiz in progress
document.addEventListener('submit', function(e) {
    const newsUI = document.querySelector('.news-ui');
    if (newsUI && newsUI.currentQuiz) {
        e.preventDefault();
        alert('Please complete or close the current quiz before submitting forms.');
    }
});

// Add keyboard navigation for quiz
document.addEventListener('keydown', function(e) {
    const newsUI = document.querySelector('.news-ui');
    if (newsUI && newsUI.currentQuiz) {
        if (e.key === 'Enter' && newsUI.quizSubmit.style.display !== 'none') {
            newsUI.submitQuizAnswer();
        } else if (e.key === 'ArrowRight' && newsUI.quizNext.style.display !== 'none') {
            newsUI.nextQuizQuestion();
        }
    }
});
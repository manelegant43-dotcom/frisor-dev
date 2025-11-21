/**
 * NAVIGATION.JS - Extremt noggrant navigeringssystem
 * Hanterar all sidnavigation, routing, history och transitions
 */

class NavigationManager {
    constructor() {
        this.currentScreen = 'home';
        this.previousScreen = null;
        this.screenHistory = [];
        this.isTransitioning = false;
        this.transitionDuration = 400;
        this.scrollPositions = new Map();
        
        // Screens configuration
        this.screens = {
            'home': {
                id: 'homeScreen',
                title: 'NEONCUT - Hitta din perfekta frisyr',
                navItem: 'home'
            },
            'priceComparison': {
                id: 'priceComparisonScreen', 
                title: 'Prisjämförelse - NEONCUT',
                navItem: 'priceComparison'
            },
            'dropIn': {
                id: 'dropInScreen',
                title: 'Drop-in Frisörer - NEONCUT', 
                navItem: 'dropIn'
            },
            'homeService': {
                id: 'homeServiceScreen',
                title: 'Hemfrisör Service - NEONCUT',
                navItem: 'homeService'
            },
            'aiAnalysis': {
                id: 'aiAnalysisScreen',
                title: 'AI Håranalys - NEONCUT',
                navItem: 'aiAnalysis'
            }
        };

        this.init();
    }

    /**
     * INIT - Extremt noggrann initiering med felhantering
     */
    init() {
        try {
            console.log('🔄 NavigationManager initializing...');
            
            // Vänta på DOM är redo
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
            } else {
                this.setupEventListeners();
            }

            // Initiera första skärmen
            this.initializeFirstScreen();
            
            console.log('✅ NavigationManager initialized successfully');
            
        } catch (error) {
            console.error('❌ NavigationManager initialization failed:', error);
            this.handleError(error, 'init');
        }
    }

    /**
     * SETUP EVENT LISTENERS - Extremt noggrann eventhantering
     */
    setupEventListeners() {
        try {
            // Bottom navigation listeners
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const screen = item.dataset.screen;
                    if (screen && this.screens[screen]) {
                        this.navigateTo(screen);
                    }
                });
            });

            // Quick action cards listeners
            const actionCards = document.querySelectorAll('.action-card');
            actionCards.forEach(card => {
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    const action = card.dataset.action;
                    if (action && this.screens[action]) {
                        this.navigateTo(action);
                    }
                });
            });

            // Back button handling (browser och hardware)
            window.addEventListener('popstate', (e) => {
                this.handleBrowserBack(e);
            });

            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                this.handleKeyboardNavigation(e);
            });

            // Touch gestures för mobil
            this.setupTouchGestures();

            // Screen visibility changes
            document.addEventListener('visibilitychange', () => {
                this.handleVisibilityChange();
            });

            console.log('🎯 Navigation event listeners setup complete');
            
        } catch (error) {
            console.error('❌ Failed to setup navigation event listeners:', error);
            this.handleError(error, 'setupEventListeners');
        }
    }

    /**
     * INITIALIZE FIRST SCREEN - Extremt noggrann första skärmshantering
     */
    initializeFirstScreen() {
        try {
            // Kolla URL för deep linking
            const urlParams = new URLSearchParams(window.location.search);
            const screenParam = urlParams.get('screen');
            
            if (screenParam && this.screens[screenParam]) {
                this.currentScreen = screenParam;
            }

            // Visa första skärmen
            this.showScreen(this.currentScreen, false);
            
            // Uppdatera navigation state
            this.updateNavigationState();
            
            console.log(`📱 Initial screen: ${this.currentScreen}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize first screen:', error);
            this.handleError(error, 'initializeFirstScreen');
        }
    }

    /**
     * NAVIGATE TO - Extremt noggrann navigering med transitions
     */
    async navigateTo(screen, addToHistory = true) {
        // Validera screen parameter
        if (!screen || !this.screens[screen]) {
            console.warn(`⚠️ Invalid screen: ${screen}`);
            return;
        }

        // Förhindra dubbla navigationer under transition
        if (this.isTransitioning) {
            console.log('⏳ Navigation in progress, skipping...');
            return;
        }

        // Samma skärm - inget att göra
        if (screen === this.currentScreen) {
            return;
        }

        try {
            this.isTransitioning = true;
            
            // Spara nuvarande scroll position
            this.saveScrollPosition(this.currentScreen);
            
            // Uppdatera history om requested
            if (addToHistory) {
                this.addToHistory(this.currentScreen);
                this.updateBrowserHistory(screen);
            }

            // Spara previous screen
            this.previousScreen = this.currentScreen;
            
            // Utför screen transition
            await this.performScreenTransition(screen);
            
            // Uppdatera current screen
            this.currentScreen = screen;
            
            // Uppdatera UI state
            this.updateNavigationState();
            this.updateDocumentTitle();
            
            // Scrolla till toppen eller sparad position
            this.restoreScrollPosition(screen);
            
            // Dispatch custom event
            this.dispatchNavigationEvent(screen);
            
            console.log(`🧭 Navigated to: ${screen}`);
            
        } catch (error) {
            console.error(`❌ Navigation to ${screen} failed:`, error);
            this.handleError(error, 'navigateTo');
        } finally {
            this.isTransitioning = false;
        }
    }

    /**
     * PERFORM SCREEN TRANSITION - Extremt noggrann skärmövergång
     */
    async performScreenTransition(newScreen) {
        return new Promise((resolve) => {
            const currentScreenEl = this.getScreenElement(this.currentScreen);
            const newScreenEl = this.getScreenElement(newScreen);
            
            if (!currentScreenEl || !newScreenEl) {
                console.warn('⚠️ Screen elements not found');
                resolve();
                return;
            }

            // Add loading state
            document.body.classList.add('navigation-transitioning');
            
            // Hide current screen with animation
            currentScreenEl.style.opacity = '0';
            currentScreenEl.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                // Hide current screen completely
                currentScreenEl.classList.remove('active');
                currentScreenEl.style.opacity = '';
                currentScreenEl.style.transform = '';
                
                // Show new screen
                newScreenEl.classList.add('active');
                newScreenEl.style.opacity = '0';
                newScreenEl.style.transform = 'translateY(20px)';
                
                // Trigger reflow
                newScreenEl.offsetHeight;
                
                // Animate new screen in
                newScreenEl.style.opacity = '1';
                newScreenEl.style.transform = 'translateY(0)';
                newScreenEl.style.transition = `all ${this.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
                
                setTimeout(() => {
                    // Clean up styles
                    newScreenEl.style.opacity = '';
                    newScreenEl.style.transform = '';
                    newScreenEl.style.transition = '';
                    
                    // Remove loading state
                    document.body.classList.remove('navigation-transitioning');
                    
                    resolve();
                }, this.transitionDuration);
                
            }, this.transitionDuration / 2);
        });
    }

    /**
     * UPDATE NAVIGATION STATE - Extremt noggrann UI state uppdatering
     */
    updateNavigationState() {
        try {
            // Uppdatera bottom navigation
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                const screen = item.dataset.screen;
                if (screen === this.currentScreen) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            // Uppdatera header baserat på skärm
            this.updateHeaderForScreen(this.currentScreen);
            
            // Uppdatera back button visibility
            this.updateBackButton();
            
        } catch (error) {
            console.error('❌ Failed to update navigation state:', error);
            this.handleError(error, 'updateNavigationState');
        }
    }

    /**
     * UPDATE HEADER FOR SCREEN - Extremt noggrann header-anpassning
     */
    updateHeaderForScreen(screen) {
        const header = document.querySelector('.neon-header');
        if (!header) return;

        // Screen-specific header modifications
        switch(screen) {
            case 'home':
                header.style.background = 'rgba(10, 10, 10, 0.95)';
                break;
            case 'priceComparison':
                header.style.background = 'rgba(26, 26, 46, 0.95)';
                break;
            case 'dropIn':
                header.style.background = 'rgba(22, 33, 62, 0.95)';
                break;
            case 'homeService':
                header.style.background = 'rgba(15, 52, 96, 0.95)';
                break;
            case 'aiAnalysis':
                header.style.background = 'rgba(10, 10, 10, 0.95)';
                break;
            default:
                header.style.background = 'rgba(10, 10, 10, 0.95)';
        }
    }

    /**
     * UPDATE BACK BUTTON - Extremt noggrann back button logik
     */
    updateBackButton() {
        // I en riktig app skulle detta hantera en back button i headern
        // För nu hanterar vi bara browser back
        const canGoBack = this.screenHistory.length > 0;
        
        // Dispatch event för komponenter som behöver veta
        window.dispatchEvent(new CustomEvent('backButtonStateChange', {
            detail: { canGoBack }
        }));
    }

    /**
     * GO BACK - Extremt noggrann back navigation
     */
    goBack() {
        if (this.screenHistory.length === 0) {
            // Ingen history - gå till home
            this.navigateTo('home');
            return;
        }

        const previousScreen = this.screenHistory.pop();
        this.navigateTo(previousScreen, false); // false = lägg inte till i history igen
    }

    /**
     * ADD TO HISTORY - Extremt noggrann history-hantering
     */
    addToHistory(screen) {
        // Begränsa history storlek
        if (this.screenHistory.length >= 10) {
            this.screenHistory.shift(); // Ta bort äldsta
        }
        
        this.screenHistory.push(screen);
    }

    /**
     * UPDATE BROWSER HISTORY - Extremt noggrann browser history hantering
     */
    updateBrowserHistory(screen) {
        const url = new URL(window.location);
        url.searchParams.set('screen', screen);
        
        window.history.pushState(
            { screen, timestamp: Date.now() },
            '',
            url.toString()
        );
    }

    /**
     * HANDLE BROWSER BACK - Extremt noggrann browser back hantering
     */
    handleBrowserBack(event) {
        if (event.state && event.state.screen) {
            this.navigateTo(event.state.screen, false);
        } else {
            this.goBack();
        }
    }

    /**
     * HANDLE KEYBOARD NAVIGATION - Extremt noggrann tangentbordsnavigation
     */
    handleKeyboardNavigation(event) {
        // Esc för att gå tillbaka
        if (event.key === 'Escape') {
            event.preventDefault();
            this.goBack();
        }
        
        // Alt + pil för navigation mellan skärmar
        if (event.altKey) {
            switch(event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    this.goBack();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    // Gå framåt i history (om möjligt)
                    break;
                case '1':
                    event.preventDefault();
                    this.navigateTo('home');
                    break;
                case '2':
                    event.preventDefault();
                    this.navigateTo('priceComparison');
                    break;
                case '3':
                    event.preventDefault();
                    this.navigateTo('dropIn');
                    break;
                case '4':
                    event.preventDefault();
                    this.navigateTo('homeService');
                    break;
                case '5':
                    event.preventDefault();
                    this.navigateTo('aiAnalysis');
                    break;
            }
        }
    }

    /**
     * SETUP TOUCH GESTURES - Extremt noggrann touch navigation
     */
    setupTouchGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        const minSwipeDistance = 50;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        });

        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // Horizontal swipe (endast om lite vertical movement)
            if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
                if (deltaX > 0) {
                    // Swipe right - go back
                    this.goBack();
                }
                // Swipe left kan användas för forward navigation i framtiden
            }
        });
    }

    /**
     * HANDLE VISIBILITY CHANGE - Extremt noggrann visibility hantering
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // App är hidden - spara state
            this.saveScrollPosition(this.currentScreen);
        } else {
            // App är visible - restore state
            this.restoreScrollPosition(this.currentScreen);
        }
    }

    /**
     * SAVE SCROLL POSITION - Extremt noggrann scroll position sparande
     */
    saveScrollPosition(screen) {
        const screenEl = this.getScreenElement(screen);
        if (screenEl) {
            this.scrollPositions.set(screen, screenEl.scrollTop);
        }
    }

    /**
     * RESTORE SCROLL POSITION - Extremt noggrann scroll position återställning
     */
    restoreScrollPosition(screen) {
        const savedPosition = this.scrollPositions.get(screen) || 0;
        const screenEl = this.getScreenElement(screen);
        
        if (screenEl) {
            // Använd smooth scroll för bättre UX
            screenEl.scrollTo({
                top: savedPosition,
                behavior: 'smooth'
            });
        }
    }

    /**
     * SHOW SCREEN - Extremt noggrann skärmvisning utan transition
     */
    showScreen(screen, animate = false) {
        if (!this.screens[screen]) {
            console.warn(`⚠️ Invalid screen: ${screen}`);
            return;
        }

        // Dölj alla skärmar
        Object.values(this.screens).forEach(screenConfig => {
            const element = document.getElementById(screenConfig.id);
            if (element) {
                element.classList.remove('active');
                if (animate) {
                    element.style.opacity = '0';
                }
            }
        });

        // Visa vald skärm
        const targetElement = document.getElementById(this.screens[screen].id);
        if (targetElement) {
            targetElement.classList.add('active');
            if (animate) {
                setTimeout(() => {
                    targetElement.style.opacity = '1';
                }, 50);
            }
        }

        this.currentScreen = screen;
        this.updateDocumentTitle();
    }

    /**
     * UPDATE DOCUMENT TITLE - Extremt noggrann titelhantering
     */
    updateDocumentTitle() {
        const screenConfig = this.screens[this.currentScreen];
        if (screenConfig && screenConfig.title) {
            document.title = screenConfig.title;
        }
    }

    /**
     * GET SCREEN ELEMENT - Extremt noggrann elementhämtning
     */
    getScreenElement(screen) {
        const screenConfig = this.screens[screen];
        if (!screenConfig) return null;
        
        return document.getElementById(screenConfig.id);
    }

    /**
     * DISPATCH NAVIGATION EVENT - Extremt noggrann event dispatch
     */
    dispatchNavigationEvent(screen) {
        const event = new CustomEvent('screenChange', {
            detail: {
                screen,
                previousScreen: this.previousScreen,
                screenConfig: this.screens[screen],
                timestamp: Date.now()
            }
        });
        
        window.dispatchEvent(event);
    }

    /**
     * GET CURRENT SCREEN INFO - Extremt noggrann state access
     */
    getCurrentScreenInfo() {
        return {
            currentScreen: this.currentScreen,
            previousScreen: this.previousScreen,
            screenHistory: [...this.screenHistory],
            screenConfig: this.screens[this.currentScreen]
        };
    }

    /**
     * RESET NAVIGATION - Extremt noggrann reset funktion
     */
    resetNavigation() {
        this.screenHistory = [];
        this.previousScreen = null;
        this.navigateTo('home', false);
    }

    /**
     * ERROR HANDLING - Extremt noggrann felhantering
     */
    handleError(error, context) {
        const errorInfo = {
            context,
            message: error.message,
            timestamp: new Date().toISOString(),
            currentScreen: this.currentScreen,
            screenHistory: this.screenHistory
        };

        console.error('🚨 NavigationManager Error:', errorInfo);
        
        // Fallback till home vid allvarliga fel
        if (context !== 'initializeFirstScreen') {
            this.showScreen('home', false);
        }

        window.dispatchEvent(new CustomEvent('navigationError', {
            detail: errorInfo
        }));
    }

    /**
     * DESTROY - Extremt noggrann cleanup
     */
    destroy() {
        // Rensa event listeners
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.replaceWith(item.cloneNode(true));
        });

        // Rensa state
        this.screenHistory = [];
        this.scrollPositions.clear();
        this.isTransitioning = false;
        
        console.log('♻️ NavigationManager destroyed');
    }
}

// Global instans
window.navigationManager = new NavigationManager();

// Export för module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationManager;
}
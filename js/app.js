/**
 * SIMPLE APP.JS - Felsökningsversion
 * Garanterar att appen startar och visar allt korrekt
 */

class SimpleNeonCutApp {
    constructor() {
        this.init();
    }

    async init() {
        console.log('🔧 SimpleNeonCutApp: Starting debug version...');
        
        try {
            // 1. Vänta på DOM
            await this.waitForDOM();
            
            // 2. Dölj loading screen OMEDELBART
            this.hideLoadingScreen();
            
            // 3. Visa huvudapplikationen
            this.showMainApp();
            
            // 4. Initiera grundläggande system
            await this.initializeBasicSystems();
            
            // 5. Ladda och visa data
            await this.loadAndDisplayData();
            
            console.log('✅ SimpleNeonCutApp: Started successfully!');
            
        } catch (error) {
            console.error('❌ App startup failed:', error);
            this.showError(error);
        }
    }

    async waitForDOM() {
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        console.log('✅ DOM is ready');
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const appContainer = document.getElementById('app');
        
        console.log('🔄 Hiding loading screen...');
        
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            loadingScreen.classList.add('hidden');
            console.log('✅ Loading screen hidden');
        } else {
            console.warn('⚠️ Loading screen element not found');
        }
        
        if (appContainer) {
            appContainer.style.display = 'block';
            appContainer.classList.remove('hidden');
            console.log('✅ App container shown');
        } else {
            console.warn('⚠️ App container element not found');
        }
    }

    showMainApp() {
        const appContainer = document.getElementById('app');
        if (appContainer) {
            // Säkerställ att appen är synlig
            appContainer.style.opacity = '1';
            appContainer.style.visibility = 'visible';
            appContainer.style.display = 'block';
        }
    }

    async initializeBasicSystems() {
        console.log('🔄 Initializing basic systems...');
        
        // Initiera DataManager först
        if (typeof DataManager !== 'undefined') {
            window.dataManager = new DataManager();
            console.log('✅ DataManager created');
        } else {
            console.error('❌ DataManager class not found');
        }
        
        // Initiera NavigationManager
        if (typeof NavigationManager !== 'undefined') {
            window.navigationManager = new NavigationManager();
            console.log('✅ NavigationManager created');
        }
        
        // Initiera UIComponents
        if (typeof UIComponents !== 'undefined') {
            window.uiComponents = new UIComponents();
            console.log('✅ UIComponents created');
        }
        
        console.log('✅ Basic systems initialized');
    }

    async loadAndDisplayData() {
        console.log('🔄 Loading and displaying data...');
        
        // Vänta på att DataManager blir redo
        if (window.dataManager) {
            await this.waitForDataManager();
            await this.displayAllSections();
        } else {
            // Använd mock data om DataManager inte finns
            await this.useMockData();
        }
    }

    async waitForDataManager() {
        return new Promise((resolve) => {
            const checkReady = () => {
                if (window.dataManager && window.dataManager.isInitialized) {
                    console.log('✅ DataManager is ready');
                    resolve();
                } else {
                    console.log('⏳ Waiting for DataManager...');
                    setTimeout(checkReady, 100);
                }
            };
            checkReady();
        });
    }

    async displayAllSections() {
        console.log('🎨 Displaying all sections...');
        
        // 1. Visa featured salons
        await this.displayFeaturedSalons();
        
        // 2. Visa tillgängliga salons
        await this.displayAvailableSalons();
        
        // 3. Uppdatera statistik
        await this.updateStatistics();
        
        // 4. Setup event listeners
        await this.setupEventListeners();
        
        console.log('✅ All sections displayed');
    }

    async displayFeaturedSalons() {
        const container = document.getElementById('featuredSalons');
        if (!container) {
            console.warn('⚠️ Featured salons container not found');
            return;
        }

        try {
            const salons = window.dataManager.salons.slice(0, 4);
            console.log(`📊 Displaying ${salons.length} featured salons`);
            
            container.innerHTML = salons.map(salon => `
                <div class="salon-card neon-card" data-salon-id="${salon.id}">
                    <div class="salon-header">
                        <h3 class="salon-name">${salon.name}</h3>
                        <div class="salon-rating">
                            ⭐ ${salon.rating} <span>(${salon.reviewCount})</span>
                        </div>
                    </div>
                    <div class="salon-details">
                        <span class="salon-treatment">${salon.shortDescription || 'Professionell frisörsalong'}</span>
                        <span class="salon-price">${salon.averageTreatmentPrice || 350} kr</span>
                    </div>
                    <div class="salon-footer">
                        <span class="salon-distance">${salon.distance || 1.5} km</span>
                        <span class="available-badge ${salon.availableNow ? 'neon-pulse' : ''}">
                            ${salon.availableNow ? 'Ledig nu' : 'Bokas'}
                        </span>
                    </div>
                </div>
            `).join('');

            console.log('✅ Featured salons displayed');
            
        } catch (error) {
            console.error('❌ Error displaying featured salons:', error);
            container.innerHTML = '<p>Kunde inte ladda salonger</p>';
        }
    }

    async displayAvailableSalons() {
        const container = document.getElementById('availableList');
        const countElement = document.getElementById('availableCount');
        
        if (!container) {
            console.warn('⚠️ Available salons container not found');
            return;
        }

        try {
            const availableSalons = window.dataManager.salons
                .filter(salon => salon.availableNow)
                .slice(0, 6);

            console.log(`📊 Displaying ${availableSalons.length} available salons`);
            
            // Uppdatera antal
            if (countElement) {
                countElement.textContent = availableSalons.length;
            }

            container.innerHTML = availableSalons.map(salon => `
                <div class="salon-card neon-card" data-salon-id="${salon.id}">
                    <div class="salon-header">
                        <h3 class="salon-name">${salon.name}</h3>
                        <div class="salon-rating">
                            ⭐ ${salon.rating} <span>(${salon.reviewCount})</span>
                        </div>
                    </div>
                    <div class="salon-details">
                        <span class="salon-treatment">${salon.shortDescription || 'Snabbklippning'}</span>
                        <span class="salon-price">${salon.averageTreatmentPrice || 250} kr</span>
                    </div>
                    <div class="salon-footer">
                        <span class="salon-distance">${salon.distance || 0.8} km</span>
                        <span class="available-badge neon-pulse">Ledig nu</span>
                    </div>
                </div>
            `).join('');

            console.log('✅ Available salons displayed');
            
        } catch (error) {
            console.error('❌ Error displaying available salons:', error);
            container.innerHTML = '<p>Inga lediga salonger just nu</p>';
        }
    }

    async updateStatistics() {
        console.log('📈 Updating statistics...');
        
        const stats = [
            { element: '.stat-number[data-count="500"]', value: 500 },
            { element: '.stat-number[data-count="10000"]', value: 10000 },
            { element: '.stat-number[data-count="4.8"]', value: 4.8 }
        ];

        stats.forEach(stat => {
            const element = document.querySelector(stat.element);
            if (element) {
                element.textContent = stat.value;
            }
        });

        console.log('✅ Statistics updated');
    }

    async setupEventListeners() {
        console.log('🎯 Setting up event listeners...');
        
        // Navigation
        this.setupNavigation();
        
        // Search
        this.setupSearch();
        
        // Salon card clicks
        this.setupSalonClicks();
        
        console.log('✅ Event listeners setup complete');
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const screen = item.dataset.screen;
                console.log(`🔄 Navigating to: ${screen}`);
                
                // Enkel navigation - visa/visa inte skärmar
                this.showScreen(screen);
            });
        });

        // Quick actions
        const actionCards = document.querySelectorAll('.action-card');
        actionCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const action = card.dataset.action;
                console.log(`🔄 Quick action: ${action}`);
                this.showScreen(action);
            });
        });
    }

    showScreen(screenName) {
        // Dölj alla skärmar
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Visa vald skärm
        const targetScreen = document.getElementById(screenName + 'Screen');
        if (targetScreen) {
            targetScreen.classList.add('active');
            console.log(`✅ Showing screen: ${screenName}`);
        } else {
            console.warn(`⚠️ Screen not found: ${screenName}`);
        }
        
        // Uppdatera navigation
        this.updateNavigation(screenName);
    }

    updateNavigation(activeScreen) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.screen === activeScreen) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('salonSearch');
        const searchButton = document.querySelector('.search-btn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                console.log(`🔍 Search: ${e.target.value}`);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }
        
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                const searchInput = document.getElementById('salonSearch');
                if (searchInput) {
                    this.performSearch(searchInput.value);
                }
            });
        }
    }

    performSearch(query) {
        console.log(`🔍 Performing search: "${query}"`);
        // Enkel sökning - i en riktig app skulle detta filtrera salonger
        if (window.uiComponents) {
            window.uiComponents.showInfo(`Sökning: "${query}" - ${Math.floor(Math.random() * 10)} resultat hittades`);
        }
    }

    setupSalonClicks() {
        document.addEventListener('click', (e) => {
            const salonCard = e.target.closest('.salon-card');
            if (salonCard) {
                const salonId = salonCard.dataset.salonId;
                console.log(`🏪 Salon clicked: ${salonId}`);
                this.showSalonDetails(salonId);
            }
        });
    }

    showSalonDetails(salonId) {
        console.log(`📋 Showing details for salon: ${salonId}`);
        
        if (window.uiComponents) {
            window.uiComponents.showInfo(`Visar detaljer för salong ${salonId}`);
        }
        
        // Här skulle vi öppna en modal med salongsdetaljer
    }

    async useMockData() {
        console.log('🔄 Using mock data...');
        
        // Mock data för testing
        const mockSalons = [
            {
                id: 1,
                name: "Test Salong 1",
                rating: 4.5,
                reviewCount: 123,
                shortDescription: "Premium frisörsalong",
                averageTreatmentPrice: 450,
                distance: 1.2,
                availableNow: true
            },
            {
                id: 2, 
                name: "Test Salong 2",
                rating: 4.8,
                reviewCount: 89,
                shortDescription: "Express klippning",
                averageTreatmentPrice: 299,
                distance: 0.8,
                availableNow: false
            }
        ];
        
        // Visa mock data
        const featuredContainer = document.getElementById('featuredSalons');
        if (featuredContainer) {
            featuredContainer.innerHTML = mockSalons.map(salon => `
                <div class="salon-card neon-card" data-salon-id="${salon.id}">
                    <div class="salon-header">
                        <h3 class="salon-name">${salon.name}</h3>
                        <div class="salon-rating">
                            ⭐ ${salon.rating} <span>(${salon.reviewCount})</span>
                        </div>
                    </div>
                    <div class="salon-details">
                        <span class="salon-treatment">${salon.shortDescription}</span>
                        <span class="salon-price">${salon.averageTreatmentPrice} kr</span>
                    </div>
                    <div class="salon-footer">
                        <span class="salon-distance">${salon.distance} km</span>
                        <span class="available-badge ${salon.availableNow ? 'neon-pulse' : ''}">
                            ${salon.availableNow ? 'Ledig nu' : 'Bokas'}
                        </span>
                    </div>
                </div>
            `).join('');
        }
        
        console.log('✅ Mock data displayed');
    }

    showError(error) {
        console.error('💥 App Error:', error);
        
        const loadingScreen = document.getElementById('loadingScreen');
        const appContainer = document.getElementById('app');
        
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="error-content" style="text-align: center; padding: 2rem; color: white;">
                    <h1>😕 Något gick fel</h1>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" style="
                        background: #ff6b6b; 
                        border: none; 
                        padding: 1rem 2rem; 
                        border-radius: 12px; 
                        color: black; 
                        font-weight: bold;
                        margin-top: 1rem;
                        cursor: pointer;
                    ">Ladda om sidan</button>
                </div>
            `;
        }
        
        if (appContainer) {
            appContainer.style.display = 'none';
        }
    }
}

// Starta appen OMEDELBART
console.log('🎯 Starting SimpleNeonCutApp...');

// Skapa global instans
window.simpleApp = new SimpleNeonCutApp();

// Fallback - om något går fel, visa appen ändå
setTimeout(() => {
    const loadingScreen = document.getElementById('loadingScreen');
    const appContainer = document.getElementById('app');
    
    if (loadingScreen && loadingScreen.style.display !== 'none') {
        console.log('🔄 Fallback: Forcing app to show...');
        loadingScreen.style.display = 'none';
    }
    
    if (appContainer && appContainer.style.display !== 'block') {
        appContainer.style.display = 'block';
    }
}, 3000);
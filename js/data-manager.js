/**
 * DATA-MANAGER.JS - Extremt noggrant datahanteringssystem
 * Hanterar all app-data, API-anrop, caching och felhantering
 */

class DataManager {
    constructor() {
        this.salons = [];
        this.treatments = [];
        this.userData = null;
        this.filters = {
            treatment: '',
            price: '',
            rating: '',
            distance: '',
            availability: false
        };
        this.cache = new Map();
        this.isInitialized = false;
        
        // Cache expiration time (5 minutes)
        this.CACHE_EXPIRY = 5 * 60 * 1000;
        
        this.init();
    }

    /**
     * INIT - Extremt noggrann initiering med felhantering
     */
    async init() {
        try {
            console.log('🔄 DataManager initializing...');
            
            // Ladda all data parallellt för bästa prestanda
            await Promise.all([
                this.loadSalons(),
                this.loadTreatments(),
                this.loadUserData()
            ]);
            
            this.isInitialized = true;
            console.log('✅ DataManager initialized successfully');
            
            // Dispatch custom event när data är redo
            window.dispatchEvent(new CustomEvent('dataReady'));
            
        } catch (error) {
            console.error('❌ DataManager initialization failed:', error);
            this.handleError(error, 'init');
        }
    }

    /**
     * LOAD SALONS - Extremt noggrann datahämtning med caching
     */
    async loadSalons() {
        const cacheKey = 'salons_data';
        
        // Kontrollera cache först
        if (this.isCacheValid(cacheKey)) {
            this.salons = this.cache.get(cacheKey).data;
            console.log('📁 Salons loaded from cache');
            return;
        }

        try {
            const response = await fetch('data/salons.json');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.salons || !Array.isArray(data.salons)) {
                throw new Error('Invalid salons data structure');
            }
            
            // Validera och transformera data
            this.salons = this.validateAndTransformSalons(data.salons);
            
            // Spara i cache
            this.cache.set(cacheKey, {
                data: this.salons,
                timestamp: Date.now()
            });
            
            console.log(`✅ Loaded ${this.salons.length} salons`);
            
        } catch (error) {
            console.error('❌ Failed to load salons:', error);
            
            // Fallback till mock data om filen inte finns
            this.salons = this.getMockSalons();
            console.log('🔄 Using mock salons data as fallback');
        }
    }

    /**
     * LOAD TREATMENTS - Extremt noggrann behandlingsdata hämtning
     */
    async loadTreatments() {
        const cacheKey = 'treatments_data';
        
        if (this.isCacheValid(cacheKey)) {
            this.treatments = this.cache.get(cacheKey).data;
            console.log('📁 Treatments loaded from cache');
            return;
        }

        try {
            const response = await fetch('data/treatments.json');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.treatments || !Array.isArray(data.treatments)) {
                throw new Error('Invalid treatments data structure');
            }
            
            this.treatments = this.validateAndTransformTreatments(data.treatments);
            
            this.cache.set(cacheKey, {
                data: this.treatments,
                timestamp: Date.now()
            });
            
            console.log(`✅ Loaded ${this.treatments.length} treatments`);
            
        } catch (error) {
            console.error('❌ Failed to load treatments:', error);
            this.treatments = this.getMockTreatments();
            console.log('🔄 Using mock treatments data as fallback');
        }
    }

    /**
     * LOAD USER DATA - Extremt noggrann användardata hämtning
     */
    async loadUserData() {
        const cacheKey = 'user_data';
        
        if (this.isCacheValid(cacheKey)) {
            this.userData = this.cache.get(cacheKey).data;
            console.log('📁 User data loaded from cache');
            return;
        }

        try {
            const response = await fetch('data/users.json');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.currentUser) {
                throw new Error('Invalid user data structure');
            }
            
            this.userData = this.validateAndTransformUserData(data);
            
            this.cache.set(cacheKey, {
                data: this.userData,
                timestamp: Date.now()
            });
            
            console.log('✅ User data loaded successfully');
            
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
            this.userData = this.getMockUserData();
            console.log('🔄 Using mock user data as fallback');
        }
    }

    /**
     * VALIDATE AND TRANSFORM SALONS - Extremt noggrann datavalidering
     */
    validateAndTransformSalons(salons) {
        return salons.map(salon => {
            // Grundvalidering
            if (!salon.id || !salon.name || !salon.treatments) {
                console.warn('⚠️ Invalid salon data skipped:', salon);
                return null;
            }

            return {
                id: parseInt(salon.id) || 0,
                name: salon.name.trim() || 'Okänd salong',
                slug: salon.slug || this.generateSlug(salon.name),
                type: salon.type || 'salon',
                rating: parseFloat(salon.rating) || 0,
                reviewCount: parseInt(salon.reviewCount) || 0,
                distance: parseFloat(salon.distance) || 0,
                priceRange: salon.priceRange || 'medium',
                availableNow: Boolean(salon.availableNow),
                nextAvailable: salon.nextAvailable || 'N/A',
                waitTime: salon.waitTime || 'Okänt',
                image: salon.image || 'assets/images/salons/default.jpg',
                logo: salon.logo || 'assets/images/salons/default-logo.png',
                description: salon.description || '',
                shortDescription: salon.shortDescription || '',
                
                address: {
                    street: salon.address?.street || '',
                    city: salon.address?.city || 'Stockholm',
                    postalCode: salon.address?.postalCode || '',
                    country: salon.address?.country || 'Sverige',
                    coordinates: salon.address?.coordinates || { lat: 0, lng: 0 }
                },
                
                contact: {
                    phone: salon.contact?.phone || '',
                    email: salon.contact?.email || '',
                    website: salon.contact?.website || '',
                    instagram: salon.contact?.instagram || ''
                },
                
                openingHours: Array.isArray(salon.openingHours) ? salon.openingHours : [],
                treatments: Array.isArray(salon.treatments) ? salon.treatments : [],
                stylists: Array.isArray(salon.stylists) ? salon.stylists : [],
                features: Array.isArray(salon.features) ? salon.features : [],
                images: Array.isArray(salon.images) ? salon.images : [],
                reviews: Array.isArray(salon.reviews) ? salon.reviews : [],
                
                stats: {
                    totalBookings: salon.stats?.totalBookings || 0,
                    repeatCustomers: salon.stats?.repeatCustomers || 0,
                    responseTime: salon.stats?.responseTime || 'Okänt',
                    satisfactionRate: salon.stats?.satisfactionRate || 0
                },
                
                homeService: {
                    available: Boolean(salon.homeService?.available),
                    priceMultiplier: parseFloat(salon.homeService?.priceMultiplier) || 1.0,
                    minOrder: parseFloat(salon.homeService?.minOrder) || 0,
                    travelFee: parseFloat(salon.homeService?.travelFee) || 0,
                    maxDistance: parseFloat(salon.homeService?.maxDistance) || 0,
                    availableTimes: Array.isArray(salon.homeService?.availableTimes) ? 
                        salon.homeService.availableTimes : []
                },
                
                premium: {
                    isPremium: Boolean(salon.premium?.isPremium),
                    level: salon.premium?.level || 'basic',
                    since: salon.premium?.since || null,
                    features: Array.isArray(salon.premium?.features) ? salon.premium.features : []
                },
                
                // Beräknade fält
                isOpen: this.checkIfSalonIsOpen(salon),
                popularTreatments: this.getPopularTreatments(salon),
                averageTreatmentPrice: this.calculateAveragePrice(salon.treatments)
            };
        }).filter(salon => salon !== null); // Ta bort ogiltiga salonger
    }

    /**
     * VALIDATE AND TRANSFORM TREATMENTS - Extremt noggrann behandlingsvalidering
     */
    validateAndTransformTreatments(treatments) {
        return treatments.map(treatment => {
            if (!treatment.id || !treatment.name || !treatment.price) {
                console.warn('⚠️ Invalid treatment data skipped:', treatment);
                return null;
            }

            return {
                id: parseInt(treatment.id) || 0,
                name: treatment.name.trim() || 'Okänd behandling',
                slug: treatment.slug || this.generateSlug(treatment.name),
                category: treatment.category || 'other',
                subcategory: treatment.subcategory || 'standard',
                price: parseFloat(treatment.price) || 0,
                originalPrice: parseFloat(treatment.originalPrice) || treatment.price,
                duration: parseInt(treatment.duration) || 30,
                description: treatment.description || '',
                shortDescription: treatment.shortDescription || '',
                
                features: Array.isArray(treatment.features) ? treatment.features : [],
                benefits: Array.isArray(treatment.benefits) ? treatment.benefits : [],
                suitableFor: Array.isArray(treatment.suitableFor) ? treatment.suitableFor : [],
                
                stylistLevel: treatment.stylistLevel || 'medium',
                popularity: parseInt(treatment.popularity) || 50,
                
                discount: {
                    active: Boolean(treatment.discount?.active),
                    percentage: parseInt(treatment.discount?.percentage) || 0,
                    validUntil: treatment.discount?.validUntil || null
                },
                
                images: Array.isArray(treatment.images) ? treatment.images : [],
                
                stats: {
                    bookingsLastMonth: treatment.stats?.bookingsLastMonth || 0,
                    satisfactionRate: treatment.stats?.satisfactionRate || 0,
                    repeatRate: treatment.stats?.repeatRate || 0,
                    averageRating: treatment.stats?.averageRating || 0
                },
                
                // Beräknade fält
                hasDiscount: Boolean(treatment.discount?.active),
                savings: treatment.originalPrice - treatment.price,
                pricePerMinute: treatment.price / treatment.duration
            };
        }).filter(treatment => treatment !== null);
    }

    /**
     * VALIDATE AND TRANSFORM USER DATA - Extremt noggrann användardatavalidering
     */
    validateAndTransformUserData(userData) {
        const currentUser = userData.currentUser || {};
        
        return {
            id: parseInt(currentUser.id) || 0,
            profile: {
                firstName: currentUser.profile?.firstName || '',
                lastName: currentUser.profile?.lastName || '',
                displayName: currentUser.profile?.displayName || '',
                email: currentUser.profile?.email || '',
                phone: currentUser.profile?.phone || '',
                avatar: currentUser.profile?.avatar || 'assets/images/users/default-avatar.jpg',
                coverImage: currentUser.profile?.coverImage || 'assets/images/users/default-cover.jpg',
                birthDate: currentUser.profile?.birthDate || null,
                gender: currentUser.profile?.gender || '',
                preferredLanguage: currentUser.profile?.preferredLanguage || 'sv',
                communicationPreferences: currentUser.profile?.communicationPreferences || {
                    email: true,
                    sms: false,
                    push: true,
                    newsletter: false
                }
            },
            
            address: currentUser.address || {},
            hairProfile: currentUser.hairProfile || {},
            preferences: currentUser.preferences || {},
            membership: currentUser.membership || {},
            paymentMethods: Array.isArray(currentUser.paymentMethods) ? currentUser.paymentMethods : [],
            statistics: currentUser.statistics || {},
            
            // Ytterligare data från root
            bookingHistory: Array.isArray(userData.bookingHistory) ? userData.bookingHistory : [],
            upcomingBookings: Array.isArray(userData.upcomingBookings) ? userData.upcomingBookings : [],
            favorites: userData.favorites || {},
            notifications: Array.isArray(userData.notifications) ? userData.notifications : [],
            aiAnalysisHistory: Array.isArray(userData.aiAnalysisHistory) ? userData.aiAnalysisHistory : [],
            loyaltyProgram: userData.loyaltyProgram || {},
            supportTickets: Array.isArray(userData.supportTickets) ? userData.supportTickets : []
        };
    }

    /**
     * CHECK IF SALON IS OPEN - Extremt noggrann öppettidskontroll
     */
    checkIfSalonIsOpen(salon) {
        if (!salon.openingHours || !Array.isArray(salon.openingHours)) {
            return false;
        }

        const now = new Date();
        const currentDay = now.toLocaleString('sv-SE', { weekday: 'long' }).toLowerCase();
        const currentTime = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
        
        const todayHours = salon.openingHours.find(hours => 
            hours.day.toLowerCase() === currentDay
        );

        if (!todayHours || !todayHours.open) {
            return false;
        }

        // Enkel tidskontroll - i en riktig app skulle detta vara mer avancerat
        return todayHours.hours !== 'Stängt';
    }

    /**
     * GET POPULAR TREATMENTS - Extremt noggrann popularitetsberäkning
     */
    getPopularTreatments(salon) {
        if (!salon.treatments || !Array.isArray(salon.treatments)) {
            return [];
        }

        return salon.treatments
            .filter(treatment => treatment.popular)
            .sort((a, b) => {
                // Sortera efter popularitet, pris, eller annan logik
                if (a.popular && !b.popular) return -1;
                if (!a.popular && b.popular) return 1;
                return a.price - b.price;
            })
            .slice(0, 3); // Max 3 populära behandlingar
    }

    /**
     * CALCULATE AVERAGE PRICE - Extremt noggrann prisberäkning
     */
    calculateAveragePrice(treatments) {
        if (!treatments || !Array.isArray(treatments) || treatments.length === 0) {
            return 0;
        }

        const total = treatments.reduce((sum, treatment) => sum + (treatment.price || 0), 0);
        return Math.round(total / treatments.length);
    }

    /**
     * FILTER SALONS - Extremt noggrant filtreringssystem
     */
    filterSalons(filters = {}) {
        if (!this.isInitialized) {
            console.warn('⚠️ DataManager not initialized');
            return [];
        }

        this.filters = { ...this.filters, ...filters };

        return this.salons.filter(salon => {
            // Behandlingsfilter
            if (this.filters.treatment && salon.treatments) {
                const hasTreatment = salon.treatments.some(t => 
                    t.category === this.filters.treatment || 
                    t.name.toLowerCase().includes(this.filters.treatment.toLowerCase())
                );
                if (!hasTreatment) return false;
            }

            // Prisfilter
            if (this.filters.price) {
                const [min, max] = this.filters.price.split('-').map(Number);
                const avgPrice = salon.averageTreatmentPrice;
                
                if (max && (avgPrice < min || avgPrice > max)) return false;
                if (!max && avgPrice < min) return false;
            }

            // Betygsfilter
            if (this.filters.rating && salon.rating < parseFloat(this.filters.rating)) {
                return false;
            }

            // Tillgänglighetsfilter
            if (this.filters.availability && !salon.availableNow) {
                return false;
            }

            // Avståndsfilter
            if (this.filters.distance && salon.distance > parseFloat(this.filters.distance)) {
                return false;
            }

            return true;
        });
    }

    /**
     * SEARCH SALONS - Extremt noggrant söksystem
     */
    searchSalons(query) {
        if (!query.trim()) return this.salons;

        const searchTerm = query.toLowerCase().trim();
        
        return this.salons.filter(salon => {
            const searchableText = `
                ${salon.name} 
                ${salon.description} 
                ${salon.shortDescription}
                ${salon.address.street}
                ${salon.address.city}
                ${salon.treatments?.map(t => t.name).join(' ') || ''}
                ${salon.features?.join(' ') || ''}
            `.toLowerCase();

            return searchableText.includes(searchTerm);
        });
    }

    /**
     * GET SALON BY ID - Extremt noggrann dataåtkomst
     */
    getSalonById(id) {
        if (!this.isInitialized) {
            console.warn('⚠️ DataManager not initialized');
            return null;
        }

        const salon = this.salons.find(s => s.id === parseInt(id));
        
        if (!salon) {
            console.warn(`⚠️ Salon with id ${id} not found`);
            return null;
        }

        return salon;
    }

    /**
     * GET TREATMENT BY ID - Extremt noggrann behandlingsåtkomst
     */
    getTreatmentById(id) {
        if (!this.isInitialized) {
            console.warn('⚠️ DataManager not initialized');
            return null;
        }

        const treatment = this.treatments.find(t => t.id === parseInt(id));
        
        if (!treatment) {
            console.warn(`⚠️ Treatment with id ${id} not found`);
            return null;
        }

        return treatment;
    }

    /**
     * GET AVAILABLE SALONS - Extremt noggrann tillgänglighetskontroll
     */
    getAvailableSalons() {
        if (!this.isInitialized) {
            console.warn('⚠️ DataManager not initialized');
            return [];
        }

        return this.salons.filter(salon => 
            salon.availableNow && salon.isOpen
        );
    }

    /**
     * GET SALONS WITH HOME SERVICE - Extremt noggrann hemfrisörskontroll
     */
    getSalonsWithHomeService() {
        if (!this.isInitialized) {
            console.warn('⚠️ DataManager not initialized');
            return [];
        }

        return this.salons.filter(salon => 
            salon.homeService.available
        );
    }

    /**
     * CACHE VALIDATION - Extremt noggrann cachehantering
     */
    isCacheValid(cacheKey) {
        if (!this.cache.has(cacheKey)) return false;
        
        const cached = this.cache.get(cacheKey);
        const age = Date.now() - cached.timestamp;
        
        return age < this.CACHE_EXPIRY;
    }

    /**
     * GENERATE SLUG - Extremt noggrann slug-generering
     */
    generateSlug(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    /**
     * ERROR HANDLING - Extremt noggrann felhantering
     */
    handleError(error, context) {
        const errorInfo = {
            context,
            message: error.message,
            timestamp: new Date().toISOString(),
            stack: error.stack
        };

        console.error('🚨 DataManager Error:', errorInfo);
        
        // Dispatch error event för global felhantering
        window.dispatchEvent(new CustomEvent('dataError', {
            detail: errorInfo
        }));

        // I en riktig app: Skicka till error tracking service
        // this.reportErrorToService(errorInfo);
    }

    /**
     * MOCK DATA FALLBACKS - Extremt noggranna mock-data för utveckling
     */
    getMockSalons() {
        return [
            {
                id: 999,
                name: "Demo Salong",
                slug: "demo-salong",
                type: "salon",
                rating: 4.5,
                reviewCount: 100,
                distance: 1.5,
                priceRange: "medium",
                availableNow: true,
                nextAvailable: "14:30",
                waitTime: "15 min",
                image: "assets/images/salons/default.jpg",
                logo: "assets/images/salons/default-logo.png",
                description: "En demonstrationssalong för utveckling",
                shortDescription: "Demo salong",
                address: {
                    street: "Demo gatan 1",
                    city: "Stockholm",
                    postalCode: "123 45",
                    country: "Sverige",
                    coordinates: { lat: 59.3293, lng: 18.0686 }
                },
                contact: {
                    phone: "+46 8 123 45 67",
                    email: "demo@example.com",
                    website: "",
                    instagram: ""
                },
                openingHours: [],
                treatments: [
                    {
                        id: 999,
                        name: "Demo Klippning",
                        price: 300,
                        duration: 30,
                        popular: true
                    }
                ],
                stylists: [],
                features: ["Demo funktion"],
                images: [],
                reviews: [],
                stats: {
                    totalBookings: 100,
                    repeatCustomers: 50,
                    responseTime: "10 min",
                    satisfactionRate: 95
                },
                homeService: {
                    available: false,
                    priceMultiplier: 1.0,
                    minOrder: 0,
                    travelFee: 0,
                    maxDistance: 0,
                    availableTimes: []
                },
                premium: {
                    isPremium: false,
                    level: "basic",
                    since: null,
                    features: []
                },
                isOpen: true,
                popularTreatments: [],
                averageTreatmentPrice: 300
            }
        ];
    }

    getMockTreatments() {
        return [
            {
                id: 999,
                name: "Demo Behandling",
                slug: "demo-behandling",
                category: "herrklippning",
                subcategory: "standard",
                price: 300,
                originalPrice: 300,
                duration: 30,
                description: "En demonstrationsbehandling",
                shortDescription: "Demo behandling",
                features: ["Demo funktion"],
                benefits: ["Demo fördel"],
                suitableFor: ["Demo användning"],
                stylistLevel: "medium",
                popularity: 50,
                discount: { active: false, percentage: 0, validUntil: null },
                images: [],
                stats: {
                    bookingsLastMonth: 10,
                    satisfactionRate: 90,
                    repeatRate: 50,
                    averageRating: 4.5
                },
                hasDiscount: false,
                savings: 0,
                pricePerMinute: 10
            }
        ];
    }

    getMockUserData() {
        return {
            id: 999,
            profile: {
                firstName: "Demo",
                lastName: "Användare",
                displayName: "Demo User",
                email: "demo@example.com",
                phone: "+46 70 123 45 67",
                avatar: "assets/images/users/default-avatar.jpg",
                coverImage: "assets/images/users/default-cover.jpg",
                birthDate: null,
                gender: "",
                preferredLanguage: "sv",
                communicationPreferences: {
                    email: true,
                    sms: false,
                    push: true,
                    newsletter: false
                }
            },
            address: {},
            hairProfile: {},
            preferences: {},
            membership: {},
            paymentMethods: [],
            statistics: {},
            bookingHistory: [],
            upcomingBookings: [],
            favorites: {},
            notifications: [],
            aiAnalysisHistory: [],
            loyaltyProgram: {},
            supportTickets: []
        };
    }

    /**
     * DATA EXPORT - Extremt noggrann dataexport för felsökning
     */
    exportData() {
        return {
            salons: this.salons,
            treatments: this.treatments,
            userData: this.userData,
            filters: this.filters,
            cacheSize: this.cache.size,
            isInitialized: this.isInitialized,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * CLEAR CACHE - Extremt noggrann cache-rengöring
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache cleared');
    }

    /**
     * DESTROY - Extremt noggrann minneshantering
     */
    destroy() {
        this.clearCache();
        this.salons = [];
        this.treatments = [];
        this.userData = null;
        this.isInitialized = false;
        console.log('♻️ DataManager destroyed');
    }
}

// Skapa global instans och exponera för global åtkomst
window.dataManager = new DataManager();

// Export för module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}
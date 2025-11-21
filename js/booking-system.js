/**
 * BOOKING-SYSTEM.JS - Extremt noggrant bokningssystem
 * Hanterar alla bokningar, tider, betalning och bekräftelser
 */

class BookingSystem {
    constructor() {
        this.currentBooking = null;
        this.bookingCart = [];
        this.availableSlots = new Map();
        this.bookingHistory = [];
        this.isInitialized = false;
        
        // Cache för snabbare åtkomst
        this.slotCache = new Map();
        this.cacheExpiry = 10 * 60 * 1000; // 10 minuter
        
        this.init();
    }

    /**
     * INIT - Extremt noggrann initiering
     */
    async init() {
        try {
            console.log('🔄 BookingSystem initializing...');
            
            // Vänta på att dataManager är redo
            if (!window.dataManager || !window.dataManager.isInitialized) {
                await new Promise(resolve => {
                    window.addEventListener('dataReady', resolve, { once: true });
                });
            }

            // Ladda bokningshistorik från användardata
            this.loadBookingHistory();
            
            // Generera tillgängliga tider
            this.generateAvailableSlots();
            
            this.isInitialized = true;
            console.log('✅ BookingSystem initialized successfully');
            
        } catch (error) {
            console.error('❌ BookingSystem initialization failed:', error);
            this.handleError(error, 'init');
        }
    }

    /**
     * LOAD BOOKING HISTORY - Extremt noggrann historikinhämtning
     */
    loadBookingHistory() {
        try {
            if (window.dataManager && window.dataManager.userData) {
                this.bookingHistory = window.dataManager.userData.bookingHistory || [];
                console.log(`📚 Loaded ${this.bookingHistory.length} historical bookings`);
            }
        } catch (error) {
            console.error('❌ Failed to load booking history:', error);
            this.bookingHistory = [];
        }
    }

    /**
     * GENERATE AVAILABLE SLOTS - Extremt noggrann tidsgenerering
     */
    generateAvailableSlots() {
        try {
            console.log('🕒 Generating available time slots...');
            
            const salons = window.dataManager.salons;
            if (!salons || !Array.isArray(salons)) {
                throw new Error('No salons data available');
            }

            // Generera slots för varje salon i 7 dagar
            salons.forEach(salon => {
                const slots = this.generateSlotsForSalon(salon, 7); // 7 dagar framåt
                this.availableSlots.set(salon.id, slots);
            });

            console.log(`✅ Generated slots for ${salons.length} salons`);
            
        } catch (error) {
            console.error('❌ Failed to generate available slots:', error);
            this.handleError(error, 'generateAvailableSlots');
        }
    }

    /**
     * GENERATE SLOTS FOR SALON - Extremt noggrann slots-generering per salon
     */
    generateSlotsForSalon(salon, daysAhead = 7) {
        const slots = [];
        const now = new Date();
        
        for (let day = 0; day < daysAhead; day++) {
            const date = new Date(now);
            date.setDate(now.getDate() + day);
            date.setHours(0, 0, 0, 0);
            
            const dateString = this.formatDate(date);
            const daySlots = this.generateSlotsForDate(salon, date);
            
            if (daySlots.length > 0) {
                slots.push({
                    date: dateString,
                    dateObj: date,
                    slots: daySlots,
                    available: daySlots.length
                });
            }
        }
        
        return slots;
    }

    /**
     * GENERATE SLOTS FOR DATE - Extremt noggrann slots-generering per datum
     */
    generateSlotsForDate(salon, date) {
        const slots = [];
        const dayOfWeek = date.getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        
        // Hitta öppettider för denna dag
        const openingHours = salon.openingHours?.find(hours => 
            hours.day === dayName && hours.open
        );
        
        if (!openingHours || openingHours.hours === 'Stängt') {
            return slots;
        }

        // Parse öppettider (enkel implementation)
        const times = this.parseOpeningHours(openingHours.hours);
        if (!times) return slots;

        const { open, close } = times;
        
        // Generera tider var 15:e minut
        const startTime = new Date(date);
        startTime.setHours(open.hours, open.minutes, 0, 0);
        
        const endTime = new Date(date);
        endTime.setHours(close.hours, close.minutes, 0, 0);
        
        const slotDuration = 15; // minuter
        let currentTime = new Date(startTime);
        
        while (currentTime < endTime) {
            // Kolla om tiden är i framtiden
            if (currentTime > new Date()) {
                const slot = {
                    time: this.formatTime(currentTime),
                    datetime: new Date(currentTime),
                    available: true,
                    stylists: this.getAvailableStylists(salon, currentTime)
                };
                
                slots.push(slot);
            }
            
            currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
        }
        
        return slots;
    }

    /**
     * PARSE OPENING HOURS - Extremt noggrann öppettidsparsning
     */
    parseOpeningHours(hoursString) {
        // Enkel parsing - i en riktig app skulle detta vara mer avancerat
        const match = hoursString.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        if (!match) return null;
        
        return {
            open: {
                hours: parseInt(match[1]),
                minutes: parseInt(match[2])
            },
            close: {
                hours: parseInt(match[3]),
                minutes: parseInt(match[4])
            }
        };
    }

    /**
     * GET AVAILABLE STYLISTS - Extremt noggrann frisörstillgänglighet
     */
    getAvailableStylists(salon, time) {
        if (!salon.stylists || !Array.isArray(salon.stylists)) {
            return [];
        }
        
        return salon.stylists.filter(stylist => {
            // Enkel tillgänglighetskontroll - i verkligheten mer komplex
            return stylist.available !== false;
        });
    }

    /**
     * CREATE BOOKING - Extremt noggrann bokningsskapande
     */
    async createBooking(bookingData) {
        try {
            if (!this.isInitialized) {
                throw new Error('BookingSystem not initialized');
            }

            // Validera bokningsdata
            this.validateBookingData(bookingData);
            
            // Kolla tillgänglighet
            await this.checkAvailability(bookingData);
            
            // Skapa bokningsobjekt
            const booking = this.buildBookingObject(bookingData);
            
            // Lägg till i cart
            this.bookingCart.push(booking);
            
            // Uppdatera UI
            this.updateBookingUI();
            
            // Visa bekräftelse
            window.uiComponents.showSuccess('Bokning tillagd i varukorgen!');
            
            console.log('📝 Booking created:', booking);
            return booking;
            
        } catch (error) {
            console.error('❌ Failed to create booking:', error);
            window.uiComponents.showError(error.message);
            throw error;
        }
    }

    /**
     * VALIDATE BOOKING DATA - Extremt noggrann datavalidering
     */
    validateBookingData(bookingData) {
        const required = ['salonId', 'treatmentId', 'date', 'time'];
        const missing = required.filter(field => !bookingData[field]);
        
        if (missing.length > 0) {
            throw new Error(`Saknar obligatoriska fält: ${missing.join(', ')}`);
        }

        // Validera datum
        const bookingDate = new Date(`${bookingData.date}T${bookingData.time}`);
        if (bookingDate <= new Date()) {
            throw new Error('Bokningstiden måste vara i framtiden');
        }

        // Validera salon och behandling
        const salon = window.dataManager.getSalonById(bookingData.salonId);
        if (!salon) {
            throw new Error('Ogiltig salon');
        }

        const treatment = salon.treatments?.find(t => t.id === bookingData.treatmentId);
        if (!treatment) {
            throw new Error('Ogiltig behandling för den valda salongen');
        }
    }

    /**
     * CHECK AVAILABILITY - Extremt noggrann tillgänglighetskontroll
     */
    async checkAvailability(bookingData) {
        const salonId = bookingData.salonId;
        const date = bookingData.date;
        const time = bookingData.time;
        
        // Kolla cache först
        const cacheKey = `${salonId}_${date}_${time}`;
        if (this.slotCache.has(cacheKey)) {
            const cached = this.slotCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                if (!cached.available) {
                    throw new Error('Tiden är inte längre tillgänglig');
                }
                return;
            }
        }

        // Simulerad API-anrop för tillgänglighet
        const isAvailable = await this.simulateAvailabilityCheck(bookingData);
        
        // Spara i cache
        this.slotCache.set(cacheKey, {
            available: isAvailable,
            timestamp: Date.now()
        });

        if (!isAvailable) {
            throw new Error('Tiden är inte längre tillgänglig');
        }
    }

    /**
     * SIMULATE AVAILABILITY CHECK - Extremt noggrann tillgänglighetssimulation
     */
    async simulateAvailabilityCheck(bookingData) {
        // Simulera API-anrop med delay
        return new Promise(resolve => {
            setTimeout(() => {
                // 90% chans att tiden är tillgänglig
                const isAvailable = Math.random() > 0.1;
                resolve(isAvailable);
            }, 300);
        });
    }

    /**
     * BUILD BOOKING OBJECT - Extremt noggrann bokningsbyggnad
     */
    buildBookingObject(bookingData) {
        const salon = window.dataManager.getSalonById(bookingData.salonId);
        const treatment = salon.treatments.find(t => t.id === bookingData.treatmentId);
        const stylist = bookingData.stylistId ? 
            salon.stylists.find(s => s.id === bookingData.stylistId) : null;
        
        const bookingId = `B_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const bookingDate = new Date(`${bookingData.date}T${bookingData.time}`);
        const endTime = new Date(bookingDate.getTime() + treatment.duration * 60000);
        
        return {
            id: bookingId,
            salonId: bookingData.salonId,
            salonName: salon.name,
            treatmentId: bookingData.treatmentId,
            treatmentName: treatment.name,
            stylistId: stylist?.id,
            stylistName: stylist?.name,
            date: bookingData.date,
            time: bookingData.time,
            datetime: bookingDate,
            endTime: endTime,
            duration: treatment.duration,
            price: treatment.price,
            originalPrice: treatment.originalPrice,
            status: 'pending',
            notes: bookingData.notes || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    /**
     * UPDATE BOOKING UI - Extremt noggrann UI-uppdatering
     */
    updateBookingUI() {
        // Uppdatera cart count i header
        this.updateCartCount();
        
        // Dispatch event för andra komponenter
        window.dispatchEvent(new CustomEvent('bookingCartUpdated', {
            detail: {
                cart: this.bookingCart,
                count: this.bookingCart.length
            }
        }));
    }

    /**
     * UPDATE CART COUNT - Extremt noggrann varukorgsräknare
     */
    updateCartCount() {
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(element => {
            element.textContent = this.bookingCart.length;
            element.style.display = this.bookingCart.length > 0 ? 'flex' : 'none';
        });
    }

    /**
     * GET AVAILABLE SLOTS FOR SALON - Extremt noggrann slots-hämtning
     */
    getAvailableSlotsForSalon(salonId, date) {
        if (!this.availableSlots.has(salonId)) {
            return [];
        }
        
        const salonSlots = this.availableSlots.get(salonId);
        const dateSlots = salonSlots.find(day => day.date === date);
        
        return dateSlots ? dateSlots.slots : [];
    }

    /**
     * GET BOOKING SUMMARY - Extremt noggrann bokningssammanfattning
     */
    getBookingSummary() {
        if (this.bookingCart.length === 0) {
            return null;
        }

        const total = this.bookingCart.reduce((sum, booking) => sum + booking.price, 0);
        const savings = this.bookingCart.reduce((sum, booking) => 
            sum + (booking.originalPrice - booking.price), 0
        );

        return {
            totalBookings: this.bookingCart.length,
            totalPrice: total,
            totalSavings: savings,
            estimatedDuration: this.bookingCart.reduce((sum, booking) => sum + booking.duration, 0),
            bookings: this.bookingCart
        };
    }

    /**
     * REMOVE BOOKING FROM CART - Extremt noggrann borttagning från varukorg
     */
    removeBookingFromCart(bookingId) {
        const index = this.bookingCart.findIndex(booking => booking.id === bookingId);
        if (index === -1) {
            throw new Error('Bokning hittades inte i varukorgen');
        }

        this.bookingCart.splice(index, 1);
        this.updateBookingUI();
        
        window.uiComponents.showInfo('Bokning borttagen från varukorgen');
    }

    /**
     * CLEAR BOOKING CART - Extremt noggrann varukorgsrensning
     */
    clearBookingCart() {
        this.bookingCart = [];
        this.updateBookingUI();
        console.log('🛒 Booking cart cleared');
    }

    /**
     * PROCESS PAYMENT - Extremt noggrann betalningsprocess
     */
    async processPayment(paymentData) {
        try {
            if (this.bookingCart.length === 0) {
                throw new Error('Inga bokningar att betala');
            }

            // Validera betalningsdata
            this.validatePaymentData(paymentData);
            
            // Visa loading
            const loadingId = window.uiComponents.showLoading(document.body, {
                text: 'Bearbetar betalning...',
                overlay: true
            });

            try {
                // Simulera betalningsprocess
                const paymentResult = await this.simulatePayment(paymentData);
                
                // Skapa bokningar
                const confirmedBookings = await this.confirmBookings();
                
                // Rensa varukorg
                this.clearBookingCart();
                
                // Dölj loading
                window.uiComponents.hideLoading(loadingId);
                
                // Visa bekräftelse
                this.showBookingConfirmation(confirmedBookings);
                
                return {
                    success: true,
                    bookings: confirmedBookings,
                    payment: paymentResult
                };
                
            } catch (error) {
                window.uiComponents.hideLoading(loadingId);
                throw error;
            }
            
        } catch (error) {
            console.error('❌ Payment processing failed:', error);
            window.uiComponents.showError(error.message);
            throw error;
        }
    }

    /**
     * VALIDATE PAYMENT DATA - Extremt noggrann betalningsvalidering
     */
    validatePaymentData(paymentData) {
        if (!paymentData.method) {
            throw new Error('Betalningsmetod krävs');
        }

        if (paymentData.method === 'card') {
            if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvc) {
                throw new Error('Ofullständig kortinformation');
            }
        }

        if (paymentData.method === 'swish' && !paymentData.phone) {
            throw new Error('Swish-nummer krävs');
        }
    }

    /**
     * SIMULATE PAYMENT - Extremt noggrann betalningssimulering
     */
    async simulatePayment(paymentData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // 95% chans för framgångsrik betalning
                if (Math.random() > 0.05) {
                    resolve({
                        id: `PAY_${Date.now()}`,
                        method: paymentData.method,
                        amount: this.getBookingSummary().totalPrice,
                        status: 'completed',
                        timestamp: new Date()
                    });
                } else {
                    reject(new Error('Betalningen misslyckades. Försök igen.'));
                }
            }, 2000);
        });
    }

    /**
     * CONFIRM BOOKINGS - Extremt noggrann bokningsbekräftelse
     */
    async confirmBookings() {
        const confirmedBookings = this.bookingCart.map(booking => ({
            ...booking,
            status: 'confirmed',
            confirmedAt: new Date()
        }));

        // Lägg till i historik
        this.bookingHistory.push(...confirmedBookings);
        
        // Spara till localStorage (i en riktig app: skicka till backend)
        this.saveBookingHistory();
        
        return confirmedBookings;
    }

    /**
     * SHOW BOOKING CONFIRMATION - Extremt noggrann bekräftelsevisning
     */
    showBookingConfirmation(bookings) {
        const summary = this.getBookingSummary();
        
        const confirmationHTML = `
            <div class="booking-confirmation">
                <div class="confirmation-header">
                    <i class="fas fa-check-circle confirmation-icon"></i>
                    <h3>Bokning Bekräftad!</h3>
                </div>
                <div class="confirmation-body">
                    <p>Tack för din bokning! Du har bokat ${summary.totalBookings} behandlingar.</p>
                    <div class="booking-details">
                        ${bookings.map(booking => `
                            <div class="booking-detail">
                                <strong>${booking.salonName}</strong><br>
                                ${booking.treatmentName} - ${booking.date} ${booking.time}<br>
                                ${booking.stylistName ? `Frisör: ${booking.stylistName}` : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div class="confirmation-total">
                        <strong>Totalt: ${summary.totalPrice} kr</strong>
                        ${summary.totalSavings > 0 ? 
                            `<br><small>Du sparade: ${summary.totalSavings} kr</small>` : ''}
                    </div>
                </div>
            </div>
        `;

        window.uiComponents.showSuccess('Bokningarna är nu bekräftade!', {
            duration: 8000,
            action: {
                label: 'Visa detaljer',
                handler: () => {
                    // Visa detaljerad bekräftelse
                    window.uiComponents.showModal('bookingConfirmationModal', {
                        onOpen: () => {
                            const modalBody = document.getElementById('bookingConfirmationModal');
                            if (modalBody) {
                                modalBody.innerHTML = confirmationHTML;
                            }
                        }
                    });
                }
            }
        });
    }

    /**
     * SAVE BOOKING HISTORY - Extremt noggrann historiksparning
     */
    saveBookingHistory() {
        try {
            // Spara till localStorage
            localStorage.setItem('neoncut_booking_history', JSON.stringify(this.bookingHistory));
            console.log('💾 Booking history saved to localStorage');
        } catch (error) {
            console.error('❌ Failed to save booking history:', error);
        }
    }

    /**
     * LOAD BOOKING HISTORY FROM STORAGE - Extremt noggrann historiklassning
     */
    loadBookingHistoryFromStorage() {
        try {
            const stored = localStorage.getItem('neoncut_booking_history');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    this.bookingHistory = parsed;
                    console.log(`📚 Loaded ${this.bookingHistory.length} bookings from storage`);
                }
            }
        } catch (error) {
            console.error('❌ Failed to load booking history from storage:', error);
        }
    }

    /**
     * FORMAT DATE - Extremt noggrann datumformatering
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * FORMAT TIME - Extremt noggrann tidsformatering
     */
    formatTime(date) {
        return date.toTimeString().substring(0, 5);
    }

    /**
     * ERROR HANDLING - Extremt noggrann felhantering
     */
    handleError(error, context) {
        const errorInfo = {
            context,
            message: error.message,
            timestamp: new Date().toISOString(),
            cartSize: this.bookingCart.length
        };

        console.error('🚨 BookingSystem Error:', errorInfo);
        
        window.dispatchEvent(new CustomEvent('bookingError', {
            detail: errorInfo
        }));
    }

    /**
     * DESTROY - Extremt noggrann cleanup
     */
    destroy() {
        this.bookingCart = [];
        this.availableSlots.clear();
        this.slotCache.clear();
        this.isInitialized = false;
        
        console.log('♻️ BookingSystem destroyed');
    }
}

// Global instans
window.bookingSystem = new BookingSystem();

// Export för module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookingSystem;
}
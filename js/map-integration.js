/**
 * MAP-INTEGRATION.JS - Extremt noggrant karthanteringssystem
 * Hanterar kartvisning, lokalisering, geocoding och ruttplanering
 */

class MapIntegration {
    constructor() {
        this.map = null;
        this.markers = new Map();
        this.userLocation = null;
        this.geocoder = null;
        this.directionsService = null;
        this.directionsRenderer = null;
        this.isInitialized = false;
        this.mapContainer = null;
        
        // Map configuration
        this.mapConfig = {
            defaultCenter: { lat: 59.3293, lng: 18.0686 }, // Stockholm
            defaultZoom: 12,
            minZoom: 10,
            maxZoom: 18,
            mapStyles: this.getMapStyles(),
            mapOptions: {
                zoomControl: true,
                mapTypeControl: false,
                scaleControl: true,
                streetViewControl: false,
                rotateControl: true,
                fullscreenControl: true
            }
        };

        this.init();
    }

    /**
     * INIT - Extremt noggrann initiering
     */
    async init() {
        try {
            console.log('🔄 MapIntegration initializing...');
            
            // Vänta på att dataManager är redo
            if (!window.dataManager || !window.dataManager.isInitialized) {
                await new Promise(resolve => {
                    window.addEventListener('dataReady', resolve, { once: true });
                });
            }

            // Setup map container
            this.setupMapContainer();
            
            // Load Google Maps API
            await this.loadGoogleMapsAPI();
            
            // Initialize map
            this.initializeMap();
            
            // Setup geolocation
            this.setupGeolocation();
            
            this.isInitialized = true;
            console.log('✅ MapIntegration initialized successfully');
            
        } catch (error) {
            console.error('❌ MapIntegration initialization failed:', error);
            this.handleError(error, 'init');
        }
    }

    /**
     * SETUP MAP CONTAINER - Extremt noggrann container setup
     */
    setupMapContainer() {
        // Hitta eller skapa map container
        this.mapContainer = document.getElementById('mapContainer') || 
                           document.querySelector('.map-container');
        
        if (!this.mapContainer) {
            console.warn('⚠️ Map container not found, creating fallback...');
            this.createFallbackMapContainer();
        }

        // Säkerställ att containern har rätt styling
        this.mapContainer.style.position = 'relative';
        this.mapContainer.style.overflow = 'hidden';
        this.mapContainer.style.borderRadius = '16px';
    }

    /**
     * CREATE FALLBACK MAP CONTAINER - Extremt noggrann fallback container
     */
    createFallbackMapContainer() {
        this.mapContainer = document.createElement('div');
        this.mapContainer.id = 'mapContainer';
        this.mapContainer.className = 'map-container';
        this.mapContainer.innerHTML = `
            <div class="map-placeholder">
                <i class="fas fa-map-marked-alt"></i>
                <p>Kartan laddas...</p>
                <div class="loading-spinner"></div>
            </div>
        `;
        
        // Lägg till i DOM
        const dropInScreen = document.getElementById('dropInScreen');
        if (dropInScreen) {
            const existingMap = dropInScreen.querySelector('.map-container');
            if (existingMap) {
                existingMap.replaceWith(this.mapContainer);
            } else {
                dropInScreen.querySelector('.screen-content')?.prepend(this.mapContainer);
            }
        }
    }

    /**
     * LOAD GOOGLE MAPS API - Extremt noggrann API-inladdning
     */
    loadGoogleMapsAPI() {
        return new Promise((resolve, reject) => {
            // Kolla om Google Maps redan är laddat
            if (window.google && window.google.maps) {
                console.log('🗺️ Google Maps API already loaded');
                resolve();
                return;
            }

            // API key skulle i verkligheten komma från config
            const apiKey = 'AIzaSyB_CUSTOM_API_KEY_HERE'; // Ersätt med riktig key
            const script = document.createElement('script');
            
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                console.log('✅ Google Maps API loaded successfully');
                resolve();
            };
            
            script.onerror = () => {
                reject(new Error('Failed to load Google Maps API'));
            };
            
            document.head.appendChild(script);
            
            // Timeout fallback
            setTimeout(() => {
                if (!window.google) {
                    reject(new Error('Google Maps API loading timeout'));
                }
            }, 10000);
        });
    }

    /**
     * INITIALIZE MAP - Extremt noggrann kartinitiering
     */
    initializeMap() {
        try {
            if (!window.google || !window.google.maps) {
                throw new Error('Google Maps API not available');
            }

            // Skapa kartinstans
            this.map = new google.maps.Map(this.mapContainer, {
                center: this.mapConfig.defaultCenter,
                zoom: this.mapConfig.defaultZoom,
                minZoom: this.mapConfig.minZoom,
                maxZoom: this.mapConfig.maxZoom,
                styles: this.mapConfig.mapStyles,
                ...this.mapConfig.mapOptions
            });

            // Initiera services
            this.geocoder = new google.maps.Geocoder();
            this.directionsService = new google.maps.DirectionsService();
            this.directionsRenderer = new google.maps.DirectionsRenderer({
                map: this.map,
                suppressMarkers: true,
                preserveViewport: true
            });

            // Event listeners för karta
            this.setupMapEventListeners();
            
            // Lägg till salonger på kartan
            this.addSalonsToMap();
            
            console.log('🗺️ Google Map initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize map:', error);
            this.showMapFallback();
            throw error;
        }
    }

    /**
     * SETUP MAP EVENT LISTENERS - Extremt noggrann event setup
     */
    setupMapEventListeners() {
        // Kartans laddning event
        google.maps.event.addListenerOnce(this.map, 'idle', () => {
            console.log('🗺️ Map fully loaded and rendered');
            this.mapContainer.querySelector('.map-placeholder')?.remove();
        });

        // Klick event på karta
        this.map.addListener('click', (event) => {
            this.handleMapClick(event);
        });

        // Zoom change event
        this.map.addListener('zoom_changed', () => {
            this.handleZoomChange();
        });

        // Bounds change event
        this.map.addListener('bounds_changed', () => {
            this.handleBoundsChange();
        });
    }

    /**
     * ADD SALONS TO MAP - Extremt noggrann salongsmarkering
     */
    addSalonsToMap() {
        if (!window.dataManager || !window.dataManager.salons) {
            console.warn('⚠️ No salon data available for map');
            return;
        }

        const salons = window.dataManager.salons;
        
        salons.forEach(salon => {
            if (salon.address?.coordinates) {
                this.addSalonMarker(salon);
            }
        });

        console.log(`📍 Added ${this.markers.size} salon markers to map`);
        
        // Anpassa kartvyn till att visa alla markörer
        this.fitMapToMarkers();
    }

    /**
     * ADD SALON MARKER - Extremt noggrann markörskapande
     */
    addSalonMarker(salon) {
        try {
            const coordinates = salon.address.coordinates;
            
            // Skapa markör
            const marker = new google.maps.Marker({
                position: coordinates,
                map: this.map,
                title: salon.name,
                icon: this.getMarkerIcon(salon),
                animation: google.maps.Animation.DROP
            });

            // Skapa info window
            const infoWindow = new google.maps.InfoWindow({
                content: this.createMarkerInfoContent(salon),
                maxWidth: 300
            });

            // Event listeners för markör
            marker.addListener('click', () => {
                this.handleMarkerClick(salon, marker, infoWindow);
            });

            // Spara markör för framtida referens
            this.markers.set(salon.id, {
                marker: marker,
                infoWindow: infoWindow,
                salon: salon
            });

        } catch (error) {
            console.error(`❌ Failed to add marker for salon ${salon.id}:`, error);
        }
    }

    /**
     * GET MARKER ICON - Extremt noggrann ikonhantering
     */
    getMarkerIcon(salon) {
        // Anpassad ikon baserat på salongstyp och tillgänglighet
        const baseIcon = {
            url: this.getMarkerSVG(salon),
            scaledSize: new google.maps.Size(40, 40),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(20, 40)
        };

        return baseIcon;
    }

    /**
     * GET MARKER SVG - Extremt noggrann SVG-generering
     */
    getMarkerSVG(salon) {
        const color = salon.availableNow ? '#ff6b6b' : '#4ecdc4';
        const symbol = salon.type === 'barbershop' ? '✂️' : '💇';
        
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="${color}" stroke="#ffffff" stroke-width="2"/>
                <text x="20" y="26" font-family="Arial" font-size="14" fill="#ffffff" text-anchor="middle">${symbol}</text>
            </svg>
        `)}`;
    }

    /**
     * CREATE MARKER INFO CONTENT - Extremt noggrann info window content
     */
    createMarkerInfoContent(salon) {
        const availableText = salon.availableNow ? 
            `<div class="availability available">Ledig nu!</div>` :
            `<div class="availability unavailable">Ej tillgänglig</div>`;
        
        const ratingStars = '⭐'.repeat(Math.floor(salon.rating)) + 
                           (salon.rating % 1 >= 0.5 ? '½' : '');
        
        return `
            <div class="map-info-window">
                <h4>${salon.name}</h4>
                <div class="rating">${ratingStars} ${salon.rating} (${salon.reviewCount} recensioner)</div>
                ${availableText}
                <p class="address">${salon.address.street}, ${salon.address.city}</p>
                <p class="distance">${salon.distance} km härifrån</p>
                <div class="actions">
                    <button onclick="mapIntegration.openSalonDetails(${salon.id})" class="btn-info">
                        Visa detaljer
                    </button>
                    <button onclick="mapIntegration.getDirections(${salon.id})" class="btn-primary">
                        Visa vägbeskrivning
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * HANDLE MARKER CLICK - Extremt noggrann markörklickhantering
     */
    handleMarkerClick(salon, marker, infoWindow) {
        // Stäng alla öppna info windows
        this.closeAllInfoWindows();
        
        // Öppna info window för denna markör
        infoWindow.open(this.map, marker);
        
        // Centrera kartan på markören
        this.map.panTo(marker.getPosition());
        
        // Animera markören
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
            marker.setAnimation(null);
        }, 1400);
        
        console.log(`📍 Marker clicked: ${salon.name}`);
    }

    /**
     * CLOSE ALL INFO WINDOWS - Extremt noggrann window-hantering
     */
    closeAllInfoWindows() {
        this.markers.forEach(({ infoWindow }) => {
            infoWindow.close();
        });
    }

    /**
     * FIT MAP TO MARKERS - Extremt noggrann kartanpassning
     */
    fitMapToMarkers() {
        if (this.markers.size === 0) return;

        const bounds = new google.maps.LatLngBounds();
        
        this.markers.forEach(({ marker }) => {
            bounds.extend(marker.getPosition());
        });

        // Lägg till användarens position om tillgänglig
        if (this.userLocation) {
            bounds.extend(this.userLocation);
        }

        this.map.fitBounds(bounds, {
            padding: 50,
            maxZoom: 15
        });
    }

    /**
     * SETUP GEOLOCATION - Extremt noggrann lokalisering
     */
    setupGeolocation() {
        if (!navigator.geolocation) {
            console.warn('⚠️ Geolocation not supported by browser');
            return;
        }

        // Försök hämta användarens position
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.handleGeolocationSuccess(position);
            },
            (error) => {
                this.handleGeolocationError(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }

    /**
     * HANDLE GEOLOCATION SUCCESS - Extremt noggrann lyckad lokalisering
     */
    handleGeolocationSuccess(position) {
        const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        this.userLocation = userLocation;
        
        // Lägg till användarmarkör
        this.addUserLocationMarker(userLocation);
        
        // Uppdatera kartvyn
        this.updateMapViewWithUserLocation(userLocation);
        
        // Uppdatera avstånd till salonger
        this.updateSalonDistances(userLocation);
        
        console.log('📍 User location detected:', userLocation);
    }

    /**
     * HANDLE GEOLOCATION ERROR - Extremt noggrann lokiseringsfel
     */
    handleGeolocationError(error) {
        console.warn('⚠️ Geolocation failed:', error.message);
        
        // Använd standardposition
        this.userLocation = this.mapConfig.defaultCenter;
        
        // Visa varning för användaren
        window.uiComponents.showInfo(
            'Kunde inte hitta din position. Använder standardkarta.',
            { duration: 5000 }
        );
    }

    /**
     * ADD USER LOCATION MARKER - Extremt noggrann användarmarkör
     */
    addUserLocationMarker(location) {
        const userMarker = new google.maps.Marker({
            position: location,
            map: this.map,
            title: 'Din plats',
            icon: {
                url: this.getUserLocationSVG(),
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16)
            },
            zIndex: 1000
        });

        // Spara användarmarkör
        this.markers.set('user', {
            marker: userMarker,
            salon: null,
            isUser: true
        });
    }

    /**
     * GET USER LOCATION SVG - Extremt noggrann användar-SVG
     */
    getUserLocationSVG() {
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#4285f4" opacity="0.8"/>
                <circle cx="16" cy="16" r="6" fill="#ffffff"/>
                <circle cx="16" cy="16" r="3" fill="#4285f4"/>
            </svg>
        `)}`;
    }

    /**
     * UPDATE MAP VIEW WITH USER LOCATION - Extremt noggrann kartuppdatering
     */
    updateMapViewWithUserLocation(userLocation) {
        // Centrera kartan på användaren
        this.map.panTo(userLocation);
        
        // Zooma in lite
        if (this.map.getZoom() < 14) {
            this.map.setZoom(14);
        }
    }

    /**
     * UPDATE SALON DISTANCES - Extremt noggrann avståndsberäkning
     */
    updateSalonDistances(userLocation) {
        if (!window.dataManager) return;

        window.dataManager.salons.forEach(salon => {
            if (salon.address?.coordinates) {
                const distance = this.calculateDistance(
                    userLocation,
                    salon.address.coordinates
                );
                
                // Uppdatera salongens avstånd
                salon.distance = parseFloat(distance.toFixed(1));
                
                // Uppdatera markör om den finns
                const markerData = this.markers.get(salon.id);
                if (markerData) {
                    // Uppdatera info window content
                    markerData.infoWindow.setContent(
                        this.createMarkerInfoContent(salon)
                    );
                }
            }
        });

        console.log('📏 Updated salon distances from user location');
    }

    /**
     * CALCULATE DISTANCE - Extremt noggrann avståndsberäkning (Haversine)
     */
    calculateDistance(coord1, coord2) {
        const R = 6371; // Jordens radie i km
        const dLat = this.deg2rad(coord2.lat - coord1.lat);
        const dLon = this.deg2rad(coord2.lng - coord1.lng);
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(coord1.lat)) * Math.cos(this.deg2rad(coord2.lat)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance;
    }

    /**
     * DEG2RAD - Extremt noggrann grad-omvandling
     */
    deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    /**
     * GET DIRECTIONS - Extremt noggrann ruttbeskrivning
     */
    async getDirections(salonId) {
        try {
            if (!this.userLocation) {
                throw new Error('Kan inte hitta din position för vägbeskrivning');
            }

            const markerData = this.markers.get(salonId);
            if (!markerData) {
                throw new Error('Salong hittades inte på kartan');
            }

            const salon = markerData.salon;
            const destination = salon.address.coordinates;

            // Visa loading
            const loadingId = window.uiComponents.showLoading(this.mapContainer, {
                text: 'Beräknar rutt...'
            });

            // Beräkna rutt
            const route = await this.calculateRoute(this.userLocation, destination);
            
            // Visa rutt på kartan
            this.displayRoute(route);
            
            // Visa ruttinformation
            this.showRouteInfo(route, salon);
            
            // Dölj loading
            window.uiComponents.hideLoading(loadingId);
            
            console.log(`🛣️ Directions calculated to ${salon.name}`);
            
        } catch (error) {
            console.error('❌ Failed to get directions:', error);
            window.uiComponents.showError('Kunde inte beräkna rutt: ' + error.message);
        }
    }

    /**
     * CALCULATE ROUTE - Extremt noggrann rutthantering
     */
    calculateRoute(origin, destination) {
        return new Promise((resolve, reject) => {
            this.directionsService.route({
                origin: origin,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING,
                provideRouteAlternatives: false,
                unitSystem: google.maps.UnitSystem.METRIC
            }, (result, status) => {
                if (status === 'OK') {
                    resolve(result);
                } else {
                    reject(new Error(`Directions request failed: ${status}`));
                }
            });
        });
    }

    /**
     * DISPLAY ROUTE - Extremt noggrann ruttdisplay
     */
    displayRoute(route) {
        // Rensa tidigare rutt
        this.directionsRenderer.setDirections(null);
        
        // Visa ny rutt
        this.directionsRenderer.setDirections(route);
        
        // Anpassa kartvyn till rutten
        const bounds = new google.maps.LatLngBounds();
        route.routes[0].legs[0].steps.forEach(step => {
            bounds.union(step.lat_lngs);
        });
        this.map.fitBounds(bounds);
    }

    /**
     * SHOW ROUTE INFO - Extremt noggrann ruttinformation
     */
    showRouteInfo(route, salon) {
        const leg = route.routes[0].legs[0];
        
        const infoHTML = `
            <div class="route-info">
                <h4>Vägbeskrivning till ${salon.name}</h4>
                <div class="route-summary">
                    <div class="distance">Avstånd: ${leg.distance.text}</div>
                    <div class="duration">Tid: ${leg.duration.text}</div>
                </div>
                <div class="route-steps">
                    ${leg.steps.map((step, index) => `
                        <div class="route-step">
                            <span class="step-number">${index + 1}.</span>
                            <span class="step-instruction">${step.instructions}</span>
                            <span class="step-distance">${step.distance.text}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Visa info i modal
        window.uiComponents.showModal('routeInfoModal', {
            onOpen: () => {
                const modalBody = document.getElementById('routeInfoModal');
                if (modalBody) {
                    modalBody.innerHTML = infoHTML;
                }
            }
        });
    }

    /**
     * OPEN SALON DETAILS - Extremt noggrann salongsdetaljvisning
     */
    openSalonDetails(salonId) {
        // Stäng kartans info window
        this.closeAllInfoWindows();
        
        // Öppna salongsdetaljmodal
        const salon = window.dataManager.getSalonById(salonId);
        if (salon) {
            // Här skulle vi öppna salongsdetaljvyn
            console.log(`📋 Opening details for salon: ${salon.name}`);
            
            // Dispatch event för andra komponenter
            window.dispatchEvent(new CustomEvent('salonSelectedFromMap', {
                detail: { salon }
            }));
        }
    }

    /**
     * HANDLE MAP CLICK - Extremt noggrann kartklickhantering
     */
    handleMapClick(event) {
        // Rensa valda markörer
        this.closeAllInfoWindows();
        
        // Eventuell framtida funktionalitet för kartklick
        console.log('🗺️ Map clicked at:', event.latLng.toString());
    }

    /**
     * HANDLE ZOOM CHANGE - Extremt noggrann zoomhantering
     */
    handleZoomChange() {
        const zoom = this.map.getZoom();
        // Eventuell anpassning baserat på zoomnivå
    }

    /**
     * HANDLE BOUNDS CHANGE - Extremt noggrann bounds-hantering
     */
    handleBoundsChange() {
        // Eventuell dynamisk datahämtning baserat på synligt område
    }

    /**
     * GET MAP STYLES - Extremt noggrann kartstilskonfiguration
     */
    getMapStyles() {
        // Mörkt tema som matchar neon-designen
        return [
            {
                "elementType": "geometry",
                "stylers": [{ "color": "#1a1a2e" }]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#757575" }]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [{ "color": "#1a1a2e" }]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "poi",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "road",
                "elementType": "geometry.fill",
                "stylers": [{ "color": "#2c2c54" }]
            },
            {
                "featureType": "road",
                "elementType": "geometry.stroke",
                "stylers": [{ "color": "#212a37" }]
            },
            {
                "featureType": "road",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#9ca5b3" }]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [{ "color": "#746855" }]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [{ "color": "#1f2835" }]
            },
            {
                "featureType": "transit",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{ "color": "#17263c" }]
            },
            {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#515c6d" }]
            }
        ];
    }

    /**
     * SHOW MAP FALLBACK - Extremt noggrann fallback-visning
     */
    showMapFallback() {
        this.mapContainer.innerHTML = `
            <div class="map-fallback">
                <i class="fas fa-map-marked-alt fallback-icon"></i>
                <h3>Kartan kunde inte laddas</h3>
                <p>Vi kunde inte ladda Google Maps. Salongerna visas i listan nedan.</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    Försök igen
                </button>
            </div>
        `;
    }

    /**
     * ERROR HANDLING - Extremt noggrann felhantering
     */
    handleError(error, context) {
        const errorInfo = {
            context,
            message: error.message,
            timestamp: new Date().toISOString(),
            mapInitialized: this.map !== null
        };

        console.error('🚨 MapIntegration Error:', errorInfo);
        
        window.dispatchEvent(new CustomEvent('mapError', {
            detail: errorInfo
        }));
    }

    /**
     * DESTROY - Extremt noggrann cleanup
     */
    destroy() {
        // Rensa alla markörer
        this.markers.forEach(({ marker }) => {
            marker.setMap(null);
        });
        this.markers.clear();
        
        // Rensa kartinstans
        if (this.map) {
            google.maps.event.clearInstanceListeners(this.map);
            this.map = null;
        }
        
        this.isInitialized = false;
        
        console.log('♻️ MapIntegration destroyed');
    }
}

// Global instans
window.mapIntegration = new MapIntegration();

// Export för module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapIntegration;
}
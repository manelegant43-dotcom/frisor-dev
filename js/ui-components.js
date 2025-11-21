/**
 * UI-COMPONENTS.JS - Extremt noggrant UI komponentsystem
 * Hanterar modal, notifications, loading states, och alla UI interaktioner
 */

class UIComponents {
    constructor() {
        this.modals = new Map();
        this.notifications = new Set();
        this.loadingStates = new Map();
        this.toastContainer = null;
        this.currentZIndex = 1000;
        
        this.init();
    }

    /**
     * INIT - Extremt noggrann initiering
     */
    init() {
        try {
            console.log('🔄 UIComponents initializing...');
            
            this.createToastContainer();
            this.setupGlobalEventListeners();
            this.initializeModals();
            
            console.log('✅ UIComponents initialized successfully');
            
        } catch (error) {
            console.error('❌ UIComponents initialization failed:', error);
            this.handleError(error, 'init');
        }
    }

    /**
     * CREATE TOAST CONTAINER - Extremt noggrann container skapande
     */
    createToastContainer() {
        // Skapa container för notifications om den inte finns
        if (!document.getElementById('notificationContainer')) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'notificationContainer';
            this.toastContainer.className = 'notification-container';
            document.body.appendChild(this.toastContainer);
        } else {
            this.toastContainer = document.getElementById('notificationContainer');
        }
    }

    /**
     * SETUP GLOBAL EVENT LISTENERS - Extremt noggrann event setup
     */
    setupGlobalEventListeners() {
        // Klick utanför modal för att stänga
        document.addEventListener('click', (e) => {
            this.handleOutsideClick(e);
        });

        // ESC tangent för att stänga modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Auto-stäng notifications efter timeout
        this.setupNotificationAutoClose();
    }

    /**
     * INITIALIZE MODALS - Extremt noggrann modal initiering
     */
    initializeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            const modalId = modal.id;
            this.modals.set(modalId, {
                element: modal,
                isOpen: false,
                onCloseCallbacks: []
            });

            // Setup close buttons
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeModal(modalId);
                });
            }
        });
    }

    /**
     * MODAL SYSTEM - Extremt noggrant modalsystem
     */

    /**
     * SHOW MODAL - Extremt noggrann modal visning
     */
    showModal(modalId, options = {}) {
        try {
            if (!this.modals.has(modalId)) {
                console.warn(`⚠️ Modal ${modalId} not found`);
                return false;
            }

            const modal = this.modals.get(modalId);
            if (modal.isOpen) {
                console.log(`ℹ️ Modal ${modalId} is already open`);
                return true;
            }

            // Stäng andra öppna modals först
            if (options.closeOthers !== false) {
                this.closeAllModals();
            }

            // Sätt z-index
            this.currentZIndex += 10;
            modal.element.style.zIndex = this.currentZIndex;

            // Visa modal
            modal.element.classList.remove('hidden');
            modal.isOpen = true;

            // Disable body scroll
            document.body.style.overflow = 'hidden';

            // Animera in
            this.animateModalIn(modal.element);

            // Focus management
            this.trapFocus(modal.element);

            // Callback
            if (options.onOpen) {
                options.onOpen();
            }

            // Dispatch event
            this.dispatchModalEvent('modalOpened', modalId);

            console.log(`📦 Modal ${modalId} opened`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to show modal ${modalId}:`, error);
            this.handleError(error, 'showModal');
            return false;
        }
    }

    /**
     * CLOSE MODAL - Extremt noggrann modal stängning
     */
    closeModal(modalId, options = {}) {
        try {
            if (!this.modals.has(modalId)) {
                console.warn(`⚠️ Modal ${modalId} not found`);
                return false;
            }

            const modal = this.modals.get(modalId);
            if (!modal.isOpen) {
                return true;
            }

            // Animera ut
            this.animateModalOut(modal.element, () => {
                // Dölj modal
                modal.element.classList.add('hidden');
                modal.isOpen = false;

                // Återställ body scroll om inga modals är öppna
                if (!this.anyModalOpen()) {
                    document.body.style.overflow = '';
                }

                // Callback
                modal.onCloseCallbacks.forEach(callback => {
                    try {
                        callback();
                    } catch (error) {
                        console.error('Error in modal close callback:', error);
                    }
                });

                // Rensa callbacks
                modal.onCloseCallbacks = [];

                // Options callback
                if (options.onClose) {
                    options.onClose();
                }

                // Dispatch event
                this.dispatchModalEvent('modalClosed', modalId);
            });

            console.log(`📦 Modal ${modalId} closed`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to close modal ${modalId}:`, error);
            this.handleError(error, 'closeModal');
            return false;
        }
    }

    /**
     * CLOSE ALL MODALS - Extremt noggrann stängning av alla modals
     */
    closeAllModals() {
        this.modals.forEach((modal, modalId) => {
            if (modal.isOpen) {
                this.closeModal(modalId);
            }
        });
    }

    /**
     * ANIMATE MODAL IN - Extremt noggrann modal in-animation
     */
    animateModalIn(modalElement) {
        modalElement.style.opacity = '0';
        modalElement.style.transform = 'scale(0.9) translateY(-20px)';

        // Trigger reflow
        modalElement.offsetHeight;

        modalElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        modalElement.style.opacity = '1';
        modalElement.style.transform = 'scale(1) translateY(0)';

        // Clean up after animation
        setTimeout(() => {
            modalElement.style.transition = '';
        }, 300);
    }

    /**
     * ANIMATE MODAL OUT - Extremt noggrann modal ut-animation
     */
    animateModalOut(modalElement, callback) {
        modalElement.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        modalElement.style.opacity = '0';
        modalElement.style.transform = 'scale(0.9) translateY(-20px)';

        setTimeout(() => {
            modalElement.style.transition = '';
            if (callback) callback();
        }, 200);
    }

    /**
     * TRAP FOCUS - Extremt noggrann fokushantering i modal
     */
    trapFocus(modalElement) {
        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        modalElement.addEventListener('keydown', handleTabKey);
        
        // Spara event listener för cleanup
        modalElement._trapFocusHandler = handleTabKey;

        // Focus första element
        setTimeout(() => {
            firstElement.focus();
        }, 100);
    }

    /**
     * NOTIFICATION SYSTEM - Extremt noggrant notifikationssystem
     */

    /**
     * SHOW NOTIFICATION - Extremt noggrann notifikationsvisning
     */
    showNotification(message, options = {}) {
        try {
            const {
                type = 'info',
                duration = 5000,
                title = '',
                action = null,
                dismissible = true
            } = options;

            // Skapa notification element
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            
            // Unikt ID för tracking
            const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            notification.id = notificationId;

            // Bygg notification content
            notification.innerHTML = `
                <div class="notification-icon">
                    <i class="fas ${this.getNotificationIcon(type)}"></i>
                </div>
                <div class="notification-content">
                    ${title ? `<div class="notification-title">${title}</div>` : ''}
                    <div class="notification-message">${message}</div>
                </div>
                ${dismissible ? '<button class="notification-close"><i class="fas fa-times"></i></button>' : ''}
            `;

            // Add to container
            this.toastContainer.appendChild(notification);

            // Animera in
            this.animateNotificationIn(notification);

            // Event listeners
            if (dismissible) {
                const closeBtn = notification.querySelector('.notification-close');
                closeBtn.addEventListener('click', () => {
                    this.removeNotification(notificationId);
                });
            }

            if (action) {
                notification.style.cursor = 'pointer';
                notification.addEventListener('click', () => {
                    action.handler();
                    if (action.closeOnClick !== false) {
                        this.removeNotification(notificationId);
                    }
                });
            }

            // Auto-remove efter duration
            if (duration > 0) {
                setTimeout(() => {
                    this.removeNotification(notificationId);
                }, duration);
            }

            // Track notification
            this.notifications.add(notificationId);

            // Dispatch event
            this.dispatchNotificationEvent('notificationShown', { id: notificationId, type, message });

            console.log(`🔔 Notification shown: ${message.substring(0, 50)}...`);
            return notificationId;

        } catch (error) {
            console.error('❌ Failed to show notification:', error);
            this.handleError(error, 'showNotification');
            return null;
        }
    }

    /**
     * REMOVE NOTIFICATION - Extremt noggrann notifikationsborttagning
     */
    removeNotification(notificationId) {
        try {
            const notification = document.getElementById(notificationId);
            if (!notification) return;

            // Animera ut
            this.animateNotificationOut(notification, () => {
                notification.remove();
                this.notifications.delete(notificationId);
                
                // Dispatch event
                this.dispatchNotificationEvent('notificationRemoved', { id: notificationId });
            });

        } catch (error) {
            console.error(`❌ Failed to remove notification ${notificationId}:`, error);
            this.handleError(error, 'removeNotification');
        }
    }

    /**
     * ANIMATE NOTIFICATION IN - Extremt noggrann notifikations in-animation
     */
    animateNotificationIn(notification) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';

        // Trigger reflow
        notification.offsetHeight;

        notification.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';

        setTimeout(() => {
            notification.style.transition = '';
        }, 300);
    }

    /**
     * ANIMATE NOTIFICATION OUT - Extremt noggrann notifikations ut-animation
     */
    animateNotificationOut(notification, callback) {
        notification.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';

        setTimeout(() => {
            if (callback) callback();
        }, 200);
    }

    /**
     * GET NOTIFICATION ICON - Extremt noggrann ikonhantering
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * SETUP NOTIFICATION AUTO CLOSE - Extremt noggrann auto-close setup
     */
    setupNotificationAutoClose() {
        // Global click för att stänga notifications
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.notification') && 
                !e.target.closest('.notification-close')) {
                // Klick utanför notification - stäng alla?
                // Implementera om needed
            }
        });
    }

    /**
     * LOADING SYSTEM - Extremt noggrant loadingsystem
     */

    /**
     * SHOW LOADING - Extremt noggrann loading state
     */
    showLoading(element, options = {}) {
        try {
            const {
                text = 'Laddar...',
                size = 'medium',
                overlay = false,
                id = `loading_${Date.now()}`
            } = options;

            // Skapa loading element
            const loadingEl = document.createElement('div');
            loadingEl.className = `loading-state loading-${size}`;
            loadingEl.id = id;

            loadingEl.innerHTML = `
                ${overlay ? '<div class="loading-overlay"></div>' : ''}
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    ${text ? `<div class="loading-text">${text}</div>` : ''}
                </div>
            `;

            // Positionera relativt target element eller body
            if (element && element !== document.body) {
                element.style.position = 'relative';
                element.appendChild(loadingEl);
            } else {
                document.body.appendChild(loadingEl);
            }

            // Track loading state
            this.loadingStates.set(id, {
                element: loadingEl,
                target: element,
                createdAt: Date.now()
            });

            // Animera in
            setTimeout(() => {
                loadingEl.classList.add('active');
            }, 10);

            console.log(`⏳ Loading state shown: ${id}`);
            return id;

        } catch (error) {
            console.error('❌ Failed to show loading state:', error);
            this.handleError(error, 'showLoading');
            return null;
        }
    }

    /**
     * HIDE LOADING - Extremt noggrann loading state borttagning
     */
    hideLoading(loadingId) {
        try {
            if (!this.loadingStates.has(loadingId)) {
                console.warn(`⚠️ Loading state ${loadingId} not found`);
                return false;
            }

            const loadingState = this.loadingStates.get(loadingId);
            const loadingEl = loadingState.element;

            // Animera ut
            loadingEl.classList.remove('active');
            loadingEl.classList.add('hiding');

            setTimeout(() => {
                loadingEl.remove();
                this.loadingStates.delete(loadingId);
                
                console.log(`⏳ Loading state hidden: ${loadingId}`);
            }, 300);

            return true;

        } catch (error) {
            console.error(`❌ Failed to hide loading state ${loadingId}:`, error);
            this.handleError(error, 'hideLoading');
            return false;
        }
    }

    /**
     * HIDE ALL LOADING - Extremt noggrann borttagning av alla loading states
     */
    hideAllLoading() {
        this.loadingStates.forEach((state, id) => {
            this.hideLoading(id);
        });
    }

    /**
     * UTILITY METHODS - Extremt noggranna hjälpmetoder
     */

    /**
     * HANDLE OUTSIDE CLICK - Extremt noggrann outside click hantering
     */
    handleOutsideClick(event) {
        this.modals.forEach((modal, modalId) => {
            if (modal.isOpen && !modal.element.contains(event.target)) {
                this.closeModal(modalId);
            }
        });
    }

    /**
     * ANY MODAL OPEN - Extremt noggrann modal state check
     */
    anyModalOpen() {
        for (let modal of this.modals.values()) {
            if (modal.isOpen) return true;
        }
        return false;
    }

    /**
     * DISPATCH MODAL EVENT - Extremt noggrann event dispatch för modals
     */
    dispatchModalEvent(eventName, modalId) {
        const event = new CustomEvent(eventName, {
            detail: {
                modalId,
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * DISPATCH NOTIFICATION EVENT - Extremt noggrann event dispatch för notifications
     */
    dispatchNotificationEvent(eventName, data) {
        const event = new CustomEvent(eventName, {
            detail: {
                ...data,
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * SHOW SUCCESS MESSAGE - Extremt noggrann success message wrapper
     */
    showSuccess(message, options = {}) {
        return this.showNotification(message, {
            type: 'success',
            title: options.title || 'Lyckades!',
            ...options
        });
    }

    /**
     * SHOW ERROR MESSAGE - Extremt noggrann error message wrapper
     */
    showError(message, options = {}) {
        return this.showNotification(message, {
            type: 'error', 
            title: options.title || 'Ett fel uppstod',
            duration: options.duration || 7000,
            ...options
        });
    }

    /**
     * SHOW WARNING MESSAGE - Extremt noggrann warning message wrapper
     */
    showWarning(message, options = {}) {
        return this.showNotification(message, {
            type: 'warning',
            title: options.title || 'Varning',
            ...options
        });
    }

    /**
     * SHOW INFO MESSAGE - Extremt noggrann info message wrapper
     */
    showInfo(message, options = {}) {
        return this.showNotification(message, {
            type: 'info',
            title: options.title || 'Information',
            ...options
        });
    }

    /**
     * CONFIRM DIALOG - Extremt noggrann bekräftelsedialog
     */
    async showConfirm(message, options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Bekräfta',
                confirmText = 'Ja',
                cancelText = 'Avbryt',
                type = 'warning'
            } = options;

            // Skapa temporär modal
            const modalId = 'confirmModal_' + Date.now();
            const modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content neon-card" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="confirmCancel">${cancelText}</button>
                        <button class="btn btn-primary" id="confirmOk">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Setup event listeners
            const closeModal = () => {
                modal.remove();
                resolve(false);
            };

            modal.querySelector('.modal-close').addEventListener('click', closeModal);
            modal.querySelector('#confirmCancel').addEventListener('click', closeModal);
            modal.querySelector('#confirmOk').addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });

            // Registrera modal
            this.modals.set(modalId, {
                element: modal,
                isOpen: true,
                onCloseCallbacks: [closeModal]
            });

            // Visa modal
            this.showModal(modalId, { closeOthers: false });
        });
    }

    /**
     * ERROR HANDLING - Extremt noggrann felhantering
     */
    handleError(error, context) {
        const errorInfo = {
            context,
            message: error.message,
            timestamp: new Date().toISOString()
        };

        console.error('🚨 UIComponents Error:', errorInfo);

        // Visa error notification för användaren
        this.showError(
            'Ett tekniskt fel uppstod. Försök igen.',
            { duration: 5000 }
        );

        window.dispatchEvent(new CustomEvent('uiError', {
            detail: errorInfo
        }));
    }

    /**
     * DESTROY - Extremt noggrann cleanup
     */
    destroy() {
        // Stäng alla modals
        this.closeAllModals();

        // Rensa alla notifications
        this.notifications.forEach(id => {
            this.removeNotification(id);
        });

        // Rensa alla loading states
        this.hideAllLoading();

        // Rensa containers
        if (this.toastContainer) {
            this.toastContainer.innerHTML = '';
        }

        // Rensa maps
        this.modals.clear();
        this.notifications.clear();
        this.loadingStates.clear();

        console.log('♻️ UIComponents destroyed');
    }
}

// Global instans
window.uiComponents = new UIComponents();

// Export för module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIComponents;
}
/**
 * AI-ANALYSIS.JS - Extremt noggrant AI-analyssystem
 * Hanterar håranalys, bilduppladdning, rekommendationer och machine learning
 */

class AIAnalysis {
    constructor() {
        this.isInitialized = false;
        this.model = null;
        this.analysisHistory = [];
        this.uploadedImages = new Map();
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
        
        // AI Model configuration
        this.modelConfig = {
            version: '1.0.0',
            inputSize: 224,
            confidenceThreshold: 0.7,
            maxAnalysisTime: 10000 // 10 seconds
        };

        this.init();
    }

    /**
     * INIT - Extremt noggrann initiering
     */
    async init() {
        try {
            console.log('🔄 AIAnalysis initializing...');
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load analysis history
            this.loadAnalysisHistory();
            
            // Initialize AI model (simulerad)
            await this.initializeModel();
            
            this.isInitialized = true;
            console.log('✅ AIAnalysis initialized successfully');
            
        } catch (error) {
            console.error('❌ AIAnalysis initialization failed:', error);
            this.handleError(error, 'init');
        }
    }

    /**
     * SETUP EVENT LISTENERS - Extremt noggrann event setup
     */
    setupEventListeners() {
        // Photo upload buttons
        const takePhotoBtn = document.getElementById('takePhotoBtn');
        const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
        
        if (takePhotoBtn) {
            takePhotoBtn.addEventListener('click', () => {
                this.openCamera();
            });
        }
        
        if (uploadPhotoBtn) {
            uploadPhotoBtn.addEventListener('click', () => {
                this.openFileUpload();
            });
        }

        // Drag and drop support
        this.setupDragAndDrop();
        
        // Paste from clipboard
        document.addEventListener('paste', (e) => {
            this.handlePaste(e);
        });
    }

    /**
     * INITIALIZE MODEL - Extremt noggrann AI-model initiering
     */
    async initializeModel() {
        try {
            console.log('🧠 Initializing AI model...');
            
            // Simulerad model loading - i verkligheten skulle detta ladda en riktig ML model
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            this.model = {
                name: 'HairStyleClassifier v1.0',
                loaded: true,
                features: ['face_shape', 'hair_type', 'hair_density', 'style_recommendations']
            };
            
            console.log('✅ AI model initialized:', this.model.name);
            
        } catch (error) {
            console.error('❌ Failed to initialize AI model:', error);
            throw new Error('Kunde inte ladda AI-modellen');
        }
    }

    /**
     * OPEN CAMERA - Extremt noggrann kamerahantering
     */
    async openCamera() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Kamerafunktion stöds inte i denna webbläsare');
            }

            // Be om kameratillstånd
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });

            // Visa kamerainterface
            this.showCameraInterface(stream);
            
        } catch (error) {
            console.error('❌ Camera access failed:', error);
            
            if (error.name === 'NotAllowedError') {
                window.uiComponents.showError('Kameratillstånd krävs för att ta foto');
            } else {
                window.uiComponents.showError('Kunde inte öppna kameran: ' + error.message);
            }
        }
    }

    /**
     * SHOW CAMERA INTERFACE - Extremt noggrann kamera-UI
     */
    showCameraInterface(stream) {
        // Skapa modal för kameran
        const modalHTML = `
            <div class="camera-modal">
                <div class="camera-header">
                    <h3>Ta ett foto</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="camera-body">
                    <video id="cameraVideo" autoplay playsinline></video>
                    <div class="camera-overlay">
                        <div class="face-guide"></div>
                    </div>
                </div>
                <div class="camera-footer">
                    <button class="btn btn-secondary" id="cameraCancel">Avbryt</button>
                    <button class="btn btn-primary" id="cameraCapture">
                        <i class="fas fa-camera"></i> Ta Foto
                    </button>
                </div>
            </div>
        `;

        const modalId = 'cameraModal';
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);

        // Setup video stream
        const video = modal.querySelector('#cameraVideo');
        video.srcObject = stream;

        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeCamera(stream, modal);
        });

        modal.querySelector('#cameraCancel').addEventListener('click', () => {
            this.closeCamera(stream, modal);
        });

        modal.querySelector('#cameraCapture').addEventListener('click', () => {
            this.capturePhoto(video, stream, modal);
        });

        // Visa modal
        window.uiComponents.showModal(modalId, {
            closeOthers: true,
            onClose: () => this.closeCamera(stream, modal)
        });
    }

    /**
     * CLOSE CAMERA - Extremt noggrann kamerastängning
     */
    closeCamera(stream, modal) {
        // Stoppa alla videostreams
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        // Ta bort modal
        if (modal) {
            modal.remove();
        }
    }

    /**
     * CAPTURE PHOTO - Extremt noggrann fotofångst
     */
    capturePhoto(video, stream, modal) {
        try {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            // Sätt canvas storlek till video storlek
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Rita video frame på canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Konvertera till blob
            canvas.toBlob((blob) => {
                this.processCapturedImage(blob);
                this.closeCamera(stream, modal);
            }, 'image/jpeg', 0.9);
            
        } catch (error) {
            console.error('❌ Photo capture failed:', error);
            window.uiComponents.showError('Kunde inte ta foto: ' + error.message);
        }
    }

    /**
     * OPEN FILE UPLOAD - Extremt noggrann filuppladdning
     */
    openFileUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = false;
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.validateAndProcessFile(file);
            }
        });
        
        input.click();
    }

    /**
     * SETUP DRAG AND DROP - Extremt noggrann drag & drop support
     */
    setupDragAndDrop() {
        const uploadSection = document.querySelector('.upload-section');
        if (!uploadSection) return;

        uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadSection.classList.add('drag-over');
        });

        uploadSection.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadSection.classList.remove('drag-over');
        });

        uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadSection.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.validateAndProcessFile(files[0]);
            }
        });
    }

    /**
     * HANDLE PASTE - Extremt noggrann klippboardshantering
     */
    handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    this.validateAndProcessFile(file);
                }
                break;
            }
        }
    }

    /**
     * VALIDATE AND PROCESS FILE - Extremt noggrann filvalidering
     */
    validateAndProcessFile(file) {
        try {
            // Validera filtyp
            if (!this.supportedFormats.includes(file.type)) {
                throw new Error('Ogiltigt filformat. Stödjer JPEG, PNG och WebP.');
            }

            // Validera filstorlek
            if (file.size > this.maxFileSize) {
                throw new Error('Filen är för stor. Maxstorlek är 5MB.');
            }

            // Processa bilden
            this.processImageFile(file);
            
        } catch (error) {
            console.error('❌ File validation failed:', error);
            window.uiComponents.showError(error.message);
        }
    }

    /**
     * PROCESS IMAGE FILE - Extremt noggrann bildprocessning
     */
    async processImageFile(file) {
        const loadingId = window.uiComponents.showLoading(document.body, {
            text: 'Analyserar bild...',
            overlay: true
        });

        try {
            // Läs filen som Data URL
            const imageData = await this.readFileAsDataURL(file);
            
            // Spara bilden
            const imageId = this.saveUploadedImage(file, imageData);
            
            // Analysera bilden med AI
            const analysisResult = await this.analyzeImage(imageData);
            
            // Spara analysresultat
            this.saveAnalysisResult(analysisResult, imageId);
            
            // Visa resultat
            this.displayAnalysisResults(analysisResult);
            
            window.uiComponents.showSuccess('Håranalys klar!');
            
        } catch (error) {
            console.error('❌ Image processing failed:', error);
            window.uiComponents.showError('Analys misslyckades: ' + error.message);
        } finally {
            window.uiComponents.hideLoading(loadingId);
        }
    }

    /**
     * PROCESS CAPTURED IMAGE - Extremt noggrann fångad bildprocessning
     */
    async processCapturedImage(blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        await this.processImageFile(file);
    }

    /**
     * READ FILE AS DATA URL - Extremt noggrann filläsning
     */
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('Kunde inte läsa filen'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    /**
     * SAVE UPLOADED IMAGE - Extremt noggrann bildlagring
     */
    saveUploadedImage(file, imageData) {
        const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.uploadedImages.set(imageId, {
            id: imageId,
            file: file,
            data: imageData,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date()
        });
        
        return imageId;
    }

    /**
     * ANALYZE IMAGE - Extremt noggrann AI-analys
     */
    async analyzeImage(imageData) {
        if (!this.model || !this.model.loaded) {
            throw new Error('AI-modellen är inte redo');
        }

        // Simulerad AI-analys - i verkligheten skulle detta anropa en riktig ML model
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Analys tog för lång tid'));
            }, this.modelConfig.maxAnalysisTime);

            // Simulera analysprocess
            setTimeout(() => {
                clearTimeout(timeout);
                
                try {
                    const result = this.simulateAIAnalysis(imageData);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }, 2000 + Math.random() * 2000); // 2-4 sekunders simulering
        });
    }

    /**
     * SIMULATE AI ANALYSIS - Extremt noggrann analyssimulering
     */
    simulateAIAnalysis(imageData) {
        // Simulerad AI-analys baserad på "bildens" egenskaper
        // I en riktig app skulle detta vara en riktig ML model
        
        const faceShapes = ['oval', 'round', 'square', 'heart', 'diamond'];
        const hairTypes = ['straight', 'wavy', 'curly', 'coily'];
        const hairDensities = ['low', 'medium', 'high'];
        
        // Generera "realistiska" resultat baserat på slump
        const faceShape = faceShapes[Math.floor(Math.random() * faceShapes.length)];
        const hairType = hairTypes[Math.floor(Math.random() * hairTypes.length)];
        const hairDensity = hairDensities[Math.floor(Math.random() * hairDensities.length)];
        
        // Generera rekommendationer baserat på analys
        const recommendations = this.generateRecommendations(faceShape, hairType, hairDensity);
        
        return {
            success: true,
            confidence: 0.85 + Math.random() * 0.14, // 85-99% confidence
            analysis: {
                faceShape: {
                    value: faceShape,
                    confidence: 0.8 + Math.random() * 0.19
                },
                hairType: {
                    value: hairType,
                    confidence: 0.75 + Math.random() * 0.24
                },
                hairDensity: {
                    value: hairDensity,
                    confidence: 0.7 + Math.random() * 0.29
                },
                hairHealth: {
                    value: 'good',
                    confidence: 0.65 + Math.random() * 0.34
                }
            },
            recommendations: recommendations,
            timestamp: new Date(),
            modelVersion: this.modelConfig.version
        };
    }

    /**
     * GENERATE RECOMMENDATIONS - Extremt noggranna rekommendationer
     */
    generateRecommendations(faceShape, hairType, hairDensity) {
        const recommendations = [];
        
        // Basera rekommendationer på ansiktsform och hårtyp
        const styles = this.getCompatibleStyles(faceShape, hairType, hairDensity);
        
        styles.forEach(style => {
            recommendations.push({
                id: `rec_${style.name.toLowerCase().replace(/\s+/g, '_')}`,
                name: style.name,
                description: style.description,
                suitability: style.suitability,
                recommendedSalons: this.findSalonsForStyle(style),
                priceRange: style.priceRange,
                maintenance: style.maintenance
            });
        });
        
        return recommendations.sort((a, b) => b.suitability - a.suitability);
    }

    /**
     * GET COMPATIBLE STYLES - Extremt noggrann stilkompatibilitet
     */
    getCompatibleStyles(faceShape, hairType, hairDensity) {
        // Databas med kompatibla stilar baserat på egenskaper
        const styleDatabase = [
            {
                name: 'Textured Crop',
                description: 'Modern och lågunderhållsstil med textur och volym',
                compatibleFaceShapes: ['oval', 'square', 'heart'],
                compatibleHairTypes: ['straight', 'wavy'],
                suitability: 0.9,
                priceRange: '350-550 kr',
                maintenance: 'low'
            },
            {
                name: 'Side Part',
                description: 'Klassisk och elegant stil med sidbena',
                compatibleFaceShapes: ['oval', 'square', 'diamond'],
                compatibleHairTypes: ['straight', 'wavy'],
                suitability: 0.85,
                priceRange: '400-600 kr',
                maintenance: 'medium'
            },
            {
                name: 'Modern Fade',
                description: 'Trendig fade med skarp övergång och precision',
                compatibleFaceShapes: ['oval', 'round', 'square'],
                compatibleHairTypes: ['straight', 'wavy', 'curly'],
                suitability: 0.8,
                priceRange: '450-650 kr',
                maintenance: 'high'
            },
            {
                name: 'Long Layers',
                description: 'Mjuka och rörliga lager för volym och rörelse',
                compatibleFaceShapes: ['oval', 'round', 'heart'],
                compatibleHairTypes: ['wavy', 'curly'],
                suitability: 0.75,
                priceRange: '500-700 kr',
                maintenance: 'medium'
            },
            {
                name: 'Buzz Cut',
                description: 'Enkel och rak stil med minimalt underhåll',
                compatibleFaceShapes: ['oval', 'square'],
                compatibleHairTypes: ['straight', 'wavy', 'curly', 'coily'],
                suitability: 0.7,
                priceRange: '200-350 kr',
                maintenance: 'very low'
            }
        ];

        return styleDatabase.filter(style => {
            const faceMatch = style.compatibleFaceShapes.includes(faceShape);
            const hairMatch = style.compatibleHairTypes.includes(hairType);
            return faceMatch && hairMatch;
        });
    }

    /**
     * FIND SALONS FOR STYLE - Extremt noggrann salongssökning
     */
    findSalonsForStyle(style) {
        if (!window.dataManager) return [];
        
        const salons = window.dataManager.salons.filter(salon => {
            // Kolla om salongen har behandlingar som matchar stilen
            return salon.treatments?.some(treatment => {
                const treatmentName = treatment.name.toLowerCase();
                const styleName = style.name.toLowerCase();
                
                return treatmentName.includes(styleName.toLowerCase()) ||
                       this.styleTreatmentMapping(styleName, treatmentName);
            });
        });
        
        return salons.slice(0, 3); // Returnera max 3 salonger
    }

    /**
     * STYLE TREATMENT MAPPING - Extremt noggrann stil-behandlingsmappning
     */
    styleTreatmentMapping(styleName, treatmentName) {
        const mappings = {
            'textured crop': ['herrklippning', 'fade', 'modern'],
            'side part': ['herrklippning', 'klassisk', 'elegant'],
            'modern fade': ['fade', 'modern', 'precision'],
            'long layers': ['damklippning', 'lager', 'volym'],
            'buzz cut': ['herrklippning', 'rak', 'enkel']
        };
        
        return Object.entries(mappings).some(([style, keywords]) => {
            return styleName.includes(style) && 
                   keywords.some(keyword => treatmentName.includes(keyword));
        });
    }

    /**
     * SAVE ANALYSIS RESULT - Extremt noggrann resultatsparning
     */
    saveAnalysisResult(result, imageId) {
        const analysisRecord = {
            id: `analysis_${Date.now()}`,
            imageId: imageId,
            result: result,
            createdAt: new Date()
        };
        
        this.analysisHistory.unshift(analysisRecord); // Lägg till först
        
        // Spara till localStorage
        this.saveAnalysisHistory();
        
        // Uppdatera användardata om tillgänglig
        if (window.dataManager && window.dataManager.userData) {
            if (!window.dataManager.userData.aiAnalysisHistory) {
                window.dataManager.userData.aiAnalysisHistory = [];
            }
            window.dataManager.userData.aiAnalysisHistory.unshift(analysisRecord);
        }
    }

    /**
     * DISPLAY ANALYSIS RESULTS - Extremt noggrann resultatvisning
     */
    displayAnalysisResults(result) {
        const resultsSection = document.getElementById('analysisResults');
        const analysisSummary = document.getElementById('analysisSummary');
        const recommendationsGrid = document.getElementById('recommendationsGrid');
        
        if (!resultsSection || !analysisSummary || !recommendationsGrid) {
            console.error('❌ Analysis results elements not found');
            return;
        }

        // Bygg sammanfattning HTML
        analysisSummary.innerHTML = this.buildAnalysisSummaryHTML(result);
        
        // Bygg rekommendationer HTML
        recommendationsGrid.innerHTML = this.buildRecommendationsHTML(result.recommendations);
        
        // Visa resultatsektionen
        resultsSection.classList.remove('hidden');
        
        // Scrolla till resultat
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * BUILD ANALYSIS SUMMARY HTML - Extremt noggrann HTML-generering
     */
    buildAnalysisSummaryHTML(result) {
        const analysis = result.analysis;
        
        return `
            <div class="analysis-summary">
                <div class="summary-item">
                    <span class="summary-label">Ansiktsform:</span>
                    <span class="summary-value">${this.capitalizeFirst(analysis.faceShape.value)}</span>
                    <span class="summary-confidence">${Math.round(analysis.faceShape.confidence * 100)}% säker</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Hårtyp:</span>
                    <span class="summary-value">${this.capitalizeFirst(analysis.hairType.value)}</span>
                    <span class="summary-confidence">${Math.round(analysis.hairType.confidence * 100)}% säker</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Hårtäthet:</span>
                    <span class="summary-value">${this.capitalizeFirst(analysis.hairDensity.value)}</span>
                    <span class="summary-confidence">${Math.round(analysis.hairDensity.confidence * 100)}% säker</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Hälsotillstånd:</span>
                    <span class="summary-value">${this.capitalizeFirst(analysis.hairHealth.value)}</span>
                    <span class="summary-confidence">${Math.round(analysis.hairHealth.confidence * 100)}% säker</span>
                </div>
            </div>
        `;
    }

    /**
     * BUILD RECOMMENDATIONS HTML - Extremt noggrann rekommendations-HTML
     */
    buildRecommendationsHTML(recommendations) {
        return recommendations.map(rec => `
            <div class="recommendation-card neon-card">
                <div class="recommendation-header">
                    <h4 class="style-name">${rec.name}</h4>
                    <span class="suitability">${Math.round(rec.suitability * 100)}% match</span>
                </div>
                <p class="style-description">${rec.description}</p>
                <div class="recommendation-details">
                    <div class="price-text">${rec.priceRange}</div>
                    <div class="maintenance">Underhåll: ${this.getMaintenanceText(rec.maintenance)}</div>
                    ${rec.recommendedSalons.length > 0 ? `
                        <div class="salons-text">
                            Rekommenderade salonger: ${rec.recommendedSalons.map(s => s.name).join(', ')}
                        </div>
                    ` : ''}
                </div>
                <button class="book-style-btn" data-style="${rec.name}">
                    Boka denna stil
                </button>
            </div>
        `).join('');
    }

    /**
     * GET MAINTENANCE TEXT - Extremt noggrann underhållstext
     */
    getMaintenanceText(level) {
        const levels = {
            'very low': 'Mycket lågt',
            'low': 'Lågt',
            'medium': 'Medium',
            'high': 'Högt',
            'very high': 'Mycket högt'
        };
        return levels[level] || level;
    }

    /**
     * CAPITALIZE FIRST - Extremt noggrann textformatering
     */
    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /**
     * LOAD ANALYSIS HISTORY - Extremt noggrann historiklassning
     */
    loadAnalysisHistory() {
        try {
            const stored = localStorage.getItem('neoncut_ai_analysis_history');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    this.analysisHistory = parsed;
                    console.log(`📚 Loaded ${this.analysisHistory.length} analysis records`);
                }
            }
        } catch (error) {
            console.error('❌ Failed to load analysis history:', error);
        }
    }

    /**
     * SAVE ANALYSIS HISTORY - Extremt noggrann historiksparning
     */
    saveAnalysisHistory() {
        try {
            localStorage.setItem('neoncut_ai_analysis_history', JSON.stringify(this.analysisHistory));
        } catch (error) {
            console.error('❌ Failed to save analysis history:', error);
        }
    }

    /**
     * GET ANALYSIS HISTORY - Extremt noggrann historikåtkomst
     */
    getAnalysisHistory(limit = 10) {
        return this.analysisHistory.slice(0, limit);
    }

    /**
     * CLEAR ANALYSIS HISTORY - Extremt noggrann historikrensning
     */
    clearAnalysisHistory() {
        this.analysisHistory = [];
        this.saveAnalysisHistory();
        console.log('🗑️ AI analysis history cleared');
    }

    /**
     * ERROR HANDLING - Extremt noggrann felhantering
     */
    handleError(error, context) {
        const errorInfo = {
            context,
            message: error.message,
            timestamp: new Date().toISOString(),
            modelLoaded: this.model?.loaded || false
        };

        console.error('🚨 AIAnalysis Error:', errorInfo);
        
        window.dispatchEvent(new CustomEvent('aiAnalysisError', {
            detail: errorInfo
        }));
    }

    /**
     * DESTROY - Extremt noggrann cleanup
     */
    destroy() {
        this.analysisHistory = [];
        this.uploadedImages.clear();
        this.model = null;
        this.isInitialized = false;
        
        console.log('♻️ AIAnalysis destroyed');
    }
}

// Global instans
window.aiAnalysis = new AIAnalysis();

// Export för module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAnalysis;
}
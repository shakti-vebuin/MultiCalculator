// Main application script for managing tabs, theme, and localStorage

class AppManager {
    constructor() {
        this.activeTab = 'standard';
        this.theme = 'light';
        this.init();
    }

    init() {
        this.loadPreferences();
        this.setupEventListeners();
        this.applyTheme();
        this.showTab(this.activeTab);
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.showTab(tab);
            });
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                const tabKeys = {
                    '1': 'standard',
                    '2': 'scientific', 
                    '3': 'percentage',
                    '4': 'tip',
                    '5': 'unit',
                    '6': 'currency',
                    '7': 'date',
                    '8': 'loan',
                    '9': 'gst'
                };
                
                if (tabKeys[e.key]) {
                    e.preventDefault();
                    this.showTab(tabKeys[e.key]);
                }
            }
        });
    }

    showTab(tabName) {
        // Hide all sections
        document.querySelectorAll('.calculator-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(tabName);
        const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (targetSection && targetTab) {
            targetSection.classList.add('active');
            targetTab.classList.add('active');
            this.activeTab = tabName;
            this.savePreferences();
            
            // Initialize calculator if needed
            this.initializeCalculator(tabName);
        }
    }

    initializeCalculator(tabName) {
        // Initialize specific calculators when first shown
        switch(tabName) {
            case 'unit':
                if (typeof unitConverter !== 'undefined') {
                    unitConverter.init();
                }
                break;
            case 'currency':
                if (typeof currencyConverter !== 'undefined') {
                    currencyConverter.init();
                }
                break;
            case 'date':
                if (typeof dateCalculator !== 'undefined') {
                    dateCalculator.init();
                }
                break;
            case 'gst':
                if (typeof gstCalculator !== 'undefined') {
                    gstCalculator.init();
                }
                break;
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.savePreferences();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Update theme toggle icon
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = this.theme === 'light' ? '🌙' : '☀️';
        }
    }

    savePreferences() {
        const preferences = {
            activeTab: this.activeTab,
            theme: this.theme,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('calculators_preferences', JSON.stringify(preferences));
        } catch (error) {
            console.warn('Could not save preferences to localStorage:', error);
        }
    }

    loadPreferences() {
        try {
            const saved = localStorage.getItem('calculators_preferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                this.activeTab = preferences.activeTab || 'standard';
                this.theme = preferences.theme || 'light';
            }
        } catch (error) {
            console.warn('Could not load preferences from localStorage:', error);
        }
    }

    // Utility function for number formatting
    formatNumber(num, decimals = 2) {
        if (isNaN(num)) return '0';
        return Number(num).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals
        });
    }

    // Utility function for currency formatting
    formatCurrency(amount, currency = 'USD') {
        const formatters = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'INR': '₹',
            'JPY': '¥',
            'CAD': 'C$',
            'AUD': 'A$'
        };

        const symbol = formatters[currency] || currency;
        return `${symbol}${this.formatNumber(amount)}`;
    }

    // Error handling utility
    showError(message, targetElement) {
        if (typeof targetElement === 'string') {
            targetElement = document.getElementById(targetElement);
        }
        
        if (targetElement) {
            targetElement.innerHTML = `<span style="color: var(--danger-color);">${message}</span>`;
            setTimeout(() => {
                targetElement.innerHTML = '';
            }, 5000);
        }
    }

    // Success message utility
    showSuccess(message, targetElement) {
        if (typeof targetElement === 'string') {
            targetElement = document.getElementById(targetElement);
        }
        
        if (targetElement) {
            targetElement.innerHTML = `<span style="color: var(--success-color);">${message}</span>`;
        }
    }

    // Save calculation to history
    saveCalculation(type, inputs, result) {
        try {
            let history = JSON.parse(localStorage.getItem('calculators_history') || '[]');
            
            const calculation = {
                type,
                inputs,
                result,
                timestamp: new Date().toISOString()
            };
            
            history.unshift(calculation);
            
            // Keep only last 50 calculations
            if (history.length > 50) {
                history = history.slice(0, 50);
            }
            
            localStorage.setItem('calculators_history', JSON.stringify(history));
        } catch (error) {
            console.warn('Could not save calculation to history:', error);
        }
    }

    // Get calculation history
    getCalculationHistory(type = null) {
        try {
            const history = JSON.parse(localStorage.getItem('calculators_history') || '[]');
            return type ? history.filter(calc => calc.type === type) : history;
        } catch (error) {
            console.warn('Could not load calculation history:', error);
            return [];
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.appManager = new AppManager();
});

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker would be implemented here for offline functionality
        // Not implemented in this version but placeholder for future enhancement
    });
}

// Global utilities
window.utils = {
    // Debounce function for input handling
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Validate numeric input
    validateNumber: function(value, min = null, max = null) {
        const num = parseFloat(value);
        if (isNaN(num)) return { valid: false, message: 'Please enter a valid number' };
        if (min !== null && num < min) return { valid: false, message: `Value must be at least ${min}` };
        if (max !== null && num > max) return { valid: false, message: `Value must be at most ${max}` };
        return { valid: true, value: num };
    },

    // Copy to clipboard
    copyToClipboard: function(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                console.log('Copied to clipboard');
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                console.log('Copied to clipboard');
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
            document.body.removeChild(textArea);
        }
    }
};

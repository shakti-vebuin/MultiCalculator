// Currency Converter Implementation

class CurrencyConverter {
    constructor() {
        this.exchangeRates = this.initializeExchangeRates();
        this.baseCurrency = 'USD';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCurrencies();
        this.loadSavedRates();
        this.displayCurrentRates();
    }

    initializeExchangeRates() {
        // Default exchange rates (can be updated manually)
        return {
            'USD': { name: 'US Dollar', symbol: '$', rate: 1.0 },
            'EUR': { name: 'Euro', symbol: '€', rate: 0.85 },
            'GBP': { name: 'British Pound', symbol: '£', rate: 0.73 },
            'JPY': { name: 'Japanese Yen', symbol: '¥', rate: 110.0 },
            'INR': { name: 'Indian Rupee', symbol: '₹', rate: 74.5 },
            'CAD': { name: 'Canadian Dollar', symbol: 'C$', rate: 1.25 },
            'AUD': { name: 'Australian Dollar', symbol: 'A$', rate: 1.35 },
            'CHF': { name: 'Swiss Franc', symbol: 'CHF', rate: 0.92 },
            'CNY': { name: 'Chinese Yuan', symbol: '¥', rate: 6.45 },
            'SEK': { name: 'Swedish Krona', symbol: 'kr', rate: 8.6 },
            'NZD': { name: 'New Zealand Dollar', symbol: 'NZ$', rate: 1.42 },
            'MXN': { name: 'Mexican Peso', symbol: '$', rate: 20.1 },
            'SGD': { name: 'Singapore Dollar', symbol: 'S$', rate: 1.35 },
            'HKD': { name: 'Hong Kong Dollar', symbol: 'HK$', rate: 7.8 },
            'NOK': { name: 'Norwegian Krone', symbol: 'kr', rate: 8.5 },
            'KRW': { name: 'South Korean Won', symbol: '₩', rate: 1180.0 },
            'TRY': { name: 'Turkish Lira', symbol: '₺', rate: 8.8 },
            'RUB': { name: 'Russian Ruble', symbol: '₽', rate: 73.5 },
            'BRL': { name: 'Brazilian Real', symbol: 'R$', rate: 5.2 },
            'ZAR': { name: 'South African Rand', symbol: 'R', rate: 14.8 }
        };
    }

    setupEventListeners() {
        // Input value change
        const fromValueInput = document.getElementById('currencyFromValue');
        if (fromValueInput) {
            fromValueInput.addEventListener('input', 
                window.utils.debounce(() => this.convert(), 300)
            );
        }

        // Currency selection change
        const fromCurrencySelect = document.getElementById('currencyFrom');
        const toCurrencySelect = document.getElementById('currencyTo');
        
        if (fromCurrencySelect) {
            fromCurrencySelect.addEventListener('change', () => this.convert());
        }
        
        if (toCurrencySelect) {
            toCurrencySelect.addEventListener('change', () => this.convert());
        }
    }

    loadSavedRates() {
        try {
            const saved = localStorage.getItem('currency_exchange_rates');
            if (saved) {
                const savedRates = JSON.parse(saved);
                // Merge saved rates with default rates
                this.exchangeRates = { ...this.exchangeRates, ...savedRates.rates };
                
                // Update last updated info
                if (savedRates.lastUpdated) {
                    this.lastUpdated = new Date(savedRates.lastUpdated);
                }
            }
        } catch (error) {
            console.warn('Could not load saved exchange rates:', error);
        }
    }

    saveRates() {
        try {
            const rateData = {
                rates: this.exchangeRates,
                lastUpdated: new Date().toISOString(),
                baseCurrency: this.baseCurrency
            };
            
            localStorage.setItem('currency_exchange_rates', JSON.stringify(rateData));
            this.lastUpdated = new Date();
            this.displayCurrentRates();
            this.hideUpdateModal();
            
            window.appManager.showSuccess('Exchange rates updated successfully!', 'ratesList');
        } catch (error) {
            console.warn('Could not save exchange rates:', error);
            window.appManager.showError('Failed to save exchange rates', 'ratesList');
        }
    }

    loadCurrencies() {
        const fromSelect = document.getElementById('currencyFrom');
        const toSelect = document.getElementById('currencyTo');
        
        if (!fromSelect || !toSelect) return;

        // Clear existing options
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';

        // Add currency options
        Object.keys(this.exchangeRates).forEach(currencyCode => {
            const currency = this.exchangeRates[currencyCode];
            const optionText = `${currencyCode} - ${currency.name}`;
            
            const fromOption = new Option(optionText, currencyCode);
            const toOption = new Option(optionText, currencyCode);
            
            fromSelect.add(fromOption);
            toSelect.add(toOption);
        });

        // Set default selections
        if (fromSelect.options.length > 0) {
            fromSelect.value = 'USD';
        }
        if (toSelect.options.length > 1) {
            // Set a different currency as default target
            const defaultTargets = ['EUR', 'GBP', 'INR', 'JPY'];
            const availableTarget = defaultTargets.find(code => this.exchangeRates[code]);
            toSelect.value = availableTarget || Object.keys(this.exchangeRates)[1];
        }
    }

    convert() {
        const fromValue = parseFloat(document.getElementById('currencyFromValue').value);
        const fromCurrency = document.getElementById('currencyFrom').value;
        const toCurrency = document.getElementById('currencyTo').value;
        const toValueInput = document.getElementById('currencyToValue');

        if (isNaN(fromValue) || !fromCurrency || !toCurrency) {
            toValueInput.value = '';
            return;
        }

        if (!this.exchangeRates[fromCurrency] || !this.exchangeRates[toCurrency]) {
            toValueInput.value = 'Error: Currency not found';
            return;
        }

        const result = this.calculateConversion(fromValue, fromCurrency, toCurrency);
        
        if (result !== null && isFinite(result)) {
            toValueInput.value = this.formatCurrency(result);
            
            // Show exchange rate info
            this.showExchangeRateInfo(fromValue, fromCurrency, toCurrency, result);
            
            // Save to history
            if (window.appManager) {
                window.appManager.saveCalculation('currency', {
                    fromValue: fromValue,
                    fromCurrency: fromCurrency,
                    toCurrency: toCurrency,
                    exchangeRate: this.getExchangeRate(fromCurrency, toCurrency)
                }, result);
            }
        } else {
            toValueInput.value = 'Error';
        }
    }

    calculateConversion(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return amount;

        const fromRate = this.exchangeRates[fromCurrency].rate;
        const toRate = this.exchangeRates[toCurrency].rate;
        
        // Convert to base currency (USD) first, then to target currency
        const usdAmount = amount / fromRate;
        const result = usdAmount * toRate;
        
        return result;
    }

    getExchangeRate(fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return 1;
        
        const fromRate = this.exchangeRates[fromCurrency].rate;
        const toRate = this.exchangeRates[toCurrency].rate;
        
        return toRate / fromRate;
    }

    showExchangeRateInfo(fromValue, fromCurrency, toCurrency, result) {
        const rate = this.getExchangeRate(fromCurrency, toCurrency);
        const fromSymbol = this.exchangeRates[fromCurrency].symbol;
        const toSymbol = this.exchangeRates[toCurrency].symbol;
        
        // Find or create info display
        let infoDiv = document.getElementById('exchangeRateInfo');
        if (!infoDiv) {
            infoDiv = document.createElement('div');
            infoDiv.id = 'exchangeRateInfo';
            infoDiv.className = 'exchange-rate-info';
            
            const converterRow = document.querySelector('.converter-row');
            if (converterRow) {
                converterRow.parentNode.insertBefore(infoDiv, converterRow.nextSibling);
            }
        }
        
        infoDiv.innerHTML = `
            <div class="rate-info-content">
                <div class="current-rate">
                    <strong>Exchange Rate:</strong> 1 ${fromCurrency} = ${rate.toFixed(6)} ${toCurrency}
                </div>
                <div class="conversion-details">
                    ${fromSymbol}${window.appManager.formatNumber(fromValue)} ${fromCurrency} = 
                    ${toSymbol}${window.appManager.formatNumber(result)} ${toCurrency}
                </div>
                ${this.lastUpdated ? `
                    <div class="last-updated">
                        <small>Rates last updated: ${this.lastUpdated.toLocaleString()}</small>
                    </div>
                ` : ''}
            </div>
        `;
    }

    swap() {
        const fromValue = document.getElementById('currencyFromValue');
        const toValue = document.getElementById('currencyToValue');
        const fromCurrency = document.getElementById('currencyFrom');
        const toCurrency = document.getElementById('currencyTo');

        // Swap values
        const tempValue = fromValue.value;
        fromValue.value = toValue.value;
        toValue.value = tempValue;

        // Swap currencies
        const tempCurrency = fromCurrency.value;
        fromCurrency.value = toCurrency.value;
        toCurrency.value = tempCurrency;

        // Recalculate
        this.convert();
    }

    formatCurrency(amount) {
        // Format to appropriate decimal places
        if (amount >= 1) {
            return amount.toFixed(2);
        } else if (amount >= 0.01) {
            return amount.toFixed(4);
        } else {
            return amount.toFixed(8);
        }
    }

    displayCurrentRates() {
        const ratesListDiv = document.getElementById('ratesList');
        if (!ratesListDiv) return;

        const ratesList = Object.keys(this.exchangeRates)
            .filter(code => code !== this.baseCurrency)
            .map(code => {
                const currency = this.exchangeRates[code];
                return `
                    <div class="rate-item">
                        <span class="currency-info">
                            <strong>${code}</strong> - ${currency.name}
                        </span>
                        <span class="rate-value">
                            1 ${this.baseCurrency} = ${currency.rate} ${code}
                        </span>
                    </div>
                `;
            }).join('');

        ratesListDiv.innerHTML = `
            <div class="rates-header">
                <h4>Current Exchange Rates (Base: ${this.baseCurrency})</h4>
                ${this.lastUpdated ? `
                    <p><small>Last updated: ${this.lastUpdated.toLocaleString()}</small></p>
                ` : ''}
            </div>
            <div class="rates-grid">
                ${ratesList}
            </div>
        `;
    }

    showUpdateModal() {
        const modal = document.getElementById('rateModal');
        const rateInputsDiv = document.getElementById('rateInputs');
        
        if (!modal || !rateInputsDiv) return;

        // Generate input fields for each currency
        const inputFields = Object.keys(this.exchangeRates)
            .filter(code => code !== this.baseCurrency)
            .map(code => {
                const currency = this.exchangeRates[code];
                return `
                    <div class="form-group">
                        <label for="rate_${code}">${code} - ${currency.name}</label>
                        <div class="rate-input-group">
                            <span class="rate-prefix">1 ${this.baseCurrency} =</span>
                            <input type="number" id="rate_${code}" value="${currency.rate}" step="0.000001" min="0">
                            <span class="rate-suffix">${code}</span>
                        </div>
                    </div>
                `;
            }).join('');

        rateInputsDiv.innerHTML = inputFields;
        modal.style.display = 'block';
    }

    hideUpdateModal() {
        const modal = document.getElementById('rateModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    saveRatesFromModal() {
        // Update rates from modal inputs
        Object.keys(this.exchangeRates).forEach(code => {
            if (code !== this.baseCurrency) {
                const input = document.getElementById(`rate_${code}`);
                if (input) {
                    const newRate = parseFloat(input.value);
                    if (!isNaN(newRate) && newRate > 0) {
                        this.exchangeRates[code].rate = newRate;
                    }
                }
            }
        });

        this.saveRates();
    }

    // Get historical data simulation (for display purposes)
    generateTrendData(fromCurrency, toCurrency, days = 30) {
        const currentRate = this.getExchangeRate(fromCurrency, toCurrency);
        const trendData = [];
        
        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Simulate slight variations (±2%)
            const variation = (Math.random() - 0.5) * 0.04;
            const rate = currentRate * (1 + variation);
            
            trendData.push({
                date: date.toISOString().split('T')[0],
                rate: rate
            });
        }
        
        return trendData;
    }

    // Export exchange rates
    exportRates() {
        const exportData = {
            calculator: 'Currency Converter',
            exchangeRates: this.exchangeRates,
            baseCurrency: this.baseCurrency,
            lastUpdated: this.lastUpdated?.toISOString() || null,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `exchange-rates-${new Date().getTime()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // Import exchange rates from file
    importRates(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (importedData.exchangeRates) {
                    this.exchangeRates = { ...this.exchangeRates, ...importedData.exchangeRates };
                    this.saveRates();
                    this.loadCurrencies();
                    window.appManager.showSuccess('Exchange rates imported successfully!', 'ratesList');
                } else {
                    window.appManager.showError('Invalid file format', 'ratesList');
                }
            } catch (error) {
                window.appManager.showError('Error reading file', 'ratesList');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize currency converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.currencyConverter = new CurrencyConverter();
    
    // Handle modal clicks
    const modal = document.getElementById('rateModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                window.currencyConverter.hideUpdateModal();
            }
        });
    }
});

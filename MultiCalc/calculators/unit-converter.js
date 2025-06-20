// Unit Converter Implementation

class UnitConverter {
    constructor() {
        this.currentType = 'length';
        this.conversions = this.initializeConversions();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupConverterTabs();
        this.loadUnits('length');
    }

    initializeConversions() {
        return {
            length: {
                name: 'Length',
                baseUnit: 'meter',
                units: {
                    // All conversions to meters
                    'millimeter': { name: 'Millimeter (mm)', factor: 0.001 },
                    'centimeter': { name: 'Centimeter (cm)', factor: 0.01 },
                    'meter': { name: 'Meter (m)', factor: 1 },
                    'kilometer': { name: 'Kilometer (km)', factor: 1000 },
                    'inch': { name: 'Inch (in)', factor: 0.0254 },
                    'foot': { name: 'Foot (ft)', factor: 0.3048 },
                    'yard': { name: 'Yard (yd)', factor: 0.9144 },
                    'mile': { name: 'Mile (mi)', factor: 1609.344 },
                    'nautical_mile': { name: 'Nautical Mile (nmi)', factor: 1852 }
                }
            },
            weight: {
                name: 'Weight',
                baseUnit: 'kilogram',
                units: {
                    // All conversions to kilograms
                    'milligram': { name: 'Milligram (mg)', factor: 0.000001 },
                    'gram': { name: 'Gram (g)', factor: 0.001 },
                    'kilogram': { name: 'Kilogram (kg)', factor: 1 },
                    'tonne': { name: 'Tonne (t)', factor: 1000 },
                    'ounce': { name: 'Ounce (oz)', factor: 0.0283495 },
                    'pound': { name: 'Pound (lb)', factor: 0.453592 },
                    'stone': { name: 'Stone (st)', factor: 6.35029 },
                    'ton_us': { name: 'US Ton', factor: 907.185 },
                    'ton_uk': { name: 'UK Ton', factor: 1016.05 }
                }
            },
            volume: {
                name: 'Volume',
                baseUnit: 'liter',
                units: {
                    // All conversions to liters
                    'milliliter': { name: 'Milliliter (ml)', factor: 0.001 },
                    'liter': { name: 'Liter (l)', factor: 1 },
                    'cubic_meter': { name: 'Cubic Meter (m³)', factor: 1000 },
                    'fluid_ounce_us': { name: 'US Fluid Ounce (fl oz)', factor: 0.0295735 },
                    'cup_us': { name: 'US Cup', factor: 0.236588 },
                    'pint_us': { name: 'US Pint (pt)', factor: 0.473176 },
                    'quart_us': { name: 'US Quart (qt)', factor: 0.946353 },
                    'gallon_us': { name: 'US Gallon (gal)', factor: 3.78541 },
                    'fluid_ounce_uk': { name: 'UK Fluid Ounce (fl oz)', factor: 0.0284131 },
                    'pint_uk': { name: 'UK Pint (pt)', factor: 0.568261 },
                    'gallon_uk': { name: 'UK Gallon (gal)', factor: 4.54609 }
                }
            },
            temperature: {
                name: 'Temperature',
                baseUnit: 'celsius',
                units: {
                    'celsius': { name: 'Celsius (°C)' },
                    'fahrenheit': { name: 'Fahrenheit (°F)' },
                    'kelvin': { name: 'Kelvin (K)' },
                    'rankine': { name: 'Rankine (°R)' }
                }
            }
        };
    }

    setupEventListeners() {
        // Converter type tabs
        document.querySelectorAll('.converter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.switchConverterType(type);
            });
        });

        // Input value change
        const fromValueInput = document.getElementById('fromValue');
        if (fromValueInput) {
            fromValueInput.addEventListener('input', 
                window.utils.debounce(() => this.convert(), 300)
            );
        }

        // Unit selection change
        const fromUnitSelect = document.getElementById('fromUnit');
        const toUnitSelect = document.getElementById('toUnit');
        
        if (fromUnitSelect) {
            fromUnitSelect.addEventListener('change', () => this.convert());
        }
        
        if (toUnitSelect) {
            toUnitSelect.addEventListener('change', () => this.convert());
        }
    }

    setupConverterTabs() {
        document.querySelectorAll('.converter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-type="${this.currentType}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }

    switchConverterType(type) {
        this.currentType = type;
        this.setupConverterTabs();
        this.loadUnits(type);
        this.clearValues();
    }

    loadUnits(type) {
        const fromSelect = document.getElementById('fromUnit');
        const toSelect = document.getElementById('toUnit');
        
        if (!fromSelect || !toSelect || !this.conversions[type]) return;

        // Clear existing options
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';

        // Add options for the selected type
        const units = this.conversions[type].units;
        Object.keys(units).forEach(unitKey => {
            const unit = units[unitKey];
            
            const fromOption = new Option(unit.name, unitKey);
            const toOption = new Option(unit.name, unitKey);
            
            fromSelect.add(fromOption);
            toSelect.add(toOption);
        });

        // Set default selections
        if (fromSelect.options.length > 0) {
            fromSelect.selectedIndex = 0;
        }
        if (toSelect.options.length > 1) {
            toSelect.selectedIndex = 1;
        } else if (toSelect.options.length > 0) {
            toSelect.selectedIndex = 0;
        }
    }

    convert() {
        const fromValue = parseFloat(document.getElementById('fromValue').value);
        const fromUnit = document.getElementById('fromUnit').value;
        const toUnit = document.getElementById('toUnit').value;
        const toValueInput = document.getElementById('toValue');

        if (isNaN(fromValue) || !fromUnit || !toUnit) {
            toValueInput.value = '';
            return;
        }

        let result;

        if (this.currentType === 'temperature') {
            result = this.convertTemperature(fromValue, fromUnit, toUnit);
        } else {
            result = this.convertStandardUnits(fromValue, fromUnit, toUnit);
        }

        if (result !== null && isFinite(result)) {
            toValueInput.value = this.formatResult(result);
            
            // Save to history
            if (window.appManager) {
                window.appManager.saveCalculation('unit-converter', {
                    type: this.currentType,
                    fromValue: fromValue,
                    fromUnit: fromUnit,
                    toUnit: toUnit
                }, result);
            }
        } else {
            toValueInput.value = 'Error';
        }
    }

    convertStandardUnits(value, fromUnit, toUnit) {
        const conversionData = this.conversions[this.currentType];
        
        if (!conversionData || !conversionData.units[fromUnit] || !conversionData.units[toUnit]) {
            return null;
        }

        // Convert to base unit first, then to target unit
        const fromFactor = conversionData.units[fromUnit].factor;
        const toFactor = conversionData.units[toUnit].factor;
        
        const baseValue = value * fromFactor;
        const result = baseValue / toFactor;
        
        return result;
    }

    convertTemperature(value, fromUnit, toUnit) {
        if (fromUnit === toUnit) return value;

        // Convert from source to Celsius first
        let celsius;
        switch (fromUnit) {
            case 'celsius':
                celsius = value;
                break;
            case 'fahrenheit':
                celsius = (value - 32) * 5/9;
                break;
            case 'kelvin':
                celsius = value - 273.15;
                break;
            case 'rankine':
                celsius = (value - 491.67) * 5/9;
                break;
            default:
                return null;
        }

        // Convert from Celsius to target unit
        let result;
        switch (toUnit) {
            case 'celsius':
                result = celsius;
                break;
            case 'fahrenheit':
                result = celsius * 9/5 + 32;
                break;
            case 'kelvin':
                result = celsius + 273.15;
                break;
            case 'rankine':
                result = celsius * 9/5 + 491.67;
                break;
            default:
                return null;
        }

        return result;
    }

    swap() {
        const fromValue = document.getElementById('fromValue');
        const toValue = document.getElementById('toValue');
        const fromUnit = document.getElementById('fromUnit');
        const toUnit = document.getElementById('toUnit');

        // Swap values
        const tempValue = fromValue.value;
        fromValue.value = toValue.value;
        toValue.value = tempValue;

        // Swap units
        const tempUnit = fromUnit.value;
        fromUnit.value = toUnit.value;
        toUnit.value = tempUnit;

        // Recalculate
        this.convert();
    }

    formatResult(result) {
        // Handle very small numbers
        if (Math.abs(result) < 1e-6 && result !== 0) {
            return result.toExponential(6);
        }
        
        // Handle very large numbers
        if (Math.abs(result) > 1e12) {
            return result.toExponential(6);
        }
        
        // Regular formatting
        if (result % 1 === 0) {
            return result.toString();
        }
        
        return parseFloat(result.toFixed(8)).toString();
    }

    clearValues() {
        document.getElementById('fromValue').value = '';
        document.getElementById('toValue').value = '';
    }

    // Add custom unit (for future enhancement)
    addCustomUnit(type, unitKey, unitData) {
        if (this.conversions[type]) {
            this.conversions[type].units[unitKey] = unitData;
            this.loadUnits(type);
        }
    }

    // Get all conversion factors for a type
    getConversionFactors(type) {
        return this.conversions[type]?.units || {};
    }

    // Batch conversion - convert one value to multiple units
    batchConvert(value, fromUnit, type) {
        const results = {};
        const units = this.conversions[type]?.units || {};
        
        Object.keys(units).forEach(toUnit => {
            if (toUnit !== fromUnit) {
                if (type === 'temperature') {
                    results[toUnit] = this.convertTemperature(value, fromUnit, toUnit);
                } else {
                    results[toUnit] = this.convertStandardUnits(value, fromUnit, toUnit);
                }
            }
        });
        
        return results;
    }

    // Export conversion table
    exportConversionTable() {
        const type = this.currentType;
        const fromValue = parseFloat(document.getElementById('fromValue').value);
        const fromUnit = document.getElementById('fromUnit').value;
        
        if (isNaN(fromValue) || !fromUnit) {
            window.appManager.showError('Please enter a value to convert first', 'toValue');
            return;
        }
        
        const results = this.batchConvert(fromValue, fromUnit, type);
        const units = this.conversions[type].units;
        
        const exportData = {
            calculator: 'Unit Converter',
            type: this.conversions[type].name,
            sourceValue: fromValue,
            sourceUnit: units[fromUnit].name,
            conversions: {},
            timestamp: new Date().toISOString()
        };
        
        Object.keys(results).forEach(unitKey => {
            exportData.conversions[units[unitKey].name] = {
                value: results[unitKey],
                formatted: this.formatResult(results[unitKey])
            };
        });
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `unit-conversion-${type}-${new Date().getTime()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
}

// Initialize unit converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.unitConverter = new UnitConverter();
});

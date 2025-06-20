// Date Calculator Implementation

class DateCalculator {
    constructor() {
        this.currentMode = 'difference';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDateTabs();
        this.setDefaultDates();
    }

    setupEventListeners() {
        // Date tab switching
        document.querySelectorAll('.date-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.switchDateMode(type);
            });
        });

        // Auto-calculate on date changes with debounce
        const dateInputs = ['fromDate', 'toDate', 'startDate'];
        dateInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('change', 
                    window.utils.debounce(() => this.autoCalculate(), 300)
                );
            }
        });

        // Auto-calculate on days input change
        const daysInput = document.getElementById('daysToAdd');
        if (daysInput) {
            daysInput.addEventListener('input', 
                window.utils.debounce(() => this.autoCalculate(), 500)
            );
        }
    }

    setupDateTabs() {
        document.querySelectorAll('.date-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-type="${this.currentMode}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Show/hide sections
        document.querySelectorAll('.date-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const activeSection = document.getElementById(
            this.currentMode === 'difference' ? 'dateDifference' : 'dateAddSubtract'
        );
        if (activeSection) {
            activeSection.classList.add('active');
        }
    }

    switchDateMode(mode) {
        this.currentMode = mode;
        this.setupDateTabs();
        this.clearResults();
    }

    setDefaultDates() {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        
        // Set default dates
        const fromDateInput = document.getElementById('fromDate');
        const startDateInput = document.getElementById('startDate');
        
        if (fromDateInput && !fromDateInput.value) {
            fromDateInput.value = todayString;
        }
        
        if (startDateInput && !startDateInput.value) {
            startDateInput.value = todayString;
        }
        
        // Set to date to tomorrow for difference calculation
        const toDateInput = document.getElementById('toDate');
        if (toDateInput && !toDateInput.value) {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            toDateInput.value = tomorrow.toISOString().split('T')[0];
        }
    }

    autoCalculate() {
        if (this.currentMode === 'difference') {
            const fromDate = document.getElementById('fromDate').value;
            const toDate = document.getElementById('toDate').value;
            if (fromDate && toDate) {
                this.calculateDifference();
            }
        } else {
            const startDate = document.getElementById('startDate').value;
            const daysToAdd = document.getElementById('daysToAdd').value;
            if (startDate && daysToAdd) {
                this.addSubtractDays();
            }
        }
    }

    calculateDifference() {
        const fromDateInput = document.getElementById('fromDate');
        const toDateInput = document.getElementById('toDate');
        const resultDiv = document.getElementById('dateDiffResult');

        if (!fromDateInput.value || !toDateInput.value) {
            window.appManager.showError('Please select both dates', resultDiv);
            return;
        }

        const fromDate = new Date(fromDateInput.value);
        const toDate = new Date(toDateInput.value);

        // Validate dates
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            window.appManager.showError('Please enter valid dates', resultDiv);
            return;
        }

        // Calculate differences
        const timeDifference = Math.abs(toDate.getTime() - fromDate.getTime());
        const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
        
        // Calculate detailed breakdown
        const breakdown = this.calculateDetailedDifference(fromDate, toDate);
        const isFromDateEarlier = fromDate <= toDate;
        const direction = isFromDateEarlier ? 'later' : 'earlier';

        resultDiv.innerHTML = `
            <div class="date-result-breakdown">
                <h4>Date Difference:</h4>
                <div class="primary-result">
                    <strong>${daysDifference} days</strong> 
                    (${toDate.toLocaleDateString()} is ${daysDifference} days ${direction} than ${fromDate.toLocaleDateString()})
                </div>
                
                <div class="detailed-breakdown">
                    <h5>Detailed Breakdown:</h5>
                    <div class="breakdown-grid">
                        <div class="breakdown-item">
                            <span>Years:</span>
                            <span>${breakdown.years}</span>
                        </div>
                        <div class="breakdown-item">
                            <span>Months:</span>
                            <span>${breakdown.months}</span>
                        </div>
                        <div class="breakdown-item">
                            <span>Days:</span>
                            <span>${breakdown.days}</span>
                        </div>
                        <div class="breakdown-item">
                            <span>Total Days:</span>
                            <span>${daysDifference}</span>
                        </div>
                        <div class="breakdown-item">
                            <span>Total Weeks:</span>
                            <span>${Math.floor(daysDifference / 7)} weeks, ${daysDifference % 7} days</span>
                        </div>
                        <div class="breakdown-item">
                            <span>Total Hours:</span>
                            <span>${(daysDifference * 24).toLocaleString()}</span>
                        </div>
                        <div class="breakdown-item">
                            <span>Total Minutes:</span>
                            <span>${(daysDifference * 24 * 60).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div class="date-info">
                    <h5>Date Information:</h5>
                    <div class="info-grid">
                        <div class="info-item">
                            <span>From Date:</span>
                            <span>${fromDate.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</span>
                        </div>
                        <div class="info-item">
                            <span>To Date:</span>
                            <span>${toDate.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Save to history
        if (window.appManager) {
            window.appManager.saveCalculation('date', {
                type: 'difference',
                fromDate: fromDateInput.value,
                toDate: toDateInput.value
            }, {
                daysDifference: daysDifference,
                breakdown: breakdown
            });
        }
    }

    calculateDetailedDifference(date1, date2) {
        const startDate = new Date(Math.min(date1.getTime(), date2.getTime()));
        const endDate = new Date(Math.max(date1.getTime(), date2.getTime()));
        
        let years = endDate.getFullYear() - startDate.getFullYear();
        let months = endDate.getMonth() - startDate.getMonth();
        let days = endDate.getDate() - startDate.getDate();

        // Adjust for negative days
        if (days < 0) {
            months--;
            const lastMonthDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
            days += lastMonthDate.getDate();
        }

        // Adjust for negative months
        if (months < 0) {
            years--;
            months += 12;
        }

        return { years, months, days };
    }

    addSubtractDays() {
        const startDateInput = document.getElementById('startDate');
        const daysToAddInput = document.getElementById('daysToAdd');
        const resultDiv = document.getElementById('dateAddResult');

        if (!startDateInput.value) {
            window.appManager.showError('Please select a start date', resultDiv);
            return;
        }

        const daysValidation = window.utils.validateNumber(daysToAddInput.value);
        if (!daysValidation.valid) {
            window.appManager.showError(daysValidation.message, resultDiv);
            return;
        }

        const startDate = new Date(startDateInput.value);
        const daysToAdd = daysValidation.value;

        if (isNaN(startDate.getTime())) {
            window.appManager.showError('Please enter a valid start date', resultDiv);
            return;
        }

        // Calculate result date
        const resultDate = new Date(startDate);
        resultDate.setDate(resultDate.getDate() + daysToAdd);

        const isAdding = daysToAdd >= 0;
        const operation = isAdding ? 'Adding' : 'Subtracting';
        const absoluteDays = Math.abs(daysToAdd);

        // Calculate additional information
        const daysDifference = Math.abs(resultDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const weeksDifference = Math.floor(daysDifference / 7);
        const remainingDays = daysDifference % 7;

        resultDiv.innerHTML = `
            <div class="date-result-breakdown">
                <h4>Result Date:</h4>
                <div class="primary-result">
                    <strong>${resultDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</strong>
                </div>
                
                <div class="calculation-summary">
                    <p>
                        ${operation} ${absoluteDays} ${absoluteDays === 1 ? 'day' : 'days'} 
                        ${isAdding ? 'to' : 'from'} ${startDate.toLocaleDateString()}
                    </p>
                </div>

                <div class="detailed-info">
                    <h5>Calculation Details:</h5>
                    <div class="info-grid">
                        <div class="info-item">
                            <span>Start Date:</span>
                            <span>${startDate.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</span>
                        </div>
                        <div class="info-item">
                            <span>Days ${isAdding ? 'Added' : 'Subtracted'}:</span>
                            <span>${absoluteDays}</span>
                        </div>
                        <div class="info-item">
                            <span>Result Date:</span>
                            <span>${resultDate.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</span>
                        </div>
                        <div class="info-item">
                            <span>Time Period:</span>
                            <span>${weeksDifference > 0 ? `${weeksDifference} weeks` : ''}${weeksDifference > 0 && remainingDays > 0 ? ', ' : ''}${remainingDays > 0 ? `${remainingDays} days` : ''}</span>
                        </div>
                        <div class="info-item">
                            <span>Result Day of Week:</span>
                            <span>${resultDate.toLocaleDateString('en-US', { weekday: 'long' })}</span>
                        </div>
                        <div class="info-item">
                            <span>Days in Result Month:</span>
                            <span>${new Date(resultDate.getFullYear(), resultDate.getMonth() + 1, 0).getDate()}</span>
                        </div>
                    </div>
                </div>

                <div class="additional-info">
                    <h5>Additional Information:</h5>
                    <div class="info-grid">
                        <div class="info-item">
                            <span>Quarter:</span>
                            <span>Q${Math.ceil((resultDate.getMonth() + 1) / 3)} ${resultDate.getFullYear()}</span>
                        </div>
                        <div class="info-item">
                            <span>Week of Year:</span>
                            <span>${this.getWeekOfYear(resultDate)}</span>
                        </div>
                        <div class="info-item">
                            <span>Day of Year:</span>
                            <span>${this.getDayOfYear(resultDate)}</span>
                        </div>
                        <div class="info-item">
                            <span>Is Leap Year:</span>
                            <span>${this.isLeapYear(resultDate.getFullYear()) ? 'Yes' : 'No'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Save to history
        if (window.appManager) {
            window.appManager.saveCalculation('date', {
                type: 'addSubtract',
                startDate: startDateInput.value,
                daysToAdd: daysToAdd
            }, {
                resultDate: resultDate.toISOString().split('T')[0],
                resultDateFormatted: resultDate.toLocaleDateString()
            });
        }
    }

    // Utility functions
    getWeekOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 1);
        const diff = date - start;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        return Math.ceil((diff / oneWeek) + 1);
    }

    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 1);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.ceil(diff / oneDay) + 1;
    }

    isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    clearResults() {
        const resultDivs = ['dateDiffResult', 'dateAddResult'];
        resultDivs.forEach(id => {
            const div = document.getElementById(id);
            if (div) div.innerHTML = '';
        });
    }

    // Age calculator
    calculateAge(birthDate, currentDate = new Date()) {
        const birth = new Date(birthDate);
        const current = new Date(currentDate);
        
        let years = current.getFullYear() - birth.getFullYear();
        let months = current.getMonth() - birth.getMonth();
        let days = current.getDate() - birth.getDate();

        if (days < 0) {
            months--;
            const lastMonth = new Date(current.getFullYear(), current.getMonth(), 0);
            days += lastMonth.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        return { years, months, days };
    }

    // Business days calculator
    calculateBusinessDays(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let businessDays = 0;
        
        const currentDate = new Date(start);
        while (currentDate <= end) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
                businessDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return businessDays;
    }

    // Time zone conversion
    convertTimeZone(date, fromTimeZone, toTimeZone) {
        const fromDate = new Date(date.toLocaleString("en-US", {timeZone: fromTimeZone}));
        const toDate = new Date(date.toLocaleString("en-US", {timeZone: toTimeZone}));
        const offset = toDate.getTime() - fromDate.getTime();
        
        return new Date(date.getTime() + offset);
    }

    // Export calculation
    exportCalculation() {
        const history = window.appManager.getCalculationHistory('date');
        
        if (history.length === 0) {
            window.appManager.showError('No calculations to export', 'dateDiffResult');
            return;
        }

        const exportData = {
            calculator: 'Date Calculator',
            calculations: history,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `date-calculations-${new Date().getTime()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
}

// Initialize date calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dateCalculator = new DateCalculator();
});

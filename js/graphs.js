document.addEventListener('DOMContentLoaded', function() {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbytKOXHwtfZw6_4W_7mIC6a9k7l4o37_ojyjMt4SmXJSrcq8Av9XJ7k4CTO4nTIt_20/exec';
    const tabs = [
        { sheetName: 'jar', containerId: 'jar-display' },
        { sheetName: 'lte', containerId: 'lte-display' },
        { sheetName: 'lco', containerId: 'lco-display' },
        { sheetName: 'lps', containerId: 'lps-display' }
    ];

    const monthSelector = document.getElementById('monthSelector');
    const currentYear = new Date().getFullYear();

    // This is a helper function to make a JSONP request.
    function requestJsonp(baseUrl, params, callback) {
        // Create a unique callback function name to avoid conflicts
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        
        // The callback function will be called by the script returned from Google
        window[callbackName] = function(data) {
            delete window[callbackName]; // Clean up the global space
            document.body.removeChild(script); // Remove the script tag
            callback(null, data); // Call the original callback with the data
        };

        // Build the full URL with parameters and the callback function name
        const queryParams = new URLSearchParams(params);
        const script = document.createElement('script');
        script.src = `${baseUrl}?callback=${callbackName}&${queryParams.toString()}`;
        
        script.onerror = () => {
             delete window[callbackName];
             document.body.removeChild(script);
             callback(new Error('Failed to load script ' + script.src));
        };

        // Add the script tag to the page to make the request
        document.body.appendChild(script);
    }

    function fetchAllEfficiencies() {
        const selectedMonth = monthSelector.value;

        tabs.forEach(tab => {
            const container = document.getElementById(tab.containerId);
            if (container) {
                container.innerHTML = '<p>Carregando...</p>';
            }
        });

        // Create an array of JSONP requests as Promises
        const promises = tabs.map(tab => {
            return new Promise((resolve, reject) => {
                const params = {
                    sheetName: tab.sheetName,
                    month: selectedMonth,
                    year: currentYear
                };
                requestJsonp(scriptURL, params, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        if (result.result !== 'success') {
                           reject(new Error(`Error for tab ${tab.sheetName}: ${result.error}`));
                        } else {
                           resolve({ ...tab, data: result.data });
                        }
                    }
                });
            });
        });

        // Promise.all works exactly the same as before
        Promise.all(promises)
            .then(results => {
                results.forEach(result => {
                    const average = calculateAverage(result.data);
                    renderGraph(result.containerId, average);
                });
            })
            .catch(error => {
                console.error('An error occurred during fetch:', error);
                tabs.forEach(tab => {
                    const container = document.getElementById(tab.containerId);
                    if (container) {
                        container.innerHTML = '<p style="color: #b42318;">Falha ao carregar os dados.</p>';
                    }
                });
            });
    }
    
    // The setup, calculate, and render functions remain unchanged.
    function setupMonthSelector() {
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const currentMonth = new Date().getMonth();
        monthNames.forEach((name, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = name;
            if (index === currentMonth) option.selected = true;
            monthSelector.appendChild(option);
        });
        monthSelector.addEventListener('change', fetchAllEfficiencies);
    }

    function calculateAverage(data) {
        if (!data || data.length === 0) return null;
        const headers = Object.keys(data[0]);
        const efficiencyColumnName = headers[headers.length - 1];
        const efficiencies = data.map(row => parseFloat(row[efficiencyColumnName])).filter(value => !isNaN(value));
        if (efficiencies.length === 0) return null;
        const sum = efficiencies.reduce((total, current) => total + current, 0);
        return sum / efficiencies.length;
    }

    function renderGraph(containerId, averagePercentage) {
        const container = document.getElementById(containerId);

        if (!container) {
            return;
        }

        if (averagePercentage === null) {
            container.innerHTML = '<p>Sem dados para o periodo selecionado.</p>';
            return;
        }

        const displayValue = averagePercentage * 100;
        const boundedValue = Math.max(0, Math.min(displayValue, 100));
        const formattedPercentage = boundedValue.toFixed(2);

        let statusClass = '';
        let statusLabel = 'Alta';

        if (boundedValue < 70) {
            statusClass = 'is-danger';
            statusLabel = 'Baixa';
        } else if (boundedValue < 90) {
            statusClass = 'is-warning';
            statusLabel = 'Media';
        }

        container.innerHTML = `
            <div class="efficiency-meta">
                <strong class="efficiency-value">${formattedPercentage}%</strong>
                <span class="efficiency-status ${statusClass}">${statusLabel}</span>
            </div>
            <div class="efficiency-bar-container" aria-label="Barra de eficacia">
                <div class="efficiency-bar" style="width: ${formattedPercentage}%;"></div>
            </div>
            <div class="efficiency-scale">
                <span>0%</span>
                <span>100%</span>
            </div>
        `;
    }

    // Initialize the page
    setupMonthSelector();
    fetchAllEfficiencies();

});

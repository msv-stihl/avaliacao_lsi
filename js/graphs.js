document.addEventListener('DOMContentLoaded', function() {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbytKOXHwtfZw6_4W_7mIC6a9k7l4o37_ojyjMt4SmXJSrcq8Av9XJ7k4CTO4nTIt_20/exec';
    const tabNames = ['jar', 'lte', 'lco']; 
    
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
        
        tabNames.forEach(tab => {
            document.getElementById(`${tab}-display`).innerHTML = '<p>Carregando...</p>';
        });

        // Create an array of JSONP requests as Promises
        const promises = tabNames.map(tab => {
            return new Promise((resolve, reject) => {
                const params = {
                    sheetName: tab,
                    month: selectedMonth,
                    year: currentYear
                };
                requestJsonp(scriptURL, params, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        if (result.result !== 'success') {
                           reject(new Error(`Error for tab ${tab}: ${result.error}`));
                        } else {
                           resolve(result.data);
                        }
                    }
                });
            });
        });

        // Promise.all works exactly the same as before
        Promise.all(promises)
            .then(results => {
                results.forEach((data, index) => {
                    const tabName = tabNames[index];
                    const containerId = `${tabName}-display`;
                    const average = calculateAverage(data);
                    renderGraph(containerId, average);
                });
            })
            .catch(error => {
                console.error('An error occurred during fetch:', error);
                tabNames.forEach(tab => {
                    document.getElementById(`${tab}-display`).innerHTML = `<p style="color: red;">Failed to load data.</p>`;
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
      
      if (averagePercentage === null) {
          container.innerHTML = '<h3>Sem Dados</h3>';
          return;
      }

      // --- THE FIX IS HERE ---
      // Convert the decimal average (e.g., 0.95) into a display-ready percentage (e.g., 95.00)
      const displayValue = averagePercentage * 100;
      const formattedPercentage = displayValue.toFixed(2); // Format to 2 decimal places

      container.innerHTML = `
          <div class="efficiency-bar-container">
              <div class="efficiency-bar" style="width: ${formattedPercentage}%;">
                  ${formattedPercentage}%
              </div>
          </div>
      `;
    }

    // Initialize the page
    setupMonthSelector();
    fetchAllEfficiencies();

});

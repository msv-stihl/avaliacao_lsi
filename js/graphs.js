document.addEventListener('DOMContentLoaded', function() {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbx-2uxmh-T890MdXfN4qYZDykpa-woanzzOVzw6cMQKCkjrZlZ700H2xvtlZ6PcMT_O/exec';
    const tabNames = ['jar', 'lte', 'lco']; // The exact names of your three tabs
    
    const monthSelector = document.getElementById('monthSelector');
    const currentYear = new Date().getFullYear();

    // 1. SET UP THE MONTH SELECTOR (Same as before)
    function setupMonthSelector() {
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const currentMonth = new Date().getMonth();

        monthNames.forEach((name, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = name;
            if (index === currentMonth) {
                option.selected = true;
            }
            monthSelector.appendChild(option);
        });

        monthSelector.addEventListener('change', fetchAllEfficiencies);
    }

    // 2. FETCH DATA FOR ALL TABS, CALCULATE, AND DISPLAY
    function fetchAllEfficiencies() {
        const selectedMonth = monthSelector.value;
        
        // Show loading state in all three containers
        tabNames.forEach(tab => {
            document.getElementById(`${tab}-display`).innerHTML = '<p>Carregando...</p>';
        });

        // Create an array of fetch promises, one for each tab
        const promises = tabNames.map(tab => {
            const url = `${scriptURL}?sheetName=${tab}&month=${selectedMonth}&year=${currentYear}`;
            return fetch(url)
                .then(res => res.json())
                .then(result => {
                    if (result.result !== 'success') {
                        throw new Error(`Error for tab ${tab}: ${result.error}`);
                    }
                    return result.data; // Return just the data array
                });
        });

        // Use Promise.all to wait for all fetches to complete
        Promise.all(promises)
            .then(results => {
                // results is an array of data arrays: [jarData, lteData, lcoData]
                results.forEach((data, index) => {
                    const tabName = tabNames[index];
                    const containerId = `${tabName}-display`;
                    
                    const average = calculateAverage(data);
                    renderGraph(containerId, average);
                });
            })
            .catch(error => {
                console.error('An error occurred during fetch:', error);
                // Show an error in all containers if something goes wrong
                tabNames.forEach(tab => {
                    document.getElementById(`${tab}-display`).innerHTML = `<p style="color: red;">Failed to load data.</p>`;
                });
            });
    }
    
    // 3. REUSABLE FUNCTION TO CALCULATE AVERAGE EFFICIENCY
    function calculateAverage(data) {
        if (!data || data.length === 0) {
            return null; // Return null if there's no data
        }
        
        // Find the last column name from the first row of data
        const headers = Object.keys(data[0]);
        const efficiencyColumnName = headers[headers.length - 1];

        const efficiencies = data
            .map(row => parseFloat(row[efficiencyColumnName]))
            .filter(value => !isNaN(value)); // Ensure we only have numbers

        if (efficiencies.length === 0) {
            return null; // Return null if there's no valid numeric data
        }

        const sum = efficiencies.reduce((total, current) => total + current, 0);
        return sum / efficiencies.length;
    }

    // 4. REUSABLE FUNCTION TO RENDER THE "GRAPH"
    function renderGraph(containerId, averagePercentage) {
        const container = document.getElementById(containerId);
        
        if (averagePercentage === null) {
            container.innerHTML = '<h3>Sem Dados</h3>';
            return;
        }

        const percentage = averagePercentage.toFixed(2);
        container.innerHTML = `
            <div class="efficiency-bar-container">
                <div class="efficiency-bar" style="width: ${percentage}%;">
                    ${percentage}%
                </div>
            </div>
        `;
    }

    // --- INITIALIZE THE PAGE ---
    setupMonthSelector();
    fetchAllEfficiencies(); // Fetch data for all tabs on initial page load
});
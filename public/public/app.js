const BACKEND_URL = window.location.origin;
const COLORS = ['#10b981','#f43f5e','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316'];
let chart = null;

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
    document.getElementById('refreshBtn').disabled = show;
}

function showToast(msg, error = false) {
    const toast = document.createElement('div');
    toast.className = 'toast' + (error ? ' error' : '');
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {style: 'currency', currency: 'EUR'}).format(amount);
}

async function loadData() {
    showLoading(true);
    try {
        const [summary, expenses] = await Promise.all([
            fetch(`${BACKEND_URL}/api/financial-summary`).then(r => r.json()),
            fetch(`${BACKEND_URL}/api/expenses-by-category`).then(r => r.json())
        ]);
        
        document.getElementById('totalIncome').textContent = formatCurrency(summary.total_income);
        document.getElementById('totalExpenses').textContent = formatCurrency(summary.total_expenses);
        document.getElementById('availableBalance').textContent = formatCurrency(summary.available_balance);
        
        updateChart(expenses);
        updateList(expenses);
        showToast('Datos actualizados');
    } catch (error) {
        showToast('Error al cargar datos', true);
    } finally {
        showLoading(false);
    }
}

function updateChart(data) {
    const canvas = document.getElementById('pieChart');
    const empty = document.getElementById('pieChartEmpty');
    
    if (!data.length) {
        canvas.style.display = 'none';
        empty.style.display = 'flex';
        if (chart) chart.destroy();
        return;
    }
    
    canvas.style.display = 'block';
    empty.style.display = 'none';
    if (chart) chart.destroy();
    
    chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.category),
            datasets: [{
                data: data.map(d => d.amount),
                backgroundColor: COLORS
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function updateList(data) {
    const list = document.getElementById('expenseList');
    if (!data.length) {
        list.innerHTML = '<div class="empty-state">No hay gastos</div>';
        return;
    }
    list.innerHTML = data.map((e, i) => `
        <div class="expense-item">
            <div class="expense-color" style="background:${COLORS[i%COLORS.length]}"></div>
            <div class="expense-info">
                <div class="expense-category">${e.category}</div>
                <div class="expense-percentage">${e.percentage.toFixed(1)}% del total</div>
            </div>
            <div class="expense-amount">${formatCurrency(e.amount)}</div>
        </div>
    `).join('');
}

window.addEventListener('DOMContentLoaded', loadData);

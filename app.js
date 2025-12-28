// app.js - VERSIÓN OPTIMIZADA PARA MÓVIL
const API_BASE_URL = 'https://finanzas-personales-swart.vercel.app';
let pieChartInstance = null;

async function loadData() {
    showLoading(true);
    try {
        const [resResumen, resCategorias] = await Promise.all([
            fetch(`${API_BASE_URL}/api/financial-summary`),
            fetch(`${API_BASE_URL}/api/expenses-by-category`)
        ]);
        
        const resumen = await resResumen.json();
        let categorias = await resCategorias.json();
        
        // Corregir caracteres
        categorias = categorias.map(item => ({
            ...item,
            category: fixEncoding(item.category)
        }));
        
        updateSummaryCards(resumen);
        updateExpenseList(categorias);
        updatePieChart(categorias);
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Error cargando datos', 'error');
    } finally {
        showLoading(false);
    }
}

function fixEncoding(text) {
    return text.replace(/Ã³/g, 'ó').replace(/Ã/g, 'í');
}

function updateSummaryCards(resumen) {
    document.getElementById('totalIncome').textContent = `${resumen.total_income.toFixed(2)} €`;
    document.getElementById('totalExpenses').textContent = `${resumen.total_expenses.toFixed(2)} €`;
    document.getElementById('availableBalance').textContent = `${resumen.available_balance.toFixed(2)} €`;
}

function updateExpenseList(categorias) {
    const expenseList = document.getElementById('expenseList');
    
    if (categorias.length === 0) {
        expenseList.innerHTML = '<div class="empty-state">No hay gastos registrados</div>';
        return;
    }
    
    let html = '';
    categorias.forEach(item => {
        html += `
            <div class="expense-item">
                <div class="expense-category">
                    <span class="expense-color" style="background-color: ${getCategoryColor(item.category)}"></span>
                    <span>${item.category}</span>
                </div>
                <div class="expense-details">
                    <span class="expense-amount">${item.amount.toFixed(2)} €</span>
                    <span class="expense-percentage">${item.percentage}%</span>
                </div>
            </div>
        `;
    });
    
    expenseList.innerHTML = html;
}

function updatePieChart(categorias) {
    const canvas = document.getElementById('pieChart');
    const emptyState = document.getElementById('pieChartEmpty');
    
    if (categorias.length === 0) {
        canvas.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    if (pieChartInstance) pieChartInstance.destroy();
    
    pieChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: categorias.map(item => item.category),
            datasets: [{
                data: categorias.map(item => item.amount),
                backgroundColor: categorias.map(item => getCategoryColor(item.category))
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function getCategoryColor(category) {
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    let hash = 0;
    for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'info') {
    // Puedes implementar esto después si quieres notificaciones
    console.log(`${type}: ${message}`);
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('refreshBtn').addEventListener('click', loadData);
    loadData();
});

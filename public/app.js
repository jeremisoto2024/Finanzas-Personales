// app.js - CONEXIÓN COMPLETA CON TU API DE FASTAPI

const API_BASE_URL = 'https://finanzas-personales-swart.vercel.app';
let pieChartInstance = null; // Para controlar el gráfico

// Función principal que carga todos los datos
async function loadData() {
    showLoading(true);
    
    try {
        // 1. Cargar el resumen financiero
        const resResumen = await fetch(`${API_BASE_URL}/api/financial-summary`);
        const resumen = await resResumen.json();
        
        // 2. Cargar gastos por categoría
        const resCategorias = await fetch(`${API_BASE_URL}/api/expenses-by-category`);
        let gastosPorCategoria = await resCategorias.json();
        
        // 3. Corregir caracteres especiales (el problema de "AlimentaciÃ³n")
        gastosPorCategoria = gastosPorCategoria.map(item => ({
            ...item,
            category: fixEncoding(item.category)
        }));
        
        console.log('✅ Datos cargados:', { resumen, gastosPorCategoria });
        
        // 4. Actualizar la interfaz
        updateSummaryCards(resumen);
        updateExpenseList(gastosPorCategoria);
        updatePieChart(gastosPorCategoria);
        
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        alert('Error al cargar los datos. Revisa la consola para más detalles.');
    } finally {
        showLoading(false);
    }
}

// Función para corregir problemas de codificación
function fixEncoding(text) {
    try {
        return decodeURIComponent(escape(text));
    } catch (e) {
        return text;
    }
}

// Actualizar las tarjetas de resumen
function updateSummaryCards(resumen) {
    document.getElementById('totalIncome').textContent = `${resumen.total_income.toFixed(2)} €`;
    document.getElementById('totalExpenses').textContent = `${resumen.total_expenses.toFixed(2)} €`;
    document.getElementById('availableBalance').textContent = `${resumen.available_balance.toFixed(2)} €`;
}

// Actualizar la lista de gastos por categoría
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
                    <span class="category-dot" style="background-color: ${getCategoryColor(item.category)}"></span>
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

// Crear o actualizar el gráfico circular
function updatePieChart(categorias) {
    const canvas = document.getElementById('pieChart');
    const emptyState = document.getElementById('pieChartEmpty');
    
    if (categorias.length === 0) {
        canvas.style.display = 'none';
        emptyState.style.display = 'block';
        if (pieChartInstance) {
            pieChartInstance.destroy();
            pieChartInstance = null;
        }
        return;
    }
    
    canvas.style.display = 'block';
    emptyState.style.display = 'none';
    
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico anterior si existe
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }
    
    // Crear nuevo gráfico
    pieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categorias.map(item => item.category),
            datasets: [{
                data: categorias.map(item => item.amount),
                backgroundColor: categorias.map(item => getCategoryColor(item.category)),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = categorias[context.dataIndex]?.percentage || 0;
                            return `${label}: ${value.toFixed(2)} € (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Colores para las categorías
function getCategoryColor(category) {
    const colors = [
        '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];
    
    // Usar un hash simple para asignar colores consistentes
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
}

// Mostrar/ocultar pantalla de carga
function showLoading(show) {
    const loading = document.getElementById('loading');
    loading.style.display = show ? 'flex' : 'none';
}

// Cargar datos al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    // Hacer que el botón de actualizar funcione
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadData);
    }
    
    // Cargar datos automáticamente
    loadData();
});
// Configuración global para Chart.js
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#94a3b8';

// Variables globales
let chartInstance = null;

// ===== FUNCIONES DE UTILIDAD =====
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2
    }).format(amount || 0);
}

function getPorcentajeColor(porcentaje) {
    if (porcentaje < 60) return '#10b981';
    if (porcentaje < 85) return '#f59e0b';
    return '#ef4444';
}

function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
}

// ===== FUNCIONES PARA DATOS REALES =====
async function fetchFinancialData() {
    showLoading();
    
    try {
        // REEMPLAZA ESTA URL CON TU ENDPOINT REAL
        const response = await fetch('/api/financial-data'); // ← Cambia esto
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        // Datos de ejemplo como fallback
        return getFallbackData();
    } finally {
        hideLoading();
    }
}

function getFallbackData() {
    // Datos de ejemplo para cuando no haya conexión
    return {
        total_income: 4850.75,
        total_expenses: 3120.50,
        balance: 1730.25,
        expenses_by_category: {
            'Alimentación': 850.00,
            'Transporte': 420.50,
            'Entretenimiento': 320.00,
            'Servicios': 650.00,
            'Compras': 880.00
        },
        recent_transactions: [
            { category: 'Alimentación', description: 'Supermercado', amount: 120.50, date: '2024-01-15' },
            { category: 'Transporte', description: 'Gasolina', amount: 65.00, date: '2024-01-14' },
            { category: 'Entretenimiento', description: 'Cine', amount: 45.00, date: '2024-01-13' },
            { category: 'Servicios', description: 'Internet', amount: 75.00, date: '2024-01-12' },
            { category: 'Compras', description: 'Ropa', amount: 189.99, date: '2024-01-11' }
        ],
        budgets: [
            { category: 'Alimentación', budget: 1000, spent: 850, icon: '🍔' },
            { category: 'Transporte', budget: 500, spent: 420.5, icon: '🚗' },
            { category: 'Entretenimiento', budget: 400, spent: 320, icon: '🎬' },
            { category: 'Servicios', budget: 700, spent: 650, icon: '🏠' },
            { category: 'Compras', budget: 1000, spent: 880, icon: '🛍️' }
        ]
    };
}

// ===== FUNCIONES DE RENDERIZADO =====
function updateSummaryCards(data) {
    document.getElementById('totalIncome').textContent = formatCurrency(data.total_income);
    document.getElementById('totalExpenses').textContent = formatCurrency(data.total_expenses);
    document.getElementById('availableBalance').textContent = formatCurrency(data.balance);
    
    // Animar números
    animateValue('totalIncome', 0, data.total_income, 1500);
    animateValue('totalExpenses', 0, data.total_expenses, 1500);
    animateValue('availableBalance', 0, data.balance, 1500);
}

function renderAlertas(data) {
    const container = document.getElementById('alertas-container');
    const alertas = [];
    
    // Alerta 1: Porcentaje de gastos
    const porcentajeGastos = (data.total_expenses / data.total_income) * 100;
    if (porcentajeGastos > 70) {
        alertas.push({
            icono: '⚠️',
            mensaje: `Estás gastando el ${porcentajeGastos.toFixed(1)}% de tus ingresos`,
            tipo: 'alerta-warning'
        });
    } else {
        alertas.push({
            icono: '✅',
            mensaje: `Tus gastos son el ${porcentajeGastos.toFixed(1)}% de tus ingresos`,
            tipo: 'alerta-success'
        });
    }
    
    // Alerta 2: Balance
    if (data.balance > 1000) {
        alertas.push({
            icono: '💰',
            mensaje: '¡Buen saldo disponible!',
            tipo: 'alerta-success'
        });
    } else if (data.balance < 0) {
        alertas.push({
            icono: '🚨',
            mensaje: '¡Saldo negativo! Revisa tus gastos',
            tipo: 'alerta-warning'
        });
    }
    
    // Alerta 3: Mayor categoría de gasto
    if (data.expenses_by_category) {
        const maxCat = Object.entries(data.expenses_by_category)
            .reduce((a, b) => a[1] > b[1] ? a : b);
        alertas.push({
            icono: '📊',
            mensaje: `Mayor gasto: ${maxCat[0]} (${formatCurrency(maxCat[1])})`,
            tipo: 'alerta-info'
        });
    }
    
    container.innerHTML = alertas.map(alerta => `
        <div class="alerta-item ${alerta.tipo}">
            <span class="alerta-icono">${alerta.icono}</span>
            <span class="alerta-texto">${alerta.mensaje}</span>
        </div>
    `).join('');
}

function renderPresupuestos(data) {
    const container = document.getElementById('presupuestos-container');
    
    if (!data.budgets || data.budgets.length === 0) {
        container.innerHTML = `
            <div class="presupuesto-card">
                <div class="presupuesto-titulo">📋 Sin presupuestos configurados</div>
                <p style="color: var(--muted-text); margin-top: 1rem;">
                    Configura tus presupuestos para un mejor control financiero
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = data.budgets.map(budget => {
        const porcentaje = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0;
        const color = getPorcentajeColor(porcentaje);
        
        return `
            <div class="presupuesto-card">
                <div class="presupuesto-header">
                    <div class="presupuesto-titulo">
                        ${budget.icon || '📊'} ${budget.category}
                    </div>
                    <div class="presupuesto-monto">
                        ${formatCurrency(budget.spent)} / ${formatCurrency(budget.budget)}
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" 
                         style="width: ${Math.min(porcentaje, 100)}%; background: ${color};">
                    </div>
                </div>
                <div class="presupuesto-info">
                    <span>${porcentaje.toFixed(1)}%</span>
                    <span>Restante: ${formatCurrency(budget.budget - budget.spent)}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderProyecciones(data) {
    const container = document.getElementById('proyeccion-container');
    
    // Calcular proyecciones basadas en datos reales
    const hoy = new Date();
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const diasTranscurridos = hoy.getDate();
    const diasRestantes = ultimoDiaMes - diasTranscurridos;
    
    const gastoPromedioDiario = data.total_expenses / diasTranscurridos;
    const ingresoPromedioDiario = data.total_income / diasTranscurridos;
    
    const proyeccionRealista = data.balance + 
        ((ingresoPromedioDiario - gastoPromedioDiario) * diasRestantes);
    
    const proyeccionOptimista = data.balance + 
        ((ingresoPromedioDiario - (gastoPromedioDiario * 0.8)) * diasRestantes);
    
    const proyeccionPesimista = data.balance + 
        ((ingresoPromedioDiario - (gastoPromedioDiario * 1.2)) * diasRestantes);
    
    container.innerHTML = `
        <div class="proyeccion-card">
            <div class="proyeccion-icono">🚀</div>
            <h3>Optimista</h3>
            <div class="proyeccion-valor" style="color: #10b981;">
                ${formatCurrency(proyeccionOptimista)}
            </div>
            <p>Reduciendo gastos 20%</p>
        </div>
        
        <div class="proyeccion-card">
            <div class="proyeccion-icono">📈</div>
            <h3>Realista</h3>
            <div class="proyeccion-valor" style="color: #3b82f6;">
                ${formatCurrency(proyeccionRealista)}
            </div>
            <p>Ritmo actual</p>
        </div>
        
        <div class="proyeccion-card">
            <div class="proyeccion-icono">⚠️</div>
            <h3>Pesimista</h3>
            <div class="proyeccion-valor" style="color: #ef4444;">
                ${formatCurrency(proyeccionPesimista)}
            </div>
            <p>Aumentando gastos 20%</p>
        </div>
    `;
}

function renderPieChart(data) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    const container = document.getElementById('pieChartEmpty');
    
    // Destruir gráfico anterior si existe
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    if (!data.expenses_by_category || Object.keys(data.expenses_by_category).length === 0) {
        if (container) container.style.display = 'block';
        return;
    }
    
    if (container) container.style.display = 'none';
    
    const labels = Object.keys(data.expenses_by_category);
    const values = Object.values(data.expenses_by_category);
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];
    
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: colors.map(c => `${c}80`),
                borderWidth: 2,
                borderRadius: 8,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#94a3b8',
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = values.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(context.raw)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function renderExpenseList(data) {
    const container = document.getElementById('expenseList');
    
    if (!data.recent_transactions || data.recent_transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3rem; margin-bottom: 1rem;">💳</div>
                <p>No hay transacciones recientes</p>
            </div>
        `;
        return;
    }
    
    const categoryIcons = {
        'Alimentación': '🍔',
        'Transporte': '🚗',
        'Entretenimiento': '🎬',
        'Servicios': '🏠',
        'Compras': '🛍️',
        'Salud': '🏥',
        'Educación': '📚',
        'Otros': '📦'
    };
    
    container.innerHTML = data.recent_transactions.map(transaction => {
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short'
        });
        
        return `
            <div class="expense-item">
                <div class="expense-category">
                    <div class="expense-category-icon">
                        ${categoryIcons[transaction.category] || '💰'}
                    </div>
                    <div>
                        <div class="expense-desc">${transaction.description}</div>
                        <div class="expense-date">${formattedDate}</div>
                    </div>
                </div>
                <div class="expense-amount">${formatCurrency(transaction.amount)}</div>
            </div>
        `;
    }).join('');
}

// ===== ANIMACIONES =====
function animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + eased * (end - start);
        
        element.textContent = formatCurrency(current);
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    
    window.requestAnimationFrame(step);
}

function addEntranceAnimations() {
    const elements = document.querySelectorAll('.summary-card, .chart-card, .alerta-item, .presupuesto-card, .proyeccion-card');
    elements.forEach((el, i) => {
        el.style.animation = `fadeInUp 0.6s ease-out ${i * 0.1}s both`;
    });
}

// ===== FUNCIÓN PRINCIPAL =====
async function initDashboard() {
    showLoading();
    
    try {
        // 1. Obtener datos REALES (reemplaza con tu endpoint)
        const data = await fetchFinancialData();
        
        // 2. Actualizar todas las secciones
        updateSummaryCards(data);
        renderAlertas(data);
        renderPresupuestos(data);
        renderProyecciones(data);
        renderPieChart(data);
        renderExpenseList(data);
        
        // 3. Añadir animaciones
        addEntranceAnimations();
        
    } catch (error) {
        console.error('Error inicializando dashboard:', error);
        // Mostrar error al usuario
        const alertasContainer = document.getElementById('alertas-container');
        if (alertasContainer) {
            alertasContainer.innerHTML = `
                <div class="alerta-item alerta-warning">
                    <span class="alerta-icono">⚠️</span>
                    <span class="alerta-texto">Error cargando datos: ${error.message}</span>
                </div>
            `;
        }
    } finally {
        hideLoading();
    }
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar dashboard
    initDashboard();
    
    // Configurar botón de actualizar
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            // Animación del botón
            refreshBtn.style.transform = 'rotate(180deg)';
            refreshBtn.style.transition = 'transform 0.5s';
            
            setTimeout(() => {
                refreshBtn.style.transform = 'rotate(0deg)';
                initDashboard();
            }, 500);
        });
    }
});

// ===== CÓMO CONFIGURAR TU ENDPOINT REAL =====
/*
Para conectar con tu backend REAL, modifica la función fetchFinancialData():

1. Reemplaza la URL en fetch('/api/financial-data') con tu endpoint real
   Ejemplo: fetch('https://tudominio.com/api/finanzas')

2. Asegúrate de que la estructura de datos que retorna tu backend coincida
   con la que espera este código. Si no coincide, ajusta las funciones de renderizado.

3. Si necesitas enviar headers (como tokens de autenticación):
   
   async function fetchFinancialData() {
       const response = await fetch('/api/financial-data', {
           headers: {
               'Authorization': 'Bearer ' + localStorage.getItem('token'),
               'Content-Type': 'application/json'
           }
       });
       return await response.json();
   }
*/
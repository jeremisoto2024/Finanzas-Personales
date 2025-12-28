// app.js - VERSIÓN COMPLETA CON ALERTAS INTELIGENTES
const API_BASE_URL = 'https://finanzas-personales-swart.vercel.app';
let pieChartInstance = null;

// ===== FUNCIÓN PRINCIPAL =====
async function loadData() {
    showLoading(true);
    try {
        // Cargar datos de la API
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
        
        // Actualizar todas las secciones
        updateSummaryCards(resumen);
        updateExpenseList(categorias);
        updatePieChart(categorias);
        
        // 🆕 NUEVO: Generar y mostrar alertas inteligentes
        const alertas = generarAlertas(resumen, categorias);
        mostrarAlertas(alertas);
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        mostrarMensajeError('No se pudieron cargar los datos. Revisa tu conexión.');
    } finally {
        showLoading(false);
    }
}

// ===== FUNCIONES DE AYUDA =====
function fixEncoding(text) {
    return text.replace(/Ã³/g, 'ó').replace(/Ã/g, 'í');
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function mostrarMensajeError(mensaje) {
    // Puedes mejorar esto mostrando un mensaje en pantalla
    console.error('Error:', mensaje);
}

// ===== ACTUALIZAR TARJETAS DE RESUMEN =====
function updateSummaryCards(resumen) {
    document.getElementById('totalIncome').textContent = `${resumen.total_income.toFixed(2)} €`;
    document.getElementById('totalExpenses').textContent = `${resumen.total_expenses.toFixed(2)} €`;
    document.getElementById('availableBalance').textContent = `${resumen.available_balance.toFixed(2)} €`;
}

// ===== ACTUALIZAR LISTA DE GASTOS =====
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

// ===== ACTUALIZAR GRÁFICO CIRCULAR =====
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
            plugins: { 
                legend: { 
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

// ===== COLORES PARA CATEGORÍAS =====
function getCategoryColor(category) {
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

// ===== 🆕 SISTEMA DE ALERTAS INTELIGENTES =====
function generarAlertas(resumen, categorias) {
    const alertas = [];
    
    // 🔴 Alerta 1: BALANCE NEGATIVO
    if (resumen.available_balance < 0) {
        alertas.push({
            tipo: 'peligro',
            mensaje: `Balance negativo: €${Math.abs(resumen.available_balance).toFixed(2)}`,
            icono: '🔴'
        });
    }
    
    // 🟠 Alerta 2: GASTÓ MÁS DEL 90% DE INGRESOS
    if (resumen.total_income > 0) {
        const porcentajeGastado = (resumen.total_expenses / resumen.total_income) * 100;
        if (porcentajeGastado >= 90) {
            alertas.push({
                tipo: 'advertencia',
                mensaje: `Cuidado: Has gastado el ${Math.round(porcentajeGastado)}% de tus ingresos`,
                icono: '⚠️'
            });
        }
    }
    
    // 🟢 Alerta 3: GASTOS BAJOS (positiva)
    if (resumen.total_expenses < resumen.total_income * 0.5 && resumen.total_income > 0) {
        alertas.push({
            tipo: 'positiva',
            mensaje: `¡Vas bien! Gastos por debajo del 50% de tus ingresos`,
            icono: '✅'
        });
    }
    
    // 🔵 Alerta 4: SIN DATOS
    if (resumen.total_income === 0 && resumen.total_expenses === 0) {
        alertas.push({
            tipo: 'info',
            mensaje: `Comienza registrando tus primeros ingresos y gastos`,
            icono: '💡'
        });
    }
    
    // 📊 Alerta 5: GENÉRICA (si no hay otras)
    if (alertas.length === 0) {
        alertas.push({
            tipo: 'info',
            mensaje: `Todo en orden. Sigue controlando tus finanzas.`,
            icono: '📊'
        });
    }
    
    return alertas;
}

function mostrarAlertas(alertas) {
    const container = document.getElementById('alertas-container');
    if (!container) return;
    
    let html = '';
    alertas.forEach(alerta => {
        html += `
            <div class="alerta-item alerta-${alerta.tipo}">
                <span class="alerta-icono">${alerta.icono}</span>
                <span class="alerta-texto">${alerta.mensaje}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    // Configurar botón de actualizar
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadData);
    }
    
    // Cargar datos iniciales
    loadData();
    
    // 🆕 Añadir fecha actual al header (opcional)
    try {
        const date = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = date.toLocaleDateString('es-ES', options);
        
        const dateElement = document.createElement('div');
        dateElement.className = 'current-date';
        dateElement.innerHTML = `<span>📅</span> ${dateString}`;
        dateElement.style.cssText = `
            font-size: 0.85rem;
            color: #64748b;
            margin-top: 0.25rem;
            opacity: 0.9;
        `;
        
        const headerTitle = document.querySelector('.header-title');
        if (headerTitle) {
            headerTitle.appendChild(dateElement);
        }
    } catch (e) {
        console.log('No se pudo añadir la fecha:', e);
    }
});
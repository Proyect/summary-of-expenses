/**
 * Componente de gráficos y visualizaciones
 * Muestra datos financieros en formato visual usando Chart.js
 */

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

const Charts = ({ summary, transactions, formatCurrency }) => {
  const [chartType, setChartType] = useState('categories');
  const [timeRange, setTimeRange] = useState('all');

  // Colores para los gráficos
  const colors = {
    income: '#4CAF50',
    expense: '#f44336',
    balance: '#2196F3',
    categories: [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ]
  };

  // Datos para gráfico de categorías (gastos)
  const expenseCategoriesData = {
    labels: summary.expensesByCategory.map(item => item.category),
    datasets: [{
      label: 'Gastos por Categoría',
      data: summary.expensesByCategory.map(item => item.total),
      backgroundColor: colors.categories.slice(0, summary.expensesByCategory.length),
      borderColor: colors.categories.slice(0, summary.expensesByCategory.length),
      borderWidth: 1
    }]
  };

  // Datos para gráfico de categorías (ingresos)
  const incomeCategoriesData = {
    labels: summary.incomeByCategory.map(item => item.category),
    datasets: [{
      label: 'Ingresos por Categoría',
      data: summary.incomeByCategory.map(item => item.total),
      backgroundColor: colors.categories.slice(0, summary.incomeByCategory.length),
      borderColor: colors.categories.slice(0, summary.incomeByCategory.length),
      borderWidth: 1
    }]
  };

  // Datos para gráfico comparativo
  const comparisonData = {
    labels: ['Ingresos', 'Gastos'],
    datasets: [{
      label: 'Comparación Financiera',
      data: [summary.totalIncome, summary.totalExpenses],
      backgroundColor: [colors.income, colors.expense],
      borderColor: [colors.income, colors.expense],
      borderWidth: 1
    }]
  };

  // Procesar datos mensuales
  const getMonthlyData = () => {
    const monthlyStats = {};
    const currentYear = new Date().getFullYear();
    
    // Inicializar todos los meses
    for (let i = 1; i <= 12; i++) {
      const monthKey = `${currentYear}-${i.toString().padStart(2, '0')}`;
      monthlyStats[monthKey] = { income: 0, expense: 0 };
    }

    // Procesar transacciones
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      if (date.getFullYear() === currentYear) {
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey][transaction.type] += transaction.amount;
        }
      }
    });

    const months = Object.keys(monthlyStats).sort();
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    return {
      labels: months.map((_, index) => monthNames[index]),
      datasets: [
        {
          label: 'Ingresos',
          data: months.map(month => monthlyStats[month].income),
          backgroundColor: colors.income,
          borderColor: colors.income,
          tension: 0.1
        },
        {
          label: 'Gastos',
          data: months.map(month => monthlyStats[month].expense),
          backgroundColor: colors.expense,
          borderColor: colors.expense,
          tension: 0.1
        }
      ]
    };
  };

  const monthlyData = getMonthlyData();

  // Opciones comunes para los gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y || context.parsed)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
          }
        }
      }
    }
  };

  const renderChart = () => {
    switch (chartType) {
      case 'expense-categories':
        return summary.expensesByCategory.length > 0 ? (
          <Pie data={expenseCategoriesData} options={pieOptions} />
        ) : (
          <div className="empty-chart">No hay datos de gastos por categoría</div>
        );
      
      case 'income-categories':
        return summary.incomeByCategory.length > 0 ? (
          <Pie data={incomeCategoriesData} options={pieOptions} />
        ) : (
          <div className="empty-chart">No hay datos de ingresos por categoría</div>
        );
      
      case 'comparison':
        return (summary.totalIncome > 0 || summary.totalExpenses > 0) ? (
          <Bar data={comparisonData} options={chartOptions} />
        ) : (
          <div className="empty-chart">No hay datos para comparar</div>
        );
      
      case 'monthly':
        return transactions.length > 0 ? (
          <Line data={monthlyData} options={chartOptions} />
        ) : (
          <div className="empty-chart">No hay datos mensuales</div>
        );
      
      default:
        return summary.expensesByCategory.length > 0 ? (
          <Bar 
            data={{
              ...expenseCategoriesData,
              datasets: [{
                ...expenseCategoriesData.datasets[0],
                backgroundColor: colors.expense,
                borderColor: colors.expense
              }]
            }} 
            options={chartOptions} 
          />
        ) : (
          <div className="empty-chart">No hay datos de categorías</div>
        );
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Análisis Visual</h2>
        
        {/* Selector de tipo de gráfico */}
        <div className="chart-controls">
          <div className="form-group">
            <label htmlFor="chartType">Tipo de Gráfico</label>
            <select
              id="chartType"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="form-control"
            >
              <option value="categories">Gastos por Categoría (Barras)</option>
              <option value="expense-categories">Gastos por Categoría (Circular)</option>
              <option value="income-categories">Ingresos por Categoría (Circular)</option>
              <option value="comparison">Comparación Ingresos vs Gastos</option>
              <option value="monthly">Evolución Mensual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contenedor del gráfico */}
      <div className="chart-container">
        <div style={{ height: '400px', width: '100%' }}>
          {renderChart()}
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="card">
        <h3>Estadísticas Detalladas</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Gasto Promedio por Transacción</div>
            <div className="stat-value">
              {summary.expensesByCategory.length > 0 
                ? formatCurrency(summary.totalExpenses / transactions.filter(t => t.type === 'expense').length)
                : formatCurrency(0)
              }
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">Ingreso Promedio por Transacción</div>
            <div className="stat-value">
              {summary.incomeByCategory.length > 0 
                ? formatCurrency(summary.totalIncome / transactions.filter(t => t.type === 'income').length)
                : formatCurrency(0)
              }
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">Categoría de Mayor Gasto</div>
            <div className="stat-value">
              {summary.expensesByCategory.length > 0 
                ? summary.expensesByCategory[0].category
                : 'N/A'
              }
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">Categoría de Mayor Ingreso</div>
            <div className="stat-value">
              {summary.incomeByCategory.length > 0 
                ? summary.incomeByCategory[0].category
                : 'N/A'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Recomendaciones */}
      {(summary.totalIncome > 0 || summary.totalExpenses > 0) && (
        <div className="card">
          <h3>Recomendaciones</h3>
          <div className="recommendations">
            {summary.balance < 0 && (
              <div className="recommendation warning">
                <strong>⚠️ Déficit Detectado:</strong> Tus gastos superan tus ingresos. 
                Considera revisar las categorías de mayor gasto y buscar formas de reducir costos.
              </div>
            )}
            
            {summary.balance > 0 && summary.balance / summary.totalIncome < 0.1 && (
              <div className="recommendation info">
                <strong>💡 Bajo Ahorro:</strong> Tu tasa de ahorro es menor al 10%. 
                Intenta aumentar tus ingresos o reducir gastos no esenciales.
              </div>
            )}
            
            {summary.balance > 0 && summary.balance / summary.totalIncome >= 0.2 && (
              <div className="recommendation success">
                <strong>🎉 ¡Excelente!</strong> Tienes una tasa de ahorro superior al 20%. 
                Considera invertir parte de tus ahorros para hacer crecer tu patrimonio.
              </div>
            )}
            
            {summary.expensesByCategory.length > 0 && summary.expensesByCategory[0].total / summary.totalExpenses > 0.5 && (
              <div className="recommendation warning">
                <strong>📊 Concentración de Gastos:</strong> Más del 50% de tus gastos están en una sola categoría ({summary.expensesByCategory[0].category}). 
                Considera diversificar o revisar si es posible optimizar estos gastos.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Charts;

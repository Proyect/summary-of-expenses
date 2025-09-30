/**
 * Componente de resumen financiero
 * Muestra estadísticas generales y tarjetas de resumen
 */

import React, { useState } from 'react';

const Summary = ({ summary, formatCurrency, onRefresh }) => {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(false);

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh(dateRange.startDate && dateRange.endDate ? dateRange : {});
    } finally {
      setLoading(false);
    }
  };

  const clearDateRange = () => {
    setDateRange({ startDate: '', endDate: '' });
    onRefresh({});
  };

  // Calcular porcentajes para las categorías
  const getPercentage = (amount, total) => {
    if (total === 0) return 0;
    return ((amount / total) * 100).toFixed(1);
  };

  return (
    <div>
      {/* Filtros de fecha */}
      <div className="card">
        <h3>Filtros de Período</h3>
        <div className="filters">
          <div className="form-group">
            <label htmlFor="startDate">Desde</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateRangeChange}
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">Hasta</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateRangeChange}
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <button
              onClick={handleRefresh}
              className="btn btn-primary"
              disabled={loading || !dateRange.startDate || !dateRange.endDate}
            >
              {loading ? 'Actualizando...' : 'Aplicar Filtro'}
            </button>
          </div>
          
          <div className="form-group">
            <button
              onClick={clearDateRange}
              className="btn btn-secondary"
            >
              Ver Todo
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="summary-grid">
        <div className="summary-card income">
          <h3>Total Ingresos</h3>
          <div className="amount">{formatCurrency(summary.totalIncome)}</div>
          <div className="subtitle">
            {summary.incomeByCategory.length} categorías
          </div>
        </div>

        <div className="summary-card expense">
          <h3>Total Gastos</h3>
          <div className="amount">{formatCurrency(summary.totalExpenses)}</div>
          <div className="subtitle">
            {summary.expensesByCategory.length} categorías
          </div>
        </div>

        <div className="summary-card balance">
          <h3>Balance</h3>
          <div className={`amount ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(summary.balance)}
          </div>
          <div className="subtitle">
            {summary.balance >= 0 ? 'Superávit' : 'Déficit'}
          </div>
        </div>

        <div className="summary-card">
          <h3>Tasa de Ahorro</h3>
          <div className="amount">
            {summary.totalIncome > 0 
              ? `${((summary.balance / summary.totalIncome) * 100).toFixed(1)}%`
              : '0%'
            }
          </div>
          <div className="subtitle">
            Del total de ingresos
          </div>
        </div>
      </div>

      {/* Gastos por categoría */}
      {summary.expensesByCategory.length > 0 && (
        <div className="card">
          <h3>Gastos por Categoría</h3>
          <div className="category-breakdown">
            {summary.expensesByCategory.map((item, index) => (
              <div key={index} className="category-item">
                <div className="category-info">
                  <div className="category-name">{item.category}</div>
                  <div className="category-amount">{formatCurrency(item.total)}</div>
                </div>
                <div className="category-bar">
                  <div 
                    className="category-bar-fill expense"
                    style={{ 
                      width: `${getPercentage(item.total, summary.totalExpenses)}%` 
                    }}
                  ></div>
                </div>
                <div className="category-percentage">
                  {getPercentage(item.total, summary.totalExpenses)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingresos por categoría */}
      {summary.incomeByCategory.length > 0 && (
        <div className="card">
          <h3>Ingresos por Categoría</h3>
          <div className="category-breakdown">
            {summary.incomeByCategory.map((item, index) => (
              <div key={index} className="category-item">
                <div className="category-info">
                  <div className="category-name">{item.category}</div>
                  <div className="category-amount">{formatCurrency(item.total)}</div>
                </div>
                <div className="category-bar">
                  <div 
                    className="category-bar-fill income"
                    style={{ 
                      width: `${getPercentage(item.total, summary.totalIncome)}%` 
                    }}
                  ></div>
                </div>
                <div className="category-percentage">
                  {getPercentage(item.total, summary.totalIncome)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {summary.totalIncome === 0 && summary.totalExpenses === 0 && (
        <div className="empty-state">
          <h3>No hay datos financieros</h3>
          <p>Comienza agregando tus primeras transacciones para ver el resumen.</p>
        </div>
      )}
    </div>
  );
};

export default Summary;

/**
 * Componente para mostrar y gestionar la lista de transacciones
 * Incluye filtros, paginación y acciones CRUD
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TransactionForm from './TransactionForm';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

const TransactionList = ({ 
  transactions: initialTransactions, 
  categories, 
  onTransactionUpdated, 
  onTransactionDeleted, 
  formatCurrency 
}) => {
  const [transactions, setTransactions] = useState(initialTransactions || []);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Actualizar transacciones cuando cambien las props
  useEffect(() => {
    setTransactions(initialTransactions || []);
  }, [initialTransactions]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...transactions];

    // Filtro por tipo
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Filtro por categoría
    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    // Filtro por rango de fechas
    if (filters.startDate) {
      filtered = filtered.filter(t => t.date >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(t => t.date <= filters.endDate);
    }

    // Filtro por búsqueda de texto
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower)
      );
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Resetear a la primera página cuando se filtren
  }, [transactions, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      category: '',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
  };

  const handleEditComplete = (updatedTransaction) => {
    if (updatedTransaction) {
      // Actualizar la transacción en la lista local
      setTransactions(prev => 
        prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
      );
      onTransactionUpdated();
    }
    setEditingTransaction(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.delete(`${API_BASE_URL}/api/transactions/${id}`);
      
      // Actualizar la lista local
      setTransactions(prev => prev.filter(t => t.id !== id));
      onTransactionDeleted(id);
    } catch (error) {
      console.error('Error eliminando transacción:', error);
      setError('Error al eliminar la transacción. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Paginación
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Si está editando, mostrar el formulario
  if (editingTransaction) {
    return (
      <TransactionForm
        categories={categories}
        editTransaction={editingTransaction}
        onEditComplete={handleEditComplete}
        formatCurrency={formatCurrency}
      />
    );
  }

  return (
    <div>
      <div className="card">
        <h2>Historial de Transacciones</h2>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {/* Filtros */}
        <div className="filters">
          <div className="form-group">
            <label htmlFor="search">Buscar</label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Buscar por descripción o categoría..."
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Tipo</label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="form-control"
            >
              <option value="">Todos</option>
              <option value="income">Ingresos</option>
              <option value="expense">Gastos</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="category">Categoría</label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="form-control"
            >
              <option value="">Todas</option>
              {categories
                .filter(cat => !filters.type || cat.type === filters.type)
                .map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="startDate">Desde</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">Hasta</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <button
              type="button"
              onClick={clearFilters}
              className="btn btn-secondary"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Estadísticas de filtros */}
        <div className="filter-stats">
          <p>
            Mostrando {filteredTransactions.length} de {transactions.length} transacciones
            {filters.type && ` • Tipo: ${filters.type === 'income' ? 'Ingresos' : 'Gastos'}`}
            {filters.category && ` • Categoría: ${filters.category}`}
            {filters.search && ` • Búsqueda: "${filters.search}"`}
          </p>
        </div>
      </div>

      {/* Lista de transacciones */}
      {currentTransactions.length === 0 ? (
        <div className="empty-state">
          <h3>No hay transacciones</h3>
          <p>
            {filteredTransactions.length === 0 && transactions.length > 0
              ? 'No se encontraron transacciones con los filtros aplicados.'
              : 'Aún no has registrado ninguna transacción.'}
          </p>
        </div>
      ) : (
        <div className="transaction-list">
          {currentTransactions.map(transaction => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-info">
                <div className="transaction-description">
                  {transaction.description}
                </div>
                <div className="transaction-details">
                  <span className="transaction-category">
                    {categories.find(c => c.name === transaction.category)?.icon || '📁'} {transaction.category}
                  </span>
                  <span className="transaction-date">
                    {formatDate(transaction.date)}
                  </span>
                </div>
              </div>
              
              <div className="transaction-amount-container">
                <div className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </div>
                
                <div className="transaction-actions">
                  <button
                    onClick={() => handleEdit(transaction)}
                    className="btn btn-sm btn-secondary"
                    disabled={loading}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="btn btn-sm btn-danger"
                    disabled={loading}
                  >
                    {loading ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn btn-secondary"
          >
            Anterior
          </button>
          
          <span className="pagination-info">
            Página {currentPage} de {totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn btn-secondary"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;

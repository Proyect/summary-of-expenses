import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Summary from './components/Summary';
import Charts from './components/Charts';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001');

function App() {
  const [activeTab, setActiveTab] = useState('summary');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    expensesByCategory: [],
    incomeByCategory: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summaryFilters, setSummaryFilters] = useState({});

  useEffect(() => {
    loadData(summaryFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async (filters = {}) => {
    try {
      setLoading(true);
      // Guardar filtros para reutilizarlos después de operaciones CRUD
      setSummaryFilters(filters);

      const [transactionsRes, categoriesRes, summaryRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/transactions`),
        axios.get(`${API_BASE_URL}/api/categories`),
        axios.get(`${API_BASE_URL}/api/summary`, { params: filters })
      ]);

      setTransactions(transactionsRes.data);
      setCategories(categoriesRes.data);
      setSummary(summaryRes.data);
      setError('');
    } catch (err) {
      setError('Error al cargar los datos: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAdded = (newTransaction) => {
    setTransactions(prev => [newTransaction, ...prev]);
    loadData(summaryFilters); // Recargar usando los filtros actuales
  };

  const handleTransactionUpdated = () => {
    loadData(summaryFilters); // Recargar con filtros activos
  };

  const handleTransactionDeleted = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    loadData(summaryFilters); // Recargar usando filtros actuales
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <h2>Cargando...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Control de Gastos del Hogar</h1>
        <p>Gestiona tus ingresos y gastos de manera sencilla</p>
      </header>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Resumen
        </button>
        <button
          className={`nav-tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Agregar Transacción
        </button>
        <button
          className={`nav-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Historial
        </button>
        <button
          className={`nav-tab ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          Gráficos
        </button>
      </nav>

      <main>
        {activeTab === 'summary' && (
          <Summary 
            summary={summary} 
            formatCurrency={formatCurrency}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'add' && (
          <TransactionForm
            categories={categories}
            onTransactionAdded={handleTransactionAdded}
            formatCurrency={formatCurrency}
          />
        )}

        {activeTab === 'list' && (
          <TransactionList
            transactions={transactions}
            categories={categories}
            onTransactionUpdated={handleTransactionUpdated}
            onTransactionDeleted={handleTransactionDeleted}
            formatCurrency={formatCurrency}
          />
        )}

        {activeTab === 'charts' && (
          <Charts
            summary={summary}
            transactions={transactions}
            formatCurrency={formatCurrency}
          />
        )}
      </main>
    </div>
  );
}

export default App;

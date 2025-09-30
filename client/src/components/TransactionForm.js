/**
 * Componente de formulario para crear y editar transacciones
 * Incluye validación en tiempo real y manejo de errores
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001');

const TransactionForm = ({ categories, onTransactionAdded, formatCurrency, editTransaction, onEditComplete }) => {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Cargar datos para edición
  useEffect(() => {
    if (editTransaction) {
      setFormData({
        type: editTransaction.type,
        amount: editTransaction.amount.toString(),
        description: editTransaction.description,
        category: editTransaction.category,
        date: editTransaction.date
      });
    }
  }, [editTransaction]);

  // Limpiar mensajes después de un tiempo
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = 'El tipo es requerido';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    } else if (formData.description.length > 255) {
      newErrors.description = 'La descripción no puede exceder 255 caracteres';
    }

    if (!formData.category) {
      newErrors.category = 'La categoría es requerida';
    }

    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Si cambia el tipo, limpiar la categoría
    if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        category: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      let response;
      if (editTransaction) {
        response = await axios.put(`${API_BASE_URL}/api/transactions/${editTransaction.id}`, transactionData);
        setSuccess('Transacción actualizada correctamente');
        if (onEditComplete) {
          onEditComplete(response.data);
        }
      } else {
        response = await axios.post(`${API_BASE_URL}/api/transactions`, transactionData);
        setSuccess('Transacción creada correctamente');
        onTransactionAdded(response.data);
        
        // Limpiar formulario después de crear
        setFormData({
          type: 'expense',
          amount: '',
          description: '',
          category: '',
          date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error('Error guardando transacción:', error);
      
      if (error.response?.data?.details) {
        // Error de validación del servidor
        setErrors({ general: error.response.data.details });
      } else {
        setErrors({ general: 'Error al guardar la transacción. Intenta de nuevo.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (editTransaction && onEditComplete) {
      onEditComplete(null);
    } else {
      // Limpiar formulario
      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      });
      setErrors({});
      setSuccess('');
    }
  };

  // Filtrar categorías por tipo
  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  return (
    <div className="card">
      <h2>{editTransaction ? 'Editar Transacción' : 'Nueva Transacción'}</h2>
      
      {success && (
        <div className="success">
          {success}
        </div>
      )}

      {errors.general && (
        <div className="error">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="type">Tipo *</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className={`form-control ${errors.type ? 'error' : ''}`}
            disabled={loading}
          >
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </select>
          {errors.type && <div className="error-text">{errors.type}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="amount">Monto *</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            className={`form-control ${errors.amount ? 'error' : ''}`}
            disabled={loading}
          />
          {errors.amount && <div className="error-text">{errors.amount}</div>}
          {formData.amount && !errors.amount && (
            <div className="help-text">
              {formatCurrency(parseFloat(formData.amount) || 0)}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">Descripción *</label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe la transacción..."
            maxLength="255"
            className={`form-control ${errors.description ? 'error' : ''}`}
            disabled={loading}
          />
          {errors.description && <div className="error-text">{errors.description}</div>}
          <div className="help-text">
            {formData.description.length}/255 caracteres
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="category">Categoría *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`form-control ${errors.category ? 'error' : ''}`}
            disabled={loading}
          >
            <option value="">Selecciona una categoría</option>
            {filteredCategories.map(category => (
              <option key={category.id} value={category.name}>
                {category.icon ? `${category.icon} ` : ''}{category.name}
              </option>
            ))}
          </select>
          {errors.category && <div className="error-text">{errors.category}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="date">Fecha *</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={`form-control ${errors.date ? 'error' : ''}`}
            disabled={loading}
          />
          {errors.date && <div className="error-text">{errors.date}</div>}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Guardando...' : (editTransaction ? 'Actualizar' : 'Crear Transacción')}
          </button>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function RuleCategories({ company }) {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '📋',
    color: '#667eea'
  });

  useEffect(() => {
    loadCategories();
  }, [company]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('requirement_categories')
      .select('*')
      .eq('company_id', company.id)
      .order('sort_order');
    
    setCategories(data || []);
  };

  const icons = ['📋', '💰', '🛡️', '🌍', '⚙️', '🔧', '📊', '✅'];

  return (
    <div className="rule-categories">
      <div className="header">
        <h2>📋 Requirement Categories</h2>
        <button onClick={() => setShowForm(true)}>+ New Category</button>
      </div>

      <div className="categories-grid">
        {categories.map(cat => (
          <div key={cat.id} className="category-card" style={{ borderTop: `4px solid ${cat.color}` }}>
            <div className="category-icon">{cat.icon}</div>
            <h3>{cat.name}</h3>
            <p>Rules: 0</p>
            <div className="actions">
              <button>✏️</button>
              <button>📋</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal">
          <h3>Create Category</h3>
          <input
            placeholder="Category name"
            value={newCategory.name}
            onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
          />
          
          <div className="icon-picker">
            {icons.map(icon => (
              <button 
                key={icon}
                className={newCategory.icon === icon ? 'selected' : ''}
                onClick={() => setNewCategory({...newCategory, icon})}
              >
                {icon}
              </button>
            ))}
          </div>

          <input
            type="color"
            value={newCategory.color}
            onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
          />

          <button onClick={async () => {
            await supabase.from('requirement_categories').insert({
              company_id: company.id,
              name: newCategory.name,
              icon: newCategory.icon,
              color: newCategory.color
            });
            setShowForm(false);
            loadCategories();
          }}>Save</button>
        </div>
      )}
    </div>
  );
}
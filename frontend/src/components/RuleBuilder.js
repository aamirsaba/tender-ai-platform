import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function RuleBuilder({ company, onComplete }) {
  const [categories, setCategories] = useState([]);
  const [rule, setRule] = useState({
    category_id: '',
    name: '',
    description: '',
    rule_type: 'text',
    validation: {},
    is_mandatory: true,
    weight: 1
  });

  useEffect(() => {
    loadCategories();
  }, [company]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('requirement_categories')
      .select('*')
      .eq('company_id', company.id);
    setCategories(data || []);
  };

  const validationFields = {
    text: ['min_length', 'max_length', 'pattern'],
    number: ['min', 'max', 'integer'],
    date: ['min_date', 'max_date'],
    file: ['extensions', 'max_size']
  };

  return (
    <div className="rule-builder">
      <h2>⚙️ Build Your Rule</h2>

      <div className="form-group">
        <label>Category</label>
        <select
          value={rule.category_id}
          onChange={(e) => setRule({...rule, category_id: e.target.value})}
        >
          <option value="">Select category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Rule Name</label>
        <input
          value={rule.name}
          onChange={(e) => setRule({...rule, name: e.target.value})}
          placeholder="e.g., ISO 9001 Certification Required"
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={rule.description}
          onChange={(e) => setRule({...rule, description: e.target.value})}
          placeholder="Explain what needs to be checked..."
        />
      </div>

      <div className="form-group">
        <label>Rule Type</label>
        <select
          value={rule.rule_type}
          onChange={(e) => setRule({...rule, rule_type: e.target.value})}
        >
          <option value="text">Text/Description</option>
          <option value="number">Number/Amount</option>
          <option value="date">Date/Deadline</option>
          <option value="boolean">Yes/No</option>
          <option value="file">File/Certificate</option>
        </select>
      </div>

      <div className="validation-section">
        <h4>Validation Rules</h4>
        {validationFields[rule.rule_type]?.map(field => (
          <div key={field} className="form-group">
            <label>{field.replace('_', ' ')}</label>
            <input
              type={rule.rule_type === 'number' ? 'number' : 'text'}
              onChange={(e) => setRule({
                ...rule,
                validation: {
                  ...rule.validation,
                  [field]: e.target.value
                }
              })}
            />
          </div>
        ))}
      </div>

      <div className="options">
        <label>
          <input
            type="checkbox"
            checked={rule.is_mandatory}
            onChange={(e) => setRule({...rule, is_mandatory: e.target.checked})}
          />
          Mandatory (fails if not met)
        </label>

        <div className="form-group">
          <label>Weight (for scoring)</label>
          <input
            type="number"
            min="1"
            max="10"
            value={rule.weight}
            onChange={(e) => setRule({...rule, weight: parseInt(e.target.value)})}
          />
        </div>
      </div>

      <button 
        className="save-btn"
        onClick={async () => {
          await supabase.from('requirement_templates').insert({
            company_id: company.id,
            ...rule
          });
          onComplete();
        }}
      >
        Save Rule
      </button>
    </div>
  );
}
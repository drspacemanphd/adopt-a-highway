import React from 'react';
import Form from 'react-bootstrap/Form';

import { Filter } from './Filter';

import './Legend.css';

type LegendProps = {
  filters: Array<Filter>,
  onChange: (e: {
    filterLabel: string,
    filterName: string,
    optionLabel: string,
    optionValue: any
  }) => any
}

export function Legend(props: LegendProps) {
  const filters = props.filters || [];

  const sections = filters.map((filter: Record<string, any>) => {
    const filterLabel = filter.label;
    const filterName = filter.filterName;
    const mode = filter.selectMode || 'multi';
    const filterOptions = filter.options;

    let section;
    if (mode === 'multi') {
      const inputs = (filterOptions || []).map((option: { label: string, value: string, selected: boolean }) => {
        return (
          <Form.Check
            className='filter-option-checkbox'
            type='checkbox'
            key={`${filterLabel}-${option.label}`}
            label={option.label}
            name={option.label}
            value={option.value}
            checked={option.selected}
            onChange={(e) => props.onChange({
              filterLabel,
              filterName,
              optionLabel: option.label,
              optionValue: option.value,
            })}
          />
        );
      });
      section = (
        <React.Fragment>
          {filterLabel}
          <div className='filter-section-options'>
            {inputs}
          </div>
        </React.Fragment>
      );
    } else {
      const inputs = (filterOptions || []).map((option: { label: string, value: string, selected: boolean }) => {
        return (
          <Form.Check            
            className='filter-option-radio'
            type='radio'
            key={`${filterLabel}-${option.label}`}
            label={option.label}
            value={option.value}
            checked={option.selected}
            onChange={(e) => props.onChange({
              filterLabel,
              filterName,
              optionLabel: option.label,
              optionValue: option.value,
            })}
          />
        );
      });
      section = (
        <React.Fragment>
          {filterLabel}
          <div className='filter-section-options'>
            {inputs}
          </div>
        </React.Fragment>
      );
    }

    return (
      <div className='filter-section' key={filterLabel}>
        {section}
      </div>
    );
  });

  return (
    <div className='ada-map-legend'>
      {sections}
    </div>
  );
}


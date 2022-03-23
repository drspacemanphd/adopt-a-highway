import { CheckboxField, Radio } from '@aws-amplify/ui-react';
import React from 'react';

import './Legend.css';

export type LegendFilter = {
  label: string,
  filterName: string,
  selectMode: 'single' | 'multi',
  options: Array<{
    label: string,
    value: any,
    selected: boolean,
  }>
}

type LegendProps = {
  open: boolean,
  filters: Array<LegendFilter>,
  onChange: (e: {
    filterLabel: string,
    filterName: string,
    optionLabel: string,
    optionValue: any
  }) => any
}

export default function Legend(props: LegendProps) {
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
          <CheckboxField
            className='filter-option-checkbox'
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
          <Radio
            className='filter-option-radio'
            value={option.value}
            checked={option.selected}
            onChange={(e) => props.onChange({
              filterLabel,
              filterName,
              optionLabel: option.label,
              optionValue: option.value,
            })}
          >
            {option.label}
          </Radio>
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
      <div className='filter-section'>
        {section}
      </div>
    );
  });

  return (
    <div className='ada-map-legend'>
      {props.open ? props.filters || [] : sections}
    </div>
  );
}


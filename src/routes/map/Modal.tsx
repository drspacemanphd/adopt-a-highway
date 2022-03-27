import React from 'react';
import { CheckboxField, Icon, Radio } from '@aws-amplify/ui-react';

import { Filter } from './Filter';

import './Modal.css';

type ModalProps = {
  open: boolean,
  onClose: (e?: any) => any,
  filters: Array<Filter>,
  onChange: (e: {
    filterLabel: string,
    filterName: string,
    optionLabel: string,
    optionValue: any
  }) => any
}

export function Modal(props: ModalProps) {
  if (!props.open) {
    return null;
  }

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
          <Radio
            key={`${filterLabel}-${option.label}`}
            className='filter-option-radio'
            value={option.value}
            checked={option.selected}
            onChange={(_e: any) => props.onChange({
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
      <div className='filter-section' key={filterLabel}>
        {section}
      </div>
    );
  });

  return (
    <div className='ada-map-modal'>
      <div className='ada-map-modal-content'>
        <div className='ada-map-modal-header'>
          <Icon
            ariaLabel='close-filter-modal'
            pathData='M12 2C6.47 2 2 6.47 2 12C2 17.53 6.47 22 12 22C17.53 22 22 17.53 22 12C22 6.47 17.53 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM15.59 7L12 10.59L8.41 7L7 8.41L10.59 12L7 15.59L8.41 17L12 13.41L15.59 17L17 15.59L13.41 12L17 8.41L15.59 7Z'
            viewBox={{ minX: 0, minY: 0, height: 16, width: 16 }}
            onClick={(e: any) => props.onClose(e)}
          />
        </div>
        <div className='ada-map-modal-main'>
          {sections}
        </div>
        <div className='ada-map-modal-footer'></div>
      </div>
    </div>
  );
}
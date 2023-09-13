import React from 'react';
import Form from 'react-bootstrap/Form';
import { GrFormClose } from 'react-icons/gr'; 

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
    <div className='ada-map-modal'>
      <div className='ada-map-modal-content'>
        <div className='ada-map-modal-header'>
          <GrFormClose
            role='button'
            onClick={(e: any) => props.onClose(e)}
            aria-label='close-filter-modal'
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
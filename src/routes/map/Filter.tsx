export type Filter = {
  label: string,
  filterName: string,
  selectMode: 'single' | 'multi',
  options: Array<{
    label: string,
    value: any,
    selected: boolean,
  }>
}
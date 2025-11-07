import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import { ChevronDownIcon } from "lucide-react";

export function SearchDropdown({
  warehouses,
  selectedWarehouse,
  setSelectedWarehouse,
  warehouseQuery,
  setWarehouseQuery,
  itemPage,
  setItemPage,
}: {
  warehouses: any[];
  selectedWarehouse: string;
  setSelectedWarehouse: (w: string) => void;
  warehouseQuery: string;
  setWarehouseQuery: (q: string) => void;
  itemPage: number;
  setItemPage: (p: number) => void;
}) {
  return (
    <Combobox
      value={selectedWarehouse || null}
      onChange={(val: string | null) => {
        if (typeof val === 'string' && val) {
          setSelectedWarehouse(val);
          setWarehouseQuery(val);
          setItemPage(1);
        } else {
          setSelectedWarehouse('');
          setWarehouseQuery('');
        }
      }}
    >
      <div className="relative">
        <ComboboxInput
          className="input-field"
          aria-label="Warehouse"
          placeholder="Type to search locations..."
          displayValue={(val: string | null) => {
            const w = val ? warehouses.find((x: any) => x.name === val) : undefined;
            return w?.name ?? (val ?? '');
          }}
          onChange={(e) => { setWarehouseQuery(e.target.value);}}
        />
        <ComboboxButton className="group absolute inset-y-0 right-0 px-2.5">
          <ChevronDownIcon className="size-4 fill-white/60 group-data-hover:fill-white" />
        </ComboboxButton>
      </div>
      <ComboboxOptions
        anchor="bottom"
        transition
        className="card p-1! w-(--input-width) [--anchor-gap:--spacing(1)] empty:invisible max-h-60 overflow-y-auto
          transition duration-100 ease-in data-leave:data-closed:opacity-0"
      >
        {warehouses?.length ? (
          warehouses.map((w) => (
            <ComboboxOption
              key={w.name}
              value={w.name}
              className="group flex cursor-default items-center gap-2 rounded-md px-3 py-1.5 select-none data-focus:text-primary"
            >
              {w.warehouse_name ?? w.name}
            </ComboboxOption>
          ))
        ) : (
          <ComboboxOption
            value={''}
            className="group cursor-default items-center text-center px-3 py-1.5 select-none"
          >No location found</ComboboxOption>
        )}
      </ComboboxOptions>
    </Combobox>
  )
}
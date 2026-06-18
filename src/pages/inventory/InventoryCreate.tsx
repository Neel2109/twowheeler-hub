import { InventoryForm } from '@/components/InventoryForm';

export default function InventoryCreate() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Add Inventory Item</h2>
        <p className="text-muted-foreground">Add a new spare part to your garage inventory.</p>
      </div>
      <InventoryForm />
    </div>
  );
}

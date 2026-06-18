import { MechanicForm } from '@/components/MechanicForm';

export default function MechanicCreate() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Add Mechanic</h2>
        <p className="text-muted-foreground">Register a new mechanic in your garage.</p>
      </div>
      <MechanicForm />
    </div>
  );
}

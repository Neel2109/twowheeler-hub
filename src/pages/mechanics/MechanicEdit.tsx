import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MechanicForm } from '@/components/MechanicForm';
import { Mechanic } from '@/types/mechanic';
import { getMechanicById } from '@/lib/mechanics';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MechanicEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getMechanicById(id)
        .then(setMechanic)
        .catch(e => {
          toast.error('Failed to load mechanic');
          navigate('/mechanics');
        })
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!mechanic) return <div className="text-center p-12 text-muted-foreground">Mechanic not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Mechanic</h2>
        <p className="text-muted-foreground">Update details for {mechanic.name}.</p>
      </div>
      <MechanicForm initialData={mechanic} />
    </div>
  );
}

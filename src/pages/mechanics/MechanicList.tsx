import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mechanic } from '@/types/mechanic';
import { getMechanics, deleteMechanic } from '@/lib/mechanics';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MechanicList() {
  const navigate = useNavigate();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMechanics = async () => {
    try {
      const data = await getMechanics();
      setMechanics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMechanics();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this mechanic?')) {
      try {
        await deleteMechanic(id);
        toast.success('Mechanic removed');
        loadMechanics();
      } catch (e: any) {
        toast.error(e.message);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mechanics</h2>
          <p className="text-muted-foreground">Manage your garage staff and mechanic assignments.</p>
        </div>
        <Button onClick={() => navigate('/mechanics/create')}>
          <Plus className="w-4 h-4 mr-2" /> Add Mechanic
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><span className="animate-spin text-primary"><Users /></span></div>
      ) : mechanics.length === 0 ? (
        <div className="text-center p-12 bg-muted/30 rounded-xl border border-dashed border-border">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">No mechanics found</h3>
          <p className="text-muted-foreground mt-1">Add your first mechanic to start assigning repair orders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mechanics.map(mechanic => (
            <Card key={mechanic.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1 flex-1">{mechanic.name}</h3>
                    <div className="flex gap-1 ml-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => navigate(`/mechanics/${mechanic.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(mechanic.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {mechanic.role && <p className="text-sm text-muted-foreground mb-2">{mechanic.role}</p>}
                  {mechanic.phone && <p className="text-sm text-foreground font-medium mb-2">{mechanic.phone}</p>}
                </div>
                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <Badge variant={mechanic.active ? "default" : "secondary"}>
                    {mechanic.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

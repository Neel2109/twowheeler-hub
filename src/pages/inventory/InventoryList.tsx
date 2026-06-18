import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryItem } from '@/types/inventory';
import { getInventory, deleteInventoryItem } from '@/lib/inventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function InventoryList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadItems = async () => {
    try {
      const data = await getInventory();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteInventoryItem(id);
        toast.success('Item deleted');
        loadItems();
      } catch (e: any) {
        toast.error(e.message);
      }
    }
  };

  const filteredItems = items.filter(item => 
    item.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.hsnCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground">Manage your spare parts and stock levels.</p>
        </div>
        <Button onClick={() => navigate('/inventory/create')}>
          <Plus className="w-4 h-4 mr-2" /> Add Part
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input 
          className="pl-10 h-12 text-base"
          placeholder="Search parts by name or HSN code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><span className="animate-spin text-primary"><Package /></span></div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center p-12 bg-muted/30 rounded-xl border border-dashed border-border">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">No parts found</h3>
          <p className="text-muted-foreground mt-1">Try a different search or add a new part.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <Card key={item.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1 flex-1">{item.partName}</h3>
                    <div className="flex gap-1 ml-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => navigate(`/inventory/${item.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {item.hsnCode && <p className="text-sm text-muted-foreground mb-2">HSN: {item.hsnCode}</p>}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-primary">₹{item.rate}</span>
                    <span className="text-sm text-muted-foreground">/ unit</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Stock: </span>
                    <span className="font-medium">{item.currentStock}</span>
                  </div>
                  {item.currentStock <= item.minimumStock && (
                    <Badge variant="destructive">Low Stock</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

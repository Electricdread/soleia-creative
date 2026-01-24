import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { artlistCategories } from '@/lib/api/artlist';
import { Trash2, Loader2, Search } from 'lucide-react';

interface Clip {
  id: string;
  title: string;
  category: string;
  resolution: string;
  duration: string;
  created_at: string;
}

export function ClipManager({ onClipsUpdated }: { onClipsUpdated?: () => void }) {
  const { toast } = useToast();
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchClips = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('cached_clips')
        .select('id, title, category, resolution, duration, created_at')
        .order('created_at', { ascending: false });

      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setClips(data || []);
    } catch (error) {
      console.error('Error fetching clips:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clips',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClips();
  }, [selectedCategory, searchQuery]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('cached_clips')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClips(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Clip deleted' });
      onClipsUpdated?.();
    } catch (error) {
      console.error('Error deleting clip:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete clip',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryLabel = (key: string) => {
    return artlistCategories.find(c => c.key === key)?.label || key;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {artlistCategories.map((cat) => (
              <SelectItem key={cat.key} value={cat.key}>
                {cat.icon} {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : clips.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No clips found
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Resolution</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clips.map((clip) => (
                <TableRow key={clip.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {clip.title}
                  </TableCell>
                  <TableCell>{getCategoryLabel(clip.category)}</TableCell>
                  <TableCell>{clip.resolution}</TableCell>
                  <TableCell>{clip.duration}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(clip.id)}
                      disabled={deletingId === clip.id}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      {deletingId === clip.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Showing {clips.length} clips
      </p>
    </div>
  );
}

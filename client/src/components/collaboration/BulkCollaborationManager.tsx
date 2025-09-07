import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Search, X, Share } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  useSearchUsers, 
  useInviteUser 
} from "@/hooks/useCollaboration";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  username: string;
  fullName: string;
}

interface BulkCollaborationManagerProps {
  selectedPortfolios: string[];
  portfolioNames: { [key: string]: string };
  onClose: () => void;
}

export default function BulkCollaborationManager({ 
  selectedPortfolios, 
  portfolioNames, 
  onClose 
}: BulkCollaborationManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>('viewer');
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: searchResults, isLoading: searching } = useSearchUsers(searchQuery, []);
  const inviteUser = useInviteUser();

  const handleInviteUser = async (userId: string) => {
    try {
      // Отправляем приглашения для всех выбранных портфелей
      for (const portfolioId of selectedPortfolios) {
        await inviteUser.mutateAsync({
          portfolioId,
          userId,
          role: selectedRole
        });
      }
      
      toast({
        title: "Приглашения отправлены",
        description: `Пользователю отправлены приглашения для ${selectedPortfolios.length} портфолио`,
      });
      
      setSearchQuery("");
      setIsOpen(false);
      onClose();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить приглашения",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-purple-600 hover:bg-purple-700 text-white"
          data-testid="button-bulk-share"
          disabled={selectedPortfolios.length === 0}
        >
          <Share className="h-4 w-4 mr-2" />
          Предоставить доступ ({selectedPortfolios.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-purple-700">
            <Users className="h-5 w-5 mr-2" />
            Массовое предоставление доступа
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Selected portfolios */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Выбранные портфолио ({selectedPortfolios.length})
            </Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedPortfolios.map((portfolioId) => (
                <div key={portfolioId} className="flex items-center space-x-2 p-2 bg-purple-50 rounded border">
                  <Badge className="bg-purple-100 text-purple-800">
                    Portfolio
                  </Badge>
                  <span className="text-sm font-medium">
                    {portfolioNames[portfolioId] || 'Неизвестное портфолио'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* User search and role selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Пригласить пользователя</Label>
            
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  placeholder="Поиск пользователей..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-bulk-search-users"
                />
              </div>
              <Select value={selectedRole} onValueChange={(value: 'editor' | 'viewer') => setSelectedRole(value)}>
                <SelectTrigger className="w-32" data-testid="select-bulk-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Редактор</SelectItem>
                  <SelectItem value="viewer">Наблюдатель</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search results */}
            {searchQuery.length >= 2 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searching ? (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 justify-center py-4">
                    <Search className="h-4 w-4 animate-spin" />
                    <span>Поиск...</span>
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  searchResults.map((user: User) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded bg-white hover:bg-gray-50">
                      <div>
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-sm text-gray-600">@{user.username}</div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleInviteUser(user.id)}
                        disabled={inviteUser.isPending}
                        data-testid={`button-bulk-invite-${user.id}`}
                      >
                        {inviteUser.isPending ? 'Отправка...' : `Пригласить в ${selectedPortfolios.length} портфолио`}
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-600 text-center py-4">
                    Пользователи не найдены
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
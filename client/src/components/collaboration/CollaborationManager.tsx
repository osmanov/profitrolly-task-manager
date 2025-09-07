import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, UserPlus, Search, Trash2, Settings } from "lucide-react";
import {
  usePortfolioCollaborators,
  useSearchUsers,
  useInviteUser,
  useUpdateCollaboratorRole,
  useRemoveCollaborator
} from "@/hooks/useCollaboration";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CollaborationManagerProps {
  portfolioId: string;
  portfolioName: string;
  isOwner: boolean;
}

interface User {
  id: string;
  username: string;
  fullName: string;
}

interface Collaborator {
  id: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  user: User;
  inviter: User;
  invitedAt: string;
  acceptedAt?: string;
}

const ROLE_LABELS = {
  owner: 'Владелец',
  editor: 'Редактор',
  viewer: 'Наблюдатель'
};

const ROLE_DESCRIPTIONS = {
  owner: 'Полный доступ к портфолио',
  editor: 'Может редактировать портфолио и задачи',
  viewer: 'Только просмотр портфолио'
};

const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-800 border-purple-200',
  editor: 'bg-blue-100 text-blue-800 border-blue-200',
  viewer: 'bg-green-100 text-green-800 border-green-200'
};

export default function CollaborationManager({ portfolioId, portfolioName, isOwner }: CollaborationManagerProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>('viewer');
  const [showInviteForm, setShowInviteForm] = useState(false);

  const { data: collaborators, isLoading: loadingCollaborators } = usePortfolioCollaborators(portfolioId);
  const { data: searchResults, isLoading: searching } = useSearchUsers(
    searchQuery, 
    (collaborators as Collaborator[])?.map(c => c.userId) || []
  );
  
  const inviteUser = useInviteUser();
  const updateRole = useUpdateCollaboratorRole();
  const removeCollaborator = useRemoveCollaborator();

  const handleInviteUser = async (userId: string) => {
    await inviteUser.mutateAsync({
      portfolioId,
      userId,
      role: selectedRole
    });
    setSearchQuery("");
    setShowInviteForm(false);
  };

  const handleRoleChange = async (collaborationId: string, newRole: string) => {
    await updateRole.mutateAsync({
      collaborationId,
      role: newRole
    });
  };

  const handleRemoveCollaborator = async (collaborationId: string) => {
    await removeCollaborator.mutateAsync(collaborationId);
  };

  if (loadingCollaborators) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-t-4 border-t-purple-600 bg-purple-50">
      <CardHeader className="bg-purple-100">
        <CardTitle className="flex items-center text-purple-700 font-bold">
          <Users className="h-5 w-5 mr-2" />
          Совместный доступ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add collaborator section - only for owners */}
        {isOwner && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Пригласить пользователя</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInviteForm(!showInviteForm)}
                data-testid="button-toggle-invite"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                {showInviteForm ? 'Отмена' : 'Пригласить'}
              </Button>
            </div>

            {showInviteForm && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Поиск пользователей..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search-users"
                    />
                  </div>
                  <Select value={selectedRole} onValueChange={(value: 'editor' | 'viewer') => setSelectedRole(value)}>
                    <SelectTrigger className="w-32" data-testid="select-role">
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
                  <div className="space-y-2">
                    {searching ? (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Search className="h-4 w-4 animate-spin" />
                        <span>Поиск...</span>
                      </div>
                    ) : searchResults && searchResults.length > 0 ? (
                      searchResults.map((user: User) => (
                        <div key={user.id} className="flex items-center justify-between p-2 border rounded bg-white">
                          <div>
                            <div className="font-medium">{user.fullName}</div>
                            <div className="text-sm text-gray-600">@{user.username}</div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleInviteUser(user.id)}
                            disabled={inviteUser.isPending}
                            data-testid={`button-invite-${user.id}`}
                          >
                            {inviteUser.isPending ? 'Приглашение...' : 'Пригласить'}
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-600 text-center py-2">
                        Пользователи не найдены
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Current collaborators */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Участники ({(collaborators as Collaborator[])?.length || 0})</Label>
          
          {!(collaborators as Collaborator[]) || (collaborators as Collaborator[]).length === 0 ? (
            <div className="text-center py-6 text-gray-600">
              <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Пока нет других участников</p>
              <p className="text-sm">Пригласите коллег для совместной работы</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(collaborators as Collaborator[]).map((collaborator: Collaborator) => (
                <div key={collaborator.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{collaborator.user.fullName}</span>
                      <Badge className={`text-xs ${ROLE_COLORS[collaborator.role]}`}>
                        {ROLE_LABELS[collaborator.role]}
                      </Badge>
                      {collaborator.status === 'pending' && (
                        <Badge variant="outline" className="text-xs">
                          Ожидает подтверждения
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      @{collaborator.user.username} • {ROLE_DESCRIPTIONS[collaborator.role]}
                    </div>
                    {collaborator.inviter && (
                      <div className="text-xs text-gray-500">
                        Приглашен {collaborator.inviter.fullName}
                      </div>
                    )}
                  </div>

                  {/* Actions for owner */}
                  {isOwner && collaborator.userId !== user?.id && (
                    <div className="flex items-center space-x-2">
                      {collaborator.role !== 'owner' && (
                        <Select
                          value={collaborator.role}
                          onValueChange={(value) => handleRoleChange(collaborator.id, value)}
                          disabled={updateRole.isPending}
                        >
                          <SelectTrigger className="w-32" data-testid={`select-role-${collaborator.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="editor">Редактор</SelectItem>
                            <SelectItem value="viewer">Наблюдатель</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-red-500 text-red-600 hover:bg-red-100"
                            data-testid={`button-remove-${collaborator.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white dark:bg-white border border-gray-200 shadow-xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-gray-900">Удалить участника</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600">
                              Вы уверены, что хотите удалить {collaborator.user.fullName} из совместной работы над "{portfolioName}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200">
                              Отмена
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveCollaborator(collaborator.id)}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}

                  {/* Self-remove option for collaborators */}
                  {!isOwner && collaborator.userId === user?.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-red-500 text-red-600 hover:bg-red-100"
                          data-testid="button-leave-collaboration"
                        >
                          Покинуть
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white dark:bg-white border border-gray-200 shadow-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-gray-900">Покинуть портфолио</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-600">
                            Вы уверены, что хотите покинуть совместную работу над "{portfolioName}"? Вы потеряете доступ к этому портфолио.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200">
                            Отмена
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveCollaborator(collaborator.id)}
                            className="bg-red-600 text-white hover:bg-red-700"
                          >
                            Покинуть
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
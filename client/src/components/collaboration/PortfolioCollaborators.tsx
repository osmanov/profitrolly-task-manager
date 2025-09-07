import { Avatar, AvatarFallback, AvatarInitial } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Crown } from "lucide-react";
import { usePortfolioCollaborators } from "@/hooks/useCollaboration";

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
}

interface PortfolioCollaboratorsProps {
  portfolioId: string;
  maxVisible?: number;
}

const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-800 border-purple-200',
  editor: 'bg-blue-100 text-blue-800 border-blue-200',
  viewer: 'bg-green-100 text-green-800 border-green-200'
};

export default function PortfolioCollaborators({ portfolioId, maxVisible = 3 }: PortfolioCollaboratorsProps) {
  const { data: collaborators, isLoading } = usePortfolioCollaborators(portfolioId);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-1">
        <Users className="h-4 w-4 text-gray-400" />
        <span className="text-xs text-gray-500">Загрузка...</span>
      </div>
    );
  }

  if (!collaborators || collaborators.length === 0) {
    return (
      <div className="flex items-center space-x-1">
        <Users className="h-4 w-4 text-gray-400" />
        <span className="text-xs text-gray-500">Только владелец</span>
      </div>
    );
  }

  const acceptedCollaborators = (collaborators as Collaborator[]).filter(c => c.status === 'accepted');
  const visibleCollaborators = acceptedCollaborators.slice(0, maxVisible);
  const remainingCount = acceptedCollaborators.length - maxVisible;

  return (
    <div className="flex items-center space-x-2" data-testid={`collaborators-${portfolioId}`}>
      <Users className="h-4 w-4 text-gray-500" />
      
      <div className="flex items-center space-x-1">
        {visibleCollaborators.map((collaborator: Collaborator) => (
          <div key={collaborator.id} className="flex items-center space-x-1">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-gray-100">
                {collaborator.user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-700">
                {collaborator.user.fullName.split(' ')[0]}
              </span>
              <Badge className={`text-xs px-1 py-0 ${ROLE_COLORS[collaborator.role]}`}>
                {collaborator.role === 'owner' && <Crown className="h-2 w-2 mr-1" />}
                {collaborator.role === 'owner' ? 'Владелец' : 
                 collaborator.role === 'editor' ? 'Редактор' : 'Наблюдатель'}
              </Badge>
            </div>
          </div>
        ))}
        
        {remainingCount > 0 && (
          <Badge variant="outline" className="text-xs">
            +{remainingCount}
          </Badge>
        )}
      </div>
    </div>
  );
}
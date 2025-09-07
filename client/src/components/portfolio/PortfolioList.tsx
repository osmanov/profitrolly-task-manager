import { useState } from "react";
import { Calendar, Clock, ListTodo, Edit, Trash2, Plus, Users, Crown, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { usePortfolios, useDeletePortfolio } from "@/hooks/usePortfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import BulkCollaborationManager from "@/components/collaboration/BulkCollaborationManager";
import PortfolioCollaborators from "@/components/collaboration/PortfolioCollaborators";
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

export default function PortfolioList() {
  const { portfolios, isLoading } = usePortfolios();
  const deletePortfolio = useDeletePortfolio();
  const { user } = useAuth();
  const [selectedPortfolios, setSelectedPortfolios] = useState<string[]>([]);
  const [showBulkManager, setShowBulkManager] = useState(false);
  
  // Только портфолио, принадлежащие пользователю, могут быть выбраны для общего доступа
  const ownedPortfolios = portfolios?.filter(p => p.userId === user?.id) || [];
  
  const portfolioNames = portfolios?.reduce((acc, p) => {
    acc[p.id] = p.name;
    return acc;
  }, {} as { [key: string]: string }) || {};

  const handleDelete = (id: string) => {
    deletePortfolio.mutate(id);
  };
  
  const handleSelectPortfolio = (portfolioId: string, checked: boolean) => {
    setSelectedPortfolios(prev => 
      checked 
        ? [...prev, portfolioId]
        : prev.filter(id => id !== portfolioId)
    );
  };
  
  const handleSelectAll = () => {
    const allOwnedIds = ownedPortfolios.map(p => p.id);
    setSelectedPortfolios(prev => 
      prev.length === allOwnedIds.length ? [] : allOwnedIds
    );
  };
  
  const clearSelection = () => {
    setSelectedPortfolios([]);
    setShowBulkManager(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" data-testid="text-portfolios-title">Мои Портфолио</h2>
          <Link href="/portfolios/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg" data-testid="button-new-portfolio">
              <Plus className="h-4 w-4 mr-2" />
              Новое Portfolio
            </Button>
          </Link>
        </div>
        
        {/* Bulk actions */}
        {ownedPortfolios.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                data-testid="button-select-all"
              >
                {selectedPortfolios.length === ownedPortfolios.length ? (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Снять выделение
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Выбрать все
                  </>
                )}
              </Button>
              
              {selectedPortfolios.length > 0 && (
                <span className="text-sm text-gray-600">
                  Выбрано: {selectedPortfolios.length} из {ownedPortfolios.length}
                </span>
              )}
            </div>
            
            <BulkCollaborationManager
              selectedPortfolios={selectedPortfolios}
              portfolioNames={portfolioNames}
              onClose={clearSelection}
            />
          </div>
        )}
      </div>

      {!portfolios || portfolios.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">Пока нет портфолио</h3>
              <p className="text-muted-foreground mb-4">Создайте первое портфолио для начала работы</p>
              <Link href="/portfolios/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-create-first-portfolio">
                  <Plus className="h-4 w-4 mr-2" />
                  Создать Portfolio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          {portfolios.map((portfolio) => {
            const isOwner = portfolio.userId === user?.id;
            const isShared = !isOwner; // If not owner, then it's shared with user
            
            return (
              <Card key={portfolio.id} className={`hover:shadow-xl transition-all duration-300 border-l-4 ${isShared ? 'border-l-purple-500 bg-purple-50' : 'border-l-blue-500 bg-blue-50'} h-full relative`} data-testid={`card-portfolio-${portfolio.id}`}>
                {/* Checkbox for owned portfolios */}
                {isOwner && (
                  <div className="absolute top-3 left-3 z-10">
                    <Checkbox
                      checked={selectedPortfolios.includes(portfolio.id)}
                      onCheckedChange={(checked) => handleSelectPortfolio(portfolio.id, checked as boolean)}
                      data-testid={`checkbox-portfolio-${portfolio.id}`}
                      className="bg-white shadow-sm"
                    />
                  </div>
                )}
                
                <CardHeader className={isOwner ? "pl-10" : ""}>
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-base font-bold ${isShared ? 'text-purple-700' : 'text-blue-700'}`} data-testid={`text-portfolio-name-${portfolio.id}`}>
                      {portfolio.name}
                    </CardTitle>
                    <div className="flex items-center space-x-1">
                      {isOwner ? (
                        <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                          <Crown className="h-3 w-3 mr-1" />
                          Владелец
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                          <Users className="h-3 w-3 mr-1" />
                          Совместный
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={isOwner ? "pl-10" : ""}>
                  <div className="text-sm text-muted-foreground space-y-2 mb-4">
                    <p className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Начало: {formatDate(portfolio.startDate)}
                    </p>
                    <p className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Создано: {formatDate(portfolio.createdAt)}
                    </p>
                    
                    {/* Collaborators display */}
                    <div className="pt-2 border-t border-gray-200">
                      <PortfolioCollaborators portfolioId={portfolio.id} maxVisible={2} />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Link href={`/portfolios/${portfolio.id}`}>
                      <Button variant="outline" size="sm" className={isShared ? 'border-purple-500 text-purple-600 hover:bg-purple-100' : 'border-blue-500 text-blue-600 hover:bg-blue-100'} data-testid={`button-edit-${portfolio.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        {isOwner ? 'Редактировать' : 'Открыть'}
                      </Button>
                    </Link>
                    {/* Only show delete button for owners */}
                    {isOwner && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="border-red-500 text-red-600 hover:bg-red-100" data-testid={`button-delete-${portfolio.id}`}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Удалить
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white dark:bg-white border border-gray-200 shadow-xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-gray-900">Удалить Portfolio</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600">
                              Вы уверены, что хотите удалить "{portfolio.name}"? Это действие нельзя будет отменить.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200">Отмена</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(portfolio.id)}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
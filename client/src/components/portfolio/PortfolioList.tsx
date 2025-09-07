import { Calendar, Clock, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolios, useDeletePortfolio } from "@/hooks/usePortfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
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

  const handleDelete = (id: string) => {
    deletePortfolio.mutate(id);
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="text-portfolios-title">Все Портфолио</h2>
        <Link href="/portfolios/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg" data-testid="button-new-portfolio">
            <Plus className="h-4 w-4 mr-2" />
            Новое Portfolio
          </Button>
        </Link>
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
            
            return (
              <Card key={portfolio.id} className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 bg-blue-50 h-full" data-testid={`card-portfolio-${portfolio.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-blue-700" data-testid={`text-portfolio-name-${portfolio.id}`}>
                      {portfolio.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-1 mb-4">
                    <p className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Начало: {formatDate(portfolio.startDate)}
                    </p>
                    <p className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Создано: {formatDate(portfolio.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Link href={`/portfolios/${portfolio.id}`}>
                      <Button variant="outline" size="sm" className="border-blue-500 text-blue-600 hover:bg-blue-100" data-testid={`button-edit-${portfolio.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Редактировать
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
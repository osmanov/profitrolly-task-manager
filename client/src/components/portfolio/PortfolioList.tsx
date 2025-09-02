import { Calendar, Clock, ListTodo, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolios, useDeletePortfolio } from "@/hooks/usePortfolio";
import { Skeleton } from "@/components/ui/skeleton";
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

  const handleDelete = (id: string) => {
    deletePortfolio.mutate(id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
        <h2 className="text-xl font-semibold" data-testid="text-portfolios-title">My Portfolios</h2>
        <Link href="/portfolios/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg" data-testid="button-new-portfolio">
            <Plus className="h-4 w-4 mr-2" />
            New Portfolio
          </Button>
        </Link>
      </div>

      {!portfolios || portfolios.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No portfolios yet</h3>
              <p className="text-muted-foreground mb-4">Create your first portfolio to get started</p>
              <Link href="/portfolios/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-create-first-portfolio">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Portfolio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id} className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white" data-testid={`card-portfolio-${portfolio.id}`}>
              <CardHeader>
                <CardTitle className="text-base text-blue-700 font-bold" data-testid={`text-portfolio-name-${portfolio.id}`}>
                  {portfolio.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1 mb-4">
                  <p className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Start: {formatDate(portfolio.startDate)}
                  </p>
                  <p className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Created: {formatDate(portfolio.createdAt)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Link href={`/portfolios/${portfolio.id}`}>
                    <Button variant="outline" size="sm" className="border-blue-500 text-blue-600 hover:bg-blue-100" data-testid={`button-edit-${portfolio.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid={`button-delete-${portfolio.id}`}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Portfolio</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{portfolio.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(portfolio.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

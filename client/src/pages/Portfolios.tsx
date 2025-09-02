import { useParams } from "wouter";
import PortfolioList from "@/components/portfolio/PortfolioList";
import PortfolioForm from "@/components/portfolio/PortfolioForm";

export default function Portfolios() {
  const params = useParams<{ id?: string }>();
  
  if (params.id === "new") {
    return <PortfolioForm />;
  }
  
  if (params.id) {
    return <PortfolioForm portfolioId={params.id} />;
  }
  
  return <PortfolioList />;
}

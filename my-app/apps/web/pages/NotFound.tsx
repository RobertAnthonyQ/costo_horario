import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          <div className="text-6xl font-bold text-muted-foreground">404</div>
          <h1 className="text-2xl font-bold">Página no encontrada</h1>
          <p className="text-muted-foreground">
            La página que buscas no existe o ha sido movida.
          </p>
          <div className="flex gap-2 justify-center pt-4">
            <Link to="/">
              <Button>
                <Home className="mr-2 h-4 w-4" />
                Ir al inicio
              </Button>
            </Link>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

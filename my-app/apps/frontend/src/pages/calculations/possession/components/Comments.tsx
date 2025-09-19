import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface CommentsProps {
  comments: string;
  onCommentsChange: (value: string) => void;
}

export const Comments = ({ comments, onCommentsChange }: CommentsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            3
          </div>
          Comentarios Adicionales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Agregar comentarios sobre el cálculo, supuestos especiales, etc..."
          value={comments}
          onChange={(e) => onCommentsChange(e.target.value)}
          rows={4}
        />
      </CardContent>
    </Card>
  );
};

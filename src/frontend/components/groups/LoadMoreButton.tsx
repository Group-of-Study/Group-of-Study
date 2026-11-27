
import Button from "@/frontend/components/ui/button";

type LoadMoreButtonProps = {
  loading: boolean;
  onClick: () => void;
};

export default function LoadMoreButton({
  loading,
  onClick,
}: LoadMoreButtonProps) {
  return (
    <div className="flex justify-center py-8">
      <Button
        // ds-*: segue os tokens (e o tema escuro); "secondary" é o da landing.
        variant="ds-secondary"
        size="ds-md"
        onClick={onClick}
        disabled={loading}
      >
        {loading ? "Carregando..." : "Carregar mais grupos"}
      </Button>
    </div>
  );
}

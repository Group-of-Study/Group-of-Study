
import Button from "@/components/ui/button";

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
        variant="secondary"
        size="lg"
        onClick={onClick}
        disabled={loading}
      >
        {loading ? "Carregando..." : "Carregar mais grupos"}
      </Button>
    </div>
  );
}

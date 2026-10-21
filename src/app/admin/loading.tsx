// Aparece na hora em que a Isa troca de aba, enquanto os dados carregam.
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Carregando">
      <div className="h-10 w-48 rounded-xl bg-blush" />
      <div className="h-24 rounded-2xl bg-blush/70" />
      <div className="h-24 rounded-2xl bg-blush/70" />
      <div className="h-24 rounded-2xl bg-blush/50" />
    </div>
  );
}

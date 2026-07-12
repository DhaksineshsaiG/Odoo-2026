type PlaceholderPanelProps = {
  title: string;
};

export function PlaceholderPanel({ title }: PlaceholderPanelProps) {
  return (
    <section className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center shadow-soft">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        Module workspace reserved for upcoming operational workflows.
      </p>
    </section>
  );
}

type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-600">TransitOps</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

import { PageHeader } from '../components/layout/PageHeader';
import { PlaceholderPanel } from '../components/layout/PlaceholderPanel';

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <PlaceholderPanel title={`${title} Module`} />
    </>
  );
}

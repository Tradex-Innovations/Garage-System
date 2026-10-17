import { notFound } from 'next/navigation';
import CustomerWebsite from '../../CustomerWebsite';
import { services } from '../../services';
export function generateStaticParams() { return services.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = services.find(item => item.slug === slug);
  return { title: `${service?.title || 'Service'} | DC Motors Cheltenham` };
}
export default async function ServicePage({ params }) {
  const { slug } = await params;
  if (!services.some(item => item.slug === slug)) notFound();
  return <CustomerWebsite serviceSlug={slug} />;
}

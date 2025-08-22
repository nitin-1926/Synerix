import Head from 'next/head';
import { useRouter } from 'next/router';

interface SeoProps {
	title?: string;
	description?: string;
	canonical?: string;
	image?: string;
}

const defaultMeta = {
	title: 'Synerix - Your Digital Innovation Partner',
	description:
		'Synerix helps businesses transform their digital presence with cutting-edge solutions, expert consulting, and innovative technology services.',
	image: '/images/SynergyLogoCropped.png',
	url: 'https://synerix.in',
};

export default function Seo({
	title = defaultMeta.title,
	description = defaultMeta.description,
	canonical,
	image = defaultMeta.image,
}: SeoProps) {
	const router = useRouter();
	const url = canonical || `${defaultMeta.url}${router.asPath}`;

	return (
		<Head>
			<title>{title}</title>
			<meta name="description" content={description} />
			<meta name="viewport" content="width=device-width, initial-scale=1" />

			{/* Open Graph / Facebook */}
			<meta property="og:type" content="website" />
			<meta property="og:url" content={url} />
			<meta property="og:title" content={title} />
			<meta property="og:description" content={description} />
			<meta property="og:image" content={`${defaultMeta.url}${image}`} />

			{/* Twitter */}
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:url" content={url} />
			<meta name="twitter:title" content={title} />
			<meta name="twitter:description" content={description} />
			<meta name="twitter:image" content={`${defaultMeta.url}${image}`} />

			{/* Canonical */}
			<link rel="canonical" href={url} />

			{/* Favicon */}
			<link rel="icon" href="/images/SynergyLogoCropped.png" />

			{/* Robots */}
			<meta name="robots" content="index,follow" />
			<meta name="googlebot" content="index,follow" />
		</Head>
	);
}

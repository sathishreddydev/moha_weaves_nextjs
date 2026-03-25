import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://mohawea.com/collections',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // Add dynamic category pages
    {
      url: 'https://mohawea.com/collections?categories=saree',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://mohawea.com/collections?categories=salwar-kameez',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://mohawea.com/collections?categories=lehenga',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];
}
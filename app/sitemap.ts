import { MetadataRoute } from 'next'
import { productService } from './api/products/productService'
import { createSlug } from '@/lib/utils/slug'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get base URL from environment
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  // Static pages (always included)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/collections`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/returns-exchange-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  try {
    // Get all products for sitemap
    const products = await productService.getProductsByRole({}, 'user')

    // Product pages
    const productPages: MetadataRoute.Sitemap = products.map((product: any) => {
      const categorySlug = createSlug(product.category?.name || 'ethnic-wear')
      const productSlug = product.urlSlug || createSlug(product.name)
      return {
        url: `${baseUrl}/collections/${categorySlug}/${productSlug}`,
        lastModified: new Date(product.updatedAt || product.createdAt || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.6,
      }
    })

    // Extract unique categories from products for category pages
    const categorySet = new Set<string>()
    products.forEach((product: any) => {
      if (product.category?.name) {
        categorySet.add(product.category.name)
      }
    })

    const categoryPages: MetadataRoute.Sitemap = Array.from(categorySet).map((categoryName) => ({
      url: `${baseUrl}/collections/${createSlug(categoryName)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    }))

    return [...staticPages, ...categoryPages, ...productPages]
  } catch (error) {
    // Return static pages only if dynamic data fails
    return staticPages
  }
}
